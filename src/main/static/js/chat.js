import { module_chat } from './modules/module_chat.js';
import { module_users } from './modules/module_profile.js';

document.addEventListener('DOMContentLoaded', () => {
    module_users.getUser();  // Gọi hàm lấy thông tin user
    let isSending = false;  // Biến trạng thái đang gửi
    let currentFetchController = null;  // Bộ điều khiển để hủy yêu cầu fetch hiện tại

    // Mỗi 100ms sẽ cập nhật lại placeholder
    setInterval(module_chat.animatePlaceholder, 100);

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


    module_chat.loadChatHistory();

    $('#response').scrollTop($('#response')[0].scrollHeight);
    $('#user_input').focus();

    $('#user_input').css('height', '47px');
    $('#panel_container').css('height', '70px');

    $('#user_input').keydown(function (event) {
        // Kiểm tra khi nhấn Shift + Enter
        if (event.shiftKey && event.which === 13) {
            $('#user_input').css({
                'white-space': 'pre-wrap',  // Cho phép xuống dòng tự động khi tràn
                'overflow-wrap': 'break-word'  // Chia nhỏ từ khi tràn
            });
            $('#user_input').scrollTop($('#user_input')[0].scrollHeight);  // Tự động cuộn xuống
            return;  // Dừng lại ở đây, không làm gì thêm
        }

        // Kiểm tra khi nhấn Enter (chỉ Enter, không có Shift)
        if (event.which === 13 && !event.shiftKey) {
            event.preventDefault();  // Ngăn chặn hành động mặc định (xuống dòng)

            // Loại bỏ ký tự xuống dòng
            let inputValue = $(this).val().replace(/[\n\r]+/g, '');
            $(this).val(inputValue);  // Cập nhật lại giá trị input

            // Gọi nút gửi (hoặc gọi hàm gửi của bạn)
            $('#send').click();  // Hoặc gọi logic gửi của bạn ở đây
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

        // Kiểm tra từ cấm
        if (module_chat.check_tucam(userInput)) {
            module_chat.appendMessage(userInput, "user");

            // Nội dung iframe để hiển thị trong phản hồi AI
            const iframeContent = `
        <iframe width="955" height="1698" src="https://www.youtube.com/embed/ogq6a_7nk2Y?autoplay=1&controls=0&rel=0" title="Trần Dần chửi thề c.c nói chuyện vô văn hoá" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    `;

            console.log("Iframe Content: ", iframeContent);

            // Sử dụng appendMessage để thêm iframe vào phần phản hồi AI
            module_chat.appendMessage(iframeContent, "ai");
            module_chat.clear_val(userInput, imageFile, true);

            // Cập nhật trạng thái và giao diện nút gửi
            isSending = false;
            document.getElementById("send").classList.remove("sending");
            document.getElementById("send-icon").src = "../static/img/send.png";

            // Kiểm tra và lưu số lần nhập từ cấm
            let bannedCount = localStorage.getItem("bannedCount");
            bannedCount = bannedCount ? parseInt(bannedCount) : 0;

            if (bannedCount >= 3) {
                // Đã nhập quá 3 lần, tiến hành ban user
                setTimeout(() => {
                    module_users.banUser(); // Thực hiện ban user sau 7 giây
                }, 7000);
            } else {
                // Tăng số lần nhập từ cấm
                bannedCount += 1;
                localStorage.setItem("bannedCount", bannedCount); // Lưu lại số lần
            }

            return;
        }


        module_chat.clear_val(userInput, imageFile, true)

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
        else if (userInput.startsWith("/takenote")) {
            const noidungbai = userInput.slice(9).trim();
            // Lưu phản hồi vào conversation history
            let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];
            const formattedUserInput = module_chat.formatAndEscapeMessage4User(userInput);
            const formattedAiInput = module_chat.formatAndEscapeMessage4User("Dạ, đã lưu bài ghi");
            module_chat.appendMessage(formattedUserInput, "user");

            if (noidungbai) {
                isSending = false;  // Cập nhật trạng thái không còn đang gửi
                document.getElementById("send").classList.remove("sending");  // Cập nhật nút
                document.getElementById("send-icon").src = "../static/img/send.png";  // Khôi phục icon ban đầu
                module_chat.englishPattern(noidungbai);
                module_chat.appendMessage(formattedAiInput, "ai");
                conversationHistory.push({ sender: 'user', message: formattedUserInput });
                conversationHistory.push({ sender: 'ai', message: formattedAiInput });
                console.log("Conversation History After Push:", conversationHistory);  // Debug

                // Lưu lại vào localStorage
                localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
                console.log("Conversation History Saved to LocalStorage:", JSON.parse(localStorage.getItem('conversationHistory')));  // Debug

                // Lưu vào DB (kiểm tra chức năng này)
                module_chat.saveConversationHistoryToDB(conversationHistory);

            } else {
                console.error("Nội dung bài ghi ko hợp lệ");
            }
        }
        else if (userInput.startsWith("/createtopic")) {
            const noidungbai = userInput.slice(9).trim();
            // Lưu phản hồi vào conversation history
            let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];
            const formattedUserInput = module_chat.formatAndEscapeMessage4User(userInput);
            const formattedAiInput = module_chat.formatAndEscapeMessage4User("Dạ, đã tạo topic mới");
            module_chat.appendMessage(formattedUserInput, "user");

            if (noidungbai) {
                isSending = false;  // Cập nhật trạng thái không còn đang gửi
                document.getElementById("send").classList.remove("sending");  // Cập nhật nút
                document.getElementById("send-icon").src = "../static/img/send.png";  // Khôi phục icon ban đầu
                module_chat.createTopic(noidungbai);
                module_chat.appendMessage(formattedAiInput, "ai");
                conversationHistory.push({ sender: 'user', message: formattedUserInput });
                conversationHistory.push({ sender: 'ai', message: formattedAiInput });
                console.log("Conversation History After Push:", conversationHistory);  // Debug

                // Lưu lại vào localStorage
                localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
                console.log("Conversation History Saved to LocalStorage:", JSON.parse(localStorage.getItem('conversationHistory')));  // Debug

                // Lưu vào DB (kiểm tra chức năng này)
                module_chat.saveConversationHistoryToDB(conversationHistory);
            } else {
                console.error("Nội dung bài ghi ko hợp lệ");
            }
        }
        else if (userInput.startsWith("/read")) {
            // Tách lệnh đọc và ngôn ngữ ra
            const parts = userInput.slice(5).trim().split(" ");  // Tách chuỗi sau "/read" theo dấu cách
            const lang = parts[0];  // Ngôn ngữ sẽ là phần đầu tiên
            const noidungbai = parts.slice(1).join(" ");  // Ghép tất cả phần còn lại thành nội dung bài đọc

            // Kiểm tra xem có đủ thông tin không
            if (lang && noidungbai) {
                let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];
                const formattedUserInput = module_chat.formatAndEscapeMessage4User(userInput);
                const formattedAiInput = module_chat.formatAndEscapeMessage4User(`Dạ, em sẽ đọc bằng giọng ${lang.toUpperCase()}: "${noidungbai}"`);

                // Cập nhật giao diện người dùng
                module_chat.appendMessage(formattedUserInput, "user");
                module_chat.appendMessage(formattedAiInput, "ai");

                isSending = false;
                document.getElementById("send").classList.remove("sending");
                document.getElementById("send-icon").src = "../static/img/send.png";

                // Gọi API đọc tiếng Anh hoặc tiếng Việt
                module_chat.readEnglish(lang, noidungbai);

                // Lưu lịch sử trò chuyện vào localStorage
                conversationHistory.push({ sender: 'user', message: formattedUserInput });
                conversationHistory.push({ sender: 'ai', message: formattedAiInput });
                console.log("Conversation History After Push:", conversationHistory);  // Debug

                localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
                console.log("Conversation History Saved to LocalStorage:", JSON.parse(localStorage.getItem('conversationHistory')));  // Debug

                // Lưu vào DB (kiểm tra chức năng này)
                module_chat.saveConversationHistoryToDB(conversationHistory);
            } else {
                console.error("Lệnh không hợp lệ. Định dạng: /read {lang} {nội dung đọc}");
            }
        }
        else {
            if (userInput || imageFile) {
                const formattedUserInput = module_chat.formatAndEscapeMessage4User(userInput);
                module_chat.appendMessage(formattedUserInput, "user");

                // Save the user input into the conversation history
                conversationHistory.push({ sender: 'user', message: formattedUserInput });

                // Save the updated conversation history to localStorage
                localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

                if (imageFile) {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        const imgSrc = event.target.result;
                        module_chat.appendMessage(imgSrc, "user");

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
                                module_chat.handleResponse((data));
                                // module_chat.englishPattern(data);
                                // console.log(data)
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
                    if (module_chat.containsKeyword(userInput)) {
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
                                    module_chat.handleResponse(data, links); // Gọi handleResponse với các liên kết tìm được

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
                                    module_chat.saveConversationHistoryToDB(conversationHistory);
                                },
                                error: function (xhr) {
                                    module_chat.handleResponse({ response: xhr.responseJSON.error + '' }, []);
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
                            signal: currentFetchController.signal,  // Đảm bảo fetchController được sử dụng đúng.
                            success: function (data) {
                                // Kiểm tra phản hồi và xử lý nó
                                module_chat.handleResponse(data);

                                // Kiểm tra nếu response có dữ liệu hợp lệ (giả sử là 'data.response')
                                if (data && data.response) {
                                    // Trích xuất thông tin từ phản hồi AI
                                    const aiResponse = data.response;
                                    // Lưu phản hồi vào conversation history
                                    let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];
                                    conversationHistory.push({ sender: 'ai', message: aiResponse });
                                    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
                                    module_chat.saveConversationHistoryToDB(conversationHistory);

                                    console.log(aiResponse);
                                } else {
                                    console.error('Không có phản hồi hợp lệ từ AI');
                                }
                            },
                            error: function (xhr) {
                                // Nếu có lỗi, xử lý và hiển thị thông báo
                                module_chat.handleResponse({ response: xhr.responseJSON.error + '' });
                            },
                            complete: function () {
                                // Cập nhật trạng thái khi hoàn thành
                                isSending = false;
                            }
                        });

                    }
                }
            }
        }
        module_chat.clear_val(userInput, imageFile, false);
    });
});
