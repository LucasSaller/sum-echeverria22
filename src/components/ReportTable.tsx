"use client";

import { useState, useEffect } from "react";

export interface ReportBooking {
  id: string;
  date: string;
  turn: string;
  apartment: string;
  userName: string | null;
}

interface ReportTableProps {
  bookings: ReportBooking[];
  month: string;
  year: number;
}

function formatMoney(n: number) {
  return "$\u00a0" + n.toLocaleString("es-AR");
}

export default function ReportTable({ bookings, month, year }: ReportTableProps) {
  const [pricePerUse, setPricePerUse] = useState(5000);

  useEffect(() => {
    const saved = localStorage.getItem("sum-price-per-use");
    if (saved) setPricePerUse(Number(saved));
  }, []);

  const handlePriceChange = (v: number) => {
    setPricePerUse(v);
    localStorage.setItem("sum-price-per-use", String(v));
  };

  // Group by apartment
  const byApartment = bookings.reduce<Record<string, ReportBooking[]>>((acc, b) => {
    if (!acc[b.apartment]) acc[b.apartment] = [];
    acc[b.apartment].push(b);
    return acc;
  }, {});

  const sortedApts = Object.keys(byApartment).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const totalUses = bookings.length;
  const totalAmount = totalUses * pricePerUse;

  const downloadCSV = () => {
    const headers = ["Departamento", "Nombre", "Fecha", "Turno", "Usos del mes", "Total a cobrar"];
    const rows = sortedApts.map((apt) => {
      const uses = byApartment[apt];
      return [
        apt,
        uses[0].userName ?? "-",
        uses.map((b) => `${b.date} (${b.turn === "Dia" ? "Día" : "Noche"})`).join(" | "),
        "",
        uses.length,
        uses.length * pricePerUse,
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-sum-${month.toLowerCase()}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* Price config + totals */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <label className="text-sm text-stone-600 dark:text-stone-400 whitespace-nowrap">
            Precio por uso:
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-stone-500 dark:text-stone-400">$</span>
            <input
              type="number"
              min={0}
              step={500}
              value={pricePerUse}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              className="w-28 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <span className="text-xs text-stone-400 dark:text-stone-500">por turno</span>
        </div>

        <div className="flex items-center gap-6 sm:border-l sm:border-stone-200 sm:dark:border-stone-700 sm:pl-4">
          <div className="text-center">
            <p className="text-xs text-stone-500 dark:text-stone-400">Total usos</p>
            <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{totalUses}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-stone-500 dark:text-stone-400">A recaudar</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatMoney(totalAmount)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-stone-500 dark:text-stone-400">Deptos</p>
            <p className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {sortedApts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Per-apartment breakdown */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Cobro por departamento
        </h2>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-10 text-center">
          <p className="text-stone-400 dark:text-stone-500 text-sm">
            No hay reservas en este mes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedApts.map((apt) => {
            const uses = byApartment[apt];
            const total = uses.length * pricePerUse;
            return (
              <div
                key={apt}
                className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Depto {apt}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      · {uses[0].userName ?? "-"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(total)}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 ml-1.5">
                      ({uses.length} uso{uses.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                </div>

                {/* Uses list */}
                <div className="divide-y divide-stone-50 dark:divide-stone-800/60">
                  {uses.map((b) => (
                    <div key={b.id} className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm text-stone-600 dark:text-stone-400">{b.date}</span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            b.turn === "Dia"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                              : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                          }`}
                        >
                          {b.turn === "Dia" ? "Día" : "Noche"}
                        </span>
                        <span className="text-xs text-stone-400 dark:text-stone-500 w-20 text-right">
                          {formatMoney(pricePerUse)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grand total row */}
      {bookings.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Total a recaudar — {month} {year}
          </span>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            {formatMoney(totalAmount)}
          </span>
        </div>
      )}
    </div>
  );
}
