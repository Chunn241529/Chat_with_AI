$('#appBar').mousedown(function (e) {
    e.preventDefault(); // Ngăn chặn hành vi mặc định

    var modal = $('#theApp');
    var startX = e.pageX;
    var startY = e.pageY;

    // Lưu tọa độ ban đầu của #theApp
    var initialLeft = modal.offset().left;
    var initialTop = modal.offset().top;

    // Tính offset giữa vị trí nhấn và mép của #theApp
    var offsetX = startX - initialLeft;
    var offsetY = startY - initialTop;

    // Tắt sự kiện chuột trên iframe trong khi kéo
    $('#appWindowIframe').css('pointer-events', 'none');

    // Bắt đầu di chuyển khi chuột di chuyển
    $(document).mousemove(function (e) {
        var newLeft = e.pageX - offsetX;
        var newTop = e.pageY - offsetY;

        // Cập nhật vị trí của #theApp
        modal.css({
            left: newLeft,
            top: newTop,
            position: 'absolute' // Hoặc 'fixed' nếu bạn muốn cố định trên màn hình
        });
    });

    // Khi thả chuột, dừng việc di chuyển và khôi phục sự kiện chuột trên iframe
    $(document).mouseup(function () {
        $(document).off('mousemove');
        $(document).off('mouseup');
        $('#appWindowIframe').css('pointer-events', 'auto');
    });
});