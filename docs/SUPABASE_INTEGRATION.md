
# RecallForge - Supabase Backend Integration Guide

This document provides step-by-step instructions for connecting the RecallForge frontend application to a Supabase backend, enabling full functionality including authentication, database operations, and file storage.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Database Schema](#database-schema)
4. [Authentication Setup](#authentication-setup)
5. [Environment Configuration](#environment-configuration)
6. [Frontend Integration](#frontend-integration)
7. [Edge Functions](#edge-functions)
8. [File Storage Setup](#file-storage-setup)
9. [Security & RLS Policies](#security--rls-policies)
10. [Testing the Integration](#testing-the-integration)

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js 16+ installed
- Basic understanding of SQL and PostgreSQL
- Familiarity with React and TypeScript

## Supabase Project Setup

### 1. Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `recallforge-backend`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be provisioned (2-3 minutes)

### 2. Get Your Project Credentials

Navigate to **Settings > API** and note down:
- **Project URL** (e.g., `https://your-project.supabase.co`)
- **Anon Public Key** (starts with `eyJ...`)
- **Service Role Key** (starts with `eyJ...`) - Keep this secret!

## Database Schema

### 1. Create Tables

Execute the following SQL in the Supabase SQL Editor (**SQL Editor > New Query**):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
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
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
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
  priority_score INTEGER DEFAULT 1 CHECK (priority_score BETWEEN 1 AND 5),
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
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study Sessions table
CREATE TABLE public.study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('study', 'test')),
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
  difficulty_rating TEXT CHECK (difficulty_rating IN ('easy', 'medium', 'hard')),
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
```

### 2. Create Functions for User Management

```sql
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
```

## Authentication Setup

### 1. Configure Authentication Providers

1. In Supabase Dashboard, go to **Authentication > Settings**
2. Configure email settings:
   - **Enable email confirmations**: ON
   - **Enable email change confirmations**: ON
   - **Secure email change**: ON

### 2. Set Up Email Templates (Optional)

Customize email templates in **Authentication > Email Templates** for:
- Confirmation emails
- Password reset emails
- Magic link emails

## Environment Configuration

### 1. Create Environment Variables

In your Lovable project, you'll need to configure these environment variables through the Supabase integration:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Frontend Supabase Client Setup

Install the Supabase client library:

```bash
npm install @supabase/supabase-js
```

Create a Supabase client configuration file:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          streak_count: number
          total_mastery_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          streak_count?: number
          total_mastery_points?: number
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          streak_count?: number
          total_mastery_points?: number
        }
      }
      // Add other table types as needed
    }
  }
}
```

## Frontend Integration

### 1. Authentication Hooks

Create authentication hooks for the frontend:

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
```

### 2. Data Fetching Hooks

```typescript
// src/hooks/useStudyData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLearningObjectives(userId: string) {
  return useQuery({
    queryKey: ['learning-objectives', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_objectives')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useQuestions(learningObjectiveId: string) {
  return useQuery({
    queryKey: ['questions', learningObjectiveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('learning_objective_id', learningObjectiveId)
      
      if (error) throw error
      return data
    },
    enabled: !!learningObjectiveId,
  })
}

export function useCreateStudySession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (sessionData: {
      user_id: string
      session_type: 'study' | 'test'
      total_questions: number
    }) => {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert(sessionData)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] })
    },
  })
}
```

## Edge Functions

### 1. PDF Processing Function

Create an edge function for PDF processing:

```typescript
// supabase/functions/process-pdf/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { pdfId } = await req.json()

    // TODO: Implement PDF processing logic
    // 1. Extract text from PDF
    // 2. Use Gemini to parse learning objectives
    // 3. Generate questions for each LO
    // 4. Update database with results

    return new Response(
      JSON.stringify({ success: true, pdfId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
```

### 2. Question Generation Function

```typescript
// supabase/functions/generate-questions/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // TODO: Implement question generation using Gemini API
  // This function will be called after PDF processing
  // to generate MCQ questions for each learning objective
})
```

## File Storage Setup

### 1. Create Storage Buckets

In Supabase Dashboard, go to **Storage** and create buckets:

1. **pdfs** - For storing uploaded PDF files
2. **avatars** - For user profile pictures

### 2. Set Up Storage Policies

```sql
-- PDF bucket policies
CREATE POLICY "Users can upload their own PDFs" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own PDFs" ON storage.objects FOR SELECT USING (
  bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Avatar bucket policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (
  bucket_id = 'avatars'
);

CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Security & RLS Policies

### 1. Enable Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fsrs_cards ENABLE ROW LEVEL SECURITY;
```

### 2. Create RLS Policies

```sql
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- PDFs policies
CREATE POLICY "Users can view own PDFs" ON public.pdfs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own PDFs" ON public.pdfs FOR INSERT WITH CHECK (auth.uid() = user_id);

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
```

## Testing the Integration

### 1. Test Authentication

1. Implement sign-up/sign-in forms in your frontend
2. Test user registration and email confirmation
3. Verify profile creation in the database

### 2. Test Data Operations

1. Upload a sample PDF
2. Verify file storage in the 'pdfs' bucket
3. Test learning objective creation
4. Test question retrieval

### 3. Test Study Session Flow

1. Create a study session
2. Answer questions and record attempts
3. Verify data persistence
4. Test completion and results calculation

## Next Steps

After completing this integration:

1. **Implement FSRS Algorithm**: Add the spaced repetition logic
2. **Set Up Email Notifications**: Configure Resend or similar service
3. **Add AI Integration**: Connect Gemini API for content generation
4. **Implement Real-time Features**: Use Supabase realtime for live updates
5. **Add Analytics**: Track user progress and engagement metrics

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure policies are correctly set and user is authenticated
2. **CORS Issues**: Check edge function CORS headers
3. **File Upload Failures**: Verify storage bucket policies and permissions
4. **Authentication Loops**: Check redirect URLs and session handling

### Debugging Tips

1. Use Supabase Dashboard logs to monitor database queries
2. Check browser console for authentication errors
3. Monitor edge function logs in Supabase Dashboard
4. Use Supabase client debug mode during development

---

For additional support, refer to the [Supabase Documentation](https://supabase.com/docs) or join the [Supabase Discord Community](https://discord.supabase.com/).
