# Diagnostic & Architecture Report: SkillSwap Credit System

**Date**: 2026-08-28  
**Scope**: Booking completion credit allocation & balance synchronization  
**Specification Requirement**: **-10 Credits** for Learner, **+15 Credits** for Teacher upon booking status transition to `'completed'`.

---

## 1. Executive Summary

The diagnosis identified that the credit balance transfer mechanism is currently failing due to two key root causes:
1. **Missing Backend Trigger / RPC**: There is no database-level trigger (`handle_booking_completion_credits`) or transactional function executing on the `bookings` table to transfer credits and populate the `credit_transactions` table.
2. **Client-Side Profile Overwrites**: The frontend application attempts to update the teacher's profile via a full-row overwrite (`mapProfileToSupabase`), passing stale in-memory credit counts. Due to Supabase Row Level Security (RLS), a client cannot update another user's profile record (e.g. learner completing a session cannot write to the teacher's profile), resulting in 0 rows updated and no learner deduction.

---

## 2. Detailed Diagnostic Findings

### Check 1: Database Trigger Verification
- **Query / Investigation**: Checked PostgreSQL triggers on table `bookings`.
- **Finding**: No trigger named `handle_booking_completion_credits` or similar exists in the schema or migration history.
- **Outcome**: Status transitions on `bookings` do not automatically trigger database credit balance modifications.

### Check 2: Competing Client-Side Credit Writes
- **Code Locations**:
  - `src/App.tsx` (`handleUpdateBookingStatus`, lines 1233–1262):
    ```typescript
    const updatedTeacher = { ...teacher, credits: (teacher.credits || 0) + 10 };
    await supabase.from('profiles').update(mapProfileToSupabase(updatedTeacher)).eq('id', teacher.id);
    ```
- **Finding**:
  - Full-row writes via `mapProfileToSupabase` serialize `credits: profile.credits ?? 100`.
  - Stale in-memory snapshots overwrite live database values.
  - Supabase RLS policy `auth.uid() = id` blocks cross-user updates when initiated by the partner.
  - The client only calculated `+10` instead of the required `+15` for teachers, and lacked `-10` deduction logic for learners.

### Check 3: Status Value Consistency
- **Column Name**: `status`
- **Value Checked**: `'completed'` (strictly lowercase).
- **Finding**: Both the client session-end handlers and booking workflows use `'completed'`, matching the required standard format.

### Check 4: Participant Identifiers (`teacher_id` & `learner_id`)
- **Finding**: Both `teacher_id` and `learner_id` are consistently mapped and populated with valid UUID strings in `bookings` payload generation (`mapBookingToSupabase`).

### Check 5: `credit_transactions` Table Inspection
- **Database Query**: `SELECT * FROM credit_transactions ORDER BY created_at DESC LIMIT 10;`
- **Result**: `0` rows found.
- **Finding**: Confirms that transaction records are not being created for completed sessions.

---

## 3. Implementation Blueprint & Fix Architecture

### A. SQL Migration: Database Trigger & Transaction Logging

Add the following migration to PostgreSQL / Supabase:

```sql
-- 1. Create Credit Transactions Table (if not exists)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_id TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'bonus', 'refund')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
    ON public.credit_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Trigger Function for Atomic Credit Balance Updates
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
    -- Only execute when transitioning from a non-completed state to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        v_teacher_id := NEW.teacher_id;
        v_learner_id := NEW.learner_id;
        v_skill_name := COALESCE(NEW.skill_name, 'Skill Swap');

        -- 1. Deduct 10 Credits from Learner
        IF v_learner_id IS NOT NULL THEN
            UPDATE public.profiles
            SET credits = GREATEST(0, COALESCE(credits, 100) - 10),
                updated_at = NOW()
            WHERE id = v_learner_id;

            INSERT INTO public.credit_transactions (
                user_id,
                booking_id,
                amount,
                type,
                description
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
                updated_at = NOW()
            WHERE id = v_teacher_id;

            INSERT INTO public.credit_transactions (
                user_id,
                booking_id,
                amount,
                type,
                description
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

-- 3. Attach Trigger to Bookings Table
DROP TRIGGER IF EXISTS tr_booking_completion_credits ON public.bookings;
CREATE TRIGGER tr_booking_completion_credits
    AFTER UPDATE OF status ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_booking_completion_credits();
```

---

### B. Client-Side Cleanup Plan

1. **Remove Competing Overwrites in `src/App.tsx`**:
   - Eliminate direct `.from('profiles').update(...)` calls during `handleUpdateBookingStatus`.
   - Update local React state optimistically (`-10` for learner, `+15` for teacher) for immediate UI feedback.
   - Refetch the current user profile from Supabase to sync the authoritative balance computed by the trigger.

2. **Align Client Transaction Lists in `CreditsView.tsx`**:
   - Verify that `credit_transactions` queries display the `-10` (spent) and `+15` (earned) entries with proper timestamps and descriptions.
