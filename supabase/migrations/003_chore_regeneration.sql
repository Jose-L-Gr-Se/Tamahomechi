-- =============================================
-- Chore Week Regeneration v2
-- =============================================
-- Adds configurable rotating-zones-per-member and a smarter distribution
-- algorithm that:
--   * Always assigns fixed zones (is_fixed = true) every week.
--   * Picks N rotating zones per member per week, preferring zones that
--     have been assigned least recently across the household.
--   * Prefers giving a zone to the member who did NOT do it last time.
--   * Supports excluding a prior assignment map so that regenerating an
--     already-deleted week produces a different result (swaps members if
--     output would be identical).

ALTER TABLE households
  ADD COLUMN IF NOT EXISTS chore_rotating_per_member INT NOT NULL DEFAULT 2;

DROP FUNCTION IF EXISTS generate_chore_week(UUID, DATE, UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_chore_week(UUID, DATE, UUID, JSONB) CASCADE;

CREATE FUNCTION generate_chore_week(
  p_household_id UUID,
  p_week_start DATE DEFAULT NULL,
  p_generated_by UUID DEFAULT NULL,
  p_exclude_assignments JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_week_id UUID;
  v_members UUID[];
  v_member_a UUID;
  v_member_b UUID;
  v_member_count INT;
  v_rotating_n INT;
  v_last_week_id UUID;
  v_zone RECORD;
  v_last_assignee UUID;
  v_assigned_to UUID;
  v_a_count INT := 0;
  v_b_count INT := 0;
  v_result JSONB := '{}'::jsonb;
BEGIN
  -- Week dates (Wednesday start)
  IF p_week_start IS NULL THEN
    v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE + 2;
    IF v_week_start < CURRENT_DATE THEN
      v_week_start := v_week_start + 7;
    END IF;
  ELSE
    v_week_start := p_week_start;
  END IF;
  v_week_end := v_week_start + 6;

  -- Return existing week if already created
  SELECT id INTO v_week_id FROM chore_weeks
  WHERE household_id = p_household_id AND week_start = v_week_start LIMIT 1;
  IF v_week_id IS NOT NULL THEN
    RETURN v_week_id;
  END IF;

  -- Members ordered by creation
  SELECT ARRAY_AGG(id ORDER BY created_at ASC) INTO v_members
  FROM user_profiles WHERE household_id = p_household_id;
  v_member_count := COALESCE(array_length(v_members, 1), 0);
  IF v_member_count < 1 THEN
    RAISE EXCEPTION 'No members found in household %', p_household_id;
  END IF;
  v_member_a := v_members[1];
  v_member_b := CASE WHEN v_member_count >= 2 THEN v_members[2] ELSE v_members[1] END;

  -- Config
  SELECT COALESCE(chore_rotating_per_member, 2) INTO v_rotating_n
  FROM households WHERE id = p_household_id;

  -- Last week reference
  SELECT id INTO v_last_week_id FROM chore_weeks
  WHERE household_id = p_household_id AND week_start < v_week_start
  ORDER BY week_start DESC LIMIT 1;

  -- Create the new week
  INSERT INTO chore_weeks (household_id, week_start, week_end, generated_by)
  VALUES (p_household_id, v_week_start, v_week_end, p_generated_by)
  RETURNING id INTO v_week_id;

  -- ==== FIXED ZONES: appear every week, alternate members ====
  FOR v_zone IN
    SELECT z.id
    FROM chore_zones z
    WHERE z.household_id = p_household_id
      AND z.is_active = true
      AND z.is_fixed = true
    ORDER BY z.sort_order
  LOOP
    v_last_assignee := NULL;
    IF v_last_week_id IS NOT NULL THEN
      SELECT assigned_to INTO v_last_assignee
      FROM chore_assignments
      WHERE week_id = v_last_week_id AND zone_id = v_zone.id;
    END IF;

    IF v_member_count = 1 THEN
      v_assigned_to := v_member_a;
    ELSIF v_a_count < v_b_count THEN
      v_assigned_to := v_member_a;
    ELSIF v_b_count < v_a_count THEN
      v_assigned_to := v_member_b;
    ELSIF v_last_assignee = v_member_a THEN
      v_assigned_to := v_member_b;
    ELSIF v_last_assignee = v_member_b THEN
      v_assigned_to := v_member_a;
    ELSE
      v_assigned_to := v_member_a;
    END IF;

    IF v_assigned_to = v_member_a THEN
      v_a_count := v_a_count + 1;
    ELSE
      v_b_count := v_b_count + 1;
    END IF;

    INSERT INTO chore_assignments (household_id, week_id, zone_id, assigned_to)
    VALUES (p_household_id, v_week_id, v_zone.id, v_assigned_to);
    v_result := v_result || jsonb_build_object(v_zone.id::text, v_assigned_to::text);
  END LOOP;

  -- ==== ROTATING ZONES: pick 2*N least-recently-done, assign with balance + alternation ====
  FOR v_zone IN
    WITH history AS (
      SELECT ca.zone_id,
             MAX(cw.week_start) AS last_week,
             (ARRAY_AGG(ca.assigned_to ORDER BY cw.week_start DESC))[1] AS last_assignee
      FROM chore_assignments ca
      JOIN chore_weeks cw ON ca.week_id = cw.id
      WHERE ca.household_id = p_household_id
      GROUP BY ca.zone_id
    )
    SELECT z.id, h.last_assignee
    FROM chore_zones z
    LEFT JOIN history h ON h.zone_id = z.id
    WHERE z.household_id = p_household_id
      AND z.is_active = true
      AND z.is_fixed = false
    ORDER BY h.last_week NULLS FIRST, z.sort_order
    LIMIT (v_member_count * v_rotating_n)
  LOOP
    v_last_assignee := v_zone.last_assignee;

    IF v_member_count = 1 THEN
      v_assigned_to := v_member_a;
    ELSIF v_a_count < v_b_count THEN
      v_assigned_to := v_member_a;
    ELSIF v_b_count < v_a_count THEN
      v_assigned_to := v_member_b;
    ELSIF v_last_assignee = v_member_a THEN
      v_assigned_to := v_member_b;
    ELSIF v_last_assignee = v_member_b THEN
      v_assigned_to := v_member_a;
    ELSE
      v_assigned_to := v_member_a;
    END IF;

    IF v_assigned_to = v_member_a THEN
      v_a_count := v_a_count + 1;
    ELSE
      v_b_count := v_b_count + 1;
    END IF;

    INSERT INTO chore_assignments (household_id, week_id, zone_id, assigned_to)
    VALUES (p_household_id, v_week_id, v_zone.id, v_assigned_to);
    v_result := v_result || jsonb_build_object(v_zone.id::text, v_assigned_to::text);
  END LOOP;

  -- ==== EXCLUDE GUARD: if result equals the excluded prior assignment, swap members ====
  IF p_exclude_assignments IS NOT NULL
     AND v_member_count >= 2
     AND v_result = p_exclude_assignments THEN
    UPDATE chore_assignments
    SET assigned_to = CASE
      WHEN assigned_to = v_member_a THEN v_member_b
      ELSE v_member_a
    END
    WHERE week_id = v_week_id;
  END IF;

  RETURN v_week_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_chore_week TO authenticated;
