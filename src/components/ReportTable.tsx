"use client";

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

export default function ReportTable({ bookings, month, year }: ReportTableProps) {
  const downloadCSV = () => {
    const headers = ["Departamento", "Nombre", "Fecha", "Turno"];
    const rows = bookings.map((b) => [
      b.apartment,
      b.userName ?? "-",
      b.date,
      b.turn === "Dia" ? "Día" : "Noche",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    // BOM so Excel opens with correct encoding
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-sum-${month.toLowerCase()}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const byApartment = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.apartment] = (acc[b.apartment] ?? 0) + 1;
    return acc;
  }, {});

  const diaCount = bookings.filter((b) => b.turn === "Dia").length;
  const nocheCount = bookings.filter((b) => b.turn === "Noche").length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-xs text-stone-500 dark:text-stone-400">Total usos</p>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            {bookings.length}
          </p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-xs text-stone-500 dark:text-stone-400">Turnos día</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{diaCount}</p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-xs text-stone-500 dark:text-stone-400">Turnos noche</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {nocheCount}
          </p>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-xs text-stone-500 dark:text-stone-400">Deptos distintos</p>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            {Object.keys(byApartment).length}
          </p>
        </div>
      </div>

      {/* Table header + export */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Detalle de reservas
        </h2>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors font-medium"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      {bookings.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-10 text-center">
          <p className="text-stone-400 dark:text-stone-500 text-sm">
            No hay reservas en este mes.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Depto
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Turno
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-stone-900 dark:text-stone-100">
                    {b.apartment}
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                    {b.userName ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{b.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        b.turn === "Dia"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                      }`}
                    >
                      {b.turn === "Dia" ? "Día" : "Noche"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Per-apartment breakdown */}
      {Object.keys(byApartment).length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Resumen por departamento
            </h3>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {Object.entries(byApartment)
              .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
              .map(([apt, count]) => (
                <div key={apt} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    Depto {apt}
                  </span>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    {count} uso{count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
