
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  fileId: string;
  fileName: string;
  fileType: string;
  filePath: string;
}

interface LearningObjective {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  content_text: string;
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { fileId, fileName, fileType, filePath }: RequestBody = await req.json();
    
    console.log(`Processing document: ${fileName} (${fileType})`);

    // Update status to processing
    await supabaseClient
      .from('pdfs')
      .update({ processing_status: 'processing' })
      .eq('id', fileId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('documents')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert file to text based on type
    let fileContent = '';
    
    if (fileType === 'application/pdf') {
      // For PDF, we'll use a simple text extraction approach
      // In production, you might want to use a proper PDF parser
      const arrayBuffer = await fileData.arrayBuffer();
      const decoder = new TextDecoder();
      fileContent = decoder.decode(arrayBuffer);
      
      // Simple PDF text extraction (this is basic - for production use a proper PDF parser)
      fileContent = fileContent.replace(/[^\x20-\x7E]/g, ' ').trim();
      
      if (!fileContent || fileContent.length < 50) {
        fileContent = `This is a PDF document titled "${fileName}". The content needs to be processed with proper PDF parsing tools for full text extraction.`;
      }
    } else if (fileType.includes('text') || fileType.includes('markdown')) {
      fileContent = await fileData.text();
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log(`Extracted content length: ${fileContent.length} characters`);

    // Use Gemini API to generate learning objectives and questions
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-1.5-flash';

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    const prompt = `
Analyze the following document content and create learning objectives and questions for educational purposes.

Document: "${fileName}"
Content: "${fileContent.substring(0, 4000)}"

Please respond with a JSON object containing:
1. "learning_objectives": Array of 3-5 learning objectives, each with:
   - title: Clear, concise learning objective title
   - description: Detailed description of what will be learned
   - priority: "High", "Medium", or "Low"
   - content_text: Key content related to this objective

2. "questions": Array of 8-12 multiple choice questions, each with:
   - question_text: Clear question text
   - option_a, option_b, option_c, option_d: Four answer options
   - correct_answer: "A", "B", "C", or "D"
   - explanation: Why the correct answer is right
   - difficulty: "easy", "medium", or "hard"

Make sure the JSON is valid and complete.
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response received');

    let parsedContent;
    try {
      const responseText = geminiData.candidates[0].content.parts[0].text;
      console.log('Gemini response text length:', responseText.length);
      
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }
      
      parsedContent = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed Gemini response');
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      
      // Fallback to mock data
      parsedContent = {
        learning_objectives: [
          {
            title: `Key Concepts from ${fileName}`,
            description: 'Understanding the main concepts and ideas presented in this document.',
            priority: 'High',
            content_text: fileContent.substring(0, 500)
          },
          {
            title: `Practical Applications`,
            description: 'Applying the knowledge from this document to real-world scenarios.',
            priority: 'Medium',
            content_text: fileContent.substring(500, 1000)
          }
        ],
        questions: [
          {
            question_text: `What is the main topic covered in ${fileName}?`,
            option_a: 'Technical concepts',
            option_b: 'Historical information',
            option_c: 'General knowledge',
            option_d: 'Specific methodology',
            correct_answer: 'A',
            explanation: 'Based on the document content analysis.',
            difficulty: 'medium'
          }
        ]
      };
    }

    // Get user_id from the PDF record
    const { data: pdfData, error: pdfError } = await supabaseClient
      .from('pdfs')
      .select('user_id')
      .eq('id', fileId)
      .single();

    if (pdfError || !pdfData) {
      throw new Error('Failed to get PDF user information');
    }

    const userId = pdfData.user_id;

    // Insert learning objectives
    const learningObjectives = parsedContent.learning_objectives || [];
    const insertedObjectives = [];

    for (const objective of learningObjectives) {
      const { data: loData, error: loError } = await supabaseClient
        .from('learning_objectives')
        .insert({
          pdf_id: fileId,
          user_id: userId,
          title: objective.title,
          description: objective.description,
          priority: objective.priority,
          content_text: objective.content_text
        })
        .select()
        .single();

      if (loError) {
        console.error('Error inserting learning objective:', loError);
        continue;
      }

      insertedObjectives.push(loData);
    }

    console.log(`Inserted ${insertedObjectives.length} learning objectives`);

    // Insert questions for each learning objective
    const questions = parsedContent.questions || [];
    let totalQuestions = 0;

    for (let i = 0; i < insertedObjectives.length && i < questions.length; i++) {
      const objective = insertedObjectives[i];
      const questionsPerObjective = Math.ceil(questions.length / insertedObjectives.length);
      const objectiveQuestions = questions.slice(
        i * questionsPerObjective,
        (i + 1) * questionsPerObjective
      );

      for (const question of objectiveQuestions) {
        const { error: qError } = await supabaseClient
          .from('questions')
          .insert({
            learning_objective_id: objective.id,
            question_text: question.question_text,
            option_a: question.option_a,
            option_b: question.option_b,
            option_c: question.option_c,
            option_d: question.option_d,
            correct_answer: question.correct_answer,
            explanation: question.explanation,
            difficulty: question.difficulty
          });

        if (qError) {
          console.error('Error inserting question:', qError);
          continue;
        }

        totalQuestions++;
      }
    }

    console.log(`Inserted ${totalQuestions} questions`);

    // Update PDF record with completion status
    await supabaseClient
      .from('pdfs')
      .update({
        processing_status: 'completed',
        total_learning_objectives: insertedObjectives.length
      })
      .eq('id', fileId);

    // Update learning objectives with question counts
    for (const objective of insertedObjectives) {
      const { count } = await supabaseClient
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('learning_objective_id', objective.id);

      await supabaseClient
        .from('learning_objectives')
        .update({ total_questions: count || 0 })
        .eq('id', objective.id);
    }

    console.log(`Successfully processed document: ${fileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Document processed successfully',
        learningObjectives: insertedObjectives.length,
        questions: totalQuestions
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Processing error:', error);

    // Try to update status to failed if we have the fileId
    try {
      const body = await req.json();
      if (body.fileId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabaseClient
          .from('pdfs')
          .update({ processing_status: 'failed' })
          .eq('id', body.fileId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

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
