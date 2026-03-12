"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Session } from "next-auth";
import type { BookingWithUser, Turn } from "@/types";
import BookingForm from "./BookingForm";

interface BookingListProps {
  bookings: BookingWithUser[];
  session: Session | null;
}

type Tab = "upcoming" | "past";

const TURN_STYLES: Record<Turn, { label: string; className: string }> = {
  Dia: {
    label: "☀️ Día",
    className:
      "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800",
  },
  Noche: {
    label: "🌙 Noche",
    className:
      "text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950 dark:border-indigo-800",
  },
};

function parseDate(dmy: string): Date {
  const [d, m, y] = dmy.split("/");
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function buildPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  const addPage = (p: number) => { if (!pages.includes(p)) pages.push(p); };
  const addDots = () => { if (pages[pages.length - 1] !== "...") pages.push("..."); };
  addPage(1);
  if (current > 3) addDots();
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) addPage(p);
  if (current < total - 2) addDots();
  addPage(total);
  return pages;
}

function formatDate(dmy: string): string {
  const d = parseDate(dmy);
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ── Delete confirmation modal ───────────────────────────────────────────────
function DeleteModal({
  booking,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  booking: BookingWithUser;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const turnStyle = TURN_STYLES[booking.turn];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6">

        {/* Icon */}
        <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </div>

        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 text-center mb-1">
          Eliminar reserva
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center mb-4">
          Esta acción no se puede deshacer.
        </p>

        {/* Booking summary */}
        <div className="bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-3 mb-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 dark:text-stone-500">Departamento</span>
            <span className="text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 px-2 py-0.5 rounded-md">
              {booking.apartment}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 dark:text-stone-500">Fecha</span>
            <span className="text-xs font-medium text-stone-700 dark:text-stone-300 capitalize">
              {formatDate(booking.date)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 dark:text-stone-500">Turno</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${turnStyle.className}`}>
              {turnStyle.label}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Eliminando…
              </>
            ) : (
              "Eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function BookingList({ bookings, session }: BookingListProps) {
  const router = useRouter();
  const [tab, setTab]                     = useState<Tab>("upcoming");
  const [page, setPage]                   = useState(1);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BookingWithUser | null>(null);
  const PER_PAGE = 8;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const sorted = [...bookings].sort((a, b) => {
    const da = parseDate(a.date).getTime();
    const db = parseDate(b.date).getTime();
    if (da !== db) return da - db;
    return a.turn === "Noche" ? 1 : -1;
  });

  const upcoming = sorted.filter((b) => parseDate(b.date) >= now);
  const past     = sorted.filter((b) => parseDate(b.date) < now).reverse();
  const active   = tab === "upcoming" ? upcoming : past;
  const totalPages = Math.ceil(active.length / PER_PAGE);
  const shown    = active.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const editingBooking = editingId ? bookings.find((b) => b.id === editingId) : null;

  const userBookingsThisMonth = (() => {
    if (!session?.user?.id) return 0;
    const mm   = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    return bookings.filter((b) => {
      const m = b.date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      return m && m[2] === mm && m[3] === yyyy && b.userId === session.user!.id;
    }).length;
  })();

  const doDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDelete(null);
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  // ── Tab button ─────────────────────────────────────────────────────────────
  const TabBtn = ({ value, count }: { value: Tab; count: number }) => (
    <button
      onClick={() => { setTab(value); setPage(1); }}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
        tab === value
          ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm"
          : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
      }`}
    >
      {value === "upcoming" ? "Próximas" : "Pasadas"}
      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
        tab === value
          ? "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300"
          : "bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500"
      }`}>
        {count}
      </span>
    </button>
  );

  return (
    <>
      {/* Delete modal */}
      {confirmDelete && (
        <DeleteModal
          booking={confirmDelete}
          isDeleting={deletingId === confirmDelete.id}
          onConfirm={() => doDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="space-y-4">

        {/* Inline edit panel */}
        {editingId && editingBooking && (
          <div className="bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 rounded-2xl p-1">
            <BookingForm
              session={session}
              userBookingsThisMonth={userBookingsThisMonth}
              editingBooking={{
                id: editingBooking.id,
                date: editingBooking.date,
                turn: editingBooking.turn,
                apartment: editingBooking.apartment,
              }}
              onCancelEdit={() => setEditingId(null)}
            />
          </div>
        )}

        {/* Main card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 py-3 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
            <TabBtn value="upcoming" count={upcoming.length} />
            <TabBtn value="past" count={past.length} />
          </div>

          {/* Table */}
          {shown.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">{tab === "upcoming" ? "🏠" : "📅"}</div>
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
                {tab === "upcoming" ? "No hay reservas próximas" : "No hay reservas pasadas"}
              </p>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_130px_110px_80px] gap-3 px-5 py-2.5 bg-stone-50/80 dark:bg-stone-800/30 border-b border-stone-100 dark:border-stone-800">
                {["Vecino", "Dpto.", "Fecha", "Turno", ""].map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider"
                    style={{ textAlign: i === 4 ? "right" : "left" }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {shown.map((booking) => {
                const isOwner   = session?.user?.id === booking.userId;
                const turnStyle = TURN_STYLES[booking.turn];
                const isDeleting = deletingId === booking.id;
                const isEditing  = editingId === booking.id;

                return (
                  <div
                    key={booking.id}
                    className={`group sm:grid sm:grid-cols-[1fr_80px_130px_110px_80px] gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors ${
                      isEditing ? "bg-brand-50/50 dark:bg-brand-950/30" : ""
                    }`}
                  >
                    {/* ── Mobile layout ─────────────────────────────────── */}
                    <div className="sm:hidden flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {booking.user.image ? (
                          <Image
                            src={booking.user.image}
                            alt={booking.user.name ?? ""}
                            width={32}
                            height={32}
                            className="rounded-full shrink-0 ring-1 ring-stone-200 dark:ring-stone-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 shrink-0 flex items-center justify-center text-xs font-bold text-stone-500 dark:text-stone-400">
                            {booking.user.name?.[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                              {booking.user.name}
                            </span>
                            {isOwner && (
                              <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 px-1.5 py-0.5 rounded-full shrink-0">
                                Vos
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 px-1.5 py-0.5 rounded-md">
                              {booking.apartment}
                            </span>
                            <span className="text-xs text-stone-500 dark:text-stone-400 capitalize">
                              {formatDate(booking.date)}
                            </span>
                            <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border ${turnStyle.className}`}>
                              {turnStyle.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOwner && tab === "upcoming" && (
                          <>
                            <button
                              onClick={() => setEditingId(isEditing ? null : booking.id)}
                              className={`p-1.5 rounded-md border transition-all ${
                                isEditing
                                  ? "border-brand-400 text-brand-600 bg-brand-50 dark:bg-brand-950"
                                  : "border-stone-200 dark:border-stone-700 text-stone-400 hover:border-amber-400 hover:text-amber-600 dark:hover:border-amber-700 dark:hover:text-amber-400"
                              }`}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setConfirmDelete(booking)}
                              disabled={isDeleting}
                              className="p-1.5 rounded-md border border-stone-200 dark:border-stone-700 text-stone-400 hover:border-red-400 hover:text-red-500 dark:hover:border-red-700 dark:hover:text-red-400 transition-all disabled:opacity-50"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14H6L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4h6v2"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Desktop columns ─────────────────────────────── */}
                    <div className="hidden sm:flex items-center gap-2.5 min-w-0">
                      {booking.user.image ? (
                        <Image
                          src={booking.user.image}
                          alt={booking.user.name ?? ""}
                          width={26}
                          height={26}
                          className="rounded-full shrink-0 ring-1 ring-stone-200 dark:ring-stone-700"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 shrink-0 flex items-center justify-center text-[10px] font-bold text-stone-500">
                          {booking.user.name?.[0]}
                        </div>
                      )}
                      <span className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                        {booking.user.name}
                      </span>
                      {isOwner && (
                        <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 px-1.5 py-0.5 rounded-full shrink-0">
                          Vos
                        </span>
                      )}
                    </div>

                    <div className="hidden sm:block">
                      <span className="inline-flex items-center text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 px-2 py-0.5 rounded-md">
                        {booking.apartment}
                      </span>
                    </div>

                    <div className="hidden sm:block">
                      <span className="text-sm text-stone-600 dark:text-stone-300 capitalize">
                        {formatDate(booking.date)}
                      </span>
                    </div>

                    <div className="hidden sm:block">
                      <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full border ${turnStyle.className}`}>
                        {turnStyle.label}
                      </span>
                    </div>

                    <div className="hidden sm:flex items-center justify-end gap-1.5">
                      {isOwner && tab === "upcoming" && (
                        <>
                          <button
                            onClick={() => setEditingId(isEditing ? null : booking.id)}
                            className={`p-1.5 rounded-md border transition-all ${
                              isEditing
                                ? "border-brand-400 text-brand-600 bg-brand-50 dark:bg-brand-950"
                                : "border-stone-200 dark:border-stone-700 text-stone-400 hover:border-amber-400 hover:text-amber-600 dark:hover:border-amber-700 dark:hover:text-amber-400"
                            }`}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setConfirmDelete(booking)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-md border border-stone-200 dark:border-stone-700 text-stone-400 hover:border-red-400 hover:text-red-500 dark:hover:border-red-700 dark:hover:text-red-400 transition-all disabled:opacity-50"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 px-5 py-4 border-t border-stone-100 dark:border-stone-800">
              {buildPages(page, totalPages).map((p, i) =>
                p === "..." ? (
                  <span
                    key={`dots-${i}`}
                    className="w-8 h-8 flex items-center justify-center text-stone-400 dark:text-stone-500 text-sm select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      page === p
                        ? "bg-brand-600 text-white"
                        : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
