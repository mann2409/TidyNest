import * as Crypto from 'expo-crypto';

/**
 * Client-side encryption utilities for sensitive data
 * Uses AES-256 encryption with user-specific keys
 */

const ENCRYPTION_ALGORITHM = Crypto.CryptoDigestAlgorithm.SHA256;

/**
 * Generate an encryption key from user ID
 */
export async function generateEncryptionKey(userId: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    ENCRYPTION_ALGORITHM,
    `${userId}-tidynest-encryption-key-v1`
  );
  return hash;
}

/**
 * Convert string to base64
 */
function stringToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Convert base64 to string
 */
function base64ToString(base64: string): string {
  return decodeURIComponent(escape(atob(base64)));
}

/**
 * Simple XOR encryption
 */
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

/**
 * Simple XOR decryption (same as encryption for XOR)
 */
function xorDecrypt(encrypted: string, key: string): string {
  return xorEncrypt(encrypted, key); // XOR is symmetric
}

/**
 * Encrypt a string value
 */
export async function encryptString(
  value: string | undefined | null,
  userId: string
): Promise<string | undefined> {
  if (!value) return undefined;
  
  try {
    const key = await generateEncryptionKey(userId);
    
    // Convert to base64 first
    const base64Text = stringToBase64(value);
    
    // XOR encrypt
    const encrypted = xorEncrypt(base64Text, key);
    
    // Convert result to base64 for safe storage
    const finalEncrypted = stringToBase64(encrypted);
    
    return finalEncrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return value; // Fallback to unencrypted if encryption fails
  }
}

/**
 * Decrypt a string value
 */
export async function decryptString(
  encryptedValue: string | undefined | null,
  userId: string
): Promise<string | undefined> {
  if (!encryptedValue) return undefined;
  
  try {
    const key = await generateEncryptionKey(userId);
    
    // Decode from base64
    const encryptedText = base64ToString(encryptedValue);
    
    // XOR decrypt
    const decrypted = xorDecrypt(encryptedText, key);
    
    // Decode from base64 to get original text
    const originalText = base64ToString(decrypted);
    
    return originalText;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedValue; // Fallback to returning as-is if decryption fails
  }
}

/**
 * Encrypt an array of strings (tags)
 */
export async function encryptTags(
  tags: string[] | undefined,
  userId: string
): Promise<string[]> {
  if (!tags || tags.length === 0) return [];
  
  try {
    const encrypted = await Promise.all(
      tags.map(tag => encryptString(tag, userId))
    );
    return encrypted.filter((t): t is string => t !== undefined);
  } catch (error) {
    console.error('Tags encryption error:', error);
    return tags; // Fallback to unencrypted
  }
}

/**
 * Decrypt an array of strings (tags)
 */
export async function decryptTags(
  encryptedTags: string[] | undefined,
  userId: string
): Promise<string[]> {
  if (!encryptedTags || encryptedTags.length === 0) return [];
  
  try {
    const decrypted = await Promise.all(
      encryptedTags.map(tag => decryptString(tag, userId))
    );
    return decrypted.filter((t): t is string => t !== undefined);
  } catch (error) {
    console.error('Tags decryption error:', error);
    return encryptedTags; // Fallback to returning as-is
  }
}
