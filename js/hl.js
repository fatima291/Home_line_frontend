/* =====================================================
   Home Line - homeline.html scripts
   (نافبار متحرك + سلايدر العروض + الخدمات + البحث + الحساب)
===================================================== */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

let allServices = []; // نخزن كل الخدمات هون حتى نقدر نفلترها لاحقاً

document.addEventListener('DOMContentLoaded', () => {
    fetchServices();
    fetchPublicCoupons();
    setupAuthButton();
    setupSearch();
});

/* =========================================
   تأثير النافبار عند التمرير
========================================= */

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');

    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

/* =========================================
   سلايدر العروض (تمرير تلقائي)
========================================= */

const slider = document.querySelector('.offers-slider');
let scrollAmount = 0;

setInterval(() => {
    scrollAmount += 340;

    if (scrollAmount >= slider.scrollWidth - slider.clientWidth) {
        scrollAmount = 0;
    }

    slider.scrollTo({
        left: scrollAmount,
        behavior: 'smooth',
    });
}, 3000);

/* =========================================
   جلب وعرض الكوبونات الديناميكية
========================================= */

function fetchPublicCoupons() {
    fetch(`${API_BASE_URL}/coupons`)
        .then(response => {
            if (!response.ok) throw new Error('فشل تحميل الكوبونات');
            return response.json();
        })
        .then(coupons => {
            const slider = document.querySelector('.offers-slider');
            if (!slider) return;

            const activeCoupons = coupons.filter(c => c.is_active);

            if (activeCoupons.length === 0) {
                document.querySelector('.offers').style.display = 'none';
                return;
            }

            document.querySelector('.offers').style.display = 'block';
            slider.innerHTML = ''; 

            // الألوان المتاحة في ملف الـ CSS لتتناوب عليها الكوبونات مهما كان عددها
            const cardStyles = ['', 'coupon-blue', 'coupon-light'];

            activeCoupons.forEach((coupon, index) => {
                // تدوير الألوان المتاحة على الكوبونات تلقائياً
                const colorClass = cardStyles[index % cardStyles.length];

                // صياغة تفاصيل القيمة والوصف بناءً على نوع وقيمة الكوبون المضاف في الباك إند
                const isPercentage = coupon.type === 'percentage';
                const discountDisplay = isPercentage
                    ? `<strong>${Math.round(coupon.value)}</strong><span>%</span>`
                    : `<strong>${Math.round(coupon.value)}</strong><span>ل.س</span>`;

                let titleText = '';
                let descriptionText = '';

                if (isPercentage) {
                    titleText = 'خصم على خدمات المنزل';
                    descriptionText = `احصلي على خصم ${Math.round(coupon.value)}% عند استخدام الكود`;
                } else {
                    titleText = 'خصم مباشر على الحجز';
                    descriptionText = `خصم ${Math.round(coupon.value)} ل.س عند استخدام الكود`;
                }

                if (coupon.min_order_amount > 0) {
                    descriptionText += ` (للطلبات من ${coupon.min_order_amount} ل.س وأكثر)`;
                }

                const card = document.createElement('article');
                card.className = `coupon-card ${colorClass}`.trim();

                card.innerHTML = `
                    <div class="coupon-main">
                        <span class="coupon-badge">عرض خاص</span>

                        <div class="coupon-discount ${!isPercentage ? 'fixed' : ''}">
                            ${discountDisplay}
                        </div>

                        <div class="coupon-title">${titleText}</div>

                        <p class="coupon-description">
                            ${descriptionText}
                        </p>
                    </div>

                    <div class="coupon-side">
                        <span class="coupon-label">كود الخصم</span>
                        <strong class="coupon-code">${coupon.code}</strong>
                        <button class="copy-coupon" type="button" onclick="copyCode('${coupon.code}')">
                            <i class="fa-regular fa-copy"></i>
                            نسخ الكود
                        </button>
                    </div>
                `;

                slider.appendChild(card);
            });

        })
        .catch(error => {
            console.error('خطأ بجلب الكوبونات:', error);
        });
}

/* =========================================
   جلب وعرض الخدمات من الـ API
========================================= */

function fetchServices() {
    fetch(`${API_BASE_URL}/services`)
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل تحميل الخدمات');
            }
            return response.json();
        })
        .then(services => {
            allServices = services;
            renderServices(allServices);
        })
        .catch(error => {
            console.error('خطأ بجلب الخدمات:', error);
        });
}

function renderServices(services) {
    const container = document.getElementById('services-container');
    const noResultsMsg = document.getElementById('noResultsMsg');

    container.innerHTML = '';

    if (services.length === 0) {
        noResultsMsg.style.display = 'block';
        return;
    }

    noResultsMsg.style.display = 'none';

    services.forEach(service => {
        const card = document.createElement('div');
        card.classList.add('service-card');

        card.innerHTML = `
            <img src="${service.image}" alt="${service.name}">
    
            <h3>${service.name}</h3>

           <div class="service-rating" id="rating-${service.id}">
                <span>جاري تحميل التقييم...</span>
          </div>

          <a 
              href="html/service-details.html?id=${service.id}" 
              class="reviews-link"  >
              عرض التقييمات
          </a>

         <div class="service-overlay">
              <p>${service.description}</p>
          </div>
         `;



        container.appendChild(card);

        loadServiceRating(service.id);
    });
}

function loadServiceRating(serviceId) {
    fetch(`${API_BASE_URL}/reviews?service_id=${serviceId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل تحميل التقييم');
            }

            return response.json();
        })
        .then(data => {
            const ratingElement = document.getElementById(`rating-${serviceId}`);

            if (!ratingElement) return;

            if (data.total_reviews === 0) {
                ratingElement.innerHTML = `
                    <span>⭐ لا توجد تقييمات بعد</span>
                `;
                return;
            }

            ratingElement.innerHTML = `
                <span class="rating-stars">⭐</span>
                <strong>${data.average_rating}</strong>
                <span>(${data.total_reviews} تقييم)</span>
            `;
        })
        .catch(error => {
            console.error(`خطأ بتقييم الخدمة ${serviceId}:`, error);

            const ratingElement = document.getElementById(`rating-${serviceId}`);

            if (ratingElement) {
                ratingElement.innerHTML = '';
            }
        });
}


/* =========================================
   البحث بالخدمات (فلترة محلية على البيانات المحمّلة أصلاً)
========================================= */

function setupSearch() {
    const searchInput = document.getElementById('serviceSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const query = this.value.trim().toLowerCase();

        if (query === '') {
            renderServices(allServices);
            return;
        }

        const filtered = allServices.filter(service =>
            service.name.toLowerCase().includes(query) ||
            (service.description && service.description.toLowerCase().includes(query))
        );

        renderServices(filtered);
    });
}

/* =========================================
   زر تسجيل الدخول / أيقونة الحساب
========================================= */

function setupAuthButton() {
    const profileIcon = document.getElementById('profileIcon');
    const authBtn = document.getElementById('authBtn');
    if (!profileIcon || !authBtn) return;

    const token = localStorage.getItem('auth_token');

    // الأيقونة الدائرية: توديك لحسابك لو مسجلة دخول، أو لصفحة اللوجن لو لأ
    profileIcon.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = token ? 'html/account.html' : 'html/login.html';
    });

    if (token) {
        // مسجلة دخول: نخفي زر "تسجيل الدخول" تماماً
        authBtn.style.display = 'none';

        // نجيب صورتها ونعرضها بدل أيقونة الشخص العامة
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
                if (customer.avatar) {
                    profileIcon.innerHTML = `<img src="http://127.0.0.1:8000${customer.avatar}" class="profile-avatar-img">`;
                }
            })
            .catch(() => {
                localStorage.removeItem('auth_token');
            });
    } else {
        // مو مسجلة دخول: نظهر زر "تسجيل الدخول" جنب الأيقونة
        authBtn.style.display = 'inline-block';
        authBtn.textContent = 'تسجيل الدخول';
        authBtn.href = 'html/login.html';
    }
}

/* =========================================
   دالة نسخ الكود 
========================================= */

function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        // إنشاء عنصر التنبيه النصي العائم
        const toast = document.createElement('div');
        toast.textContent = `تم نسخ كود الخصم: ${code}`;
        
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0b3c5d',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: "'Cairo', sans-serif",
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '9999',
            transition: 'opacity 0.3s ease'
        });

        document.body.appendChild(toast);

        // إخفاء وحذف التنبيه تلقائياً بعد ثانيتين دون المطالبة بـ OK
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }).catch(err => {
        console.error('فشل النسخ:', err);
    });
}