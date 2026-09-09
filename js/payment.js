let selectedPaymentMethod = 'cash';

document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'http://127.0.0.1:8000/api';

    const pendingBookingCheck = JSON.parse(localStorage.getItem('pending_booking') || '{}');
    const noPriceServices = [1, 5, 6];

    let paymentSelected = true; // افتراضياً true للخدمات العادية (فيها اختيار مسبق)

    if (noPriceServices.includes(pendingBookingCheck.service_id)) {
        document.querySelector('.payment-method[data-value="online"]').style.display = 'none';
        selectedPaymentMethod = null;
        paymentSelected = false;

        const cashCard = document.querySelector('.payment-method[data-value="cash"]');
        cashCard.classList.add('cash-only-highlight');
    }

    const pendingRaw = localStorage.getItem('pending_booking');
    if (!pendingRaw) {
        alert('لا توجد بيانات حجز محفوظة. الرجاء البدء من جديد.');
        window.location.href = 'booking.html';
        return;
    }

    document.querySelectorAll('.payment-method').forEach(function (card) {
        card.addEventListener('click', function () {
            document.querySelectorAll('.payment-method').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            selectedPaymentMethod = this.dataset.value;
            paymentSelected = true; // ✅ تأكيد إنه المستخدم اختار فعلياً

            document.getElementById('cardFields').style.display =
                selectedPaymentMethod === 'online' ? 'block' : 'none';
        });
    });

    document.getElementById('continueBtn').addEventListener('click', function () {
        if (!paymentSelected) {
            alert('الرجاء الضغط على "الدفع نقداً" أولاً للمتابعة');
            return;
        }

        if (selectedPaymentMethod === 'online') {
            const cardNumber = document.getElementById('cardNumber').value;
            const cardHolder = document.getElementById('cardHolder').value;
            const expiryMonth = document.getElementById('expiryMonth').value;
            const expiryYear = document.getElementById('expiryYear').value;
            const cvv = document.getElementById('cvv').value;

            if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
                alert('الرجاء تعبئة كل بيانات البطاقة');
                return;
            }

            localStorage.setItem('pending_card', JSON.stringify({
                card_number: cardNumber,
                card_holder: cardHolder,
                expiry_month: expiryMonth,
                expiry_year: expiryYear,
                cvv: cvv,
            }));
        } else {
            localStorage.removeItem('pending_card');
        }

        localStorage.setItem('selected_payment_method', selectedPaymentMethod);
        window.location.href = 'booking-summary.html';
    });
});