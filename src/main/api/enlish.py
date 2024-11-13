import base64
import os
import sqlite3
import re
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, session, url_for
import google.generativeai as genai
from werkzeug.utils import secure_filename


# Tải biến môi trường từ file .env
load_dotenv()
genai.configure(api_key=os.getenv("GERMINI_API_KEY"))

# Khởi tạo mô hình
model = genai.GenerativeModel("gemini-1.5-pro")
conversation_context = []
current_group_id = None  # Biến lưu nhóm trò chuyện hiện tại của người dùng

app = Blueprint("en", __name__)


# Hàm kết nối đến cơ sở dữ liệu
def get_db_connection():
    conn = sqlite3.connect("chatbot.db")
    conn.row_factory = sqlite3.Row
    return conn


# Endpoint để lưu thông tin từ vựng chính (topic và vocabulary chung)
@app.route("/save_english_data", methods=["POST"])
def save_english_data():
    data = request.get_json()  # Lấy dữ liệu từ yêu cầu POST (dưới dạng JSON)
    topic = data.get("topic", "")
    vocabulary = data.get("vocabulary", "")

    # Lưu topic và tổng quát từ vựng vào DB
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO vocabulary (topic, vocabulary) VALUES (?, ?)",
        (topic, vocabulary),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Data saved successfully"}), 200


@app.route("/save_vocabulary_bulk", methods=["POST"])
def save_vocabulary_bulk():
    data = request.get_json()  # Lấy dữ liệu JSON từ yêu cầu POST
    topic = data.get("topic", "")
    vocabulary_list = data.get("vocabulary", [])

    # Kiểm tra nếu danh sách từ vựng trống
    if not vocabulary_list:
        return jsonify({"message": "No vocabulary items provided"}), 400

    # Kết nối với cơ sở dữ liệu và thực hiện lưu hàng loạt
    conn = get_db_connection()
    cursor = conn.cursor()

    # Lưu từng từ vựng trong danh sách
    for vocab in vocabulary_list:
        term = vocab.get("term", "")
        definition = vocab.get("definition", "")
        cursor.execute(
            "INSERT INTO vocabulary (topic, term, definition) VALUES (?, ?, ?)",
            (topic, term, definition),
        )

    conn.commit()
    conn.close()

    return jsonify({"message": "All vocabulary items saved successfully"}), 200


# API lấy dữ liệu từ cơ sở dữ liệu
@app.route("/get_english_data", methods=["GET"])
def get_english_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vocabulary")
    rows = cursor.fetchall()
    conn.close()

    # Trả về kết quả dưới dạng JSON
    return jsonify([dict(row) for row in rows]), 200
