
import httpx
from ..core.config import settings
from typing import Optional, Dict, Any

async def send_processing_complete_email(user_id: str, filename: str):
    """Send email notification when PDF processing is complete"""
    
    if not settings.resend_api_key:
        print("RESEND_API_KEY not configured, skipping email notification")
        return
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "RecallForge <noreply@recallforge.com>",
                    "to": ["user@example.com"],  # Replace with actual user email
                    "subject": f"PDF Processing Complete - {filename}",
                    "html": f"""
                    <h2>PDF Processing Complete!</h2>
                    <p>Your PDF file "<strong>{filename}</strong>" has been successfully processed.</p>
                    <p>Learning objectives and questions have been generated and are ready for study.</p>
                    <p>Login to your RecallForge account to start learning!</p>
                    <br>
                    <p>Happy Learning!</p>
                    <p>The RecallForge Team</p>
                    """
                }
            )
            
            if response.status_code == 200:
                print(f"Email notification sent successfully for PDF: {filename}")
            else:
                print(f"Failed to send email notification: {response.text}")
                
    except Exception as e:
        print(f"Error sending email notification: {str(e)}")

async def send_test_link_email(
    email: str, 
    pdf_info: Optional[Dict[str, Any]] = None,
    lo_info: Optional[Dict[str, Any]] = None,
    is_demo: bool = False
):
    """Send email with test link to access RecallForge without login"""
    
    if not settings.resend_api_key:
        print("RESEND_API_KEY not configured, skipping test link email")
        return
    
    try:
        # Generate the test link
        base_url = "https://your-frontend-domain.com"  # Update with your actual frontend URL
        
        if is_demo:
            test_link = f"{base_url}/demo"
            subject = "Try RecallForge - Demo Access"
            content_title = "Demo Access Ready!"
            content_body = """
            <p>You've been granted demo access to RecallForge!</p>
            <p>Click the link below to explore our AI-powered spaced repetition learning system:</p>
            """
        elif lo_info:
            test_link = f"{base_url}/study?lo_id={lo_info['id']}&test_mode=true"
            subject = f"Test Link - {lo_info['title']}"
            content_title = "Your Test Link is Ready!"
            content_body = f"""
            <p>You've been invited to test a learning objective: <strong>{lo_info['title']}</strong></p>
            <p>Click the link below to start the test without needing to create an account:</p>
            """
        elif pdf_info:
            test_link = f"{base_url}/pdf/{pdf_info['id']}?test_mode=true"
            subject = f"Test Link - {pdf_info['filename']}"
            content_title = "Your Test Link is Ready!"
            content_body = f"""
            <p>You've been invited to test content from: <strong>{pdf_info['filename']}</strong></p>
            <p>Click the link below to explore the generated learning materials without needing to create an account:</p>
            """
        else:
            test_link = f"{base_url}/?test_mode=true"
            subject = "RecallForge Test Access"
            content_title = "Your Test Link is Ready!"
            content_body = """
            <p>You've been granted test access to RecallForge!</p>
            <p>Click the link below to explore our platform without needing to create an account:</p>
            """

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "RecallForge <noreply@recallforge.com>",
                    "to": [email],
                    "subject": subject,
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">{content_title}</h2>
                        {content_body}
                        
                        <div style="margin: 30px 0;">
                            <a href="{test_link}" 
                               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block;">
                                Start Testing Now
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">
                            This test link allows you to explore RecallForge without creating an account.
                            {"Perfect for trying out our demo features!" if is_demo else "You can experience the full learning journey with AI-generated questions."}
                        </p>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        
                        <p style="font-size: 12px; color: #888;">
                            This email was sent by RecallForge. If you didn't request this, you can safely ignore this email.
                        </p>
                        
                        <p style="font-size: 12px; color: #888;">
                            Want to create your own account? Visit <a href="{base_url}">RecallForge</a>
                        </p>
                    </div>
                    """
                }
            )
            
            if response.status_code == 200:
                print(f"Test link email sent successfully to: {email}")
            else:
                print(f"Failed to send test link email: {response.text}")
                
    except Exception as e:
        print(f"Error sending test link email: {str(e)}")
        raise e
