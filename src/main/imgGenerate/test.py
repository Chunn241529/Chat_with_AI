import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from zipfile import ZipFile
from flask import Flask, send_file, jsonify

app = Flask(__name__)

# Chuyển đổi đường dẫn sang tuyệt đối
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOADS_FOLDER = os.path.join(BASE_DIR, "uploads")


def download_images_and_zip(
    page_url, base_folder=UPLOADS_FOLDER, zip_name="images.zip"
):
    # Đường dẫn thư mục lưu ảnh
    output_folder = os.path.join(base_folder, "downloaded_images")
    os.makedirs(output_folder, exist_ok=True)  # Đảm bảo thư mục tồn tại

    # Đường dẫn file ZIP
    zip_path = os.path.join(base_folder, zip_name)
    print(f"Đường dẫn ZIP sẽ được lưu: {zip_path}")

    # Nếu file ZIP đã tồn tại, xóa nó để tránh lỗi
    if os.path.exists(zip_path):
        os.remove(zip_path)

    # Tải hình ảnh và lưu vào thư mục
    try:
        response = requests.get(page_url, timeout=10)
        response.raise_for_status()
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
            img_response = requests.get(img_url, timeout=10)
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


@app.route("/download_images", methods=["POST"])
def api_download_images():
    from flask import request

    try:
        data = request.json
        url = data.get("url")
        if not url:
            return jsonify({"error": "Thiếu tham số URL"}), 400

        zip_path = download_images_and_zip(url)
        return jsonify({"download_url": f"/download/{os.path.basename(zip_path)}"})
    except Exception as e:
        print(f"Lỗi khi xử lý yêu cầu: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/download/<filename>", methods=["GET"])
def download_file(filename):
    file_path = os.path.join(UPLOADS_FOLDER, filename)
    print(f"Đang tìm file: {file_path}")  # Log kiểm tra
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({"error": "File không tồn tại"}), 404


if __name__ == "__main__":
    app.run(debug=True)
