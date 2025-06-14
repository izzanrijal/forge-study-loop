
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid
import os
from datetime import datetime

from ...core.database import get_db
from ...models.database import PDF, LearningObjective, Question
from ...services.ai_service import ai_service
from ...core.config import settings

router = APIRouter()

@router.post("/upload")
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = "user-1",  # TODO: Get from auth
    db: Session = Depends(get_db)
):
    """Upload and process PDF file"""
    
    # Validate file
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    if file.size > settings.max_file_size:
        raise HTTPException(status_code=400, detail="File size too large")
    
    # Create upload directory if it doesn't exist
    os.makedirs(settings.upload_dir, exist_ok=True)
    
    # Save file
    pdf_id = str(uuid.uuid4())
    file_path = os.path.join(settings.upload_dir, f"{pdf_id}_{file.filename}")
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create PDF record
    pdf_record = PDF(
        id=pdf_id,
        user_id=user_id,
        filename=file.filename,
        file_path=file_path,
        uploaded_at=datetime.utcnow(),
        processed=False
    )
    
    db.add(pdf_record)
    db.commit()
    
    # Process PDF in background
    background_tasks.add_task(process_pdf_task, pdf_id, content, db)
    
    return {
        "pdf_id": pdf_id,
        "message": "PDF uploaded successfully. Processing started.",
        "status": "processing"
    }

async def process_pdf_task(pdf_id: str, file_content: bytes, db: Session):
    """Background task to process PDF and generate questions"""
    try:
        # Extract text
        pdf_text = await ai_service.extract_text_from_pdf(file_content)
        
        # Parse learning objectives
        learning_objectives = await ai_service.parse_learning_objectives_table(pdf_text)
        
        # Extract content chunks
        content_chunks = await ai_service.extract_content_chunks(pdf_text, learning_objectives)
        
        # Create learning objective records
        for lo_data in learning_objectives:
            lo_id = lo_data["id"]
            
            lo_record = LearningObjective(
                id=lo_id,
                pdf_id=pdf_id,
                title=lo_data["title"],
                priority=lo_data["priority"],
                page_range=lo_data.get("page_range", ""),
                tags=lo_data.get("tags", []),
                content_chunk=content_chunks.get(lo_id, ""),
                mastery_percent=0.0
            )
            
            db.add(lo_record)
            db.commit()
            
            # Generate questions for this LO
            questions = await ai_service.generate_questions_for_lo(lo_data, content_chunks.get(lo_id, ""))
            
            for q_data in questions:
                question_record = Question(
                    id=q_data["id"],
                    learning_objective_id=lo_id,
                    question_text=q_data["question_text"],
                    options=q_data["options"],
                    correct_answer=q_data["correct_answer"],
                    explanation=q_data["explanation"],
                    difficulty=q_data["difficulty"],
                    stability=1.0,
                    difficulty_rating=5.0,
                    review_count=0
                )
                
                db.add(question_record)
            
            db.commit()
        
        # Mark PDF as processed
        pdf_record = db.query(PDF).filter(PDF.id == pdf_id).first()
        if pdf_record:
            pdf_record.processed = True
            db.commit()
            
    except Exception as e:
        print(f"Error processing PDF {pdf_id}: {str(e)}")
        # TODO: Update PDF record with error status

@router.get("/status/{pdf_id}")
async def get_pdf_status(pdf_id: str, db: Session = Depends(get_db)):
    """Get PDF processing status"""
    
    pdf_record = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf_record:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    return {
        "pdf_id": pdf_id,
        "filename": pdf_record.filename,
        "processed": pdf_record.processed,
        "uploaded_at": pdf_record.uploaded_at
    }

@router.get("/learning-objectives/{pdf_id}")
async def get_learning_objectives(pdf_id: str, db: Session = Depends(get_db)):
    """Get learning objectives for a PDF"""
    
    learning_objectives = db.query(LearningObjective).filter(
        LearningObjective.pdf_id == pdf_id
    ).all()
    
    return [
        {
            "id": lo.id,
            "title": lo.title,
            "priority": lo.priority,
            "page_range": lo.page_range,
            "tags": lo.tags,
            "mastery_percent": lo.mastery_percent
        }
        for lo in learning_objectives
    ]
