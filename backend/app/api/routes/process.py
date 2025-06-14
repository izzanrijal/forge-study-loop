
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
import uuid
from datetime import datetime

from ...core.database import get_db
from ...models.database import PDF, LearningObjective, Question
from ...services.ai_service import ai_service
from ...services.email_service import send_processing_complete_email

router = APIRouter()

@router.post("/pdf/{pdf_id}")
async def process_pdf(
    pdf_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start processing a PDF file"""
    
    # Get PDF record
    pdf_record = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf_record:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    if pdf_record.processing_status == "processing":
        raise HTTPException(status_code=400, detail="PDF is already being processed")
    
    # Update status to processing
    pdf_record.processing_status = "processing"
    db.commit()
    
    # Start background processing
    background_tasks.add_task(process_pdf_task, pdf_id, db)
    
    return {
        "message": "PDF processing started",
        "pdf_id": pdf_id,
        "status": "processing"
    }

async def process_pdf_task(pdf_id: str, db: Session):
    """Background task to process PDF and generate questions"""
    try:
        # Get PDF record
        pdf_record = db.query(PDF).filter(PDF.id == pdf_id).first()
        if not pdf_record:
            return
        
        # Download file from Supabase storage
        file_content = await ai_service.download_pdf_from_storage(pdf_record.file_path)
        
        # Extract text
        pdf_text = await ai_service.extract_text_from_pdf(file_content)
        
        # Parse learning objectives
        learning_objectives = await ai_service.parse_learning_objectives_from_text(pdf_text)
        
        # Create learning objective records
        for lo_data in learning_objectives:
            lo_id = str(uuid.uuid4())
            
            lo_record = LearningObjective(
                id=lo_id,
                pdf_id=pdf_id,
                user_id=pdf_record.user_id,
                title=lo_data["title"],
                description=lo_data.get("description", ""),
                priority=lo_data.get("priority", "Medium"),
                page_range=lo_data.get("page_range", ""),
                content_text=lo_data.get("content", ""),
                mastery_level=0.0,
                total_questions=0
            )
            
            db.add(lo_record)
            db.commit()
            
            # Generate questions for this LO
            questions = await ai_service.generate_questions_for_lo(lo_data)
            
            for q_data in questions:
                question_record = Question(
                    id=str(uuid.uuid4()),
                    learning_objective_id=lo_id,
                    question_text=q_data["question_text"],
                    option_a=q_data["options"][0],
                    option_b=q_data["options"][1], 
                    option_c=q_data["options"][2],
                    option_d=q_data["options"][3],
                    correct_answer=q_data["correct_answer"],
                    explanation=q_data["explanation"],
                    difficulty=q_data["difficulty"]
                )
                
                db.add(question_record)
            
            # Update LO with question count
            lo_record.total_questions = len(questions)
            db.commit()
        
        # Update PDF status and counts
        pdf_record.processing_status = "completed"
        pdf_record.total_learning_objectives = len(learning_objectives)
        db.commit()
        
        # Send completion email
        await send_processing_complete_email(pdf_record.user_id, pdf_record.filename)
        
    except Exception as e:
        print(f"Error processing PDF {pdf_id}: {str(e)}")
        # Update PDF status to failed
        pdf_record = db.query(PDF).filter(PDF.id == pdf_id).first()
        if pdf_record:
            pdf_record.processing_status = "failed"
            db.commit()

@router.get("/status/{pdf_id}")
async def get_processing_status(pdf_id: str, db: Session = Depends(get_db)):
    """Get processing status of a PDF"""
    
    pdf_record = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf_record:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    return {
        "pdf_id": pdf_id,
        "filename": pdf_record.filename,
        "status": pdf_record.processing_status,
        "total_learning_objectives": pdf_record.total_learning_objectives,
        "uploaded_at": pdf_record.upload_date
    }
