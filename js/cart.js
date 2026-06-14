/* ========================================================
   cart.js — ЛОГИКА СТРАНИЦЫ КОРЗИНЫ (ИСПРАВЛЕННАЯ ВЕРСИЯ)
   ======================================================== */

//const API_URL = 'http://localhost:3005';  // ← ДОБАВЛЕНО

let всеТовары = [];

const ПРОМОКОДЫ = { 
    'DVERI10': 10,
    'SALE20': 20,
    'НОВЫЙ15': 15
};

let скидкаПромокод = 0;

// ============================================================
// ЗАГРУЗКА КОРЗИНЫ
// ============================================================

async function загрузитьКорзину() {
    console.log('загрузитьКорзину() вызвана');
    const польз = получитьПользователя();
    console.log('Пользователь:', польз);

    if (!польз) {
        const блокНеЗалогинен = document.getElementById('блок-не-залогинен');
        const блокКорзина = document.getElementById('блок-корзина');
        const блокПусто = document.getElementById('блок-пусто');
        
        if (блокНеЗалогинен) блокНеЗалогинен.style.display = 'block';
        if (блокКорзина) блокКорзина.style.display = 'none';
        if (блокПусто) блокПусто.style.display = 'none';
        
        const кнопкаВойти = document.getElementById('кнопка-войти-корзина');
        if (кнопкаВойти) {
            кнопкаВойти.addEventListener('click', открытьМодалкуВхода);
        }
        return;
    }

    try {
        console.log('Загружаем товары с сервера...');
        const resp = await fetch(API_URL + '/products');
        всеТовары = await resp.json();
        console.log('Загружено товаров:', всеТовары.length);
        
        console.log('Рисуем корзину...');
        await нарисоватьКорзину();
        
        console.log('Обновляем счётчики...');
        await обновитьСчётчики();
        
    } catch (e) {
        console.error('Ошибка загрузки данных:', e);
        уведомление('Ошибка загрузки данных: ' + e.message, 'ошибка');
    }
}

// ============================================================
// ОТРИСОВКА КОРЗИНЫ
// ============================================================

async function нарисоватьКорзину() {
    console.log('нарисоватьКорзину() вызвана');
    const корзина = await получитьКорзину();
    console.log('Корзина из сервера:', корзина);
    console.log('Количество товаров в корзине:', корзина.length);

    const блокПусто = document.getElementById('блок-пусто');
    const блокКорзина = document.getElementById('блок-корзина');
    const блокНеЗалогинен = document.getElementById('блок-не-залогинен');
    const заголовокКол = document.getElementById('заголовок-кол');

    if (корзина.length === 0) {
        if (блокПусто) блокПусто.style.display = 'block';
        if (блокКорзина) блокКорзина.style.display = 'none';
        if (блокНеЗалогинен) блокНеЗалогинен.style.display = 'none';
        if (заголовокКол) заголовокКол.textContent = '';
        return;
    }

    if (блокКорзина) блокКорзина.style.display = 'block';
    if (блокПусто) блокПусто.style.display = 'none';
    if (блокНеЗалогинен) блокНеЗалогинен.style.display = 'none';
    if (заголовокКол) заголовокКол.textContent = `(${корзина.length})`;

    const список = document.getElementById('список-корзины');
    if (!список) {
        console.error('Элемент "список-корзины" не найден!');
        return;
    }
    
    список.innerHTML = '';

    for (const запись of корзина) {
        const товар = всеТовары.find(т => т.id === запись.idТовара);
        if (!товар) {
            console.warn(`Товар с id=${запись.idТовара} не найден в каталоге`);
            continue;
        }
        
        const кол = запись.количество || 1;
        
        const строка = document.createElement('div');
        строка.className = 'корзина-строка';
        строка.setAttribute('data-id', товар.id);
        
        строка.innerHTML = `
            <div class="корзина-фото">
                <img src="${товар.image}" alt="${товар.name}"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='🚪'">
            </div>
            <div class="корзина-инфо">
                <div class="корзина-бренд">${товар.brand}</div>
                <div class="корзина-название">
                    <a href="product.html?id=${товар.id}">${товар.name}</a>
                </div>
                <div class="корзина-доступность">
                    ${товар.inStock ? '✓ Есть в наличии' : '✕ Нет в наличии'}
                </div>
            </div>
            <div class="корзина-цена">${форматЦены(товар.price)}</div>
            <div class="счётчик-кол">
                <button class="счётчик-кнопка" data-минус="${товар.id}">−</button>
                <input type="number" class="счётчик-значение" value="${кол}" min="1" max="99"
                       data-кол="${товар.id}">
                <button class="счётчик-кнопка" data-плюс="${товар.id}">+</button>
            </div>
            <div class="корзина-сумма" id="сумма-${товар.id}">
                ${форматЦены(товар.price * кол)}
            </div>
            <button class="кнопка-удалить" data-удалить="${товар.id}" title="Удалить">✕</button>
        `;
        
        список.appendChild(строка);
    }

    навеситьОбработчикиКорзины();
    await пересчитатьИтог();
}

// ============================================================
// ОБРАБОТЧИКИ КНОПОК
// ============================================================

function навеситьОбработчикиКорзины() {
    
    document.querySelectorAll('[data-минус]').forEach(кн => {
        кн.addEventListener('click', async () => {
            const id = +кн.getAttribute('data-минус');
            await изменитьКоличество(id, -1);
        });
    });
    
    document.querySelectorAll('[data-плюс]').forEach(кн => {
        кн.addEventListener('click', async () => {
            const id = +кн.getAttribute('data-плюс');
            await изменитьКоличество(id, +1);
        });
    });
    
    document.querySelectorAll('[data-кол]').forEach(поле => {
        поле.addEventListener('change', async () => {
            const id = +поле.getAttribute('data-кол');
            let значение = +поле.value;
            if (isNaN(значение)) значение = 1;
            значение = Math.max(1, Math.min(99, значение));
            поле.value = значение;
            await установитьКоличество(id, значение);
        });
    });
    
    document.querySelectorAll('[data-удалить]').forEach(кн => {
        кн.addEventListener('click', async () => {
            const id = +кн.getAttribute('data-удалить');
            await удалитьИзКорзины(id);
            await нарисоватьКорзину();
            await обновитьСчётчики();
        });
    });
}

// ============================================================
// ИЗМЕНЕНИЕ КОЛИЧЕСТВА
// ============================================================

async function изменитьКоличество(id, дельта) {
    const корзина = await получитьКорзину();
    const запись = корзина.find(item => item.idТовара === id);
    if (!запись) return;
    
    const новое = Math.max(1, (запись.количество || 1) + дельта);
    
    await fetch(`${API_URL}/cart/${запись.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ ...запись, количество: новое })
    });
    
    const поле = document.querySelector(`[data-кол="${id}"]`);
    if (поле) поле.value = новое;
    
    const товар = всеТовары.find(т => т.id === id);
    const суммаЭл = document.getElementById(`сумма-${id}`);
    if (товар && суммаЭл) {
        суммаЭл.textContent = форматЦены(товар.price * новое);
    }
    
    await обновитьСчётчики();
    await пересчитатьИтог();
}

async function установитьКоличество(id, значение) {
    const корзина = await получитьКорзину();
    const запись = корзина.find(item => item.idТовара === id);
    if (!запись) return;
    
    await fetch(`${API_URL}/cart/${запись.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ ...запись, количество: значение })
    });
    
    const товар = всеТовары.find(т => т.id === id);
    const суммаЭл = document.getElementById(`сумма-${id}`);
    if (товар && суммаЭл) {
        суммаЭл.textContent = форматЦены(товар.price * значение);
    }
    
    await обновитьСчётчики();
    await пересчитатьИтог();
}

// ============================================================
// ПЕРЕСЧЁТ ИТОГА
// ============================================================

async function пересчитатьИтог() {
    const корзина = await получитьКорзину();
    
    if (всеТовары.length === 0) return;
    
    let сумма = 0;
    let кол = 0;
    
    for (const запись of корзина) {
        const товар = всеТовары.find(т => т.id === запись.idТовара);
        if (товар) {
            const кол_шт = запись.количество || 1;
            кол += кол_шт;
            сумма += товар.price * кол_шт;
        }
    }
    
    const скидка = Math.round(сумма * скидкаПромокод / 100);
    const итого = сумма - скидка;
    const доставка = итого >= 5000 ? 0 : 600;
    
    const итогКол = document.getElementById('итог-кол');
    const итогСумма = document.getElementById('итог-сумма');
    const итогСкидка = document.getElementById('итог-скидка');
    const итогДоставка = document.getElementById('итог-доставка');
    const итогИтого = document.getElementById('итог-итого');
    const модалкаИтого = document.getElementById('модалка-итого');
    
    if (итогКол) итогКол.textContent = кол + ' шт.';
    if (итогСумма) итогСумма.textContent = форматЦены(сумма);
    if (итогСкидка) итогСкидка.textContent = скидка > 0 ? '−' + форматЦены(скидка) : '0 ₽';
    if (итогДоставка) итогДоставка.textContent = доставка === 0 ? 'Бесплатно' : форматЦены(доставка);
    if (итогИтого) итогИтого.textContent = форматЦены(итого + доставка);
    if (модалкаИтого) модалкаИтого.textContent = форматЦены(итого + доставка);
}

// ============================================================
// ПРОМОКОДЫ
// ============================================================

function инициализироватьПромокод() {
    const кнопка = document.getElementById('кнопка-промокода');
    if (!кнопка) return;
    
    кнопка.addEventListener('click', () => {
        const поле = document.getElementById('поле-промокода');
        if (!поле) return;
        
        const код = поле.value.trim().toUpperCase();
        
        if (ПРОМОКОДЫ[код]) {
            скидкаПромокод = ПРОМОКОДЫ[код];
            уведомление(`Промокод применён! Скидка ${скидкаПромокод}%`, 'успех');
            пересчитатьИтог();
        } else {
            уведомление('Неверный промокод', 'ошибка');
        }
    });
}

// ============================================================
// ОФОРМЛЕНИЕ ЗАКАЗА (ИСПРАВЛЕННАЯ ФУНКЦИЯ)
// ============================================================

function инициализироватьОформление() {  // ← ФУНКЦИЯ СОЗДАНА!
    const кнопкаОформить = document.getElementById('кнопка-оформить');
    const модалка = document.getElementById('модалка-заказа');
    const закрыть = document.getElementById('закрыть-заказ');
    const подтвердить = document.getElementById('подтвердить-заказ');  // ← ОПРЕДЕЛЕНА ВНУТРИ!
    
    if (!кнопкаОформить || !модалка) return;
    
    кнопкаОформить.addEventListener('click', () => {
        модалка.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const польз = получитьПользователя();
        if (польз) {
            const полеИмя = document.getElementById('заказ-имя');
            const полеТелефон = document.getElementById('заказ-телефон');
            if (полеИмя && !полеИмя.value) полеИмя.value = польз.name;
            if (полеТелефон && !полеТелефон.value && польз.phone) полеТелефон.value = польз.phone;
        }
    });
    
    if (закрыть) {
        закрыть.addEventListener('click', () => {
            модалка.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    модалка.addEventListener('click', e => {
        if (e.target === модалка) {
            модалка.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    if (подтвердить) {  // ← ТЕПЕРЬ ПЕРЕМЕННАЯ СУЩЕСТВУЕТ!
        подтвердить.addEventListener('click', async () => {
            const имя = document.getElementById('заказ-имя')?.value.trim();
            const тел = document.getElementById('заказ-телефон')?.value.trim();
            const адрес = document.getElementById('заказ-адрес')?.value.trim();
            
            if (!имя || !тел || !адрес) {
                уведомление('Заполните обязательные поля (*)', 'ошибка');
                return;
            }
            
            const корзина = await получитьКорзину();
            const user = получитьПользователя();
            
            if (корзина.length === 0) {
                уведомление('Корзина пуста', 'ошибка');
                return;
            }
            
            let суммаТоваров = 0;
            for (const item of корзина) {
                const товар = всеТовары.find(т => т.id === item.idТовара);
                if (товар) {
                    суммаТоваров += товар.price * (item.количество || 1);
                }
            }
            
            const доставка = суммаТоваров >= 5000 ? 0 : 600;
            const итогоСумма = суммаТоваров + доставка - (скидкаПромокод || 0);
            
            const новыйЗаказ = {
                id: Date.now(),
                idПользователя: user.id,
                номерЗаказа: 'ORD-' + Date.now(),
                дата: new Date().toISOString().split('T')[0],
                статус: 'новый',
                имя: имя,
                телефон: тел,
                email: document.getElementById('заказ-email')?.value.trim() || user.email,
                адрес: адрес,
                способ: document.getElementById('заказ-способ')?.value || 'delivery',
                комментарий: document.getElementById('заказ-комментарий')?.value || '',
                товары: корзина.map(item => {
                    const товар = всеТовары.find(т => т.id === item.idТовара);
                    return {
                        idТовара: item.idТовара,
                        количество: item.количество || 1,
                        цена: товар ? товар.price : 0
                    };
                }),
                суммаТоваров: суммаТоваров,
                доставка: доставка,
                скидка: скидкаПромокод || 0,
                итого: итогоСумма
            };
            
            console.log('Отправляем заказ:', новыйЗаказ);
            
            try {
                const response = await fetch(API_URL + '/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(новыйЗаказ)
                });
                
                if (!response.ok) {
                    throw new Error('Ошибка сервера: ' + response.status);
                }
                
                const созданныйЗаказ = await response.json();
                console.log('Заказ создан:', созданныйЗаказ);
                
                for (const item of корзина) {
                    await fetch(`${API_URL}/cart/${item.id}`, { method: 'DELETE' });
                }
                
                await обновитьСчётчики();
                
                модалка.classList.remove('active');
                document.body.style.overflow = '';
                
                уведомление('Заказ оформлен! Номер: ' + новыйЗаказ.номерЗаказа, 'успех');
                
                document.getElementById('заказ-имя').value = '';
                document.getElementById('заказ-телефон').value = '';
                document.getElementById('заказ-адрес').value = '';
                document.getElementById('заказ-комментарий').value = '';
                
                setTimeout(() => {
                    загрузитьКорзину();
                }, 500);
                
            } catch (error) {
                console.error('Ошибка при создании заказа:', error);
                уведомление('Ошибка при оформлении заказа: ' + error.message, 'ошибка');
            }
        });
    }
}

// ============================================================
// ЗАПУСК
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM загружен, инициализация cart.js...');
    await загрузитьКорзину();
    инициализироватьПромокод();
    инициализироватьОформление();  // ← ТЕПЕРЬ ФУНКЦИЯ СУЩЕСТВУЕТ!
});