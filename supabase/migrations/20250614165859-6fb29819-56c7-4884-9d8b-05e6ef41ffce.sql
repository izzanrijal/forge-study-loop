
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.priority_level AS ENUM ('High', 'Medium', 'Low');
CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE public.session_type AS ENUM ('study', 'test');
CREATE TYPE public.processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Users profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  streak_count INTEGER DEFAULT 0,
  total_mastery_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDFs table
CREATE TABLE public.pdfs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_status processing_status DEFAULT 'pending',
  total_learning_objectives INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Objectives table
CREATE TABLE public.learning_objectives (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pdf_id UUID REFERENCES public.pdfs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_text TEXT,
  priority priority_level DEFAULT 'Medium',
  page_range TEXT,
  mastery_level DECIMAL(5,2) DEFAULT 0.0 CHECK (mastery_level BETWEEN 0 AND 100),
  total_questions INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  learning_objective_id UUID REFERENCES public.learning_objectives(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  difficulty difficulty_level DEFAULT 'medium',
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study Sessions table
CREATE TABLE public.study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_type session_type NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0.0,
  time_spent INTEGER DEFAULT 0, -- in seconds
  mastery_gained INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study Attempts table (for individual question responses)
CREATE TABLE public.study_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.study_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  selected_answer TEXT CHECK (selected_answer IN ('A', 'B', 'C', 'D', 'unknown')),
  is_correct BOOLEAN DEFAULT FALSE,
  response_time INTEGER DEFAULT 0, -- in milliseconds
  difficulty_rating difficulty_level,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FSRS Card States (for spaced repetition algorithm)
CREATE TABLE public.fsrs_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  stability DECIMAL(10,6) DEFAULT 0.0,
  difficulty DECIMAL(10,6) DEFAULT 0.0,
  due_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  state TEXT DEFAULT 'new' CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  last_review TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Create indexes for better performance
CREATE INDEX idx_learning_objectives_user_id ON public.learning_objectives(user_id);
CREATE INDEX idx_learning_objectives_pdf_id ON public.learning_objectives(pdf_id);
CREATE INDEX idx_questions_learning_objective_id ON public.questions(learning_objective_id);
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_attempts_session_id ON public.study_attempts(session_id);
CREATE INDEX idx_study_attempts_user_id ON public.study_attempts(user_id);
CREATE INDEX idx_fsrs_cards_user_id ON public.fsrs_cards(user_id);
CREATE INDEX idx_fsrs_cards_due_date ON public.fsrs_cards(due_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_objectives_updated_at BEFORE UPDATE ON public.learning_objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fsrs_cards_updated_at BEFORE UPDATE ON public.fsrs_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fsrs_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- PDFs policies
CREATE POLICY "Users can view own PDFs" ON public.pdfs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own PDFs" ON public.pdfs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own PDFs" ON public.pdfs FOR UPDATE USING (auth.uid() = user_id);

-- Learning Objectives policies
CREATE POLICY "Users can view own LOs" ON public.learning_objectives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own LOs" ON public.learning_objectives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own LOs" ON public.learning_objectives FOR UPDATE USING (auth.uid() = user_id);

-- Questions policies (read-only for users, insert via service role)
CREATE POLICY "Users can view questions for their LOs" ON public.questions FOR SELECT USING (
  learning_objective_id IN (
    SELECT id FROM public.learning_objectives WHERE user_id = auth.uid()
  )
);

-- Study Sessions policies
CREATE POLICY "Users can view own sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Study Attempts policies
CREATE POLICY "Users can view own attempts" ON public.study_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON public.study_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- FSRS Cards policies
CREATE POLICY "Users can view own cards" ON public.fsrs_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards" ON public.fsrs_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.fsrs_cards FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false);

-- Storage policies for PDFs
CREATE POLICY "Users can upload their own PDFs" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own PDFs" ON storage.objects FOR SELECT USING (
  bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]
);
