import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar · FixSur" },
      { name: "description", content: "Ingresa o crea tu cuenta para agendar y seguir tus servicios técnicos." },
      { property: "og:title", content: "Ingresar · FixSur" },
      { property: "og:description", content: "Accede a tu cuenta de FixSur." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/mi-hogar" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("Correo o contraseña incorrectos.");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      if (error) toast.error(error.message);
      else toast.success("Revisa tu correo para confirmar la cuenta.");
    }
    setLoading(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("No se pudo ingresar con Google.");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <section className="surface-panel p-6">
        <h1 className="text-xl font-semibold">{mode === "login" ? "Ingresar" : "Crear cuenta"}</h1>
        <Button variant="outline" className="mt-5 w-full" onClick={google}>
          Continuar con Google
        </Button>
        <div className="my-5 text-center text-xs text-muted-foreground">o con tu correo</div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="n">Nombre completo</Label>
              <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required className="mt-2" />
            </div>
          )}
          <div>
            <Label htmlFor="e">Correo</Label>
            <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2" />
          </div>
          <div>
            <Label htmlFor="p">Contraseña</Label>
            <Input id="p" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {mode === "login" ? "Ingresar" : "Crear cuenta"}
          </Button>
        </form>
        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-primary"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "¿No tienes cuenta? Créala aquí" : "¿Ya tienes cuenta? Ingresa"}
        </button>
      </section>
    </main>
  );
}
