import requests
import json
import base64

# Đường dẫn ảnh cần chuyển đổi sang base64
image_path = "C:\\Game\\image\\00005-2839575584.jpeg"  # Thay đường dẫn đến ảnh của bạn

# Chuyển đổi ảnh sang base64
with open(image_path, "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode("utf-8")

# URL của API
url = "http://127.0.0.1:7860/sdapi/v1/png-info"

# Tạo payload request với ảnh base64
payload = {"image": encoded_string}

headers = {"Content-Type": "application/json"}

# Thực hiện request
response = requests.post(url, headers=headers, data=json.dumps(payload))

# Kiểm tra phản hồi
if response.status_code == 200:
    # Chuyển đổi phản hồi thành JSON
    response_json = response.json()

    # In ra phản hồi JSON
    print("Response JSON:")
    print(json.dumps(response_json, indent=4))  # In với định dạng đẹp
else:
    print("Error:", response.status_code, response.text)
