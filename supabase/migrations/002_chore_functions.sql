-- =============================================
-- Chore Management Functions
-- =============================================

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS generate_chore_week(UUID, DATE, UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_chore(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS apply_chore_penalties(UUID) CASCADE;

-- Generate a chore week with proper member distribution
CREATE FUNCTION generate_chore_week(
  p_household_id UUID,
  p_week_start DATE DEFAULT NULL,
  p_generated_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_week_id UUID;
  v_members UUID[];
  v_member_a UUID;
  v_member_b UUID;
  v_last_week_id UUID;
  v_last_assignments JSONB;
  v_zone RECORD;
  v_assigned_to UUID;
  v_member_a_count INT := 0;
  v_member_b_count INT := 0;
  v_last_assignee UUID;
  v_week_number INT;
  v_active_slot INT;
  v_member_count INT;
BEGIN
  -- Calculate Wednesday (start of week)
  IF p_week_start IS NULL THEN
    v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE + 2;
    IF v_week_start < CURRENT_DATE THEN
      v_week_start := v_week_start + 7;
    END IF;
  ELSE
    v_week_start := p_week_start;
  END IF;
  v_week_end := v_week_start + 6;

  -- If week already exists, return it
  IF EXISTS (SELECT 1 FROM chore_weeks WHERE household_id = p_household_id AND week_start = v_week_start) THEN
    SELECT id INTO v_week_id FROM chore_weeks WHERE household_id = p_household_id AND week_start = v_week_start LIMIT 1;
    RETURN v_week_id;
  END IF;

  -- Get members ordered by creation (without auth dependency)
  SELECT ARRAY_AGG(id ORDER BY created_at ASC) INTO v_members
  FROM user_profiles 
  WHERE household_id = p_household_id;

  v_member_count := COALESCE(array_length(v_members, 1), 0);
  
  IF v_member_count < 1 THEN
    RAISE EXCEPTION 'No members found in household %', p_household_id;
  END IF;

  v_member_a := v_members[1];
  v_member_b := CASE WHEN v_member_count >= 2 THEN v_members[2] ELSE v_members[1] END;

  -- Active slot based on week number
  SELECT COUNT(*) INTO v_week_number
  FROM chore_weeks WHERE household_id = p_household_id;
  v_active_slot := CASE WHEN (v_week_number % 2) = 0 THEN 1 ELSE 2 END;

  -- Get last week's assignments
  SELECT id INTO v_last_week_id
  FROM chore_weeks
  WHERE household_id = p_household_id AND week_start < v_week_start
  ORDER BY week_start DESC LIMIT 1;

  IF v_last_week_id IS NOT NULL THEN
    SELECT jsonb_object_agg(zone_id::TEXT, assigned_to::TEXT) INTO v_last_assignments
    FROM chore_assignments WHERE week_id = v_last_week_id;
  END IF;

  -- Create new week
  INSERT INTO chore_weeks (household_id, week_start, week_end, generated_by)
  VALUES (p_household_id, v_week_start, v_week_end, p_generated_by)
  RETURNING id INTO v_week_id;

  -- Distribute zones: fixed + active rotation slot
  FOR v_zone IN
    SELECT id, name, is_fixed, rotation_slot
    FROM chore_zones
    WHERE household_id = p_household_id
      AND is_active = true
      AND (is_fixed = true OR rotation_slot = v_active_slot)
    ORDER BY sort_order
  LOOP
    -- Who had it last week?
    v_last_assignee := NULL;
    IF v_last_assignments IS NOT NULL THEN
      v_last_assignee := (v_last_assignments ->> v_zone.id::TEXT)::UUID;
    END IF;

    -- Assign to the other person, respecting balance
    IF v_member_count = 1 THEN
      -- Single member: all tasks for them
      v_assigned_to := v_member_a;
    ELSIF v_last_assignee = v_member_a THEN
      v_assigned_to := v_member_b;
      v_member_b_count := v_member_b_count + 1;
    ELSIF v_last_assignee = v_member_b THEN
      v_assigned_to := v_member_a;
      v_member_a_count := v_member_a_count + 1;
    ELSE
      -- No history: assign to member with fewer tasks this week
      IF v_member_a_count <= v_member_b_count THEN
        v_assigned_to := v_member_a;
        v_member_a_count := v_member_a_count + 1;
      ELSE
        v_assigned_to := v_member_b;
        v_member_b_count := v_member_b_count + 1;
      END IF;
    END IF;

    INSERT INTO chore_assignments (household_id, week_id, zone_id, assigned_to)
    VALUES (p_household_id, v_week_id, v_zone.id, v_assigned_to);
  END LOOP;

  RETURN v_week_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete a chore assignment
CREATE FUNCTION complete_chore(
  p_assignment_id UUID,
  p_completed_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_assignment_id UUID;
BEGIN
  UPDATE chore_assignments
  SET 
    is_completed = true,
    completed_at = now(),
    completed_by = p_completed_by
  WHERE id = p_assignment_id
  RETURNING id INTO v_assignment_id;
  
  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply penalties for incomplete chores
CREATE FUNCTION apply_chore_penalties(
  p_household_id UUID
)
RETURNS INT AS $$
DECLARE
  v_penalty_count INT := 0;
  v_assignment RECORD;
  v_expense_id UUID;
BEGIN
  FOR v_assignment IN
    SELECT ca.id, ca.assigned_to, cw.week_end
    FROM chore_assignments ca
    JOIN chore_weeks cw ON ca.week_id = cw.id
    WHERE ca.household_id = p_household_id
      AND ca.is_completed = false
      AND ca.penalty_applied = false
      AND cw.week_end < CURRENT_DATE
  LOOP
    -- Create penalty expense
    INSERT INTO expenses (
      household_id, 
      amount, 
      description, 
      category, 
      paid_by
    )
    VALUES (
      p_household_id,
      10.00,
      'Multa por tarea incompleta',
      'otro',
      v_assignment.assigned_to
    )
    RETURNING id INTO v_expense_id;

    -- Mark penalty as applied
    UPDATE chore_assignments
    SET 
      penalty_applied = true,
      penalty_amount = 10.00,
      penalty_expense_id = v_expense_id
    WHERE id = v_assignment.id;

    v_penalty_count := v_penalty_count + 1;
  END LOOP;

  RETURN v_penalty_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow RPC calls with proper permissions
GRANT EXECUTE ON FUNCTION generate_chore_week TO authenticated;
GRANT EXECUTE ON FUNCTION complete_chore TO authenticated;
GRANT EXECUTE ON FUNCTION apply_chore_penalties TO authenticated;
