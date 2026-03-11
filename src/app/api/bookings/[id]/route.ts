import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Turn } from "@/types";

// ── PATCH /api/bookings/:id ───────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existing = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "No tenés permiso para editar esta reserva" }, { status: 403 });
  }

  const body = await req.json();
  const { date, turn, apartment } = body as {
    date: string;
    turn: Turn;
    apartment: string;
  };

  // Check slot not taken by another booking
  if (date || turn) {
    const newDate = date ?? existing.date;
    const newTurn = turn ?? existing.turn;
    const conflict = await prisma.booking.findFirst({
      where: { date: newDate, turn: newTurn, NOT: { id: params.id } },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Ese día y turno ya están reservados" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: {
      ...(date && { date }),
      ...(turn && { turn }),
      ...(apartment && { apartment: apartment.toUpperCase() }),
    },
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json(updated);
}

// ── DELETE /api/bookings/:id ──────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existing = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "No tenés permiso para eliminar esta reserva" }, { status: 403 });
  }

  await prisma.booking.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
