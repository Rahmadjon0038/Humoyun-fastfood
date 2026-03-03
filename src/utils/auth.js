const crypto = require("crypto");

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "fastfood-access-secret";
const ACCESS_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHash, "hex");

  if (derivedKey.length !== originalBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, originalBuffer);
}

function signAccessToken(payload) {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Date.now() + ACCESS_TOKEN_TTL_MS;
  const body = toBase64Url(JSON.stringify({ ...payload, exp, type: "access" }));
  const signature = crypto
    .createHmac("sha256", ACCESS_TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return {
    token: `${header}.${body}.${signature}`,
    expiresAt: new Date(exp).toISOString()
  };
}

function verifyAccessToken(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Token noto'g'ri");
  }

  const [header, payload, signature] = parts;
  const expected = crypto
    .createHmac("sha256", ACCESS_TOKEN_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("Token imzosi xato");
  }

  const parsedPayload = JSON.parse(fromBase64Url(payload));
  if (parsedPayload.type !== "access" || !parsedPayload.exp || parsedPayload.exp < Date.now()) {
    throw new Error("Token muddati tugagan");
  }

  return parsedPayload;
}

function generateRefreshToken() {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

  return {
    token,
    tokenHash: hashToken(token),
    expiresAt
  };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizePhone(phone) {
  return String(phone || "").trim().replace(/\s+/g, "");
}

module.exports = {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  generateRefreshToken,
  hashPassword,
  hashToken,
  normalizePhone,
  signAccessToken,
  verifyAccessToken,
  verifyPassword
};
