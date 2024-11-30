const micButton = document.getElementById('micButton');
const userInput = document.getElementById('user_input');
const sendButton = document.getElementById('send');
const fileButton = document.getElementById('add_file_button');
const microButton = document.getElementById('micButton')
const panelContainer = document.getElementById('panel_container');

let isListening = false;
let recognition;

micButton.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

function startListening() {
    micButton.classList.add('active');
    micButton.innerHTML = `
        <svg
            data-name="Layer 1"
            height="200"
            id="Layer_1"
            viewBox="0 0 200 200"
            width="200"
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
    `;  // Thay đổi thành icon stop
    isListening = true;

    // Ẩn phần tử user_input khi bắt đầu nhận diện giọng nói
    userInput.style.display = 'none';
    sendButton.style.display = 'none';


    panelContainer.style.background = 'var(--chat-panel-background)';
    panelContainer.style.borderRadius = '40px';
    panelContainer.style.padding = '0';
    panelContainer.style.height = '80px';
    panelContainer.style.margin = '0.5em auto';
    panelContainer.style.width = 'auto';
    panelContainer.style.display = 'flex';
    panelContainer.style.alignItems = 'center';
    panelContainer.style.transition = 'width 0.3s ease';

    microButton.style.background = 'var(--chat-send-button-background)';

    // Chuyển sang chế độ nhận diện giọng nói
    userInput.placeholder = ''; // Xóa placeholder

    // Khởi động nhận diện giọng nói
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join('');

        // Cập nhật nội dung vào textarea
        userInput.value = transcript;
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
            console.error('Không nhận được giọng nói.');
            alert('Không nhận được giọng nói. Hãy thử lại.');
        } else if (event.error === 'not-allowed') {
            console.error('Quyền truy cập micro bị từ chối.');
            alert('Bạn cần cho phép quyền truy cập micro.');
        } else {
            console.error('Lỗi:', event.error);
        }
        stopListening();
    };

    recognition.start();
}

function stopListening() {
    micButton.classList.remove('active');
    micButton.innerHTML = `
        <svg
            data-name="Layer 1"
            height="200"
            id="Layer_1"
            viewBox="0 0 200 200"
            width="200"
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
    isListening = false;

    if (recognition) {
        recognition.stop();
        recognition = null;
    }

    // Hiển thị lại phần tử user_input khi dừng nhận diện giọng nói
    userInput.style.display = 'flex';
    sendButton.style.display = 'flex';
    fileButton.style.display = 'flex';

    // Đảm bảo phần tử #panel_container có thể nhận được focus và kích hoạt lại :focus-within


    // Thêm thuộc tính tabindex để đảm bảo phần tử có thể nhận focus
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

    microButton.style.background = 'transparent'

    // Đảm bảo phần tử nhận focus và kích hoạt lại :focus-within
    panelContainer.focus(); // Kích hoạt focus sau khi dừng micro

    // Chuyển lại chế độ nhập văn bản
    userInput.placeholder = 'Nhập tin nhắn...';
}


