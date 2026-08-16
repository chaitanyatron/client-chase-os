import { notFound } from "next/navigation";
import Link from "next/link";
import { addDocumentRequests, updateDocumentStatus } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { documentOptions, effectiveStatus, waitingDuration, type Client, type DocumentRequest, type RequestStatus } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

const filters: { label: string; value: "all" | RequestStatus }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Received", value: "received" },
  { label: "Overdue", value: "overdue" },
];

export default async function ClientDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string; request?: string; status?: string }> }) {
  const { id } = await params;
  const { error, success, request, status: statusFilter } = await searchParams;
  const { supabase } = await requireUser();

  const { data: clientData } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (!clientData) notFound();
  const client = clientData as Client;

  const { data: docsData } = await supabase.from("document_requests").select("*").eq("client_id", id).order("requested_at", { ascending: false });
  const docs = (docsData || []) as DocumentRequest[];
  const withStatus = docs.map(doc => ({ doc, status: effectiveStatus(doc) }));
  const pendingCount = withStatus.filter(d => d.status === "pending").length;
  const receivedCount = withStatus.filter(d => d.status === "received").length;
  const overdueCount = withStatus.filter(d => d.status === "overdue").length;
  const activeFilter = statusFilter === "pending" || statusFilter === "received" || statusFilter === "overdue" ? statusFilter : "all";
  const visible = activeFilter === "all" ? withStatus : withStatus.filter(d => d.status === activeFilter);
  const modalOpen = request === "1";

  return (
    <div>
      <Link href="/clients" className="text-sm font-medium text-slate-600 hover:text-slate-950">← Back to clients</Link>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.company_name || client.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <span>{client.email || "No email"}</span>
            <span>{client.phone || "No phone"}</span>
          </div>
        </div>
        <Link href={`/clients/${id}?request=1`} className="button-primary shrink-0">Request documents</Link>
      </div>

      {success && <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}

      <section className="mt-6 grid grid-cols-3 gap-4 sm:max-w-md">
        <div className="card p-4"><p className="text-xs font-medium text-slate-500">Pending</p><p className="mt-1 text-2xl font-bold tracking-tight text-amber-700">{pendingCount}</p></div>
        <div className="card p-4"><p className="text-xs font-medium text-slate-500">Received</p><p className="mt-1 text-2xl font-bold tracking-tight text-emerald-700">{receivedCount}</p></div>
        <div className="card p-4"><p className="text-xs font-medium text-slate-500">Overdue</p><p className="mt-1 text-2xl font-bold tracking-tight text-rose-700">{overdueCount}</p></div>
      </section>

      <section className="card mt-8 overflow-hidden">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Documents required</h2>
            <p className="mt-1 text-sm text-slate-500">Track every item you are waiting to receive.</p>
          </div>
          <div className="flex gap-1.5">
            {filters.map(f => (
              <Link key={f.value} href={f.value === "all" ? `/clients/${id}` : `/clients/${id}?status=${f.value}`} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeFilter === f.value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{f.label}</Link>
            ))}
          </div>
        </div>

        {docs.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h3 className="font-semibold">No document requests yet</h3>
            <p className="mt-2 text-sm text-slate-500">Use "Request documents" to add the items you need from this client.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h3 className="font-semibold">No {activeFilter} requests</h3>
            <p className="mt-2 text-sm text-slate-500">Try a different filter.</p>
          </div>
        ) : (
          <div className="divide-y">
            {visible.map(({ doc, status }) => (
              <div key={doc.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{doc.document_name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Requested {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(doc.requested_at))}
                    {doc.due_date ? ` · Due ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(doc.due_date + "T12:00:00"))}` : ""}
                    {status !== "received" ? ` · ${waitingDuration(doc.requested_at)}` : doc.received_at ? ` · Received ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(doc.received_at))}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  {status !== "received" && (
                    <form action={updateDocumentStatus}>
                      <input type="hidden" name="client_id" value={id} />
                      <input type="hidden" name="request_id" value={doc.id} />
                      <input type="hidden" name="status" value="received" />
                      <button className="button-secondary !px-3 !py-1.5">Mark received</button>
                    </form>
                  )}
                  {status === "pending" && (
                    <form action={updateDocumentStatus}>
                      <input type="hidden" name="client_id" value={id} />
                      <input type="hidden" name="request_id" value={doc.id} />
                      <input type="hidden" name="status" value="overdue" />
                      <button className="text-xs font-semibold text-rose-600 hover:text-rose-700">Mark overdue</button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-5">
          <div className="card w-full max-w-md p-6">
            <h2 className="font-semibold">Request documents</h2>
            <p className="mt-1 text-sm text-slate-500">Select one or more items to request from {client.company_name || client.name}.</p>
            {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <form action={addDocumentRequests} className="mt-5">
              <input type="hidden" name="client_id" value={id} />
              <fieldset className="max-h-64 space-y-2.5 overflow-y-auto">
                {documentOptions.map(item => (
                  <label key={item} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                    <input name="document_names" value={item} type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    {item}
                  </label>
                ))}
              </fieldset>
              <label className="label mt-5">Due date <span className="font-normal text-slate-400">(optional)</span>
                <input type="date" name="due_date" className="field" />
              </label>
              <div className="mt-6 flex justify-end gap-3">
                <Link href={`/clients/${id}`} className="button-secondary">Cancel</Link>
                <button className="button-primary">Create requests</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
