document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    const loginBtn = document.getElementById('loginBtn');
    const errorBox = document.getElementById('errorBox');
    const toggleButtons = document.querySelectorAll('.toggle-password');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault(); // منع أي سلوك افتراضي للزر
            
            // جلب الـ id الخاص بالحقل من خاصية data-target أو إيجاد الحقل المجاور
            const targetId = this.getAttribute('data-target');
            const input = targetId ? document.getElementById(targetId) : this.parentElement.querySelector('input');

            if (!input) return;

            const eyeOpen = this.querySelector('.eye-open');
            const eyeClosed = this.querySelector('.eye-closed');

            if (input.type === 'password') {
                input.type = 'text';
                if (eyeOpen) eyeOpen.style.display = 'none';
                if (eyeClosed) eyeClosed.style.display = 'block';
            } else {
                input.type = 'password';
                if (eyeOpen) eyeOpen.style.display = 'block';
                if (eyeClosed) eyeClosed.style.display = 'none';
            }
        });
    });
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function () {
            errorBox.style.display = 'none';

            loginBtn.disabled = true;
            loginBtn.textContent = 'جاري الدخول...';

            const loginValue = document.getElementById('loginField').value;
            const password = document.getElementById('password').value;

            // المحاولة الأولى: تسجيل دخول كعميل
           fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ login: loginValue, password: password }),
            })
                .then(async response => {
                    if (response.ok) {
                        const result = await response.json();
                        localStorage.setItem('auth_token', result.token);
                        window.location.href = '../homeline.html';
                        return null;
                    }

                    // الحساب موجود بس مو مفعّل: نعرض الرسالة مباشرة، ما نجرب إدمن
                    if (response.status === 403) {
                        const result = await response.json();
                        errorBox.textContent = result.message;
                        errorBox.style.display = 'block';
                        return null;
                    }

                    // فشل عادي (بيانات خاطئة): نجرب كإدمن
                    return tryAdminLogin(loginValue, password);
                })
                .catch(() => {
                    errorBox.textContent = 'حدث خطأ أثناء تسجيل الدخول.';
                    errorBox.style.display = 'block';
                })
                .finally(() => {
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'تسجيل الدخول';
                });
        });
    }

    function togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const eyeOpen = btn.querySelector('.eye-open');
        const eyeClosed = btn.querySelector('.eye-closed');

        if (input.type === 'password') {
            input.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
        } else {
            input.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
        }
    }

    function tryAdminLogin(username, password) {
        return fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ username: username, password: password }),
        })
            .then(async response => {
                if (response.ok) {
                    const result = await response.json();
                    localStorage.setItem('admin_auth_token', result.token);
                    window.location.href = '../admin/dashboard.html';
                    return;
                }

                // فشل كعميل وكإدمن معاً
                errorBox.textContent = 'بيانات الدخول غير صحيحة.';
                errorBox.style.display = 'block';
            });
    }
});