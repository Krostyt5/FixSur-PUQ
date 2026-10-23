import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useStore, type Role } from "@/lib/store";

export function RequireAuth({ children, role }: { children: ReactNode; role?: Role | Role[] }) {
  const { ready, user, roles } = useStore();
  if (!ready) return <p className="p-10 text-center text-sm text-muted-foreground">Cargando…</p>;
  if (!user)
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Inicia sesión para continuar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Necesitas una cuenta para ver esta sección.</p>
        <Button asChild className="mt-6">
          <Link to="/auth">Ingresar o crear cuenta</Link>
        </Button>
      </main>
    );
  const needed = role ? (Array.isArray(role) ? role : [role]) : [];
  if (needed.length && !needed.some((r) => roles.includes(r)))
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Sin acceso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu cuenta no tiene permiso para esta sección. Pide a la central que te habilite.
        </p>
      </main>
    );
  return <>{children}</>;
}
