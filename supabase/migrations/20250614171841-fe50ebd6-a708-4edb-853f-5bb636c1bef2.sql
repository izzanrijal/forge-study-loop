
-- Create RLS Policies for PDFs (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdfs' AND policyname = 'Users can view own PDFs') THEN
        CREATE POLICY "Users can view own PDFs" ON public.pdfs 
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdfs' AND policyname = 'Users can insert own PDFs') THEN
        CREATE POLICY "Users can insert own PDFs" ON public.pdfs 
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdfs' AND policyname = 'Users can update own PDFs') THEN
        CREATE POLICY "Users can update own PDFs" ON public.pdfs 
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS Policies for Learning Objectives (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'learning_objectives' AND policyname = 'Users can view own LOs') THEN
        CREATE POLICY "Users can view own LOs" ON public.learning_objectives 
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'learning_objectives' AND policyname = 'Users can insert own LOs') THEN
        CREATE POLICY "Users can insert own LOs" ON public.learning_objectives 
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'learning_objectives' AND policyname = 'Users can update own LOs') THEN
        CREATE POLICY "Users can update own LOs" ON public.learning_objectives 
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS Policies for Questions (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'Users can view questions for their LOs') THEN
        CREATE POLICY "Users can view questions for their LOs" ON public.questions 
          FOR SELECT USING (
            learning_objective_id IN (
              SELECT id FROM public.learning_objectives WHERE user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Create RLS Policies for Study Sessions (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_sessions' AND policyname = 'Users can view own sessions') THEN
        CREATE POLICY "Users can view own sessions" ON public.study_sessions 
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_sessions' AND policyname = 'Users can insert own sessions') THEN
        CREATE POLICY "Users can insert own sessions" ON public.study_sessions 
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_sessions' AND policyname = 'Users can update own sessions') THEN
        CREATE POLICY "Users can update own sessions" ON public.study_sessions 
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS Policies for Study Attempts (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_attempts' AND policyname = 'Users can view own attempts') THEN
        CREATE POLICY "Users can view own attempts" ON public.study_attempts 
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_attempts' AND policyname = 'Users can insert own attempts') THEN
        CREATE POLICY "Users can insert own attempts" ON public.study_attempts 
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS Policies for FSRS Cards (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fsrs_cards' AND policyname = 'Users can view own cards') THEN
        CREATE POLICY "Users can view own cards" ON public.fsrs_cards 
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fsrs_cards' AND policyname = 'Users can insert own cards') THEN
        CREATE POLICY "Users can insert own cards" ON public.fsrs_cards 
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fsrs_cards' AND policyname = 'Users can update own cards') THEN
        CREATE POLICY "Users can update own cards" ON public.fsrs_cards 
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create storage bucket for PDFs (if not exists)
INSERT INTO storage.buckets (id, name, public) 
SELECT 'pdfs', 'pdfs', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'pdfs');

-- Storage policies for PDFs (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload their own PDFs') THEN
        CREATE POLICY "Users can upload their own PDFs" ON storage.objects 
          FOR INSERT WITH CHECK (
            bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]
          );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can view their own PDFs') THEN
        CREATE POLICY "Users can view their own PDFs" ON storage.objects 
          FOR SELECT USING (
            bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]
          );
    END IF;
END $$;
