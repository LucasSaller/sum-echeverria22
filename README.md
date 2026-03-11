# SUM Echeverría 🏠

App de reservas del Salón de Usos Múltiples construida con el stack moderno.

## Stack

| Tecnología | Uso |
|---|---|
| **Next.js 14** (App Router) | Framework full-stack |
| **TypeScript** | Tipado estático |
| **Tailwind CSS** | Estilos utilitarios |
| **NextAuth v5** | Autenticación con Google |
| **Prisma** | ORM para base de datos |
| **MongoDB** | Base de datos (Atlas free tier) |

## Reglas de negocio

- ☀️ **Solo 2 turnos**: Día (almuerzo 12:00–17:00) y Noche (cena 19:00–00:00)
- 📅 **Máximo 2 reservas por mes** por usuario
- ⏳ **Máximo 1 mes de anticipación** para reservar
- 🔒 Solo el creador puede **editar o eliminar** su reserva

## Setup local

### 1. Clonar e instalar

```bash
git clone <tu-repo>
cd sum-echeverria
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editá `.env.local` con tus valores:

```env
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=          # openssl rand -base64 32
AUTH_GOOGLE_ID=       # Google Cloud Console
AUTH_GOOGLE_SECRET=   # Google Cloud Console
DATABASE_URL=         # MongoDB Atlas connection string
```

### 3. Configurar Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear proyecto → APIs & Services → Credentials
3. OAuth 2.0 Client ID → Web application
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copiar Client ID y Secret al `.env.local`

### 4. Configurar MongoDB

1. Crear cuenta gratuita en [MongoDB Atlas](https://cloud.mongodb.com)
2. Crear cluster gratuito (M0)
3. Crear usuario de DB y obtener connection string
4. Pegarlo en `DATABASE_URL` del `.env.local`

### 5. Inicializar DB y correr

```bash
npm run db:push    # Crea colecciones en MongoDB
npm run dev        # Inicia en http://localhost:3000
```

## Deploy en Vercel

1. Push a GitHub
2. Importar en [Vercel](https://vercel.com)
3. Agregar todas las variables de entorno
4. En Google Console agregar: `https://tu-app.vercel.app/api/auth/callback/google`

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth handler
│   │   └── bookings/            # GET, POST, PATCH, DELETE
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Página principal (Server Component)
├── components/
│   ├── NavBar.tsx               # Header con login/logout Google
│   ├── BookingForm.tsx          # Formulario de reserva
│   └── BookingList.tsx          # Lista con tabs + acciones
├── lib/
│   ├── auth.ts                  # Configuración NextAuth
│   └── prisma.ts                # Cliente Prisma singleton
└── types/
    └── index.ts                 # Tipos compartidos
prisma/
└── schema.prisma                # Modelos de DB
```
