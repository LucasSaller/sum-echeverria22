"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import type { Turn } from "@/types";
import DatePicker from "./DatePicker";

interface BookingFormProps {
  session: Session | null;
  userBookingsThisMonth: number;
  editingBooking?: {
    id: string;
    date: string;   // DD/MM/YYYY
    turn: Turn;
    apartment: string;
  } | null;
  onCancelEdit?: () => void;
}

const TURNS: { value: Turn; label: string; desc: string }[] = [
  { value: "Dia",   label: "☀️ Día",   desc: "Almuerzo · 12:00 – 17:00" },
  { value: "Noche", label: "🌙 Noche", desc: "Cena · 19:00 – 00:00" },
];

// Convert DD/MM/YYYY → YYYY-MM-DD for <input type="date">
function toInputDate(dmy: string) {
  const [d, m, y] = dmy.split("/");
  return `${y}-${m}-${d}`;
}

// Convert YYYY-MM-DD → DD/MM/YYYY for API
function toDisplayDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function BookingForm({
  session,
  userBookingsThisMonth,
  editingBooking,
  onCancelEdit,
}: BookingFormProps) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const maxDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  })();

  const [apartment, setApartment] = useState(editingBooking?.apartment ?? "");
  const [date, setDate]           = useState(editingBooking ? toInputDate(editingBooking.date) : today);
  const [turn, setTurn]           = useState<Turn | "">(editingBooking?.turn ?? "");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);

  const isEditing = !!editingBooking;
  const remainingThisMonth = 3 - userBookingsThisMonth;
  const limitReached = !isEditing && remainingThisMonth <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!apartment.trim() || !date || !turn) {
      setError("Completá todos los campos.");
      return;
    }

    setLoading(true);
    try {
      const url    = isEditing ? `/api/bookings/${editingBooking!.id}` : "/api/bookings";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: toDisplayDate(date), turn, apartment }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error.");
      } else {
        setSuccess(isEditing ? "Reserva actualizada ✓" : "Reserva creada ✓");
        if (!isEditing) {
          setApartment("");
          setDate(today);
          setTurn("");
        } else {
          onCancelEdit?.();
        }
        router.refresh();
      }
    } catch {
      setError("Error de red. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-7 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2a5bd7" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Iniciá sesión para reservar
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          Usá tu cuenta de Google para crear y gestionar tus reservas del SUM.
        </p>
        {/* Price highlight */}
        <div className="mt-4 mx-auto w-fit flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">$&nbsp;20.000</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-500">por turno</span>
        </div>

        <ul className="mt-3 space-y-1.5 text-xs text-stone-400 dark:text-stone-500 text-left w-fit mx-auto">
          <li className="flex items-center gap-2">
            <span className="text-amber-500">☀️</span>
            Turno día: almuerzo (12:00 – 17:00)
          </li>
          <li className="flex items-center gap-2">
            <span>🌙</span>
            Turno noche: cena (19:00 – 00:00)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-brand-500">📅</span>
            Máximo 3 reservas por mes
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Solo podés reservar hasta 1 mes adelante
          </li>
        </ul>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm sticky top-20">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          {isEditing ? "✏️ Editar reserva" : "Nueva reserva"}
        </h2>
        {!isEditing && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            limitReached
              ? "text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
              : "text-stone-500 bg-stone-100 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700"
          }`}>
            {limitReached
              ? "Sin turnos este mes"
              : `${remainingThisMonth} turno${remainingThisMonth !== 1 ? "s" : ""} disponible${remainingThisMonth !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Apartment */}
        <div>
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
            Departamento
          </label>
          <input
            type="text"
            placeholder="Ej: 3B"
            value={apartment}
            onChange={(e) => setApartment(e.target.value.toUpperCase())}
            pattern="[0-9]{1,2}[a-zA-Z]"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
            Fecha
          </label>
          <DatePicker value={date} min={today} max={maxDate} onChange={setDate} />
        </div>

        {/* Turn selector */}
        <div>
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
            Turno
          </label>
          <div className="space-y-2">
            {TURNS.map((t) => {
              const selected = turn === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTurn(t.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    selected
                      ? t.value === "Dia"
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-950 dark:border-amber-700"
                        : "border-indigo-400 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-700"
                      : "border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600"
                  }`}
                >
                  <div className="flex-1">
                    <span className={`text-sm font-semibold ${
                      selected
                        ? t.value === "Dia"
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-indigo-700 dark:text-indigo-400"
                        : "text-stone-700 dark:text-stone-300"
                    }`}>
                      {t.label}
                    </span>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{t.desc}</p>
                  </div>
                  {selected && (
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke={t.value === "Dia" ? "#d97706" : "#6366f1"}
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {success}
          </div>
        )}

        {/* Price reminder */}
        {!isEditing && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs text-emerald-600 dark:text-emerald-500">Costo por turno</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">$ 20.000</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading || limitReached}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-700 disabled:bg-stone-200 dark:disabled:bg-stone-800 disabled:text-stone-400 disabled:cursor-not-allowed text-white transition-colors shadow-sm"
          >
            {loading ? "Guardando…" : isEditing ? "Guardar cambios" : "Reservar"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2.5 rounded-lg text-sm border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
