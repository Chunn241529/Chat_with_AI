from flask import Flask, redirect, url_for
from flask_session import Session
from api.chat import app as chat_app
from api.authentication import app as auth_app
from api.controller import app as app
from api.enlish import app as en_app
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
main_app.register_blueprint(app, url_prefix="/")
main_app.register_blueprint(en_app, url_prefix="/en")
# main_app.register_blueprint(AI_Image_app, url_prefix="/AIImage")


@main_app.route("/")
def index():
    return redirect(url_for("/.login"))


if __name__ == "__main__":
    try:
        main_app.run(debug=True)
    except Exception as e:
        print(f"Đã xảy ra lỗi: {e}")
