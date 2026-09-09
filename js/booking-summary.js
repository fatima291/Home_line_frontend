document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    const token = localStorage.getItem('auth_token');

    const pendingRaw = localStorage.getItem('pending_booking');
    const selectedPaymentMethod = localStorage.getItem('selected_payment_method') || 'cash';
    const pendingCardRaw = localStorage.getItem('pending_card');

    let appliedCouponCode = null; // 🟢 متغير لحفظ كود الكوبون المطبق

    if (!pendingRaw) {
        alert('لا توجد بيانات حجز محفوظة. الرجاء البدء من جديد.');
        window.location.href = 'booking.html';
        return;
    }

    const pendingBooking = JSON.parse(pendingRaw);

    const paymentLabels = {
        cash: '💵 الدفع نقداً عند التنفيذ',
        online: '💳 الدفع الإلكتروني',
    };

    function renderSummary() {
        const box = document.getElementById('finalSummary');

        const recipientLine = pendingBooking.for_self
            ? `<p><strong>الحجز لـ:</strong> نفسي (${pendingBooking.display_name || 'حسابي'})</p>`
            : `<p><strong>الحجز لشخص آخر:</strong> ${pendingBooking.display_name || ''}</p>`;

        const addressLine = !pendingBooking.for_self
            ? `<p><strong>العنوان:</strong> ${pendingBooking.city} - ${pendingBooking.neighborhood} - ${pendingBooking.street}</p>`
            : '';

        box.innerHTML = `
            ${recipientLine}
            ${addressLine}
            <p><strong>طريقة الدفع:</strong> ${paymentLabels[selectedPaymentMethod]}</p>
        `;
    }

    renderSummary();

    document.getElementById('applyCouponBtn').addEventListener('click', function () {
        const couponInput = document.getElementById('couponCode').value.trim();
        const messageElement = document.getElementById('couponMessage');

        const serviceId = pendingBooking.service_id || localStorage.getItem('service_id');
        const totalPrice = (pendingBooking.service_options && pendingBooking.service_options.total_price) || 0;

        fetch(`${API_BASE_URL}/coupons/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ 
                code: couponInput,
                service_id: serviceId,
                total_amount: totalPrice 
            }),
        })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'كود الخصم غير صالح');
                }
                return data;
            })
            .then(data => {
                appliedCouponCode = data.coupon_code;
                messageElement.style.color = 'green';
                messageElement.innerText = `${data.message} | الخصم: ${data.discount_amount} ل.س | السعر النهائي: ${data.final_price} ل.س`;
            })
            .catch(error => {
                appliedCouponCode = null;
                messageElement.style.color = 'red';
                messageElement.innerText = error.message;
            });
    });

    document.getElementById('confirmBookingBtn').addEventListener('click', function () {
        const bookingData = { ...pendingBooking };
        delete bookingData.display_name;
        bookingData.payment_method = selectedPaymentMethod;

        // 🟢 إرسال الكوبون للباك أند إذا تم تطبيقه
        if (appliedCouponCode) {
            bookingData.coupon_code = appliedCouponCode;
        }

        fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(bookingData),
        })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) {
                    if (data.errors) {
                        throw new Error(Object.values(data.errors).flat().join('\n'));
                    }
                    throw new Error(data.message || 'حدث خطأ في طلب الحجز');
                }
                return data;
            })
            .then(data => {
                if (selectedPaymentMethod === 'online') {
                    payForBooking(data.booking.id);
                } else {
                    finishBooking('تم إرسال طلب الحجز بنجاح! سيتم التواصل معك قريباً.');
                }
            })
            .catch(error => {
                alert('فشل الحجز:\n' + error.message);
            });
    });

    function payForBooking(bookingId) {
        const cardData = pendingCardRaw ? JSON.parse(pendingCardRaw) : {};

        fetch(`${API_BASE_URL}/bookings/${bookingId}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(cardData),
        })
            .then(async response => {
                const result = await response.json();
                if (!response.ok) throw result;
                return result;
            })
            .then(() => {
                finishBooking('تم إرسال الحجز والدفع بنجاح!');
            })
            .catch(error => {
                alert('تم إرسال الحجز، لكن فشلت عملية الدفع: ' + (error.message || 'خطأ غير معروف'));
                finishBooking(null);
            });
    }

    function finishBooking(message) {
        if (message) alert(message);
        localStorage.removeItem('service_id');
        localStorage.removeItem('service_options');
        localStorage.removeItem('pending_booking');
        localStorage.removeItem('selected_payment_method');
        localStorage.removeItem('pending_card');
        window.location.href = '../homeline.html';
    }
});