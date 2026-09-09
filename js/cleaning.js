document.addEventListener("DOMContentLoaded", function () {
    const singleVisitBtn = document.querySelector('.visit-type[data-value="single"]');
    const multiVisitBtn = document.querySelector('.visit-type[data-value="multi"]');
    const singleSection = document.getElementById("singleVisitSection");
    const multiSection = document.getElementById("multiVisitSection");
    const cleaningDateInput = document.getElementById("serviceDate");
    
    if (cleaningDateInput) {
        const today = new Date().toISOString().split('T')[0];
        cleaningDateInput.setAttribute("min", today);
    }
    // 1. التبديل بين الزيارة الفردية والمتعددة
    if (singleVisitBtn && multiVisitBtn) {
        singleVisitBtn.addEventListener("click", function () {
            singleVisitBtn.classList.add("active");
            multiVisitBtn.classList.remove("active");
            singleSection.style.display = "block";
            multiSection.style.display = "none";
        });

        multiVisitBtn.addEventListener("click", function () {
            multiVisitBtn.classList.add("active");
            singleVisitBtn.classList.remove("active");
            multiSection.style.display = "block";
            singleSection.style.display = "none";
        });
    }

    // 2. تفعيل الخيارات المحددة (active) لكل مجموعة
    document.querySelectorAll('.option-card[data-group]').forEach(function (card) {
        card.addEventListener('click', function () {
            const group = this.dataset.group;
            const parent = this.closest('.options-grid') || this.parentElement;
            parent.querySelectorAll(`.option-card[data-group="${group}"]`).forEach(x => x.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 3. تحديث نص ملاحظة الفترة (صباحي / مسائي)
    const updatePeriodNote = (cardsSelector, noteId) => {
        const cards = document.querySelectorAll(cardsSelector);
        const noteEl = document.getElementById(noteId);
        cards.forEach(card => {
            card.addEventListener("click", function () {
                if (this.dataset.value === "morning") {
                    noteEl.innerText = "تشمل هذه الفترة وصول العاملة إلى موقع الخدمة من الساعة 8:00 صباحاً إلى 10:00 صباحاً.";
                } else {
                    noteEl.innerText = "تشمل هذه الفترة وصول العاملة إلى موقع الخدمة من الساعة 4:00 مساءً إلى 6:00 مساءً.";
                }
            });
        });
    };

    updatePeriodNote('#singleVisitSection .period', 'periodNote');
    updatePeriodNote('#multiVisitSection .multi-period', 'multiPeriodNote');

    // 4. اختيار أيام الأسبوع (زيارات متعددة)
    document.querySelectorAll('.option-card.day').forEach(function (day) {
        day.addEventListener('click', function () {
            this.classList.toggle('active');
        });
    });

    // 5. تأكيد الحجز وحفظ البيانات
    const confirmBtn = document.getElementById("confirmCleaning");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", function () {
            const visitTypeEl = document.querySelector('.visit-type.active');
            const visitType = visitTypeEl ? visitTypeEl.dataset.value : 'single';

            let options = { visit_type: visitType };

            if (visitType === 'single') {
                const nationalityEl = document.querySelector('#singleVisitSection .nationality.active');
                const durationEl = document.querySelector('#singleVisitSection .duration.active');
                const workersEl = document.querySelector('#singleVisitSection .workers.active');
                const periodEl = document.querySelector('#singleVisitSection .period.active');
                const dateEl = document.getElementById('serviceDate');

                if (!nationalityEl || !durationEl || !workersEl || !periodEl || !dateEl.value) {
                    alert('الرجاء إكمال جميع الخيارات وتحديد تاريخ الخدمة قبل المتابعة.');
                    return;
                }

                options.nationality = nationalityEl.dataset.value;
                options.duration = durationEl.dataset.value;
                options.workers = workersEl.dataset.value;
                options.period = periodEl.dataset.value;
                options.service_date = dateEl.value;

            } else {
                const monthsEl = document.querySelector('#multiVisitSection .months.active');
                const nationalityEl = document.querySelector('#multiVisitSection .nationality.active');
                const durationEl = document.querySelector('#multiVisitSection .duration.active');
                const periodEl = document.querySelector('#multiVisitSection .multi-period.active');
                const selectedDays = Array.from(document.querySelectorAll('.option-card.day.active')).map(d => d.dataset.day);

                if (!monthsEl || !nationalityEl || !durationEl || !periodEl || selectedDays.length === 0) {
                    alert('الرجاء إكمال جميع الخيارات واختيار يوم واحد على الأقل قبل المتابعة.');
                    return;
                }

                options.months = monthsEl.dataset.value;
                options.nationality = nationalityEl.dataset.value;
                options.duration = durationEl.dataset.value;
                options.period = periodEl.dataset.value;
                options.days = selectedDays;
            }

            // حفظ بيانات الخدمة وتوجيه المستخدم
            localStorage.setItem('service_id', 1);
            localStorage.setItem('service_options', JSON.stringify(options));
            window.location.href = 'custmer-info.html';
        });
    }
});