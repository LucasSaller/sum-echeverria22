// Validation logic extracted from the API so it can be unit-tested independently.

export function isValidDateFormat(date: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(date);
}

export function parseBookingDate(date: string): Date | null {
  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  // Reject invalid calendar dates (e.g. 31/02/2026)
  if (
    d.getFullYear() !== Number(yyyy) ||
    d.getMonth() !== Number(mm) - 1 ||
    d.getDate() !== Number(dd)
  ) {
    return null;
  }
  return d;
}

export function isDateInPast(bookingDate: Date, today: Date): boolean {
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  return bookingDate < t;
}

export function isDateTooFarAhead(bookingDate: Date, today: Date): boolean {
  const max = new Date(today);
  max.setHours(0, 0, 0, 0);
  max.setMonth(max.getMonth() + 1);
  return bookingDate > max;
}

export function isValidTurn(turn: string): turn is "Dia" | "Noche" {
  return turn === "Dia" || turn === "Noche";
}

export function isValidApartment(apartment: string): boolean {
  return /^[0-9]{1,2}[a-zA-Z]$/i.test(apartment.trim());
}

export type BookingValidationError =
  | "MISSING_FIELDS"
  | "INVALID_DATE_FORMAT"
  | "INVALID_DATE"
  | "DATE_IN_PAST"
  | "DATE_TOO_FAR"
  | "INVALID_TURN"
  | "INVALID_APARTMENT";

export interface BookingInput {
  date: string;
  turn: string;
  apartment: string;
}

/** Returns the first validation error found, or null if everything is OK. */
export function validateBookingInput(
  input: BookingInput,
  today: Date
): BookingValidationError | null {
  const { date, turn, apartment } = input;

  if (!date?.trim() || !turn?.trim() || !apartment?.trim()) return "MISSING_FIELDS";
  if (!isValidDateFormat(date)) return "INVALID_DATE_FORMAT";

  const parsed = parseBookingDate(date);
  if (!parsed) return "INVALID_DATE";
  if (isDateInPast(parsed, today)) return "DATE_IN_PAST";
  if (isDateTooFarAhead(parsed, today)) return "DATE_TOO_FAR";
  if (!isValidTurn(turn)) return "INVALID_TURN";
  if (!isValidApartment(apartment)) return "INVALID_APARTMENT";

  return null;
}
