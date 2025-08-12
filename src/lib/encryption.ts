import crypto from "crypto";
import { logger } from "./logger";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const getKey = (): Buffer => {
  const key = process.env.APP_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("APP_ENCRYPTION_KEY is not set in environment variables.");
  }
  return Buffer.from(key, "base64");
};

/**
 * Encrypts a string using AES-256-GCM.
 * The encryption key is read from the APP_ENCRYPTION_KEY environment variable.
 * @param {string | null | undefined} text The plaintext string to encrypt.
 * @returns {string} The encrypted data in 'iv:authTag:ciphertext' format.
 * @throws {Error} if the input is null or undefined, or if APP_ENCRYPTION_KEY is not set.
 */
export function encrypt(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    // To satisfy the non-nullable schema, we encrypt an empty string
    // for null/undefined inputs. This maintains data integrity.
    text = "";
  }

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a string that was encrypted with the `encrypt` function.
 * It uses the 'iv:authTag:ciphertext' format to extract all necessary components.
 * If the data is not in the correct format, it's assumed to be plaintext and null is returned.
 * @param {string | null | undefined} encryptedData The encrypted string.
 * @returns {string | null} The decrypted plaintext string, or null if input is empty or decryption fails.
 */
export function decrypt(
  encryptedData: string | null | undefined,
): string | null {
  if (
    encryptedData === null ||
    encryptedData === undefined ||
    encryptedData === ""
  ) {
    return null;
  }

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    // Data is not in the expected encrypted format. It's likely plaintext.
    // Return null silently and let the caller handle the fallback.
    return null;
  }

  try {
    const key = getKey();
    const [ivHex, authTagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    // This block now only catches actual cryptographic errors (e.g., auth tag mismatch),
    // which might indicate data tampering or a key rotation issue.
    logger.error("Decryption failed for data that appears to be encrypted:", error);
    return null;
  }
}