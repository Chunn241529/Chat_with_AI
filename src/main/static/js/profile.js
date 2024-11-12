import { module_users } from './modules/module_profile.js';

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const userData = await module_users.getUser(); // Get user data
        populateForm(userData);  // Populate form fields with user data
    } catch (error) {
        console.error("Failed to load user data:", error);
    }

    // Save changes
    document.getElementById("saveChangesButton").addEventListener("click", async () => {
        const updatedUserData = collectFormData();  // Collect form data
        try {
            // Thực hiện cập nhật dữ liệu người dùng
            await module_users.updateUser(updatedUserData);

            // Hiển thị spinner khi đang lưu dữ liệu
            document.getElementById("loader").style.display = "block";

            // Giả lập quá trình lưu dữ liệu
            setTimeout(() => {
                // Ẩn spinner sau khi hoàn thành
                document.getElementById("loader").style.display = "none";

                // Hiển thị thông báo thành công
                const successMessage = document.getElementById("successMessage");
                successMessage.style.display = "block";

                setTimeout(() => {
                    successMessage.style.display = "none";
                    setTimeout(() => {
                        location.reload();  // Tải lại trang sau khi lưu thành công
                    }, 0);
                }, 1500);

            }, 1500); // Giả lập thời gian chờ để mô phỏng quá trình lưu dữ liệu

        } catch (error) {
            // Nếu có lỗi xảy ra, hiển thị thông báo lỗi
            console.error("Failed to update user data:", error);

            // Hiển thị thông báo lỗi
            const errorMessage = document.getElementById("errorMessage");
            errorMessage.style.display = "block";

            setTimeout(() => {
                errorMessage.style.display = "none";  // Ẩn thông báo lỗi sau 2 giây
            }, 2000);

            alert("Failed to update profile.");
        }
    });

    // Handle profile picture upload
    document.getElementById("uploadProfilePicture").addEventListener("change", handleProfilePictureUpload);
});

function handleProfilePictureUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = function () {
            const base64Image = reader.result;
            document.getElementById("inputProfilePicture").src = base64Image;  // Show the uploaded image
        };
        reader.readAsDataURL(file);  // Convert the file to base64
    }
}

function populateForm(userData) {
    document.getElementById("inputUsername").value = userData.username || "";
    document.getElementById("inputName").value = userData.name || "";
    document.getElementById("inputBio").value = userData.bio || "";
    document.getElementById("inputCountryCode").value = userData.country_code || "";
    document.getElementById("inputEmailAddress").value = userData.email || "";
    document.getElementById("inputPhone").value = userData.phone || "";
    document.getElementById("inputBirthday").value = userData.date_of_birth || "";

    // Set the profile picture (if available)
    const profilePicture = userData.profile_picture || "";
    document.getElementById("inputProfilePicture").src = profilePicture;
}

function collectFormData() {
    // Collect form data
    return {
        username: document.getElementById("inputUsername").value,
        name: document.getElementById("inputName").value,
        bio: document.getElementById("inputBio").value,
        country_code: document.getElementById("inputCountryCode").value,
        email: document.getElementById("inputEmailAddress").value,
        phone: document.getElementById("inputPhone").value,
        date_of_birth: document.getElementById("inputBirthday").value,
        profile_picture: document.getElementById("inputProfilePicture").src,  // Get base64 image
    };
}