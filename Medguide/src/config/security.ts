export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET precisa estar configurado com pelo menos 32 caracteres");
  }
  return secret;
}
