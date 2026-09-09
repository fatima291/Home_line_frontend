document.addEventListener("DOMContentLoaded", function () {
    const confirmBtn = document.querySelector(".confirm-btn");
    const pestDateInput = document.getElementById("pestDate");
    
    if (pestDateInput) {
        const today = new Date().toISOString().split('T')[0];
        pestDateInput.setAttribute("min", today);
    }
    if (confirmBtn) {
        confirmBtn.addEventListener("click", function () {
            const selected = document.querySelector('input[name="pestService"]:checked');

            if (!selected) {
                alert("يرجى اختيار إحدى الخدمات أولاً");
                return;
            }

            const periodEl = document.getElementById("pestPeriod");
            const dateEl = document.getElementById("pestDate");

            if (!dateEl || !dateEl.value) {
                alert("يرجى تحديد تاريخ الخدمة");
                return;
            }

            // جلب كرت الخدمة المختار
            const card = selected.closest(".service-card");
            const title = card && card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : selected.value;
            const priceText = card && card.querySelector(".price") ? card.querySelector(".price").textContent : "0";
            
            // استخراج الرقم من النص (مثلاً: "1200 ل.س" تحول إلى 1200)
            const numericPrice = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;

            const options = {
                package: selected.value,                      // قيمة الخيار (غرفة واحدة، غرفتين...)
                title: title,                                 // العنوان النصي الكامل للبطاقة
                period: periodEl ? periodEl.value : 'morning', // morning / evening
                service_date: dateEl.value,                   // التاريخ المحدد
                total_price: numericPrice                     // السعر الرقمي
            };

            localStorage.setItem('service_id', '4');
            localStorage.setItem('service_options', JSON.stringify(options));

            // الانتقال لصفحة تعبئة البيانات
            window.location.href = "custmer-info.html";
        });
    }
});