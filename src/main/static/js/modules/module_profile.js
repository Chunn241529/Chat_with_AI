// module_users.js

// Fetch user information using session-stored userId
const getUser = async () => {
    try {
        const response = await fetch(`/auth/user`, { // No need for userId in URL
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("User not found");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
    }
};

// Update user information
const updateUser = async (userData) => {
    try {
        const response = await fetch(`/auth/user`, { // No need for userId in URL
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error("Failed to update user");
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
};

// Delete user
const deleteUser = async () => {
    try {
        const response = await fetch(`/auth/user`, { // No need for userId in URL
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to delete user");
        }

        return await response.json();
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

// Ban user by setting flag to TRUE
const banUser = async () => {
    try {
        const response = await fetch(`/auth/user/ban`, { // No need for userId in URL
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to ban user");
        }

        // Redirect to /manhinhxanh after successful ban
        window.location.href = "/banned";
    } catch (error) {
        console.error("Error banning user:", error);
        throw error;
    }
};

// Unban user by setting flag to FALSE
const unbanUser = async () => {
    try {
        const response = await fetch(`/auth/user/unban`, { // No need for userId in URL
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to unban user");
        }

        return await response.json();
    } catch (error) {
        console.error("Error unbanning user:", error);
        throw error;
    }
};

// Export API functions
export const module_users = {
    getUser,
    updateUser,
    deleteUser,
    banUser,
    unbanUser,
};
