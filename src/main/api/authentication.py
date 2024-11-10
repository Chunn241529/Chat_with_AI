from functools import wraps
from flask import (
    Blueprint,
    render_template,
    request,
    jsonify,
    redirect,
    url_for,
    session,
)
import sqlite3
import bcrypt

app = Blueprint("auth", __name__)


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
            url_for("auth.home")
        )  # Chuyển hướng đến trang chủ nếu đã đăng nhập
    return render_template("register.html")


@app.route("/login", methods=["GET"])
def login():
    if "username" in session:
        return redirect(
            url_for("auth.home")
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


# Lấy tất cả người dùng
@app.route("/users", methods=["GET"])
def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        users = cursor.execute("SELECT * FROM users").fetchall()

        # Chuyển đổi danh sách người dùng thành danh sách từ điển
        user_list = []
        for user in users:
            user_list.append({"username": user["username"], "email": user["email"]})

        return jsonify(user_list), 200
    finally:
        conn.close()


# Đăng ký người dùng mới
@app.route("/register", methods=["POST"])
def register_user():
    data = request.json
    name = data["name"]
    username = data["username"]
    email = data["email"]
    password = data["password"]
    phone = data.get("phone", None)
    country_code = data.get("country_code", None)

    # Mã hóa mật khẩu trước khi lưu
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (name, username, email, password, phone, country_code) VALUES (?, ?, ?, ?, ?, ?)",
            (name, username, email, hashed_password, phone, country_code),
        )
        conn.commit()
        return (
            jsonify({"message": "Đăng ký thành công!"}),
            201,
        )  # Gửi phản hồi thành công
    except sqlite3.IntegrityError:
        return jsonify({"error": "Đăng ký thất bại!"}), 400
    finally:
        conn.close()


@app.route("/login", methods=["POST"])
def login_user():
    data = request.json
    username = data["username"]
    password = data["password"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        user = cursor.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()

        if user:
            hashed_password = user["password"]

            # Kiểm tra mật khẩu
            if bcrypt.checkpw(password.encode("utf-8"), hashed_password):
                session["username"] = username  # Lưu username vào session
                session["user_id"] = user["id"]  # Lưu user_id vào session
                return redirect("/auth/chat")  # Chuyển hướng đến trang chính

            else:
                return (
                    jsonify({"error": "Tên người dùng hoặc mật khẩu không hợp lệ."}),
                    401,
                )
        else:
            return jsonify({"error": "Tên người dùng hoặc mật khẩu không hợp lệ."}), 401
    finally:
        conn.close()


# Lấy thông tin người dùng
@app.route("/user/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        user = cursor.execute(
            "SELECT id, name, username, email, phone, country_code FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

        if user:
            return (
                jsonify(
                    {
                        "id": user["id"],
                        "name": user["name"],
                        "username": user["username"],
                        "email": user["email"],
                        "phone": user["phone"],
                        "country_code": user["country_code"],
                    }
                ),
                200,
            )
        else:
            return jsonify({"error": "User not found."}), 404
    finally:
        conn.close()


# Đăng xuất
@app.route("/logout")
def logout():
    session.pop("username", None)  # Xóa username khỏi session
    return redirect(url_for("auth.login"))  # Chuyển hướng đến trang đăng nhập


@app.route("/load_chat_history", methods=["GET"])
def load_chat_history():
    if "username" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    username = session["username"]
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Lấy thông tin người dùng để tìm ID
        user = cursor.execute(
            "SELECT id FROM users WHERE username = ?", (username,)
        ).fetchone()

        if not user:
            return jsonify({"error": "Không tìm thấy người dùng"}), 404

        user_id = user["id"]

        # Lấy tất cả group_history của người dùng
        groups = cursor.execute(
            """
            SELECT * FROM group_history
            WHERE user_id = ?
            ORDER BY created_at DESC limit 1
            """,
            (user_id,),
        ).fetchall()

        if not groups:
            return jsonify({"message": "Không có lịch sử trò chuyện nào có sẵn"}), 200

        # Lấy lịch sử trò chuyện từ conversation_history cho tất cả các group_id
        conversation_history = []
        for group in groups:
            group_id = group["id"]

            # Lấy tất cả các bản ghi từ conversation_history cho group_id
            conversation_rows = cursor.execute(
                """
                SELECT input_text, img_base64, ai_response, created_at
                FROM conversation_history
                WHERE group_id = ?
                ORDER BY created_at ASC
                """,
                (group_id,),
            ).fetchall()

            # Chuyển đổi lịch sử trò chuyện thành định dạng JSON
            group_history = [
                {
                    "input_text": row["input_text"],
                    "img_base64": row["img_base64"],
                    "ai_response": row["ai_response"],
                    "created_at": row["created_at"],
                }
                for row in conversation_rows
            ]

            conversation_history.append(
                {"group_name": group["group_name"], "history": group_history}
            )

        return jsonify({"conversations": conversation_history}), 200

    finally:
        conn.close()
