

const micButton = document.getElementById('micButton');
const userInput = document.getElementById('user_input');
const sendButton = document.getElementById('send');
const fileButton = document.getElementById('add_file_button');
const panelContainer = document.getElementById('panel_container');
const stopButton = document.getElementById('stop_speech');

let isListening = false;
let recognition;

micButton.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

const micButtonSvg_white = `
        <svg
            data-name="Layer 1"
            id="Layer_1"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            style="transform: scale(3)"
        >
            <title />
            <path
                fill="white"
                d="M99.52,150a50.15,50.15,0,0,0,50-50V65a50,50,0,0,0-100,0v35A50.15,50.15,0,0,0,99.52,150Zm-30-85a30,30,0,0,1,60,0v35a30,30,0,0,1-60,0Z"
            />
            <path
                fill="white"
                d="M109.52,77.5a10,10,0,0,0,10-10V60a10,10,0,1,0-20,0v7.5A10,10,0,0,0,109.52,77.5Z"
            />
            <path
                fill="white"
                d="M168.52,126c-5-2-11,0-13,5a57,57,0,0,1-52,34H96a57,57,0,0,1-52-34,9.52,9.52,0,0,0-13-5,9.52,9.52,0,0,0-5,13c12,28,40,46,70.5,46H104a77.2,77.2,0,0,0,70.5-46C176,134,173.52,128,168.52,126Z"
            />
        </svg>
    `;

const micButtonSvg_black = `
        <svg
            data-name="Layer 1"
            id="Layer_1"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            style="transform: scale(3)"
        >
            <title />
            <path
                d="M99.52,150a50.15,50.15,0,0,0,50-50V65a50,50,0,0,0-100,0v35A50.15,50.15,0,0,0,99.52,150Zm-30-85a30,30,0,0,1,60,0v35a30,30,0,0,1-60,0Z"
            />
            <path
                d="M109.52,77.5a10,10,0,0,0,10-10V60a10,10,0,1,0-20,0v7.5A10,10,0,0,0,109.52,77.5Z"
            />
            <path
                d="M168.52,126c-5-2-11,0-13,5a57,57,0,0,1-52,34H96a57,57,0,0,1-52-34,9.52,9.52,0,0,0-13-5,9.52,9.52,0,0,0-5,13c12,28,40,46,70.5,46H104a77.2,77.2,0,0,0,70.5-46C176,134,173.52,128,168.52,126Z"
            />
        </svg>
    `;

function micButtonAnimation(state = true) {
    if (state) {
        micButton.innerHTML = micButtonSvg_white;
        micButton.style.background = 'var(--chat-send-button-background)'
        micButton.style.transform = 'scale(1.2)';
    } else {
        micButton.innerHTML = micButtonSvg_black;
        micButton.style.transform = 'scale(1)';
        micButton.style.background = 'transparent'
    }
}

function startListening() {
    micButton.innerHTML = micButtonSvg_black;

    isListening = true;
    userInput.style.display = 'none';
    sendButton.style.display = 'none';
    fileButton.style.display = 'none';
    stopButton.style.display = 'flex'
    panelContainer.style.width = 'auto';

    micButton.style.background = 'transparent';

    userInput.placeholder = ''; // Xóa placeholder

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'vi-VN'; // Bắt đầu với tiếng Việt
    recognition.continuous = true;

    let timeout;

    const resetTimeout = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            console.warn('Không có giọng nói trong 3 giây.');

            // Kiểm tra nếu có nội dung trong userInput
            const userInputContent = userInput.value.trim();
            if (userInputContent) {
                console.log('Tự động gửi nội dung sau khi không có giọng nói.');
                $('#send').click(); // Gửi nội dung tự động
                recognition.stop();
            }

            micButtonAnimation(false); // Thu nhỏ nút microphone
        }, 3000);
    };

    const start = () => {
        // Phóng to nút microphone khi có giọng nói
        micButtonAnimation(true);
        recognition.start();
    };

    recognition.onspeechstart = () => {
        // Phóng to nút microphone ngay khi nhận diện giọng nói bắt đầu
        start();
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join('');

        userInput.value = transcript;
        resetTimeout(); // Reset lại thời gian nếu có giọng nói
        triggerEffect();
    };

    recognition.onspeechend = () => {
        // Thu nhỏ nút microphone khi kết thúc giọng nói
        micButtonAnimation(false);
        console.log('Speech ended');
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
            console.error('Không nhận được giọng nói.');
        } else {
            console.error('Lỗi:', event.error);
        }
    };

    recognition.onend = () => {
        resetTimeout();
        userInput.value = ''; // Xóa nội dung trong input
        recognition.start(); // Tiếp tục nhận diện giọng nói
    };

    start();
}


function stopListening() {
    micButtonAnimation(false);
    micButton.classList.remove('active');
    micButton.innerHTML = micButtonSvg_black
    isListening = false;

    if (recognition) {
        recognition.stop();
        recognition = null;
    }

    // Hiển thị lại phần tử user_input khi dừng nhận diện giọng nói
    userInput.style.display = 'flex';
    sendButton.style.display = 'flex';
    fileButton.style.display = 'flex';
    stopButton.style.display = 'none'
    micButton.style.display = 'none'

    panelContainer.setAttribute('tabindex', '0');

    // Đè lại toàn bộ CSS vào phần tử
    panelContainer.style.background = 'var(--chat-panel-background)';
    panelContainer.style.borderRadius = '40px';
    panelContainer.style.padding = '0';
    panelContainer.style.height = '80px';
    panelContainer.style.margin = '0.5em auto';
    panelContainer.style.width = '30%';  // Đặt lại width ban đầu
    panelContainer.style.display = 'flex';
    panelContainer.style.alignItems = 'center';
    panelContainer.style.transition = 'width 0.3s ease';

    micButton.style.background = 'transparent'
    reloadPage();
}

function reloadPage() {
    location.reload();
}


$('#stop_speech').click(async function () {
    stopListening();
});