// =============================================
// Hogar — Core types
// These are hand-written to match the SQL schema.
// In production, supplement with `supabase gen types` for full DB types.
// =============================================

export type TaskPriority = "normal" | "urgent";
export type TaskCategory = "general" | "limpieza" | "cocina" | "compra" | "admin" | "mascotas" | "otro";
export type ShoppingCategory = "general" | "frescos" | "limpieza" | "gatos" | "higiene" | "otros";
export type EventType = "cita_medica" | "veterinario" | "hogar" | "personal" | "otro";
export type ExpenseCategory = "supermercado" | "hogar" | "gatos" | "ocio" | "facturas" | "otro";
export type SplitType = "equal" | "solo_payer" | "custom";
export type RecurrenceFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "custom";
export type ReminderMinutes = 60 | 1440 | 4320 | null;

// ---- Core entities ----

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  chore_rotating_per_member?: number;
}

export interface UserProfile {
  id: string;
  household_id: string | null;
  display_name: string;
  avatar_emoji: string;
  created_at: string;
}

export interface Task {
  id: string;
  household_id: string;
  recurrence_id: string | null;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  due_date: string | null; // ISO date string
  assigned_to: string | null;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
}

export interface TaskRecurrence {
  id: string;
  household_id: string;
  title: string;
  priority: TaskPriority;
  frequency: RecurrenceFrequency;
  frequency_config: Record<string, number>;
  rotate_assignee: boolean;
  assigned_to: string | null;
  last_assigned_to: string | null;
  next_due_date: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  household_id: string;
  name: string;
  category: ShoppingCategory;
  is_checked: boolean;
  added_by: string;
  checked_by: string | null;
  created_at: string;
  checked_at: string | null;
}

export interface Event {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  assigned_to: string | null;
  reminder_minutes_before: ReminderMinutes;
  created_by: string;
  created_at: string;
}

export interface Expense {
  id: string;
  household_id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  paid_by: string;
  split_type: SplitType;
  custom_split_amount: number | null;
  created_at: string;
}

export interface ExpenseSettlement {
  id: string;
  household_id: string;
  amount: number;
  paid_by: string;
  paid_to: string;
  note: string | null;
  created_at: string;
}

// ---- Computed / View types ----

export interface BalanceEntry {
  user_id: string;
  display_name: string;
  net_balance: number;
}

export interface WeeklyLoadEntry {
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  tasks_completed: number;
}

// ---- Form input types (used by RHF) ----

export interface CreateTaskInput {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  due_date: string | null;
  assigned_to: string | null;
  is_recurring: boolean;
  frequency?: RecurrenceFrequency;
  frequency_config?: Record<string, number>;
  rotate_assignee?: boolean;
}

export interface CreateShoppingItemInput {
  name: string;
  category: ShoppingCategory;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  event_type: EventType;
  starts_at: string;
  ends_at?: string;
  all_day: boolean;
  assigned_to: string | null;
  reminder_minutes_before: ReminderMinutes;
}

export interface CreateExpenseInput {
  amount: number;
  description: string;
  category: ExpenseCategory;
  paid_by: string;
  split_type: SplitType;
  custom_split_amount?: number;
}
