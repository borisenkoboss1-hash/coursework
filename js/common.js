/* ========================================================
   common.js — общий JavaScript для ВСЕХ страниц
   ======================================================== */

// ---------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----------

function форматЦены(число) {
    return Number(число).toLocaleString('ru-RU') + ' ₽';
}

function звёзды(рейтинг) {
    let html = '';
    for (let i = 1; i <= 5; i++) html += i <= Math.round(рейтинг) ? '★' : '☆';
    return html;
}

function уведомление(текст, тип) {
    тип = тип || 'info';
    const контейнер = document.getElementById('контейнер-уведомлений');
    if (!контейнер) return;
    const блок = document.createElement('div');
    блок.className = 'уведомление ' + (тип === 'успех' ? 'успех' : тип === 'ошибка' ? 'ошибка' : '');
    блок.textContent = (тип === 'успех' ? '✓ ' : тип === 'ошибка' ? '✕ ' : 'ℹ ') + текст;
    контейнер.appendChild(блок);
    setTimeout(function() { блок.remove(); }, 3000);
}

function процентСкидки(цена, стараяЦена) {
    if (!стараяЦена) return 0;
    return Math.round((1 - цена / стараяЦена) * 100);
}

// ---------- КОРЗИНА И ИЗБРАННОЕ ----------

function получитьКорзину()      { return JSON.parse(localStorage.getItem('корзина')      || '[]'); }
function получитьИзбранное()    { return JSON.parse(localStorage.getItem('избранное')    || '[]'); }
function получитьПользователя() { return JSON.parse(localStorage.getItem('пользователь') || 'null'); }

function обновитьСчётчики() {
    var сК = document.getElementById('счетчик-корзины');
    var сИ = document.getElementById('счетчик-избранного');
    if (сК) сК.textContent = получитьКорзину().length;
    if (сИ) сИ.textContent = получитьИзбранное().length;
}

function вКорзине(id)   { return получитьКорзину().some(function(т) { return т.idТовара === id; }); }
function вИзбранном(id) { return получитьИзбранное().some(function(т) { return т.idТовара === id; }); }

function добавитьВКорзину(id) {
    var польз = получитьПользователя();
    if (!польз) {
        уведомление('Войдите в аккаунт, чтобы добавить в корзину', 'ошибка');
        открытьМодалкуВхода();
        return false;
    }
    if (вКорзине(id)) { уведомление('Товар уже в корзине'); return false; }
    var корзина = получитьКорзину();
    корзина.push({ id: Date.now(), idПользователя: польз.id, idТовара: id, количество: 1 });
    localStorage.setItem('корзина', JSON.stringify(корзина));
    обновитьСчётчики();
    уведомление('Товар добавлен в корзину', 'успех');
    return true;
}

function удалитьИзКорзины(id) {
    var корзина = получитьКорзину().filter(function(т) { return т.idТовара !== id; });
    localStorage.setItem('корзина', JSON.stringify(корзина));
    обновитьСчётчики();
    уведомление('Товар удалён из корзины');
}

function добавитьВИзбранное(id) {
    var польз = получитьПользователя();
    if (!польз) {
        уведомление('Войдите в аккаунт', 'ошибка');
        открытьМодалкуВхода();
        return false;
    }
    if (вИзбранном(id)) {
        var изб1 = получитьИзбранное().filter(function(т) { return т.idТовара !== id; });
        localStorage.setItem('избранное', JSON.stringify(изб1));
        обновитьСчётчики();
        уведомление('Удалено из избранного');
        return false;
    }
    var изб2 = получитьИзбранное();
    изб2.push({ id: Date.now(), idПользователя: польз.id, idТовара: id });
    localStorage.setItem('избранное', JSON.stringify(изб2));
    обновитьСчётчики();
    уведомление('Добавлено в избранное ♡', 'успех');
    return true;
}

// ---------- ТЕМА ----------

function инициализироватьТему() {
    if (localStorage.getItem('тема') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
    обновитьКнопкуТемы();
    var кнопка = document.getElementById('кнопка-темы');
    if (!кнопка) return;
    кнопка.onclick = function() {
        var тёмная = document.body.getAttribute('data-theme') === 'dark';
        if (тёмная) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('тема', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('тема', 'dark');
        }
        обновитьКнопкуТемы();
    };
}

function обновитьКнопкуТемы() {
    var кнопка = document.getElementById('кнопка-темы');
    if (!кнопка) return;
    кнопка.textContent = document.body.getAttribute('data-theme') === 'dark' ? '☀ Светлая' : '☾ Тёмная';
}

// ---------- ДОСТУПНОСТЬ ----------

function инициализироватьДоступность() {
    if (localStorage.getItem('доступность') === 'true') {
        document.body.setAttribute('data-a11y', 'true');
    }
    var размер = localStorage.getItem('размер-шрифта');
    if (размер) document.documentElement.style.fontSize = размер + 'px';

    var кнопка = document.getElementById('кнопка-доступности');
    if (!кнопка) return;
    кнопка.onclick = function() {
        var включён = document.body.getAttribute('data-a11y') === 'true';
        if (включён) {
            document.body.removeAttribute('data-a11y');
            localStorage.setItem('доступность', 'false');
            уведомление('Режим доступности выключен');
        } else {
            document.body.setAttribute('data-a11y', 'true');
            localStorage.setItem('доступность', 'true');
            уведомление('Режим доступности включён');
        }
    };
}

// ---------- ЯЗЫК ----------

var переводы = {
    ru: {
        'Все двери': 'Все двери', 'Входные двери': 'Входные двери',
        'Межкомнатные': 'Межкомнатные', 'Фурнитура': 'Фурнитура',
        'Доставка и установка': 'Доставка и установка', 'О нас': 'О нас',
        'Войти': 'Войти', 'Избранное': 'Избранное', 'Корзина': 'Корзина',
        'Поиск по каталогу...': 'Поиск по каталогу...'
    },
    en: {
        'Все двери': 'All doors', 'Входные двери': 'Entry doors',
        'Межкомнатные': 'Interior', 'Фурнитура': 'Hardware',
        'Доставка и установка': 'Delivery', 'О нас': 'About us',
        'Войти': 'Sign in', 'Избранное': 'Wishlist', 'Корзина': 'Cart',
        'Поиск по каталогу...': 'Search...'
    }
};

var текущийЯзык = localStorage.getItem('язык') || 'ru';

function инициализироватьЯзык() {
    document.querySelectorAll('[data-lang]').forEach(function(кнопка) {
        var яз = кнопка.getAttribute('data-lang');
        if (!яз) return;
        кнопка.classList.toggle('active', яз === текущийЯзык);
        кнопка.onclick = function() {
            текущийЯзык = яз;
            localStorage.setItem('язык', яз);
            применитьПеревод();
            document.querySelectorAll('[data-lang]').forEach(function(к) {
                к.classList.toggle('active', к.getAttribute('data-lang') === яз);
            });
        };
    });
    применитьПеревод();
}

function применитьПеревод() {
    var пер = переводы[текущийЯзык];
    document.querySelectorAll('[data-i18n]').forEach(function(эл) {
        var ключ = эл.getAttribute('data-i18n');
        if (пер[ключ]) эл.textContent = пер[ключ];
    });
    document.querySelectorAll('.ссылка-меню, .моб-меню a').forEach(function(эл) {
        var текст = эл.textContent.trim();
        if (пер[текст]) эл.textContent = пер[текст];
    });
    var поиск = document.querySelector('.поле-поиска');
    if (поиск) поиск.placeholder = пер['Поиск по каталогу...'] || 'Поиск...';
}

// ---------- БУРГЕР ----------

function инициализироватьБургер() {
    var бургер  = document.getElementById('бургер');
    var оверлей = document.getElementById('моб-оверлей');
    var меню    = document.getElementById('моб-меню');
    if (!бургер || !меню || !оверлей) return;

    бургер.onclick = function() {
        оверлей.style.display = 'block';
        меню.style.display = 'block';
        requestAnimationFrame(function() { меню.classList.add('открыто'); });
    };

    function закрыть() {
        меню.classList.remove('открыто');
        setTimeout(function() {
            оверлей.style.display = 'none';
            меню.style.display = 'none';
        }, 300);
    }

    оверлей.onclick = закрыть;
    меню.querySelectorAll('a').forEach(function(а) {
        а.addEventListener('click', закрыть);
    });
}

// ---------- КНОПКА НАВЕРХ ----------

function инициализироватьКнопкуНаверх() {
    var кнопка = document.getElementById('кнопка-наверх');
    if (!кнопка) return;
    window.addEventListener('scroll', function() {
        кнопка.classList.toggle('visible', window.scrollY > 400);
    });
    кнопка.onclick = function() { window.scrollTo({ top: 0, behavior: 'smooth' }); };
}

// ---------- МОДАЛЬНОЕ ОКНО ВХОДА ----------

function открытьМодалкуВхода() {
    var м = document.getElementById('модалка-входа');
    if (м) { м.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function закрытьМодалкуВхода() {
    var м = document.getElementById('модалка-входа');
    if (м) { м.classList.remove('active'); document.body.style.overflow = ''; }
}

function инициализироватьВход() {
    var польз  = получитьПользователя();
    var ссылка = document.getElementById('ссылка-вход');

    if (польз && ссылка) {
        ссылка.innerHTML = '<span>👤</span><span class="текст-иконки">' + польз.name.split(' ')[0] + '</span>';
        ссылка.href = польз.role === 'admin' ? 'admin.html' : 'profile.html';
    } else if (ссылка) {
        ссылка.href = '#';
        ссылка.onclick = function(e) { e.preventDefault(); открытьМодалкуВхода(); };
    }

    var закрытьКн = document.getElementById('закрыть-модалку');
    if (закрытьКн) закрытьКн.onclick = закрытьМодалкуВхода;

    var модалка = document.getElementById('модалка-входа');
    if (модалка) {
        модалка.addEventListener('click', function(e) {
            if (e.target === модалка) закрытьМодалкуВхода();
        });
    }

    var кнВойти = document.getElementById('кнопка-входа');
    if (!кнВойти) return;

    кнВойти.onclick = async function() {
        var emailПоле  = document.getElementById('email-входа');
        var парольПоле = document.getElementById('пароль-входа');
        if (!emailПоле || !парольПоле) return;
        var email  = emailПоле.value.trim();
        var пароль = парольПоле.value;
        if (!email || !пароль) { уведомление('Заполните все поля', 'ошибка'); return; }
        try {
            var resp = await fetch('data/users.json');
            var список = await resp.json();
            var найден = список.find(function(u) { return u.email === email && u.password === пароль; });
            if (найден) {
                localStorage.setItem('пользователь', JSON.stringify(найден));
                уведомление('Добро пожаловать, ' + найден.name + '!', 'успех');
                закрытьМодалкуВхода();
                setTimeout(function() { location.reload(); }, 500);
            } else {
                уведомление('Неверный email или пароль', 'ошибка');
            }
        } catch(err) {
            уведомление('Ошибка подключения. Запустите через Live Server.', 'ошибка');
        }
    };
}

// ---------- ПРЕЛОАДЕР ----------

function скрытьПрелоадер() {
    setTimeout(function() {
        var п = document.getElementById('прелоадер');
        if (п) п.classList.add('hidden');
    }, 400);
}

// ---------- СБРОС НАСТРОЕК ----------

function инициализироватьСброс() {
    var кнопка = document.getElementById('кнопка-сброса');
    if (!кнопка) return;
    кнопка.onclick = function() {
        if (confirm('Сбросить настройки (тема, язык, доступность)?')) {
            // Сохраняем пользователя, корзину и избранное
            var польз   = localStorage.getItem('пользователь');
            var корзина = localStorage.getItem('корзина');
            var изб     = localStorage.getItem('избранное');
            localStorage.clear();
            if (польз)   localStorage.setItem('пользователь', польз);
            if (корзина) localStorage.setItem('корзина', корзина);
            if (изб)     localStorage.setItem('избранное', изб);
            location.reload();
        }
    };
}

// ---------- ЗАПУСК ----------

document.addEventListener('DOMContentLoaded', function() {
    инициализироватьТему();
    инициализироватьДоступность();
    инициализироватьЯзык();
    инициализироватьБургер();
    инициализироватьКнопкуНаверх();
    инициализироватьВход();
    инициализироватьСброс();
    обновитьСчётчики();
    скрытьПрелоадер();
});

// ==================== ВСПЛЫВАЮЩЕЕ ОКНО КОРЗИНЫ В ШАПКЕ ====================

async function инициализироватьПопапКорзины() {
    // Создаём popup-контейнер вокруг иконки корзины
    const иконкаКорзины = document.querySelector('a[href="cart.html"].иконка-ссылка');
    if (!иконкаКорзины) return;

    // Добавляем класс и создаём popup
    иконкаКорзины.parentElement.style.position = 'relative';
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.id = 'popup-корзины';
    иконкаКорзины.parentElement.appendChild(popup);

    // Показываем при наведении
    иконкаКорзины.addEventListener('mouseenter', () => показатьПопапКорзины(popup));
    popup.addEventListener('mouseenter', () => popup.classList.add('active'));
    popup.addEventListener('mouseleave', () => popup.classList.remove('active'));
    иконкаКорзины.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!popup.matches(':hover')) popup.classList.remove('active');
        }, 100);
    });
}

async function показатьПопапКорзины(popup) {
    popup.classList.add('active');
    const корзина = получитьКорзину();

    if (корзина.length === 0) {
        popup.innerHTML = '<div class="popup-пусто">🛒 Корзина пуста</div><a href="catalog.html" class="popup-кнопка">Перейти в каталог</a>';
        return;
    }

    try {
        const resp = await fetch('data/products.json');
        const товары = await resp.json();
        const элементы = корзина.slice(0, 4);
        let итого = 0;

        const строки = элементы.map(з => {
            const т = товары.find(т => т.id === з.idТовара);
            if (!т) return '';
            const сумма = т.price * (з.количество || 1);
            итого += сумма;
            return `<div class="popup-строка">
                <span class="popup-назв">${т.name}</span>
                <span class="popup-цена">${форматЦены(т.price)}</span>
            </div>`;
        }).join('');

        const доп = корзина.length > 4 ? `<div style="font-size:11px;color:var(--текст-светлый);text-align:center;padding:4px 0;">...и ещё ${корзина.length - 4} товар(а)</div>` : '';

        popup.innerHTML = строки + доп +
            `<div class="popup-итого"><span>Итого:</span><span>${форматЦены(итого)}</span></div>` +
            `<a href="cart.html" class="popup-кнопка">Оформить заказ →</a>`;
    } catch {
        popup.innerHTML = '<a href="cart.html" class="popup-кнопка">Открыть корзину →</a>';
    }
}

// ==================== ССЫЛКА НА ВЕРСИЮ ДЛЯ СЛАБОВИДЯЩИХ ====================

// ==================== ССЫЛКИ НА ВЕРСИЮ ДЛЯ СЛАБОВИДЯЩИХ ====================
// Автоматически добавляются в подвал ВСЕХ страниц

document.addEventListener('DOMContentLoaded', function() {
    // Не добавляем на самой странице для слабовидящих
    if (window.location.pathname.includes('accessible')) return;

    // Ищем блок низ-подвала
    var низ = document.querySelector('.низ-подвала');
    if (!низ) return;

    // Проверяем что ссылки ещё не добавлены
    if (низ.querySelector('.ссылка-доступности-главная')) return;

    // Создаём блок со всеми ссылками
    var блок = document.createElement('div');
    блок.style.cssText = 'display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap;';
    блок.innerHTML = `
        <a href="accessible.html" class="ссылка-доступности-главная" style="color:#888; font-size:12px; text-decoration:none;">👁 Версия для слабовидящих</a>
        <a href="accessible-catalog.html" style="color:#888; font-size:12px; text-decoration:none;">📋 Каталог</a>
        <a href="accessible-cart.html" style="color:#888; font-size:12px; text-decoration:none;">🛒 Корзина</a>
        <a href="accessible-delivery.html" style="color:#888; font-size:12px; text-decoration:none;">🚚 Доставка</a>
        <a href="accessible-about.html" style="color:#888; font-size:12px; text-decoration:none;">ℹ️ О нас</a>
    `;

    // Добавляем эффект при наведении
    блок.querySelectorAll('a').forEach(function(ссылка) {
        ссылка.addEventListener('mouseenter', function() { ссылка.style.color = '#f26522'; });
        ссылка.addEventListener('mouseleave', function() { ссылка.style.color = '#888'; });
    });

    низ.appendChild(блок);
});

// Добавляем в DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    добавитьСсылкуДоступности();
    // Popup корзины только на страницах с иконкой корзины
    if (document.querySelector('a[href="cart.html"].иконка-ссылка')) {
        инициализироватьПопапКорзины();
    }
});

// ==================== МОДАЛКА ЗАМЕРА ====================

document.addEventListener('DOMContentLoaded', function() {
    const кнЗамер    = document.getElementById('кнопка-замер');
    const модЗамер   = document.getElementById('модалка-замера');
    const закрЗамер  = document.getElementById('закрыть-замер');
    const отпрЗамер  = document.getElementById('отправить-замер');

    if (!кнЗамер || !модЗамер) return;

    кнЗамер.onclick = function() {
        модЗамер.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    закрЗамер && (закрЗамер.onclick = function() {
        модЗамер.classList.remove('active');
        document.body.style.overflow = '';
    });
    модЗамер.addEventListener('click', function(e) {
        if (e.target === модЗамер) { модЗамер.classList.remove('active'); document.body.style.overflow = ''; }
    });
    отпрЗамер && (отпрЗамер.onclick = function() {
        const имя = document.getElementById('замер-имя').value.trim();
        const тел = document.getElementById('замер-тел').value.trim();
        if (!имя || !тел) { уведомление('Заполните имя и телефон', 'ошибка'); return; }
        модЗамер.classList.remove('active');
        document.body.style.overflow = '';
        уведомление('Заявка принята! Перезвоним в течение 30 минут.', 'успех');
        document.getElementById('замер-имя').value = '';
        document.getElementById('замер-тел').value = '';
        document.getElementById('замер-адрес').value = '';
    });
});

// ==================== ССЫЛКА НА ВЕРСИЮ ДЛЯ СЛАБОВИДЯЩИХ ====================
// Автоматически добавляется в подвал ВСЕХ страниц кроме самой accessible.html

document.addEventListener('DOMContentLoaded', function() {
    // Не добавляем на самой странице для слабовидящих
    if (window.location.pathname.includes('accessible.html')) return;

    // Ищем блок низ-подвала
    var низ = document.querySelector('.низ-подвала');
    if (!низ) return;

    // Проверяем что ссылка ещё не добавлена
    if (низ.querySelector('.ссылка-доступности')) return;

    var ссылка = document.createElement('a');
    ссылка.href = 'accessible.html';
    ссылка.className = 'ссылка-доступности';
    ссылка.innerHTML = '👁 Версия для слабовидящих';
    ссылка.style.cssText = 'color:#888; font-size:12px; text-decoration:none; display:inline-flex; align-items:center; gap:4px;';
    ссылка.addEventListener('mouseenter', function() { ссылка.style.color = '#f26522'; });
    ссылка.addEventListener('mouseleave', function() { ссылка.style.color = '#888'; });
    низ.appendChild(ссылка);
});
