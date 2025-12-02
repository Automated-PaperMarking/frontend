import React, { useEffect, useState } from "react";

interface Props {
  startIso?: string;
  endIso?: string;
  onChange: (startIso?: string, endIso?: string) => void;
}

function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

function toLocalInputValueFromISO(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  // build yyyy-mm-ddThh:mm
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function localInputToOffsetISO(localValue: string) {
  if (!localValue) return undefined;
  // localValue is like '2025-12-01T10:00'
  const d = new Date(localValue);

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const offHours = pad(Math.floor(Math.abs(offsetMin) / 60));
  const offMins = pad(Math.abs(offsetMin) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offHours}:${offMins}`;
}

export default function DateTimeRange({ startIso, endIso, onChange }: Props) {
  const [startLocal, setStartLocal] = useState( toLocalInputValueFromISO(startIso) );
  const [endLocal, setEndLocal] = useState( toLocalInputValueFromISO(endIso) );

  useEffect(() => {
    setStartLocal(toLocalInputValueFromISO(startIso));
  }, [startIso]);

  useEffect(() => {
    setEndLocal(toLocalInputValueFromISO(endIso));
  }, [endIso]);

  useEffect(() => {
    const s = localInputToOffsetISO(startLocal);
    const e = localInputToOffsetISO(endLocal);
    onChange(s, e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLocal, endLocal]);

  const exampleStart = startLocal ? localInputToOffsetISO(startLocal) : localInputToOffsetISO(new Date().toISOString().slice(0,16));
  const exampleEnd = endLocal ? localInputToOffsetISO(endLocal) : undefined;

  return (
    <div className="space-y-2">
      <div className="grid sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-sm">Start time</label>
          <input
            type="datetime-local"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm">End time</label>
          <input
            type="datetime-local"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
