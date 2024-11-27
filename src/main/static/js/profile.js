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
            // Giả lập quá trình lưu dữ liệu
            setTimeout(() => {
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
    const profilePicture = userData.profile_picture || "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIEdlbmVyYXRvcjogU1ZHIFJlcG8gTWl4ZXIgVG9vbHMgLS0+Cjxzdmcgd2lkdGg9IjgwMHB4IiBoZWlnaHQ9IjgwMHB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogICAgPHBhdGggZD0ibSA4IDEgYyAtMS42NTYyNSAwIC0zIDEuMzQzNzUgLTMgMyBzIDEuMzQzNzUgMyAzIDMgcyAzIC0xLjM0Mzc1IDMgLTMgcyAtMS4zNDM3NSAtMyAtMyAtMyB6IG0gLTEuNSA3IGMgLTIuNDkyMTg4IDAgLTQuNSAyLjAwNzgxMiAtNC41IDQuNSB2IDAuNSBjIDAgMS4xMDkzNzUgMC44OTA2MjUgMiAyIDIgaCA4IGMgMS4xMDkzNzUgMCAyIC0wLjg5MDYyNSAyIC0yIHYgLTAuNSBjIDAgLTIuNDkyMTg4IC0yLjAwNzgxMiAtNC41IC00LjUgLTQuNSB6IG0gMCAwIiBmaWxsPSIjMmUzNDM2Ii8+DQo8L3N2Zz4=";
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