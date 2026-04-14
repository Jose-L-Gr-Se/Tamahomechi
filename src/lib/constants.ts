import type {
  TaskCategory,
  ShoppingCategory,
  EventType,
  ExpenseCategory,
  RecurrenceFrequency,
  ReminderMinutes,
} from "./types";

// ---- Task categories ----
export const TASK_CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "limpieza", label: "Limpieza" },
  { value: "cocina", label: "Cocina" },
  { value: "compra", label: "Compra" },
  { value: "admin", label: "Admin" },
  { value: "mascotas", label: "Mascotas" },
  { value: "otro", label: "Otro" },
];

// ---- Shopping categories ----
export const SHOPPING_CATEGORIES: { value: ShoppingCategory; label: string; emoji: string }[] = [
  { value: "frescos", label: "Frescos", emoji: "🥬" },
  { value: "limpieza", label: "Limpieza", emoji: "🧹" },
  { value: "gatos", label: "Gatos", emoji: "🐱" },
  { value: "higiene", label: "Higiene", emoji: "🧴" },
  { value: "general", label: "General", emoji: "📦" },
  { value: "otros", label: "Otros", emoji: "🏷️" },
];

// ---- Event types ----
export const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: "cita_medica", label: "Cita médica", emoji: "🏥" },
  { value: "veterinario", label: "Veterinario", emoji: "🐾" },
  { value: "hogar", label: "Hogar", emoji: "🏠" },
  { value: "personal", label: "Personal", emoji: "👤" },
  { value: "otro", label: "Otro", emoji: "📌" },
];

// ---- Expense categories ----
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: "supermercado", label: "Supermercado", emoji: "🛒" },
  { value: "hogar", label: "Hogar", emoji: "🏠" },
  { value: "gatos", label: "Gatos", emoji: "🐱" },
  { value: "ocio", label: "Ocio", emoji: "🎬" },
  { value: "facturas", label: "Facturas", emoji: "📄" },
  { value: "otro", label: "Otro", emoji: "💳" },
];

// ---- Recurrence frequencies ----
export const FREQUENCIES: { value: RecurrenceFrequency; label: string }[] = [
  { value: "daily", label: "Cada día" },
  { value: "weekly", label: "Cada semana" },
  { value: "biweekly", label: "Cada 2 semanas" },
  { value: "monthly", label: "Cada mes" },
  { value: "custom", label: "Personalizada" },
];

// ---- Reminder options ----
export const REMINDER_OPTIONS: { value: ReminderMinutes; label: string }[] = [
  { value: null, label: "Sin recordatorio" },
  { value: 60, label: "1 hora antes" },
  { value: 1440, label: "1 día antes" },
  { value: 4320, label: "3 días antes" },
];

// ---- Avatar emoji options ----
export const AVATAR_EMOJIS = ["🙂", "😊", "🌸", "🌿", "🐱", "🌙", "☀️", "🍊", "🫐", "🦊", "🐻", "🌻"];

// ---- Days of week ----
export const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];
