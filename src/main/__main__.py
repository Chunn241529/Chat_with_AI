from flask import Flask, redirect, url_for
from flask_session import Session
from chat import app as chat_app
from authentication import app as auth_app
from imgGenerate.__txt2img__ import app as AI_Image_app  # Sửa lại đường dẫn cho đúng
import secrets

# Tạo một ứng dụng Flask chính
main_app = Flask(__name__)

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
main_app.register_blueprint(AI_Image_app, url_prefix="/AIImage")


@main_app.route("/")
def index():
    return redirect(url_for("auth.login"))


if __name__ == "__main__":
    try:
        main_app.run(debug=True)
    except Exception as e:
        print(f"Đã xảy ra lỗi: {e}")
