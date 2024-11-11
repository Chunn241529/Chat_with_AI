from functools import wraps
import sqlite3
from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    session,
)

app = Blueprint("/", __name__)


# Hàm kết nối đến cơ sở dữ liệu
def get_db_connection():
    conn = sqlite3.connect("chatbot.db")
    conn.row_factory = sqlite3.Row
    return conn


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


@app.route("/home")
@login_required
def index():
    user_id = session.get("user_id")
    if not user_id:  # Kiểm tra nếu không có user_id trong session
        return redirect(url_for("login"))  # Chuyển hướng đến trang đăng nhập

    # Lấy thông tin người dùng từ cơ sở dữ liệu
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT flag FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()

    if user and user["flag"] == 1:  # Nếu flag = 1 tức là tài khoản bị cấm
        return render_template("banned.html")  # Trả về trang banned.html nếu bị cấm

    return render_template("home.html")  # Trả về trang home.html nếu không bị cấm


@app.route("/chat", methods=["GET"])
@login_required
def chat():
    if session.get("is_banned", False):  # If 'is_banned' exists in session and is True
        return redirect(url_for("/.banned"))  # Redirect to the banned page
    return render_template("chat.html")


@app.route("/profile", methods=["GET"])
@login_required
def profile():
    return render_template("profile.html")


@app.route("/banned", methods=["GET"])
@login_required
def banned():
    return render_template("banned.html")
