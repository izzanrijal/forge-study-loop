
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from ...core.database import get_db
from ...services.gamification_service import gamification_service

router = APIRouter()

@router.get("/stats/{user_id}")
async def get_user_gamification_stats(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get user's current gamification stats including streak, mastery points, and badges"""
    
    try:
        stats = gamification_service.update_user_gamification(user_id, db)
        
        return {
            "user_id": user_id,
            "streak_count": stats["streak_count"],
            "total_mastery_points": stats["total_mastery_points"],
            "earned_badges_count": len(stats["earned_badges"]),
            "total_badges_count": stats["total_badges"],
            "earned_badges": stats["earned_badges"]
        }
        
    except Exception as e:
        print(f"Error getting gamification stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get gamification stats: {str(e)}"
        )

@router.get("/badges")
async def get_all_badges():
    """Get all available badges"""
    
    try:
        badges = gamification_service.get_available_badges()
        return {
            "badges": badges,
            "total_count": len(badges)
        }
        
    except Exception as e:
        print(f"Error getting badges: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get badges: {str(e)}"
        )

@router.post("/update-streak/{user_id}")
async def update_user_streak(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Manually update user's streak and mastery points (useful after completing a study session)"""
    
    try:
        stats = gamification_service.update_user_gamification(user_id, db)
        
        return {
            "message": "Gamification stats updated successfully",
            "user_id": user_id,
            "new_streak": stats["streak_count"],
            "new_mastery_points": stats["total_mastery_points"],
            "newly_earned_badges": [
                badge for badge in stats["earned_badges"] 
                if badge.get('newly_earned', False)
            ]
        }
        
    except Exception as e:
        print(f"Error updating streak: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update streak: {str(e)}"
        )
