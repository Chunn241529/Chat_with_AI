from datetime import timedelta
from flask import Flask, redirect, url_for
from flask_session import Session
from api.api_chat import app as chat_app
from api.api_authentication import app as auth_app
from api.controller import app as app
from api.api_english import app as en_app
from api.modules.sendmail import app as mail_app
from api.imgGen.test import app as img_app

import secrets
import threading
import time
import schedule
import requests
import shutil
import os


# Hàm xóa cache Python (__pycache__ và *.pyc)
def clear_python_cache():
    print("Đang xóa cache Python...")
    for root, dirs, files in os.walk(".", topdown=False):
        # Xóa thư mục __pycache__
        for name in dirs:
            if name == "__pycache__":
                shutil.rmtree(os.path.join(root, name))
                print(f"Đã xóa thư mục: {os.path.join(root, name)}")
        # Xóa file .pyc
        for name in files:
            if name.endswith(".pyc"):
                os.remove(os.path.join(root, name))
                print(f"Đã xóa file: {os.path.join(root, name)}")
    print("Hoàn tất xóa cache Python.")


# Tạo một ứng dụng Flask chính
main_app = Flask(__name__)

# Tạo một khóa bí mật 32 ký tự (16 byte)
secret_key = secrets.token_hex(16)
print(secret_key)

# Cấu hình Flask-Session
main_app.config["SESSION_TYPE"] = "filesystem"
main_app.secret_key = secret_key  # Thay thế bằng khóa bí mật thực tế của bạn
main_app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=30)

Session(main_app)

# Đăng ký các blueprint cho từng ứng dụng
main_app.register_blueprint(chat_app, url_prefix="/chat")
main_app.register_blueprint(auth_app, url_prefix="/auth")
main_app.register_blueprint(app, url_prefix="/")
main_app.register_blueprint(en_app, url_prefix="/en")
main_app.register_blueprint(mail_app, url_prefix="/mail")
main_app.register_blueprint(img_app, url_prefix="/")


@main_app.route("/")
def index():
    return redirect(url_for("/.login"))


def run_sendmail_api():
    print("Đang gọi API /mail/sendmail...")
    try:
        response = requests.post("http://127.0.0.1:5000/mail/sendmail")
        if response.status_code == 200:
            print("API /mail/sendmail đã chạy thành công!")
        else:
            print(f"Lỗi khi gọi API: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Lỗi khi kết nối đến API: {e}")


def schedule_cron_jobs():
    print("Đang thiết lập cronjob...")
    # Đảm bảo chỉ thiết lập một lần
    if len(schedule.jobs) == 0:  # Nếu chưa có job nào
        schedule.every().day.at("09:00").do(run_sendmail_api)
    print(f"Các công việc đã được lập lịch: {schedule.jobs}")

    while True:
        try:
            schedule.run_pending()
        except Exception as e:
            print(f"Lỗi trong cronjob: {e}")
        time.sleep(1)


if __name__ == "__main__":
    try:
        # Xóa cache Python trước khi chạy server
        clear_python_cache()

        # Chạy cronjob trong luồng riêng
        cron_thread = threading.Thread(target=schedule_cron_jobs, daemon=True)
        cron_thread.start()

        # Chạy Flask server
        main_app.run(debug=True)
    except Exception as e:
        print(f"Đã xảy ra lỗi: {e}")
