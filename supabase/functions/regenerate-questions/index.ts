
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Question {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { learningObjectiveId } = await req.json();
    
    if (!learningObjectiveId) {
      throw new Error('Learning objective ID is required');
    }

    // Get learning objective data
    const { data: loData, error: loError } = await supabaseClient
      .from('learning_objectives')
      .select('*')
      .eq('id', learningObjectiveId)
      .single();

    if (loError || !loData) {
      throw new Error('Learning objective not found');
    }

    // Get existing questions to avoid duplicates
    const { data: existingQuestions } = await supabaseClient
      .from('questions')
      .select('question_text')
      .eq('learning_objective_id', learningObjectiveId);

    const existingQuestionTexts = existingQuestions?.map(q => q.question_text) || [];

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-1.5-flash';

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }

    const regeneratePrompt = `
Buat 10-15 soal pilihan ganda BARU untuk spaced repetition yang BERBEDA dari soal yang sudah ada.

LEARNING OBJECTIVE: ${loData.title}
KONTEN PEMBELAJARAN: ${loData.content_text}

SOAL YANG SUDAH ADA (HINDARI DUPLIKASI):
${existingQuestionTexts.map((q, i) => `${i + 1}. ${q}`).join('\n')}

PERSYARATAN SOAL BARU:
1. Buat 10-15 soal yang BERBEDA dari yang sudah ada
2. Fokus pada aspek learning objective yang belum dicover
3. Distribusi kesulitan: 30% mudah, 50% sedang, 20% sulit
4. Variasi pendekatan: definisi, aplikasi, analisis, evaluasi
5. Soal harus menantang tapi fair

FORMAT JSON:
{
  "questions": [
    {
      "question_text": "Soal baru yang berbeda dari yang sudah ada",
      "option_a": "Pilihan A",
      "option_b": "Pilihan B",
      "option_c": "Pilihan C", 
      "option_d": "Pilihan D",
      "correct_answer": "A",
      "explanation": "Penjelasan lengkap",
      "difficulty": "medium"
    }
  ]
}

PENTING: Jangan duplikasi soal yang sudah ada!
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: regeneratePrompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    let newQuestions: Question[] = [];
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        newQuestions = parsedData.questions || [];
      }
    } catch (parseError) {
      console.error('Failed to parse regenerated questions:', parseError);
      throw new Error('Failed to generate new questions');
    }

    // Insert new questions
    let insertedCount = 0;
    for (const question of newQuestions) {
      const { error: qError } = await supabaseClient
        .from('questions')
        .insert({
          learning_objective_id: learningObjectiveId,
          question_text: question.question_text,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          option_d: question.option_d,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          difficulty: question.difficulty
        });

      if (!qError) {
        insertedCount++;
      }
    }

    // Update learning objective with new question count
    const { count } = await supabaseClient
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('learning_objective_id', learningObjectiveId);

    await supabaseClient
      .from('learning_objectives')
      .update({ total_questions: count || 0 })
      .eq('id', learningObjectiveId);

    console.log(`Generated ${insertedCount} new questions for LO: ${loData.title}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'New questions generated successfully',
        newQuestions: insertedCount,
        totalQuestions: count || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Regeneration error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
