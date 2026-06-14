/* ========================================================
   favorites.js — логика страницы избранного (АСИНХРОННАЯ ВЕРСИЯ)
   ======================================================== */

async function загрузитьИзбранное() {
    const польз = получитьПользователя();
    
    if (!польз) {
        const блокНеЗалогинен = document.getElementById('блок-не-залогинен');
        if (блокНеЗалогинен) блокНеЗалогинен.style.display = 'block';
        
        const блокПусто = document.getElementById('блок-пусто');
        const сетка = document.getElementById('сетка-избранного');
        if (блокПусто) блокПусто.style.display = 'none';
        if (сетка) сетка.innerHTML = '';
        return;
    }

    try {
        // Асинхронное получение избранного
        const избранное = await получитьИзбранное();
        
        // Обновляем счётчик
        const заголовок = document.getElementById('заголовок-кол');
        if (заголовок) заголовок.textContent = избранное.length ? `(${избранное.length})` : '';

        const блокНеЗалогинен = document.getElementById('блок-не-залогинен');
        if (блокНеЗалогинен) блокНеЗалогинен.style.display = 'none';

        if (избранное.length === 0) {
            const блокПусто = document.getElementById('блок-пусто');
            if (блокПусто) блокПусто.style.display = 'block';
            const сетка = document.getElementById('сетка-избранного');
            if (сетка) сетка.innerHTML = '';
            return;
        }

        const блокПусто = document.getElementById('блок-пусто');
        if (блокПусто) блокПусто.style.display = 'none';

        // Загружаем товары с сервера
        const resp = await fetch(API_URL + '/products');
        const всеТовары = await resp.json();
        
        const сетка = document.getElementById('сетка-избранного');
        if (!сетка) return;

        // Фильтруем товары по ID из избранного
        const товары = избранное
            .map(з => всеТовары.find(т => т.id === з.idТовара))
            .filter(Boolean);

        if (товары.length === 0) {
            сетка.innerHTML = '';
            if (блокПусто) блокПусто.style.display = 'block';
            return;
        }

        // Генерируем карточки (используем АСИНХРОННЫЕ функции для проверки)
        // Сначала получаем все состояния корзины и избранного
        const состоянияКорзины = {};
        for (const т of товары) {
            состоянияКорзины[т.id] = await вКорзине(т.id);
        }

        сетка.innerHTML = товары.map(т => {
            const скидка = т.oldPrice ? Math.round((1 - т.price / т.oldPrice) * 100) : 0;
            const вК = состоянияКорзины[т.id];
            
            return `
            <div class="карточка" data-id="${т.id}">
                <div class="картинка-товара">
                    <div class="бейджи-товара">
                        ${т.isSale && скидка ? `<span class="метка метка-скидка">-${скидка}%</span>` : ''}
                        ${т.isNew ? '<span class="метка метка-новинка">Новинка</span>' : ''}
                    </div>
                    <img src="${т.image}" alt="${т.name}" loading="lazy"
                         onerror="this.style.display='none'">
                    <div class="кнопка-избранного в-избранном" data-убрать="${т.id}" title="Убрать из избранного">♥</div>
                </div>
                <div class="инфо-товара">
                    <div class="бренд">${т.brand || ''}</div>
                    <div class="название-товара">${т.name}</div>
                    <div>
                        <span class="звезды">${звёзды(т.rating)}</span>
                        <span class="отзывы-кол">(${т.reviewCount})</span>
                    </div>
                    <div class="цена-ряд">
                        <div>
                            <span class="цена-текущая">${форматЦены(т.price)}</span>
                            ${т.oldPrice ? `<span class="цена-старая">${форматЦены(т.oldPrice)}</span>` : ''}
                        </div>
                        <div class="кнопка-корзины ${вК ? 'в-корзине' : ''}" data-корзина="${т.id}">
                            ${вК ? '✓' : '🛒'}
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');

        // Навешиваем обработчики
        навеситьОбработчики();

    } catch (e) {
        console.error('Ошибка в favorites.js:', e);
        уведомление('Ошибка загрузки данных', 'ошибка');
    }
}

async function навеситьОбработчики() {
    const сетка = document.getElementById('сетка-избранного');
    if (!сетка) return;
    
    // Кнопки удаления из избранного
    for (const кн of сетка.querySelectorAll('[data-убрать]')) {
        кн.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = +кн.getAttribute('data-убрать');
            await добавитьВИзбранное(id); // Toggle удалит
            await загрузитьИзбранное();
            await обновитьСчётчики();
        });
    }
    
    // Кнопки корзины
    for (const кн of сетка.querySelectorAll('[data-корзина]')) {
        кн.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = +кн.getAttribute('data-корзина');
            if (await вКорзине(id)) {
                await удалитьИзКорзины(id);
            } else {
                await добавитьВКорзину(id);
            }
            await загрузитьИзбранное();
            await обновитьСчётчики();
        });
    }
    
    // Клик по карточке
    for (const к of сетка.querySelectorAll('.карточка')) {
        к.addEventListener('click', () => {
            window.location.href = `product.html?id=${к.getAttribute('data-id')}`;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    загрузитьИзбранное();
});