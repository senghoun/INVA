import * as argon2 from 'argon2';
import * as bcrypt from 'bcryptjs';

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    if (hash.startsWith('$argon2id$')) return await argon2.verify(hash, password);
    if (/^\$2[aby]\$/.test(hash)) return await bcrypt.compare(password, hash);
    return false;
  } catch { return false; }
}
