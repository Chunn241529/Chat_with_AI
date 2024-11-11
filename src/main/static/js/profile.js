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
            await module_users.updateUser(updatedUserData);  // Update user data
            alert("User profile updated successfully!");
        } catch (error) {
            console.error("Failed to update user data:", error);
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
