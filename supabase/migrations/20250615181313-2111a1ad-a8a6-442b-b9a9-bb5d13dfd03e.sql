
-- Create email reminders table for scheduling study reminders
CREATE TABLE public.email_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  learning_objective_id UUID REFERENCES learning_objectives(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  reminder_type TEXT NOT NULL DEFAULT 'study_reminder',
  test_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_email_reminders_scheduled ON email_reminders(scheduled_for) WHERE sent_at IS NULL;
CREATE INDEX idx_email_reminders_token ON email_reminders(test_token) WHERE test_token IS NOT NULL;

-- Add RLS policies
ALTER TABLE public.email_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email reminders" 
  ON public.email_reminders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email reminders" 
  ON public.email_reminders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add question pool tracking to avoid duplicate questions
CREATE TABLE public.question_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_objective_id UUID REFERENCES learning_objectives(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- 'study' or 'test'
  used_question_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Add RLS for question pools
ALTER TABLE public.question_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage question pools" 
  ON public.question_pools 
  FOR ALL 
  USING (true);

-- Add test_token field to study_sessions for anonymous access
ALTER TABLE public.study_sessions 
ADD COLUMN test_token TEXT UNIQUE,
ADD COLUMN anonymous_mode BOOLEAN DEFAULT false;

-- Create index for test tokens
CREATE INDEX idx_study_sessions_token ON study_sessions(test_token) WHERE test_token IS NOT NULL;

-- Update RLS policy for study_sessions to allow anonymous access with token
DROP POLICY IF EXISTS "Users can view their own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can create their own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can update their own study sessions" ON public.study_sessions;

CREATE POLICY "Users can view their own study sessions or anonymous with token" 
  ON public.study_sessions 
  FOR SELECT 
  USING (
    (auth.uid() = user_id) OR 
    (anonymous_mode = true AND test_token IS NOT NULL)
  );

CREATE POLICY "Users can create study sessions" 
  ON public.study_sessions 
  FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (anonymous_mode = true AND test_token IS NOT NULL)
  );

CREATE POLICY "Users can update their own study sessions or anonymous with token" 
  ON public.study_sessions 
  FOR UPDATE 
  USING (
    (auth.uid() = user_id) OR 
    (anonymous_mode = true AND test_token IS NOT NULL)
  );

-- Update study_attempts RLS for anonymous access
DROP POLICY IF EXISTS "Users can view their own study attempts" ON public.study_attempts;
DROP POLICY IF EXISTS "Users can create their own study attempts" ON public.study_attempts;

CREATE POLICY "Users can view study attempts" 
  ON public.study_attempts 
  FOR SELECT 
  USING (
    (auth.uid() = user_id) OR 
    EXISTS (
      SELECT 1 FROM study_sessions 
      WHERE study_sessions.id = study_attempts.session_id 
      AND study_sessions.anonymous_mode = true
    )
  );

CREATE POLICY "Users can create study attempts" 
  ON public.study_attempts 
  FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR 
    EXISTS (
      SELECT 1 FROM study_sessions 
      WHERE study_sessions.id = study_attempts.session_id 
      AND study_sessions.anonymous_mode = true
    )
  );

-- Function to schedule email reminders
CREATE OR REPLACE FUNCTION schedule_study_reminder(
  p_user_id UUID,
  p_email TEXT,
  p_learning_objective_id UUID,
  p_hours_delay INTEGER DEFAULT 24
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder_id UUID;
  test_token TEXT;
BEGIN
  -- Generate unique test token
  test_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Insert reminder
  INSERT INTO email_reminders (
    user_id,
    email,
    learning_objective_id,
    scheduled_for,
    test_token
  ) VALUES (
    p_user_id,
    p_email,
    p_learning_objective_id,
    now() + (p_hours_delay * interval '1 hour'),
    test_token
  ) RETURNING id INTO reminder_id;
  
  RETURN reminder_id;
END;
$$;

-- Function to get due email reminders
CREATE OR REPLACE FUNCTION get_due_email_reminders()
RETURNS TABLE(
  id UUID,
  email TEXT,
  learning_objective_id UUID,
  learning_objective_title TEXT,
  test_token TEXT,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.id,
    er.email,
    er.learning_objective_id,
    lo.title as learning_objective_title,
    er.test_token,
    er.user_id
  FROM email_reminders er
  JOIN learning_objectives lo ON lo.id = er.learning_objective_id
  WHERE er.scheduled_for <= now()
    AND er.sent_at IS NULL
  ORDER BY er.scheduled_for ASC;
END;
$$;

-- Function to mark email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(reminder_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE email_reminders 
  SET sent_at = now() 
  WHERE id = reminder_id;
END;
$$;
