import Link from "next/link";
import { login } from "@/app/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { error, message } = await searchParams;
  return <div className="card p-7 sm:p-9"><div className="mb-8"><p className="text-xl font-bold tracking-tight">Client Chase <span className="text-indigo-600">OS</span></p><h1 className="mt-6 text-2xl font-bold">Welcome back</h1><p className="mt-2 text-sm text-slate-600">Sign in to manage your client requests.</p></div>{error && <p className="mb-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{message && <p className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<form action={login} className="space-y-5"><label className="label">Email<input name="email" type="email" className="field" autoComplete="email" required /></label><label className="label">Password<input name="password" type="password" className="field" autoComplete="current-password" required /></label><button className="button-primary w-full">Log in</button></form><p className="mt-6 text-center text-sm text-slate-600">New here? <Link className="font-semibold text-indigo-600 hover:text-indigo-700" href="/signup">Create an account</Link></p></div>;
}
