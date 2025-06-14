
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from ...core.database import get_db
from ...models.database import PDF, LearningObjective
from ...services.email_service import send_test_link_email

router = APIRouter()

class SendTestLinkRequest(BaseModel):
    email: EmailStr
    pdf_id: Optional[str] = None
    learning_objective_id: Optional[str] = None

@router.post("/send-test-link")
async def send_test_link(
    request: SendTestLinkRequest,
    db: Session = Depends(get_db)
):
    """Send a test link via email without requiring authentication"""
    
    try:
        # If PDF ID is provided, get PDF info
        pdf_info = None
        if request.pdf_id:
            pdf_record = db.query(PDF).filter(PDF.id == request.pdf_id).first()
            if pdf_record:
                pdf_info = {
                    "id": pdf_record.id,
                    "filename": pdf_record.filename
                }
        
        # If Learning Objective ID is provided, get LO info
        lo_info = None
        if request.learning_objective_id:
            lo_record = db.query(LearningObjective).filter(
                LearningObjective.id == request.learning_objective_id
            ).first()
            if lo_record:
                lo_info = {
                    "id": lo_record.id,
                    "title": lo_record.title,
                    "pdf_id": lo_record.pdf_id
                }
        
        # Send email with test link
        await send_test_link_email(
            email=request.email,
            pdf_info=pdf_info,
            lo_info=lo_info
        )
        
        return {
            "message": "Test link sent successfully",
            "email": request.email
        }
        
    except Exception as e:
        print(f"Error sending test link: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to send test link: {str(e)}"
        )

@router.post("/send-demo-link")
async def send_demo_link(request: SendTestLinkRequest):
    """Send a demo link for testing the app without any specific content"""
    
    try:
        await send_test_link_email(
            email=request.email,
            pdf_info=None,
            lo_info=None,
            is_demo=True
        )
        
        return {
            "message": "Demo link sent successfully",
            "email": request.email
        }
        
    except Exception as e:
        print(f"Error sending demo link: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to send demo link: {str(e)}"
        )
