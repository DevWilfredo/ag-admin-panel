"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/app-shell";
import { useAuthenticatedUser } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/services/api-errors";
import { hasCapability } from "@/services/authorization";
import {
  createWarehouse,
  deleteWarehouse,
  listWarehouses,
  updateWarehouse,
  type WarehouseDto,
} from "@/services/warehouses-service";
import {
  EmptyTable,
  Modal,
  Notice,
  PageHeading,
  PrimaryButton,
  SecondaryButton,
  formatValue,
  managementHeader,
} from "./management-ui";

const WarehouseLocationPicker = dynamic(
  () =>
    import("./warehouse-location-picker").then(
      (module) => module.WarehouseLocationPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[310px] place-items-center rounded-[9px] border border-[#dedef2] bg-[#f4f7fa] text-[11px] text-[#7b7e86]">
        Loading map…
      </div>
    ),
  },
);

type Coordinates = { latitude?: number; longitude?: number };
type GeocodingResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export function WarehousesClient() {
  const canManage = hasCapability(
    useAuthenticatedUser()?.role,
    "manage:warehouses",
  );
  const [rows, setRows] = useState<WarehouseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<WarehouseDto>();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [expandedId, setExpandedId] = useState<string>();
  const [query, setQuery] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [location, setLocation] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates>({});
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string>();
  const [geocodeResults, setGeocodeResults] = useState<GeocodingResult[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setRows(await listWarehouses());
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const latitude = optionalNumber(data, "latitude");
    const longitude = optionalNumber(data, "longitude");
    if ((latitude === undefined) !== (longitude === undefined)) {
      setError("Provide both latitude and longitude, or leave both empty.");
      return;
    }
    if (
      latitude !== undefined &&
      (latitude < -90 || latitude > 90 || longitude! < -180 || longitude! > 180)
    ) {
      setError("Latitude must be between -90 and 90, and longitude between -180 and 180.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: value(data, "name"),
        location: value(data, "location"),
        latitude,
        longitude,
      };
      if (modal === "edit" && selected)
        await updateWarehouse(selected.id, payload);
      else await createWarehouse(payload);
      setModal(null);
      setNotice(modal === "edit" ? "Warehouse updated." : "Warehouse created.");
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  function openWarehouseModal(mode: "create" | "edit", row?: WarehouseDto) {
    setSelected(row);
    setWarehouseName(row?.name || "");
    setLocation(row?.location || "");
    setAddressQuery(row?.location || "");
    setCoordinates({
      latitude: row?.latitude ?? undefined,
      longitude: row?.longitude ?? undefined,
    });
    setGeocodeError(undefined);
    setGeocodeResults([]);
    setError(undefined);
    setModal(mode);
  }
  async function searchAddress() {
    const search = addressQuery.trim();
    if (!search) {
      setGeocodeError("Enter an address, city, or place to search.");
      return;
    }
    setGeocoding(true);
    setGeocodeError(undefined);
    setGeocodeResults([]);
    try {
      const base =
        process.env.NEXT_PUBLIC_GEOCODING_BASE_URL ||
        "https://nominatim.openstreetmap.org";
      const url = new URL("search", base.endsWith("/") ? base : `${base}/`);
      url.searchParams.set("q", search);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "5");
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Address search failed (${response.status}).`);
      const results = (await response.json()) as GeocodingResult[];
      setGeocodeResults(results);
      if (!results.length)
        setGeocodeError("No matching places found. Try adding the city and country.");
    } catch (reason) {
      setGeocodeError(
        reason instanceof Error
          ? reason.message
          : "The address service is temporarily unavailable.",
      );
    } finally {
      setGeocoding(false);
    }
  }
  function choosePlace(place: GeocodingResult) {
    setLocation(place.display_name);
    setAddressQuery(place.display_name);
    setCoordinates({ latitude: Number(place.lat), longitude: Number(place.lon) });
    setGeocodeResults([]);
    setGeocodeError(undefined);
  }
  async function remove(row: WarehouseDto) {
    if (!window.confirm(`Delete ${row.name}? This action cannot be undone.`))
      return;
    try {
      await deleteWarehouse(row.id);
      setNotice("Warehouse deleted.");
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }
  return (
    <AppShell activeNav="warehouses" header={managementHeader("Warehouses")}>
      <PageHeading
        title="Warehouses"
        description="Manage storage locations and their assigned inventory."
        action={canManage ? (
          <PrimaryButton
            onClick={() => {
              openWarehouseModal("create");
            }}
          >
            New warehouse
          </PrimaryButton>
        ) : undefined}
      />
      {notice ? <Notice message={notice} /> : null}
      <label className="grid max-w-[520px] gap-1.5 text-[11px] font-semibold text-[#585961]">Search warehouses
        <input className="h-10 rounded-[7px] border border-[#dedef2] px-3 text-[12px] outline-none focus:border-[#3971ad]" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or location" />
      </label>
      {error && rows.length ? <Notice error message={error} /> : null}
      {!rows.length ? (
        <EmptyTable
          loading={loading}
          error={error}
          label="warehouses"
          onRetry={load}
        />
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead className="bg-[#f8f9fb] text-[10px] uppercase tracking-wider text-[#85858d]">
                <tr>
                  <th className="px-5 py-3">Warehouse</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Coordinates</th>
                  <th className="px-5 py-3">Inventory</th>
                  {canManage ? (
                    <th className="px-5 py-3 text-right">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.filter((row) => !query || [row.name, row.location].some((value) => value?.toLowerCase().includes(query.toLowerCase()))).map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[#ececee] text-[12px] text-[#515159]"
                  >
                    <td className="px-5 py-4 font-semibold text-[#29292e]">
                      {row.name}
                    </td>
                    <td className="px-5 py-4">{formatValue(row.location)}</td>
                    <td className="px-5 py-4">
                      {row.latitude ?? "—"}, {row.longitude ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <button className="font-semibold text-[#15447c] hover:underline" type="button" onClick={() => setExpandedId((id) => id === row.id ? undefined : row.id)}>
                        {row._count?.inventories ?? row.inventories?.length ?? 0} · {expandedId === row.id ? "Hide" : "View"}
                      </button>
                      {expandedId === row.id ? <div className="mt-2 grid gap-1 rounded-md bg-[#f7f9fb] p-2 text-[11px]">
                        {row.inventories?.length ? row.inventories.map((inventory, index) => <span key={`${row.id}-${index}`}>{inventory.lotId || "Unidentified lot"} · {formatValue(inventory.quantity)} · {inventory.custodyStatus?.replaceAll("_", " ") || "No custody status"}</span>) : <span>Inventory details are not included in this API response.</span>}
                      </div> : null}
                    </td>
                    {canManage ? (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <SecondaryButton
                            onClick={() => {
                              openWarehouseModal("edit", row);
                            }}
                          >
                            Edit
                          </SecondaryButton>
                          <SecondaryButton
                            danger
                            onClick={() => void remove(row)}
                          >
                            Delete
                          </SecondaryButton>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {canManage && modal ? (
        <Modal
          title={modal === "edit" ? "Edit warehouse" : "New warehouse"}
          description="Find an address, place the point on the map, or enter coordinates manually."
          onClose={() => setModal(null)}
        >
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <ControlledField name="name" label="Name" value={warehouseName} onChange={setWarehouseName} required />
            <ControlledField name="location" label="Location" value={location} onChange={setLocation} required placeholder="Street, city, state, country" />
            <div className="sm:col-span-2 grid gap-2 rounded-[9px] border border-[#e5e8ec] bg-[#f8fafc] p-3">
              <label className="grid gap-1.5 text-[11px] font-semibold text-[#585961]">
                Find the location by address
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input aria-label="Address search" value={addressQuery} onChange={(event) => setAddressQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void searchAddress(); } }} placeholder="e.g. Puerto Cabello, Carabobo, Venezuela" className="h-10 min-w-0 flex-1 rounded-[7px] border border-[#dedef2] bg-white px-3 text-[12px] font-normal outline-none focus:border-[#3971ad] focus:ring-3 focus:ring-[#15447c]/10" />
                  <SecondaryButton disabled={geocoding} onClick={() => void searchAddress()}>{geocoding ? "Searching…" : "Search address"}</SecondaryButton>
                </div>
              </label>
              {geocodeError ? <p role="alert" className="text-[11px] text-[#a73640]">{geocodeError}</p> : null}
              {geocodeResults.length ? <div aria-label="Address results" className="overflow-hidden rounded-[7px] border border-[#dfe3e8] bg-white">
                {geocodeResults.map((place) => <button key={place.place_id} type="button" onClick={() => choosePlace(place)} className="block w-full border-b border-[#eceef1] px-3 py-2.5 text-left text-[11px] leading-4 text-[#4d535b] last:border-0 hover:bg-[#eef4fa] hover:text-[#15447c]">{place.display_name}</button>)}
              </div> : null}
              <p className="text-[10px] leading-4 text-[#7b7e86]">Search is only sent when you press the button. Results © OpenStreetMap contributors.</p>
            </div>
            <div className="sm:col-span-2">
              <WarehouseLocationPicker coordinates={coordinates} onChange={(latitude, longitude) => setCoordinates({ latitude, longitude })} />
            </div>
            <ControlledNumberField name="latitude" label="Latitude" value={coordinates.latitude} min={-90} max={90} onChange={(latitude) => setCoordinates((current) => ({ ...current, latitude }))} />
            <ControlledNumberField name="longitude" label="Longitude" value={coordinates.longitude} min={-180} max={180} onChange={(longitude) => setCoordinates((current) => ({ ...current, longitude }))} />
            <div className="sm:col-span-2 flex justify-end gap-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save warehouse"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppShell>
  );
}
function value(data: FormData, key: string) {
  return String(data.get(key) || "").trim();
}
function optionalNumber(data: FormData, key: string) {
  const v = value(data, key);
  return v ? Number(v) : undefined;
}

function ControlledField({
  name,
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[11px] font-semibold text-[#585961]">
      <span>
        {label}
        {required ? <span className="ml-1 text-[#b63d48]">*</span> : null}
      </span>
      <input
        name={name}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className="h-10 min-w-0 rounded-[7px] border border-[#dedef2] bg-white px-3 text-[12px] font-normal outline-none transition placeholder:text-[#aaabb1] focus:border-[#3971ad] focus:ring-3 focus:ring-[#15447c]/10 user-invalid:border-[#ce5963]"
      />
    </label>
  );
}

function ControlledNumberField({
  name,
  label,
  value,
  min,
  max,
  onChange,
}: {
  name: string;
  label: string;
  value?: number;
  min: number;
  max: number;
  onChange: (value?: number) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[11px] font-semibold text-[#585961]">
      <span>{label} <span className="font-normal text-[#92949a]">(optional)</span></span>
      <input
        name={name}
        aria-label={label}
        type="number"
        step="any"
        min={min}
        max={max}
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value === "" ? undefined : event.target.valueAsNumber)
        }
        placeholder={`Enter ${label.toLowerCase()}`}
        className="h-10 min-w-0 appearance-none rounded-[7px] border border-[#dedef2] bg-white px-3 text-[12px] font-normal outline-none transition placeholder:text-[#aaabb1] focus:border-[#3971ad] focus:ring-3 focus:ring-[#15447c]/10 user-invalid:border-[#ce5963] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </label>
  );
}
