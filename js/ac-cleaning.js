document.addEventListener("DOMContentLoaded", function () {
    const confirmBtn = document.querySelector(".confirm-btn");

    if (confirmBtn) {
        confirmBtn.addEventListener("click", function () {
            // جلب عنصر الراديو المحدد في الصفحات
            const selectedOption = document.querySelector('input[name="acService"]:checked');

            if (!selectedOption) {
                alert('الرجاء اختيار عدد الوحدات المطلوب تنظيفها.');
                return;
            }

            // الوصول للعنصر الأب لاستخراج العنوان النصي
            const serviceBox = selectedOption.closest('.service-box');
            const title = serviceBox && serviceBox.querySelector('h3') ? serviceBox.querySelector('h3').textContent.trim() : 'تنظيف مكيفات';

            const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
            const duration = parseInt(selectedOption.getAttribute('data-duration')) || 0;
            const units = parseInt(selectedOption.value) || 1;

            const options = {
                title: title,
                units_count: units,
                duration_minutes: duration,
                total_price: price
            };

            // تخزين البيانات في localStorage
            localStorage.setItem('service_id', '2'); // رقم خدمة المكيفات
            localStorage.setItem('service_options', JSON.stringify(options));

            // التوجيه إلى صفحة بيانات الحجز (تأكدي من تطابق الاسم لديكِ)
            window.location.href = 'custmer-info.html';
        });
    }
});