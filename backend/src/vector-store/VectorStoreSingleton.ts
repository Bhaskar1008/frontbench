/**
 * Vector Store Singleton
 * Ensures only one instance of VectorStoreManager exists to prevent memory issues
 */

import { VectorStoreManager, VectorStoreConfig } from './VectorStoreManager.js';

let vectorStoreInstance: VectorStoreManager | null = null;
let initializationPromise: Promise<void> | null = null;

/**
 * Get or create the singleton VectorStoreManager instance
 */
export async function getVectorStore(config?: VectorStoreConfig): Promise<VectorStoreManager> {
  // If already initialized, return the instance
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    await initializationPromise;
    if (vectorStoreInstance) {
      return vectorStoreInstance;
    }
  }

  // Create new instance and initialize
  vectorStoreInstance = new VectorStoreManager(config);
  initializationPromise = vectorStoreInstance.initialize().catch((error) => {
    // Reset on error so we can retry
    vectorStoreInstance = null;
    initializationPromise = null;
    throw error;
  });

  await initializationPromise;
  return vectorStoreInstance;
}

/**
 * Reset the singleton (useful for testing or reinitialization)
 */
export function resetVectorStore(): void {
  vectorStoreInstance = null;
  initializationPromise = null;
}
