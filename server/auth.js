const crypto = require('node:crypto');

const COOKIE_NAME = 'admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function getConfiguredCredentials() {
  const email = process.env.ADMIN_EMAIL || '';
  const password = process.env.ADMIN_PASSWORD || '';
  const sessionSecret = process.env.SESSION_SECRET || '';

  return {
    email,
    password,
    sessionSecret,
    configured: Boolean(email && password && sessionSecret),
  };
}

function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function encodeToken(payload, secret) {
  const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPayload(serialized, secret);
  return `${serialized}.${signature}`;
}

function decodeToken(token, secret) {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [payloadPart, signaturePart] = token.split('.');
  const expectedSignature = signPayload(payloadPart, secret);

  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signaturePart);

  if (expectedBuffer.length !== actualBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function issueSession(res, admin) {
  const { sessionSecret } = getConfiguredCredentials();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const token = encodeToken({ email: admin.email, role: 'admin', expiresAt }, sessionSecret);

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: IS_PRODUCTION,
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

function clearSession(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'strict',
    secure: IS_PRODUCTION,
    path: '/',
  });
}

function getSessionFromRequest(req) {
  const { configured, sessionSecret } = getConfiguredCredentials();
  if (!configured) {
    return null;
  }

  const token = req.cookies?.[COOKIE_NAME];
  const payload = decodeToken(token, sessionSecret);
  if (!payload || payload.expiresAt < Date.now() || payload.role !== 'admin') {
    return null;
  }

  return {
    email: payload.email,
    role: 'admin',
  };
}

function requireAdmin(req, res, next) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  req.admin = session;
  next();
}

module.exports = {
  COOKIE_NAME,
  clearSession,
  getConfiguredCredentials,
  getSessionFromRequest,
  issueSession,
  requireAdmin,
};
