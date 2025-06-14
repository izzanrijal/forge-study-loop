
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
import uuid

from ...core.database import get_db
from ...models.database import StudySession, Question, QuestionAttempt
from ...services.fsrs_service import fsrs_service

router = APIRouter()

@router.post("/session/start")
async def start_study_session(
    session_type: str = "test",  # "study" or "test"
    user_id: str = "user-1",  # TODO: Get from auth
    db: Session = Depends(get_db)
):
    """Start a new study session"""
    
    session_id = str(uuid.uuid4())
    
    session = StudySession(
        id=session_id,
        user_id=user_id,
        session_type=session_type,
        started_at=datetime.utcnow()
    )
    
    db.add(session)
    db.commit()
    
    return {
        "session_id": session_id,
        "session_type": session_type,
        "started_at": session.started_at
    }

@router.post("/session/{session_id}/answer")
async def submit_answer(
    session_id: str,
    answer_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Submit an answer for a question in a session"""
    
    question_id = answer_data.get("question_id")
    user_answer = answer_data.get("user_answer")
    response_time = answer_data.get("response_time", 0)
    difficulty_rating = answer_data.get("difficulty_rating", "medium")
    
    # Get question
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if answer is correct
    is_correct = user_answer == question.correct_answer
    
    # Create attempt record
    attempt = QuestionAttempt(
        id=str(uuid.uuid4()),
        session_id=session_id,
        question_id=question_id,
        user_answer=user_answer,
        is_correct=is_correct,
        response_time=response_time,
        difficulty_rating=difficulty_rating
    )
    
    db.add(attempt)
    
    # Update question using FSRS
    grade = fsrs_service.convert_user_rating_to_grade(difficulty_rating, is_correct)
    fsrs_updates = fsrs_service.update_card_after_review(question, grade, response_time)
    
    # Apply FSRS updates
    question.stability = fsrs_updates["stability"]
    question.difficulty_rating = fsrs_updates["difficulty_rating"]
    question.last_reviewed = fsrs_updates["last_reviewed"]
    question.next_review = fsrs_updates["next_review"]
    question.review_count = fsrs_updates["review_count"]
    
    db.commit()
    
    return {
        "is_correct": is_correct,
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
        "next_review": question.next_review
    }

@router.post("/session/{session_id}/complete")
async def complete_study_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Complete a study session and calculate results"""
    
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all attempts for this session
    attempts = db.query(QuestionAttempt).filter(
        QuestionAttempt.session_id == session_id
    ).all()
    
    total_questions = len(attempts)
    correct_answers = sum(1 for attempt in attempts if attempt.is_correct)
    accuracy = (correct_answers / total_questions * 100) if total_questions > 0 else 0
    
    # Update session
    session.completed_at = datetime.utcnow()
    session.total_questions = total_questions
    session.correct_answers = correct_answers
    session.accuracy = accuracy
    
    db.commit()
    
    return {
        "session_id": session_id,
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "accuracy": accuracy,
        "completed_at": session.completed_at
    }

@router.get("/session/{session_id}/results")
async def get_session_results(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed results for a study session"""
    
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    attempts = db.query(QuestionAttempt).filter(
        QuestionAttempt.session_id == session_id
    ).all()
    
    return {
        "session": {
            "id": session.id,
            "session_type": session.session_type,
            "started_at": session.started_at,
            "completed_at": session.completed_at,
            "total_questions": session.total_questions,
            "correct_answers": session.correct_answers,
            "accuracy": session.accuracy
        },
        "attempts": [
            {
                "question_id": attempt.question_id,
                "user_answer": attempt.user_answer,
                "is_correct": attempt.is_correct,
                "response_time": attempt.response_time,
                "difficulty_rating": attempt.difficulty_rating
            }
            for attempt in attempts
        ]
    }
