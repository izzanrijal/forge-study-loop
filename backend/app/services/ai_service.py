
import os
import re
import json
from typing import List, Dict, Any, Optional, Tuple
from openai import OpenAI
import litellm
from PyPDF2 import PdfReader
from io import BytesIO
import uuid

from ..core.config import settings
from ..models.database import LearningObjective, Question

class AIService:
    def __init__(self):
        self.openai_client = OpenAI(api_key=settings.openai_api_key)
        # Configure LiteLLM for Gemini
        os.environ["GEMINI_API_KEY"] = settings.gemini_api_key
    
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
    
    async def parse_learning_objectives_table(self, pdf_text: str) -> List[Dict[str, Any]]:
        """Parse Learning Objectives table from PDF text using AI"""
        
        prompt = """
        You are an expert at parsing educational documents. Extract the Learning Objectives table from the following PDF text.
        
        Look for a table with columns like: ID, Learning Objective, Priority, Page Range, Tags
        
        Return the data as a JSON array with this exact structure:
        [
          {
            "id": "LO-001",
            "title": "Learning objective title",
            "priority": "High|Medium|Low",
            "page_range": "1-5",
            "tags": ["tag1", "tag2"]
          }
        ]
        
        PDF Text:
        {pdf_text}
        
        Return only the JSON array, no additional text.
        """
        
        try:
            response = await litellm.acompletion(
                model="gemini/gemini-pro",
                messages=[{"role": "user", "content": prompt.format(pdf_text=pdf_text[:4000])}],
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            # Extract JSON from response
            json_match = re.search(r'\[.*?\]', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise Exception("No valid JSON found in AI response")
                
        except Exception as e:
            raise Exception(f"Failed to parse learning objectives: {str(e)}")
    
    async def extract_content_chunks(self, pdf_text: str, learning_objectives: List[Dict]) -> Dict[str, str]:
        """Extract content chunks for each learning objective based on page ranges"""
        
        chunks = {}
        
        for lo in learning_objectives:
            page_range = lo.get("page_range", "")
            lo_id = lo.get("id")
            title = lo.get("title")
            
            # Simple heuristic: extract content that mentions the LO title or related concepts
            prompt = f"""
            Extract the relevant content for this learning objective from the PDF text:
            
            Learning Objective: {title}
            Page Range: {page_range}
            
            Find and extract the section of text that covers this learning objective.
            Return only the relevant content, cleaned and formatted for study.
            
            PDF Text:
            {pdf_text[:8000]}
            """
            
            try:
                response = await litellm.acompletion(
                    model="gemini/gemini-pro",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1
                )
                
                chunks[lo_id] = response.choices[0].message.content.strip()
                
            except Exception as e:
                print(f"Failed to extract chunk for {lo_id}: {str(e)}")
                chunks[lo_id] = f"Content for {title} (extraction failed)"
        
        return chunks
    
    async def generate_questions_for_lo(self, learning_objective: Dict, content_chunk: str) -> List[Dict[str, Any]]:
        """Generate 4-5 MCQ questions for a learning objective"""
        
        prompt = f"""
        You are an expert question generator for educational content. Create 4-5 multiple choice questions based on this learning objective and content.
        
        Learning Objective: {learning_objective['title']}
        Priority: {learning_objective['priority']}
        
        Content:
        {content_chunk}
        
        Generate questions that:
        1. Test factual knowledge and understanding
        2. Are clearly worded and unambiguous
        3. Have 4 options each (A, B, C, D)
        4. Include explanations for correct answers
        5. Vary in difficulty (2 easy, 2 medium, 1 hard)
        
        Return as JSON array with this structure:
        [
          {{
            "question_text": "Question here?",
            "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
            "correct_answer": "A",
            "explanation": "Explanation of why this is correct",
            "difficulty": "easy|medium|hard"
          }}
        ]
        
        Return only the JSON array.
        """
        
        try:
            response = await litellm.acompletion(
                model="gemini/gemini-pro",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            json_match = re.search(r'\[.*?\]', content, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group())
                
                # Add unique IDs to questions
                for i, question in enumerate(questions):
                    question["id"] = f"Q-{uuid.uuid4().hex[:8]}"
                
                return questions
            else:
                raise Exception("No valid JSON found in AI response")
                
        except Exception as e:
            raise Exception(f"Failed to generate questions: {str(e)}")
    
    async def check_question_coverage(self, learning_objective_id: str, existing_questions: List[Question]) -> bool:
        """Check if we need to generate more questions for a learning objective"""
        
        # For now, simple logic: if we have less than 8 questions, generate more
        # In production, this could be more sophisticated based on question performance
        
        return len(existing_questions) < 8
    
    async def generate_additional_questions(self, learning_objective: Dict, content_chunk: str, existing_questions: List[Question]) -> List[Dict[str, Any]]:
        """Generate additional questions when existing ones are exhausted"""
        
        existing_texts = [q.question_text for q in existing_questions]
        
        prompt = f"""
        Generate 3-4 NEW multiple choice questions for this learning objective.
        
        Learning Objective: {learning_objective['title']}
        Content: {content_chunk}
        
        IMPORTANT: Do NOT create questions similar to these existing ones:
        {chr(10).join(existing_texts)}
        
        Create fresh questions that test the same concepts from different angles.
        Follow the same JSON format as before.
        """
        
        try:
            response = await litellm.acompletion(
                model="gemini/gemini-pro",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4  # Slightly higher temperature for variety
            )
            
            content = response.choices[0].message.content
            json_match = re.search(r'\[.*?\]', content, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group())
                
                for i, question in enumerate(questions):
                    question["id"] = f"Q-{uuid.uuid4().hex[:8]}"
                
                return questions
            else:
                return []
                
        except Exception as e:
            print(f"Failed to generate additional questions: {str(e)}")
            return []

# Global AI service instance
ai_service = AIService()
