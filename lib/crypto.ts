import CryptoJS from 'crypto-js';

// Encrypt the seed with a password
export async function encryptSeed(seed: string, password: string): Promise<string> {
  const ciphertext = CryptoJS.AES.encrypt(seed, password).toString();
  return ciphertext;
}

// Decrypt the seed with a password
export async function decryptSeed(ciphertext: string, password: string): Promise<string> {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Invalid decryption');
    return decrypted;
  } catch (err) {
    throw new Error('Failed to decrypt seed. Password may be incorrect.');
  }
}

// 🔐 General-purpose AES encryption (e.g. for private key)
export async function encrypt(data: string, password: string): Promise<string> {
  const ciphertext = CryptoJS.AES.encrypt(data, password).toString();
  return ciphertext;
}

// 🔓 General-purpose AES decryption (e.g. for private key)
export async function decrypt(ciphertext: string, password: string): Promise<string> {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Invalid decryption');
    return decrypted;
  } catch (err) {
    throw new Error('Failed to decrypt data. Password may be incorrect.');
  }
}
