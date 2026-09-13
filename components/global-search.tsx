"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  quickSearch,
  searchItemDescription,
  searchItemHref,
  searchItemTitle,
  searchTypes,
  type QuickSearchResponse,
  type SearchType,
} from "@/services/search-service";

const labels: Record<SearchType, string> = {
  orders: "Transactions",
  documents: "Documents",
  warehouses: "Warehouses",
  inventory: "Inventory",
  payments: "Payments",
  users: "Users",
};

export function GlobalSearch({ className = "" }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<QuickSearchResponse>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(undefined);
      try {
        setData(await quickSearch(search, controller.signal));
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Search is unavailable.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const open = focused && query.trim().length >= 2;
  return (
    <div ref={root} className={`relative min-w-0 ${className}`}>
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-[#bebec2]" />
      <input
        aria-label="Search across AgroTrust"
        className="h-[38px] w-full rounded-[8px] border border-[#dddddf] bg-[#fafafa] py-0 pl-11 pr-9 text-[12px] font-medium text-[#737378] outline-none placeholder:text-[#b8b8bc] focus:border-[#3971ad] focus:ring-3 focus:ring-[#15447c]/10"
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          if (value.trim().length < 2) {
            setData(undefined); setError(undefined); setLoading(false);
          }
        }}
        onFocus={() => setFocused(true)}
        placeholder="Search across AgroTrust"
        type="search"
        value={query}
      />
      {query ? <button aria-label="Clear search" className="absolute right-2 top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full text-[#8c8e94] hover:bg-[#edf1f5]" onClick={() => { setQuery(""); setData(undefined); }} type="button"><X size={14} /></button> : null}
      {open ? (
        <div className="absolute right-0 top-[44px] z-[100] max-h-[min(620px,75vh)] w-[min(460px,calc(100vw-32px))] overflow-auto rounded-[10px] border border-[#dfe3e8] bg-white p-2 shadow-[0_18px_50px_rgba(0,28,66,.2)]">
          {loading ? <p className="px-3 py-5 text-center text-[11px] text-[#85868d]">Searching…</p> : null}
          {error ? <p role="alert" className="px-3 py-4 text-[11px] text-[#a73640]">{error}</p> : null}
          {!loading && !error && data?.totalResults === 0 ? <p className="px-3 py-5 text-center text-[11px] text-[#85868d]">No results for “{query.trim()}”.</p> : null}
          {!loading && !error ? searchTypes.map((type) => {
            const items = data?.results?.[type] || [];
            if (!items.length) return null;
            return <section className="border-b border-[#eceef1] py-2 last:border-0" key={type}>
              <div className="flex items-center justify-between px-2 pb-1.5">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#8a8d94]">{labels[type]}</h2>
                {items.length >= 5 ? <a className="text-[10px] font-semibold text-[#15447c] hover:underline" href={`/search?q=${encodeURIComponent(query.trim())}&type=${type}`}>See all</a> : null}
              </div>
              {items.map((item) => <a className="block rounded-[6px] px-3 py-2 hover:bg-[#f0f5fb]" href={searchItemHref(type, item)} key={`${type}-${item.id}`}>
                <span className="block truncate text-[12px] font-semibold text-[#303239]">{searchItemTitle(type, item)}</span>
                <span className="mt-0.5 block truncate text-[10px] text-[#85868d]">{searchItemDescription(type, item)}</span>
              </a>)}
            </section>;
          }) : null}
        </div>
      ) : null}
    </div>
  );
}
