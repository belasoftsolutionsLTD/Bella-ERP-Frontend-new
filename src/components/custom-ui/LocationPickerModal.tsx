'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { X, Search, Loader2, MapPin } from 'lucide-react';

// Leaflet touches `window` at import time (feature detection) and breaks under Next's
// server render — the standard fix is a client-only dynamic import with ssr:false,
// scoped to just this one interactive picker rather than the whole page.
const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="h-[320px] w-full rounded-xl bg-slate-100 animate-pulse" />,
});

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

// Free OpenStreetMap geocoding (search box + reverse-on-click) — no API key, no billing
// account. Used anywhere a route stop / delivery location needs a real pinned point
// instead of a free-typed address nobody can actually navigate to.
export function LocationPickerModal({
  initialAddress, initialLat, initialLng, onClose, onConfirm,
}: {
  initialAddress?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onClose: () => void;
  onConfirm: (location: { address: string; lat: number; lng: number }) => void;
}) {
  const [query, setQuery] = useState(initialAddress || '');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [address, setAddress] = useState(initialAddress || '');
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`);
        const data: NominatimResult[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const pickResult = (r: NominatimResult) => {
    setLat(parseFloat(r.lat));
    setLng(parseFloat(r.lon));
    setAddress(r.display_name);
    setQuery(r.display_name);
    setResults([]);
  };

  const pickOnMap = async (pickedLat: number, pickedLng: number) => {
    setLat(pickedLat);
    setLng(pickedLng);
    setReverseGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pickedLat}&lon=${pickedLng}`);
      const data = await res.json();
      if (data?.display_name) {
        setAddress(data.display_name);
        setQuery(data.display_name);
      }
    } catch {
      // Pin still lands even if reverse-geocoding fails — address stays editable below.
    } finally {
      setReverseGeocoding(false);
    }
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const confirm = () => {
    if (lat == null || lng == null || !address.trim()) return;
    onConfirm({ address: address.trim(), lat, lng });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-primary" /> Pick a location</p>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
            placeholder="Search for an address…"
            className="h-9 w-full pl-8 pr-3 border border-slate-200 rounded-lg text-sm"
          />
          {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 animate-spin" />}
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pickResult(r)}
                  className="block w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <LocationPickerMap lat={lat} lng={lng} onPick={pickOnMap} />
        <p className="text-[11px] text-slate-400">Search above, or click anywhere on the map to drop a pin.</p>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Address {reverseGeocoding && '(looking up…)'}</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Confirm or edit the address"
            className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">Cancel</button>
          <button
            onClick={confirm}
            disabled={lat == null || lng == null || !address.trim()}
            className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50"
          >
            Use this location
          </button>
        </div>
      </div>
    </div>
  );
}
