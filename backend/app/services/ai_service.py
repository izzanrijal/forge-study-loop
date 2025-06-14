
import os
import re
import json
from typing import List, Dict, Any, Optional, Tuple
import google.generativeai as genai
from PyPDF2 import PdfReader
from io import BytesIO
import uuid
import httpx

from ..core.config import settings
from ..models.database import LearningObjective, Question

class AIService:
    def __init__(self):
        # Configure Gemini
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            print("Warning: GEMINI_API_KEY not configured")
            self.model = None
    
    async def download_pdf_from_storage(self, file_path: str) -> bytes:
        """Download PDF file from Supabase storage"""
        try:
            # Construct Supabase storage URL
            storage_url = f"{settings.supabase_url}/storage/v1/object/public/pdfs/{file_path}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(storage_url)
                if response.status_code == 200:
                    return response.content
                else:
                    raise Exception(f"Failed to download file: {response.status_code}")
                    
        except Exception as e:
            raise Exception(f"Failed to download PDF from storage: {str(e)}")
    
    async def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text content from PDF file"""
        try:
            pdf_reader = PdfReader(BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    async def parse_learning_objectives_from_text(self, pdf_text: str) -> List[Dict[str, Any]]:
        """Parse learning objectives from PDF text using Gemini"""
        
        if not self.model:
            raise Exception("Gemini API not configured")
        
        prompt = f"""
        Analisis teks PDF berikut dan ekstrak learning objectives (tujuan pembelajaran).
        
        Jika ada tabel learning objectives, ekstrak semuanya. Jika tidak ada tabel eksplisit, 
        identifikasi topik-topik utama yang bisa dijadikan learning objectives.
        
        Return dalam format JSON array seperti ini:
        [
          {{
            "title": "Judul learning objective",
            "description": "Deskripsi singkat",
            "priority": "High|Medium|Low",
            "page_range": "1-5",
            "content": "Konten terkait dari PDF"
          }}
        ]
        
        Teks PDF:
        {pdf_text[:8000]}
        
        Return hanya JSON array, tanpa teks tambahan.
        """
        
        try:
            response = self.model.generate_content(prompt)
            content = response.text
            
            # Extract JSON from response
            json_match = re.search(r'\[.*?\]', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # If no JSON found, create default learning objectives
                return [
                    {
                        "title": "Pemahaman Konsep Dasar",
                        "description": "Memahami konsep-konsep dasar dari materi",
                        "priority": "High",
                        "page_range": "1-10",
                        "content": pdf_text[:2000]
                    }
                ]
                
        except Exception as e:
            print(f"Error parsing learning objectives: {str(e)}")
            # Return default learning objective if AI fails
            return [
                {
                    "title": "Pemahaman Materi",
                    "description": "Memahami materi dari dokumen yang diupload",
                    "priority": "Medium",
                    "page_range": "1-end",
                    "content": pdf_text[:2000]
                }
            ]
    
    async def generate_questions_for_lo(self, learning_objective: Dict) -> List[Dict[str, Any]]:
        """Generate MCQ questions for a learning objective using Gemini"""
        
        if not self.model:
            raise Exception("Gemini API not configured")
        
        prompt = f"""
        Buat 4-5 soal pilihan ganda berdasarkan learning objective berikut:
        
        Judul: {learning_objective['title']}
        Deskripsi: {learning_objective.get('description', '')}
        Konten: {learning_objective.get('content', '')}
        
        Buat soal yang:
        1. Menguji pemahaman faktual dan konseptual
        2. Jelas dan tidak ambigu
        3. Memiliki 4 pilihan (A, B, C, D)
        4. Disertai penjelasan untuk jawaban yang benar
        5. Bervariasi tingkat kesulitan (2 mudah, 2 sedang, 1 sulit)
        
        Return dalam format JSON array:
        [
          {{
            "question_text": "Pertanyaan di sini?",
            "options": ["A) Pilihan 1", "B) Pilihan 2", "C) Pilihan 3", "D) Pilihan 4"],
            "correct_answer": "A",
            "explanation": "Penjelasan mengapa jawaban ini benar",
            "difficulty": "easy|medium|hard"
          }}
        ]
        
        Return hanya JSON array.
        """
        
        try:
            response = self.model.generate_content(prompt)
            content = response.text
            
            json_match = re.search(r'\[.*?\]', content, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group())
                return questions
            else:
                # Return default question if AI fails
                return [
                    {
                        "question_text": f"Apa yang dimaksud dengan {learning_objective['title']}?",
                        "options": [
                            "A) Konsep dasar dalam pembelajaran",
                            "B) Metode pembelajaran",
                            "C) Tujuan pembelajaran spesifik",
                            "D) Semua jawaban benar"
                        ],
                        "correct_answer": "C",
                        "explanation": "Learning objective adalah tujuan pembelajaran spesifik yang ingin dicapai.",
                        "difficulty": "medium"
                    }
                ]
                
        except Exception as e:
            print(f"Error generating questions: {str(e)}")
            # Return default question if AI fails
            return [
                {
                    "question_text": f"Pertanyaan tentang {learning_objective['title']}",
                    "options": [
                        "A) Pilihan A",
                        "B) Pilihan B", 
                        "C) Pilihan C",
                        "D) Pilihan D"
                    ],
                    "correct_answer": "A",
                    "explanation": "Penjelasan default",
                    "difficulty": "medium"
                }
            ]

# Global AI service instance
ai_service = AIService()
