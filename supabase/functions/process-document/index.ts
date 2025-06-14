
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessDocumentRequest {
  fileId: string;
  fileName: string;
  fileType: string;
  filePath: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { fileId, fileName, fileType, filePath }: ProcessDocumentRequest = await req.json()

    console.log(`Processing document: ${fileName} (${fileType}) with ID: ${fileId}`)

    // Update file status to processing
    await supabase
      .from('pdfs')
      .update({ processing_status: 'processing' })
      .eq('id', fileId)

    // Get file data to determine processing approach
    const { data: fileData } = await supabase
      .from('pdfs')
      .select('*')
      .eq('id', fileId)
      .single()

    if (!fileData) {
      throw new Error('File not found')
    }

    // Download file content from storage
    const { data: fileContent } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (!fileContent) {
      throw new Error('Failed to download file content')
    }

    // Convert file to text based on type
    let contentText = ''
    
    if (fileType === 'application/pdf') {
      // For PDF, we'll need to extract text (simplified here)
      contentText = await extractPDFText(fileContent)
    } else if (fileType === 'text/markdown' || fileName.endsWith('.md')) {
      contentText = await fileContent.text()
    } else if (fileType === 'text/plain') {
      contentText = await fileContent.text()
    }

    // Call Gemini API for learning objectives extraction
    const learningObjectives = await generateLearningObjectives(contentText, fileName)
    
    // Create learning objective records
    const createdObjectives = []
    
    for (const lo of learningObjectives) {
      const loId = crypto.randomUUID()
      
      const { data: createdLO, error: loError } = await supabase
        .from('learning_objectives')
        .insert({
          id: loId,
          pdf_id: fileId,
          user_id: fileData.user_id,
          title: lo.title,
          description: lo.description,
          priority: lo.priority,
          page_range: lo.page_range || '',
          content_text: lo.content_text,
          mastery_level: 0,
          total_questions: 0
        })
        .select()
        .single()

      if (loError) {
        console.error('Error creating learning objective:', loError)
        continue
      }

      createdObjectives.push(createdLO)

      // Generate questions for this learning objective
      const questions = await generateQuestions(lo)
      
      // Insert questions
      const questionInserts = []
      for (const question of questions) {
        questionInserts.push({
          id: crypto.randomUUID(),
          learning_objective_id: loId,
          question_text: question.question_text,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          option_d: question.option_d,
          correct_answer: question.correct_answer.toUpperCase(),
          explanation: question.explanation,
          difficulty: question.difficulty
        })
      }

      if (questionInserts.length > 0) {
        await supabase
          .from('questions')
          .insert(questionInserts)

        // Update learning objective with question count
        await supabase
          .from('learning_objectives')
          .update({ total_questions: questionInserts.length })
          .eq('id', loId)
      }
    }

    // Update file status to completed
    await supabase
      .from('pdfs')
      .update({ 
        processing_status: 'completed',
        total_learning_objectives: createdObjectives.length 
      })
      .eq('id', fileId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document processed successfully',
        learning_objectives_count: createdObjectives.length,
        file_type: fileType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (error) {
    console.error('Error processing document:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})

async function extractPDFText(fileContent: Blob): Promise<string> {
  // Simplified PDF text extraction
  // In production, you'd use a proper PDF parsing library
  try {
    const arrayBuffer = await fileContent.arrayBuffer()
    const text = new TextDecoder().decode(arrayBuffer)
    // Basic PDF text extraction (this is very simplified)
    return text.replace(/[^\w\s\n.,!?-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  } catch (error) {
    console.error('PDF extraction error:', error)
    return 'Failed to extract PDF content. Please try uploading as text or markdown.'
  }
}

async function generateLearningObjectives(contentText: string, fileName: string) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  
  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY not configured, using fallback')
    return createFallbackObjectives(contentText, fileName)
  }

  const prompt = `
  Analisis konten pembelajaran berikut dan ekstrak learning objectives yang komprehensif.

  INSTRUKSI:
  1. Identifikasi 3-6 learning objectives utama dari konten
  2. Setiap learning objective harus spesifik dan terukur
  3. Prioritaskan berdasarkan kompleksitas dan kepentingan
  4. Ekstrak teks materi yang relevan untuk setiap learning objective

  KONTEN: ${contentText.substring(0, 8000)}

  Return dalam format JSON array:
  [
    {
      "title": "Judul learning objective spesifik",
      "description": "Deskripsi detail pembelajaran",
      "priority": "High|Medium|Low",
      "page_range": "Section atau bagian yang relevan",
      "content_text": "Materi lengkap untuk pembelajaran (minimal 300 kata)"
    }
  ]

  Return HANYA JSON array yang valid.
  `

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 4096,
        }
      })
    })

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    const jsonMatch = generatedText.match(/\[.*?\]/s)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Gemini API error:', error)
  }

  return createFallbackObjectives(contentText, fileName)
}

async function generateQuestions(learningObjective: any) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  
  if (!geminiApiKey) {
    return createFallbackQuestions(learningObjective)
  }

  const prompt = `
  Buat 15-20 soal pilihan ganda berkualitas tinggi untuk learning objective berikut:

  Judul: ${learningObjective.title}
  Materi: ${learningObjective.content_text?.substring(0, 4000)}

  Persyaratan:
  1. Soal bervariasi (mudah, sedang, sulit)
  2. 4 pilihan jawaban logis
  3. Penjelasan yang edukatif
  4. Tidak berulang/duplikat

  Format JSON:
  [
    {
      "question_text": "Pertanyaan jelas?",
      "option_a": "Pilihan A",
      "option_b": "Pilihan B", 
      "option_c": "Pilihan C",
      "option_d": "Pilihan D",
      "correct_answer": "A",
      "explanation": "Penjelasan lengkap",
      "difficulty": "easy|medium|hard"
    }
  ]

  Return HANYA JSON array.
  `

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 6144,
        }
      })
    })

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    const jsonMatch = generatedText.match(/\[.*?\]/s)
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0])
      return questions.filter((q: any) => 
        q.question_text && q.option_a && q.option_b && 
        q.option_c && q.option_d && q.correct_answer && q.explanation
      )
    }
  } catch (error) {
    console.error('Question generation error:', error)
  }

  return createFallbackQuestions(learningObjective)
}

function createFallbackObjectives(contentText: string, fileName: string) {
  return [
    {
      title: `Pemahaman Materi dari ${fileName}`,
      description: "Memahami konsep-konsep utama dan prinsip-prinsip yang dibahas dalam materi pembelajaran",
      priority: "High",
      page_range: "Keseluruhan dokumen",
      content_text: contentText.substring(0, 2000)
    }
  ]
}

function createFallbackQuestions(learningObjective: any) {
  return [
    {
      question_text: `Apa fokus utama dari pembelajaran "${learningObjective.title}"?`,
      option_a: "Memahami konsep dasar dan prinsip fundamental",
      option_b: "Menghafalkan definisi dan istilah",
      option_c: "Mengerjakan latihan soal",
      option_d: "Membuat ringkasan materi",
      correct_answer: "A",
      explanation: "Fokus utama pembelajaran adalah memahami konsep dasar dan prinsip fundamental yang mendasari materi.",
      difficulty: "medium"
    }
  ]
}
