from functools import wraps
from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    session,
)

app = Blueprint("/", __name__)


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "username" not in session:
            return redirect(url_for("auth.login"))
        return f(*args, **kwargs)

    return decorated_function


@app.route("/register", methods=["GET"])
def register():
    if "username" in session:
        return redirect(
            url_for("/.home")
        )  # Chuyển hướng đến trang chủ nếu đã đăng nhập
    return render_template("register.html")


@app.route("/login", methods=["GET"])
def login():
    if "username" in session:
        return redirect(
            url_for("/.home")
        )  # Chuyển hướng đến trang chủ nếu đã đăng nhập
    return render_template("login.html")


@app.route("/home", methods=["GET"])
@login_required
def home():
    return render_template("home.html")


@app.route("/chat", methods=["GET"])
@login_required
def chat():
    return render_template("chat.html")

@app.route("/profile", methods=["GET"])
@login_required
def profile():
    return render_template("profile.html")
