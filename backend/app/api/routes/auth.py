
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from ...core.database import get_db
from ...models.database import User

router = APIRouter()

@router.post("/register")
async def register_user(
    user_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Register a new user (placeholder for Supabase integration)"""
    
    # This will be replaced with Supabase Auth integration
    email = user_data.get("email")
    name = user_data.get("name", "")
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    user = User(
        id=f"user-{email.split('@')[0]}",
        email=email,
        name=name
    )
    
    db.add(user)
    db.commit()
    
    return {"message": "User registered successfully", "user_id": user.id}

@router.post("/login")
async def login_user(
    credentials: Dict[str, str],
    db: Session = Depends(get_db)
):
    """Login user (placeholder for Supabase integration)"""
    
    # This will be replaced with Supabase Auth integration
    email = credentials.get("email")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }
