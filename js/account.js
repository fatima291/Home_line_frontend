const API_BASE_URL = 'http://127.0.0.1:8000/api';
const token = localStorage.getItem('auth_token');

if (!token) {
    window.location.href = 'login.html';
}

const statusLabels = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغى',
};

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadBookings();
    setupEditButtons();
    setupLogout();
    setupAvatarUpload();
});

function loadProfile() {
    fetch(`${API_BASE_URL}/me`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    })
        .then(res => {
            if (!res.ok) throw new Error('unauthenticated');
            return res.json();
        })
        .then(customer => {
            document.getElementById('fullName').value = customer.full_name || '';
            document.getElementById('username').value = customer.username || '';
            document.getElementById('phone').value = customer.phone || '';
            document.getElementById('email').value = customer.email || '';
            document.getElementById('nationalId').value = customer.national_id || '';
            document.getElementById('city').value = customer.city || '';
            document.getElementById('neighborhood').value = customer.neighborhood || '';
            document.getElementById('street').value = customer.street || '';
            document.getElementById('buildingNumber').value = customer.building_number || '';
            document.getElementById('locationLink').value = customer.location_link || '';
            if (customer.avatar) {
                document.getElementById('avatarPreview').src = `http://127.0.0.1:8000${customer.avatar}`;
            }
        })
        .catch(() => {
            localStorage.removeItem('auth_token');
            window.location.href = 'login.html';
        });
}

function loadBookings() {
    fetch(`${API_BASE_URL}/my-bookings`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    })
        .then(res => res.json())
        .then(bookings => {
            renderBookings(bookings);
        })
        .catch(() => {
            document.getElementById('bookingsList').innerHTML =
                '<p class="empty-msg">حدث خطأ أثناء تحميل الحجوزات</p>';
        });
}

function renderBookings(bookings) {
    const container = document.getElementById('bookingsList');

    if (bookings.length === 0) {
        container.innerHTML = '<p class="empty-msg">لا توجد حجوزات حتى الآن</p>';
        return;
    }

    container.innerHTML = '';

    bookings.forEach(booking => {
        const card = document.createElement('div');
        card.classList.add('booking-card');

        const date = new Date(booking.created_at).toLocaleDateString('ar-EG');

        // أزرار التعديل/الإلغاء (تظهر بس لو الحجز قيد الانتظار)
        const actionButtons = booking.status === 'pending'
            ? `
               <button class="action-btn edit" data-id="${booking.id}">تعديل</button>
               <button class="action-btn cancel" data-id="${booking.id}">إلغاء</button>
             `
            : '';

        const reviewButton = booking.status === 'completed'
           ? `
             <button class="review-btn" data-id="${booking.id}">
              ⭐ قيّم الخدمة
             </button>
            `
            : '';    
            


        // حالة الدفع: 3 احتمالات
        let paymentBadge;
        if (booking.payment_status === 'paid') {
            paymentBadge = `<span class="payment-badge paid">✅ مدفوع</span>`;
        } else {
            paymentBadge = `<span class="payment-badge cash-pending">💵 دفع نقدي (بانتظار تأكيد الإدارة)</span>`;
        }

        // حساب السعر الأساسي (ديناميكي أو ثابت)
        const basePrice = (booking.service_options && booking.service_options.total_price)
            ? booking.service_options.total_price
            : (booking.service.price || null);

        let priceLine = '';
        if (basePrice) {
            priceLine = `<p><strong>السعر:</strong> ${basePrice} ل.س</p>`;

            if (booking.discount_amount > 0) {
                const finalPrice = basePrice - booking.discount_amount;
                priceLine += `<p class="coupon-applied"> كوبون "${booking.coupon_code}" — خصم ${booking.discount_amount} ل.س
                    <br> المبلغ النهائي: <strong>${finalPrice} ل.س</strong></p>`;
            }
        } else {
            priceLine = `<p><strong>السعر:</strong> يُحدد لاحقاً بعد التواصل</p>`;
        }

        card.innerHTML = `
            <img src="../${booking.service.image}" alt="${booking.service.name}">

            <div class="booking-info">
                <h3>${booking.service.name}</h3>
                <p>تاريخ الطلب: ${date}</p>
                <p>الاسم: ${booking.full_name}</p>
                ${priceLine}

                <div class="booking-buttons-row">
                    ${actionButtons}
                    ${reviewButton}
                </div>

                <div class="review-form" id="reviewForm-${booking.id}">
                   <div class="review-stars" id="reviewStars-${booking.id}">
                       <span data-rating="1">★</span>
                       <span data-rating="2">★</span>
                       <span data-rating="3">★</span>
                       <span data-rating="4">★</span>
                       <span data-rating="5">★</span>
                   </div>

                  <p class="selected-rating" id="selectedRating-${booking.id}">
                    اختار عدد النجوم
                  </p>

                  <textarea
                  id="reviewComment-${booking.id}"
                  placeholder="اكتب تعليقك هنا (اختياري)..."
                  maxlength="500"></textarea>

                  <div class="review-message" id="reviewMessage-${booking.id}"></div>

                     <div class="review-form-buttons">
                       <button class="send-review-btn" data-id="${booking.id}">
                         إرسال التقييم
                       </button>

                      <button class="cancel-review-btn" data-id="${booking.id}">
                         إلغاء
                      </button>
                     </div>
                  </div>
               </div>

            <div class="booking-actions">
                <span class="status-badge status-${booking.status}">${statusLabels[booking.status] || booking.status}</span>
                ${paymentBadge}
            </div>

            <div class="edit-form" id="editForm-${booking.id}">
                <div class="full-width">
                    <label>المدينة</label>
                    <input type="text" id="editCity-${booking.id}" value="${booking.city}">
                </div>
                <div>
                    <label>الحي</label>
                    <input type="text" id="editNeighborhood-${booking.id}" value="${booking.neighborhood}">
                </div>
                <div>
                    <label>الشارع</label>
                    <input type="text" id="editStreet-${booking.id}" value="${booking.street}">
                </div>
                <div>
                    <label>رقم المبنى</label>
                    <input type="text" id="editBuilding-${booking.id}" value="${booking.building_number || ''}">
                </div>
                <div>
                    <label>رابط الموقع</label>
                    <input type="text" id="editMapLink-${booking.id}" value="${booking.map_link || ''}">
                </div>
                <div class="full-width">
                    <label>ملاحظات</label>
                    <textarea id="editNotes-${booking.id}">${booking.notes || ''}</textarea>
                </div>
                <div class="form-buttons">
                    <button class="save-edit-btn" data-id="${booking.id}">حفظ التعديلات</button>
                    <button class="cancel-edit-btn" data-id="${booking.id}">إلغاء</button>
                </div>
            </div>

        `;

        container.appendChild(card);
    });

    document.querySelectorAll('.action-btn.cancel').forEach(btn => {
        btn.addEventListener('click', function () {
            cancelBooking(this.dataset.id);
        });
    });

    document.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', function () {
            document.getElementById(`editForm-${this.dataset.id}`).classList.toggle('active');
        });
    });

    document.querySelectorAll('.cancel-edit-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.getElementById(`editForm-${this.dataset.id}`).classList.remove('active');
        });
    });

    document.querySelectorAll('.save-edit-btn:not([data-action])').forEach(btn => {
        btn.addEventListener('click', function () {
            saveBookingEdit(this.dataset.id);
        });
    });

    document.querySelectorAll('.review-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const bookingId = this.dataset.id;

            const form = document.getElementById(`reviewForm-${bookingId}`);

            if (form) {
               form.classList.toggle('active');
            }
        });
    });

    document.querySelectorAll('.review-stars span').forEach(star => {
        star.addEventListener('click', function () {
             const rating = Number(this.dataset.rating);
             const starsContainer = this.parentElement;
             const bookingId = starsContainer.id.replace('reviewStars-', '');

             starsContainer.dataset.selectedRating = rating;

             const stars = starsContainer.querySelectorAll('span');

            stars.forEach(item => {
                const itemRating = Number(item.dataset.rating);

                 if (itemRating <= rating) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });

           const selectedText = document.getElementById(`selectedRating-${bookingId}`);

           if (selectedText) {
               selectedText.textContent = `التقييم: ${rating} من 5 ⭐`;
            }
        });
    });

    document.querySelectorAll('.cancel-review-btn').forEach(btn => {
        btn.addEventListener('click', function () {
           const bookingId = this.dataset.id;

           const form = document.getElementById(`reviewForm-${bookingId}`);

           if (form) {
               form.classList.remove('active');
            }
        });
    });

    document.querySelectorAll('.send-review-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            submitReview(this.dataset.id);
        });
    });


}

function cancelBooking(bookingId) {
    const confirmCancel = confirm('هل أنت متأكدة من رغبتك بإلغاء هذا الحجز؟');
    if (!confirmCancel) return;

    fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    })
        .then(async res => {
            const result = await res.json();
            if (!res.ok) throw result;
            return result;
        })
        .then(() => {
            alert('تم إلغاء الحجز بنجاح');
            loadBookings();
        })
        .catch(error => {
            alert(error.message || 'حدث خطأ أثناء إلغاء الحجز');
        });
}

function saveBookingEdit(bookingId) {
    const data = {
        city: document.getElementById(`editCity-${bookingId}`).value,
        neighborhood: document.getElementById(`editNeighborhood-${bookingId}`).value,
        street: document.getElementById(`editStreet-${bookingId}`).value,
        building_number: document.getElementById(`editBuilding-${bookingId}`).value || null,
        map_link: document.getElementById(`editMapLink-${bookingId}`).value || null,
        notes: document.getElementById(`editNotes-${bookingId}`).value || null,
    };

    fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(async res => {
            const result = await res.json();
            if (!res.ok) throw result;
            return result;
        })
        .then(() => {
            alert('تم تعديل الحجز بنجاح');
            loadBookings();
        })
        .catch(error => {
            alert(error.message || 'حدث خطأ أثناء التعديل');
        });
}

function setupEditButtons() {
    const inputs = document.querySelectorAll('.info-grid input');
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    let originalValues = {};

    editBtn.addEventListener('click', () => {
        inputs.forEach(input => {
            originalValues[input.id] = input.value;
            if (input.id !== 'username') {
                input.disabled = false;
            }
        });
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
    });

    cancelBtn.addEventListener('click', () => {
        inputs.forEach(input => {
            input.value = originalValues[input.id];
            input.disabled = true;
        });
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    });

    saveBtn.addEventListener('click', () => {
        const data = {
            full_name: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value || null,
            national_id: document.getElementById('nationalId').value,
            city: document.getElementById('city').value,
            neighborhood: document.getElementById('neighborhood').value,
            street: document.getElementById('street').value,
            building_number: document.getElementById('buildingNumber').value || null,
            location_link: document.getElementById('locationLink').value || null,
        };

        fetch(`${API_BASE_URL}/me`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(async res => {
                const result = await res.json();
                if (!res.ok) throw result;
                return result;
            })
            .then(() => {
                document.getElementById('profileSuccessMsg').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('profileSuccessMsg').style.display = 'none';
                }, 3000);

                inputs.forEach(input => input.disabled = true);
                editBtn.style.display = 'inline-block';
                saveBtn.style.display = 'none';
                cancelBtn.style.display = 'none';
            })
            .catch(error => {
                alert(error.message || 'حدث خطأ أثناء التحديث');
            });
    });
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function () {
        fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        })
            .finally(() => {
                localStorage.removeItem('auth_token');
                window.location.href = '../homeline.html';
            });
    });
}

function setupAvatarUpload() {
    document.getElementById('changeAvatarBtn').addEventListener('click', function () {
        document.getElementById('avatarInput').click();
    });

    document.getElementById('avatarInput').addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('حجم الصورة كبير جداً، الحد الأقصى 5 ميغابايت');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        fetch(`${API_BASE_URL}/me/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData,
        })
            .then(async res => {
                const result = await res.json();
                if (!res.ok) throw result;
                return result;
            })
            .then(result => {
                document.getElementById('avatarPreview').src = `http://127.0.0.1:8000${result.avatar}`;
                alert('تم تحديث الصورة الشخصية بنجاح');
            })
            .catch(error => {
                alert(error.message || 'حدث خطأ أثناء رفع الصورة');
            });
    });
}

function submitReview(bookingId) {

    const starsContainer = document.getElementById(`reviewStars-${bookingId}`);
    const commentInput = document.getElementById(`reviewComment-${bookingId}`);
    const messageBox = document.getElementById(`reviewMessage-${bookingId}`);
    const sendButton = document.querySelector(
        `.send-review-btn[data-id="${bookingId}"]`
    );

    const rating = Number(starsContainer.dataset.selectedRating);
    const comment = commentInput.value.trim();

    // التأكد من اختيار النجوم
    if (!rating || rating < 1 || rating > 5) {
        messageBox.textContent = 'الرجاء اختيار عدد النجوم';
        messageBox.className = 'review-message error';
        return;
    }

    // تعطيل الزر أثناء الإرسال
    sendButton.disabled = true;
    sendButton.textContent = 'جاري الإرسال...';

    messageBox.textContent = '';
    messageBox.className = 'review-message';

    fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            booking_id: Number(bookingId),
            rating: rating,
            comment: comment || null
        }),
    })
        .then(async res => {

            const result = await res.json();

            if (!res.ok) {
                throw {
                    status: res.status,
                    ...result
                };
            }

            return result;
        })
        .then(result => {

            messageBox.textContent =
                result.message || 'تم إضافة التقييم بنجاح';

            messageBox.className = 'review-message success';

            // إخفاء زر التقييم
            const reviewButton = document.querySelector(
                `.review-btn[data-id="${bookingId}"]`
            );

            if (reviewButton) {
                reviewButton.style.display = 'none';
            }

            // إخفاء الفورم بعد فترة بسيطة
            setTimeout(() => {
                const form = document.getElementById(
                    `reviewForm-${bookingId}`
                );

                if (form) {
                    form.classList.remove('active');
                }
            }, 1800);
        })
        .catch(error => {

            const message =
               error.message || 'حدث خطأ أثناء إرسال التقييم';

            messageBox.textContent = message;
            messageBox.className = 'review-message error';

           // إذا كان الحجز مقيماً مسبقاً
            if (
               message.includes('تم تقييم هذا الحجز مسبقاً')
              ) {
              const reviewButton = document.querySelector(
                   `.review-btn[data-id="${bookingId}"]`
               );

              if (reviewButton) {
                  reviewButton.style.display = 'none';
               }
            }

           sendButton.disabled = false;
           sendButton.textContent = 'إرسال التقييم';
       });
}