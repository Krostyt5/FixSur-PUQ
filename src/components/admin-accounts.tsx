import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore, type Profile } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NONE = "__none__";

export function AdminAccounts() {
  const { technicians, refresh } = useStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .order("email")
      .then(({ data }) => setProfiles((data as Profile[]) ?? []));
  }, []);

  async function link(techId: string, userId: string) {
    const uid = userId === NONE ? null : userId;
    const { error } = await supabase.from("technicians").update({ user_id: uid }).eq("id", techId);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (uid) await supabase.from("user_roles").upsert({ user_id: uid, role: "tecnico" }, { onConflict: "user_id,role" });
    toast.success("Cuenta del técnico actualizada");
    await refresh();
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
      <div className="surface-panel p-5">
        <h2 className="text-base font-semibold">Cuentas de técnicos</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Pide a cada técnico que cree su cuenta y luego asígnala aquí. Así verá solo su hoja de ruta.
        </p>
        <div className="mt-4 space-y-3">
          {technicians.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium">{t.name}</span>
              <Select value={t.userId ?? NONE} onValueChange={(v) => void link(t.id, v)}>
                <SelectTrigger className="w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin cuenta asignada</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || p.email} · {p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
