
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Enable RLS on all tables
ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fsrs_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pdfs table
CREATE POLICY "Users can view their own PDFs" ON public.pdfs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDFs" ON public.pdfs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDFs" ON public.pdfs
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for learning_objectives table
CREATE POLICY "Users can view their own learning objectives" ON public.learning_objectives
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning objectives" ON public.learning_objectives
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning objectives" ON public.learning_objectives
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for questions table
CREATE POLICY "Users can view questions for their learning objectives" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.learning_objectives lo 
      WHERE lo.id = questions.learning_objective_id 
      AND lo.user_id = auth.uid()
    )
  );

-- Create RLS policies for study_sessions table
CREATE POLICY "Users can view their own study sessions" ON public.study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions" ON public.study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" ON public.study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for study_attempts table
CREATE POLICY "Users can view their own study attempts" ON public.study_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study attempts" ON public.study_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for fsrs_cards table
CREATE POLICY "Users can view their own FSRS cards" ON public.fsrs_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FSRS cards" ON public.fsrs_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FSRS cards" ON public.fsrs_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- Create storage policies for documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
