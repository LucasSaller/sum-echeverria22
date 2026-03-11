// prisma/seed.js
// Poblar la DB con usuarios y reservas de prueba.
// Uso: node prisma/seed.js

// Cargar .env.local manualmente (Next.js no lo expone a scripts externos)
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*"?([^"]*)"?\s*$/);
    if (match) process.env[match[1]] = match[2];
  }
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const FAKE_USERS = [
  { name: "María García",      email: "maria.garcia@vecino.test" },
  { name: "Juan López",        email: "juan.lopez@vecino.test" },
  { name: "Ana Martínez",      email: "ana.martinez@vecino.test" },
  { name: "Carlos Rodríguez",  email: "carlos.rodriguez@vecino.test" },
  { name: "Laura Fernández",   email: "laura.fernandez@vecino.test" },
];

const APARTMENTS = ["1A","2B","3C","4D","5A","6B","7C","8D","9A","10B","11C","12A"];

function formatDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear());
  return `${d}/${m}/${y}`;
}

async function main() {
  console.log("🌱 Iniciando seed...");

  // Upsert usuarios de prueba
  const users = [];
  for (const u of FAKE_USERS) {
    const user = await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { name: u.name, email: u.email },
    });
    users.push(user);
    console.log(`  ✓ Usuario: ${user.name}`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── 50 reservas PASADAS ──────────────────────────────────────────────────────
  // Generamos slots día a día hacia atrás (2 por día: Dia y Noche)
  let pastCreated = 0;
  let daysBack = 1;

  while (pastCreated < 50) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysBack);
    const dateStr = formatDate(d);

    for (const turn of ["Dia", "Noche"]) {
      if (pastCreated >= 50) break;

      const existing = await prisma.booking.findFirst({ where: { date: dateStr, turn } });
      if (!existing) {
        await prisma.booking.create({
          data: {
            date:      dateStr,
            turn,
            apartment: APARTMENTS[(pastCreated) % APARTMENTS.length],
            userId:    users[pastCreated % users.length].id,
          },
        });
        pastCreated++;
      }
    }
    daysBack++;
  }
  console.log(`  ✓ ${pastCreated} reservas pasadas creadas`);

  // ── 10 reservas PRÓXIMAS ─────────────────────────────────────────────────────
  let upcomingCreated = 0;
  let daysAhead = 1;

  while (upcomingCreated < 10) {
    const d = new Date(today);
    d.setDate(d.getDate() + daysAhead);
    const dateStr = formatDate(d);

    for (const turn of ["Dia", "Noche"]) {
      if (upcomingCreated >= 10) break;

      const existing = await prisma.booking.findFirst({ where: { date: dateStr, turn } });
      if (!existing) {
        await prisma.booking.create({
          data: {
            date:      dateStr,
            turn,
            apartment: APARTMENTS[(upcomingCreated + 3) % APARTMENTS.length],
            userId:    users[(upcomingCreated + 2) % users.length].id,
          },
        });
        upcomingCreated++;
      }
    }
    daysAhead++;
  }
  console.log(`  ✓ ${upcomingCreated} reservas próximas creadas`);

  console.log("✅ Seed completado.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
