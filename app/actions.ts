"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function text(formData: FormData, key: string) { return String(formData.get(key) || "").trim(); }
function failure(path: string, message: string): never { redirect(`${path}?error=${encodeURIComponent(message)}`); }

export async function login(formData: FormData) {
  const email = text(formData, "email"); const password = text(formData, "password");
  if (!email || !password) failure("/login", "Enter your email and password.");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) failure("/login", "Invalid email or password.");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const name = text(formData, "name"); const email = text(formData, "email"); const password = text(formData, "password");
  if (!name || !emailPattern.test(email) || password.length < 8) failure("/signup", "Enter your name, a valid email, and a password of at least 8 characters.");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
  if (error) failure("/signup", error.message);
  if (!data.session) redirect("/login?message=Check+your+email+to+confirm+your+account%2C+then+log+in.");
  redirect("/dashboard");
}

export async function logout() { const supabase = await createClient(); await supabase.auth.signOut(); redirect("/login"); }

export async function addClient(formData: FormData) {
  const name = text(formData, "name"); const email = text(formData, "email"); const phone = text(formData, "phone");
  if (!name) failure("/clients/new", "Client or company name is required.");
  if (email && !emailPattern.test(email)) failure("/clients/new", "Enter a valid email address.");
  if (phone && !/^[+()\d\s-]{7,20}$/.test(phone)) failure("/clients/new", "Enter a valid phone number.");
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("clients").insert({ owner_id: user.id, name, company_name: name, email: email || null, phone: phone || null }).select("id").single();
  if (error || !data) failure("/clients/new", "Could not save this client. Please try again.");
  redirect(`/clients/${data.id}`);
}

export async function addDocumentRequests(formData: FormData) {
  const clientId = text(formData, "client_id"); const dueDate = text(formData, "due_date") || null;
  const documentNames = formData.getAll("document_names").map(String).map(value => value.trim()).filter(Boolean);
  if (!clientId || !documentNames.length) failure(`/clients/${clientId}?request=1`, "Select at least one document.");
  const supabase = await createClient();

  // Prevent duplicate pending/overdue requests for the same client + document.
  const { data: existingData } = await supabase.from("document_requests").select("document_name, status").eq("client_id", clientId).neq("status", "received");
  const existingNames = new Set((existingData || []).map(row => row.document_name));
  const newNames = documentNames.filter(name => !existingNames.has(name));
  const skipped = documentNames.length - newNames.length;

  if (!newNames.length) failure(`/clients/${clientId}?request=1`, "Those documents already have an open request.");

  const { error } = await supabase.from("document_requests").insert(newNames.map(document_name => ({ client_id: clientId, document_name, due_date: dueDate, status: "pending" })));
  if (error) failure(`/clients/${clientId}?request=1`, "Could not add document requests. Please try again.");

  revalidatePath(`/clients/${clientId}`); revalidatePath("/dashboard"); revalidatePath("/clients");
  const message = skipped > 0 ? `Added ${newNames.length} request(s). Skipped ${skipped} duplicate(s).` : `Added ${newNames.length} document request(s).`;
  redirect(`/clients/${clientId}?success=${encodeURIComponent(message)}`);
}

export async function updateDocumentStatus(formData: FormData) {
  const clientId = text(formData, "client_id"); const requestId = text(formData, "request_id"); const status = text(formData, "status");
  if (!clientId || !requestId || !["pending", "received", "overdue"].includes(status)) return;
  const supabase = await createClient();
  const changes = status === "received" ? { status, received_at: new Date().toISOString() } : { status, received_at: null };
  await supabase.from("document_requests").update(changes).eq("id", requestId);
  revalidatePath(`/clients/${clientId}`); revalidatePath("/dashboard"); revalidatePath("/clients");
}
