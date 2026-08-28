-- Supabase Schema for User Profiles Migration
-- Table: public.profiles
-- This table stores the migrated user profiles with Row Level Security enabled.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text UNIQUE NOT NULL,
  avatar text,
  bio text,
  skills jsonb, -- JSON field to store skills (combining offered & wanted list for schema compliance)
  role text DEFAULT 'user',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- UI-Compatible Fields (To keep the UI completely unchanged)
  education text,
  experience text,
  languages jsonb DEFAULT '[]'::jsonb,
  availability jsonb DEFAULT '[]'::jsonb,
  skill_level text,
  portfolio jsonb DEFAULT '{}'::jsonb,
  skills_offered jsonb DEFAULT '[]'::jsonb,
  skills_wanted jsonb DEFAULT '[]'::jsonb,
  rating numeric DEFAULT 5.0,
  reviews_count integer DEFAULT 0,
  successful_exchanges integer DEFAULT 0,
  credits integer DEFAULT 5,
  time_zone text,
  badges jsonb DEFAULT '[]'::jsonb,
  has_seen_onboarding boolean DEFAULT false
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_seen_onboarding boolean DEFAULT false;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Secure RLS Policies

-- 1. Profiles are readable by anyone (so swappers can search/discover each other)
CREATE POLICY "Profiles are publicly readable" ON public.profiles
  FOR SELECT USING (true);

-- 2. Users can insert their own profile record
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile record
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Users can delete their own profile record
CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);


-- Table: public.bookings
-- Stores the scheduled skill exchange sessions between teachers and learners.
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_name text NOT NULL,
  learner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  learner_name text NOT NULL,
  skill_name text NOT NULL,
  category text NOT NULL,
  learning_option text NOT NULL,
  date text NOT NULL, -- YYYY-MM-DD
  time_slot text NOT NULL, -- 'Morning' | 'Afternoon' | 'Evening'
  scheduled_time timestamp with time zone, -- ISO datetime string for exact appointment time
  status text DEFAULT 'pending' NOT NULL, -- 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
  notes text,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  reminder_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS scheduled_time timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Secure RLS Policies for Bookings
-- 1. Users can select/view bookings where they are either the teacher or the learner
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = teacher_id OR auth.uid() = learner_id);

-- 2. Users can insert a booking where they are the learner
CREATE POLICY "Users can insert bookings as a learner" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = learner_id);

-- 3. Users can update a booking if they are either the teacher or the learner
CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = teacher_id OR auth.uid() = learner_id);

-- 4. Users can delete a booking if they are either the teacher or the learner
CREATE POLICY "Users can delete their own bookings" ON public.bookings
  FOR DELETE USING (auth.uid() = teacher_id OR auth.uid() = learner_id);


-- Table: public.notifications
-- Stores notifications for swappers.
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- 'match' | 'request' | 'upcoming' | 'message' | 'credit' | 'system' | 'call'
  booking_id text,
  read boolean DEFAULT false NOT NULL,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS booking_id text;

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Secure RLS Policies for Notifications
-- 1. Users can select/view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Authenticated users can insert notifications (to notify other swappers)
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Users can update their own notifications (e.g. marking as read)
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);


-- Table: public.messages
-- Stores chat messages between users.
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  file_url text,
  file_name text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Secure RLS Policies for Messages
-- 1. Users can select/view their own conversations (either sender or receiver)
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 2. Authenticated users can insert messages (must be the sender)
CREATE POLICY "Authenticated users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 3. Users can delete their own sent/received messages if they want
CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);


-- Table: public.reviews
-- Stores individual reviews left by learners for teachers and specific skills taught.
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  learner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  learner_name text NOT NULL,
  skill_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  teaching_quality integer DEFAULT 5,
  communication integer DEFAULT 5,
  helpfulness integer DEFAULT 5,
  punctuality integer DEFAULT 5,
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Secure RLS Policies for Reviews
-- 1. Reviews are publicly readable so verified skill counts and ratings can be calculated
CREATE POLICY "Reviews are publicly readable" ON public.reviews
  FOR SELECT USING (true);

-- 2. Authenticated learners can insert a review (must be the learner)
CREATE POLICY "Learners can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = learner_id);

-- 3. Learners can update their own review
CREATE POLICY "Learners can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = learner_id);

-- 4. Learners can delete their own review
CREATE POLICY "Learners can delete their own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = learner_id);

-- ============================================================================
-- Table: public.credit_transactions & Trigger for Session Swaps
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id text,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'spent', 'bonus', 'refund')),
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Atomic Trigger Function to award +15 credits to Teacher and deduct 10 credits from Learner
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
                updated_at = timezone('utc'::text, now())
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

DROP TRIGGER IF EXISTS tr_booking_completion_credits ON public.bookings;
CREATE TRIGGER tr_booking_completion_credits
    AFTER UPDATE OF status ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_booking_completion_credits();



