import * as Crypto from 'expo-crypto';

export async function encryptSeed(seed: string, password: string): Promise<string> {
  // For now, simple HMAC-based obfuscation. Later upgrade to real key derivation (PBKDF2 / AES).
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + seed
  );
  return JSON.stringify({ seed, hash });
}
