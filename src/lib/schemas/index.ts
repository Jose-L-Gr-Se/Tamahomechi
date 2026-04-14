import { z } from "zod";

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().email("Email no válido"),
});

export const registerSchema = z.object({
  email: z.string().email("Email no válido"),
  display_name: z.string().min(1, "Nombre obligatorio").max(30),
  avatar_emoji: z.string().default("🙂"),
});

export const createHouseholdSchema = z.object({
  name: z.string().min(1, "Nombre obligatorio").max(50).default("Nuestro hogar"),
});

export const joinHouseholdSchema = z.object({
  invite_code: z.string().length(8, "El código debe tener 8 caracteres"),
});

// ---- Tasks ----
export const createTaskSchema = z.object({
  title: z.string().min(1, "Título obligatorio").max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(["general", "limpieza", "cocina", "compra", "admin", "mascotas", "otro"]).default("general"),
  priority: z.enum(["normal", "urgent"]).default("normal"),
  due_date: z.string().nullable().default(null),
  assigned_to: z.string().uuid().nullable().default(null),
  is_recurring: z.boolean().default(false),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "custom"]).optional(),
  frequency_config: z.record(z.number()).optional(),
  rotate_assignee: z.boolean().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
});

// ---- Shopping ----
export const createShoppingItemSchema = z.object({
  name: z.string().min(1, "Nombre obligatorio").max(100),
  category: z.enum(["general", "frescos", "limpieza", "gatos", "higiene", "otros"]).default("general"),
});

// ---- Events ----
export const createEventSchema = z.object({
  title: z.string().min(1, "Título obligatorio").max(200),
  description: z.string().max(1000).optional(),
  event_type: z.enum(["cita_medica", "veterinario", "hogar", "personal", "otro"]).default("otro"),
  starts_at: z.string().min(1, "Fecha obligatoria"),
  ends_at: z.string().optional(),
  all_day: z.boolean().default(false),
  assigned_to: z.string().uuid().nullable().default(null),
  reminder_minutes_before: z.union([z.literal(60), z.literal(1440), z.literal(4320), z.null()]).default(null),
});

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string().uuid(),
});

// ---- Expenses ----
export const createExpenseSchema = z.object({
  amount: z.number().positive("El importe debe ser mayor que 0"),
  description: z.string().min(1, "Concepto obligatorio").max(200),
  category: z.enum(["supermercado", "hogar", "gatos", "ocio", "facturas", "otro"]).default("otro"),
  paid_by: z.string().uuid(),
  split_type: z.enum(["equal", "solo_payer", "custom"]).default("equal"),
  custom_split_amount: z.number().positive().optional(),
});

// ---- Settlements ----
export const createSettlementSchema = z.object({
  amount: z.number().positive(),
  paid_by: z.string().uuid(),
  paid_to: z.string().uuid(),
  note: z.string().max(200).optional(),
});
