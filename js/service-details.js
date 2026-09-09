const API_BASE_URL = 'http://127.0.0.1:8000/api';

/* =========================================
   معرفة رقم الخدمة من الرابط
   مثال:
   service-details.html?id=5
========================================= */

const params = new URLSearchParams(window.location.search);
const serviceId = params.get('id');


document.addEventListener('DOMContentLoaded', () => {

    if (!serviceId) {
        showError('لم يتم تحديد الخدمة');
        return;
    }

    loadServiceDetails();
    loadReviews();

});


/* =========================================
   جلب معلومات الخدمة
========================================= */

function loadServiceDetails() {

    fetch(`${API_BASE_URL}/services`)
        .then(response => {

            if (!response.ok) {
                throw new Error('فشل تحميل الخدمات');
            }

            return response.json();
        })
        .then(services => {

            const service = services.find(
                item => String(item.id) === String(serviceId)
            );

            if (!service) {
                showError('الخدمة غير موجودة');
                return;
            }

            document.getElementById('serviceName').textContent =
                `تقييمات ${service.name}`;

        })
        .catch(error => {

            console.error('خطأ بجلب الخدمة:', error);

            showError('حدث خطأ أثناء تحميل بيانات الخدمة');

        });

}


/* =========================================
   جلب التقييمات
========================================= */

function loadReviews() {

    fetch(`${API_BASE_URL}/reviews?service_id=${serviceId}`)
        .then(response => {

            if (!response.ok) {
                throw new Error('فشل تحميل التقييمات');
            }

            return response.json();

        })
        .then(data => {

            updateRatingSummary(data);

            renderReviews(data.reviews || []);

        })
        .catch(error => {

            console.error('خطأ بجلب التقييمات:', error);

            showError('حدث خطأ أثناء تحميل التقييمات');

        });

}


/* =========================================
   عرض متوسط التقييم
========================================= */

function updateRatingSummary(data) {

    const averageRating =
        Number(data.average_rating || 0);

    const totalReviews =
        Number(data.total_reviews || 0);


    document.getElementById('averageRating').textContent =
        averageRating;


    document.getElementById('totalReviews').textContent =
        `${totalReviews} تقييم`;

}


/* =========================================
   عرض التقييمات
========================================= */

function renderReviews(reviews) {

    const container =
        document.getElementById('reviewsList');


    if (reviews.length === 0) {

        container.innerHTML = `
            <p class="no-reviews">
                لا توجد تقييمات بعد لهذه الخدمة
            </p>
        `;

        return;
    }


    container.innerHTML = '';


    reviews.forEach(review => {

        const card =
            document.createElement('div');

        card.classList.add('review-card');


        const customer =
            review.customer || {};


        const customerName =
            customer.full_name || 'عميل';


        const avatar =
            customer.avatar
                ? `http://127.0.0.1:8000${customer.avatar}`
                : '../imegs/default-avatar.png';


        const stars =
            createStars(review.rating);


        const date =
            formatReviewDate(review.created_at);


        card.innerHTML = `

            <div class="review-top">

                <img
                    src="${avatar}"
                    alt="${customerName}"
                    class="review-avatar"
                >

                <div class="review-user">

                    <h3>
                        ${customerName}
                    </h3>

                    <div class="review-stars">
                        ${stars}
                    </div>

                </div>

                <span class="review-date">
                    ${date}
                </span>

            </div>

            ${
                review.comment
                    ? `
                        <p class="review-comment">
                            ${review.comment}
                        </p>
                    `
                    : ''
            }

        `;


        container.appendChild(card);

    });

}


/* =========================================
   إنشاء النجوم
========================================= */

function createStars(rating) {

    let stars = '';

    for (let i = 1; i <= 5; i++) {

        if (i <= rating) {

            stars += '★';

        } else {

            stars += '☆';

        }

    }

    return stars;

}


/* =========================================
   تنسيق التاريخ
========================================= */

function formatReviewDate(dateString) {

    if (!dateString) {
        return '';
    }

    const date = new Date(dateString);

    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

}


/* =========================================
   عرض رسالة خطأ
========================================= */

function showError(message) {

    const container =
        document.getElementById('reviewsList');

    if (!container) return;

    container.innerHTML = `
        <p class="error-message">
            ${message}
        </p>
    `;

}

