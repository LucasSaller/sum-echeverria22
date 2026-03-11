import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavBar from "@/components/NavBar";
import ReportTable from "@/components/ReportTable";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface PageProps {
  searchParams: { mes?: string; anio?: string };
}

export default async function ReportePage({ searchParams }: PageProps) {
  const session = await auth();

  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin = adminEmail && session?.user?.email === adminEmail;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <NavBar session={session} isAdmin={false} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            {session ? "No tenés permiso para ver esta página." : "Iniciá sesión para continuar."}
          </p>
        </main>
      </div>
    );
  }

  const now = new Date();
  const mes = Math.min(12, Math.max(1, parseInt(searchParams.mes ?? String(now.getMonth() + 1))));
  const anio = parseInt(searchParams.anio ?? String(now.getFullYear()));

  const mm = String(mes).padStart(2, "0");
  const yyyy = String(anio);

  // Dates stored as DD/MM/YYYY — filter by /MM/YYYY suffix
  const allBookings = await prisma.booking.findMany({
    include: { user: { select: { name: true } } },
  });

  const monthBookings = allBookings
    .filter((b) => {
      const match = b.date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      return match && match[2] === mm && match[3] === yyyy;
    })
    .map((b) => ({
      id: b.id,
      date: b.date,
      turn: b.turn as string,
      apartment: b.apartment,
      userName: b.user.name,
    }))
    .sort((a, b) => {
      const [da, ma, ya] = a.date.split("/").map(Number);
      const [db, mb, yb] = b.date.split("/").map(Number);
      const diff =
        new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
      if (diff !== 0) return diff;
      return a.turn === "Dia" ? -1 : 1;
    });

  const prevMes = mes === 1 ? 12 : mes - 1;
  const prevAnio = mes === 1 ? anio - 1 : anio;
  const nextMes = mes === 12 ? 1 : mes + 1;
  const nextAnio = mes === 12 ? anio + 1 : anio;

  const monthName = MONTH_NAMES[mes - 1];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <NavBar session={session} isAdmin={true} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Reporte de Uso — SUM
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Edificio Echeverría · Para liquidación de expensas
            </p>
          </div>

          {/* Month navigator */}
          <div className="flex items-center gap-3">
            <Link
              href={`/reporte?mes=${prevMes}&anio=${prevAnio}`}
              className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 min-w-[160px] text-center">
              {monthName} {anio}
            </span>
            <Link
              href={`/reporte?mes=${nextMes}&anio=${nextAnio}`}
              className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>

        <ReportTable bookings={monthBookings} month={monthName} year={anio} />
      </main>
    </div>
  );
}
