"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

export type MapCoordinate = {
  latitude: number;
  longitude: number;
  label?: string;
  timestamp?: string;
};

export function TransactionMap({
  current,
  history = [],
  vesselName,
}: {
  current: MapCoordinate;
  history?: MapCoordinate[];
  vesselName: string;
}) {
  const route = [...history, current].filter(
    (point, index, items) =>
      index === 0 ||
      point.latitude !== items[index - 1].latitude ||
      point.longitude !== items[index - 1].longitude,
  );
  const bounds = route.map(
    (point) => [point.latitude, point.longitude] as [number, number],
  );
  return (
    <MapContainer
      center={[current.latitude, current.longitude]}
      zoom={7}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitRoute bounds={bounds} />
      {route.length > 1 ? (
        <Polyline
          positions={bounds}
          pathOptions={{ color: "#15447c", weight: 3, opacity: 0.85 }}
        />
      ) : null}
      {history.map((point, index) => (
        <CircleMarker
          key={`${point.latitude}-${point.longitude}-${index}`}
          center={[point.latitude, point.longitude]}
          radius={4}
          pathOptions={{
            color: "#fff",
            fillColor: "#3971ad",
            fillOpacity: 0.85,
            weight: 1,
          }}
        >
          <Tooltip>{point.label || `Tracked position ${index + 1}`}</Tooltip>
        </CircleMarker>
      ))}
      <CircleMarker
        center={[current.latitude, current.longitude]}
        radius={9}
        pathOptions={{
          color: "#fff",
          fillColor: "#001c42",
          fillOpacity: 1,
          weight: 3,
        }}
      >
        <Popup>
          <strong>{vesselName}</strong>
          <br />
          {current.label || "Current position"}
          <br />
          {current.latitude.toFixed(5)}, {current.longitude.toFixed(5)}
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}

function FitRoute({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 1)
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 9 });
    else if (bounds[0]) map.setView(bounds[0], 7);
  }, [bounds, map]);
  return null;
}
