import { db } from '../config/pgDB.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

const IV = Buffer.from(process.env.IV, 'hex');


export async function generateUniqueBatchId() {
  const MAX_ATTEMPTS = 10;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    try {
      const batchId = crypto.randomInt(100000000, 999999999);
      const result = await db.query(
        'SELECT 1 FROM cards WHERE batch_id = $1',
        [batchId],
        { timeout: 5000 }
      );

      if (result.rows.length === 0) {
        return batchId;
      }
    } catch (error) {
      console.error('Error generating batch ID:', error);
    }
    attempts++;
  }

  throw new Error('Failed to generate unique batch ID after maximum attempts');
}

export async function createAndEncryptCVV() {
  try {
    // Step 1: Generate a random 3-digit CVV using digits 0–9
    const cvv = Array.from({ length: 3 }, () => crypto.randomInt(0, 10)).join('');
    console.log('Generated CVV:', cvv); // Log the plain CVV

    // Step 2: Encrypt the CVV
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let encrypted = cipher.update(cvv, 'utf8', 'hex');
    encrypted += cipher.final('hex')
    console.log('cvv:', encrypted);

    return encrypted;
  } catch (error) {
    console.error('CVV encryption failed:', error);
    throw new Error('CVV encryption failed');
  }
}

export async function createAndEncryptSerialNumber() {
  try {
    // Step 1: Generate a random 16-digit serial number using digits 0–9
    const serialNumber = Array.from({ length: 16 }, () => crypto.randomInt(0, 10)).join('');
    // const serialNumber = BigInt(serial);
    console.log('Generated Serial Number:', serialNumber); 

    // Step 2: Encrypt the serial number
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let encrypted = cipher.update(serialNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex')
    console.log('serial:', encrypted);

    return encrypted;
  } catch (error) {
    console.error('Serial number encryption failed:', error);
    throw new Error('Serial number encryption failed');
  }
}


export async function decryptData(encryptedData) {
  try {
    // Decrypt the encrypted data
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), IV);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    console.log('Decrypted Data:', decrypted);
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed');
  }
}
