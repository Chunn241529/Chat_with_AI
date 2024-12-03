import sqlite3
import requests
import json
import base64

# Kết nối đến cơ sở dữ liệu SQLite
conn = sqlite3.connect("chatbot.db")
cursor = conn.cursor()
# URL của API
url = "http://127.0.0.1:7860/sdapi/v1/loras"

# Gọi API để lấy thông tin Lora
response = requests.get(url)

if response.status_code == 200:
    loras = response.json()  # Giả sử API trả về danh sách các Lora
    for lora in loras:
        # Giả định rằng Lora có các trường: name, alias, path và metadata
        name = lora.get("name")
        alias = lora.get("alias")
        path = lora.get("path")
        metadata = json.dumps(
            lora.get("metadata")
        )  # Chuyển đổi metadata sang chuỗi JSON nếu cần thiết

        # Chèn dữ liệu Lora vào bảng lora
        cursor.execute(
            "INSERT INTO lora (name, alias, path, metadata) VALUES (?, ?, ?, ?)",
            (name, alias, path, metadata),
        )

    # Lưu thay đổi vào cơ sở dữ liệu
    conn.commit()
    print("Lora data saved to database successfully.")
else:
    print(f"Failed to retrieve Lora data. Status code: {response.status_code}")

# Đóng kết nối
conn.close()
