import os
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, session
import google.generativeai as genai
from werkzeug.utils import secure_filename
from api.responsitory.chat import *
from api.modules.formatted_response import *
from api.modules.database import *

# Tải biến môi trường từ file .env
load_dotenv()
genai.configure(api_key=os.getenv("GERMINI_API_KEY"))

# Khởi tạo mô hình
model = genai.GenerativeModel("gemini-1.5-pro")
conversation_context = []
current_group_id = None  # Biến lưu nhóm trò chuyện hiện tại của người dùng

app = Blueprint("chat", __name__)


@app.route("/get_groups", methods=["GET"])
def get_groups_route():
    groups = get_groups()
    groups_list = [{"id": group["id"], "name": group["group_name"]} for group in groups]
    return jsonify({"groups": groups_list})


# API upload hình ảnh
@app.route("/uploads", methods=["POST"])
def upload_image():
    # Kiểm tra xem request có chứa file không
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]

    # Nếu không có file hoặc file có tên rỗng
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Nếu file có định dạng hợp lệ
    if file and allowed_file(file.filename):
        try:
            # Kiểm tra và tạo thư mục nếu chưa tồn tại
            upload_folder = os.path.join("src", "main", "static", "uploads")
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)

            # Đặt con trỏ file về vị trí đầu tiên
            file.seek(0)

            # Mở file ảnh bằng PIL để kiểm tra tính hợp lệ của ảnh
            img = PIL.Image.open(file)
            img.verify()  # Kiểm tra file có phải ảnh hợp lệ không

            # Lưu file với tên hợp lệ (được bảo vệ khỏi tên tệp xấu)
            filename = secure_filename(file.filename)
            file_path = os.path.join(upload_folder, filename)

            # Lưu file vào thư mục
            file.save(file_path)

            # Trả về URL của file đã được upload
            file_url = f"/static/uploads/{filename}"

            return (
                jsonify(
                    {"message": "File uploaded successfully", "file_url": file_url}
                ),
                200,
            )
        except Exception as e:
            return jsonify({"error": f"Invalid image file: {str(e)}"}), 400
    else:
        return jsonify({"error": "Invalid file format"}), 400


@app.route("/send-image", methods=["POST"])
def generate_content_from_image():
    global current_group_id

    # Lấy user_id từ session
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "Người dùng chưa đăng nhập."}), 401

    # Nếu chưa chọn nhóm, tạo một nhóm mặc định với user_id
    if current_group_id is None:
        current_group_id = create_group(user_id, "bình thường", None)

    # Lấy ảnh và prompt từ request
    image_file = request.files.get("image_file")
    user_prompt = request.form.get("prompt")

    # Lưu ảnh và lấy đường dẫn
    image_path = save_image_to_server(image_file, user_id)

    if image_path is None:
        return jsonify({"error": "Ảnh không hợp lệ."}), 400

    try:
        # Gọi API để xử lý và tạo nội dung từ hình ảnh và prompt
        result = upload_and_generate_content(image_path, user_prompt)

        # Chuyển đổi ảnh thành chuỗi Base64
        img_base64 = "data:image/png;base64," + convert_image_to_base64(image_path)

        # Lưu vào cơ sở dữ liệu
        save_conversation_to_db(current_group_id, user_prompt, img_base64, result)

        return jsonify({"response": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


import time
from functools import wraps

# Thêm biến toàn cục để theo dõi thời gian gọi API cuối cùng
last_api_call_time = 0


# Decorator để kiểm tra thời gian chờ
def throttle(seconds):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            global last_api_call_time
            current_time = time.time()
            if current_time - last_api_call_time < seconds:
                return (
                    jsonify(
                        {
                            "response": f"Vui lòng đợi {seconds} giây trước khi gửi yêu cầu tiếp theo."
                        }
                    ),
                    429,
                )
            last_api_call_time = current_time
            return f(*args, **kwargs)

        return wrapped

    return decorator


@app.route("/send", methods=["POST"])
@throttle(5)  # Áp dụng decorator với thời gian chờ 10 giây
def chat():
    global current_group_id
    data = request.get_json()
    user_input = data.get("user_input")

    # Lấy user_id từ session
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "Người dùng chưa đăng nhập."}), 401

    # Nếu chưa chọn nhóm, tạo một nhóm mặc định với user_id
    if current_group_id is None:
        current_group_id = create_group(user_id, "bình thường", None)

    # Nếu đã chọn nhóm hoặc tạo nhóm mới, tiếp tục với tin nhắn người dùng
    ai_response = chat_with_ai(user_input)
    return jsonify({"response": ai_response})


@app.route("/newchat", methods=["POST"])
def newChat():
    # Kiểm tra xem người dùng có đăng nhập không
    if "username" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    # Lấy thông tin người dùng từ session
    username = session["username"]
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Lấy thông tin người dùng từ cơ sở dữ liệu
        user = cursor.execute(
            "SELECT id FROM users WHERE username = ?", (username,)
        ).fetchone()

        if not user:
            return jsonify({"error": "Không tìm thấy người dùng"}), 404

        user_id = user["id"]

        # Lấy tên nhóm từ request (nếu có)
        data = request.get_json()
        group_name = data.get("group_name", "Nhóm mới")
        description = data.get(
            "description", "Nhóm mới"
        )  # Mô tả nhóm có thể để trống nếu không cần

        # Tạo dataset trước và lấy dataset_id
        dataset_response = create_dataset(group_name, description)
        if dataset_response["status_code"] != 200:
            return jsonify(dataset_response), dataset_response["status_code"]

        dataset_id = dataset_response["id"]  # Lấy dataset_id

        # Tạo nhóm mới với dataset_id
        new_group_id = create_group(user_id, group_name, dataset_id)

        # Gọi hàm set_group để chọn nhóm mới làm nhóm hiện tại
        set_group_response, status_code = set_group(new_group_id)

        if status_code == 200:
            # Trả về ID nhóm mới và thông báo thành công
            return (
                jsonify(
                    {
                        "message": "Tạo nhóm trò chuyện thành công.",
                        "group_id": new_group_id,
                        "dataset_id": dataset_id,
                    }
                ),
                200,
            )
        else:
            return jsonify(set_group_response), status_code

    finally:
        conn.close()


@app.route("/save_conversation", methods=["POST"])
def save_conversation():
    global current_group_id
    try:
        # Nhận dữ liệu từ JSON request
        data = request.get_json()

        # Lấy giá trị user_prompt, img_base64, ai_response từ request
        user_prompt = data["user_prompt"]
        img_base64 = data["img_base64"]
        ai_response = data["ai_response"]

        # Sử dụng current_group_id từ biến toàn cục
        group_id = current_group_id

        # Lưu vào DB
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO conversation_history (group_id, emotion_id, input_text, img_base64, ai_response)
            VALUES (?, ?, ?, ?, ?)
            """,
            (group_id, None, user_prompt, img_base64, ai_response),
        )
        conn.commit()
        conn.close()

        return (
            jsonify({"status": "success", "message": "Conversation saved to database"}),
            200,
        )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
