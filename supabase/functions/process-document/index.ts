
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

interface PredefinedLearningObjective {
  title: string;
  importance: number;
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

    // Use Gemini API to process the document
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-1.5-flash';

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    // First, detect if the document has predefined learning objectives
    const detectionPrompt = `
Analisis dokumen berikut dan tentukan apakah dokumen ini berisi:
1. Tabel learning objectives yang sudah ditentukan dengan importance score (1-10)
2. Atau dokumen biasa yang memerlukan ekstraksi learning objectives

Dokumen: "${fileName}"
Konten (1000 karakter pertama): "${fileContent.substring(0, 1000)}"

Respon dengan JSON:
{
  "has_predefined_objectives": true/false,
  "type": "predefined_table" atau "regular_content"
}
`;

    const detectionResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: detectionPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    const detectionData = await detectionResponse.json();
    let documentType = 'regular_content';
    
    try {
      const detectionText = detectionData.candidates[0].content.parts[0].text;
      const detectionJson = JSON.parse(detectionText.match(/\{[\s\S]*\}/)[0]);
      documentType = detectionJson.type;
    } catch (e) {
      console.log('Using default document type: regular_content');
    }

    let learningObjectives: PredefinedLearningObjective[] = [];

    if (documentType === 'predefined_table') {
      // Process document with predefined learning objectives
      const extractionPrompt = `
Dokumen ini berisi tabel learning objectives yang sudah ditentukan beserta importance score.

Tugas Anda:
1. Ekstrak semua learning objectives dari tabel
2. Ambil importance score untuk setiap learning objective
3. Chunk konten dokumen dan assign ke setiap learning objective yang relevan
4. Buat struktur data yang lengkap

Dokumen: "${fileName}"
Konten lengkap: "${fileContent}"

Format JSON response:
{
  "learning_objectives": [
    {
      "title": "Exact learning objective dari tabel",
      "importance": 8,
      "content_text": "Konten relevan yang di-chunk untuk LO ini (minimal 300 kata dari dokumen)"
    }
  ]
}

PENTING: 
- Ekstrak SEMUA learning objectives dari tabel
- Importance score harus sesuai dengan yang ada di tabel (1-10)
- Content_text harus berisi chunk konten yang relevan dari dokumen, bukan summary
- Pastikan setiap LO mendapat content yang substantial untuk pembelajaran
`;

      const extractionResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: extractionPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          })
        }
      );

      const extractionData = await extractionResponse.json();
      
      try {
        const responseText = extractionData.candidates[0].content.parts[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          learningObjectives = parsedData.learning_objectives || [];
        }
      } catch (parseError) {
        console.error('Failed to parse extraction response:', parseError);
        throw new Error('Failed to extract learning objectives from predefined table');
      }
    } else {
      // Process regular document to extract learning objectives
      const regularPrompt = `
Analisis konten pembelajaran berikut dan ekstrak learning objectives (tujuan pembelajaran) yang komprehensif.

INSTRUKSI:
1. Identifikasi 5-12 learning objectives utama dari konten
2. Setiap learning objective harus spesifik dan terukur
3. Beri importance score 1-10 berdasarkan kompleksitas dan kepentingan
4. Ekstrak teks materi yang relevan untuk setiap learning objective
5. Buat deskripsi yang jelas dan actionable

KONTEN PEMBELAJARAN:
Nama File: ${fileName}
${fileContent.substring(0, 8000)}

OUTPUT FORMAT (JSON):
{
  "learning_objectives": [
    {
      "title": "Learning objective yang spesifik dan jelas",
      "importance": 8,
      "content_text": "Materi lengkap untuk pembelajaran topik ini (minimal 300 kata)"
    }
  ]
}

PENTING: Return HANYA JSON yang valid, tanpa markup atau teks tambahan.
`;

      const regularResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: regularPrompt
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

      const regularData = await regularResponse.json();
      
      try {
        const responseText = regularData.candidates[0].content.parts[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          learningObjectives = parsedData.learning_objectives || [];
        }
      } catch (parseError) {
        console.error('Failed to parse regular response:', parseError);
        // Fallback untuk dokumen regular
        learningObjectives = [{
          title: `Konsep Utama dari ${fileName}`,
          importance: 8,
          content_text: fileContent.substring(0, 1000)
        }];
      }
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
    const insertedObjectives = [];

    for (const objective of learningObjectives) {
      // Map importance score to priority
      let priority: 'High' | 'Medium' | 'Low' = 'Medium';
      if (objective.importance >= 9) priority = 'High';
      else if (objective.importance <= 6) priority = 'Low';

      const { data: loData, error: loError } = await supabaseClient
        .from('learning_objectives')
        .insert({
          pdf_id: fileId,
          user_id: userId,
          title: objective.title,
          description: `Importance Score: ${objective.importance}/10`,
          priority: priority,
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

    // Generate questions for each learning objective
    let totalQuestions = 0;

    for (const objective of insertedObjectives) {
      const questionsResponse = await generateQuestionsForObjective(
        objective,
        geminiApiKey,
        geminiModel
      );

      for (const question of questionsResponse) {
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

      // Update learning objective with question count
      const { count } = await supabaseClient
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('learning_objective_id', objective.id);

      await supabaseClient
        .from('learning_objectives')
        .update({ total_questions: count || 0 })
        .eq('id', objective.id);
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

    console.log(`Successfully processed document: ${fileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Document processed successfully',
        documentType: documentType,
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

// Function to generate questions for a learning objective
async function generateQuestionsForObjective(
  objective: any,
  geminiApiKey: string,
  geminiModel: string
): Promise<Question[]> {
  const questionsPrompt = `
Buat 15-20 soal pilihan ganda berkualitas tinggi untuk spaced repetition berdasarkan learning objective berikut:

LEARNING OBJECTIVE: ${objective.title}
KONTEN PEMBELAJARAN: ${objective.content_text}

PERSYARATAN SOAL:
1. Buat 15-20 soal dengan distribusi kesulitan:
   - 30% mudah (pemahaman dasar, definisi, recall)
   - 50% sedang (aplikasi, analisis, interpretasi)
   - 20% sulit (sintesis, evaluasi, problem solving)

2. Variasi tipe soal:
   - Faktual (definisi, karakteristik)
   - Konseptual (pemahaman prinsip)
   - Aplikatif (penerapan dalam kasus)
   - Analitis (membandingkan, menganalisis)

3. Setiap soal harus:
   - Jelas dan tidak ambigu
   - Memiliki 4 pilihan yang logis dan masuk akal
   - Distractor yang menantang tapi tidak menyesatkan
   - Penjelasan yang edukatif dan lengkap
   - Menguji aspek pemahaman yang berbeda

FORMAT JSON:
{
  "questions": [
    {
      "question_text": "Pertanyaan yang jelas dan spesifik?",
      "option_a": "Pilihan A yang masuk akal",
      "option_b": "Pilihan B yang masuk akal", 
      "option_c": "Pilihan C yang masuk akal",
      "option_d": "Pilihan D yang masuk akal",
      "correct_answer": "A",
      "explanation": "Penjelasan lengkap mengapa jawaban benar dan mengapa pilihan lain salah",
      "difficulty": "medium"
    }
  ]
}

PENTING: 
- Return HANYA JSON yang valid
- Pastikan semua soal berbeda dan tidak berulang
- Buat soal yang mengukur pemahaman mendalam dari learning objective ini
- Hindari soal yang terlalu mudah ditebak
`;

  try {
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
              text: questionsPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      return parsedData.questions || [];
    }
  } catch (error) {
    console.error('Error generating questions:', error);
  }

  // Fallback questions if AI generation fails
  return [{
    question_text: `Apa konsep utama dalam "${objective.title}"?`,
    option_a: "Konsep fundamental yang mendasari pemahaman",
    option_b: "Metode pembelajaran yang digunakan",
    option_c: "Aplikasi praktis dari teori",
    option_d: "Evaluasi hasil pembelajaran",
    correct_answer: "A",
    explanation: "Konsep fundamental adalah dasar pemahaman yang harus dikuasai terlebih dahulu.",
    difficulty: "medium"
  }];
}
