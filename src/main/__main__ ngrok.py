import os
import subprocess
import time
import json  # Standard Python json module
from flask import Flask, redirect, render_template, url_for
from flask_session import Session
from chat import app as chat_app
from authentication import app as auth_app  # Ensure correct blueprint import

# Create main Flask app
main_app = Flask(__name__)

import secrets

# Generate a secret key
secret_key = secrets.token_hex(16)
print(secret_key)

# Flask-Session configuration
main_app.config["SESSION_TYPE"] = "filesystem"
main_app.secret_key = secret_key  # Replace with your actual secret key
Session(main_app)

# Register blueprints
main_app.register_blueprint(chat_app, url_prefix="/chat")
main_app.register_blueprint(auth_app, url_prefix="/auth")

ngrok_process = None
ngrok_url = None


def start_ngrok():
    global ngrok_process, ngrok_url
    if ngrok_process is not None:
        print("Ngrok is already running.")
        return ngrok_process

    # Path to ngrok executable
    ngrok_path = os.path.join(os.path.dirname(__file__), "ngrok", "ngrok.exe")
    port = 5000  # Flask port

    # Command to start ngrok tunnel with the --label parameter
    ngrok_command = [
        ngrok_path,
        "tunnel",
        "--label",
        "edge=edghts_2ocqbHTTzjZhr4cPb5fxS9DpRyr",
        f"http://localhost:{port}",
    ]

    # Start ngrok using subprocess
    ngrok_process = subprocess.Popen(ngrok_command)
    time.sleep(5)  # Wait for ngrok to initialize

    # Retrieve ngrok URL
    url_process = subprocess.Popen(
        ["curl", "-s", "http://localhost:4040/api/tunnels"], stdout=subprocess.PIPE
    )
    output, _ = url_process.communicate()

    try:
        tunnels = json.loads(output)
        if "tunnels" in tunnels and len(tunnels["tunnels"]) > 0:
            public_url = tunnels["tunnels"][0]["public_url"]
            print("Ngrok URL:", public_url)
            ngrok_url = public_url  # Store the ngrok URL
            return ngrok_process
        else:
            print("No tunnels found. Check ngrok status.")
            return None
    except json.JSONDecodeError:
        print("Error parsing JSON response from Ngrok.")
        return None


# Start ngrok and store the URL
ngrok_process = start_ngrok()


@main_app.route("/")
def index():
    if ngrok_url is None:
        # If ngrok URL is not available, try starting ngrok again
        start_ngrok()

    return render_template(
        "login.html", url_ngrok=ngrok_url
    )  # Pass ngrok URL to the template


if __name__ == "__main__":
    main_app.run(debug=True)
