const API_BASE_URL = 'http://127.0.0.1:8000/api';

const forgotForm = document.getElementById('forgotForm');
const loginField = document.getElementById('loginField');
const forgotBtn = document.getElementById('forgotBtn');

const errorBox = document.getElementById('errorBox');
const successBox = document.getElementById('successBox');


forgotBtn.addEventListener('click', () => {

    const login = loginField.value.trim();

    // التحقق من أن الحقل غير فارغ
    if (!login) {
        errorBox.textContent = 'الرجاء إدخال اسم المستخدم أو رقم الجوال';
        errorBox.style.display = 'block';
        return;
    }

    // إخفاء أي رسالة سابقة
    errorBox.style.display = 'none';
    successBox.style.display = 'none';

    // تعطيل الزر أثناء الإرسال
    forgotBtn.disabled = true;
    forgotBtn.textContent = 'جاري الإرسال...';


    fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',

        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },

        body: JSON.stringify({
            login: login
        })
    })

    .then(async response => {

        const result = await response.json();

        if (!response.ok) {
            throw result;
        }

        return result;
    })

    .then(result => {

        // إخفاء الفورم
        forgotForm.style.display = 'none';

        // عرض رسالة الباك كما هي
        successBox.textContent =
            result.message ||
            'إذا كان الحساب موجوداً، تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.';

        successBox.style.display = 'block';
    })

    .catch(error => {

        errorBox.textContent =
            error.message || 'حدث خطأ، يرجى المحاولة مرة أخرى';

        errorBox.style.display = 'block';

        // إعادة الزر لو صار خطأ
        forgotBtn.disabled = false;
        forgotBtn.textContent = 'إرسال رابط إعادة التعيين';
    });

});