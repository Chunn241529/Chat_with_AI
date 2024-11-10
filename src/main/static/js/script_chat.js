$(document).ready(function () {
    // Thêm hiệu ứng nhập và xóa cho placeholder

    let isSending = false;  // Biến trạng thái đang gửi
    let currentFetchController = null;  // Bộ điều khiển để hủy yêu cầu fetch hiện tại

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

    // Mỗi 100ms sẽ cập nhật lại placeholder
    setInterval(animatePlaceholder, 100);
    $('#user_input').on('input', function () {
        this.style.height = 'auto'; // Đặt lại chiều cao để tính toán chính xác
        if (this.scrollHeight > this.clientHeight) {
            if (this.scrollHeight <= 500) {
                this.style.height = this.scrollHeight + 'px';
                let panelContainer = document.getElementById('panel_container');
                panelContainer.style.height = 'auto';
                panelContainer.style.height = (this.scrollHeight + 20) + 'px'; // Thêm khoảng cách bên dưới
            } else {
                this.style.height = '500px'; // Đặt chiều cao tối đa là 500px
                let panelContainer = document.getElementById('panel_container');
                panelContainer.style.height = '520px'; // Đặt chiều cao tối đa cho container
            }
        } else {
            // Reset lại chiều cao về mặc định nếu không tràn
            this.style.height = '47px';
            let panelContainer = document.getElementById('panel_container');
            panelContainer.style.height = '70px';
        }
    });


    loadChatHistory();
    $('#response').scrollTop($('#response')[0].scrollHeight);
    $('#user_input').focus();

    $('#user_input').css('height', '47px');
    $('#panel_container').css('height', '70px');

    $('#user_input').keydown(function (event) {
        if (event.shiftKey && event.which === 13) {
            $('#user_input').css({
                'white-space': 'pre-wrap',  // Cho phép xuống dòng tự động khi tràn
                'overflow-wrap': 'break-word'  // Chia nhỏ từ khi tràn
            });
            $('#user_input').scrollTop($('#user_input')[0].scrollHeight);
        } else if (event.which === 13) {
            $('#send').click();
        }
    });

    $('#add_file_button').click(function () {
        const imageFile = $('#file_input')[0].files[0];

        // Kiểm tra nếu không có file nào được chọn
        if (imageFile) {
            console.log("Đang có hình ảnh:", imageFile.name); // Hiển thị tên hình ảnh
        } else {
            $('#file_input').click(); // Nếu không có hình ảnh, kích hoạt input để người dùng chọn hình ảnh
        }
    });

    $('#file_input').change(function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const imgSrc = event.target.result;

                // Set image source in modal and show modal
                $('#modal_img_preview img').attr('src', imgSrc);
                $('#modal_img_preview').css({
                    'top': $('#add_file_button').offset().top - 200,  // Đặt modal ở trên button
                    'left': $('#add_file_button').offset().left,     // Căn trái
                    'width': 'auto',
                    'height': 'auto',
                    'max-width': '250px', // Đặt kích thước modal cố định
                    'max-height': '250px',
                    'outline:': 'none'

                });
                $('#modal_img_preview').fadeIn(); // Hiển thị modal
            };
            reader.readAsDataURL(file);
        }
    });

    // Kéo di chuyển modal
    $('#modal_img_preview').mousedown(function (e) {
        var modal = $(this);
        var offsetX = e.clientX - modal.offset().left;
        var offsetY = e.clientY - modal.offset().top;

        $(document).mousemove(function (e) {
            modal.css({
                left: e.clientX - offsetX,
                top: e.clientY - offsetY
            });
        });

        $(document).mouseup(function () {
            $(document).off('mousemove');
            $(document).off('mouseup');
        });
    });

    $('#modal_img_preview .close').click(function () {
        $('#modal_img_preview').fadeOut(); // Ẩn modal
        $('#file_input').val('');
    });


    $('#new-chat-withdataset').click(function () {
        $('#modalIframe').attr('src', 'http://127.0.0.1:7860/');
        $('#exampleModal').modal('show');
    });

    function clear_val(userInput, imageFile) {
        $('#user_input').val(userInput);
        // Reset lại chiều cao

        let currentInput = userInput;
        let interval = setInterval(function () {
            if (currentInput.length > 0 || imageFile) {
                currentInput = ''; // Xóa hết ký tự
                $('#user_input').val(currentInput);
                $('#file_input').val(currentInput); // Reset file input
                $('#modal_img_preview').fadeOut(); // Ẩn modal hình ảnh
                $('#user_input').css('height', '47px');
                $('#panel_container').css('height', '70px');
            } else {
                clearInterval(interval);
            }
        }, 50); // Mỗi 50ms xóa một ký tự

        $('#response').scrollTop($('#response')[0].scrollHeight);
        $('#user_input').focus();
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

    $('#send').click(function () {
        if (isSending) {
            if (currentFetchController) {
                currentFetchController.abort();  // Hủy yêu cầu fetch hiện tại
            }
            isSending = false;  // Cập nhật trạng thái không còn đang gửi
            document.getElementById("send").classList.remove("sending");  // Cập nhật nút
            document.getElementById("send-icon").src = "../static/img/send.png";  // Khôi phục icon ban đầu
            return;
        }

        // Đặt trạng thái gửi và thay đổi giao diện
        isSending = true;
        document.getElementById("send").classList.add("sending");
        document.getElementById("send-icon").src = "../static/img/square.png";

        const userInput = $('#user_input').val().trim();
        const imageFile = $('#file_input')[0].files[0]; // Lấy file ảnh từ input

        if (check_tucam(userInput)) {
            appendMessage(userInput, "user");
            // Nội dung iframe để hiển thị trong phản hồi AI
            const iframeContent = `
                <iframe width="955" height="1698" src="https://www.youtube.com/embed/ogq6a_7nk2Y?autoplay=1&controls=0&rel=0" title="Trần Dần chửi thề c.c nói chuyện vô văn hoá" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
            `;

            // Debug: Kiểm tra xem iframe có được tạo đúng không
            console.log("Iframe Content: ", iframeContent);

            // Sử dụng appendMessage để thêm iframe vào phần phản hồi AI
            appendMessage(iframeContent, "ai");
            clear_val(userInput, imageFile);
            // Cập nhật trạng thái và giao diện nút gửi
            isSending = false;
            document.getElementById("send").classList.remove("sending");
            document.getElementById("send-icon").src = "../static/img/send.png";
            return;
        }


        clear_val(userInput, imageFile);
        let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];
        if (userInput === "/new") {
            $.ajax({
                url: '/chat/newchat',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    group_name: "newchat",
                    description: "Tôi đặt tên cho bạn là Liễu Như Yên, tôi đặt cho bạn giới tính là Nữ, tôi đặt tuổi cho bạn là 23, bạn trả lời một cách đáng yêu" // Mô tả mặc định
                }),
                success: function (response) {
                    console.log(response);
                    location.reload();
                },
                error: function (error) {
                    console.error('Có lỗi xảy ra:', error);
                },
                complete: function () {
                    isSending = false;  // Cập nhật trạng thái sau khi hoàn tất
                }
            });
        }
        // Kiểm tra nếu userInput bắt đầu với "/new" và có phần mô tả
        else if (userInput.startsWith("/new")) {
            const description = userInput.slice(5).trim();
            if (description) {
                $.ajax({
                    url: '/chat/newchat',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        group_name: "newchat", // Tên nhóm trò chuyện
                        description: description // Mô tả nhóm từ người dùng
                    }),
                    success: function (response) {
                        console.log(response);
                        location.reload();
                    },
                    error: function (error) {
                        console.error('Có lỗi xảy ra:', error);
                    },
                    complete: function () {
                        isSending = false;  // Cập nhật trạng thái sau khi hoàn tất
                    }
                });
            } else {
                console.error("Mô tả nhóm không hợp lệ");
            }
        }
        else {
            if (userInput || imageFile) {
                const formattedUserInput = formatAndEscapeMessage4User(userInput);
                appendMessage(formattedUserInput, "user");

                // Save the user input into the conversation history
                conversationHistory.push({ sender: 'user', message: formattedUserInput });

                // Save the updated conversation history to localStorage
                localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

                if (imageFile) {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        const imgSrc = event.target.result;
                        appendMessage(imgSrc, "user");

                        const formData = new FormData();
                        formData.append('image_file', imageFile);
                        formData.append('prompt', userInput);

                        currentFetchController = new AbortController();  // Tạo AbortController mới cho mỗi yêu cầu
                        fetch('/chat/send-image', {
                            method: 'POST',
                            body: formData,
                            signal: currentFetchController.signal  // Thêm signal vào fetch để hỗ trợ hủy
                        })
                            .then(response => response.json())
                            .then(data => {
                                handleResponse(data);
                            })
                            .catch(error => {
                                if (error.name === 'AbortError') {
                                    console.log('Yêu cầu đã bị hủy');
                                } else {
                                    console.error('Error sending image and prompt:', error);
                                    alert('Error sending image and prompt');
                                }
                            })
                            .finally(() => {
                                isSending = false;
                            });
                    };
                    reader.readAsDataURL(imageFile);
                } else {
                    // Kiểm tra nếu userInput chứa từ khóa
                    if (containsKeyword(userInput)) {
                        var settings = {
                            "url": "https://google.serper.dev/search",
                            "method": "POST",
                            "timeout": 0,
                            "headers": {
                                "X-API-KEY": "fece0945a251708eb4858da7303a24ba2c4b73eb",
                                "Content-Type": "application/json"
                            },
                            "data": JSON.stringify({
                                "q": userInput,  // Sử dụng userInput trực tiếp
                                "gl": "vn", // Khu vực VN
                                "num": 2
                            }),
                        };

                        // Thực hiện yêu cầu tìm kiếm
                        $.ajax(settings).done(function (response) {
                            // Extract các link tìm được từ kết quả trả về
                            let links = [];
                            if (response && response.organic) {
                                links = response.organic.map(item => item.link);
                            }

                            currentFetchController = new AbortController();
                            $.ajax({
                                type: "POST",
                                url: "/chat/send",
                                contentType: "application/json",
                                data: JSON.stringify({ user_input: userInput }),
                                signal: currentFetchController.signal,
                                success: function (data) {
                                    // Xử lý phản hồi AI với các liên kết
                                    handleResponse(data, links); // Gọi handleResponse với các liên kết tìm được

                                    // Lưu AI response và links vào conversation history
                                    let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];

                                    // Đảm bảo responseMessage đã được cập nhật
                                    let aiResponse = data.response || '';
                                    if (links && links.length > 0) {
                                        // Thêm các liên kết vào aiResponse nếu có
                                        aiResponse += '\n' + links + '\n';
                                    }

                                    // Lưu phản hồi AI vào history
                                    conversationHistory.push({ sender: 'ai', message: aiResponse });

                                    // Lưu updated conversation history vào localStorage
                                    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

                                    // Lưu conversation history vào DB
                                    saveConversationHistoryToDB(conversationHistory);
                                },
                                error: function (xhr) {
                                    handleResponse({ response: xhr.responseJSON.error + '' }, []);
                                },
                                complete: function () {
                                    isSending = false;
                                }
                            });
                        }).fail(function () {
                            console.error('Tìm kiếm thất bại.');
                        });
                    }
                    else {
                        currentFetchController = new AbortController();
                        $.ajax({
                            type: "POST",
                            url: "/chat/send",
                            contentType: "application/json",
                            data: JSON.stringify({ user_input: userInput }),
                            signal: currentFetchController.signal,
                            success: function (data) {
                                handleResponse(data);

                                // Lấy phản hồi AI từ dữ liệu và lưu vào conversation history
                                let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];
                                conversationHistory.push({ sender: 'ai', message: data.response });  // data.response là nội dung phản hồi AI

                                // Lưu updated conversation history vào localStorage
                                localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

                                // Lưu conversation history vào DB
                                saveConversationHistoryToDB(conversationHistory);
                            },
                            error: function (xhr) {
                                handleResponse({ response: xhr.responseJSON.error + '' });
                            },
                            complete: function () {
                                isSending = false;
                            }
                        });
                    }
                }
            }
        }
    });

    // Handle AI response
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


    function formatAndEscapeMessage4User(message) {
        // Áp dụng định dạng (bold, italic, link)
        const formattedMessage = message
            .replace(/\*\*(.*?)\*\*/g, '<b style="color: #ce2479;">$1</b>') // Bold
            .replace(/__(.*?)__/g, '<i>$1</i>') // Italic
            .replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>') // Link (chỉ chấp nhận URL bắt đầu với http/https)
            .replace(/\n/g, '<br>'); // Giữ lại xuống dòng

        return formattedMessage;
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

});
