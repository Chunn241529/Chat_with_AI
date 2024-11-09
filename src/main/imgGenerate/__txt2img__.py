# Các import cần thiết
import os
import requests
import json
import base64
from flask import Blueprint, request, jsonify, session, url_for

app = Blueprint("AIImage", __name__)


def get_samplers():
    response = requests.get("http://127.0.0.1:7860/sdapi/v1/samplers")
    if response.status_code == 200:
        return [sampler["name"] for sampler in response.json()]
    else:
        print("Lỗi khi lấy samplers:", response.status_code, response.text)
        return []


def get_schedulers():
    response = requests.get("http://127.0.0.1:7860/sdapi/v1/schedulers")
    if response.status_code == 200:
        return [scheduler["name"] for scheduler in response.json()]
    else:
        print("Lỗi khi lấy schedulers:", response.status_code, response.text)
        return []


def get_models():
    response = requests.get("http://127.0.0.1:7860/sdapi/v1/sd-models")
    if response.status_code == 200:
        return [(model["title"], model["hash"]) for model in response.json()]
    else:
        print("Lỗi khi lấy models:", response.status_code, response.text)
        return []


# Hàm gọi API tạo hình ảnh
def run_img_create(
    prompt,
    negative_prompt,
    seed,
    sampler_name,
    scheduler_name,
    batch_size,
    steps,
    cfg_scale,
    width,
    height,
    denoising_strength,
    model,
    model_hash,
):
    url = "http://127.0.0.1:7860/sdapi/v1/txt2img"
    payload = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "seed": seed,
        "sampler_name": sampler_name,
        "scheduler": scheduler_name,
        "batch_size": batch_size,
        "n_iter": 1,
        "steps": steps,
        "cfg_scale": cfg_scale,
        "width": width,
        "height": height,
        "restore_faces": True,
        "tiling": False,
        "do_not_save_samples": False,
        "do_not_save_grid": False,
        "denoising_strength": denoising_strength,
        "model": model,
        "model_hash": model_hash,
    }

    headers = {"Content-Type": "application/json"}
    response = requests.post(url, headers=headers, data=json.dumps(payload))

    if response.status_code == 200:
        response_data = response.json()
        base64_string = response_data["images"][0]

        output_directory = os.path.join(
            os.path.dirname(__file__), "..", "static", "output"
        )
        if not os.path.exists(output_directory):
            os.makedirs(output_directory)

        image_path = os.path.join(output_directory, "image.png")
        with open(image_path, "wb") as img_file:
            img_file.write(base64.b64decode(base64_string))

        return image_path
    else:
        print("Có lỗi khi tạo hình ảnh:", response.status_code, response.text)
        return None


# Định tuyến để xử lý yêu cầu /imgcreate
@app.route("/imgcreate", methods=["POST"])
def img_create():
    data = request.get_json()
    prompt = data.get("prompt", "")
    negative_prompt = data.get("negative_prompt", "")
    seed = data.get("seed", -1)
    batch_size = data.get("batch_size", 1)
    steps = data.get("steps", 50)
    cfg_scale = data.get("cfg_scale", 7.0)
    width = data.get("width", 512)
    height = data.get("height", 512)
    denoising_strength = data.get("denoising_strength", 0.75)

    # Lấy danh sách samplers, schedulers và models
    samplers = get_samplers()
    schedulers = get_schedulers()
    models = get_models()

    if not (samplers and schedulers and models):
        return jsonify({"error": "Không lấy được dữ liệu từ server"}), 500

    # Kiểm tra nếu đây là lần đầu tiên gọi /imgcreate để lấy lựa chọn từ người dùng
    if (
        "sampler_name" not in data
        or "scheduler_name" not in data
        or "model" not in data
    ):
        return jsonify(
            {
                "samplers": samplers,
                "schedulers": schedulers,
                "models": [{"title": m[0], "hash": m[1]} for m in models],
                "message": "Vui lòng chọn sampler, scheduler và model",
            }
        )

    # Nếu người dùng đã chọn các giá trị, gọi hàm tạo ảnh
    sampler_name = data["sampler_name"]
    scheduler_name = data["scheduler_name"]
    model_data = next((m for m in models if m[0] == data["model"]), None)

    if model_data:
        model, model_hash = model_data
    else:
        return jsonify({"error": "Model không hợp lệ"}), 400

    # Gọi hàm tạo hình ảnh
    image_path = run_img_create(
        prompt,
        negative_prompt,
        seed,
        sampler_name,
        scheduler_name,
        batch_size,
        steps,
        cfg_scale,
        width,
        height,
        denoising_strength,
        model,
        model_hash,
    )

    if image_path:
        return jsonify(
            {
                "image_url": url_for(
                    "static", filename=f"output/{os.path.basename(image_path)}"
                )
            }
        )
    else:
        return jsonify({"error": "Không tạo được hình ảnh"}), 500
