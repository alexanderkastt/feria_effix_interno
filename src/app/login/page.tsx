"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

type Estado = "idle" | "enviando" | "error";

const SUPABASE_LISTO =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("TODO");

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensaje, setMensaje] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!SUPABASE_LISTO) {
      setEstado("error");
      setMensaje(
        "Supabase todavía no está conectado. El login funcionará al levantar la base local con Docker.",
      );
      return;
    }
    setEstado("enviando");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/panel");
      router.refresh();
    } catch (err) {
      setEstado("error");
      setMensaje(
        err instanceof Error
          ? "Correo o contraseña incorrectos."
          : "No se pudo iniciar sesión.",
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Ingresar al panel
          </h1>
          <p className="text-sm text-muted">
            Acceso solo para el equipo de Feria Effix. Ingresá con tu correo y
            contraseña.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Correo del equipo
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@feriaeffix.com"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
            />
          </div>

          {estado === "error" && (
            <p className="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={estado === "enviando"}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
          >
            {estado === "enviando" ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        {!SUPABASE_LISTO && (
          <p className="text-xs text-muted">
            Nota: el login se activa al levantar la base local con Docker.
            Mientras tanto, el panel demo está abierto en{" "}
            <Link href="/panel" className="text-brand hover:underline">
              /panel
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
