document.addEventListener('DOMContentLoaded', function () {

    /*====================================
            العناصر الأساسية
    =====================================*/
    const serviceTime = document.getElementById("serviceTime");
    const plusTime = document.getElementById("plusTime");
    const minusTime = document.getElementById("minusTime");

    const serviceDuration = document.getElementById("serviceDuration");
    const plusDuration = document.getElementById("plusDuration");
    const minusDuration = document.getElementById("minusDuration");

    const workersCount = document.getElementById("workersCount");
    const plusWorkers = document.getElementById("plusWorkers");
    const minusWorkers = document.getElementById("minusWorkers");

    const totalPriceEl = document.getElementById("totalPrice");
    const confirmBtn = document.querySelector(".confirm-btn");

    // القيم المبدئية
    let minutes = 600; // 10:00 صباحاً
    let duration = 4;   // 4 ساعات
    let workers = 2;    // 2 مقدمي خدمة

    /*====================================
            دالة حساب التكلفة والسعر
    =====================================*/
    function calculatePrice(startTimeMinutes, durationHours, workersCount) {
        // 1. السعر الأساسي (قبل الساعة 4 مساءً / 960 دقيقة تكون 20 ألف، بعدها 25 ألف)
        let basePrice = (startTimeMinutes >= 960) ? 25000 : 20000;

        // 2. الساعات الإضافية (فوق 4 ساعات: 5,000 ل.س عن كل ساعة)
        let extraHours = durationHours - 4;
        let extraHoursPrice = extraHours * 5000;

        // 3. مقدمو الخدمة الإضافيون (فوق شخصين: 10,000 ل.س عن كل شخص إضافي)
        let extraWorkers = workersCount - 2;
        let extraWorkersPrice = extraWorkers * 10000;

        return basePrice + extraHoursPrice + extraWorkersPrice;
    }

    // دالة تحديث السعر المعروض في الواجهة
    function updateTotalPrice() {
        if (totalPriceEl) {
            const currentPrice = calculatePrice(minutes, duration, workers);
            totalPriceEl.textContent = currentPrice.toLocaleString('ar-SY') + " ل.س";
        }
    }

    /*====================================
            وقت بدء الخدمة
    =====================================*/
    function updateTime() {
        let hour = Math.floor(minutes / 60);
        let minute = minutes % 60;
        let period = hour >= 12 ? "مساءً" : "صباحاً";

        let displayHour = hour;
        if (displayHour > 12) displayHour -= 12;
        if (displayHour === 0) displayHour = 12;

        if (serviceTime) {
            serviceTime.textContent =
                displayHour + ":" +
                minute.toString().padStart(2, "0") +
                " " + period;
        }

        updateTotalPrice();
    }

    if (plusTime) {
        plusTime.onclick = function () {
            if (minutes < 1200) { // بحد أقصى 8 مساءً
                minutes += 30;
                updateTime();
            }
        };
    }

    if (minusTime) {
        minusTime.onclick = function () {
            if (minutes > 600) { // بحد أدنى 10 صباحاً
                minutes -= 30;
                updateTime();
            }
        };
    }

    /*====================================
            مدة الخدمة
    =====================================*/
    function updateDuration() {
        if (serviceDuration) {
            serviceDuration.textContent = duration + " ساعات";
        }
        updateTotalPrice();
    }

    if (plusDuration && minusDuration) {
        plusDuration.onclick = function () {
            if (duration < 8) {
                duration++;
                updateDuration();
            }
        };

        minusDuration.onclick = function () {
            if (duration > 4) {
                duration--;
                updateDuration();
            }
        };
    }

    /*====================================
          عدد مقدمي الخدمة
    =====================================*/
    function updateWorkers() {
        if (workersCount) {
            workersCount.textContent = workers;
        }
        updateTotalPrice();
    }

    if (plusWorkers && minusWorkers) {
        plusWorkers.onclick = function () {
            if (workers < 8) {
                workers++;
                updateWorkers();
            }
        };

        minusWorkers.onclick = function () {
            if (workers > 2) {
                workers--;
                updateWorkers();
            }
        };
    }

    /*====================================
            التهيئات الأولية
    =====================================*/
    updateTime();
    updateDuration();
    updateWorkers();

    /*====================================
            زر التأكيد
    =====================================*/
    if (confirmBtn) {
        confirmBtn.onclick = function () {
            const finalPrice = calculatePrice(minutes, duration, workers);

            const options = {
                start_time: serviceTime.textContent.trim(),
                start_time_minutes: minutes,
                duration_hours: duration,
                workers: workers,
                total_price: finalPrice
            };

            localStorage.setItem('service_id', 3); // رقم خدمة "المناسبات" بقاعدة البيانات
            localStorage.setItem('service_options', JSON.stringify(options));

            window.location.href = "custmer-info.html";
        };
    }
});