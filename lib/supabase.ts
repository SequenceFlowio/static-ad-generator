import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

// Server-only client (service role — bypasses RLS). Lazy — safe at module load.
export function getServerSupabase() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
}

// Browser client (anon key). Call only in client components.
export function getBrowserSupabase() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

// Upload a file buffer to Supabase Storage and return its public URL
export async function uploadToStorage(
  bucket: string,
  path: string,
  data: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const client = getServerSupabase();
  const { error } = await client.storage
    .from(bucket)
    .upload(path, data, { contentType, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data: urlData } = client.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

// List files in a storage path and return their public URLs
export async function listStorageFiles(
  bucket: string,
  folder: string
): Promise<string[]> {
  const client = getServerSupabase();
  const { data, error } = await client.storage.from(bucket).list(folder);
  if (error || !data) return [];
  return data
    .filter((f) => f.name && !f.name.startsWith("."))
    .map((f) => {
      const { data: urlData } = client.storage
        .from(bucket)
        .getPublicUrl(`${folder}/${f.name}`);
      return urlData.publicUrl;
    });
}
