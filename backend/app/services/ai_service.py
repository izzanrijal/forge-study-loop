
import os
import re
import json
from typing import List, Dict, Any, Optional, Tuple
import google.generativeai as genai
import PyPDF2
import markdown
from io import BytesIO
import uuid
import httpx

from ..core.config import settings
from ..models.database import LearningObjective, Question

class OptimizedAIService:
    def __init__(self):
        # Configure Gemini with optimized settings
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(
                'gemini-pro',
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    top_p=0.8,
                    top_k=40,
                    max_output_tokens=8192,
                )
            )
        else:
            print("Warning: GEMINI_API_KEY not configured")
            self.model = None
    
    async def download_file_from_storage(self, file_path: str) -> bytes:
        """Download file from Supabase storage"""
        try:
            storage_url = f"{settings.supabase_url}/storage/v1/object/public/documents/{file_path}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(storage_url)
                if response.status_code == 200:
                    return response.content
                else:
                    raise Exception(f"Failed to download file: {response.status_code}")
                    
        except Exception as e:
            raise Exception(f"Failed to download file from storage: {str(e)}")
    
    async def extract_content_from_file(self, file_content: bytes, filename: str) -> str:
        """Extract text content from various file types"""
        try:
            file_extension = filename.split('.')[-1].lower()
            
            if file_extension == 'pdf':
                return await self._extract_pdf_content(file_content)
            elif file_extension in ['md', 'markdown']:
                return await self._extract_markdown_content(file_content)
            elif file_extension == 'txt':
                return file_content.decode('utf-8')
            else:
                raise Exception(f"Unsupported file type: {file_extension}")
                
        except Exception as e:
            raise Exception(f"Failed to extract content from file: {str(e)}")
    
    async def _extract_pdf_content(self, file_content: bytes) -> str:
        """Extract text from PDF with better formatting"""
        try:
            pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
            text_parts = []
            
            for page_num, page in enumerate(pdf_reader.pages, 1):
                page_text = page.extract_text()
                if page_text.strip():
                    # Clean and format text
                    page_text = self._clean_extracted_text(page_text)
                    text_parts.append(f"## Page {page_num}\n\n{page_text}\n")
            
            return '\n'.join(text_parts)
        except Exception as e:
            raise Exception(f"Failed to extract PDF content: {str(e)}")
    
    async def _extract_markdown_content(self, file_content: bytes) -> str:
        """Extract content from Markdown files"""
        try:
            # Decode markdown content
            md_content = file_content.decode('utf-8')
            
            # Convert to HTML then back to clean text for processing
            html = markdown.markdown(md_content)
            
            # Return original markdown for better structure preservation
            return md_content
        except Exception as e:
            raise Exception(f"Failed to extract Markdown content: {str(e)}")
    
    def _clean_extracted_text(self, text: str) -> str:
        """Clean and format extracted text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common PDF extraction issues
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Add space between camelCase
        text = re.sub(r'([.!?])\s*([A-Z])', r'\1\n\n\2', text)  # New paragraph after sentences
        
        # Remove page numbers and headers/footers (basic heuristic)
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            # Skip likely page numbers, headers, footers
            if len(line) < 3 or line.isdigit() or re.match(r'^Page \d+', line):
                continue
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    async def parse_learning_objectives_from_content(self, content: str, filename: str) -> List[Dict[str, Any]]:
        """Parse learning objectives from content using optimized Gemini prompts"""
        
        if not self.model:
            raise Exception("Gemini API not configured")
        
        # Enhanced prompt for better learning objective extraction
        prompt = f"""
        Analisis konten pembelajaran berikut dan ekstrak learning objectives (tujuan pembelajaran) yang komprehensif.

        INSTRUKSI:
        1. Identifikasi 3-8 learning objectives utama dari konten
        2. Setiap learning objective harus spesifik dan terukur
        3. Prioritaskan berdasarkan kompleksitas dan kepentingan
        4. Ekstrak teks materi yang relevan untuk setiap learning objective
        5. Buat deskripsi yang jelas dan actionable

        KONTEN PEMBELAJARAN:
        Nama File: {filename}
        
        {content[:12000]}  # Limit untuk menghindari token limit

        OUTPUT FORMAT (JSON):
        [
          {{
            "title": "Judul learning objective yang spesifik",
            "description": "Deskripsi detail tentang apa yang akan dipelajari",
            "priority": "High|Medium|Low",
            "page_range": "Halaman atau section yang relevan",
            "content_text": "Materi lengkap untuk pembelajaran topik ini (minimal 500 kata)",
            "estimated_study_time": "Estimasi waktu belajar dalam menit",
            "difficulty_level": "Beginner|Intermediate|Advanced",
            "key_concepts": ["konsep1", "konsep2", "konsep3"]
          }}
        ]

        PENTING: Return HANYA JSON array yang valid, tanpa markup atau teks tambahan.
        """
        
        try:
            response = self.model.generate_content(prompt)
            content_text = response.text
            
            # Extract JSON with better error handling
            json_match = re.search(r'\[.*?\]', content_text, re.DOTALL)
            if json_match:
                learning_objectives = json.loads(json_match.group())
                
                # Validate and enhance each learning objective
                validated_objectives = []
                for obj in learning_objectives:
                    if self._validate_learning_objective(obj):
                        validated_objectives.append(obj)
                
                return validated_objectives if validated_objectives else self._create_fallback_objectives(content, filename)
            else:
                return self._create_fallback_objectives(content, filename)
                
        except Exception as e:
            print(f"Error parsing learning objectives: {str(e)}")
            return self._create_fallback_objectives(content, filename)
    
    def _validate_learning_objective(self, obj: Dict) -> bool:
        """Validate learning objective structure"""
        required_fields = ['title', 'description', 'priority', 'content_text']
        return all(field in obj and obj[field] for field in required_fields)
    
    def _create_fallback_objectives(self, content: str, filename: str) -> List[Dict[str, Any]]:
        """Create fallback learning objectives if AI parsing fails"""
        content_preview = content[:2000] if len(content) > 2000 else content
        
        return [
            {
                "title": f"Pemahaman Konsep Utama dari {filename}",
                "description": "Memahami konsep-konsep fundamental yang dibahas dalam materi pembelajaran",
                "priority": "High",
                "page_range": "1-end",
                "content_text": content_preview,
                "estimated_study_time": "30",
                "difficulty_level": "Intermediate",
                "key_concepts": ["konsep dasar", "prinsip utama", "aplikasi praktis"]
            }
        ]
    
    async def generate_comprehensive_questions(self, learning_objective: Dict, min_questions: int = 30) -> List[Dict[str, Any]]:
        """Generate comprehensive questions using optimized Gemini prompts"""
        
        if not self.model:
            raise Exception("Gemini API not configured")
        
        # Enhanced prompt for diverse, high-quality question generation
        prompt = f"""
        Buat {min_questions} soal pilihan ganda berkualitas tinggi berdasarkan learning objective berikut:

        LEARNING OBJECTIVE:
        Judul: {learning_objective['title']}
        Deskripsi: {learning_objective.get('description', '')}
        Tingkat Kesulitan: {learning_objective.get('difficulty_level', 'Intermediate')}
        
        MATERI PEMBELAJARAN:
        {learning_objective.get('content_text', '')[:8000]}

        PERSYARATAN SOAL:
        1. Buat {min_questions} soal dengan distribusi:
           - 30% mudah (pemahaman dasar, definisi)
           - 50% sedang (aplikasi, analisis)
           - 20% sulit (sintesis, evaluasi, problem solving)
        
        2. Variasi tipe soal:
           - Faktual (apa, kapan, siapa)
           - Konseptual (mengapa, bagaimana)
           - Prosedural (langkah-langkah)
           - Aplikatif (penerapan dalam situasi baru)
           - Analitis (perbandingan, hubungan)
        
        3. Setiap soal harus:
           - Jelas dan tidak ambigu
           - Memiliki 4 pilihan yang logis
           - Distractor yang masuk akal
           - Penjelasan yang edukatif
           - Menguji pemahaman berbeda

        OUTPUT FORMAT (JSON):
        [
          {{
            "question_text": "Pertanyaan yang jelas dan spesifik?",
            "option_a": "Pilihan A yang masuk akal",
            "option_b": "Pilihan B yang masuk akal", 
            "option_c": "Pilihan C yang masuk akal",
            "option_d": "Pilihan D yang masuk akal",
            "correct_answer": "A|B|C|D",
            "explanation": "Penjelasan lengkap mengapa jawaban benar dan mengapa pilihan lain salah",
            "difficulty": "easy|medium|hard",
            "question_type": "factual|conceptual|procedural|application|analytical",
            "cognitive_level": "remember|understand|apply|analyze|evaluate|create"
          }}
        ]

        PENTING: 
        - Return HANYA JSON array yang valid
        - Pastikan semua {min_questions} soal berbeda dan tidak berulang
        - Hindari soal yang terlalu mudah ditebak
        - Buat soal yang mengukur pemahaman mendalam
        """
        
        try:
            response = self.model.generate_content(prompt)
            content_text = response.text
            
            json_match = re.search(r'\[.*?\]', content_text, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group())
                
                # Validate and ensure we have enough questions
                validated_questions = []
                for q in questions:
                    if self._validate_question(q):
                        validated_questions.append(q)
                
                # If we don't have enough questions, generate more
                if len(validated_questions) < min_questions:
                    additional_questions = await self._generate_additional_questions(
                        learning_objective, 
                        min_questions - len(validated_questions),
                        validated_questions
                    )
                    validated_questions.extend(additional_questions)
                
                return validated_questions[:min_questions]
            else:
                return self._create_fallback_questions(learning_objective, min_questions)
                
        except Exception as e:
            print(f"Error generating questions: {str(e)}")
            return self._create_fallback_questions(learning_objective, min_questions)
    
    def _validate_question(self, question: Dict) -> bool:
        """Validate question structure and content"""
        required_fields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation']
        
        if not all(field in question and question[field] for field in required_fields):
            return False
        
        # Validate correct_answer format
        if question['correct_answer'].upper() not in ['A', 'B', 'C', 'D']:
            return False
        
        # Ensure question text is substantial
        if len(question['question_text']) < 10:
            return False
        
        return True
    
    async def _generate_additional_questions(self, learning_objective: Dict, needed_count: int, existing_questions: List[Dict]) -> List[Dict[str, Any]]:
        """Generate additional questions to meet minimum requirement"""
        # Simplified prompt for additional questions
        prompt = f"""
        Buat {needed_count} soal pilihan ganda tambahan yang BERBEDA dari soal-soal yang sudah ada.
        
        Topik: {learning_objective['title']}
        Materi: {learning_objective.get('content_text', '')[:4000]}
        
        Hindari duplikasi dengan soal yang sudah ada. Buat soal dengan fokus berbeda.
        
        Format JSON yang sama seperti sebelumnya.
        """
        
        try:
            response = self.model.generate_content(prompt)
            content_text = response.text
            
            json_match = re.search(r'\[.*?\]', content_text, re.DOTALL)
            if json_match:
                additional_questions = json.loads(json_match.group())
                return [q for q in additional_questions if self._validate_question(q)]
        except:
            pass
        
        return self._create_fallback_questions(learning_objective, needed_count)
    
    def _create_fallback_questions(self, learning_objective: Dict, count: int) -> List[Dict[str, Any]]:
        """Create fallback questions if AI generation fails"""
        base_question = {
            "question_text": f"Apa konsep utama dalam {learning_objective['title']}?",
            "option_a": "Konsep fundamental yang mendasari pemahaman",
            "option_b": "Metode pembelajaran yang digunakan",
            "option_c": "Aplikasi praktis dari teori",
            "option_d": "Evaluasi hasil pembelajaran",
            "correct_answer": "A",
            "explanation": "Konsep fundamental adalah dasar pemahaman yang harus dikuasai terlebih dahulu.",
            "difficulty": "medium",
            "question_type": "conceptual",
            "cognitive_level": "understand"
        }
        
        questions = []
        for i in range(count):
            question = base_question.copy()
            question["question_text"] = f"Pertanyaan {i+1}: {question['question_text']}"
            questions.append(question)
        
        return questions

# Global optimized AI service instance
ai_service = OptimizedAIService()
