
const placeholderText = "Nhập tin nhắn";
let placeholderIndex = 0;
let typing = true;

let current_topic_id = null;  // Biến toàn cục để lưu current_topic_id


function readEnglish(lang, text) {
    fetch('/en/read', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
            lang: lang
        }),
    })
        .then(response => response.json())
        .then(result => {
            if (result.file_url) {
                console.log("File audio URL:", result.file_url);

                // Lấy div có id 'audio'
                const audioDiv = document.getElementById("audio");

                // Tạo thẻ <audio> mới
                const audioElement = document.createElement("audio");
                audioElement.src = result.file_url;  // Đường dẫn đến file âm thanh
                audioElement.controls = true;
                audioElement.hidden = true;    // Hiển thị các điều khiển audio (nếu cần)

                // Thêm thẻ <audio> vào trong div 'audio'
                audioDiv.appendChild(audioElement);

                // Phát âm thanh
                audioElement.play().then(() => {
                    console.log("Audio is playing");
                }).catch((error) => {
                    console.error("Error playing audio:", error);
                });
            } else {
                console.error("No audio file URL returned:", result);
            }
        })
        .catch(error => {
            console.error("Error when reading:", error);
        });
}

// Hàm để tạo topic mới
function createTopic(topicName) {
    if (typeof topicName !== 'string') {
        console.error("Topic name is invalid");
        return;
    }

    // Gửi yêu cầu tạo topic mới
    fetch('/en/create_topic', {  // Endpoint để tạo topic
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic_name: topicName }),
    })
        .then(response => response.json())
        .then(result => {
            if (result.topic_id) {
                // Cập nhật current_topic_id nếu tạo thành công
                current_topic_id = result.topic_id;
                console.log("Đã tạo topic với ID:", current_topic_id);
            } else {
                console.error("Tạo topic thất bại:", result.message);
            }
        })
        .catch(error => {
            console.error("Lỗi khi tạo topic:", error);
        });
}

// Hàm trích xuất từ vựng và topic từ văn bản nhập vào
function englishPattern(text) {
    // Kiểm tra nếu text là chuỗi
    if (typeof text !== 'string') {
        console.error('text is not a string:', text);
        return;
    }

    const vocabularyRegex = /Từ vựng:\s*([\s\S]*?)(?=\n\n|$)/i;

    // Trích xuất từ vựng
    const vocabularyMatch = text.match(vocabularyRegex);
    const vocabularyText = vocabularyMatch ? vocabularyMatch[1].trim() : "";

    // Kiểm tra và tách từng từ vựng và định nghĩa
    const vocabularyItems = vocabularyText.split("\n").map(line => {
        const parts = line.split(":");
        if (parts.length > 1) {
            return {
                term: parts[0].replace(/^\*\s*/, '').trim(),  // Loại bỏ dấu hoa thị và khoảng trắng
                definition: parts.slice(1).join(":").trim()   // Ghép lại nếu có dấu ":" trong định nghĩa
            };
        }
        return null;
    }).filter(item => item);  // Loại bỏ các mục null nếu không khớp

    // Tạo dữ liệu để gửi
    const data = {
        topic_id: current_topic_id,  // Sử dụng current_topic_id đã tạo
        vocabulary: vocabularyItems
    };

    // Gửi tất cả từ vựng trong một yêu cầu duy nhất
    fetch('/en/save_vocabulary_bulk', {   // Đổi URL phù hợp với endpoint lưu từ vựng
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(result => {
            console.log("All vocabulary items saved successfully:", result);
        })
        .catch(error => {
            console.error("Error saving vocabulary items:", error);
        });
}



function animatePlaceholder() {
    const textarea = $('#user_input');
    const chatPanelWidth = $('.chat__conversation-panel').width(); // Lấy chiều rộng của phần chứa

    // Nếu chiều rộng quá nhỏ, ẩn placeholder
    if (chatPanelWidth < 300) {
        textarea.attr('placeholder', ''); // Xóa placeholder
        return;
    }

    // Thực hiện hiệu ứng gõ
    if (typing) {
        textarea.attr('placeholder', placeholderText.slice(0, placeholderIndex + 1));
        placeholderIndex++;
        if (placeholderIndex === placeholderText.length) {
            setTimeout(() => {
                typing = false;
            }, 2000); // Tạm dừng ở cuối
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
    "đéo", "địt", "má mày", "mẹ mày", "cặc", "lồn", "đồ chó", "đồ khốn", "đồ chết tiệt", "đồ mất dạy",
    "bố láo", "vô học", "cút", "điên khùng", "ngu si", "đần độn", "con đĩ", "thằng hâm", "mày tao",
    "ngu ngốc", "vãi", "thằng ngu", "thằng khốn", "con mụ", "đồ rẻ rách", "bẩn thỉu", "chết mẹ mày đi",
    "cái thứ", "đm", "vãi cả", "cút mẹ", "vãi nồi", "vãi đạn", "đĩ điếm", "đồ súc sinh", "đồ khỉ gió",
    "đồ con hoang", "bà nội mày", "bà ngoại mày", "thằng chó", "chết tiệt", "khốn nạn", "đụ",
    "đụ má", "đồ đểu", "thúi tha", "chết cha mày", "mẹ kiếp", "mẹ mày", "chết bầm", "khốn kiếp",
    "thằng quỷ", "con quỷ", "con chó", "đmm", "con lợn", "mày là đồ mất dạy", "mày là đồ đĩ", "đồ khốn nạn", "thằng chó má", "mày là đồ phản bội",
    "thằng mồi", "thằng khốn nạn", "con đĩ vãi", "đéo mẹ", "địt mẹ", "mày đéo có não", "mày là đồ ngu dốt",
    "con chó cưng", "là đồ đẻ bậy", "thằng đần", "con khốn", "không ra gì", "đi chết đi", "thằng khốn nạn",
    "đồ dơ bẩn", "mẹ mày đừng có nói chuyện", "đầu đất", "lũ ngu", "thằng con hoang", "cái thứ đấy", "thứ đéo",
    "chết mày đi", "đồ chó đẻ", "bố mày", "mẹ đẻ mày", "tổ sư mày", "mẹ mày điên", "lũ hề", "bố đéo",
    "chó chết", "thằng phá hoại", "đồ cuốn", "thằng mắc dịch", "mày bẩn thỉu", "lũ vô học", "đừng làm phiền",
    "đi chết", "mày không có tư cách", "thằng vô dụng", "đồ ngu", "mẹ kiếp", "chó đẻ", "thằng khốn nạn",
    "thằng hèn", "đéo thèm nghe", "đầu đất", "không có nhân phẩm", "bộ mặt giả dối", "thằng khốn", "mẹ mày",
    "lũ cặn bã", "đánh chết mày", "đồ xấu", "mày là đồ khốn", "thằng khốn đốn", "mày mất dạy", "tổ sư mày",
    "thằng bẩn thỉu", "cái thứ hèn hạ", "bố mày", "đồ điên", "đồ khốn kiếp", "thằng quái đản", "đồ súc sinh",
    "lũ hèn hạ", "chết tiệt", "đổ vỡ", "đéo có giá trị", "lũ chó", "mày là đồ ngu xuẩn", "bọn mày đáng chết",
    "đi chết đi", "thằng chó chết", "lũ vô dụng", "mày tởm quá", "thằng khốn điên", "dmm",

    // Tiếng Anh
    "fuck", "shit", "bitch", "asshole", "bastard", "motherfucker", "cunt", "dumbass", "idiot",
    "moron", "jerk", "retard", "piss off", "bullshit", "damn", "screw you", "dickhead", "prick",
    "scumbag", "son of a bitch", "loser", "suck", "crap", "arsehole", "goddamn", "douchebag",
    "whore", "slut", "dick", "fucker", "arse", "freak", "jerk off", "hell no", "holy shit",
    "freaking", "screw it", "bloody hell", "pain in the ass", "screw that", "for Christ's sake",
    "for God's sake", "what the hell", "go to hell", "shut the fuck up", "dammit",
    "ass", "bitchass", "bastardize", "bullcrap", "buttface", "cockhead", "cock sucker", "cockroach", "cumface",
    "cuntface", "dickhead", "dickbag", "dipshit", "douche", "douche nozzle", "douchebag", "dumbfuck", "fag",
    "faggot", "freakshow", "fuckbag", "fuckstick", "goddamn it", "hellhole", "horseface", "jerkoff", "kiss my ass",
    "lameass", "motherfucking", "noob", "nutsack", "penishead", "pissed off", "prickface", "retardhead", "shithead",
    "shut the fuck up", "slutbag", "son of a bitch", "stupidass", "suck it", "thot", "twat", "wetback", "whoremonger",
    "bitchass", "cockwhore", "dickless", "douchebucket", "dumbass", "fuckboy", "fuckwit", "fudgebucket",
    "jackass", "motherfucker", "pisshead", "prickish", "retardfied", "scumbag", "shitfuck", "shithead",
    "shitlicker", "skank", "slutty", "smeghead", "sonofabitch", "twatsucker", "whorebag", "cumguzzler",
    "cockmongler", "spermdump", "shagfucker", "shitstain", "cockwomble", "assclown", "clitlicker",
    "cuntface", "ballbag", "cockduster", "dickwad", "flapsucker", "gobshite", "knobjockey", "prickface",
    "fuckyourself", "clitguzzler", "slutwhore", "dicklicker", "semendump", "fuckerface", "turdbrain"
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
            console.log(data);
            if (data.conversations && Array.isArray(data.conversations)) {
                data.conversations.forEach(group => {
                    group.history.forEach(item => {
                        const userMessage = formatAndEscapeMessage4User(item.input_text);
                        if (userMessage) {
                            appendMessage(userMessage, "user");
                        }

                        if (item.img_base64 && item.img_base64.length > 0) {
                            appendMessage(item.img_base64, "user");
                        }

                        const aiResponse = item.ai_response;
                        const aiMessageBubble = appendMessage("Loading message...", "ai");

                        const { text, codeBlocks, links } = extractCodeAndText(aiResponse);
                        let formattedText = formatAndEscapeMessage(text);
                        let finalMessage = formattedText;

                        codeBlocks.forEach(({ language, code }) => {
                            finalMessage += createCodeBlock(code, language);
                        });

                        if (links.length > 0) {
                            finalMessage += '<div class="links-container">';
                            links.forEach(link => {
                                const linkShort = getDomainName(link);
                                finalMessage += `<div class="link-box"><a href="${link}" target="_blank">${linkShort}</a></div>`;
                            });
                            finalMessage += '</div>';
                        }

                        aiMessageBubble.innerHTML = finalMessage;
                        typeWriter(aiMessageBubble, finalMessage, 0);
                    });
                });
            } else {
                console.error("No conversations found or data is not an array.");
            }
            $('#response').scrollTop($('#response')[0].scrollHeight);
        },
        error: function (xhr) {
            console.error('AJAX error:', xhr);
            $('#response').append('<div class="error"><strong>Error:</strong> ' + xhr.responseJSON.error + '</div>');
        }
    });
}

function formatAndEscapeMessage4User(message) {
    const formattedMessage = message
        .replace(/\*\*(.*?)\*\*/g, '<b style="color: #ce2479;">$1</b>') // Bold
        .replace(/__(.*?)__/g, '<i>$1</i>') // Italic
        .replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>') // Link (chỉ chấp nhận URL bắt đầu với http/https)
        .replace(/\n/g, '<br>'); // Thay \n thành <br> để giữ định dạng xuống dòng

    return formattedMessage;
}


function formatAndEscapeMessage(message) {
    // Nếu `message` là một mảng, xử lý từng phần tử
    if (Array.isArray(message)) {
        return message.map(msg => formatAndEscapeMessage(msg)).join('<br>');  // Gọi lại hàm với từng phần tử trong mảng
    }

    // Kiểm tra nếu `message` là chuỗi
    if (typeof message !== 'string') {
        return '';  // Trả về chuỗi rỗng nếu không phải chuỗi
    }

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
    const codeBlocks = [];
    const links = [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    links.push(...(responseMessage.match(urlRegex) || []));

    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let text = responseMessage;
    let match;

    while ((match = codeBlockRegex.exec(responseMessage)) !== null) {
        const language = match[1] || 'plaintext';
        const code = match[2].trim();
        codeBlocks.push({ language, code });
        text = text.replace(match[0], '');
    }

    text = text.trim();
    return { text, codeBlocks, links };
}

function handleResponse(data, links = []) {
    const responseMessage = data.response;
    const { text, codeBlocks, links: extractedLinks } = extractCodeAndText(responseMessage);

    let formattedText = formatAndEscapeMessage(text);
    let finalMessage = formattedText;

    codeBlocks.forEach(({ language, code }) => {
        finalMessage += createCodeBlock(code, language);
    });

    const allLinks = [...new Set([...links, ...extractedLinks])];
    if (allLinks.length > 0) {
        finalMessage += '<div class="links-container">';
        allLinks.forEach(link => {
            const linkShort = getDomainName(link);
            finalMessage += `<div class="link-box"><a href="${link}" target="_blank">${linkShort}</a></div>`;
        });
        finalMessage += '</div>';
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
        ? `${localStorage.getItem("profile_picture")}`
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
    let typingIndicator = $('<span>.</span>'); // Luôn có ít nhất 1 dấu chấm
    element.append(typingIndicator);

    let dotCount = 1;
    let typingInterval = setInterval(function () {
        dotCount = (dotCount % 3) + 1; // Chuyển đổi giữa 1 và 3 dấu chấm
        typingIndicator.text('.'.repeat(dotCount));
    }, 200);

    setTimeout(function () {
        clearInterval(typingInterval);
        typingIndicator.remove();
        element.html(text.replace(/\n/g, '<br>'));
        document.getElementById("send").classList.remove("sending");
        document.getElementById("send-icon").src = "../static/img/send.png";
    }, text.length * speed);
}

function createCodeBlock(code, language = 'plaintext') {
    const escapedCode = escapeHtml(code); // Escape HTML để tránh XSS

    // Trả về cấu trúc HTML cho code block với Prism.js syntax highlighting
    const codeBlock = `
        <div class="code-block">
            <div class="code-header">
                <span class="code-language">${language}</span>
                <button class="copy-button" onclick="copyToClipboard(\`${escapedCode}\`)">Copy</button>
            </div>
            <pre><code class="language-${language}">${escapedCode.trim()}</code></pre>
        </div>
    `.trim();

    // Đảm bảo Prism.js highlight code block sau khi đã thêm vào DOM
    setTimeout(() => {
        Prism.highlightAll(); // Highlight tất cả code block trên trang
    }, 0);

    return codeBlock;
}


function copyToClipboard(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert('Code copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}


function escapeHtml(str) {
    return str.replace(/[&<>"'`]/g, function (char) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '`': '&#x60;'
        }[char];
    });
}



export const module_chat = {
    current_topic_id,  // Export current_topic_id
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
    englishPattern,
    createTopic,
    readEnglish,
};
