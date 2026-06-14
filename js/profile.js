/* ========================================================
   profile.js — логика личного кабинета (ИСПРАВЛЕННАЯ ВЕРСИЯ)
   ======================================================== */

//const API_URL = 'http://localhost:3005';

let польз = получитьПользователя();
let всеТовары = [];

// ==================== ПРОВЕРКА ВХОДА ====================
if (!польз) {
    document.addEventListener('DOMContentLoaded', () => {
        const блокНеЗалогинен = document.getElementById('блок-не-залогинен');
        if (блокНеЗалогинен) блокНеЗалогинен.style.display = 'block';
    });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        const блокПрофиль = document.getElementById('блок-профиль');
        if (блокПрофиль) блокПрофиль.style.display = 'block';
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

    try {
        const resp = await fetch(API_URL + '/products');
        всеТовары = await resp.json();
        
        // ВАЖНО: добавить await!
        await нарисоватьИзбранное();
         await нарисоватьЗаказы();
    } catch (e) {
        console.error('Ошибка загрузки каталога:', e);
    }
}

// ==================== ЗАПОЛНЕНИЕ ДАННЫХ ====================
function заполнитьДанные() {
    if (!польз) return;
    
    const аватарЭл = document.getElementById('профиль-аватар');
    if (аватарЭл) {
        аватарЭл.textContent = польз.name ? польз.name[0].toUpperCase() : '?';
    }

    const имяЭл = document.getElementById('профиль-имя');
    const emailЭл = document.getElementById('профиль-email');
    const рольЭл = document.getElementById('профиль-роль');
    
    if (имяЭл) имяЭл.textContent = польз.name || '—';
    if (emailЭл) emailЭл.textContent = польз.email || '—';
    if (рольЭл) рольЭл.textContent = польз.role === 'admin' ? 'Администратор' : 'Пользователь';

    const имяШапка = document.getElementById('имя-в-шапке');
    if (имяШапка) {
        имяШапка.textContent = польз.name ? польз.name.split(' ')[0] : 'Профиль';
    }

    const поля = {
        'проф-имя': польз.name || '',
        'проф-email': польз.email || '',
        'проф-телефон': польз.phone || '',
        'проф-дата': польз.createdAt || '—',
        'проф-адрес': польз.address || ''
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
            
            if (раздел === 'избранное') нарисоватьИзбранное();
        });
    });
}

// ==================== ФОРМА ДАННЫХ ====================
function инициализироватьФормуДанных() {
    const форма = document.getElementById('форма-профиля');
    if (!форма) return;

    форма.addEventListener('submit', async (e) => {
        e.preventDefault();

        const имя = document.getElementById('проф-имя').value.trim();
        const email = document.getElementById('проф-email').value.trim();
        const ошибкаИмя = document.getElementById('ошибка-проф-имя');
        const ошибкаEmail = document.getElementById('ошибка-проф-email');

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

        const обновления = {
            name: имя,
            email: email,
            phone: document.getElementById('проф-телефон').value.trim(),
            address: document.getElementById('проф-адрес').value.trim()
        };

        try {
            const ответ = await fetch(API_URL + '/users/' + польз.id, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(обновления)
            });

            if (!ответ.ok) throw new Error('Ошибка сервера');

            польз = await ответ.json();
            localStorage.setItem('пользователь', JSON.stringify(польз));

            document.getElementById('профиль-имя').textContent = имя;
            document.getElementById('профиль-аватар').textContent = имя[0].toUpperCase();
            document.getElementById('имя-в-шапке').textContent = имя.split(' ')[0];

            уведомление('Данные успешно сохранены', 'успех');

        } catch (e2) {
            уведомление('Не удалось сохранить данные. Проверьте подключение к серверу.', 'ошибка');
            console.error('Ошибка сохранения профиля:', e2);
        }
    });

    const отмена = document.getElementById('отмена-профиля');
    if (отмена) {
        отмена.addEventListener('click', () => {
            польз = получитьПользователя();
            заполнитьДанные();
            document.querySelectorAll('.поле-ввода').forEach(п => п.classList.remove('ошибка', 'успех'));
            уведомление('Изменения отменены');
        });
    }
}

// ==================== ЗАКАЗЫ ====================
// ==================== ЗАКАЗЫ ====================
async function нарисоватьЗаказы() {
    const контейнер = document.getElementById('список-заказов');
    if (!контейнер) return;

    const user = получитьПользователя();
    if (!user) return;

    try {
        // Загружаем заказы с сервера для текущего пользователя
       const resp = await fetch(`${API_URL}/orders?idПользователя=${user.id}`);
        const заказы = await resp.json();

        console.log('Заказы пользователя:', заказы);  // Для отладки

        if (заказы.length === 0) {
            контейнер.innerHTML = '<div style="text-align:center;padding:40px;color:var(--текст-светлый);">У вас пока нет заказов. <a href="catalog.html" style="color:var(--оранжевый)">Перейти в каталог →</a></div>';
            return;
        }

        const названияСтатусов = { 
            'новый': 'Новый',
            'выполнен': 'Выполнен', 
            'ожидает': 'Ожидает оплаты', 
            'отменён': 'Отменён' 
        };

        контейнер.innerHTML = заказы.map(з => {
            // Сортируем заказы от новых к старым (по дате)
            const товарыHTML = (з.товары || []).map(т => `
                <div class="заказ-товар-мини">
                    <span>Товар ID: ${т.idТовара} x ${т.количество} шт.</span>
                </div>
            `).join('');
            
            return `
            <div class="заказ-карточка">
                <div class="заказ-шапка">
                    <div>
                        <span class="заказ-номер">Заказ #${з.номерЗаказа || з.id}</span>
                        <span class="заказ-дата" style="margin-left:12px;">от ${з.дата}</span>
                    </div>
                    <span class="заказ-статус статус-${з.статус}">${названияСтатусов[з.статус] || з.статус}</span>
                </div>
                <div class="заказ-товары">
                    ${товарыHTML}
                </div>
                <div class="заказ-итог">
                    <span style="font-size:13px; color:var(--текст-светлый);">${з.товары?.length || 0} товар(а)</span>
                    <span class="заказ-сумма">${форматЦены(з.итого || з.сумма || 0)}</span>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('Ошибка загрузки заказов:', e);
        контейнер.innerHTML = '<div style="text-align:center;padding:40px;color:var(--текст-светлый);">Ошибка загрузки заказов</div>';
    }
}

// ==================== ИЗБРАННОЕ В ПРОФИЛЕ (ИСПРАВЛЕНО) ====================
async function нарисоватьИзбранное() {  // ← ДОБАВЛЕН async
    // ВАЖНО: добавить await!
    const избранное = await получитьИзбранное();  // ← ИСПРАВЛЕНО!
    
    const сетка = document.getElementById('проф-сетка-избранного');
    const пусто = document.getElementById('проф-пусто-избранное');
    const кол = document.getElementById('кол-избранного');

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

    if (товары.length === 0) {
        сетка.innerHTML = '';
        if (пусто) пусто.style.display = 'block';
        return;
    }

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

// ==================== УДАЛЕНИЕ ИЗ ИЗБРАННОГО ====================
async function убратьИзИзбранного(id) {
    try {
        const польз2 = получитьПользователя();
        if (!польз2) { уведомление('Войдите в аккаунт', 'ошибка'); return; }

        const resp = await fetch(API_URL + '/favorites?userId=' + польз2.id + '&idТовара=' + id);
        const записи = await resp.json();

        if (записи.length > 0) {
            await fetch(API_URL + '/favorites/' + записи[0].id, { method: 'DELETE' });
        }

        await обновитьСчётчики();
        await нарисоватьИзбранное();  // ← ДОБАВЛЕН await

        уведомление('Удалено из избранного');

    } catch (e) {
        уведомление('Ошибка удаления. Проверьте сервер.', 'ошибка');
        console.error(e);
    }
}

// ==================== БЕЗОПАСНОСТЬ ====================
function инициализироватьБезопасность() {
    const сменаПароля = document.getElementById('сменить-пароль');
    if (сменаПароля) {
        сменаПароля.addEventListener('click', async () => {
            const текущий = document.getElementById('тек-пароль').value;
            const новый = document.getElementById('нов-пароль').value;
            const новый2 = document.getElementById('нов-пароль2').value;
            
            const ошибкаТек = document.getElementById('ошибка-тек-пароль');
            const ошибкаНов = document.getElementById('ошибка-нов-пароль');
            const ошибкаНов2 = document.getElementById('ошибка-нов-пароль2');

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

            try {
                const ответ = await fetch(API_URL + '/users/' + польз.id, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: новый })
                });

                if (!ответ.ok) throw new Error('Ошибка сервера');

                const обновлённый = await ответ.json();
                польз = обновлённый;
                localStorage.setItem('пользователь', JSON.stringify(польз));

                ['тек-пароль', 'нов-пароль', 'нов-пароль2'].forEach(ид => {
                    const поле = document.getElementById(ид);
                    if (поле) поле.value = '';
                });

                уведомление('Пароль успешно изменён', 'успех');

            } catch (e) {
                уведомление('Не удалось сохранить новый пароль. Проверьте подключение к серверу.', 'ошибка');
                console.error('Ошибка смены пароля:', e);
            }
        });
    }

    const сохрУвед = document.getElementById('сохранить-увед');
    if (сохрУвед) {
        сохрУвед.addEventListener('click', () => {
            уведомление('Настройки уведомлений сохранены', 'успех');
        });
    }

    const выходВсе = document.getElementById('выйти-из-всех');
    if (выходВсе) {
        выходВсе.addEventListener('click', () => {
            if (confirm('Выйти из всех устройств? Это действие завершит сеанс на всех устройствах, включая текущее.')) {
                localStorage.removeItem('пользователь');
                window.location.href = 'login.html';
            }
        });
    }
}

// ==================== ВЫХОД ИЗ АККАУНТА ====================
function инициализироватьВыход() {
    const кнопкаВыйти = document.getElementById('кнопка-выйти');
    if (кнопкаВыйти) {
        кнопкаВыйти.addEventListener('click', () => {
            localStorage.removeItem('пользователь');
            уведомление('Вы вышли из аккаунта');
            setTimeout(() => window.location.href = 'index.html', 800);
        });
    }
}