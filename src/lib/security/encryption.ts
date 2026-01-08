import crypto from 'crypto';

export interface EncryptedPacket {
  data: string;                    // Base64 encrypted binary
  iv: string;                      // Initialization vector
  tag: string;                     // Authentication tag
  keyId: string;                   // Encryption key identifier
  timestamp: number;                // Encryption timestamp
}

export interface EncryptionKey {
  id: string;
  publicKey: string;                // Base64 encoded
  privateKey: string;               // Encrypted storage
  algorithm: 'AES-256-GCM' | 'RSA-4096';
  created: number;
  expires: number;
  usage: 'ENCRYPT' | 'DECRYPT';
}

export class EncryptionSystem {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 12;
  private tagLength = 16;

  async encrypt(data: string, key: Buffer): Promise<EncryptedPacket> {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag();

    return {
      data: encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      keyId: this.generateKeyId(),
      timestamp: Date.now()
    };
  }

  async decrypt(packet: EncryptedPacket, key: Buffer): Promise<string> {
    const iv = Buffer.from(packet.iv, 'base64');
    const tag = Buffer.from(packet.tag, 'base64');

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(packet.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private generateKeyId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  generateKey(): Buffer {
    return crypto.randomBytes(this.keyLength);
  }

  async generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }
}
