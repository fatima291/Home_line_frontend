const API_BASE_URL = 'http://127.0.0.1:8000/api';

const resetForm = document.getElementById('resetForm');
const passwordInput = document.getElementById('password');
const passwordConfirmationInput = document.getElementById('passwordConfirmation');
const resetBtn = document.getElementById('resetBtn');

const errorBox = document.getElementById('errorBox');
const successBox = document.getElementById('successBox');
const loginLink = document.getElementById('loginLink');


// =========================================
// قراءة Token من الرابط
// =========================================

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');


// إذا لم يوجد Token
if (!token) {

    resetForm.style.display = 'none';

    errorBox.textContent = 'رابط غير صالح';
    errorBox.style.display = 'block';

    loginLink.style.display = 'block';
}


// =========================================
// تغيير كلمة المرور
// =========================================

if (token) {

    resetBtn.addEventListener('click', () => {

        const password = passwordInput.value;
        const passwordConfirmation = passwordConfirmationInput.value;

        // تنظيف الرسائل القديمة
        errorBox.style.display = 'none';
        successBox.style.display = 'none';


        // تحقق بسيط قبل إرسال الطلب
        if (!password || !passwordConfirmation) {

            errorBox.textContent =
                'الرجاء إدخال كلمة المرور وتأكيدها';

            errorBox.style.display = 'block';

            return;
        }


        if (password !== passwordConfirmation) {

            errorBox.textContent =
                'كلمتا المرور غير متطابقتين';

            errorBox.style.display = 'block';

            return;
        }


        // تعطيل الزر أثناء الإرسال
        resetBtn.disabled = true;
        resetBtn.textContent = 'جاري التغيير...';


        fetch(`${API_BASE_URL}/reset-password`, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },

            body: JSON.stringify({

                token: token,

                password: password,

                password_confirmation: passwordConfirmation

            })
        })


        .then(async response => {

            const result = await response.json();

            if (!response.ok) {

                throw {
                    status: response.status,
                    ...result
                };

            }

            return result;
        })


        .then(result => {

            // إخفاء الفورم
            resetForm.style.display = 'none';

            // عرض رسالة النجاح
            successBox.textContent =
                result.message ||
                'تم تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول';

            successBox.style.display = 'block';

            // إظهار رابط تسجيل الدخول
            loginLink.style.display = 'block';


            // الانتقال إلى صفحة تسجيل الدخول
            setTimeout(() => {

                window.location.href = 'login.html';

            }, 3000);

        })


        .catch(error => {

            let message =
                error.message ||
                'حدث خطأ أثناء تغيير كلمة المرور';


            // أخطاء التحقق 422
            if (error.errors) {

                const firstError = Object.values(error.errors)[0];

                if (Array.isArray(firstError) && firstError.length > 0) {

                    message = firstError[0];

                }

            }


            errorBox.textContent = message;
            errorBox.style.display = 'block';


            // إعادة الزر
            resetBtn.disabled = false;
            resetBtn.textContent = 'تغيير كلمة المرور';

        });

    });

}