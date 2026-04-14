-- =============================================
-- Hogar v1 — Initial Schema
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper: short random codes for invite
CREATE OR REPLACE FUNCTION nanoid(size INT DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  id TEXT := '';
  i INT := 0;
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  bytes BYTEA := gen_random_bytes(size);
BEGIN
  WHILE i < size LOOP
    id := id || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
    i := i + 1;
  END LOOP;
  RETURN id;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- =============================================
-- HOUSEHOLDS
-- =============================================
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Nuestro hogar',
  invite_code TEXT UNIQUE NOT NULL DEFAULT nanoid(8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- USER PROFILES (extends auth.users)
-- =============================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🙂',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TASK RECURRENCES
-- =============================================
CREATE TABLE task_recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('normal', 'urgent')),
  frequency TEXT NOT NULL
    CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),
  frequency_config JSONB NOT NULL DEFAULT '{}',
  rotate_assignee BOOLEAN NOT NULL DEFAULT false,
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  last_assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  next_due_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TASKS
-- =============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  recurrence_id UUID REFERENCES task_recurrences(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'limpieza', 'cocina', 'compra', 'admin', 'mascotas', 'otro')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('normal', 'urgent')),
  due_date DATE,
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active (non-completed) task per recurrence — prevents duplicates
CREATE UNIQUE INDEX idx_one_active_per_recurrence
  ON tasks(recurrence_id)
  WHERE recurrence_id IS NOT NULL AND is_completed = false;

-- =============================================
-- SHOPPING ITEMS
-- =============================================
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'frescos', 'limpieza', 'gatos', 'higiene', 'otros')),
  is_checked BOOLEAN NOT NULL DEFAULT false,
  added_by UUID NOT NULL REFERENCES user_profiles(id),
  checked_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_at TIMESTAMPTZ
);

-- =============================================
-- EVENTS (Agenda)
-- =============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'otro'
    CHECK (event_type IN ('cita_medica', 'veterinario', 'hogar', 'personal', 'otro')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT false,
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  reminder_minutes_before INT
    CHECK (reminder_minutes_before IS NULL OR reminder_minutes_before IN (60, 1440, 4320)),
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- EXPENSES
-- =============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'otro'
    CHECK (category IN ('supermercado', 'hogar', 'gatos', 'ocio', 'facturas', 'otro')),
  paid_by UUID NOT NULL REFERENCES user_profiles(id),
  split_type TEXT NOT NULL DEFAULT 'equal'
    CHECK (split_type IN ('equal', 'solo_payer', 'custom')),
  custom_split_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- EXPENSE SETTLEMENTS
-- =============================================
CREATE TABLE expense_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  paid_by UUID NOT NULL REFERENCES user_profiles(id),
  paid_to UUID NOT NULL REFERENCES user_profiles(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- PUSH SUBSCRIPTIONS (infra prepared, not used in v1)
-- =============================================
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- =============================================
-- V1.1 TABLES (created now, used later)
-- =============================================
CREATE TABLE cats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  weight_kg NUMERIC(4,2),
  chip_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cat_id UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('food', 'litter', 'medication', 'vet', 'other')),
  note TEXT,
  logged_by UUID NOT NULL REFERENCES user_profiles(id),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE maintenance_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  zone TEXT CHECK (zone IN ('cocina', 'bano', 'salon', 'dormitorio', 'terraza', 'entrada', 'otro')),
  urgency TEXT NOT NULL DEFAULT 'media' CHECK (urgency IN ('baja', 'media', 'alta')),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_curso', 'resuelta')),
  resolved_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE maintenance_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_tasks_household_pending ON tasks(household_id, due_date) WHERE NOT is_completed;
CREATE INDEX idx_tasks_assigned_pending ON tasks(household_id, assigned_to) WHERE NOT is_completed;
CREATE INDEX idx_tasks_completed_week ON tasks(household_id, completed_at) WHERE is_completed;
CREATE INDEX idx_shopping_pending ON shopping_items(household_id) WHERE NOT is_checked;
CREATE INDEX idx_events_upcoming ON events(household_id, starts_at);
CREATE INDEX idx_expenses_date ON expenses(household_id, created_at DESC);
CREATE INDEX idx_user_profiles_household ON user_profiles(household_id);
CREATE INDEX idx_households_invite ON households(invite_code);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Helper function: get current user's household_id
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID AS $$
  SELECT household_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_contacts ENABLE ROW LEVEL SECURITY;

-- Households: members can view their own household
CREATE POLICY "household_select" ON households FOR SELECT
  USING (id = get_user_household_id());

-- User profiles: view household members, update own profile
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT
  USING (household_id = get_user_household_id() OR id = auth.uid());

CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- Macro for household-scoped tables
-- Tasks
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (household_id = get_user_household_id());
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (household_id = get_user_household_id());
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (household_id = get_user_household_id());

-- Task recurrences
CREATE POLICY "recurrences_select" ON task_recurrences FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "recurrences_insert" ON task_recurrences FOR INSERT WITH CHECK (household_id = get_user_household_id());
CREATE POLICY "recurrences_update" ON task_recurrences FOR UPDATE USING (household_id = get_user_household_id());
CREATE POLICY "recurrences_delete" ON task_recurrences FOR DELETE USING (household_id = get_user_household_id());

-- Shopping items
CREATE POLICY "shopping_select" ON shopping_items FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "shopping_insert" ON shopping_items FOR INSERT WITH CHECK (household_id = get_user_household_id());
CREATE POLICY "shopping_update" ON shopping_items FOR UPDATE USING (household_id = get_user_household_id());
CREATE POLICY "shopping_delete" ON shopping_items FOR DELETE USING (household_id = get_user_household_id());

-- Events
CREATE POLICY "events_select" ON events FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (household_id = get_user_household_id());
CREATE POLICY "events_update" ON events FOR UPDATE USING (household_id = get_user_household_id());
CREATE POLICY "events_delete" ON events FOR DELETE USING (household_id = get_user_household_id());

-- Expenses
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (household_id = get_user_household_id());
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (household_id = get_user_household_id());
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (household_id = get_user_household_id());

-- Expense settlements
CREATE POLICY "settlements_select" ON expense_settlements FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "settlements_insert" ON expense_settlements FOR INSERT WITH CHECK (household_id = get_user_household_id());

-- Push subscriptions (user-scoped, not household-scoped)
CREATE POLICY "push_select" ON push_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "push_insert" ON push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_delete" ON push_subscriptions FOR DELETE USING (user_id = auth.uid());

-- V1.1 tables (household-scoped)
CREATE POLICY "cats_select" ON cats FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "cats_insert" ON cats FOR INSERT WITH CHECK (household_id = get_user_household_id());
CREATE POLICY "cats_update" ON cats FOR UPDATE USING (household_id = get_user_household_id());
CREATE POLICY "cats_delete" ON cats FOR DELETE USING (household_id = get_user_household_id());

CREATE POLICY "cat_logs_select" ON cat_logs FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "cat_logs_insert" ON cat_logs FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "maintenance_select" ON maintenance_issues FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "maintenance_insert" ON maintenance_issues FOR INSERT WITH CHECK (household_id = get_user_household_id());
CREATE POLICY "maintenance_update" ON maintenance_issues FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "contacts_select" ON maintenance_contacts FOR SELECT USING (household_id = get_user_household_id());
CREATE POLICY "contacts_insert" ON maintenance_contacts FOR INSERT WITH CHECK (household_id = get_user_household_id());
CREATE POLICY "contacts_update" ON maintenance_contacts FOR UPDATE USING (household_id = get_user_household_id());
CREATE POLICY "contacts_delete" ON maintenance_contacts FOR DELETE USING (household_id = get_user_household_id());

-- =============================================
-- HOUSEHOLD MEMBER LIMIT (max 2)
-- =============================================
CREATE OR REPLACE FUNCTION check_household_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.household_id IS NOT NULL AND (
    SELECT COUNT(*) FROM user_profiles WHERE household_id = NEW.household_id
  ) >= 2 THEN
    RAISE EXCEPTION 'household_full' USING HINT = 'Este hogar ya tiene 2 miembros';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_household_limit
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  WHEN (NEW.household_id IS NOT NULL)
  EXECUTE FUNCTION check_household_member_limit();

-- Prevent switching households
CREATE OR REPLACE FUNCTION prevent_household_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.household_id IS NOT NULL AND NEW.household_id IS DISTINCT FROM OLD.household_id THEN
    RAISE EXCEPTION 'cannot_change_household' USING HINT = 'No puedes cambiar de hogar';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_household_change
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_household_change();

-- =============================================
-- RECURRING TASK GENERATION TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION generate_next_recurring_task()
RETURNS TRIGGER AS $$
DECLARE
  rec task_recurrences%ROWTYPE;
  next_date DATE;
  next_assignee UUID;
  household_members UUID[];
BEGIN
  -- Only fire when completing a recurring task
  IF NEW.is_completed = true
     AND OLD.is_completed = false
     AND NEW.recurrence_id IS NOT NULL
  THEN
    SELECT * INTO rec
    FROM task_recurrences
    WHERE id = NEW.recurrence_id AND is_active = true;

    IF rec IS NULL THEN
      RETURN NEW;
    END IF;

    -- Anti-duplicate: check no active instance exists
    IF EXISTS (
      SELECT 1 FROM tasks
      WHERE recurrence_id = rec.id AND is_completed = false
    ) THEN
      RETURN NEW;
    END IF;

    -- Calculate next due date from PLANNED due_date, not actual completion
    next_date := CASE rec.frequency
      WHEN 'daily' THEN NEW.due_date + 1
      WHEN 'weekly' THEN NEW.due_date + 7
      WHEN 'biweekly' THEN NEW.due_date + 14
      WHEN 'monthly' THEN (
        SELECT (
          DATE_TRUNC('month', NEW.due_date + INTERVAL '1 month')
          + (LEAST(
              COALESCE((rec.frequency_config->>'day_of_month')::INT, EXTRACT(DAY FROM NEW.due_date)::INT),
              EXTRACT(DAY FROM
                DATE_TRUNC('month', NEW.due_date + INTERVAL '2 months') - INTERVAL '1 day'
              )::INT
            ) - 1) * INTERVAL '1 day'
        )::DATE
      )
      WHEN 'custom' THEN NEW.due_date + COALESCE((rec.frequency_config->>'every_n_days')::INT, 7)
    END;

    -- If next_date already passed (late completion), advance to future
    WHILE next_date < CURRENT_DATE LOOP
      next_date := CASE rec.frequency
        WHEN 'daily' THEN next_date + 1
        WHEN 'weekly' THEN next_date + 7
        WHEN 'biweekly' THEN next_date + 14
        WHEN 'monthly' THEN (
          SELECT (
            DATE_TRUNC('month', next_date + INTERVAL '1 month')
            + (LEAST(
                COALESCE((rec.frequency_config->>'day_of_month')::INT, EXTRACT(DAY FROM next_date)::INT),
                EXTRACT(DAY FROM
                  DATE_TRUNC('month', next_date + INTERVAL '2 months') - INTERVAL '1 day'
                )::INT
              ) - 1) * INTERVAL '1 day'
          )::DATE
        )
        WHEN 'custom' THEN next_date + COALESCE((rec.frequency_config->>'every_n_days')::INT, 7)
      END;
    END LOOP;

    -- Rotation logic
    IF rec.rotate_assignee THEN
      SELECT ARRAY_AGG(id ORDER BY created_at) INTO household_members
      FROM user_profiles WHERE household_id = rec.household_id;

      IF array_length(household_members, 1) = 2 THEN
        next_assignee := CASE
          WHEN NEW.assigned_to = household_members[1] THEN household_members[2]
          ELSE household_members[1]
        END;
      ELSE
        next_assignee := rec.assigned_to;
      END IF;
    ELSE
      next_assignee := rec.assigned_to;
    END IF;

    -- Insert next instance
    INSERT INTO tasks (
      household_id, recurrence_id, title, category, priority,
      due_date, assigned_to, created_by
    ) VALUES (
      rec.household_id, rec.id, rec.title, 'general', rec.priority,
      next_date, next_assignee, NEW.completed_by
    );

    -- Update recurrence tracking
    UPDATE task_recurrences
    SET next_due_date = next_date, last_assigned_to = NEW.assigned_to
    WHERE id = rec.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_generate_recurring_task
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION generate_next_recurring_task();

-- =============================================
-- EXPENSE BALANCE FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION get_household_balance(p_household_id UUID)
RETURNS TABLE(user_id UUID, display_name TEXT, net_balance NUMERIC) AS $$
WITH members AS (
  SELECT id, display_name FROM user_profiles WHERE household_id = p_household_id
),
-- Calculate how much each person is owed by the other from expenses
owed_to_payer AS (
  SELECT
    paid_by,
    SUM(
      CASE split_type
        WHEN 'equal' THEN amount / 2.0
        WHEN 'solo_payer' THEN 0
        WHEN 'custom' THEN COALESCE(custom_split_amount, 0)
      END
    ) AS total_owed
  FROM expenses
  WHERE household_id = p_household_id
  GROUP BY paid_by
),
-- Net settlements
settlement_out AS (
  SELECT paid_by, SUM(amount) AS total_out
  FROM expense_settlements WHERE household_id = p_household_id
  GROUP BY paid_by
),
settlement_in AS (
  SELECT paid_to, SUM(amount) AS total_in
  FROM expense_settlements WHERE household_id = p_household_id
  GROUP BY paid_to
)
SELECT
  m.id AS user_id,
  m.display_name,
  (
    COALESCE((SELECT total_owed FROM owed_to_payer WHERE paid_by = m.id), 0)
    - COALESCE((SELECT total_owed FROM owed_to_payer WHERE paid_by != m.id), 0)
    + COALESCE((SELECT total_in FROM settlement_in WHERE paid_to = m.id), 0)
    - COALESCE((SELECT total_out FROM settlement_out WHERE paid_by = m.id), 0)
  ) AS net_balance
FROM members m;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- REALTIME PUBLICATIONS
-- =============================================
-- Enable realtime for volatile tables
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_items;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
