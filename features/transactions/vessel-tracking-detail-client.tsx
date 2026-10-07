"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { listOrders, orderStatuses, type OrderListItemDto } from "@/services/orders-service";
import { getErrorMessage } from "@/services/api-errors";
import { getVesselByOrder, getVesselLogs, type VesselDetails, type VesselPosition } from "@/services/vessels-service";

const VesselTrackingMap = dynamic(() => import("./vessel-tracking-map").then((module) => module.VesselTrackingMap), { ssr: false, loading: () => <div className="h-full animate-pulse bg-[#193d59]" /> });

type TrackingState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; order: OrderListItemDto; vessel: VesselDetails; events: VesselPosition[] };

export function VesselTrackingDetailClient({ orderId }: { orderId: string }) {
  const [state, setState] = useState<TrackingState>({ status: "loading" });
  useEffect(() => {
    let mounted = true;
    void loadTracking(orderId).then((next) => { if (mounted) setState(next); });
    return () => { mounted = false; };
  }, [orderId]);

  if (state.status === "loading") return <main className="grid min-h-screen place-items-center bg-[#062d57] text-sm font-semibold text-white"><span className="animate-pulse">Loading vessel tracking…</span></main>;
  if (state.status === "error") return <main className="grid min-h-screen place-items-center bg-[#f3f5f7] p-6"><section className="max-w-lg rounded-xl bg-white p-8 text-center shadow-xl"><h1 className="text-xl font-bold text-[#183b64]">Tracking unavailable</h1><p className="mt-3 text-sm text-[#687482]">{state.message}</p><Link className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#15447c] px-4 text-sm font-semibold text-white" href={`/transactions?orderId=${orderId}`}>Back to transaction</Link></section></main>;
  return <TrackingReady {...state} />;
}

function TrackingReady({ order, vessel, events }: Extract<TrackingState, { status: "ready" }>) {
  const orderedEvents = useMemo(() => [...events].sort((a, b) => timestamp(a).localeCompare(timestamp(b))), [events]);
  const positionedEvents = orderedEvents.filter(hasCoordinates);
  const current = currentPosition(vessel, positionedEvents);
  const progress = Math.max(0, Math.round(((orderStatuses.indexOf(order.status) + 1) / orderStatuses.length) * 100));
  const vesselName = vessel.vesselName || vessel.name || "Assigned vessel";
  const loadingPort = vessel.portOfLoading || "Origin not provided";
  const dischargePort = vessel.portOfDischarge || order.destinationCountry || "Destination not provided";
  const status = vessel.trackingStatus || vessel.status || "TRACKING";

  return <main className="min-h-screen bg-[#082f5d] text-white">
    <header className="flex min-h-[88px] flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-[#042a54] to-[#164d83] px-5 py-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-5"><Link aria-label="Back to transaction" className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-white" href={`/transactions?orderId=${order.id}`}><ArrowLeft size={18} /> Back</Link><div className="h-10 w-px bg-white/15" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h1 className="truncate text-xl font-bold">{order.commodityType || "Cargo"} · {order.orderNumber}</h1><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#164d83]">{formatStatus(order.status)}</span></div><p className="mt-1 text-xs text-white/65">{loadingPort} → {dischargePort}</p></div></div>
      <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold"><span className="size-2 rounded-full bg-[#2be7a0] shadow-[0_0_12px_#2be7a0]" />{formatStatus(status)}</div>
    </header>

    <div className="grid min-h-[calc(100vh-88px)] lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="relative min-h-[620px] overflow-hidden bg-[#173f5c] lg:min-h-[calc(100vh-88px)]">
        {current ? <VesselTrackingMap current={current} events={orderedEvents} vesselName={vesselName} /> : <div className="grid h-full place-items-center text-center text-white/70"><div><MapPin className="mx-auto mb-3" size={34} /><p className="font-semibold">No coordinates available yet</p></div></div>}
        <div className="pointer-events-none absolute inset-0 z-[400] bg-[#06284b]/20" />
        <section className="absolute bottom-5 left-5 z-[500] w-[320px] max-w-[calc(100%-40px)] rounded-xl border border-white/15 bg-[#04284d]/90 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/50">Current position</p><p className="mt-1 text-base font-bold">{vessel.currentPortOfCall || current?.portOfCall || "At sea"}</p></div><span className="rounded-full bg-[#13b982]/20 px-3 py-1 text-[10px] font-bold text-[#4df0b4]">● At sea</span></div>
          <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3"><Metric label="Speed" value={speed(vessel, orderedEvents)} /><Metric label="Voyage" value={vessel.voyageNumber || "—"} /><Metric label="SCAC" value={vessel.scac || "—"} /></dl>
        </section>
      </section>

      <aside className="flex min-h-[620px] flex-col border-l border-white/10 bg-gradient-to-b from-[#164d83] to-[#0b3c70]">
        <div className="grid grid-cols-2 border-b border-white/10"><Info label="Current position" value={vessel.currentPortOfCall || current?.portOfCall || "At sea"} note={vessel.lastUpdated ? `Updated ${formatDate(vessel.lastUpdated, true)}` : "Awaiting update"} /><Info label="Vessel" value={vesselName} note={vessel.voyageNumber || order.orderNumber} /><Info label="ETA" value={vessel.eta ? formatDate(vessel.eta) : "Not provided"} note={dischargePort} /><Info label="Cargo" value={formatQuantity(order.quantity, order.unit)} note={order.commodityType || "Commodity"} /></div>
        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-5"><div className="mb-4 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/50">Journey log</p><span className="text-[10px] font-semibold text-white/45">{orderedEvents.length} events</span></div>
          {orderedEvents.length ? <ol>{orderedEvents.map((event, index) => <li className="relative grid grid-cols-[22px_1fr_auto] gap-2 pb-5 last:pb-0" key={event.id || `${event.eventType}-${index}`}><div className="relative flex justify-center"><span className={`relative z-10 mt-1 size-3 rounded-full border-2 ${index === orderedEvents.length - 1 ? "border-[#8ed3ff] bg-[#4ca8ff]" : "border-[#54efb7] bg-[#1dc98d]"}`} />{index < orderedEvents.length - 1 ? <span className="absolute bottom-[-4px] top-3 w-px bg-white/20" /> : null}</div><div><p className="text-xs font-semibold leading-5">{formatEvent(event.eventType)}</p><p className="text-[10px] leading-4 text-white/55">{event.portOfCall || event.description || "Position update"}</p>{hasCoordinates(event) ? <p className="mt-1 font-mono text-[9px] text-[#8dc8ef]">{event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}{event.speed != null ? ` · ${event.speed} kn` : ""}</p> : null}</div><time className="pt-1 text-right text-[9px] text-white/45">{formatDate(timestamp(event), true)}</time></li>)}</ol> : <p className="text-sm text-white/60">No journey events have been received yet.</p>}
        </section>
        <div className="border-t border-white/10 p-5"><div className="mb-2 flex justify-between text-[10px] font-semibold"><span>{loadingPort}</span><span>{dischargePort}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#68bfff]" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-center text-[10px] text-white/50">{progress}% transaction progress{vessel.eta ? ` · ETA ${formatDate(vessel.eta)}` : ""}</p></div>
      </aside>
    </div>
  </main>;
}

async function loadTracking(orderId: string): Promise<TrackingState> {
  try {
    let order: OrderListItemDto | undefined;
    for (let page = 1; page <= 20 && !order; page += 1) {
      const response = await listOrders({ page, limit: 100 });
      order = response.orders.find((item) => item.id === orderId);
      if (page >= response.pagination.totalPages) break;
    }
    if (!order) return { status: "error", message: "This transaction is not available to the current user." };
    const [vessel, events] = await Promise.all([getVesselByOrder(orderId), getVesselLogs(orderId)]);
    return { status: "ready", order, vessel, events };
  } catch (error) {
    return { status: "error", message: getErrorMessage(error, "The vessel tracking details could not be loaded.") };
  }
}

function currentPosition(vessel: VesselDetails, events: VesselPosition[]) {
  const direct = vessel.currentPosition || vessel.position;
  if (direct && hasCoordinates(direct)) return direct;
  if (Number.isFinite(vessel.latitude) && Number.isFinite(vessel.longitude)) return { latitude: vessel.latitude!, longitude: vessel.longitude!, portOfCall: vessel.currentPortOfCall || undefined, eta: vessel.eta, speed: [...events].reverse().find((event) => event.speed != null)?.speed };
  return [...events].reverse().find(hasCoordinates);
}
function hasCoordinates(event: VesselPosition): event is VesselPosition & { latitude: number; longitude: number } { return Number.isFinite(event.latitude) && Number.isFinite(event.longitude); }
function timestamp(event: VesselPosition) { return event.loggedAt || event.timestamp || event.createdAt || ""; }
function speed(vessel: VesselDetails, events: VesselPosition[]) { const value = vessel.currentPosition?.speed ?? vessel.position?.speed ?? [...events].reverse().find((event) => event.speed != null)?.speed; return value == null ? "—" : `${value} kn`; }
function formatEvent(value?: string) { const event = value?.split(".").at(-1); return event?.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Tracking update"; }
function formatStatus(value?: string) { return value?.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Active"; }
function formatDate(value: string, includeTime = false) { const date = new Date(value); if (Number.isNaN(date.getTime())) return value; return new Intl.DateTimeFormat("en-US", includeTime ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric", year: "numeric" }).format(date); }
function formatQuantity(value?: string | number, unit?: string) { const amount = Number(value); return Number.isFinite(amount) ? `${new Intl.NumberFormat("en-US").format(amount)} ${unit || ""}`.trim() : "Not provided"; }
function Metric({ label, value }: { label: string; value: string }) { return <div><dt className="text-[8px] uppercase tracking-wide text-white/45">{label}</dt><dd className="mt-1 truncate text-xs font-bold">{value}</dd></div>; }
function Info({ label, value, note }: { label: string; value: string; note: string }) { return <div className="min-h-[100px] border-b border-r border-white/10 p-4"><p className="text-[9px] font-semibold uppercase tracking-[.15em] text-white/45">{label}</p><p className="mt-2 truncate text-sm font-bold">{value}</p><p className="mt-1 truncate text-[10px] text-white/50">{note}</p></div>; }
