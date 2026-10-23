create type public.app_role as enum ('admin', 'tecnico', 'cliente');

create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), coalesce(new.email,''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'cliente') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.technicians (
  id text primary key,
  name text not null,
  skills text[] not null default '{}',
  avatar_initials text not null default '',
  user_id uuid unique
);
grant select, insert, update, delete on public.technicians to authenticated;
grant all on public.technicians to service_role;
alter table public.technicians enable row level security;
create policy "techs readable" on public.technicians for select to authenticated using (true);
create policy "admin manage techs" on public.technicians for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.orders (
  id text primary key,
  client_id uuid,
  client_name text not null,
  phone text not null,
  contact_preference text not null check (contact_preference in ('llamada','whatsapp')),
  category text not null,
  sub_service_id text not null,
  sub_service_label text not null,
  quantity int,
  brand text not null,
  model text not null,
  detail text not null,
  attachments jsonb not null default '[]',
  modality text not null check (modality in ('presencial','videollamada')),
  date date not null,
  start text not null,
  address text,
  technician_id text not null references public.technicians(id),
  status text not null default 'confirmada' check (status in ('confirmada','en_camino','en_diagnostico','finalizada')),
  report text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;

create or replace function public.is_order_technician(_tech_id text)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.technicians where id = _tech_id and user_id = auth.uid()) $$;

create policy "read orders" on public.orders for select to authenticated using (
  client_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.is_order_technician(technician_id));
create policy "client creates" on public.orders for insert to authenticated with check (client_id = auth.uid() and status = 'confirmada');
create policy "staff updates" on public.orders for update to authenticated using (
  public.has_role(auth.uid(),'admin') or public.is_order_technician(technician_id));

-- Overlap guard
create or replace function public.block_minutes(_m text) returns int language sql immutable as $$ select case when _m = 'presencial' then 90 else 45 end $$;
create or replace function public.to_min(_t text) returns int language sql immutable as $$ select split_part(_t,':',1)::int*60 + split_part(_t,':',2)::int $$;

create or replace function public.check_order_overlap()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'finalizada' and exists (
    select 1 from public.orders o
    where o.id <> new.id and o.technician_id = new.technician_id and o.date = new.date and o.status <> 'finalizada'
      and public.to_min(new.start) < public.to_min(o.start) + public.block_minutes(o.modality)
      and public.to_min(new.start) + public.block_minutes(new.modality) > public.to_min(o.start)
  ) then
    raise exception 'El técnico ya tiene un servicio en ese horario';
  end if;
  return new;
end $$;
create trigger orders_overlap before insert or update of technician_id, date, start, modality, status on public.orders
for each row execute function public.check_order_overlap();

-- Busy blocks for availability (no personal data)
create or replace function public.busy_blocks(_from date)
returns table (id text, technician_id text, date date, start text, modality text, status text)
language sql stable security definer set search_path = public
as $$ select id, technician_id, date, start, modality, status from public.orders where date >= _from and status <> 'finalizada' $$;
grant execute on function public.busy_blocks(date) to authenticated;

insert into public.technicians (id, name, skills, avatar_initials) values
('t1','Marcos Villalobos','{tv,casa,impresora}','MV'),
('t2','Daniela Soto','{pc,notebook,celular}','DS'),
('t3','Rodrigo Cárcamo','{casa,impresora,notebook}','RC');

insert into public.orders (id, client_name, phone, contact_preference, category, sub_service_id, sub_service_label, quantity, brand, model, detail, attachments, modality, date, start, address, technician_id, status, report) values
('ORD-1041','Camila Reyes','+56 9 8123 4567','whatsapp','casa','casa-asistentes','Configuración de Alexa / Google Home',3,'Amazon','Echo Dot 5','Compré 3 dispositivos y no logro unirlos a la misma cuenta ni controlar las ampolletas por voz.','[{"id":"a1","name":"conexiones-living.jpg","kind":"foto"},{"id":"a2","name":"error-app.jpg","kind":"foto"}]','presencial',current_date,'09:30','Av. Bulnes 455, depto 802, Punta Arenas','t1','confirmada',null),
('ORD-1042','Camila Reyes','+56 9 8123 4567','llamada','tv','tv-box','Instalación y configuración de TV Box Android / FireStick',null,'Xiaomi','Mi TV Box S','El TV Box no reconoce el Wi-Fi de la casa y las apps se quedan cargando.','[]','videollamada',current_date+1,'16:00',null,'t2','confirmada',null),
('ORD-1043','Jorge Maldonado','+56 9 7411 2288','llamada','tv','tv-falla','Revisión técnica por falla',null,'Samsung','UN55AU7000','La pantalla se queda en negro pero se escucha el audio. Ocurre al cabo de 10 minutos.','[{"id":"a3","name":"pantalla-negra.mp4","kind":"video"}]','presencial',current_date,'11:30','Manuel Señoret 1120, Punta Arenas','t1','en_camino',null),
('ORD-1044','Paulina Aguilar','+56 9 6320 7741','whatsapp','impresora','imp-wifi','Falla de conexión Wi-Fi / Red',null,'Epson','L3250','La impresora aparece offline en todos los computadores de la casa.','[{"id":"a4","name":"panel-impresora.jpg","kind":"foto"}]','presencial',current_date,'15:00','Los Flamencos 233, Punta Arenas','t3','confirmada',null),
('ORD-1045','Héctor Pizarro','+56 9 5544 1010','llamada','celular','cel-migracion','Migración de datos a teléfono nuevo',null,'Samsung','Galaxy S24','Necesito pasar fotos, WhatsApp y contactos desde un iPhone antiguo.','[]','videollamada',current_date,'13:00',null,'t2','en_diagnostico',null),
('ORD-1046','Ignacia Bustos','+56 9 9087 3322','whatsapp','pc','pc-formateo','Formateo e instalación de S.O.',null,'HP','Pavilion TP01','El PC parte con pantalla azul y quiero dejarlo con Windows limpio, respaldando fotos.','[{"id":"a5","name":"pantalla-azul.jpg","kind":"foto"}]','presencial',current_date+1,'10:00','Pedro Montt 987, Punta Arenas','t2','confirmada',null);