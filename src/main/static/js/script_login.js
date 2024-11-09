document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const output1 = document.getElementById('output1');
    const output2 = document.getElementById('output2');
    const input = document.getElementById('input');
    const input1 = document.getElementById('input1');
    const prompt = document.getElementById('prompt');
    const prompt1 = document.getElementById('prompt1');

    // Lấy thời gian hiện tại và định dạng nó
    const getCurrentTime = () => {
        const now = new Date();
        const options = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
        return now.toLocaleString('vi-VN', options);
    };

    let step = 0;
    let username = '';
    let password = '';

    const commands = [
        ".____                 .__        ",
        "|    |    ____   ____ |__| ____  ",
        "|    |   /  _ \\ / ___\\|  |/    \\ ",
        "|    |__(  <_> ) /_/  >  |   |  \\",
        "|_______ \\____/\\___  /|__|___|  /",
        "        \\/    /_____/         \\/ ",
        " ",
        "<  " + getCurrentTime() + " | " + "chưa có tài khoản? -> nhập /dangky\n",
    ];

    function displayOutput1(text) {
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                output1.textContent += text.charAt(i);
                i++;
                output1.scrollTop = output1.scrollHeight; // Cuộn xuống dưới cùng
            } else {
                clearInterval(interval); // Dừng khi hoàn thành
                output1.textContent += '\n'; // Thêm xuống dòng mới
            }
        }, 0); // Thay đổi giá trị này để điều chỉnh tốc độ
    }

    function displayOutput(text) {
        output.textContent += text + '\n';
        output.scrollTop = output.scrollHeight; // Cuộn xuống dưới cùng
    }

    function displayOutput2(text) {
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                output2.textContent += text.charAt(i);
                i++;
                output2.scrollTop = output2.scrollHeight; // Cuộn xuống dưới cùng
            } else {
                clearInterval(interval); // Dừng khi hoàn thành
                output2.textContent += '\n'; // Thêm xuống dòng mới
            }
        }, 20); // Thay đổi giá trị này để điều chỉnh tốc độ
    }

    function displayPrompt(text, promptElement) {
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                promptElement.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(interval); // Dừng khi hoàn thành
            }
        }, 30); // Thay đổi giá trị này để điều chỉnh tốc độ
    }

    // Hiển thị tất cả các dòng lệnh ngay khi tải lên
    commands.forEach(command => displayOutput(command));

    // Thiết lập prompt cho việc nhập username
    displayPrompt('> { chatwithAI ➔ đăng nhập ➔ nhập tài khoản }: ', prompt);

    function handleInput(stepIndex) {
        const value = input.value.trim();
        const value1 = input1.value.trim();

        // Kiểm tra xem người dùng có nhập "/register" không
        if (value === '/dangky' || value1 === '/dangky') {
            window.location.href = '/auth/register'; // Chuyển hướng đến trang đăng ký
            return; // Dừng thực hiện tiếp
        }

        // Xóa giá trị input sau khi nhận
        if (stepIndex === 0) {
            username = value; // Lưu username
            displayOutput1(`username -> ${username}`);
            prompt1.textContent = ''; // Reset nội dung prompt1
            displayPrompt('> { chatwithAI ➔ đăng nhập ➔ mật khẩu }: ', prompt1);
            input.value = ''; // Reset input username
            input1.focus(); // Chuyển focus sang input password
            step++;
        } else if (stepIndex === 1) {
            password = value1; // Lưu password
            // Gửi yêu cầu đăng nhập
            fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            })
                .then(response => {
                    if (response.ok) {
                        displayOutput2("Đăng nhập thành công, chuyển tới trang chính...");
                        setTimeout(function () {
                            window.location.href = "/auth/home";
                        }, 2000);
                    } else {
                        return response.json().then(data => {
                            // Hiển thị thông điệp lỗi từ server
                            displayOutput2(`Lỗi: ${data.error || "Đã xảy ra lỗi."}`);
                            setTimeout(function () {
                                window.location.href = "/auth/login";
                            }, 2000);
                        });
                    }
                })
                .catch(error => {
                    displayOutput2(`Lỗi kết nối: ${error.message}`);
                });

            // Xóa giá trị input password sau khi nhận
            input1.value = '';
            input1.blur(); // Bỏ focus khỏi input password
        }
    }



    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleInput(0);
        }
    });

    input1.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleInput(1);
        }
    });
});
