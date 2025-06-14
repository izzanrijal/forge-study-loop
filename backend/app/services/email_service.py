
import httpx
from ..core.config import settings

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
