import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

/**
 * Validate the request bearer token and return the authenticated user id.
 * Returns null when the token is missing or invalid.
 */
export async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * Verify the caller is an authenticated admin. Returns the user id when true.
 */
export async function requireAdmin(req: Request): Promise<{ userId: string } | { error: Response }> {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return {
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );
  const { data, error } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' });
  if (error || data !== true) {
    return {
      error: new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { userId };
}

/**
 * Accept either an admin JWT or a valid shared cron secret header.
 * Header expected: `x-cron-secret: <CRON_SECRET>` matching the CRON_SECRET env.
 */
export async function requireAdminOrCron(req: Request): Promise<{ ok: true } | { error: Response }> {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const provided = req.headers.get('x-cron-secret');
  if (cronSecret && provided && provided === cronSecret) return { ok: true };
  // Also accept the service-role JWT as Bearer (used by pg_cron / server-to-server).
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (authHeader && serviceKey && authHeader === `Bearer ${serviceKey}`) return { ok: true };
  const res = await requireAdmin(req);
  if ('error' in res) return { error: res.error };
  return { ok: true };
}