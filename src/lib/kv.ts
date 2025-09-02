import { kv } from '@vercel/kv';

// Export configured kv instance
export { kv };

// Optional: Add a verification function
export async function verifyKVConnection() {
  try {
    await kv.ping();
    // console.log("Successfully connected to KV store");
    return true;
  } catch (error) {
    console.error('Failed to connect to KV store:', error);
    return false;
  }
}
