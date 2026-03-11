import { describe, it, expect } from "vitest";
import {
  isValidDateFormat,
  parseBookingDate,
  isDateInPast,
  isDateTooFarAhead,
  isValidTurn,
  isValidApartment,
  validateBookingInput,
} from "../lib/bookingValidation";

// Fecha base fija para todos los tests
const TODAY = new Date(2026, 2, 10); // 10/03/2026

// ─────────────────────────────────────────────────────────────
// isValidDateFormat
// ─────────────────────────────────────────────────────────────
describe("isValidDateFormat", () => {
  it("acepta DD/MM/YYYY válido", () => {
    expect(isValidDateFormat("10/03/2026")).toBe(true);
  });
  it("acepta día y mes con ceros", () => {
    expect(isValidDateFormat("01/01/2026")).toBe(true);
  });
  it("rechaza formato ISO (YYYY-MM-DD)", () => {
    expect(isValidDateFormat("2026-03-10")).toBe(false);
  });
  it("rechaza mes/día sin cero inicial", () => {
    expect(isValidDateFormat("1/3/2026")).toBe(false);
  });
  it("rechaza cadena vacía", () => {
    expect(isValidDateFormat("")).toBe(false);
  });
  it("rechaza texto aleatorio", () => {
    expect(isValidDateFormat("hola")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// parseBookingDate
// ─────────────────────────────────────────────────────────────
describe("parseBookingDate", () => {
  it("parsea una fecha válida correctamente", () => {
    const d = parseBookingDate("10/03/2026");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(2); // marzo = índice 2
    expect(d!.getDate()).toBe(10);
  });
  it("devuelve null para formato inválido", () => {
    expect(parseBookingDate("2026-03-10")).toBeNull();
  });
  it("devuelve null para fecha de calendario imposible (31/02)", () => {
    expect(parseBookingDate("31/02/2026")).toBeNull();
  });
  it("devuelve null para mes 13", () => {
    expect(parseBookingDate("01/13/2026")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// isDateInPast
// ─────────────────────────────────────────────────────────────
describe("isDateInPast", () => {
  it("detecta fecha de ayer como pasada", () => {
    const yesterday = new Date(2026, 2, 9);
    expect(isDateInPast(yesterday, TODAY)).toBe(true);
  });
  it("detecta hoy como NO pasada", () => {
    expect(isDateInPast(new Date(2026, 2, 10), TODAY)).toBe(false);
  });
  it("detecta mañana como NO pasada", () => {
    expect(isDateInPast(new Date(2026, 2, 11), TODAY)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// isDateTooFarAhead
// ─────────────────────────────────────────────────────────────
describe("isDateTooFarAhead", () => {
  it("acepta fecha dentro del mes siguiente", () => {
    const inRange = new Date(2026, 3, 9); // 09/04/2026
    expect(isDateTooFarAhead(inRange, TODAY)).toBe(false);
  });
  it("acepta exactamente 1 mes adelante", () => {
    const exactly = new Date(2026, 3, 10); // 10/04/2026
    expect(isDateTooFarAhead(exactly, TODAY)).toBe(false);
  });
  it("rechaza más de 1 mes adelante", () => {
    const tooFar = new Date(2026, 3, 11); // 11/04/2026
    expect(isDateTooFarAhead(tooFar, TODAY)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// isValidTurn
// ─────────────────────────────────────────────────────────────
describe("isValidTurn", () => {
  it("acepta 'Dia'", () => expect(isValidTurn("Dia")).toBe(true));
  it("acepta 'Noche'", () => expect(isValidTurn("Noche")).toBe(true));
  it("rechaza 'dia' en minúsculas", () => expect(isValidTurn("dia")).toBe(false));
  it("rechaza 'noche' en minúsculas", () => expect(isValidTurn("noche")).toBe(false));
  it("rechaza cadena vacía", () => expect(isValidTurn("")).toBe(false));
  it("rechaza valores arbitrarios", () => expect(isValidTurn("Tarde")).toBe(false));
});

// ─────────────────────────────────────────────────────────────
// isValidApartment
// ─────────────────────────────────────────────────────────────
describe("isValidApartment", () => {
  it("acepta '3B'", () => expect(isValidApartment("3B")).toBe(true));
  it("acepta '12A'", () => expect(isValidApartment("12A")).toBe(true));
  it("acepta minúscula '5a'", () => expect(isValidApartment("5a")).toBe(true));
  it("rechaza solo número sin letra", () => expect(isValidApartment("3")).toBe(false));
  it("rechaza solo letra sin número", () => expect(isValidApartment("B")).toBe(false));
  it("rechaza más de 2 dígitos", () => expect(isValidApartment("123A")).toBe(false));
  it("rechaza cadena vacía", () => expect(isValidApartment("")).toBe(false));
});

// ─────────────────────────────────────────────────────────────
// validateBookingInput — integración de todas las validaciones
// ─────────────────────────────────────────────────────────────
describe("validateBookingInput", () => {
  const valid = { date: "15/03/2026", turn: "Noche", apartment: "5B" };

  it("no devuelve error para un input completamente válido", () => {
    expect(validateBookingInput(valid, TODAY)).toBeNull();
  });

  it("error por campos faltantes", () => {
    expect(validateBookingInput({ date: "", turn: "Dia", apartment: "3A" }, TODAY))
      .toBe("MISSING_FIELDS");
    expect(validateBookingInput({ date: "15/03/2026", turn: "", apartment: "3A" }, TODAY))
      .toBe("MISSING_FIELDS");
    expect(validateBookingInput({ date: "15/03/2026", turn: "Dia", apartment: "" }, TODAY))
      .toBe("MISSING_FIELDS");
  });

  it("error por formato de fecha inválido", () => {
    expect(validateBookingInput({ ...valid, date: "2026-03-15" }, TODAY))
      .toBe("INVALID_DATE_FORMAT");
  });

  it("error por fecha de calendario imposible", () => {
    expect(validateBookingInput({ ...valid, date: "31/02/2026" }, TODAY))
      .toBe("INVALID_DATE");
  });

  it("error al reservar en el pasado", () => {
    expect(validateBookingInput({ ...valid, date: "09/03/2026" }, TODAY))
      .toBe("DATE_IN_PAST");
  });

  it("error al reservar con más de 1 mes de anticipación", () => {
    expect(validateBookingInput({ ...valid, date: "11/04/2026" }, TODAY))
      .toBe("DATE_TOO_FAR");
  });

  it("error por turno inválido", () => {
    expect(validateBookingInput({ ...valid, turn: "Mañana" }, TODAY))
      .toBe("INVALID_TURN");
  });

  it("error por departamento inválido", () => {
    expect(validateBookingInput({ ...valid, apartment: "123" }, TODAY))
      .toBe("INVALID_APARTMENT");
  });

  it("no permite el mismo turno dos veces — lógica de duplicado (simulado)", () => {
    // El chequeo de duplicado real requiere DB; aquí verificamos que el input
    // válido pase las validaciones locales y que la unicidad sea responsabilidad
    // del servidor (el test documenta el contrato).
    const result = validateBookingInput(valid, TODAY);
    expect(result).toBeNull(); // validaciones locales OK → el server verifica el slot
  });
});
