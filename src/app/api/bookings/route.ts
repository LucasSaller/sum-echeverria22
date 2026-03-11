import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Turn } from "@/types";

// ── GET /api/bookings ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json({ error: "Error al obtener reservas" }, { status: 500 });
  }
}

// ── POST /api/bookings ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { date, turn, apartment } = body as {
    date: string;
    turn: Turn;
    apartment: string;
  };

  // --- Validations ---
  if (!date || !turn || !apartment?.trim()) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  // Validate date format DD/MM/YYYY
  const dateMatch = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!dateMatch) {
    return NextResponse.json({ error: "Formato de fecha inválido" }, { status: 400 });
  }

  const [, dd, mm, yyyy] = dateMatch;
  const bookingDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 1);

  if (bookingDate < today) {
    return NextResponse.json({ error: "No podés reservar en el pasado" }, { status: 400 });
  }
  if (bookingDate > maxDate) {
    return NextResponse.json(
      { error: "No podés reservar con más de 1 mes de anticipación" },
      { status: 400 }
    );
  }

  // Validate turn
  if (turn !== "Dia" && turn !== "Noche") {
    return NextResponse.json({ error: "Turno inválido" }, { status: 400 });
  }

  // Check if slot already taken
  const slotTaken = await prisma.booking.findFirst({
    where: { date, turn },
  });
  if (slotTaken) {
    return NextResponse.json(
      { error: "Ese día y turno ya están reservados" },
      { status: 409 }
    );
  }

  // Check user's 2 bookings/month limit
  const [monthStr, yearStr] = [mm, yyyy];
  const allBookingsThisMonth = await prisma.booking.findMany({
    where: { userId: session.user.id },
  });
  const userBookingsThisMonth = allBookingsThisMonth.filter((b) => {
    const m = b.date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m && m[2] === monthStr && m[3] === yearStr;
  });
  if (userBookingsThisMonth.length >= 3) {
    return NextResponse.json(
      { error: "Ya tenés 3 reservas este mes. No podés hacer más." },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      date,
      turn,
      apartment: apartment.toUpperCase(),
      userId: session.user.id,
    },
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json(booking, { status: 201 });
}
