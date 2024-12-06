import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from zipfile import ZipFile
from flask import Blueprint, send_file, jsonify, session

app = Blueprint("img", __name__)

# Chuyển đổi đường dẫn sang tuyệt đối
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOADS_FOLDER = os.path.join(BASE_DIR)


def download_images_and_zip(page_url, user_id):
    # Trích xuất tên miền từ URL để tạo tên thư mục
    domain = urlparse(page_url).netloc.replace("www.", "")  # Xóa "www." nếu có
    domain_name = domain.split(".")[0]  # Chỉ lấy phần tên miền chính (bỏ phần mở rộng)

    output_folder = os.path.join(
        UPLOADS_FOLDER, "getImgs", f"user_{user_id}", domain_name
    )
    os.makedirs(output_folder, exist_ok=True)  # Đảm bảo thư mục tồn tại

    # Đường dẫn file ZIP
    zip_folder = os.path.join(UPLOADS_FOLDER, "getImgs", f"user_{user_id}")
    zip_path = os.path.join(zip_folder, f"{domain_name}.zip")
    print(f"Đường dẫn ZIP sẽ được lưu: {zip_path}")

    # Nếu file ZIP đã tồn tại, xóa nó để tránh lỗi
    if os.path.exists(zip_path):
        os.remove(zip_path)

    # Tải hình ảnh và lưu vào thư mục
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        response = requests.get(page_url, headers=headers, timeout=10)
        response.raise_for_status()  # Kiểm tra lỗi
    except Exception as e:
        raise Exception(f"Lỗi khi kết nối tới URL: {e}")

    soup = BeautifulSoup(response.content, "html.parser")
    img_tags = soup.find_all("img")
    image_links = [
        urljoin(page_url, img["src"]) for img in img_tags if "src" in img.attrs
    ]

    if not image_links:
        raise Exception("Không tìm thấy hình ảnh nào trên trang.")

    for idx, img_url in enumerate(image_links):
        try:
            img_response = requests.get(img_url, headers=headers, timeout=10)
            img_response.raise_for_status()
            img_name = os.path.join(output_folder, f"image_{idx + 1}.jpg")
            with open(img_name, "wb") as img_file:
                img_file.write(img_response.content)
        except Exception as e:
            print(f"Lỗi khi tải {img_url}: {e}")

    # Nén ảnh thành file ZIP
    with ZipFile(zip_path, "w") as zip_file:
        for file_name in os.listdir(output_folder):
            file_path = os.path.join(output_folder, file_name)
            if os.path.isfile(file_path):
                zip_file.write(file_path, os.path.basename(file_path))

    return zip_path


from flask import request, jsonify


@app.route("/download_images", methods=["POST"])
def api_download_images():
    try:
        data = request.json
        url = data.get("url")
        user_id = session.get("user_id")

        if not url:
            return jsonify({"error": "Thiếu tham số URL"}), 400

        zip_path = download_images_and_zip(url, user_id)

        # Sử dụng request.url_root để lấy URL gốc của ứng dụng
        download_url = (
            request.url_root + f"download/{user_id}/{os.path.basename(zip_path)}"
        )

        return jsonify({"download_url": download_url})

    except Exception as e:
        print(f"Lỗi khi xử lý yêu cầu: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/download/<user_id>/<filename>", methods=["GET"])
def download_file(user_id, filename):
    file_path = os.path.join(UPLOADS_FOLDER, "getImgs", f"user_{user_id}", filename)
    print(f"Đang tìm file: {file_path}")  # Log kiểm tra
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({"error": "File không tồn tại"}), 404
