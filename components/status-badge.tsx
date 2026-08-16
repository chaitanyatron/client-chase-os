import { type RequestStatus } from "@/lib/types";

const styles: Record<RequestStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  received: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  overdue: "bg-rose-50 text-rose-700 ring-rose-600/20",
};
export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${styles[status]}`}>{status}</span>;
}
