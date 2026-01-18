"""
Email Service module for sending transactional emails.
Uses Resend API for production, falls back to mock for development.
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

# Resend API configuration
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "LLM Council <noreply@llm-council.aiparati.pt>")


class EmailService:
    @staticmethod
    async def send_reset_password_email(to_email: str, reset_link: str) -> bool:
        """
        Send password reset email.
        Uses Resend API if RESEND_API_KEY is set, otherwise logs to console.
        """
        subject = "Reset Your Password - LLM Council"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f; color: #e0e0e0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .logo {{ font-size: 28px; font-weight: bold; color: #00f0ff; }}
                .content {{ background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%); border-radius: 12px; padding: 30px; border: 1px solid rgba(0, 240, 255, 0.2); }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #00f0ff 0%, #0080ff 100%); color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🏛️ LLM Council</div>
                </div>
                <div class="content">
                    <h2 style="color: #00f0ff; margin-top: 0;">Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>You requested a password reset for your LLM Council account. Click the button below to set a new password:</p>
                    <div style="text-align: center;">
                        <a href="{reset_link}" class="button">Reset Password</a>
                    </div>
                    <p style="font-size: 13px; color: #888;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
                    <p style="font-size: 11px; color: #666; word-break: break-all;">Link: {reset_link}</p>
                </div>
                <div class="footer">
                    <p>The Council awaits your return.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # If Resend API key is configured, send real email
        if RESEND_API_KEY:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.resend.com/emails",
                        headers={
                            "Authorization": f"Bearer {RESEND_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "from": RESEND_FROM_EMAIL,
                            "to": [to_email],
                            "subject": subject,
                            "html": html_content
                        },
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        logger.info(f"✅ Password reset email sent to {to_email}")
                        return True
                    else:
                        logger.error(f"❌ Resend API error: {response.status_code} - {response.text}")
                        return False
                        
            except Exception as e:
                logger.error(f"❌ Failed to send email via Resend: {e}")
                return False
        
        # Fallback: Mock email (log to console for development)
        email_content = f"""
        ---------------- [MOCK EMAIL - No RESEND_API_KEY] ----------------
        To: {to_email}
        Subject: {subject}
        
        Hello,
        
        You requested a password reset. Click the link below to reset it:
        
        {reset_link}
        
        If you didn't request this, ignore this email.
        ------------------------------------------------------------------
        """
        
        print(email_content)
        logger.info(f"📧 Mock reset email logged for {to_email} (set RESEND_API_KEY for real emails)")
        return True

