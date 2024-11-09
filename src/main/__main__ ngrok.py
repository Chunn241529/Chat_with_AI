import os
import subprocess
import time
from flask import Flask, json, redirect, url_for
from flask_session import Session
from chat import app as chat_app
from authentication import app as auth_app  # Đảm bảo import đúng blueprint auth

# Tạo một ứng dụng Flask chính
main_app = Flask(__name__)

import secrets

# Tạo một khóa bí mật 32 ký tự (16 byte)
secret_key = secrets.token_hex(16)
print(secret_key)

# Cấu hình Flask-Session
main_app.config["SESSION_TYPE"] = "filesystem"
main_app.secret_key = secret_key  # Thay thế bằng khóa bí mật thực tế của bạn
Session(main_app)

# Đăng ký các blueprint cho từng ứng dụng
main_app.register_blueprint(chat_app, url_prefix="/chat")
main_app.register_blueprint(auth_app, url_prefix="/auth")


# Route chính để chuyển hướng đến /auth/chat
@main_app.route("/")
def index():
    return redirect(
        url_for("auth.login")
    )  # Giả sử 'auth.login' là route của trang đăng nhập


# Biến toàn cục để lưu ngrok_process
ngrok_process = None


def start_ngrok():
    global ngrok_process
    if ngrok_process is not None:
        print("Ngrok is already running.")
        return ngrok_process

    # Thay đổi đường dẫn đến ngrok nếu cần
    ngrok_path = os.path.join(
        os.path.dirname(__file__), "ngrok", "ngrok.exe"
    )  # Sử dụng os.path.join để xây dựng đường dẫn
    port = 5000  # Cổng mà Flask đang chạy
    # Khởi động ngrok
    ngrok_process = subprocess.Popen([ngrok_path, "http", str(port)])
    time.sleep(2)  # Chờ ngrok khởi động

    # Lấy URL ngrok
    url_process = subprocess.Popen(
        ["curl", "-s", "http://localhost:4040/api/tunnels"], stdout=subprocess.PIPE
    )
    output, _ = url_process.communicate()

    # Phân tích kết quả JSON để lấy URL public
    tunnels = json.loads(output)
    public_url = tunnels["tunnels"][0]["public_url"]

    print("Ngrok URL:", public_url)
    return ngrok_process


if __name__ == "__main__":
    ngrok_process = start_ngrok()  # Khởi động ngrok và lấy URL
    try:
        main_app.run(debug=True)
    finally:
        # Đảm bảo ngrok dừng khi ứng dụng kết thúc
        if ngrok_process:
            ngrok_process.terminate()
            print("Ngrok has been terminated.")
