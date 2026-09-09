/* =====================================================
   Home Line - booking.html
   (توجيه حجوزات الكهرباء والسباكة مباشرة لصفحة إكمال البيانات)
===================================================== */

function goToBooking(serviceId) {
    localStorage.setItem('service_id', serviceId);
    localStorage.removeItem('service_options');
    window.location.href = 'custmer-info.html';
}