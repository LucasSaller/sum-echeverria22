import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavBar from "@/components/NavBar";
import BookingForm from "@/components/BookingForm";
import BookingList from "@/components/BookingList";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin = !!(adminEmail && session?.user?.email === adminEmail);

  const bookingsRaw = await prisma.booking.findMany({
    include: { user: { select: { name: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Serialise dates for client components
  const bookings = bookingsRaw.map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));

  // Count how many bookings the logged-in user has this month
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());

  const userBookingsThisMonth = session?.user?.id
    ? bookings.filter((b) => {
        const m = b.date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        return (
          m && m[2] === mm && m[3] === yyyy && b.userId === session.user!.id
        );
      }).length
    : 0;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <NavBar session={session} isAdmin={isAdmin} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Reservas del SUM
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Salón de Usos Múltiples · Edificio Echeverría
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          <div className="order-2 lg:order-1">
            <BookingForm
              session={session}
              userBookingsThisMonth={userBookingsThisMonth}
            />
          </div>
          <div className="order-1 lg:order-2">
            <BookingList bookings={bookings} session={session} />
          </div>
        </div>
      </main>
    </div>
  );
}
