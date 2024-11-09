document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const output1 = document.getElementById('output1');
    const output2 = document.getElementById('output2');
    const input = document.getElementById('input');
    const input1 = document.getElementById('input1');
    const prompt = document.getElementById('prompt');
    const prompt1 = document.getElementById('prompt1');
    const mainContainer = document.querySelector('body'); // Chọn toàn bộ trang hoặc phần chính để áp dụng hiệu ứng

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
        output1.textContent += text + '\n';
        output1.scrollTop = output1.scrollHeight;
    }

    function displayOutput(text) {
        output.textContent += text + '\n';
        output.scrollTop = output.scrollHeight;
    }

    function displayOutput2(text) {
        output2.textContent += text + '\n';
        output2.scrollTop = output2.scrollHeight;
    }

    function displayPrompt(text, promptElement) {
        promptElement.textContent = text;
    }

    commands.forEach(command => displayOutput(command));
    displayPrompt('> { chatwithAI ➔ đăng nhập ➔ nhập tài khoản }: ', prompt);

    function handleInput(stepIndex) {
        const value = input.value.trim();
        const value1 = input1.value.trim();

        if (value === '/dangky' || value1 === '/dangky') {
            window.location.href = '/auth/register';
            return;
        }

        if (stepIndex === 0) {
            username = value;
            displayOutput1(`username -> ${username}`);
            prompt1.textContent = '';
            displayPrompt('> { chatwithAI ➔ đăng nhập ➔ mật khẩu }: ', prompt1);
            input.value = '';
            input1.disabled = false;
            input1.focus();
            step++;
        } else if (stepIndex === 1) {
            password = value1;
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
                        // Kích hoạt chế độ toàn màn hình

                        // Thêm lớp fade-out để kích hoạt hiệu ứng
                        mainContainer.classList.add('fade-out');

                        // Đợi 1 giây cho hiệu ứng rồi chuyển hướng
                        setTimeout(() => {
                            window.location.href = "/auth/home";

                        }, 1000);
                    } else {
                        return response.json().then(data => {
                            displayOutput2(`${data.error || "Đã xảy ra lỗi."}`);
                            setTimeout(() => {
                                window.location.href = "/auth/login";
                            }, 2000);
                        });
                    }
                })
                .catch(error => {
                    displayOutput2(`Lỗi kết nối: ${error.message}`);
                });

            input1.value = '';
            input1.blur();
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

    // Chặn sự kiện Tab
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
        }
    });
});
