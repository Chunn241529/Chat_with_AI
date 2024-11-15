import os
import sqlite3
import threading
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, session
import google.generativeai as genai
import os

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


# Tải biến môi trường từ file .env
load_dotenv()
genai.configure(api_key=os.getenv("GERMINI_API_KEY"))

# Khởi tạo mô hình
model = genai.GenerativeModel("gemini-1.5-pro")
app = Blueprint("mail", __name__)


# Hàm kết nối đến cơ sở dữ liệu
def get_db_connection():
    conn = sqlite3.connect("chatbot.db")
    conn.row_factory = sqlite3.Row
    return conn


def sendMail(sender_mail, sender_pw, receiver_mail, subject, body_mail):
    smtp_server = "smtp.gmail.com"
    smtp_port = 587

    # Tạo HTML template cho email
    html_template = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);">
            <h2 style="text-align: center; color: #007bff;">Nhắc nhở học tiếng Anh hôm nay</h2>
            <p>Chào bạn,</p>
            <p>Đây là email nhắc nhở để bạn ôn tập và thực hành tiếng Anh hôm nay. Đừng quên duy trì thói quen học tập đều đặn để tiến bộ mỗi ngày!</p>
            <p style="text-align: center;">
                <a href="http://127.0.0.1:5000/" style="display: inline-block; padding: 10px 20px; margin-top: 20px; color: #ffffff; background-color: #007bff; border-radius: 5px; text-decoration: none; font-weight: bold;">
                    Truy cập trang chủ
                </a>
            </p>
            <p>Chúc bạn học tốt!</p>
            <p>Trân trọng,<br/>Đội ngũ hỗ trợ học tiếng Anh</p>
        </div>
    </body>
    </html>
    """

    # Tạo đối tượng MIMEMultipart để tạo mail
    msg = MIMEMultipart("alternative")
    msg["From"] = sender_mail
    msg["To"] = receiver_mail
    msg["Subject"] = subject

    # Đính kèm nội dung HTML vào email
    msg.attach(MIMEText(html_template, "html"))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_mail, sender_pw)
        server.sendmail(sender_mail, receiver_mail, msg.as_string())
        print(f"Email đã được gửi tới {receiver_mail} thành công!")
    except Exception as e:
        print(f"Gửi email tới {receiver_mail} thất bại: {e}")
    finally:
        server.quit()


email_lock = threading.Lock()


@app.route("/sendmail", methods=["POST"])
def scheduleMail():
    if not email_lock.locked():
        with email_lock:

            # Kết nối đến cơ sở dữ liệu
            conn = get_db_connection()
            cursor = conn.cursor()

            # Truy vấn lấy danh sách email của tất cả người dùng
            cursor.execute("SELECT email FROM users")
            emails = cursor.fetchall()

            # Đóng kết nối
            conn.close()

            # Thông tin email gửi
            sender_email = os.getenv("SENDER_EMAIL")
            sender_password = os.getenv("SENDER_PASSWORD")
            subject = "Thông báo từ hệ thống"
            body_mail = "Đây là email thông báo được gửi tự động từ hệ thống."

            # Gửi email cho từng người dùng
            for email_row in emails:
                receiver_email = email_row["email"]
                sendMail(
                    sender_email, sender_password, receiver_email, subject, body_mail
                )

            # Trả về phản hồi JSON
            return jsonify({"message": "Emails đã được gửi thành công!"}), 200
    else:
        return jsonify({"message": "Hệ thống đang xử lý, vui lòng thử lại sau."}), 429
