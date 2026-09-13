"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyTable, PageHeading, SecondaryButton, managementHeader } from "@/features/management/management-ui";
import {
  scopedSearch,
  searchItemDescription,
  searchItemHref,
  searchItemTitle,
  searchTypes,
  type ScopedSearchResponse,
  type SearchType,
} from "@/services/search-service";
import { getErrorMessage } from "@/services/api-errors";

const labels: Record<SearchType, string> = {
  orders: "Transactions", documents: "Documents", warehouses: "Warehouses",
  inventory: "Inventory", payments: "Payments", users: "Users",
};

export function SearchResultsClient() {
  const params = useSearchParams();
  const query = params.get("q")?.trim() || "";
  const requestedType = params.get("type") || "orders";
  const type = searchTypes.includes(requestedType as SearchType) ? requestedType as SearchType : "orders";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [data, setData] = useState<ScopedSearchResponse>();
  const [loading, setLoading] = useState(query.length >= 2);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    if (query.length >= 2) {
      const timer = window.setTimeout(() => {
        setLoading(true); setError(undefined);
        void scopedSearch(query, type, page, 10, controller.signal)
          .then(setData)
          .catch((cause) => { if (!controller.signal.aborted) setError(getErrorMessage(cause)); })
          .finally(() => { if (!controller.signal.aborted) setLoading(false); });
      }, 0);
      return () => { window.clearTimeout(timer); controller.abort(); };
    }
    return () => controller.abort();
  }, [page, query, type]);

  const total = data?.pagination.total || 0;
  const totalPages = data?.pagination.totalPages || Math.max(1, Math.ceil(total / 10));
  return <AppShell activeNav="dashboard" header={managementHeader("Search results")}>
    <PageHeading title={`Search: ${query || "—"}`} description={`Full, role-filtered results in ${labels[type].toLowerCase()}.`} />
    <nav aria-label="Search categories" className="flex flex-wrap gap-2">
      {searchTypes.map((item) => <a key={item} href={`/search?q=${encodeURIComponent(query)}&type=${item}`} className={`rounded-[7px] border px-3 py-2 text-[11px] font-semibold ${item === type ? "border-[#15447c] bg-[#15447c] text-white" : "border-[#dfe3e8] bg-white text-[#526170] hover:bg-[#f5f8fb]"}`}>{labels[item]}</a>)}
    </nav>
    {!query || query.length < 2 ? <EmptyTable loading={false} label="results" prompt="Enter at least two characters in global search" /> : loading || error || !data?.results.length ? <EmptyTable loading={loading} error={error} label="results" prompt="No matching results" /> : <div className="overflow-hidden rounded-[9px] border border-[#e4e4e7] bg-white">
      {data.results.map((item) => <a className="block border-b border-[#eceef1] px-5 py-4 last:border-0 hover:bg-[#f5f8fb]" href={searchItemHref(type, item)} key={item.id}>
        <strong className="block text-[13px] text-[#303239]">{searchItemTitle(type, item)}</strong>
        <span className="mt-1 block text-[11px] text-[#85868d]">{searchItemDescription(type, item)}</span>
      </a>)}
    </div>}
    {data?.results.length ? <div className="flex items-center justify-between text-[11px] text-[#777b83]"><span>{total} result{total === 1 ? "" : "s"} · Page {page} of {totalPages}</span><div className="flex gap-2"><a aria-disabled={page <= 1} href={page > 1 ? `/search?q=${encodeURIComponent(query)}&type=${type}&page=${page - 1}` : undefined}><SecondaryButton disabled={page <= 1}>Previous</SecondaryButton></a><a aria-disabled={page >= totalPages} href={page < totalPages ? `/search?q=${encodeURIComponent(query)}&type=${type}&page=${page + 1}` : undefined}><SecondaryButton disabled={page >= totalPages}>Next</SecondaryButton></a></div></div> : null}
  </AppShell>;
}
