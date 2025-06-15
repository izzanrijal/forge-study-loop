
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

    // Enhanced detection prompt for predefined learning objectives
    const detectionPrompt = `
Analisis konten dokumen berikut dan tentukan apakah dokumen ini berisi tabel learning objectives yang sudah ditentukan dengan importance score.

Cari indikator berikut:
1. Tabel dengan kolom "Learning Objective" dan "Importance" 
2. Format tabel markdown dengan |Learning Objective|Importance (1-10)|
3. Daftar learning objectives dengan skor numerik 1-10
4. Format yang mirip dengan contoh yang diberikan

Dokumen: "${fileName}"
Konten (2000 karakter pertama): "${fileContent.substring(0, 2000)}"

Jika ditemukan tabel learning objectives, jawab dengan JSON:
{
  "has_predefined_objectives": true,
  "type": "predefined_table",
  "table_found": true
}

Jika tidak ditemukan tabel learning objectives, jawab dengan JSON:
{
  "has_predefined_objectives": false,
  "type": "regular_content",
  "table_found": false
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
    let hasTable = false;
    
    try {
      const detectionText = detectionData.candidates[0].content.parts[0].text;
      console.log('Detection response:', detectionText);
      
      const detectionJson = JSON.parse(detectionText.match(/\{[\s\S]*\}/)[0]);
      documentType = detectionJson.type;
      hasTable = detectionJson.table_found;
    } catch (e) {
      console.log('Detection parsing failed, using content analysis...');
      // Fallback detection based on content patterns
      if (fileContent.includes('Learning Objective') && fileContent.includes('Importance') && 
          (fileContent.includes('|') || fileContent.includes('**'))) {
        documentType = 'predefined_table';
        hasTable = true;
      }
    }

    console.log(`Document type detected: ${documentType}, Has table: ${hasTable}`);

    let learningObjectives: PredefinedLearningObjective[] = [];

    if (documentType === 'predefined_table' && hasTable) {
      // Enhanced extraction prompt for predefined learning objectives
      const extractionPrompt = `
TUGAS: Ekstrak SEMUA learning objectives dari tabel yang ada dalam dokumen ini.

DOKUMEN: "${fileName}"
KONTEN LENGKAP:
${fileContent}

INSTRUKSI EKSTRAKSI:
1. Cari tabel dengan format |Learning Objective|Importance (1-10)|
2. Ekstrak SETIAP baris learning objective dari tabel tersebut
3. Ambil importance score yang tepat (1-10)
4. Untuk setiap learning objective, ambil konten relevan dari dokumen untuk pembelajaran
5. Pastikan TIDAK ADA learning objective yang terlewat

CONTOH FORMAT YANG DICARI:
|Learning Objective|Importance (1-10)|
|:--|:-:|
|**Differentiate between typical angina...**|10|
|**Recognize the classic characteristics...**|9|

TUGAS CHUNKING:
Untuk setiap learning objective yang ditemukan, cari dan kumpulkan semua konten dari dokumen yang relevan dengan topik tersebut. Konten harus cukup untuk pembelajaran mendalam (minimal 200-300 kata per learning objective).

FORMAT OUTPUT JSON:
{
  "learning_objectives": [
    {
      "title": "Exact text dari learning objective tanpa ** formatting",
      "importance": 10,
      "content_text": "Konten pembelajaran yang relevan dan lengkap dari dokumen untuk topik ini"
    }
  ]
}

PENTING: 
- Ekstrak SEMUA learning objectives dari tabel, jangan sampai ada yang terlewat
- Importance score harus sesuai dengan angka di tabel (1-10)
- Title harus bersih tanpa markdown formatting (**) 
- Content_text harus berisi materi pembelajaran yang substansial
- Jika ada 20+ learning objectives di tabel, ekstrak semuanya
- RETURN HANYA JSON, tidak ada teks tambahan

MULAI EKSTRAKSI:
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
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          })
        }
      );

      const extractionData = await extractionResponse.json();
      console.log('Extraction response received');
      
      try {
        const responseText = extractionData.candidates[0].content.parts[0].text;
        console.log('Raw extraction response:', responseText.substring(0, 500));
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          learningObjectives = parsedData.learning_objectives || [];
          console.log(`Successfully extracted ${learningObjectives.length} learning objectives`);
        } else {
          console.error('No JSON found in response');
          throw new Error('No valid JSON found in extraction response');
        }
      } catch (parseError) {
        console.error('Failed to parse extraction response:', parseError);
        console.error('Raw response:', extractionData.candidates[0].content.parts[0].text);
        throw new Error('Failed to extract learning objectives from predefined table - parsing error');
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

    // Validate that we have learning objectives
    if (!learningObjectives || learningObjectives.length === 0) {
      throw new Error('No learning objectives could be extracted from the document');
    }

    console.log(`Final learning objectives count: ${learningObjectives.length}`);

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
      // Clean title from markdown formatting
      const cleanTitle = objective.title.replace(/\*\*/g, '').trim();
      
      // Map importance score to priority
      let priority: 'High' | 'Medium' | 'Low' = 'Medium';
      if (objective.importance >= 9) priority = 'High';
      else if (objective.importance <= 6) priority = 'Low';

      const { data: loData, error: loError } = await supabaseClient
        .from('learning_objectives')
        .insert({
          pdf_id: fileId,
          user_id: userId,
          title: cleanTitle,
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

    console.log(`Successfully processed document: ${fileName} with ${insertedObjectives.length} learning objectives`);

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
