-- ============================================================================
-- Supabase Fix Migration:
-- 1. Fix bookings INSERT RLS policy to support swapRole = 'teach' & 'learn'
-- 2. Fix credit_transactions trigger function to use column 'reason' instead of 'description'
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FIX 1: Bookings INSERT / SELECT / UPDATE / DELETE RLS Policies
-- ----------------------------------------------------------------------------
-- Ensure both learner and teacher can create, view, and update bookings
DROP POLICY IF EXISTS "Users can insert bookings as a learner" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings as learner or teacher" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

CREATE POLICY "Users can create bookings as learner or teacher"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = learner_id 
  OR 
  auth.uid() = teacher_id
);

DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  auth.uid() = learner_id 
  OR 
  auth.uid() = teacher_id
);

DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = learner_id 
  OR 
  auth.uid() = teacher_id
)
WITH CHECK (
  auth.uid() = learner_id 
  OR 
  auth.uid() = teacher_id
);

-- ----------------------------------------------------------------------------
-- FIX 2: Ensure credit_transactions table has 'reason' column (rename if existing)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- If 'description' exists and 'reason' doesn't, rename it:
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'credit_transactions' 
          AND column_name = 'description'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'credit_transactions' 
          AND column_name = 'reason'
    ) THEN
        ALTER TABLE public.credit_transactions RENAME COLUMN description TO reason;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- FIX 3: Update Trigger Function handle_booking_completion_credits()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_booking_completion_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_teacher_id UUID;
    v_learner_id UUID;
    v_skill_name TEXT;
BEGIN
    -- Trigger on status change to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        v_teacher_id := NEW.teacher_id;
        v_learner_id := NEW.learner_id;
        v_skill_name := COALESCE(NEW.skill_name, 'Skill Swap');

        -- 1. Deduct 10 Credits from Learner
        IF v_learner_id IS NOT NULL THEN
            UPDATE public.profiles
            SET credits = GREATEST(0, COALESCE(credits, 100) - 10),
                updated_at = timezone('utc'::text, now())
            WHERE id = v_learner_id;

            INSERT INTO public.credit_transactions (
                user_id,
                booking_id,
                amount,
                type,
                reason
            ) VALUES (
                v_learner_id,
                NEW.id,
                -10,
                'spent',
                'Completed learning session: ' || v_skill_name
            );
        END IF;

        -- 2. Award 15 Credits to Teacher
        IF v_teacher_id IS NOT NULL THEN
            UPDATE public.profiles
            SET credits = COALESCE(credits, 100) + 15,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_teacher_id;

            INSERT INTO public.credit_transactions (
                user_id,
                booking_id,
                amount,
                type,
                reason
            ) VALUES (
                v_teacher_id,
                NEW.id,
                15,
                'earned',
                'Completed teaching session: ' || v_skill_name
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS tr_booking_completion_credits ON public.bookings;
CREATE TRIGGER tr_booking_completion_credits
    AFTER UPDATE OF status ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_booking_completion_credits();
