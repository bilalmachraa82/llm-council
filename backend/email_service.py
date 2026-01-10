"""
Email Service module for sending transactional emails.
Currently implements a Mock service for development/MVP.
"""
import os
import logging

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    async def send_reset_password_email(to_email: str, reset_link: str):
        """
        Send password reset email.
        Currently logs to console for MVP.
        """
        # In production, this would use SMTP or an API (Resend/SendGrid)
        # For now, we "send" by logging, which is perfect for dev & testing without keys.
        
        email_content = f"""
        ---------------- [MOCK EMAIL] ----------------
        To: {to_email}
        Subject: Reset Your Password - LLM Council
        
        Hello,
        
        You requested a password reset. Click the link below to reset it:
        
        {reset_link}
        
        If you didn't request this, ignore this email.
        ----------------------------------------------
        """
        
        print(email_content) # Force print to stdout for visibility in logs
        logger.info(f"Sent reset email to {to_email}")
        return True
