import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
  return <AppShell name={profile?.name}>{children}</AppShell>;
}
