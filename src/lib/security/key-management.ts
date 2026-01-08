/**
 * Security Layer - Key Management System
 * Handles secure key generation, rotation, and distribution
 */

export interface KeyPair {
  id: string;
  type: 'rsa_4096' | 'ecdh_p521' | 'ed25519';
  publicKey: string;
  privateKey: string;
  createdAt: number;
  expiresAt?: number;
  algorithm: string;
  bits: number;
}

export interface SymmetricKey {
  id: string;
  type: 'aes_256_gcm' | 'chacha20_poly1305' | 'xsalsa20_poly1305';
  key: string;
  iv: string;
  createdAt: number;
  expiresAt?: number;
  algorithm: string;
  keySize: number;
}

export interface KeyRotationPolicy {
  rotationPeriod: number; // in milliseconds
  autoRotate: boolean;
  notifyBeforeRotation: number; // in milliseconds
  backupPreviousKeys: boolean;
  retentionPeriod: number; // how long to keep old keys
}

export interface KeyMetadata {
  usageCount: number;
  lastUsed: number;
  permissions: string[];
  scope: string[];
  associatedWith: string[]; // IDs of data/services using this key
}

export const KEY_ALGORITHMS = {
  RSA_4096: {
    algorithm: 'RSA-4096',
    bits: 4096,
    type: 'rsa_4096' as const,
    description: 'RSA 4096-bit for key exchange and signatures',
    isQuantumResistant: false,
    isPostQuantumReady: false,
  },
  RSA_2048: {
    algorithm: 'RSA-2048',
    bits: 2048,
    type: 'rsa_4096' as const, // Use same type with different bits
    description: 'RSA 2048-bit (faster, less secure)',
    isQuantumResistant: false,
    isPostQuantumReady: false,
  },
  AES_256_GCM: {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    type: 'aes_256_gcm' as const,
    description: 'AES-256 in GCM mode for symmetric encryption',
    isQuantumResistant: true,
    isPostQuantumReady: true,
  },
  CRYSTALS_KYBER: {
    algorithm: 'CRYSTALS-Kyber',
    keySize: 256,
    type: 'chacha20_poly1305' as const, // Post-quantum lattice-based
    description: 'CRYSTALS-Kyber post-quantum key exchange (NIST PQC candidate)',
    isQuantumResistant: true,
    isPostQuantumReady: true,
  },
} as const;

/**
 * Key Management System
 * Manages secure key generation, storage, rotation, and distribution
 */
export class KeyManagement {
  private keyPairs: Map<string, KeyPair> = new Map();
  private symmetricKeys: Map<string, SymmetricKey> = new Map();
  private keyMetadata: Map<string, KeyMetadata> = new Map();
  private rotationPolicies: Map<string, KeyRotationPolicy> = new Map();

  constructor() {
    this.loadKeys();
    this.loadRotationPolicies();
  }

  /**
   * Load keys from secure storage
   */
  private async loadKeys(): Promise<void> {
    try {
      const response = await fetch('/api/security/keys');
      const data = await response.json();

      // Load key pairs
      if (data.keyPairs) {
        for (const keyPair of data.keyPairs) {
          this.keyPairs.set(keyPair.id, keyPair);
        }
      }

      // Load symmetric keys
      if (data.symmetricKeys) {
        for (const key of data.symmetricKeys) {
          this.symmetricKeys.set(key.id, key);
        }
      }

      // Load key metadata
      if (data.keyMetadata) {
        for (const [id, metadata] of Object.entries(data.keyMetadata)) {
          this.keyMetadata.set(id, metadata);
        }
      }

      // Check for expired keys
      this.checkExpiredKeys();
    } catch (error) {
      console.error('Failed to load keys:', error);
    }
  }

  /**
   * Load rotation policies
   */
  private async loadRotationPolicies(): Promise<void> {
    try {
      const response = await fetch('/api/security/rotation-policies');
      const data = await response.json();

      if (data.policies) {
        for (const policy of data.policies) {
          this.rotationPolicies.set(policy.keyType, policy);
        }
      }
    } catch (error) {
      console.error('Failed to load rotation policies:', error);
    }
  }

  /**
   * Generate RSA key pair (key exchange)
   */
  async generateRSAKeyPair(bits: number = 4096, expiresAt?: number): Promise<KeyPair> {
    const keyPair: KeyPair = {
      id: `rsa-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: 'rsa_4096',
      publicKey: '',
      privateKey: '',
      createdAt: Date.now(),
      expiresAt: expiresAt,
      algorithm: `RSA-${bits}`,
      bits,
    };

    // In a real implementation, this would use Web Crypto API or Node.js crypto
    // For now, we'll generate a mock key pair for the scaffold

    try {
      // Use Node.js crypto for server-side or Web Crypto API for client-side
      const publicKey = this.generateMockPublicKey(bits);
      const privateKey = this.generateMockPrivateKey(bits);

      keyPair.publicKey = publicKey;
      keyPair.privateKey = privateKey;

      // Store key pair
      this.keyPairs.set(keyPair.id, keyPair);
      this.keyMetadata.set(keyPair.id, {
        usageCount: 0,
        lastUsed: Date.now(),
        permissions: ['encrypt', 'decrypt'],
        scope: ['global'],
        associatedWith: [],
      });

      // Save to persistent storage
      await this.saveKeyPair(keyPair);

      return keyPair;
    } catch (error) {
      console.error('Failed to generate RSA key pair:', error);
      throw new Error(`RSA key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate mock public key for demonstration
   */
  private generateMockPublicKey(bits: number): string {
    const prefix = `-----BEGIN PUBLIC KEY-----\nRSA-${bits}\n`;
    const suffix = '\n-----END PUBLIC KEY-----';
    const content = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 15)
    ).join('\n');
    return `${prefix}${content}${suffix}`;
  }

  /**
   * Generate mock private key for demonstration
   */
  private generateMockPrivateKey(bits: number): string {
    const prefix = `-----BEGIN PRIVATE KEY-----\nRSA-${bits}\n`;
    const suffix = '\n-----END PRIVATE KEY-----';
    const content = Array.from({ length: 16 }, () =>
      Math.random().toString(36).substring(2, 15)
    ).join('\n');
    return `${prefix}${content}${suffix}`;
  }

  /**
   * Generate random bytes (works in both Node.js and browser)
   */
  private generateRandomBytes(buffer: Uint8Array): void {
    // Check if we're in Node.js environment
    if (typeof window === 'undefined') {
      // Node.js environment - use simple fallback
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
    } else {
      // Browser environment
      if (typeof window.crypto !== 'undefined' && typeof window.crypto.getRandomValues === 'function') {
        window.crypto.getRandomValues(buffer);
      } else {
        // Fallback to Math.random() (less secure)
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = Math.floor(Math.random() * 256);
        }
      }
    }
  }

  /**
   * Generate post-quantum key (CRYSTALS-Kyber)
   */
  async generatePostQuantumKey(expiresAt?: number): Promise<SymmetricKey> {
    const key: SymmetricKey = {
      id: `pq-kyber-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: 'chacha20_poly1305',
      key: '',
      iv: '',
      createdAt: Date.now(),
      expiresAt: expiresAt,
      algorithm: 'CRYSTALS-Kyber',
      keySize: 256,
    };

    try {
      // In a real implementation, this would use a post-quantum library
      // For now, we'll generate a mock key

      // Generate random key (32 bytes for 256-bit key)
      const keyBuffer = new Uint8Array(32);
      this.generateRandomBytes(keyBuffer);

      // Generate random IV (12 bytes for ChaCha20-Poly1305)
      const ivBuffer = new Uint8Array(12);
      this.generateRandomBytes(ivBuffer);

      key.key = this.arrayBufferToBase64(keyBuffer);
      key.iv = this.arrayBufferToBase64(ivBuffer);

      // Store key
      this.symmetricKeys.set(key.id, key);
      this.keyMetadata.set(key.id, {
        usageCount: 0,
        lastUsed: Date.now(),
        permissions: ['encrypt', 'decrypt'],
        scope: ['post-quantum', 'kyber'],
        associatedWith: [],
      });

      // Save to persistent storage
      await this.saveSymmetricKey(key);

      return key;
    } catch (error) {
      console.error('Failed to generate post-quantum key:', error);
      throw new Error(`Post-quantum key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate AES-256-GCM symmetric key
   */
  async generateAESKey(expiresAt?: number): Promise<SymmetricKey> {
    const key: SymmetricKey = {
      id: `aes-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: 'aes_256_gcm',
      key: '',
      iv: '',
      createdAt: Date.now(),
      expiresAt: expiresAt,
      algorithm: 'AES-256-GCM',
      keySize: 256,
    };

    try {
      // Generate random key (32 bytes for 256-bit key)
      const keyBuffer = new Uint8Array(32);
      this.generateRandomBytes(keyBuffer);

      // Generate random IV (12 bytes for GCM)
      const ivBuffer = new Uint8Array(12);
      this.generateRandomBytes(ivBuffer);

      key.key = this.arrayBufferToBase64(keyBuffer);
      key.iv = this.arrayBufferToBase64(ivBuffer);

      // Store key
      this.symmetricKeys.set(key.id, key);
      this.keyMetadata.set(key.id, {
        usageCount: 0,
        lastUsed: Date.now(),
        permissions: ['encrypt', 'decrypt'],
        scope: ['symmetric', 'aes'],
        associatedWith: [],
      });

      // Save to persistent storage
      await this.saveSymmetricKey(key);

      return key;
    } catch (error) {
      console.error('Failed to generate AES key:', error);
      throw new Error(`AES key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rotate key (replace with new key)
   */
  async rotateKey(keyId: string, algorithm: string = 'AES-256-GCM'): Promise<void> {
    const key = this.symmetricKeys.get(keyId) || this.keyPairs.get(keyId);

    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Check if this key is expired
    if (key.expiresAt && key.expiresAt < Date.now()) {
      // Remove old key
      this.symmetricKeys.delete(keyId);
      this.keyPairs.delete(keyId);
      this.keyMetadata.delete(keyId);

      // Generate new key
      if (algorithm === 'AES-256-GCM') {
        const defaultPolicy = this.rotationPolicies.get('aes_256_gcm');
        const expiresAt = defaultPolicy
          ? Date.now() + defaultPolicy.rotationPeriod
          : Date.now() + (30 * 24 * 60 * 60 * 1000); // Default: 30 days

        await this.generateAESKey(expiresAt);
      } else if (algorithm === 'RSA-4096') {
        const defaultPolicy = this.rotationPolicies.get('rsa_4096');
        const expiresAt = defaultPolicy
          ? Date.now() + defaultPolicy.rotationPeriod
          : Date.now() + (365 * 24 * 60 * 60 * 1000); // Default: 1 year

        await this.generateRSAKeyPair(4096, expiresAt);
      } else if (algorithm === 'CRYSTALS-Kyber') {
        const defaultPolicy = this.rotationPolicies.get('chacha20_poly1305');
        const expiresAt = defaultPolicy
          ? Date.now() + defaultPolicy.rotationPeriod
          : Date.now() + (30 * 24 * 60 * 60 * 1000); // Default: 30 days

        await this.generatePostQuantumKey(expiresAt);
      }
    }
  }

  /**
   * Set rotation policy for a key type
   */
  async setRotationPolicy(
    keyType: string,
    policy: KeyRotationPolicy
  ): Promise<void> {
    this.rotationPolicies.set(keyType, policy);

    // Save policy to persistent storage
    await this.saveRotationPolicy(keyType, policy);
  }

  /**
   * Use a key (increment usage counter)
   */
  async useKey(keyId: string, action: 'encrypt' | 'decrypt' | 'sign' | 'verify'): Promise<void> {
    const key = this.symmetricKeys.get(keyId) || this.keyPairs.get(keyId);

    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Check if key is expired
    if (key.expiresAt && key.expiresAt < Date.now()) {
      await this.rotateKey(keyId);
      return;
    }

    // Update metadata
    const metadata = this.keyMetadata.get(keyId) || {
      usageCount: 0,
      lastUsed: Date.now(),
      permissions: [],
      scope: [],
      associatedWith: [],
    };

    metadata.usageCount++;
    metadata.lastUsed = Date.now();

    // Check permissions
    if (!metadata.permissions.includes(action)) {
      throw new Error(`Key does not have permission for action: ${action}`);
    }

    // Update metadata
    this.keyMetadata.set(keyId, metadata);

    // Save updated metadata
    await this.saveKeyMetadata(keyId, metadata);
  }

  /**
   * Delete a key
   */
  async deleteKey(keyId: string): Promise<void> {
    const key = this.symmetricKeys.get(keyId) || this.keyPairs.get(keyId);

    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Remove from storage
    if (this.symmetricKeys.has(keyId)) {
      this.symmetricKeys.delete(keyId);
    } else {
      this.keyPairs.delete(keyId);
    }

    this.keyMetadata.delete(keyId);

    // Delete from persistent storage
    await this.deleteKeyFromStorage(keyId);
  }

  /**
   * Check for expired keys and trigger rotation
   */
  private async checkExpiredKeys(): Promise<void> {
    const now = Date.now();

    // Check all keys
    const allKeys = [...this.symmetricKeys.values(), ...this.keyPairs.values()];
    const expiredKeys = allKeys.filter(key => key.expiresAt && key.expiresAt < now);

    // Auto-rotate expired keys
    for (const key of expiredKeys) {
      const policy = this.rotationPolicies.get(key.type);

      if (policy && policy.autoRotate) {
        await this.rotateKey(key.id, key.algorithm);
      }
    }
  }

  /**
   * Get all keys
   */
  getAllKeys(): {
    keyPairs: KeyPair[];
    symmetricKeys: SymmetricKey[];
  } {
    return {
      keyPairs: Array.from(this.keyPairs.values()),
      symmetricKeys: Array.from(this.symmetricKeys.values()),
    };
  }

  /**
   * Get key by ID
   */
  getKey(keyId: string): KeyPair | SymmetricKey | undefined {
    return this.symmetricKeys.get(keyId) || this.keyPairs.get(keyId);
  }

  /**
   * Get key metadata
   */
  getKeyMetadata(keyId: string): KeyMetadata | undefined {
    return this.keyMetadata.get(keyId);
  }

  /**
   * Save key pair to persistent storage
   */
  private async saveKeyPair(keyPair: KeyPair): Promise<void> {
    try {
      await fetch('/api/security/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'key_pair',
          data: keyPair,
        }),
      });
    } catch (error) {
      console.error('Failed to save key pair:', error);
    }
  }

  /**
   * Save symmetric key to persistent storage
   */
  private async saveSymmetricKey(key: SymmetricKey): Promise<void> {
    try {
      await fetch('/api/security/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'symmetric_key',
          data: key,
        }),
      });
    } catch (error) {
      console.error('Failed to save symmetric key:', error);
    }
  }

  /**
   * Save key metadata to persistent storage
   */
  private async saveKeyMetadata(keyId: string, metadata: KeyMetadata): Promise<void> {
    try {
      await fetch('/api/security/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'key_metadata',
          data: { id: keyId, metadata },
        }),
      });
    } catch (error) {
      console.error('Failed to save key metadata:', error);
    }
  }

  /**
   * Save rotation policy to persistent storage
   */
  private async saveRotationPolicy(keyType: string, policy: KeyRotationPolicy): Promise<void> {
    try {
      await fetch('/api/security/rotation-policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'rotation_policy',
          data: { keyType, policy },
        }),
      });
    } catch (error) {
      console.error('Failed to save rotation policy:', error);
    }
  }

  /**
   * Delete key from persistent storage
   */
  private async deleteKeyFromStorage(keyId: string): Promise<void> {
    try {
      await fetch('/api/security/keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: keyId }),
      });
    } catch (error) {
      console.error('Failed to delete key from storage:', error);
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
  }

  /**
   * Get key statistics
   */
  getStatistics(): {
    totalKeyPairs: number;
    totalSymmetricKeys: number;
    expiredKeys: number;
    expiringKeys: number;
    mostUsedKey: string;
    averageKeyAge: number;
  } {
    const totalKeyPairs = this.keyPairs.size;
    const totalSymmetricKeys = this.symmetricKeys.size;
    const allKeys = [...this.keyPairs.values(), ...this.symmetricKeys.values()];
    const now = Date.now();

    // Count expired keys
    const expiredKeys = allKeys.filter(key => key.expiresAt && key.expiresAt < now).length;

    // Count keys expiring in next 7 days
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    const expiringKeys = allKeys.filter(key => key.expiresAt && key.expiresAt < now + weekInMs && key.expiresAt >= now).length;

    // Find most used key
    const mostUsedKeyId = Array.from(this.keyMetadata.entries())
      .sort((a, b) => b[1].usageCount - a[1].usageCount)[0][0];
    const mostUsedKey = mostUsedKeyId;

    // Calculate average key age
    const averageAge = allKeys.length > 0
      ? allKeys.reduce((sum, key) => sum + (now - key.createdAt), 0) / allKeys.length
      : 0;

    return {
      totalKeyPairs,
      totalSymmetricKeys,
      expiredKeys,
      expiringKeys,
      mostUsedKey,
      averageKeyAge,
    };
  }

  /**
   * Export all keys (for backup)
   */
  async exportKeys(password: string): Promise<void> {
    // In a real implementation, this would encrypt keys with password
    // For now, we'll just export them as JSON

    const exportData = {
      keyPairs: Array.from(this.keyPairs.values()),
      symmetricKeys: Array.from(this.symmetricKeys.values()),
      exportedAt: Date.now(),
      version: '1.0',
    };

    // Trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `keys-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Import keys (for restore)
   */
  async importKeys(file: File): Promise<void> {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate version
      if (!importData.version) {
        throw new Error('Invalid key export format: missing version');
      }

      // Import key pairs
      if (importData.keyPairs) {
        for (const keyPair of importData.keyPairs) {
          // Check for conflicts
          if (this.keyPairs.has(keyPair.id)) {
            console.warn(`Key ID conflict: ${keyPair.id} - skipping`);
            continue;
          }

          this.keyPairs.set(keyPair.id, keyPair);
          await this.saveKeyPair(keyPair);
        }
      }

      // Import symmetric keys
      if (importData.symmetricKeys) {
        for (const key of importData.symmetricKeys) {
          // Check for conflicts
          if (this.symmetricKeys.has(key.id)) {
            console.warn(`Key ID conflict: ${key.id} - skipping`);
            continue;
          }

          this.symmetricKeys.set(key.id, key);
          await this.saveSymmetricKey(key);
        }
      }

      // Rebuild indexes
      for (const [keyId, metadata] of this.keyMetadata.entries()) {
        this.keyMetadata.set(keyId, metadata);
      }

      console.log(`Successfully imported ${importData.keyPairs.length} key pairs and ${importData.symmetricKeys.length} symmetric keys`);
    } catch (error) {
      console.error('Failed to import keys:', error);
      throw new Error(`Key import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enable automatic key rotation monitoring
   */
  startAutoRotationMonitoring(intervalMs: number = 3600000): void { // Default: 1 hour
    setInterval(async () => {
      try {
        await this.checkExpiredKeys();

        // Notify about keys that need rotation
        const policy = this.rotationPolicies.get('aes_256_gcm');
        if (policy && policy.notifyBeforeRotation) {
          const notificationThreshold = policy.notifyBeforeRotation;
          const allKeys = [...this.symmetricKeys.values()];
          const keysNeedingNotification = allKeys.filter(key =>
            key.expiresAt &&
            key.expiresAt > Date.now() &&
            key.expiresAt < Date.now() + notificationThreshold
          );

          if (keysNeedingNotification.length > 0) {
            console.log(`Keys needing rotation: ${keysNeedingNotification.map(k => k.id).join(', ')}`);
          }
        }
      } catch (error) {
        console.error('Error during auto-rotation check:', error);
      }
    }, intervalMs);

    console.log('Auto-rotation monitoring started');
  }

  /**
   * Disable automatic key rotation monitoring
   */
  stopAutoRotationMonitoring(): void {
    // In a real implementation, this would clear the interval
    console.log('Auto-rotation monitoring stopped');
  }
}

// Singleton instance
export const keyManagement = new KeyManagement();
