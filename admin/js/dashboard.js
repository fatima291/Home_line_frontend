const API_BASE_URL = 'http://127.0.0.1:8000/api';
const token = localStorage.getItem('admin_auth_token');

if (!token) {
    window.location.href = '../html/login.html';
}

const statusLabels = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
};

function authFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            ...(options.headers || {}),
        },
    });
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    return fetch(url, {
        ...options,
        headers,
    });

}

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    loadBookings();
    loadServices();
    loadCustomers();
    loadCoupons();
    loadReviewsStats();

    document.getElementById('statusFilter').addEventListener('change', loadBookings);
    document.getElementById('addServiceBtn').addEventListener('click', addService);
    document.getElementById('addCouponBtn').addEventListener('click', addCoupon);
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            document.getElementById('tab-' + this.dataset.tab).classList.add('active');
        });
    });
}

function logout() {
    authFetch(`${API_BASE_URL}/admin/logout`, { method: 'POST' })
        .finally(() => {
            localStorage.removeItem('admin_auth_token');
            window.location.href = '../html/login.html';
        });
}

/* ============ الحجوزات ============ */

let allBookingsCache = [];

function loadBookings() {
    const status = document.getElementById('statusFilter').value;
    const url = status
        ? `${API_BASE_URL}/admin/bookings?status=${status}`
        : `${API_BASE_URL}/admin/bookings`;

    authFetch(url)
        .then(res => res.json())
        .then(bookings => {
            allBookingsCache = bookings;
            renderBookings(bookings);
        })
        .catch(() => {
            document.getElementById('bookingsTableBody').innerHTML =
                '<tr><td colspan="8" class="empty-msg">حدث خطأ أثناء تحميل الحجوزات</td></tr>';
        });
}

function renderBookings(bookings) {
    const tbody = document.getElementById('bookingsTableBody');

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">لا توجد حجوزات</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    bookings.forEach((booking, index) => {
        const date = new Date(booking.created_at).toLocaleDateString('ar-EG');

        // عمود الدفع: مدفوع / زر تأكيد نقدي / أونلاين لسا ما دفع
        let paymentCell;
        if (booking.payment_status === 'paid') {
            paymentCell = `<span class="paid-badge">✅ مدفوع</span>`;
        } else if (booking.payment_method === 'cash') {
            paymentCell = `<button class="confirm-cash-btn" data-id="${booking.id}">تأكيد استلام نقدي</button>`;
        } else {
            paymentCell = `<span class="unpaid-badge">⏳ بانتظار الدفع الإلكتروني</span>`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${booking.service.name}</td>
            <td>${booking.full_name}</td>
            <td>${booking.phone}</td>
            <td>${date}</td>
            <td>
                <select class="status-select" data-id="${booking.id}">
                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>تأكيد الطلب</option>
                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>تم تنفيذ الطلب</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>إلغاء الطلب</option>
                </select>
            </td>
            <td>${paymentCell}</td>
            <td><button class="details-btn" data-id="${booking.id}">التفاصيل</button></td>
        `;
        tbody.appendChild(row);

        const detailsRow = document.createElement('tr');
        detailsRow.classList.add('details-row');
        detailsRow.id = `details-${booking.id}`;

        const options = booking.service_options
            ? Object.entries(booking.service_options).map(([k, v]) => `${k}: ${v}`).join(' | ')
            : 'لا توجد تفاصيل إضافية';

        const basePrice = (booking.service_options && booking.service_options.total_price)
            ? booking.service_options.total_price
            : (booking.service.price || null);

        let priceLine;
        if (!basePrice) {
            priceLine = `<strong>السعر:</strong> يُحدد لاحقاً بعد التواصل مع العميل<br>`;
        } else if (booking.discount_amount > 0) {
            priceLine = `
                <strong>السعر الأساسي:</strong> ${basePrice} ل.س<br>
                <strong>كوبون مطبّق:</strong> ${booking.coupon_code} (خصم ${booking.discount_amount} ل.س)<br>
                <strong>المبلغ النهائي:</strong> ${basePrice - booking.discount_amount} ل.س<br>
            `;
        } else {
            priceLine = `<strong>السعر:</strong> ${basePrice} ل.س<br>`;
        }

        detailsRow.innerHTML = `
            <td colspan="8">
                <strong>العنوان:</strong> ${booking.city} - ${booking.neighborhood} - ${booking.street} ${booking.building_number ? '- مبنى ' + booking.building_number : ''}<br>
                <strong>الهوية الوطنية:</strong> ${booking.national_id} |
                <strong>البريد:</strong> ${booking.email || 'غير متوفر'} |
                <strong>رابط الموقع:</strong> ${booking.map_link || 'غير متوفر'}<br>
                ${priceLine}
                <strong>ملاحظات:</strong> ${booking.notes || 'لا يوجد'}<br>
                <strong>تفاصيل الخدمة:</strong> ${options}
            </td>
        `;
        tbody.appendChild(detailsRow);
    });

    document.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.getElementById(`details-${this.dataset.id}`).classList.toggle('show');
        });
    });

    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function () {
            updateBookingStatus(this.dataset.id, this.value);
        });
    });

    document.querySelectorAll('.confirm-cash-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            confirmCashPayment(this.dataset.id);
        });
    });
}

function updateBookingStatus(bookingId, newStatus) {
    authFetch(`${API_BASE_URL}/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
    })
        .then(async res => {
            const result = await res.json();
            if (!res.ok) throw result;
            return result;
        })
        .then(() => {
            loadBookings();
        })
        .catch(error => {
            alert(error.message || 'حدث خطأ أثناء تحديث الحالة');
            loadBookings();
        });
}

function confirmCashPayment(bookingId) {

    const bookingRow = allBookingsCache.find(b => b.id == bookingId); // احتاجي متغير allBookingsCache (شوفي الملاحظة تحت)
    const hasCalculatedPrice = bookingRow && bookingRow.service_options && bookingRow.service_options.total_price;

    let body = {};

    if (!hasCalculatedPrice) {
        const amount = prompt('هذه الخدمة بدون سعر محدد مسبقاً، الرجاء إدخال المبلغ المتفق عليه مع العميل (ل.س):');
        if (amount === null || amount.trim() === '') return;
        body.amount = amount;
    } else {
        if (!confirm('هل تم استلام المبلغ النقدي فعلياً؟')) return;
    }

    authFetch(`${API_BASE_URL}/admin/bookings/${bookingId}/confirm-cash`, {
        method: 'POST',
        body: JSON.stringify(body),
    })
        .then(async res => {
            const result = await res.json();
            if (!res.ok) throw result;
            return result;
        })
        .then(() => {
            alert('تم تأكيد استلام الدفع بنجاح');
            loadBookings();
        })
        .then(() => {
            loadBookings();
        })
        .catch(error => {
            alert(error.message || 'حدث خطأ أثناء تأكيد الدفع');
        });
}

/* ============ الخدمات ============ */

function loadServices() {
    fetch(`${API_BASE_URL}/services`)
        .then(res => res.json())
        .then(services => renderServices(services))
        .catch(() => {
            document.getElementById('servicesTableBody').innerHTML =
                '<tr><td colspan="5" class="empty-msg">حدث خطأ أثناء تحميل الخدمات</td></tr>';
        });
}

function renderServices(services) {
    const tbody = document.getElementById('servicesTableBody');

    if (services.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">لا توجد خدمات</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    services.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${service.id}</td>
            <td>${service.name}</td>
            <td>${service.description || '-'}</td>
            <td>
                <div class="service-row-actions">
                    <button class="small-btn delete" data-id="${service.id}">حذف</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.small-btn.delete').forEach(btn => {
        btn.addEventListener('click', function () {
            deleteService(this.dataset.id);
        });
    });
}

function addService() {
    const nameInput = document.getElementById('newServiceName');
    const descInput = document.getElementById('newServiceDesc');
    const imageInput = document.getElementById('newServiceImage');

    if (!nameInput.value.trim()) {
        alert('الرجاء إدخال اسم الخدمة');
        return;
    }

    // إنشاء كائن FormData لإرسال الملف والبيانات النصية معا
    const formData = new FormData();
    formData.append('name', nameInput.value.trim());
    
    if (descInput.value.trim()) {
        formData.append('description', descInput.value.trim());
    }

    // التحقق من وجود صورة مختارة من الجهاز وأرفاقها
    if (imageInput.files && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    authFetch(`${API_BASE_URL}/admin/services`, {
        method: 'POST',
        body: formData, // نرسل الـ formData مباشرة دون استخدام JSON.stringify
    })
        .then(async res => {
            const result = await res.json();
            if (!res.ok) throw result;
            return result;
        })
        .then(() => {
            nameInput.value = '';
            descInput.value = '';
            imageInput.value = '';
            loadServices();
        })
        .catch(error => {
            alert(error.message || 'حدث خطأ أثناء إضافة الخدمة');
        });
}

function deleteService(serviceId) {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;

    authFetch(`${API_BASE_URL}/admin/services/${serviceId}`, {
        method: 'DELETE',
    })
        .then(async res => {
            const result = await res.json();
            if (!res.ok) throw result;
            return result;
        })
        .then(() => loadServices())
        .catch(error => {
            alert(error.message || 'حدث خطأ أثناء حذف الخدمة');
        });
}

/* ============ العملاء ============ */

function loadCustomers() {
    authFetch(`${API_BASE_URL}/admin/customers`)
        .then(res => res.json())
        .then(customers => renderCustomers(customers))
        .catch(() => {
            document.getElementById('customersTableBody').innerHTML =
                '<tr><td colspan="6" class="empty-msg">حدث خطأ أثناء تحميل العملاء</td></tr>';
        });
}

function renderCustomers(customers) {
    const tbody = document.getElementById('customersTableBody');

    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">لا يوجد عملاء مسجلين</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    customers.forEach(customer => {
        const date = new Date(customer.created_at).toLocaleDateString('ar-EG');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.full_name}</td>
            <td>${customer.username}</td>
            <td>${customer.phone}</td>
            <td>${customer.city}</td>
            <td>${date}</td>
        `;
        tbody.appendChild(row);
    });
}

function loadReviewsStats() {
    fetch(`${API_BASE_URL}/services`)
        .then(res => res.json())
        .then(services => {
            // نجيب إحصائيات التقييم لكل خدمة بالتوازي
            const promises = services.map(service =>
                fetch(`${API_BASE_URL}/reviews?service_id=${service.id}`)
                    .then(res => res.json())
                    .then(data => ({
                        name: service.name,
                        average: data.average_rating,
                        total: data.total_reviews,
                    }))
            );

            Promise.all(promises).then(renderReviewsStats);
        })
        .catch(() => {
            document.getElementById('reviewsTableBody').innerHTML =
                '<tr><td colspan="3" class="empty-msg">حدث خطأ أثناء تحميل الإحصائيات</td></tr>';
        });
}

function renderReviewsStats(stats) {
    const tbody = document.getElementById('reviewsTableBody');
    tbody.innerHTML = '';

    stats.forEach(stat => {
        const row = document.createElement('tr');
        const ratingDisplay = stat.average
            ? `⭐ ${stat.average} / 5`
            : `<span class="price-tbd">لا توجد تقييمات بعد</span>`;

        row.innerHTML = `
            <td>${stat.name}</td>
            <td>${ratingDisplay}</td>
            <td>${stat.total}</td>
        `;
        tbody.appendChild(row);
    });
}

/* ============ الكوبونات ============ */

function loadCoupons() {
    authFetch(`${API_BASE_URL}/admin/coupons`)
        .then(res => res.json())
        .then(coupons => renderCoupons(coupons))
        .catch(() => {
            document.getElementById('couponsTableBody').innerHTML =
                '<tr><td colspan="9" class="empty-msg">حدث خطأ أثناء تحميل الكوبونات</td></tr>';
        });
}

function renderCoupons(coupons) {
    const tbody = document.getElementById('couponsTableBody');

    if (!coupons || coupons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-msg">لا توجد كوبونات مضافة</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    coupons.forEach((coupon, index) => {
        const typeText = coupon.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت';
        const valueText = coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} ل.س`;
        const usesText = coupon.max_uses ? `${coupon.used_count} / ${coupon.max_uses}` : `${coupon.used_count} / ∞`;
        const expiresText = coupon.expires_at ? new Date(coupon.expires_at).toLocaleString('ar-EG') : 'غير محدد';
        const statusBadge = coupon.is_active ? '✅ مفعل' : '❌ غير مفعل';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${coupon.code}</strong></td>
            <td>${typeText}</td>
            <td>${valueText}</td>
            <td>${coupon.min_order_amount ? coupon.min_order_amount + ' ل.س' : 'لا يوجد'}</td>
            <td>${usesText}</td>
            <td>${statusBadge}</td>
            <td>${expiresText}</td>
            <td>
                <button class="small-btn delete" data-id="${coupon.id}">حذف</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('#couponsTableBody .small-btn.delete').forEach(btn => {
        btn.addEventListener('click', function () {
            deleteCoupon(this.dataset.id);
        });
    });
}

function addCoupon() {
    const data = {
        code: document.getElementById('newCouponCode').value.trim(),
        type: document.getElementById('newCouponType').value,
        value: document.getElementById('newCouponValue').value,
        min_order_amount: document.getElementById('newCouponMinOrder').value || 0,
        max_uses: document.getElementById('newCouponMaxUses').value || null,
        expires_at: document.getElementById('newCouponExpiresAt').value || null,
        is_active: true
    };

    if (!data.code || !data.value) {
        alert('الرجاء إدخال رمز الكوبون وقيمته');
        return;
    }

    authFetch(`${API_BASE_URL}/admin/coupons`, {
        method: 'POST',
        body: JSON.stringify(data),
    })
        .then(async res => {
            const result = await res.json();
            if (!res.ok) throw result;
            return result;
        })
        .then(() => {
            alert('تم إضافة الكوبون بنجاح');
            // تفريغ الحقول
            document.getElementById('newCouponCode').value = '';
            document.getElementById('newCouponValue').value = '';
            document.getElementById('newCouponMinOrder').value = '';
            document.getElementById('newCouponMaxUses').value = '';
            document.getElementById('newCouponExpiresAt').value = '';
            loadCoupons();
        })
        .catch(error => {
            alert(error.message || 'حدث خطأ أثناء إضافة الكوبون');
        });
}

function deleteCoupon(couponId) {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;

    authFetch(`${API_BASE_URL}/admin/coupons/${couponId}`, {
        method: 'DELETE',
    })
        .then(async res => {
            const result = await res.json();
            if (!res.ok) throw result;
            return result;
        })
        .then(() => loadCoupons())
        .catch(error => {
            alert(error.message || 'حدث خطأ أثناء حذف الكوبون');
        });
}