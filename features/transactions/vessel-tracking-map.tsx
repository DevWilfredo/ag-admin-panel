"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { VesselPosition } from "@/services/vessels-service";

export function VesselTrackingMap({ current, events, vesselName }: { current: VesselPosition; events: VesselPosition[]; vesselName: string }) {
  if (!hasCoordinates(current)) return null;
  const route = events
    .filter(hasCoordinates)
    .filter((point, index, points) => index === 0 || point.latitude !== points[index - 1].latitude || point.longitude !== points[index - 1].longitude)
    .filter((point) => point.latitude !== current.latitude || point.longitude !== current.longitude);
  route.push(current);
  const bounds = route.map((point) => [point.latitude!, point.longitude!] as [number, number]);

  return <MapContainer center={[current.latitude!, current.longitude!]} zoom={5} scrollWheelZoom className="h-full w-full bg-[#183f5c]">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <FitRoute bounds={bounds} />
    {bounds.length > 1 ? <Polyline positions={bounds} pathOptions={{ color: "#76c8ff", opacity: 0.9, weight: 4 }} /> : null}
    {route.map((point, index) => <CircleMarker key={`${point.latitude}-${point.longitude}-${index}`} center={[point.latitude!, point.longitude!]} radius={index === route.length - 1 ? 9 : 6} pathOptions={{ color: "#fff", fillColor: index === route.length - 1 ? "#2be7a0" : "#4ca8ff", fillOpacity: 1, weight: 3 }}>
      <Tooltip>{point.portOfCall || formatEvent(point.eventType) || `Checkpoint ${index + 1}`}</Tooltip>
      <Popup><strong>{index === route.length - 1 ? vesselName : formatEvent(point.eventType)}</strong><br />{point.portOfCall || "Position update"}<br />{point.latitude!.toFixed(5)}, {point.longitude!.toFixed(5)}</Popup>
    </CircleMarker>)}
  </MapContainer>;
}

function FitRoute({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 7 });
    else if (bounds[0]) map.setView(bounds[0], 6);
  }, [bounds, map]);
  return null;
}

function hasCoordinates(point: VesselPosition): point is VesselPosition & { latitude: number; longitude: number } {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function formatEvent(value?: string) {
  const event = value?.split(".").at(-1);
  return event?.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Tracking update";
}
