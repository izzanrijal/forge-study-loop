
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..models.database import User, StudySession
from ..core.database import get_db

class GamificationService:
    """Service to handle streak tracking and badge calculation"""
    
    def __init__(self):
        self.streak_reset_hours = 24  # Hours after which streak resets
    
    def calculate_streak(self, user_id: str, db: Session) -> int:
        """Calculate current streak for a user based on study sessions"""
        
        # Get all study sessions ordered by date
        sessions = db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.completed_at.isnot(None)
        ).order_by(StudySession.completed_at.desc()).all()
        
        if not sessions:
            return 0
        
        # Check consecutive days
        streak = 0
        current_date = datetime.utcnow().date()
        
        # Group sessions by date
        session_dates = set()
        for session in sessions:
            session_date = session.completed_at.date()
            session_dates.add(session_date)
        
        session_dates = sorted(session_dates, reverse=True)
        
        # Calculate streak
        for i, session_date in enumerate(session_dates):
            expected_date = current_date - timedelta(days=i)
            
            if session_date == expected_date:
                streak += 1
            elif session_date == expected_date - timedelta(days=1) and i == 0:
                # Allow for today if no session today but had one yesterday
                streak += 1
            else:
                break
        
        return streak
    
    def calculate_mastery_points(self, user_id: str, db: Session) -> int:
        """Calculate total mastery points from study sessions"""
        
        sessions = db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.completed_at.isnot(None)
        ).all()
        
        total_points = 0
        for session in sessions:
            # Calculate points based on accuracy and questions
            base_points = session.total_questions * 10
            accuracy_bonus = int(base_points * (session.accuracy / 100) * 0.5)
            session_points = base_points + accuracy_bonus
            total_points += session_points
        
        return total_points
    
    def get_available_badges(self) -> List[Dict[str, Any]]:
        """Get list of all available badges with requirements"""
        
        return [
            # Streak Badges
            {
                'id': 'streak-3',
                'name': 'Getting Started',
                'description': '3 day streak',
                'icon': '🔥',
                'requirement': 3,
                'type': 'streak'
            },
            {
                'id': 'streak-7',
                'name': 'Week Warrior',
                'description': '7 day streak',
                'icon': '⚡',
                'requirement': 7,
                'type': 'streak'
            },
            {
                'id': 'streak-30',
                'name': 'Monthly Master',
                'description': '30 day streak',
                'icon': '👑',
                'requirement': 30,
                'type': 'streak'
            },
            {
                'id': 'streak-100',
                'name': 'Centurion',
                'description': '100 day streak',
                'icon': '💎',
                'requirement': 100,
                'type': 'streak'
            },
            # Mastery Badges
            {
                'id': 'mastery-100',
                'name': 'First Steps',
                'description': '100 mastery points',
                'icon': '⭐',
                'requirement': 100,
                'type': 'mastery'
            },
            {
                'id': 'mastery-500',
                'name': 'Knowledge Seeker',
                'description': '500 mastery points',
                'icon': '🌟',
                'requirement': 500,
                'type': 'mastery'
            },
            {
                'id': 'mastery-1000',
                'name': 'Scholar',
                'description': '1000 mastery points',
                'icon': '🎓',
                'requirement': 1000,
                'type': 'mastery'
            },
            {
                'id': 'mastery-5000',
                'name': 'Expert',
                'description': '5000 mastery points',
                'icon': '🏆',
                'requirement': 5000,
                'type': 'mastery'
            }
        ]
    
    def get_earned_badges(self, streak: int, mastery_points: int) -> List[Dict[str, Any]]:
        """Get badges that user has earned based on their stats"""
        
        all_badges = self.get_available_badges()
        earned_badges = []
        
        for badge in all_badges:
            if badge['type'] == 'streak' and streak >= badge['requirement']:
                badge['earned'] = True
                earned_badges.append(badge)
            elif badge['type'] == 'mastery' and mastery_points >= badge['requirement']:
                badge['earned'] = True
                earned_badges.append(badge)
        
        return earned_badges
    
    def update_user_gamification(self, user_id: str, db: Session) -> Dict[str, Any]:
        """Update user's streak and mastery points"""
        
        # Calculate current stats
        streak = self.calculate_streak(user_id, db)
        mastery_points = self.calculate_mastery_points(user_id, db)
        
        # Get earned badges
        earned_badges = self.get_earned_badges(streak, mastery_points)
        
        return {
            'streak_count': streak,
            'total_mastery_points': mastery_points,
            'earned_badges': earned_badges,
            'total_badges': len(self.get_available_badges())
        }

# Global gamification service instance
gamification_service = GamificationService()
