import xss from "xss";

const SKIP_KEYS = new Set([
  "password",
  "aadhaarImage",
  "profilePicture",
  "certificates",
  "image",
  "avatar",
]);

const sanitizeValue = (value, key = "") => {
  if (SKIP_KEYS.has(key)) return value;

  if (typeof value === "string") {
    if (value.startsWith("data:image/")) return value;
    return xss(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    const cleaned = {};
    for (const [k, v] of Object.entries(value)) {
      cleaned[k] = sanitizeValue(v, k);
    }
    return cleaned;
  }

  return value;
};

export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
};