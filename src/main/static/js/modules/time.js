$(document).ready(function () {
    setTime();
});
function setTime() {
    // Danh sách ngày và tháng bằng tiếng Việt
    var dayList = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    var monthList = ["tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6", "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"];

    var now = new Date();
    var hour = now.getHours();

    // Chuyển đổi giờ theo định dạng 12 giờ
    if (hour > 12) {
        hour -= 12;
    } else if (hour == 0) {
        hour = 12;
    }

    // Định dạng giờ và phút
    var time = hour + ":" + checkZero(now.getMinutes());

    // Định dạng ngày và tháng
    var date = dayList[now.getDay()] + ", " + "ngày " + now.getDate() + ", " + monthList[now.getMonth()] + " ";

    // Cập nhật ngày trong phần tử `.bottom .container .calender p`
    $(".bottom .container .calender p").text(dayList[now.getDay()]);

    // Cập nhật ngày tháng trong phần tử `.bottom .container .calender h1`
    $(".bottom .container .calender h1").text(now.getDate());

    // Cập nhật thời gian trong phần tử `.main .left .time h1`
    $(".main .left .time h1").text(time);

    // Cập nhật ngày tháng trong phần tử `.main .left .time p`
    $(".main .left .time p").text(date);

    // Cập nhật lại mỗi giây
    setTimeout(setTime, 1000);
}

// Hàm kiểm tra thêm số 0 nếu phút < 10
function checkZero(time) {
    if (time < 10) {
        return "0" + time;
    } else {
        return time;
    }
}
