import os
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, session
import google.generativeai as genai
from gtts import gTTS
import os
import uuid
from api.modules.database import *

# Tải biến môi trường từ file .env
load_dotenv()
genai.configure(api_key=os.getenv("GERMINI_API_KEY"))

# Khởi tạo mô hình
model = genai.GenerativeModel("gemini-1.5-pro")
app = Blueprint("en", __name__)

# Biến toàn cục lưu topic_id
current_topic_id = None
conversation_context = []
current_group_id = None  # Biến lưu nhóm trò chuyện hiện tại của người dùng

@app.route("/read", methods=["POST"])
def text_to_speech():
    # Lấy user_id từ session trong phạm vi của request
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"message": "User not logged in"}), 401

    # Đặt thư mục upload với user_id
    uploads_folder = os.path.join(
        "src", "main", "static", "uploads", "audio", "user", f"user_{user_id}"
    )
    if not os.path.exists(uploads_folder):
        os.makedirs(uploads_folder)

    # Lấy văn bản và ngôn ngữ từ request
    data = request.get_json()
    text = data.get("text", "")
    lang = data.get("lang", "en")  # Mặc định là 'en' nếu không có lang

    if not text:
        return jsonify({"message": "No text provided"}), 400

    # Tạo file âm thanh từ văn bản
    try:
        # Tạo đối tượng gTTS
        tts = gTTS(text=text, lang=lang)

        # Tạo tên file âm thanh duy nhất và lưu vào thư mục static/uploads/audio/user/
        filename = f"audio_userId-{user_id}_{uuid.uuid4()}.mp3"
        file_path = os.path.join(uploads_folder, filename)

        # Lưu file vào server
        tts.save(file_path)

        # Trả về đường dẫn URL có thể truy cập được từ trình duyệt
        file_url = f"/static/uploads/audio/user/user_{user_id}/{filename}"  # Đường dẫn file tĩnh

        return (
            jsonify({"message": "Speech generated successfully", "file_url": file_url}),
            200,
        )

    except Exception as e:
        return jsonify({"message": f"Error generating speech: {str(e)}"}), 500


# API tạo chủ đề mới
@app.route("/create_topic", methods=["POST"])
def create_topic():
    global current_topic_id  # Dùng biến toàn cục

    data = request.get_json()
    topic_name = data.get("topic_name", "")  # Lấy topic_name từ payload

    if not topic_name:
        return (
            jsonify({"message": "Topic name is required"}),
            400,
        )  # Kiểm tra nếu không có topic_name

    # Lưu chủ đề mới vào bảng topics
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO topics (topic_name) VALUES (?)", (topic_name,))
    conn.commit()

    # Lấy topic_id của chủ đề vừa tạo và gán cho biến toàn cục
    current_topic_id = cursor.lastrowid
    conn.close()

    return (
        jsonify(
            {"message": "Topic created successfully", "topic_id": current_topic_id}
        ),
        200,
    )


# API thêm từ vựng vào chủ đề đã tạo
@app.route("/save_vocabulary_bulk", methods=["POST"])
def save_vocabulary_bulk():
    global current_topic_id  # Dùng biến toàn cục

    if current_topic_id is None:
        return (
            jsonify({"message": "No topic created yet"}),
            400,
        )  # Kiểm tra xem có chủ đề nào được tạo chưa

    data = request.get_json()
    vocabulary_list = data.get("vocabulary", [])

    if not vocabulary_list:
        return jsonify({"message": "No vocabulary items provided"}), 400

    # Lưu từng từ vựng vào bảng vocabulary
    conn = get_db_connection()
    cursor = conn.cursor()

    for vocab in vocabulary_list:
        term = vocab.get("term", "")
        definition = vocab.get("definition", "")
        cursor.execute(
            "INSERT INTO vocabulary (topic_id, term, definition) VALUES (?, ?, ?)",
            (current_topic_id, term, definition),
        )

    conn.commit()
    conn.close()

    return jsonify({"message": "All vocabulary items saved successfully"}), 200


# API lấy từ vựng theo topic_id
@app.route("/get_vocabulary_by_topic", methods=["GET"])
def get_vocabulary_by_topic():
    global current_topic_id  # Dùng biến toàn cục

    if current_topic_id is None:
        return (
            jsonify({"message": "No topic created yet"}),
            400,
        )  # Kiểm tra xem có chủ đề nào được tạo chưa

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT term, definition FROM vocabulary WHERE topic_id = ?",
        (current_topic_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return jsonify({"message": "No vocabulary found for this topic"}), 404

    return jsonify([{"term": row[0], "definition": row[1]} for row in rows]), 200


# API lấy từ vựng theo tên chủ đề (topic_name)
@app.route("/get_vocabulary_by_topicName/<string:topic_name>", methods=["GET"])
def get_vocabulary_by_topicName(topic_name):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Truy vấn lấy topic_id theo topic_name
    cursor.execute("SELECT id FROM topics WHERE name = ?", (topic_name,))
    topic_row = cursor.fetchone()

    if not topic_row:
        return jsonify({"message": "Topic not found"}), 404

    topic_id = topic_row[0]

    cursor.execute(
        "SELECT term, definition FROM vocabulary WHERE topic_id = ?", (topic_id,)
    )
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return jsonify({"message": "No vocabulary found for this topic"}), 404

    return jsonify([{"term": row[0], "definition": row[1]} for row in rows]), 200
