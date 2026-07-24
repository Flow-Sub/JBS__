import type { IncomingMessage, ServerResponse } from 'node:http';

const SERVICE_CATEGORIES = new Set([
  'UX/UI Design',
  'Brand Identity',
  'Web Development',
  'App Development',
  'Customer Support',
  'Data Entry & Processing',
  'Back Office Operations',
  'IT Help Desk Support',
  'HR Outsourcing',
  'Other',
]);

const BUDGET_RANGES = new Set([
  'Under $500',
  '$500 - $1,500',
  '$1,500 - $5,000',
  '$5,000 - $10,000',
  '$10,000+',
  "Let's discuss",
]);

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_BODY_SIZE = 12_000;

interface ContactRequest extends IncomingMessage {
  body?: unknown;
}

interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  budget: string;
  category: string;
  description: string;
  company: string;
  startedAt: number;
}

type ValidationResult =
  | { ok: true; data: ContactPayload }
  | { ok: false; message: string };

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = globalThis as typeof globalThis & {
  jbsContactRateLimits?: Map<string, RateLimitEntry>;
};

const rateLimits =
  rateLimitStore.jbsContactRateLimits ??
  (rateLimitStore.jbsContactRateLimits = new Map<string, RateLimitEntry>());

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

async function parseBody(request: ContactRequest): Promise<unknown> {
  if (request.body !== undefined) {
    return request.body;
  }

  let rawBody = '';

  for await (const chunk of request) {
    rawBody += chunk.toString();

    if (rawBody.length > MAX_BODY_SIZE) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
  }

  if (!rawBody) {
    return null;
  }

  return JSON.parse(rawBody);
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function validatePayload(value: unknown): ValidationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, message: 'Please complete the contact form.' };
  }

  const body = value as Record<string, unknown>;
  const data: ContactPayload = {
    name: getString(body.name),
    email: getString(body.email).toLowerCase(),
    phone: getString(body.phone),
    budget: getString(body.budget),
    category: getString(body.category),
    description: getString(body.description),
    company: getString(body.company),
    startedAt:
      typeof body.startedAt === 'number' && Number.isFinite(body.startedAt)
        ? body.startedAt
        : 0,
  };

  if (data.name.length < 2 || data.name.length > 80) {
    return { ok: false, message: 'Please enter a valid name.' };
  }

  if (
    data.email.length > 160 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  ) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }

  if (
    data.phone.length < 7 ||
    data.phone.length > 25 ||
    !/^[+\d\s().-]+$/.test(data.phone)
  ) {
    return { ok: false, message: 'Please enter a valid phone number.' };
  }

  if (!BUDGET_RANGES.has(data.budget)) {
    return { ok: false, message: 'Please select a valid budget.' };
  }

  if (!SERVICE_CATEGORIES.has(data.category)) {
    return { ok: false, message: 'Please select a valid service category.' };
  }

  if (data.description.length < 20 || data.description.length > 2000) {
    return {
      ok: false,
      message: 'Please add a project description of at least 20 characters.',
    };
  }

  return { ok: true, data };
}

function isAllowedOrigin(request: IncomingMessage) {
  const origin = request.headers.origin;

  if (!origin) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const forwardedHost = request.headers['x-forwarded-host'];
    const requestHost =
      (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ??
      request.headers.host;
    const configuredOrigin = process.env.CONTACT_ALLOWED_ORIGIN;

    if (configuredOrigin) {
      return originUrl.origin === new URL(configuredOrigin).origin;
    }

    return Boolean(requestHost && originUrl.host === requestHost);
  } catch {
    return false;
  }
}

function getClientIp(request: IncomingMessage) {
  const forwardedFor = request.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor;

  return (
    forwardedValue?.split(',')[0]?.trim() ??
    request.socket.remoteAddress ??
    'unknown'
  );
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const existing = rateLimits.get(ip);

  if (!existing || existing.resetAt <= now) {
    rateLimits.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  existing.count += 1;
  return existing.count > RATE_LIMIT_MAX_REQUESTS;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildPlainTextEmail(data: ContactPayload) {
  return [
    'New website enquiry',
    '',
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Budget: ${data.budget}`,
    `Service: ${data.category}`,
    '',
    'Project description:',
    data.description,
  ].join('\n');
}

function buildHtmlEmail(data: ContactPayload) {
  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Phone', data.phone],
    ['Budget', data.budget],
    ['Service', data.category],
  ]
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e7e7e7;font-weight:700;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e7e7e7;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('');

  return `
    <div style="background:#f4f5f1;padding:28px;font-family:Arial,sans-serif;color:#16171a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dddddd;">
        <div style="background:#101114;color:#ffffff;padding:22px 24px;">
          <div style="color:#c8ff00;font-size:12px;font-weight:700;text-transform:uppercase;">JBS Globals</div>
          <h1 style="font-size:24px;line-height:1.2;margin:7px 0 0;">New website enquiry</h1>
        </div>
        <table role="presentation" style="border-collapse:collapse;width:100%;font-size:14px;">
          ${rows}
        </table>
        <div style="padding:20px 24px 26px;">
          <h2 style="font-size:15px;margin:0 0 9px;">Project description</h2>
          <p style="font-size:14px;line-height:1.65;margin:0;white-space:pre-wrap;">${escapeHtml(data.description)}</p>
        </div>
      </div>
    </div>`;
}

export default async function handler(
  request: ContactRequest,
  response: ServerResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { message: 'Method not allowed.' });
    return;
  }

  if (!isAllowedOrigin(request)) {
    sendJson(response, 403, { message: 'This request is not allowed.' });
    return;
  }

  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    sendJson(response, 429, {
      message: 'Too many enquiries were sent. Please try again in 15 minutes.',
    });
    return;
  }

  try {
    const validation = validatePayload(await parseBody(request));

    if (!validation.ok) {
      sendJson(response, 400, { message: validation.message });
      return;
    }

    const data = validation.data;

    // Silently accept honeypot submissions so automated senders get no signal.
    if (data.company) {
      sendJson(response, 200, {
        message: 'Thank you. Your project details have been sent successfully.',
      });
      return;
    }

    if (!data.startedAt || Date.now() - data.startedAt < 1500) {
      sendJson(response, 400, {
        message: 'Please review your details and submit the form again.',
      });
      return;
    }

    const gmailUser =
      process.env.GMAIL_USER ?? 'junaidjbsglobals@gmail.com';
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
    const recipient = process.env.CONTACT_TO_EMAIL ?? gmailUser;

    if (!gmailAppPassword) {
      console.error('Contact form email configuration is incomplete.');
      sendJson(response, 503, {
        message:
          'Email delivery is temporarily unavailable. Please contact us directly.',
      });
      return;
    }

    const { default: nodemailer } = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: {
        name: 'JBS Globals Website',
        address: gmailUser,
      },
      to: recipient,
      replyTo: {
        name: data.name,
        address: data.email,
      },
      subject: `Website enquiry: ${data.category} | ${data.budget}`,
      text: buildPlainTextEmail(data),
      html: buildHtmlEmail(data),
    });

    sendJson(response, 200, {
      message:
        'Thank you. Your project details have been sent successfully. We will be in touch soon.',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(response, 413, { message: 'The submitted form is too large.' });
      return;
    }

    console.error('Contact form delivery failed.', error);
    sendJson(response, 500, {
      message:
        'Your message could not be sent. Please email us directly or try again shortly.',
    });
  }
}
