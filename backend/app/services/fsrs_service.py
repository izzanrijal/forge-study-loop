
from datetime import datetime, timedelta
from typing import List, Dict, Any
import math
from ..models.database import Question, QuestionAttempt

class FSRSService:
    """
    Simplified FSRS (Free Spaced Repetition Scheduler) implementation
    Based on the FSRS algorithm for spaced repetition
    """
    
    def __init__(self):
        # FSRS parameters (can be tuned)
        self.request_retention = 0.9  # Target retention rate
        self.maximum_interval = 36500  # Maximum interval in days
        self.w = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
    
    def calculate_stability(self, difficulty: float, stability: float, retrievability: float, grade: int) -> float:
        """Calculate new stability after review"""
        if grade == 1:  # Failed
            return self.w[11] * (difficulty ** -self.w[12]) * ((stability + 1) ** self.w[13] - 1) * math.exp(self.w[14] * (1 - retrievability))
        else:  # Passed
            return stability * (1 + math.exp(self.w[8]) * (11 - difficulty) * (stability ** -self.w[9]) * (math.exp((1 - retrievability) * self.w[10]) - 1))
    
    def calculate_difficulty(self, difficulty: float, grade: int) -> float:
        """Calculate new difficulty after review"""
        delta_d = -self.w[6] * (grade - 3)
        difficulty = difficulty + delta_d
        return max(1, min(10, difficulty))
    
    def calculate_retrievability(self, elapsed_days: int, stability: float) -> float:
        """Calculate current retrievability"""
        return (1 + elapsed_days / (9 * stability)) ** -1
    
    def calculate_interval(self, stability: float) -> int:
        """Calculate next review interval"""
        interval = stability / self.request_retention * (self.request_retention ** (1/self.request_retention) - 1)
        return max(1, min(self.maximum_interval, round(interval)))
    
    def update_card_after_review(self, question: Question, grade: int, response_time: float) -> Dict[str, Any]:
        """
        Update question parameters after review
        Grade: 1=Again, 2=Hard, 3=Good, 4=Easy
        """
        now = datetime.utcnow()
        
        if question.last_reviewed:
            elapsed_days = (now - question.last_reviewed).days
        else:
            elapsed_days = 0
        
        # Calculate current retrievability
        retrievability = self.calculate_retrievability(elapsed_days, question.stability) if elapsed_days > 0 else 1.0
        
        # Update stability and difficulty
        new_stability = self.calculate_stability(question.difficulty_rating, question.stability, retrievability, grade)
        new_difficulty = self.calculate_difficulty(question.difficulty_rating, grade)
        
        # Calculate next review interval
        interval = self.calculate_interval(new_stability)
        next_review = now + timedelta(days=interval)
        
        return {
            "stability": new_stability,
            "difficulty_rating": new_difficulty,
            "last_reviewed": now,
            "next_review": next_review,
            "review_count": question.review_count + 1
        }
    
    def get_due_questions(self, questions: List[Question], limit: int = 30) -> List[Question]:
        """Get questions that are due for review"""
        now = datetime.utcnow()
        
        due_questions = []
        for question in questions:
            if not question.next_review or question.next_review <= now:
                due_questions.append(question)
        
        # Sort by priority: overdue first, then by next_review date
        due_questions.sort(key=lambda q: (
            q.next_review or datetime.min,
            q.learning_objective.priority == "High",
            q.learning_objective.priority == "Medium"
        ))
        
        return due_questions[:limit]
    
    def convert_user_rating_to_grade(self, difficulty_rating: str, is_correct: bool) -> int:
        """Convert user difficulty rating to FSRS grade"""
        if not is_correct:
            return 1  # Again
        
        rating_map = {
            "easy": 4,    # Easy
            "medium": 3,  # Good  
            "hard": 2     # Hard
        }
        
        return rating_map.get(difficulty_rating, 3)

# Global FSRS service instance
fsrs_service = FSRSService()
