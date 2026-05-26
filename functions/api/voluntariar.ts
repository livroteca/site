interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY?: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
}

interface Body {
  name?: string;
  email?: string;
  type?: string;
  skills?: string;
  message?: string;
  hp?: string;
  token?: string;
  locale?: string;
}

const TYPE_LABELS: Record<string, { pt: string; en: string }> = {
  presencial: { pt: "Presencial no Bode", en: "In person in Bode" },
  remoto: { pt: "Remoto", en: "Remote" },
  ambos: { pt: "Presencial + remoto", en: "Both" },
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  if ((body.hp ?? "").trim() !== "") {
    return json({ ok: true });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const type = (body.type ?? "").trim();
  const skills = (body.skills ?? "").trim();
  const message = (body.message ?? "").trim();
  const locale = body.locale === "en" ? "en" : "pt";

  if (!name || !email || !type || !skills) {
    return json({ ok: false, error: "validation" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "validation" }, 400);
  }
  if (name.length > 200 || email.length > 200 || skills.length > 5000 || message.length > 5000) {
    return json({ ok: false, error: "validation" }, 400);
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const token = body.token ?? "";
    if (!token) {
      return json({ ok: false, error: "turnstile" }, 400);
    }
    const ip = request.headers.get("CF-Connecting-IP") ?? "";
    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET_KEY);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);
    const verify = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );
    const result = (await verify.json()) as { success?: boolean };
    if (!result.success) {
      return json({ ok: false, error: "turnstile" }, 403);
    }
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    return json({ ok: false, error: "misconfigured" }, 500);
  }

  const typeLabel = TYPE_LABELS[type]?.[locale] ?? type;
  const subject =
    locale === "en"
      ? `[Livroteca] New volunteer — ${name}`
      : `[Livroteca] Novo voluntariado — ${name}`;

  const text =
    `Nome: ${name}\n` +
    `Email: ${email}\n` +
    `Tipo: ${typeLabel}\n\n` +
    `Habilidades:\n${skills}\n\n` +
    (message ? `Mensagem:\n${message}\n` : "");

  const html =
    `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; line-height: 1.5;">` +
    `<h2 style="font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.02em;">Novo voluntariado</h2>` +
    `<p><strong>Nome:</strong> ${escapeHtml(name)}</p>` +
    `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>` +
    `<p><strong>Tipo:</strong> ${escapeHtml(typeLabel)}</p>` +
    `<h3>Habilidades</h3>` +
    `<pre style="white-space:pre-wrap; font-family:inherit; margin:0;">${escapeHtml(skills)}</pre>` +
    (message
      ? `<h3>Mensagem</h3><pre style="white-space:pre-wrap; font-family:inherit; margin:0;">${escapeHtml(message)}</pre>`
      : "") +
    `</div>`;

  const resend = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [env.CONTACT_TO_EMAIL],
      reply_to: email,
      subject,
      text,
      html,
    }),
  });

  if (!resend.ok) {
    return json({ ok: false, error: "send_failed" }, 502);
  }

  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
