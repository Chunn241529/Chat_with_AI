
function openApp(url, appName, height, width) {
    const app = document.getElementById("theApp");
    var win = document.getElementById("appWindowIframe");
    win.src = url;

    // Thiết lập hiển thị, kích thước và độ trong suốt
    app.style.display = "block";
    app.style.height = height;
    app.style.width = width;
    localStorage.appHeight = height;
    localStorage.appWidth = width;

    setTimeout(() => {
        app.style.opacity = "1";
    }, 10);

    // Thiết lập tên ứng dụng
    document.querySelector("#theApp .bar .appName").textContent = appName;
}

var isAppFullScreen = -1;
function appFullScreen() {
    var app = document.getElementById("theApp");
    //var win = document.getElementById("appWindowIframe");
    if (isAppFullScreen == -1) {
        app.style.height = "100%";
        app.style.width = "100%";
        app.style.borderRadius = "0";
        app.style.borderWidth = "0";
    }
    if (isAppFullScreen == 1) {
        app.style.height = localStorage.appHeight;
        app.style.width = localStorage.appWidth;
        app.style.borderRadius = "10px";
        app.style.borderWidth = "0px";

    }
    isAppFullScreen *= -1;
}

function closeApp() {
    var win = document.getElementById("appWindowIframe");
    var app = document.getElementById("theApp");
    app.style.opacity = "0";
    setTimeout(() => {
        app.style.display = "none";
        // win.src = "./blank.html";
    }, 100);
    isAppFullScreen = -1;
    app.style.borderRadius = "10px";
    app.style.borderWidth = "0px";
}