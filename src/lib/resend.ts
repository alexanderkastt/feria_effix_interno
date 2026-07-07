import "server-only";

// Cliente de bajo nivel de Resend. Solo servidor.
// Degrada con gracia si no está configurado (RESEND_API_KEY ausente).
const API = "https://api.resend.com/emails";

export function resendConfigurado(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM;
}

export interface EnvioResend {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export interface ResultadoResend {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function enviarResend(e: EnvioResend): Promise<ResultadoResend> {
  if (!resendConfigurado()) {
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" };
  }
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [e.to],
        subject: e.subject,
        html: e.html,
        text: e.text,
        headers: e.headers,
      }),
    });
    const data = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message ?? "Error de Resend" };
    return { ok: true, id: data.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de red",
    };
  }
}
