import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.AUTH_SECRET ?? "";

export function signState(userId: string): string {
  const payload = JSON.stringify({ uid: userId, ts: Date.now() });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyState(state: string, maxAgeMs = 10 * 60 * 1000): string | null {
  const [encoded, sig] = state.split(".");
  if (!encoded || !sig) return null;

  const expectedSig = createHmac("sha256", SECRET).update(encoded).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const { uid, ts } = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (Date.now() - ts > maxAgeMs) return null;
    return uid as string;
  } catch {
    return null;
  }
}
