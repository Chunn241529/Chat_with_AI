import base64
import os
import sqlite3
import re
from dotenv import load_dotenv
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


def get_groups():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, group_name FROM group_history")
    groups = cursor.fetchall()
    conn.close()
    return groups


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
        role_descriptions = "Bạn có thể dùng /read vi hoặc en (content) để nói, lưu ý chỉ được dùng 1 lần trong câu và content phải nằm trong ngoặc (), bạn nên sử dụng ở đầu câu."
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
