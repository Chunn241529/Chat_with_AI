import os
import subprocess
import threading
import time
import json
from flask import Flask, render_template, jsonify, redirect
from flask_session import Session
import requests
import schedule
from api.chat import app as chat_app
from api.authentication import app as auth_app
from api.controller import app as app
from api.english import app as en_app
from api.modules.sendmail import app as mail_app
import secrets

main_app = Flask(__name__)

secret_key = secrets.token_hex(16)
print(secret_key)

main_app.config["SESSION_TYPE"] = "filesystem"
main_app.secret_key = secret_key
Session(main_app)

main_app.register_blueprint(chat_app, url_prefix="/chat")
main_app.register_blueprint(auth_app, url_prefix="/auth")
main_app.register_blueprint(app, url_prefix="/")
main_app.register_blueprint(en_app, url_prefix="/en")
main_app.register_blueprint(mail_app, url_prefix="/mail")

ngrok_processes = {}
ngrok_urls = {}


def start_ngrok(port):
    global ngrok_processes, ngrok_urls
    if port in ngrok_processes:
        print(f"Ngrok is already running on port {port}.")
        return ngrok_processes[port]

    ngrok_path = os.path.join(os.path.dirname(__file__), "ngrok", "ngrok.exe")
    ngrok_command = [
        ngrok_path,
        "tunnel",
        "--label",
        "edge=edghts_2ocqbHTTzjZhr4cPb5fxS9DpRyr",
        f"http://localhost:{port}",
    ]

    process = subprocess.Popen(ngrok_command)
    ngrok_processes[port] = process
    time.sleep(10)

    url_process = subprocess.Popen(
        ["curl", "-s", "http://localhost:4040/api/tunnels"], stdout=subprocess.PIPE
    )
    output, _ = url_process.communicate()

    try:
        tunnels = json.loads(output)
        print("Ngrok response:", tunnels)  # In JSON ngrok trả về để kiểm tra

        for tunnel in tunnels.get("tunnels", []):
            public_url = tunnel.get("public_url")
            if f"localhost:{port}" in tunnel.get("config", {}).get("addr", ""):
                print(f"Ngrok URL for port {port}:", public_url)
                ngrok_urls[port] = public_url
                return process

        print(f"No tunnel found for port {port}. Check ngrok status.")
        return None
    except json.JSONDecodeError:
        print("Error parsing JSON response from Ngrok.")
        return None


# Khởi chạy ngrok trên các cổng 5000 và 7860
start_ngrok(5000)
start_ngrok(7860)


@main_app.route("/stable-diffusion")
def stable_diffusion():
    # Kiểm tra xem ngrok đã khởi động cho cổng 7860 chưa, nếu chưa thì khởi động
    if not ngrok_urls.get(7860):
        start_ngrok(7860)

    # Trả về redirect trực tiếp tới localhost:7860
    return redirect("http://localhost:7860", code=302)


@main_app.route("/")
def index():
    if not ngrok_urls.get(5000):
        start_ngrok(5000)

    return render_template("login.html", url_ngrok_5000=ngrok_urls.get(5000))


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
        schedule.every().day.at("21:35").do(run_sendmail_api)
    print(f"Các công việc đã được lập lịch: {schedule.jobs}")

    while True:
        try:
            schedule.run_pending()
        except Exception as e:
            print(f"Lỗi trong cronjob: {e}")
        time.sleep(1)


if __name__ == "__main__":
    try:
        # Chạy cronjob trong luồng riêng
        cron_thread = threading.Thread(target=schedule_cron_jobs, daemon=True)
        cron_thread.start()

        # Chạy Flask server
        main_app.run(debug=True)
    except Exception as e:
        print(f"Đã xảy ra lỗi: {e}")
