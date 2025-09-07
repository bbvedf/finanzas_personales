import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import os
from fastapi import HTTPException

async def send_email(to_email: str, subject: str, html_body: str, csv_data: str = None):
    try:
        msg = MIMEMultipart()
        msg['From'] = f'"Finanzas App" <{os.getenv("EMAIL_USER")}>'
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Adjuntar HTML body
        msg.attach(MIMEText(html_body, 'html'))
        
        # Adjuntar CSV si se proporciona
        if csv_data:
            attachment = MIMEApplication(csv_data, _subtype="csv")
            attachment.add_header('Content-Disposition', 'attachment', filename='transacciones.csv')
            msg.attach(attachment)
        
        # Enviar email
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
            server.send_message(msg)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando email: {str(e)}")