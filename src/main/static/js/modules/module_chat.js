const placeholderText = "Nhập tin nhắn";
let placeholderIndex = 0;
let typing = true;

function animatePlaceholder() {
    const textarea = $('#user_input');
    if (typing) {
        textarea.attr('placeholder', placeholderText.slice(0, placeholderIndex + 1));
        placeholderIndex++;
        if (placeholderIndex === placeholderText.length) {
            setTimeout(() => {
                typing = false;
            }, 2000);  // Dừng lại trong 2 giây
        }
    } else {
        textarea.attr('placeholder', placeholderText.slice(0, placeholderIndex - 1));
        placeholderIndex--;
        if (placeholderIndex === 0) {
            typing = true;
        }

    }
}

function clear_val(userInput, imageFile, shouldClear = true) {
    if (!shouldClear) {
        return; // Nếu công tắc là false, không thực hiện gì cả
    }


    $('#user_input').val(userInput);
    let currentInput = userInput;
    if (userInput.length > 0 || imageFile) {
        // Loại bỏ ký tự xuống dòng và các ký tự đặc biệt khác
        currentInput = '';

        // Gán giá trị đã loại bỏ xuống dòng vào input
        $('#user_input').val(currentInput);

        // Reset file input và các thành phần khác
        $('#file_input').val('');  // Reset file input
        $('#modal_img_preview').fadeOut();  // Ẩn modal hình ảnh

        // Reset lại chiều cao
        $('#user_input').css('height', '47px');
        $('#panel_container').css('height', '70px');
    }
}



const keyword_cams = [
    // Tiếng Việt
    // Tiếng Việt
    "đéo", "địt", "má", "mẹ", "cặc", "lồn", "đồ chó", "đồ khốn", "đồ chết tiệt", "đồ mất dạy",
    "bố láo", "vô học", "cút", "điên khùng", "ngu si", "đần độn", "con đĩ", "thằng hâm", "mày tao",
    "ngu ngốc", "vãi", "thằng ngu", "thằng khốn", "con mụ", "đồ rẻ rách", "bẩn thỉu", "chết mẹ mày đi",
    "cái thứ", "đm", "vãi cả", "cút mẹ", "vãi nồi", "vãi đạn", "đĩ điếm", "đồ súc sinh", "đồ khỉ gió",
    "đồ con hoang", "bà nội mày", "bà ngoại mày", "thằng chó", "chết tiệt", "khốn nạn", "đụ",
    "đụ má", "đồ đểu", "thúi tha", "chết cha mày", "mẹ kiếp", "mẹ mày", "chết bầm", "khốn kiếp",
    "thằng quỷ", "con quỷ",

    // Tiếng Anh
    "fuck", "shit", "bitch", "asshole", "bastard", "motherfucker", "cunt", "dumbass", "idiot",
    "moron", "jerk", "retard", "piss off", "bullshit", "damn", "screw you", "dickhead", "prick",
    "scumbag", "son of a bitch", "loser", "suck", "crap", "arsehole", "goddamn", "douchebag",
    "whore", "slut", "dick", "fucker", "arse", "freak", "jerk off", "hell no", "holy shit",
    "freaking", "screw it", "bloody hell", "pain in the ass", "screw that", "for Christ's sake",
    "for God's sake", "what the hell", "go to hell", "shut the fuck up", "dammit"
];

function check_tucam(user_input) {
    // Đảm bảo user_input là chuỗi và chuyển thành chữ thường
    if (typeof user_input !== "string") {
        return false;  // Trả về false nếu user_input không phải là chuỗi
    }

    // Kiểm tra xem user_input có chứa từ cấm không
    return keyword_cams.some(keyword_cam => user_input.toLowerCase().includes(keyword_cam.toLowerCase()));
}

const keywords = [
    // Phim-related
    "Phim", "Phim hay", "Phim mới", "Phim chiếu rạp", "Movies", "Movie trailer", "Film", "Film trailer",
    "trailer", "Phim trailer", "Netflix", "Phim trên Netflix", "Netflix series", "Netflix movies", "Bài hát",
    "Spotify", "Spotify music", "Nhạc nền", "Background music", "Kịch bản phim", "Movie script", "OST", "Original soundtrack",
    "Live concert", "Concert trực tiếp", "Hát karaoke", "Karaoke", "Ca sĩ", "Singer", "Nhóm nhạc", "Band", "Music group",
    "Múa", "Dance", "Dancer", "Poster phim", "Movie poster", "Xem phim online", "Watch movie online", "Truyện ngắn", "Short story",

    // Game-related
    "Game", "Trò chơi", "Game online", "Online game", "Hướng dẫn chơi", "Game tutorial", "Game cheats", "Cheats game",
    "Tải game", "Download game", "Game download", "Review game", "Game review", "So sánh game", "Compare game", "Hướng dẫn sử dụng",
    "User guide", "Code", "Source code", "Khắc phục lỗi", "Fix error", "Thủ thuật", "Tips", "Tricks", "Cài đặt", "Settings",
    "Trang web", "Website", "App", "Ứng dụng", "Download app", "App download", "Cấu hình máy tính", "Computer configuration",
    "Tự động hóa", "Automation", "Automation setup",

    // Food & Recipe-related
    "Cách làm", "How to make", "Công thức", "Recipe", "Dự báo thời tiết", "Weather forecast",

    // Travel-related
    "Tour du lịch", "Travel tour", "Chuyến bay", "Flight", "Khách sạn", "Hotel", "Hotel booking", "Review du lịch", "Travel review",

    // Health-related
    "Bệnh", "Disease", "Triệu chứng", "Symptoms", "Chuyên gia tư vấn", "Expert advice", "Chữa bệnh", "Cure disease", "Làm đẹp", "Beauty",

    // Additional requests
    "fix giúp tôi", "Sửa giúp tôi", "Help me fix", "Help me repair", "Tìm kiếm", "Search"
];


// Hàm kiểm tra nếu user_input chứa từ khóa
function containsKeyword(user_input) {
    return keywords.some(keyword => user_input.toLowerCase().includes(keyword.toLowerCase()));
}

function loadChatHistory() {
    $.ajax({
        type: "GET",
        url: "/auth/load_chat_history",
        success: function (data) {
            console.log(data); // Kiểm tra dữ liệu phản hồi
            if (data.conversations && Array.isArray(data.conversations)) {
                data.conversations.forEach(group => {
                    group.history.forEach(item => {
                        // Hiển thị tin nhắn của người dùng
                        const userMessage = formatAndEscapeMessage4User(item.input_text);
                        if (userMessage && userMessage.trim() !== "") {
                            appendMessage(userMessage, "user");
                        }

                        // Kiểm tra và hiển thị hình ảnh nếu có
                        if (item.img_base64 && item.img_base64.length > 0) {
                            appendMessage(item.img_base64, "user");
                        }

                        // Lưu trữ phản hồi AI
                        let aiResponse = item.ai_response;
                        const aiMessageBubble = appendMessage("Đang load tin nhắn...", "ai");

                        // Tách text và code blocks từ aiResponse
                        const { text, codeBlocks } = extractCodeAndText(aiResponse);
                        let formattedText = formatAndEscapeMessage(text);
                        let finalMessage = formattedText + "<br>";

                        // Xử lý các code blocks nếu có
                        const seenLanguages = new Set();
                        codeBlocks.forEach(({ language, codeBlock }) => {
                            const languageTitle = `<p><b>${language.charAt(0).toUpperCase() + language.slice(1)}:</b></p>`;
                            formattedText = formattedText.replace(languageTitle, '');

                            if (!seenLanguages.has(language)) {
                                finalMessage += languageTitle;
                                seenLanguages.add(language);
                            }

                            finalMessage += createCodeBlock(codeBlock, language);
                        });

                        // Tìm và thêm các liên kết từ aiResponse
                        const linkRegex = /(https?:\/\/[^\s,]+)/g;
                        let links = aiResponse.match(linkRegex); // Khai báo đúng mảng links

                        // Add links if any
                        if (links && links.length > 0) {
                            links.forEach(link => {
                                const linkShort = getDomainName(link) + "...";
                                finalMessage += `<div class="link-box"><a href="${link}" target="_blank">${linkShort}</a></div>`;
                            });
                            finalMessage += "</div>"; // Thêm thẻ đóng div.links nếu có liên kết
                            finalMessage = finalMessage.replace(links, '')
                        }


                        // Thêm nội dung vào DOM với innerHTML để xử lý HTML
                        aiMessageBubble.innerHTML = finalMessage;

                        // Gọi typeWriter để hiển thị nội dung của aiMessageBubble
                        typeWriter(aiMessageBubble, finalMessage, 0);
                    });
                });
            } else {
                console.error("No conversations found or data is not an array.");
            }
            $('#response').scrollTop($('#response')[0].scrollHeight);
        },
        error: function (xhr) {
            console.error('AJAX error:', xhr); // Log lỗi
            $('#response').append('<div class="error"><strong>Error:</strong> ' + xhr.responseJSON.error + '</div>');
        }
    });
}

function formatAndEscapeMessage4User(message) {
    // Áp dụng định dạng (bold, italic, link)
    const formattedMessage = message
        .replace(/\*\*(.*?)\*\*/g, '<b style="color: #ce2479;">$1</b>') // Bold
        .replace(/__(.*?)__/g, '<i>$1</i>') // Italic
        .replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>') // Link (chỉ chấp nhận URL bắt đầu với http/https)
        .replace(/\n/g, '<br>'); // Giữ lại xuống dòng

    return formattedMessage;
}

function formatAndEscapeMessage(message) {
    // Escape HTML special characters
    const escapedMessage = message.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // Apply formatting
    return escapedMessage
        .replace(/\*\*(.*?)\*\*/g, '<b style="color: #ce2479;">$1</b>') // Bold
        .replace(/__(.*?)__/g, '<i>$1</i>') // Italic
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Link
        .replace(/\n\s*\*\s(.*)/g, '<li>$1</li>'); // Danh sách
}

function extractCodeAndText(responseMessage) {
    // Trích xuất text và code blocks từ phản hồi
    const codeBlocks = [];
    let links = [];

    // Giả sử các liên kết sẽ được chứa trong phản hồi dưới dạng URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    links = responseMessage.match(urlRegex) || [];

    // Xử lý các khối mã
    const codeBlockRegex = /```(.*?)```/gs;
    let match;
    while ((match = codeBlockRegex.exec(responseMessage)) !== null) {
        codeBlocks.push({ language: "Unknown", codeBlock: match[1] });
    }

    // Trả về text và các khối mã
    const text = responseMessage.replace(codeBlockRegex, '').trim();

    return { text, codeBlocks, links };
}

function handleResponse(data, links = []) {
    const responseMessage = data.response;
    const { text, codeBlocks } = extractCodeAndText(responseMessage);

    let formattedText = formatAndEscapeMessage(text);
    let finalMessage = formattedText + "<br>";
    const seenLanguages = new Set();

    // Process code blocks
    codeBlocks.forEach(({ language, codeBlock }) => {
        const languageTitle = `<p><b>${language.charAt(0).toUpperCase() + language.slice(1)}:</b></p>`;
        formattedText = formattedText.replace(languageTitle, '');

        if (!seenLanguages.has(language)) {
            finalMessage += languageTitle;
            seenLanguages.add(language);
        }

        finalMessage += createCodeBlock(codeBlock, language);
    });

    // Add links if any
    if (links && links.length > 0) {
        links.forEach(link => {
            const linkShort = getDomainName(link) + "...";
            finalMessage += `<div class="link-box"><a href="${link}" target="_blank">${linkShort}</a></div>`;
        });
        finalMessage += "</div>";
    }

    const aiMessageBubble = appendMessage('', "ai");
    typeWriter(aiMessageBubble, finalMessage, 4);
    $('#response').scrollTop($('#response')[0].scrollHeight);
}

function saveConversationHistoryToDB(conversationHistory) {
    const userPrompt = conversationHistory.filter(item => item.sender === 'user').map(item => item.message).join(" ");
    const aiResponse = conversationHistory.filter(item => item.sender === 'ai').map(item => item.message).join(" ");

    // Kiểm tra giá trị của aiResponse và userPrompt
    console.log('User Prompt:', userPrompt);
    console.log('AI Response:', aiResponse);

    if (!aiResponse) {
        console.error('AI response is empty!');
    }

    // Save to DB via API
    $.ajax({
        type: "POST",
        url: "/chat/save_conversation",
        contentType: "application/json",
        data: JSON.stringify({
            user_prompt: userPrompt,
            img_base64: '', // If you have image base64, include it here
            ai_response: aiResponse,
        }),
        success: function (response) {
            console.log('Conversation saved to DB:', response);

            // Clear the localStorage after saving the conversation to DB
            localStorage.removeItem('conversationHistory');
        },
        error: function (xhr) {
            console.error('Error saving conversation to DB:', xhr.responseJSON.error);
        }
    });
}
// Hàm để lấy tên miền của liên kết
function getDomainName(url) {
    try {
        const hostname = new URL(url).hostname.replace('www.', '');  // Lấy hostname và loại bỏ 'www.'
        const domainName = hostname.split('.')[0];  // Lấy tên miền chính (ví dụ: youtube, spotify)

        // Thêm '...' nếu tên miền dài hơn 10 ký tự (hoặc bạn có thể thay đổi giới hạn này)
        if (domainName.length > 10) {
            return domainName.substring(0, 10) + '...';
        }

        return domainName;  // Trả lại tên miền nếu không cần rút gọn
    } catch (e) {
        return url;  // Trả lại URL gốc nếu không hợp lệ
    }
}

function appendMessage(message, sender) {
    const isUser = sender === "user";
    const isAI = sender === "ai";
    const avatarUrl = isUser
        ? "https://randomuser.me/api/portraits/men/32.jpg"
        : "/static/img/ai.png";
    const nickname = isUser ? "User" : "AI";

    let messageContent = '';

    // Nếu tin nhắn là hình ảnh (kiểm tra URL trong message)
    if (message.startsWith('data:image')) {
        // Nếu là hình ảnh, hiển thị hình ảnh thay vì văn bản
        messageContent = `<img src="${message}" alt="Image" class="chat-image" />`;
    } else {
        // Nếu không phải hình ảnh, hiển thị văn bản bình thường
        messageContent = `<span>${message.trim()}</span>`;
    }

    const messageContainer = `
        <div class="chat__conversation-board__message-container ${isUser ? 'user-message reversed' : 'ai-message'}">
            <div class="chat__conversation-board__message__person">
                <div class="chat__conversation-board__message__person__avatar">
                    <img src="${avatarUrl}" alt="${nickname} Avatar" />
                </div>
                <span class="chat__conversation-board__message__person__nickname">${nickname}</span>
            </div>
            <div class="chat__conversation-board__message__context">
                <div class="chat__conversation-board__message__bubble">
                     ${messageContent}  <!-- Output the image or message -->
                </div>
            </div>
        </div>
    `.trim();

    $('#response').append(messageContainer);
    return isAI ? $('.ai-message').last().find('span') : null;
}

function typeWriter(element, text, speed) {
    let typingIndicator = $('<span>...</span>');
    element.append(typingIndicator);

    let dotCount = 1;
    let typingInterval = setInterval(function () {
        dotCount = (dotCount + 1) % 4;
        typingIndicator.text('.'.repeat(dotCount));
    }, 300);

    setTimeout(function () {
        clearInterval(typingInterval);
        typingIndicator.remove();
        element.html(text.replace(/\n/g, '<br>'));
        document.getElementById("send").classList.remove("sending");
        document.getElementById("send-icon").src = "../static/img/send.png";
    }, text.length * speed);

}

function createCodeBlock(code, language = 'javascript') {
    const escapedCode = escapeHtml(code);
    return `
        <div class="code-block">
            <button class="copy-button">Copy</button>
            <pre>
                <code class="language-${language}">${escapedCode.trim()}</code>
            </pre>
        </div>
    `.trim();
}

$(document).on('click', '.copy-button', function () {
    // Tìm phần tử <code> bên trong <pre> và lấy văn bản
    const code = $(this).siblings('pre').find('code').text();
    navigator.clipboard.writeText(code).then(() => {

    }).catch(err => {

    });
});


function escapeHtml(html) {
    return html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Export các API functions
export const module_chat = {
    animatePlaceholder,
    clear_val,
    check_tucam,
    containsKeyword,
    loadChatHistory,
    formatAndEscapeMessage4User,
    formatAndEscapeMessage,
    extractCodeAndText,
    handleResponse,
    escapeHtml,
    createCodeBlock,
    typeWriter,
    appendMessage,
    saveConversationHistoryToDB,
};
