export type RequestStatus = "pending" | "received" | "overdue";
export interface Client { id: string; owner_id: string; name: string; email: string | null; phone: string | null; company_name: string | null; created_at: string; }
export interface DocumentRequest { id: string; client_id: string; document_name: string; status: RequestStatus; requested_at: string; due_date: string | null; received_at: string | null; }

export function effectiveStatus(request: DocumentRequest): RequestStatus {
  if (request.status === "received") return "received";
  if (request.status === "overdue" || (request.due_date && new Date(request.due_date + "T23:59:59") < new Date())) return "overdue";
  return "pending";
}

export function waitingDuration(requestedAt: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(requestedAt).getTime()) / 86_400_000));
  return `Waiting ${days} ${days === 1 ? "day" : "days"}`;
}
