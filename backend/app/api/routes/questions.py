
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ...core.database import get_db
from ...models.database import Question, LearningObjective
from ...services.ai_service import ai_service
from ...services.fsrs_service import fsrs_service

router = APIRouter()

@router.get("/due")
async def get_due_questions(
    user_id: str = "user-1",  # TODO: Get from auth
    limit: int = 30,
    db: Session = Depends(get_db)
):
    """Get questions due for review"""
    
    # Get all questions for the user
    questions = db.query(Question).join(LearningObjective).join(LearningObjective.pdf).filter(
        Question.learning_objective.has(
            LearningObjective.pdf.has(user_id=user_id)
        )
    ).all()
    
    # Get due questions using FSRS
    due_questions = fsrs_service.get_due_questions(questions, limit)
    
    return [
        {
            "id": q.id,
            "learning_objective_id": q.learning_objective_id,
            "learning_objective_title": q.learning_objective.title,
            "question_text": q.question_text,
            "options": q.options,
            "difficulty": q.difficulty,
            "review_count": q.review_count
        }
        for q in due_questions
    ]

@router.get("/by-objective/{learning_objective_id}")
async def get_questions_by_objective(
    learning_objective_id: str,
    db: Session = Depends(get_db)
):
    """Get all questions for a specific learning objective"""
    
    questions = db.query(Question).filter(
        Question.learning_objective_id == learning_objective_id
    ).all()
    
    return [
        {
            "id": q.id,
            "question_text": q.question_text,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "difficulty": q.difficulty
        }
        for q in questions
    ]

@router.post("/check-coverage/{learning_objective_id}")
async def check_and_generate_questions(
    learning_objective_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Check if more questions are needed and generate them if necessary"""
    
    # Get learning objective
    lo = db.query(LearningObjective).filter(LearningObjective.id == learning_objective_id).first()
    if not lo:
        raise HTTPException(status_code=404, detail="Learning objective not found")
    
    # Get existing questions
    existing_questions = db.query(Question).filter(
        Question.learning_objective_id == learning_objective_id
    ).all()
    
    # Check if we need more questions
    needs_more = await ai_service.check_question_coverage(learning_objective_id, existing_questions)
    
    if needs_more:
        # Generate more questions in background
        background_tasks.add_task(generate_additional_questions_task, lo, existing_questions, db)
        return {"message": "Additional questions are being generated", "status": "generating"}
    else:
        return {"message": "Sufficient questions available", "status": "sufficient"}

async def generate_additional_questions_task(
    learning_objective: LearningObjective,
    existing_questions: List[Question],
    db: Session
):
    """Background task to generate additional questions"""
    try:
        lo_data = {
            "id": learning_objective.id,
            "title": learning_objective.title,
            "priority": learning_objective.priority
        }
        
        new_questions = await ai_service.generate_additional_questions(
            lo_data,
            learning_objective.content_chunk,
            existing_questions
        )
        
        for q_data in new_questions:
            question_record = Question(
                id=q_data["id"],
                learning_objective_id=learning_objective.id,
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
        
    except Exception as e:
        print(f"Error generating additional questions for {learning_objective.id}: {str(e)}")
