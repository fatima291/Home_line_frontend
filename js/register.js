document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    const registerBtn = document.getElementById('registerBtn');
    const citySelect = document.getElementById('city');
    const neighborhoodSelect = document.getElementById('neighborhood');
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
    
    // قائمة المحافظات والأحياء التابعة لها في سوريا
    const syriaData = {
        "دمشق": ["المزة", "كفرسوسة", "المالكي", "أبو رمانة", "الميدان", "دمر", "الشارع المستقيم", "الركن الدين"],
        "ريف دمشق": ["جرمانا", "صحنايا", "القدسيا", "التل", "الكسوة", "النبك", "يبرود"],
        "حلب": ["الشهباء", "الفرقان", "الجميلية", "السريان", "الزهراء", "شارع النيل", "صلاح الدين"],
        "حمص": ["الإنشاءات", "الزهراء", "الحمراء", "الوعر", "عكرمة", "المحطة", "الدبلان"],
        "حماة": ["العاصي", "الحاضر", "الصابونية", "الشريعة", "القصور", "دوار العلم"],
        "اللاذقية": ["المشروع السابع", "الزراعة", "الصليبة", "الأوقاف", "الكورنيش", "الأزهري"],
        "طرطوس": ["المشروع الثاني", "الكورنيش", "الغدير", "البرامكة", "عوقة"],
        "درعا": ["درعا المحطة", "درعا البلد", "السبيل", "القصور"],
        "السويداء": ["الخالدية", "المسجد", "القلعة", "طريق القريا"],
        "القنيطرة": ["خان أرنبة", "مدينة البعث"],
        "دير الزور": ["القصور", "الرشيدية", "الجورة", "العمال"],
        "الحسكة": ["العزيزية", "الصالحية", "المفتي", "تل حجر"],
        "الرقة": ["الثورة", "الرميلة", "الدرعية", "المنصور"]
    };

    // دالة تحديث قائمة الأحياء عند تغيير المدينة
    function updateNeighborhoods() {
        if (!citySelect || !neighborhoodSelect) return;

        const selectedCity = citySelect.value;
        neighborhoodSelect.innerHTML = '<option value="">اختر الحي</option>';

        if (selectedCity && syriaData[selectedCity]) {
            syriaData[selectedCity].forEach(neighborhood => {
                const option = document.createElement('option');
                option.value = neighborhood;
                option.textContent = neighborhood;
                neighborhoodSelect.appendChild(option);
            });
        }
    }

    // ربط تغيير المدينة بالدالة
    if (citySelect) {
        citySelect.addEventListener('change', updateNeighborhoods);
    }

    // إخفاء كل رسائل الخطأ القديمة
    function clearErrors() {
        document.querySelectorAll('.error-msg').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });
    }

    // عرض أخطاء التحقق القادمة من الباك اند (422)
    function showErrors(errors) {
        Object.keys(errors).forEach(field => {
            const el = document.getElementById('err-' + field);
            if (el) {
                el.textContent = errors[field][0];
                el.style.display = 'block';
            }
        });
    }

    function togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const eyeOpen = btn.querySelector('.eye-open');
        const eyeClosed = btn.querySelector('.eye-closed');

        if (input.type === 'password') {
            input.type = 'text';
            if (eyeOpen) eyeOpen.style.display = 'none';
            if (eyeClosed) eyeClosed.style.display = 'inline-block';
        } else {
            input.type = 'password';
            if (eyeOpen) eyeOpen.style.display = 'inline-block';
            if (eyeClosed) eyeClosed.style.display = 'none';
        }
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', function () {
            clearErrors();

            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('passwordConfirm').value;

            if (password !== passwordConfirm) {
                const errPassword = document.getElementById('err-password');
                if (errPassword) {
                    errPassword.textContent = 'كلمتا المرور غير متطابقتين';
                    errPassword.style.display = 'block';
                }
                return;
            }

            registerBtn.disabled = true;
            registerBtn.textContent = 'جاري الإنشاء...';

            const data = {
                username: document.getElementById('username').value,
                full_name: document.getElementById('fullName').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value || null,
                national_id: document.getElementById('nationalId').value,
                password: password,
                password_confirmation: passwordConfirm,
                city: document.getElementById('city').value,
                neighborhood: document.getElementById('neighborhood').value,
                street: document.getElementById('street').value,
                building_number: document.getElementById('buildingNumber').value || null,
                location_link: document.getElementById('locationLink').value || null,
            };

            fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data),
            })
                .then(async response => {
                    const result = await response.json();

                    if (!response.ok) {
                        if (response.status === 422 && result.errors) {
                            showErrors(result.errors);
                        } else {
                            alert(result.message || 'حدث خطأ أثناء إنشاء الحساب.');
                        }
                        throw new Error('validation');
                    }

                    return result;
                })
                .then(result => {
                    alert('تم إنشاء الحساب بنجاح! تحققي من بريدك الإلكتروني لتفعيل الحساب قبل تسجيل الدخول.');
                    window.location.href = 'login.html';
                })
                .catch(() => {})
                .finally(() => {
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'إنشاء الحساب';
                });
        });
    }
});