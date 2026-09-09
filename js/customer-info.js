document.addEventListener("DOMContentLoaded", function () {
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    const token = localStorage.getItem('auth_token');

    let isForSelf = false;
    let currentCustomer = null;

    renderOrderSummary();

    function renderOrderSummary() {
        const summaryBox = document.getElementById('orderSummary');
        const rawOptions = localStorage.getItem('service_options');

        if (!summaryBox) return;

        if (!rawOptions) {
            summaryBox.innerHTML = '<p>لا توجد تفاصيل حجز مسجلة.</p>';
            return;
        }

        const options = JSON.parse(rawOptions);
        let summaryHTML = '';

        if (options.visit_type === 'single') {
            summaryHTML += `<p><strong>نوع الزيارة:</strong> زيارة فردية</p>`;
            if (options.nationality) summaryHTML += `<p><strong>الجنسية:</strong> ${options.nationality}</p>`;
            if (options.duration) summaryHTML += `<p><strong>المدة:</strong> ${options.duration} ساعات</p>`;
            if (options.workers) summaryHTML += `<p><strong>عدد العاملات:</strong> ${options.workers}</p>`;
            if (options.period) summaryHTML += `<p><strong>الفترة:</strong> ${options.period === 'morning' ? 'صباحي' : 'مسائي'}</p>`;
            if (options.service_date) summaryHTML += `<p><strong>تاريخ الخدمة:</strong> ${options.service_date}</p>`;
        }
        else if (options.visit_type === 'multiple') {
            summaryHTML += `<p><strong>نوع الزيارة:</strong> زيارات متعددة</p>`;
            if (options.months) summaryHTML += `<p><strong>مدة العقد:</strong> ${options.months} أشهر</p>`;
            if (options.nationality) summaryHTML += `<p><strong>الجنسية:</strong> ${options.nationality}</p>`;
            if (options.duration) summaryHTML += `<p><strong>المدة:</strong> ${options.duration} ساعات</p>`;
            if (options.period) summaryHTML += `<p><strong>الفترة:</strong> ${options.period === 'morning' ? 'صباحي' : 'مسائي'}</p>`;
            if (options.days) summaryHTML += `<p><strong>الأيام المختارة:</strong> ${options.days.join(', ')}</p>`;
        }
        else if (options.units_count !== undefined || options.ac_type !== undefined || options.duration_minutes !== undefined) {
            if (options.title) summaryHTML += `<p><strong>نوع الخدمة:</strong> ${options.title}</p>`;
            if (options.ac_type) summaryHTML += `<p><strong>نوع المكيف:</strong> ${options.ac_type}</p>`;
            if (options.units_count) summaryHTML += `<p><strong>عدد الوحدات:</strong> ${options.units_count} وحدة</p>`;
            if (options.ac_count) summaryHTML += `<p><strong>عدد المكيفات:</strong> ${options.ac_count}</p>`;
            if (options.duration_minutes) summaryHTML += `<p><strong>الوقت المتوقع:</strong> ${options.duration_minutes} دقيقة</p>`;
        }
        else if (options.start_time !== undefined) {
            if (options.start_time) summaryHTML += `<p><strong>وقت بدء الخدمة:</strong> ${options.start_time}</p>`;
            if (options.duration_hours) summaryHTML += `<p><strong>مدة الخدمة:</strong> ${options.duration_hours} ساعات</p>`;
            if (options.workers) summaryHTML += `<p><strong>عدد مقدمي الخدمة:</strong> ${options.workers}</p>`;
        }
        else if (options.package !== undefined || options.pest_type !== undefined) {
            if (options.title) {
                summaryHTML += `<p><strong>الباقة المختارة:</strong> ${options.title}</p>`;
            } else if (options.package) {
                summaryHTML += `<p><strong>الباقة المختارة:</strong> مكافحة حشرات (${options.package})</p>`;
            }
            if (options.period) {
                const periodText = (options.period === 'morning' || options.period === 'صباحي') ? 'صباحي' : 'مسائي';
                summaryHTML += `<p><strong>وقت الخدمة:</strong> ${periodText}</p>`;
            }
            if (options.service_date) summaryHTML += `<p><strong>تاريخ الخدمة:</strong> ${options.service_date}</p>`;
            if (options.visit_date) summaryHTML += `<p><strong>تاريخ الزيارة:</strong> ${options.visit_date}</p>`;
        }

        if (options.total_price !== undefined) {
            summaryHTML += `
                <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ccc;">
                <p style="color: #2e7d32; font-weight: bold; font-size: 1.1em; margin-top: 8px;">
                    <strong>التكلفة الإجمالية:</strong> ${Number(options.total_price).toLocaleString('ar-SY')} ليرة
                </p>
            `;
        }

        summaryBox.innerHTML = summaryHTML || '<p>لا توجد تفاصيل حجز مسجلة.</p>';
    }

    // مربع تحديد "الحجز باسمي"
    const bookForSelfCheckbox = document.getElementById('bookForSelfCheckbox');

        bookForSelfCheckbox.addEventListener('change', function () {
            if (this.checked) {
                if (!token) {
                    alert('يجب تسجيل الدخول أولاً لاستخدام هذا الخيار.');
                    this.checked = false;
                    return;
                }

                fetch(`${API_BASE_URL}/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                })
                    .then(res => {
                        if (!res.ok) throw new Error('فشل جلب البيانات');
                        return res.json();
                    })
                    .then(customer => {
                        currentCustomer = customer;
                        isForSelf = true;
                    })
                    .catch(err => {
                        alert('حدث خطأ أثناء جلب بياناتك: ' + err.message);
                        this.checked = false;
                    });
            } else {
                isForSelf = false;
                currentCustomer = null;
            }
        });

    // زر "متابعة" الوحيد
    function goToPaymentPage() {
        const serviceId = localStorage.getItem('service_id');

        if (!serviceId) {
            alert('حدث خطأ: لم يتم تحديد الخدمة. الرجاء العودة واختيار الخدمة من جديد.');
            return;
        }

        if (!token) {
            alert('يجب تسجيل الدخول أولاً لإتمام الحجز.');
            return;
        }

        const serviceOptionsRaw = localStorage.getItem('service_options');
        const serviceOptions = serviceOptionsRaw ? JSON.parse(serviceOptionsRaw) : null;
        const calculatedTotalPrice = serviceOptions ? (serviceOptions.total_price || 0) : 0;

        let pendingBooking = {
            service_id: parseInt(serviceId),
            for_self: isForSelf,
            service_options: serviceOptions,
            total_price: calculatedTotalPrice, 
            notes: document.getElementById('notes') ? (document.getElementById('notes').value || null) : null,
        };

        if (isForSelf) {
            pendingBooking.display_name = currentCustomer ? currentCustomer.full_name : 'حسابي';
        } else {
            const fullName = document.getElementById('fullName') ? document.getElementById('fullName').value.trim() : '';
            const phone = document.getElementById('phone') ? document.getElementById('phone').value.trim() : '';
            const nationalId = document.getElementById('nationalId') ? document.getElementById('nationalId').value.trim() : '';
            const city = document.getElementById('city') ? document.getElementById('city').value.trim() : '';
            const neighborhood = document.getElementById('neighborhood') ? document.getElementById('neighborhood').value.trim() : '';
            const street = document.getElementById('street') ? document.getElementById('street').value.trim() : '';

            if (!fullName || !phone || !nationalId || !city || !neighborhood || !street) {
                alert('يرجى تعبئة جميع الحقول الإجبارية (*)');
                return;
            }

            pendingBooking.full_name = fullName;
            pendingBooking.phone = phone;
            pendingBooking.national_id = nationalId;
            pendingBooking.email = document.getElementById('email') ? (document.getElementById('email').value.trim() || null) : null;
            pendingBooking.city = city;
            pendingBooking.neighborhood = neighborhood;
            pendingBooking.street = street;
            pendingBooking.building_number = document.getElementById('buildingNumber') ? (document.getElementById('buildingNumber').value.trim() || null) : null;
            pendingBooking.map_link = document.getElementById('mapLink') ? (document.getElementById('mapLink').value.trim() || null) : null;
            pendingBooking.display_name = fullName;
        }

        localStorage.setItem('pending_booking', JSON.stringify(pendingBooking));
        window.location.href = 'payment-method.html';
    }

    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', goToPaymentPage);
    }
});