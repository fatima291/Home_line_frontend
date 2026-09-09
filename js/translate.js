// 1. دالة مسح كوكيز الترجمة لضمان العودة للغة العربية الأصيلة
function clearGoogleTranslateCookie() {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + window.location.hostname + "; path=/;";
}

// 2. دالة تهيئة أداة جوجل (تُستدعى تلقائياً من مكتبة جوجل)
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'ar',
        includedLanguages: 'ar,en',
        autoDisplay: false
    }, 'google_translate_element');
}

// 3. دالة تغيير اللغة عند اختيار المستخدم من القائمة المنسدلة
function changeSiteLanguage(selectedLang) {
    const select = document.querySelector('.goog-te-combo');

    if (selectedLang === 'ar') {
        clearGoogleTranslateCookie();
        sessionStorage.setItem('preferred_lang', 'ar');
        location.reload(); // إعادة التحميل لفتح الصفحة بالعربية
    } else {
        if (!select) {
            alert('أداة الترجمة ما زالت قيد التحميل، الرجاء الانتظار ثانية...');
            return;
        }
        sessionStorage.setItem('preferred_lang', 'en');
        select.value = 'en';
        select.dispatchEvent(new Event('change'));
    }
}

// 4. استماع لحالة الصفحة والقائمة المنسدلة عند التحميل
document.addEventListener('DOMContentLoaded', function () {
    const langSelect = document.getElementById('customLanguageSelect');
    const userPref = sessionStorage.getItem('preferred_lang');

    // إذا لم يحدد المستخدم الإنجليزية، افتح الصفحة بالعربية دائماً
    if (userPref !== 'en') {
        clearGoogleTranslateCookie();
        if (langSelect) langSelect.value = 'ar';
    } else {
        if (langSelect) langSelect.value = 'en';
    }

    if (langSelect) {
        langSelect.addEventListener('change', function () {
            changeSiteLanguage(this.value);
        });
    }
});