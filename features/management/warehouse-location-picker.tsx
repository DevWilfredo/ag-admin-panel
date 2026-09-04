"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

type Coordinates = { latitude?: number; longitude?: number };

export function WarehouseLocationPicker({
  coordinates,
  onChange,
}: {
  coordinates: Coordinates;
  onChange: (latitude: number, longitude: number) => void;
}) {
  const hasPosition =
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude);
  const position: [number, number] = hasPosition
    ? [coordinates.latitude!, coordinates.longitude!]
    : [8.2, -66.5];

  return (
    <div className="overflow-hidden rounded-[9px] border border-[#dedef2] bg-[#eef3f7]">
      <MapContainer
        center={position}
        zoom={hasPosition ? 14 : 5}
        scrollWheelZoom
        className="h-[270px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClick onChange={onChange} />
        <CenterMap position={hasPosition ? position : undefined} />
        {hasPosition ? (
          <CircleMarker
            center={position}
            radius={9}
            pathOptions={{
              color: "#fff",
              fillColor: "#001c42",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              Warehouse location
            </Tooltip>
          </CircleMarker>
        ) : null}
      </MapContainer>
      <p className="border-t border-[#dedef2] bg-white px-3 py-2 text-[10px] leading-4 text-[#737780]">
        Click the map to place the warehouse. You can fine-tune the coordinates
        manually below.
      </p>
    </div>
  );
}

function MapClick({
  onChange,
}: {
  onChange: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function CenterMap({ position }: { position?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 14));
  }, [map, position]);
  return null;
}
