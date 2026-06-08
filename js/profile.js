/* ========================================================
   profile.js — логика личного кабинета
   ======================================================== */

let польз = получитьПользователя();
let всеТовары = [];

// ==================== ПРОВЕРКА ВХОДА ====================

if (!польз) {
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('блок-не-залогинен').style.display = 'block';
    });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('блок-профиль').style.display = 'block';
        инициализироватьПрофиль();
    });
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

async function инициализироватьПрофиль() {
    заполнитьДанные();
    инициализироватьНавигацию();
    инициализироватьФормуДанных();
    инициализироватьБезопасность();
    инициализироватьВыход();

    // Загружаем товары для избранного
    try {
        const resp = await fetch('data/products.json');
        всеТовары = await resp.json();
        нарисоватьИзбранное();
        нарисоватьЗаказы();
    } catch (e) {
        console.error('Ошибка загрузки:', e);
    }
}

// ==================== ЗАПОЛНЕНИЕ ДАННЫХ ====================

function заполнитьДанные() {
    // Аватар — первая буква имени
    const аватарЭл = document.getElementById('профиль-аватар');
    if (аватарЭл) аватарЭл.textContent = польз.name ? польз.name[0].toUpperCase() : '?';

    // Имя, email, роль в сайдбаре
    const имяЭл = document.getElementById('профиль-имя');
    const emailЭл = document.getElementById('профиль-email');
    const рольЭл  = document.getElementById('профиль-роль');
    if (имяЭл)  имяЭл.textContent  = польз.name  || '—';
    if (emailЭл) emailЭл.textContent = польз.email || '—';
    if (рольЭл)  рольЭл.textContent  = польз.role === 'admin' ? 'Администратор' : 'Пользователь';

    // Имя в шапке
    const имяШапка = document.getElementById('имя-в-шапке');
    if (имяШапка) имяШапка.textContent = польз.name ? польз.name.split(' ')[0] : 'Профиль';

    // Поля формы
    const поля = {
        'проф-имя':     польз.name     || '',
        'проф-email':   польз.email    || '',
        'проф-телефон': польз.phone    || '',
        'проф-дата':    польз.createdAt || '—',
        'проф-адрес':   польз.address  || ''
    };
    Object.entries(поля).forEach(([ид, знач]) => {
        const поле = document.getElementById(ид);
        if (поле) поле.value = знач;
    });
}

// ==================== НАВИГАЦИЯ ====================

function инициализироватьНавигацию() {
    document.querySelectorAll('.проф-ссылка[data-раздел]').forEach(ссылка => {
        ссылка.addEventListener('click', () => {
            const раздел = ссылка.getAttribute('data-раздел');

            document.querySelectorAll('.проф-ссылка').forEach(с => с.classList.remove('active'));
            ссылка.classList.add('active');

            document.querySelectorAll('.проф-раздел').forEach(р => р.classList.add('скрыт'));
            const цель = document.getElementById('раздел-' + раздел);
            if (цель) цель.classList.remove('скрыт');

            // Обновляем избранное при переходе в раздел
            if (раздел === 'избранное') нарисоватьИзбранное();
        });
    });
}

// ==================== ФОРМА ДАННЫХ ====================

function инициализироватьФормуДанных() {
    const форма = document.getElementById('форма-профиля');
    if (!форма) return;

    форма.addEventListener('submit', (e) => {
        e.preventDefault();

        const имя   = document.getElementById('проф-имя').value.trim();
        const email = document.getElementById('проф-email').value.trim();
        const ошибкаИмя   = document.getElementById('ошибка-проф-имя');
        const ошибкаEmail = document.getElementById('ошибка-проф-email');

        // Простая валидация
        let ок = true;
        if (!имя || имя.split(' ').length < 2) {
            ошибкаИмя.textContent = 'Введите имя и фамилию';
            document.getElementById('проф-имя').classList.add('ошибка');
            ок = false;
        } else {
            ошибкаИмя.textContent = '';
            document.getElementById('проф-имя').classList.remove('ошибка');
            document.getElementById('проф-имя').classList.add('успех');
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            ошибкаEmail.textContent = 'Неверный формат email';
            document.getElementById('проф-email').classList.add('ошибка');
            ок = false;
        } else {
            ошибкаEmail.textContent = '';
            document.getElementById('проф-email').classList.remove('ошибка');
            document.getElementById('проф-email').classList.add('успех');
        }
        if (!ок) return;

        // Обновляем пользователя в localStorage
        польз = {
            ...польз,
            name:    имя,
            email:   email,
            phone:   document.getElementById('проф-телефон').value.trim(),
            address: document.getElementById('проф-адрес').value.trim()
        };
        localStorage.setItem('пользователь', JSON.stringify(польз));

        // Обновляем отображение
        document.getElementById('профиль-имя').textContent = имя;
        document.getElementById('профиль-аватар').textContent = имя[0].toUpperCase();
        document.getElementById('имя-в-шапке').textContent = имя.split(' ')[0];

        уведомление('Данные успешно сохранены', 'успех');
    });

    // Кнопка отмены — восстанавливает исходные данные
    document.getElementById('отмена-профиля').addEventListener('click', () => {
        польз = получитьПользователя();
        заполнитьДанные();
        document.querySelectorAll('.поле-ввода').forEach(п => п.classList.remove('ошибка', 'успех'));
        уведомление('Изменения отменены');
    });
}

// ==================== ЗАКАЗЫ ====================

function нарисоватьЗаказы() {
    const контейнер = document.getElementById('список-заказов');
    if (!контейнер) return;

    // Демо-заказы (в реальном проекте — с сервера)
    const заказы = [
        {
            номер: '2025-001', дата: '12.04.2025', статус: 'выполнен',
            товарыId: [9, 17], сумма: 35870
        },
        {
            номер: '2025-002', дата: '22.04.2025', статус: 'ожидает',
            товарыId: [3], сумма: 15500
        },
        {
            номер: '2024-087', дата: '15.11.2024', статус: 'выполнен',
            товарыId: [18, 19, 21], сумма: 8050
        }
    ];

    if (заказы.length === 0) {
        контейнер.innerHTML = '<div style="text-align:center;padding:40px;color:var(--текст-светлый);">У вас пока нет заказов. <a href="catalog.html" style="color:var(--оранжевый)">Перейти в каталог →</a></div>';
        return;
    }

    const названияСтатусов = { выполнен: 'Выполнен', ожидает: 'Ожидает оплаты', отменён: 'Отменён' };

    контейнер.innerHTML = заказы.map(з => {
        const товарыЗаказа = з.товарыId.map(id => всеТовары.find(т => т.id === id)).filter(Boolean);
        return `
        <div class="заказ-карточка">
            <div class="заказ-шапка">
                <div>
                    <span class="заказ-номер">Заказ #${з.номер}</span>
                    <span class="заказ-дата" style="margin-left:12px;">от ${з.дата}</span>
                </div>
                <span class="заказ-статус статус-${з.статус}">${названияСтатусов[з.статус]}</span>
            </div>
            <div class="заказ-товары">
                ${товарыЗаказа.map(т => `
                    <div class="заказ-товар-мини">
                        <img class="заказ-товар-фото" src="${т.image}" alt="${т.name}"
                             onerror="this.style.display='none'">
                        <span>${т.name.length > 30 ? т.name.slice(0,30)+'…' : т.name}</span>
                    </div>
                `).join('')}
            </div>
            <div class="заказ-итог">
                <span style="font-size:13px; color:var(--текст-светлый);">${з.товарыId.length} товар(а/ов)</span>
                <span class="заказ-сумма">${форматЦены(з.сумма)}</span>
            </div>
        </div>`;
    }).join('');
}

// ==================== ИЗБРАННОЕ В ПРОФИЛЕ ====================

function нарисоватьИзбранное() {
    const избранное = получитьИзбранное();
    const сетка     = document.getElementById('проф-сетка-избранного');
    const пусто     = document.getElementById('проф-пусто-избранное');
    const кол       = document.getElementById('кол-избранного');

    if (!сетка) return;

    if (кол) кол.textContent = избранное.length ? `(${избранное.length})` : '';

    if (избранное.length === 0 || всеТовары.length === 0) {
        сетка.innerHTML = '';
        if (пусто) пусто.style.display = 'block';
        return;
    }
    if (пусто) пусто.style.display = 'none';

    const товары = избранное
        .map(з => всеТовары.find(т => т.id === з.idТовара))
        .filter(Boolean);

    сетка.innerHTML = товары.map(т => `
        <div class="мини-карточка" onclick="window.location.href='product.html?id=${т.id}'">
            <div class="мини-фото">
                <img src="${т.image}" alt="${т.name}" onerror="this.style.display='none'">
            </div>
            <div class="мини-инфо">
                <div class="мини-название">${т.name}</div>
                <div class="мини-цена">${форматЦены(т.price)}</div>
                <span class="мини-убрать" data-убрать="${т.id}" onclick="event.stopPropagation(); убратьИзИзбранного(${т.id})">
                    ✕ Убрать
                </span>
            </div>
        </div>
    `).join('');
}

function убратьИзИзбранного(id) {
    let избранное = получитьИзбранное();
    избранное = избранное.filter(з => з.idТовара !== id);
    localStorage.setItem('избранное', JSON.stringify(избранное));
    обновитьСчётчики();
    нарисоватьИзбранное();
    уведомление('Удалено из избранного');
}

// ==================== БЕЗОПАСНОСТЬ ====================

function инициализироватьБезопасность() {
    // Смена пароля
    document.getElementById('сменить-пароль').addEventListener('click', () => {
        const текущий = document.getElementById('тек-пароль').value;
        const новый   = document.getElementById('нов-пароль').value;
        const новый2  = document.getElementById('нов-пароль2').value;
        const ошибкаТек  = document.getElementById('ошибка-тек-пароль');
        const ошибкаНов  = document.getElementById('ошибка-нов-пароль');
        const ошибкаНов2 = document.getElementById('ошибка-нов-пароль2');

        // Сброс ошибок
        [ошибкаТек, ошибкаНов, ошибкаНов2].forEach(э => э.textContent = '');

        let ок = true;
        if (текущий !== польз.password) {
            ошибкаТек.textContent = 'Неверный текущий пароль';
            ок = false;
        }
        if (новый.length < 6) {
            ошибкаНов.textContent = 'Минимум 6 символов';
            ок = false;
        }
        if (новый !== новый2) {
            ошибкаНов2.textContent = 'Пароли не совпадают';
            ок = false;
        }
        if (!ок) return;

        польз = { ...польз, password: новый };
        localStorage.setItem('пользователь', JSON.stringify(польз));

        // Очищаем поля
        ['тек-пароль','нов-пароль','нов-пароль2'].forEach(ид => {
            document.getElementById(ид).value = '';
        });
        уведомление('Пароль успешно изменён', 'успех');
    });

    // Сохранить уведомления
    document.getElementById('сохранить-увед').addEventListener('click', () => {
        уведомление('Настройки уведомлений сохранены', 'успех');
    });

    // Выйти из всех устройств
    document.getElementById('выйти-из-всех').addEventListener('click', () => {
        if (confirm('Выйти из всех устройств?')) {
            localStorage.removeItem('пользователь');
            window.location.href = 'login.html';
        }
    });
}

// ==================== ВЫХОД ====================

function инициализироватьВыход() {
    document.getElementById('кнопка-выйти').addEventListener('click', () => {
        localStorage.removeItem('пользователь');
        уведомление('Вы вышли из аккаунта');
        setTimeout(() => window.location.href = 'index.html', 800);
    });
}
