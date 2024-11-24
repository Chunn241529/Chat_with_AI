import base64
import os
import sqlite3
import re
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, session, url_for
import google.generativeai as genai
from werkzeug.utils import secure_filename

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


def img_generate():
    from imgGenerate import __txt2img__

    # Gọi hàm tạo hình ảnh
    image_path = __txt2img__.run()  # Giả sử run() trả về tên tệp hình ảnh
    image_filename = os.path.basename(image_path)  # Lấy tên tệp hình ảnh
    return url_for("static", filename=f"output/{image_filename}")  # Tạo đường dẫn URL


# Hàm lấy danh sách nhóm từ cơ sở dữ liệu
def get_groups():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, group_name FROM group_history")
    groups = cursor.fetchall()
    conn.close()
    return groups


# Hàm phân tích cảm xúc từ tin nhắn
def analyze_emotion(user_input):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT emotion_name, emoji FROM emotions")
    emotions = cursor.fetchall()
    conn.close()

    user_input_lower = user_input.lower()
    ascii_emotions = {
        ":)": "vui",
        ":(": "buồn",
        ":D": "hạnh phúc",
        ">:(": "giận dữ",
        ":/": "lo lắng",
    }

    for ascii_emo, emotion_name in ascii_emotions.items():
        if ascii_emo in user_input:
            return emotion_name

    for emotion in emotions:
        keyword = emotion["emotion_name"].lower()
        emoji = emotion["emoji"]
        if (
            re.search(r"\b" + re.escape(keyword) + r"\b", user_input_lower)
            or emoji in user_input
        ):
            return emotion["emotion_name"]

    return "bình thường"


# Hàm lấy vai trò AI từ nhóm trò chuyện hiện tại
def get_group_role(group_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT datasets.datasets_name, datasets.description 
        FROM group_history 
        JOIN datasets ON group_history.dataset_id = datasets.id 
        WHERE group_history.id = ?
        """,
        (group_id,),
    )
    role = cursor.fetchone()
    conn.close()
    return role


def save_conversation_to_db(group_id, user_prompt, img_base64, ai_response):
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


def chat_with_ai(user_input):
    global current_group_id

    # Lấy mô tả vai trò từ nhóm trò chuyện hiện tại
    role_description = get_group_role(current_group_id)

    # Nếu không tìm thấy vai trò, sử dụng mô tả mặc định
    if not role_description:
        role_descriptions = (
            "Bạn là giáo viên tiếng Anh, dạy tôi bằng cả tiếng Việt và tiếng Anh. "
            "Cung cấp tài liệu chi tiết theo định dạng sau:\n"
            "Chủ đề: [topic]\n"
            "Từ vựng:\n"
            "[từ vựng]: [ý nghĩa]\n"
            "Đoạn hội thoại:\n"
            "Person A: ...\n"
            "Person B: ...\n"
            "Bạn có thể speech bằng cách dùng /read [en/vi] [nội dung]."
        )
    else:
        role_descriptions = f"{role_description['description']}"

    conversation_context.append(f"User: {user_input}")
    prompt = f"{role_descriptions}\n\n{''.join(conversation_context)}\nAI:"

    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            max_output_tokens=1000,
            temperature=1,
        ),
    )
    ai_response = response.text.strip()

    # Apply formatting to the response
    formatted_response = format_response(ai_response)

    conversation_context.append(f"AI: {formatted_response}")
    return formatted_response


# Hàm set_group đã được sửa lại để nhận tham số group_id
def set_group(group_id):
    global current_group_id
    if group_id:
        current_group_id = group_id
        print(current_group_id)
        return {"message": f"Đã chọn nhóm trò chuyện ID: {group_id}"}, 200
    else:
        return {
            "error": "ID nhóm trò chuyện không được cung cấp."
        }, 400  # Thay đổi mã lỗi thành 400


def create_dataset(datasets_name, description):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Kiểm tra tên dataset có tồn tại không
        suffix = 1
        original_name = datasets_name

        # Kiểm tra trong cơ sở dữ liệu để đảm bảo tên duy nhất
        while cursor.execute(
            "SELECT 1 FROM datasets WHERE datasets_name = ?", (datasets_name,)
        ).fetchone():
            datasets_name = f"{original_name}{suffix}"
            suffix += 1

        # Thực hiện câu lệnh SQL để chèn dữ liệu vào bảng
        cursor.execute(
            """
            INSERT INTO datasets (datasets_name, description)
            VALUES (?, ?)
            """,
            (datasets_name, description),  # Thêm dữ liệu vào bảng
        )

        conn.commit()  # Lưu thay đổi vào cơ sở dữ liệu

        # Lấy id của bản ghi mới tạo
        new_id = cursor.lastrowid

        return {"message": "Tạo dataset thành công.", "status_code": 200, "id": new_id}

    except sqlite3.Error as e:
        conn.rollback()  # Rollback trong trường hợp có lỗi
        return {"error": f"Lỗi khi tạo dataset: {e}", "status_code": 500}

    finally:
        conn.close()


@app.route("/get_groups", methods=["GET"])
def get_groups_route():
    groups = get_groups()
    groups_list = [{"id": group["id"], "name": group["group_name"]} for group in groups]
    return jsonify({"groups": groups_list})


def create_group(user_id, group_name, datasetId):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO group_history (group_name, dataset_id, user_id) 
        VALUES (?, ?, ?)
        """,
        (group_name, datasetId, user_id),  # Gán giá trị cho group_name và user_id
    )
    conn.commit()
    new_group_id = cursor.lastrowid
    conn.close()
    return new_group_id


import PIL.Image

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}  # Chỉ cho phép các định dạng ảnh


# Kiểm tra định dạng file có hợp lệ không
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


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


# Function to handle image upload and content generation
def upload_and_generate_content(image_path, prompt):

    try:
        # Tải ảnh lên GenAI
        myfile = genai.upload_file(image_path)  # Upload image file to GenAI

        # Gửi prompt cùng ảnh lên API để nhận phản hồi
        response = model.generate_content([prompt, myfile])

        return response.text.strip()
    except Exception as e:
        return str(e)


def save_image_to_server(image_file, userId):
    # Lưu ảnh vào thư mục uploads
    if image_file and allowed_file(image_file.filename):
        filename = secure_filename(image_file.filename)
        uploads_folder = os.path.join(
            "src", "main", "static", "uploads", "image", f"user_{userId}"
        )

        if not os.path.exists(uploads_folder):
            os.makedirs(uploads_folder)

        image_path = os.path.join(uploads_folder, filename)
        image_file.save(image_path)
        return image_path
    return None


# Đọc hình ảnh từ đường dẫn và chuyển thành chuỗi Base64
def convert_image_to_base64(image_path):
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode("utf-8")


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


@app.route("/send", methods=["POST"])
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
