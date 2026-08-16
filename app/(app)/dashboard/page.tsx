import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { effectiveStatus, type Client, type DocumentRequest } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export default async function DashboardPage() {
  const { supabase } = await requireUser();
  const { data: clientsData } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
  const clients = (clientsData || []) as Client[];
  const { data: requestsData } = await supabase.from("document_requests").select("*");
  const requests = (requestsData || []) as DocumentRequest[];
  const clientById = new Map(clients.map(c => [c.id, c]));

  const withStatus = requests.map(request => ({ request, status: effectiveStatus(request) }));
  const pending = withStatus.filter(r => r.status === "pending").length;
  const received = withStatus.filter(r => r.status === "received").length;
  const overdue = withStatus.filter(r => r.status === "overdue").length;

  const attention = withStatus
    .filter(r => r.status === "overdue" || r.status === "pending")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "overdue" ? -1 : 1;
      const aTime = a.request.due_date ? new Date(a.request.due_date).getTime() : Infinity;
      const bTime = b.request.due_date ? new Date(b.request.due_date).getTime() : Infinity;
      return aTime - bTime;
    })
    .slice(0, 8);

  const stats: [string, number, string][] = [
    ["Clients", clients.length, "Total clients in your firm"],
    ["Pending", pending, "Documents awaiting receipt"],
    ["Received", received, "Documents received so far"],
    ["Overdue", overdue, "Past their due date"],
  ];

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">Overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Your client requests</h1>
          <p className="mt-2 text-slate-600">Stay ahead of every document you are waiting for.</p>
        </div>
        <Link className="button-primary" href="/clients/new">+ Add client</Link>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, help]) => (
          <div className="card p-5" key={label}>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{help}</p>
          </div>
        ))}
      </section>

      <section className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Needs attention</h2>
            <p className="mt-1 text-sm text-slate-500">Outstanding and overdue document requests.</p>
          </div>
          <Link className="text-sm font-semibold text-indigo-600 hover:text-indigo-700" href="/clients">View all clients</Link>
        </div>
        {attention.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <h3 className="font-semibold">Nothing outstanding</h3>
            <p className="mt-2 text-sm text-slate-500">Every requested document has been received.</p>
          </div>
        ) : (
          <div className="divide-y">
            {attention.map(({ request, status }) => {
              const client = clientById.get(request.client_id);
              return (
                <Link href={`/clients/${request.client_id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50" key={request.id}>
                  <div>
                    <p className="font-medium">{request.document_name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {client?.company_name || client?.name || "Unknown client"}
                      {request.due_date ? ` · Due ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(request.due_date + "T12:00:00"))}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
