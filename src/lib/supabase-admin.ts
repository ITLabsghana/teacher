
import { createClient } from '@supabase/supabase-js';

// These environment variables are only available on the server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// This is a proxy object for our admin client.
// It allows the application to initialize without the service role key,
// but it will throw a specific, helpful error if any admin action is
// attempted without the key being configured.
export const adminDb = new Proxy({}, {
  get(_, prop) {
    if (!supabaseServiceRoleKey) {
      throw new Error("Configuration Error: SUPABASE_SERVICE_ROLE_KEY is not set in the environment. User management features are disabled.");
    }
    
    // Create the client on-demand the first time it's accessed.
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Return the property from the actual client (e.g., .from(), .auth)
    return Reflect.get(adminClient, prop);
  },
}) as ReturnType<typeof createClient>;
