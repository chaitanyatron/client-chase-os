import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-5"><div className="w-full max-w-md">{children}</div></main>;
}
