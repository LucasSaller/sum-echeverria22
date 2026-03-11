export type Turn = "Dia" | "Noche";

export interface BookingWithUser {
  id: string;
  date: string;
  turn: Turn;
  apartment: string;
  userId: string;
  user: {
    name: string | null;
    image: string | null;
  };
  createdAt: string;
}

export interface CreateBookingPayload {
  date: string;   // DD/MM/YYYY
  turn: Turn;
  apartment: string;
}
