from functools import wraps
from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    session,
)
from api.modules.database import *

app = Blueprint("/", __name__)


def getFlagBanned(urlR):
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for("login"))

    # Lấy thông tin người dùng từ cơ sở dữ liệu
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT flag FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()

    # Kiểm tra nếu tài khoản bị cấm
    if user and user[0] == 1:
        return render_template(urlR)  # Trả về trang "banned.html"


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        result = getFlagBanned("banned.html")
        if result:  # Nếu tài khoản bị cấm, dừng ở đây
            return result
        if "user_id" not in session:
            return render_template("login.html")
        return f(*args, **kwargs)

    return decorated_function


@app.route("/register", methods=["GET"])
def register():
    if "username" in session:
        return redirect("/chat")
    return render_template("register.html")


@app.route("/login", methods=["GET"])
def login():
    if "username" in session:
        return redirect("/chat")
    return render_template("login.html")


@app.route("/home")
@login_required
def index():
    return render_template("home.html")


@app.route("/chat", methods=["GET"])
@login_required
def chat():
    return render_template("chat.html")


@app.route("/profile", methods=["GET"])
@login_required
def profile():
    return render_template("profile.html")


@app.route("/banned", methods=["GET"])
def banned():
    return render_template("banned.html")
