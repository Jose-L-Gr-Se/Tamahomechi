-- =============================================
-- Migration 006: Inherit category in recurring tasks
-- =============================================
-- The original trigger hardcoded category='general' when generating the next
-- instance of a recurring task. That made tasks "disappear" from category
-- filters (e.g. limpieza tasks turned into general after the first cycle).
--
-- This migration replaces generate_next_recurring_task so the new instance
-- inherits the same category as the task being completed.
-- =============================================

CREATE OR REPLACE FUNCTION generate_next_recurring_task()
RETURNS TRIGGER AS $$
DECLARE
  rec task_recurrences%ROWTYPE;
  next_date DATE;
  next_assignee UUID;
  household_members UUID[];
BEGIN
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

    IF EXISTS (
      SELECT 1 FROM tasks
      WHERE recurrence_id = rec.id AND is_completed = false
    ) THEN
      RETURN NEW;
    END IF;

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

    -- Inherit category, description and priority from the just-completed task
    -- so recurring tasks don't silently turn into 'general' on each cycle.
    INSERT INTO tasks (
      household_id, recurrence_id, title, description, category, priority,
      due_date, assigned_to, created_by
    ) VALUES (
      rec.household_id, rec.id, rec.title, NEW.description, NEW.category, rec.priority,
      next_date, next_assignee, NEW.completed_by
    );

    UPDATE task_recurrences
    SET next_due_date = next_date, last_assigned_to = NEW.assigned_to
    WHERE id = rec.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
