import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.AUTH_SECRET ?? "";

export function signUnsubscribeToken(contactId: string): string {
  const sig = createHmac("sha256", SECRET).update(contactId).digest("base64url");
  return `${contactId}.${sig}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx === -1) return null;
  const contactId = token.slice(0, idx);
  const sig = token.slice(idx + 1);

  const expectedSig = createHmac("sha256", SECRET).update(contactId).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  return contactId;
}
