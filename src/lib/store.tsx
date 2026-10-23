import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { todayISO, type CategoryId, type Order, type OrderStatus, type Technician } from "./domain";

export type Role = "admin" | "tecnico" | "cliente";

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
}

interface StoreValue {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  roles: Role[];
  myTechnicianId: string | null;
  orders: Order[];
  busy: Order[];
  technicians: Technician[];
  refresh: () => Promise<void>;
  addOrder: (order: Order) => Promise<boolean>;
  setStatus: (id: string, status: OrderStatus) => Promise<void>;
  setTechnician: (id: string, technicianId: string) => Promise<void>;
  closeOrder: (id: string, report: string) => Promise<void>;
  saveProfile: (p: { full_name: string; phone: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

// Keep a single context instance across hot reloads to avoid provider/consumer mismatch.
const g = globalThis as unknown as { __storeCtx?: React.Context<StoreValue | null> };
const StoreContext = (g.__storeCtx ??= createContext<StoreValue | null>(null));

let techCache: Technician[] = [];

import type { Tables } from "@/integrations/supabase/types";
type OrderRow = Tables<"orders">;

function fromRow(r: OrderRow): Order {
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name,
    phone: r.phone,
    contactPreference: r.contact_preference as Order["contactPreference"],
    category: r.category as CategoryId,
    subServiceId: r.sub_service_id,
    subServiceLabel: r.sub_service_label,
    ...(r.quantity != null ? { quantity: r.quantity } : {}),
    brand: r.brand,
    model: r.model,
    detail: r.detail,
    attachments: (r.attachments as unknown as Order["attachments"]) ?? [],
    modality: r.modality as Order["modality"],
    date: r.date,
    start: r.start,
    ...(r.address ? { address: r.address } : {}),
    technicianId: r.technician_id,
    status: r.status as OrderStatus,
    ...(r.report ? { report: r.report } : {}),
    paymentMethod: r.payment_method as NonNullable<Order["paymentMethod"]>,
    ...(r.total_price != null ? { totalPrice: r.total_price } : {}),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState<Order[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const load = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null);
      setRoles([]);
      setOrders([]);
      setBusy([]);
      setReady(true);
      return;
    }
    const [p, r, t, o, b] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.id),
      supabase.from("technicians").select("*").order("id"),
      supabase.from("orders").select("*").order("date", { ascending: false }).order("start"),
      supabase.rpc("busy_blocks", { _from: todayISO() }),
    ]);
    setProfile((p.data as Profile | null) ?? null);
    setRoles(((r.data ?? []) as { role: Role }[]).map((x) => x.role));
    const techs: Technician[] = (t.data ?? []).map((x) => ({
      id: x.id,
      name: x.name,
      skills: x.skills as CategoryId[],
      avatarInitials: x.avatar_initials,
      userId: x.user_id,
    }));
    techCache = techs;
    setTechnicians(techs);
    setOrders((o.data ?? []).map((x) => fromRow(x)));
    setBusy(
      (b.data ?? []).map(
        (x) =>
          ({ id: x.id, technicianId: x.technician_id, date: x.date, start: x.start, modality: x.modality, status: x.status }) as Order,
      ),
    );
    setReady(true);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      setUser(session?.user ?? null);
      setTimeout(() => void load(session?.user ?? null), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      void load(data.session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const refresh = useCallback(() => load(user), [load, user]);

  const value = useMemo<StoreValue>(() => {
    const myTech = technicians.find((t) => t.userId && t.userId === user?.id);
    async function update(id: string, patch: { status?: string; technician_id?: string; report?: string }) {
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) toast.error(error.message);
      await refresh();
    }
    return {
      ready,
      user,
      profile,
      roles,
      myTechnicianId: myTech?.id ?? null,
      orders,
      busy,
      technicians,
      refresh,
      addOrder: async (o) => {
        if (!user) return false;
        const { error } = await supabase.from("orders").insert({
          id: o.id,
          client_id: user.id,
          client_name: o.clientName,
          phone: o.phone,
          contact_preference: o.contactPreference,
          category: o.category,
          sub_service_id: o.subServiceId,
          sub_service_label: o.subServiceLabel,
          quantity: o.quantity ?? null,
          brand: o.brand,
          model: o.model,
          detail: o.detail,
          attachments: o.attachments as never,
          modality: o.modality,
          date: o.date,
          start: o.start,
          address: o.address ?? null,
          technician_id: o.technicianId,
          status: "confirmada",
          payment_method: o.paymentMethod ?? "transferencia",
          total_price: o.totalPrice ?? null,
        });
        if (error) {
          toast.error(error.message);
          await refresh();
          return false;
        }
        await refresh();
        return true;
      },
      setStatus: (id, status) => update(id, { status }),
      setTechnician: (id, technicianId) => update(id, { technician_id: technicianId }),
      closeOrder: (id, report) => update(id, { status: "finalizada", report }),
      saveProfile: async (p) => {
        if (!user) return;
        await supabase.from("profiles").update(p).eq("id", user.id);
        await refresh();
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [ready, user, profile, roles, orders, busy, technicians, refresh]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}

export function technicianName(id: string) {
  return techCache.find((t) => t.id === id)?.name ?? "Sin asignar";
}
