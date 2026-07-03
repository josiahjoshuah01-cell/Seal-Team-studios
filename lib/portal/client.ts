import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export async function resolvePortalClientId(user: User) {
  const supabase = await createClient();

  const { data: byProfile } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (byProfile) return byProfile.id;

  if (!user.email) return null;

  const admin = createAdminClient();
  const { data: byEmail } = await admin
    .from("clients")
    .select("id, profile_id")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!byEmail) return null;

  if (!byEmail.profile_id) {
    await admin
      .from("clients")
      .update({ profile_id: user.id })
      .eq("id", byEmail.id);
  }

  return byEmail.id;
}

export async function getAuthenticatedPortalClientId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return resolvePortalClientId(user);
}

export async function getPortalClientPhone() {
  const clientId = await getAuthenticatedPortalClientId();
  if (!clientId) return null;

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("phone")
    .eq("id", clientId)
    .maybeSingle();

  if (client?.phone) return client.phone;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.phone ?? null;
}
