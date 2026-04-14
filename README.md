# 🏠 Hogar

Hub doméstico compartido para dos personas. PWA mobile-first con Next.js, Supabase y TypeScript.

## Módulos v1

- **Hoy** — Dashboard con tareas, eventos, compra y balance
- **Tareas** — Puntuales y recurrentes con rotación
- **Compra** — Lista compartida en tiempo real
- **Agenda** — Citas y recordatorios in-app
- **Gastos** — Balance compartido 50/50

## Stack

| Tecnología | Uso |
|---|---|
| Next.js 14 (App Router) | Framework frontend |
| TypeScript | Tipado estricto |
| Tailwind CSS | Estilos |
| shadcn/ui + Radix | Componentes UI |
| Supabase | Auth, DB, Realtime |
| TanStack Query | Fetching y caché |
| React Hook Form + Zod | Formularios y validación |
| vaul | Bottom sheets |
| Vercel | Deploy |

## Inicio rápido

### 1. Clonar y dependencias

```bash
git clone <repo>
cd hogar
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a SQL Editor y ejecuta el contenido de `supabase/migrations/001_initial_schema.sql`
3. En Authentication → URL Configuration, añade `http://localhost:3000` como Redirect URL
4. En Authentication → Email Templates, personaliza el template de magic link si lo deseas

### 3. Variables de entorno

Copia `.env.local.example` a `.env.local` y rellena:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Encuentra estos valores en Supabase → Settings → API.

### 4. Habilitar Realtime

En Supabase → Database → Replication:
- Activa realtime para las tablas: `tasks`, `shopping_items`, `events`

### 5. Ejecutar en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 6. Deploy en Vercel

```bash
npx vercel --prod
```

Añade las variables de entorno en Vercel → Settings → Environment Variables.

## Estructura del proyecto

```
src/
├── app/                    Next.js App Router
│   ├── (auth)/             Login, registro, onboarding (sin nav)
│   ├── (main)/             App principal (con bottom nav)
│   │   ├── hoy/            Dashboard
│   │   ├── tareas/         CRUD de tareas
│   │   ├── compra/         Lista de compra
│   │   ├── agenda/         Calendario y eventos
│   │   └── mas/            Gastos, ajustes, futuras secciones
│   └── layout.tsx          Root layout con providers
├── components/
│   ├── ui/                 Primitivos shadcn (button, input, etc.)
│   ├── layout/             BottomNav, TopBar, FAB, PageShell
│   ├── tasks/              TaskCard, TaskForm, QuickTaskForm
│   ├── shopping/           ShoppingList, QuickShoppingForm
│   ├── agenda/             EventCard, EventForm, CalendarMonth
│   ├── expenses/           ExpenseCard, ExpenseForm, BalanceSummary
│   └── shared/             EmptyState, UserAvatar, LoadBalanceBar
├── lib/
│   ├── supabase/           Client, server, middleware
│   ├── hooks/              TanStack Query hooks por módulo
│   ├── schemas/            Zod validation schemas
│   ├── utils/              Dates, currency, cn
│   ├── types.ts            Domain types
│   └── constants.ts        Categories, frequencies, etc.
└── providers/              Auth, Query, Household contexts
```

## Decisiones técnicas clave

### Recurrencias
- Generadas por **trigger PostgreSQL**, no por el frontend
- La siguiente instancia se calcula desde la **fecha prevista** (no la real de completado)
- Unique partial index previene duplicados: solo 1 tarea activa por recurrencia
- Días 29-31: se usa el último día del mes si no existe

### Realtime
- Solo para tablas volátiles: `tasks`, `shopping_items`, `events`
- Patrón: invalidar caché de TanStack Query al recibir cambio, no duplicar estado
- Gastos usa refetch on window focus (cambia pocas veces al día)

### Balance de gastos
- Calculado por **función SQL** (`get_household_balance`), no en frontend
- Usa `NUMERIC(10,2)` para precisión monetaria
- Simplificado para exactamente 2 usuarios

### Onboarding
- Máximo 2 miembros por hogar (enforced por trigger en DB)
- 1 hogar por usuario (no se puede cambiar)
- Código de invitación de 8 caracteres, sin expiración
- La validación de límite hace el código inservible una vez completo

### Notificaciones v1
- Solo in-app: la pantalla Hoy muestra alertas y recordatorios
- Sin push notifications funcionales
- Infra preparada (service worker, tabla push_subscriptions)

## Módulos futuros

| Versión | Módulos |
|---|---|
| v1.1 | Gatos, Mantenimiento |
| v1.2 | Wiki/Notas, Estadísticas |
| v1.3 | Push notifications |

Las tablas para v1.1 ya están creadas en la migración inicial.

## Licencia

Proyecto privado.
