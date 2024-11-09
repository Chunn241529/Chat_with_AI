var counter = 1;
$(document).ready(function () {
    const mainContainer = document.querySelector('body');
    var erroEle = $('.error-message'),
        focusInput = $('.questions').find('.active');

    $('.navigation a').click(function () {
        nextMaster('navi');

        var thisInput = $('#' + $(this).attr('data-ref'));
        $('.active').removeClass('active');
        thisInput.focus().addClass('active')
        thisInput.closest('li').animate({
            marginTop: '0px',
            opacity: 1
        }, 200);
        thisInput.closest('li').prevAll('li').animate({
            marginTop: '-150px',
            opacity: 0
        }, 200)
        //                     .AddClass('done');

        thisInput.closest('li').nextAll('li').animate({
            marginTop: '150px',
            opacity: 0
        }, 200)
        //                    .RemoveClass('done');
        errorMessage(erroEle, '', 'hidden', 0);

    });

    if (focusInput.val() != '') {
        $('#next-page').css('opacity', 1);
    }

    $(document).keypress(function (event) {
        if (event.which == 13) {
            nextMaster('keypress');
            event.preventDefault();
        }

        $('#next-page').click(function () {
            var focusInput = $('.questions').find('.active');
            nextMaster('nextpage');

        })

    });

    function nextMaster(type) {
        var focusInput = $('.questions').find('.active');
        if (focusInput.val() != '') {
            if ((focusInput.attr('name') == 'name' || focusInput.attr('name') == 'username') && focusInput.val().length < 2) {
                errorMessage(erroEle, focusInput.attr('name') + " không được <=2 ký tự. ", 'visible', 1);
            } else if (focusInput.attr('name') == 'email' && !validateEmail(focusInput.val())) {
                errorMessage(erroEle, "Không đúng định dạng " + focusInput.attr('name'), 'visible', 1);
            } else if (focusInput.attr('name') == 'phone' && !validatePhone(focusInput.val())) {
                errorMessage(erroEle, "Không đúng định dạng " + focusInput.attr('name'), 'visible', 1);
            } else {
                if (focusInput.attr('name') == 'username' || focusInput.attr('name') == 'email') {
                    checkDuplicate(focusInput.attr('name'), focusInput.val(), function (isDuplicate) {
                        if (isDuplicate) {
                            errorMessage(erroEle, focusInput.attr('name') + " Đã tồn tại.", 'visible', 1);
                        } else {
                            if (type != 'navi') showLi(focusInput);
                            $('#next-page').css('opacity', 0);
                            errorMessage(erroEle, '', 'hidden', 0);
                        }
                    });
                } else {
                    if (type != 'navi') showLi(focusInput);
                    $('#next-page').css('opacity', 0);
                    errorMessage(erroEle, '', 'hidden', 0);
                }
            }
        } else if (type == 'keypress') {
            errorMessage(erroEle, 'please enter your ' + focusInput.attr('name'), 'visible', 1);
        }
    }


    $("input[type='text']").keyup(function (event) {
        var focusInput = $(this);
        if (focusInput.val().includes('/dangnhap')) {
            window.location.href = '/auth/login';
        }
        if (focusInput.val().length > 1) {
            if ((focusInput.attr('name') == 'email' && !validateEmail(focusInput.val())) ||
                (focusInput.attr('name') == 'phone' && !validatePhone(focusInput.val()))) {
                $('#next-page').css('opacity', 0);
            } else {
                $('#next-page').css('opacity', 1);
            }

        } else {
            $('#next-page').css('opacity', 0);
        }
    });

    $("#password").keyup(function (event) {
        var focusInput = $(this);
        $("#viewpswd").val(focusInput.val());
        if (focusInput.val().length > 1) {
            $('#next-page').css('opacity', 1);
        }
    });

    $('#signup').click(function () {
        // Lấy thông tin từ các input
        var name = $('#name').val();
        var username = $('#uname').val();
        var email = $('#email').val();
        var password = $('#password').val();
        var phone = $('#phone').val();
        var country_code = $('#country_code').val();

        // Gửi yêu cầu đăng ký tới API
        $.ajax({
            url: "/auth/register",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                name: name,
                username: username,
                email: email,
                password: password,
                phone: phone,
                country_code: country_code
            }),
            success: function (response) {
                // Sau khi đăng ký thành công, ẩn các phần tử và hiển thị thông báo
                $('.navigation').fadeOut(400, function () {
                    $(this).css('display', 'none');
                });
                $('#sign-form').fadeOut(400, function () {
                    $(this).css('display', 'none');
                });
                $('#signup').fadeOut(400, function () {
                    $(this).css('display', 'none');
                });
                $('#wf').text(response.message).animate({
                    opacity: 1,
                    marginTop: '1em'
                }, 500).css({
                    'display': 'block'
                });

                // Thêm redirect qua trang đăng nhập sau 2 giây
                setTimeout(function () {
                    mainContainer.classList.add('fade-out');
                    window.location.href = "/auth/login";
                }, 2000); // Thời gian chờ 2 giây
            },
            error: function (error) {
                // Xử lý lỗi
                errorMessage($('.error-message'), error.responseJSON.error, 'visible', 1);
            }
        });
    });


    $('#show-pwd').mousedown(function () {
        $(this).toggleClass('view').toggleClass('hide');
        $('#password').css('opacity', 0);
        $('#viewpswd').css('opacity', 1);
    }).mouseup(function () {
        $(this).toggleClass('view').toggleClass('hide');
        $('#password').css('opacity', 1);
        $('#viewpswd').css('opacity', 0);
    });

});

function checkDuplicate(field, value, callback) {
    $.ajax({
        url: "/auth/users",
        method: "GET",
        success: function (users) {
            var isDuplicate = users.some(function (user) {
                return user[field] === value;
            });
            callback(isDuplicate);
        },
        error: function () {
            errorMessage(erroEle, "Cannot check " + field + " at the moment.", 'visible', 1);
            callback(false);
        }
    });
}




function showLi(focusInput) {

    focusInput.closest('li').animate({
        marginTop: '-150px',
        opacity: 0
    }, 200);

    console.log(focusInput.closest('li'));

    if (focusInput.attr('id') == 'viewpswd') {
        $("[data-ref='" + focusInput.attr('id') + "']")
            .addClass('done').html('password');
        //                    .html(Array(focusInput.val().length+1).join("*"));
    } else {
        $("[data-ref='" + focusInput.attr('id') + "']").addClass('done').html(focusInput.val());
    }

    focusInput.removeClass('active');
    counter++;

    var nextli = focusInput.closest('li').next('li');

    nextli.animate({
        marginTop: '0px',
        opacity: 1
    }, 200);

    nextli.find('input').focus().addClass('active');

}

function errorMessage(textmeg, appendString, visib, opaci) {
    textmeg.css({
        visibility: visib
    }).animate({
        opacity: opaci
    }).html(appendString)
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validatePhone(phone) {
    var re = /\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/;
    return re.test(phone);
}