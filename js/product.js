/* ========================================================
   product.js — логика страницы карточки товара (ИСПРАВЛЕННАЯ ВЕРСИЯ)
   ======================================================== */

// Глобальные переменные
let текущийТовар = null;
let всеТовары = [];

// ============================================================
// ЗАГРУЗКА ДАННЫХ СТРАНИЦЫ
// ============================================================

async function загрузитьСтраницуТовара() {
    const params = new URLSearchParams(window.location.search);
    const id = +params.get('id');

    if (!id) {
        показатьОшибку('Товар не найден. Вернитесь в каталог.');
        return;
    }

    try {
        const resp = await fetch(API_URL + '/products');
        всеТовары = await resp.json();
        текущийТовар = всеТовары.find(т => т.id === id);

        if (!текущийТовар) {
            показатьОшибку('Товар не найден.');
            return;
        }

        // ВАЖНО: добавить await!
        await нарисоватьТовар();
        нарисоватьХарактеристики();
        await нарисоватьПохожие();
        обновитьКрошки();

    } catch (e) {
        console.error(e);
        показатьОшибку('Ошибка загрузки. Убедитесь, что сайт запущен через локальный сервер.');
    }
}

function показатьОшибку(текст) {
    const конт = document.getElementById('товар-главный');
    if (конт) {
        конт.innerHTML = `<div style="padding:80px;text-align:center;grid-column:1/-1;color:var(--текст-светлый);">
            ❌ ${текст}<br><br>
            <a href="catalog.html" style="color:var(--оранжевый)">← Вернуться в каталог</a>
        </div>`;
    }
}

function обновитьКрошки() {
    if (!текущийТовар) return;
    const названияКат = { entrance: 'Входные двери', interior: 'Межкомнатные двери', hardware: 'Фурнитура' };
    const катНазвание = названияКат[текущийТовар.category] || 'Каталог';
    
    const крошкаКат = document.getElementById('крошка-категория');
    const крошкаТовар = document.getElementById('крошка-товар');
    
    if (крошкаКат) {
        крошкаКат.textContent = катНазвание;
        крошкаКат.href = `catalog.html?cat=${текущийТовар.category}`;
    }
    if (крошкаТовар) крошкаТовар.textContent = текущийТовар.name;
    document.title = `${текущийТовар.name} — Дверь.рф`;
}

// ============================================================
// ОТРИСОВКА ГЛАВНОГО БЛОКА ТОВАРА (ИСПРАВЛЕНО - добавлен async)
// ============================================================

async function нарисоватьТовар() {  // ← ДОБАВЛЕН async
    const т = текущийТовар;
    if (!т) return;
    
    const скидка = т.oldPrice ? Math.round((1 - т.price / т.oldPrice) * 100) : 0;
    
    // ← ДОБАВЛЕНЫ await!
    const вК = await вКорзине(т.id);
    const вИ = await вИзбранном(т.id);
    
    const папки = { entrance: 'entrance', interior: 'interior', hardware: 'hardware' };
    const папка = папки[т.category] || 'interior';
    const все_фото = [т.image, ...(т.images || [])].filter(Boolean);
    const цветовыеФото = (т.colors || []).map((цвет, i) => ({
        src: `images/doors/${папка}/p${т.id}-${i + 1}.jpg`,
        цвет: цвет
    }));

    const конт = document.getElementById('товар-главный');
    if (!конт) return;
    
    конт.innerHTML = `
        <div class="галерея">
            <div class="главное-фото" id="главное-фото">
                ${скидка ? `<div class="метка-на-фото">−${скидка}%</div>` : ''}
                <img src="${т.image}" alt="${т.name}" id="главное-изображение"
                     onerror="this.style.display='none'; document.getElementById('заглушка-главная').style.display='block'">
                <div class="заглушка-большая" id="заглушка-главная" style="display:none">🚪</div>
            </div>
            <div class="миниатюры" id="миниатюры">
                ${все_фото.map((фото, i) => `
                    <div class="миниатюра ${i === 0 ? 'active' : ''}" data-фото="${фото}">
                        <img src="${фото}" alt="Фото ${i+1}" onerror="this.parentElement.style.display='none'">
                    </div>
                `).join('')}
                ${цветовыеФото.map((вар, i) => `
                    <div class="миниатюра миниатюра-цвет" data-фото="${вар.src}" data-цвет-индекс="${i}" title="${вар.цвет}"
                         style="display:none;">
                        <img src="${вар.src}" alt="${вар.цвет}"
                             onload="this.parentElement.style.display='flex';"
                             onerror="this.parentElement.style.display='none'">
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="товар-центр">
            <div class="товар-бренд">${т.brand}</div>
            <h1 class="товар-название">${т.name}</h1>
            <div class="товар-артикул">Артикул: ${т.article}</div>
            <div class="товар-рейтинг">
                <span class="звезды-большие">${звёзды(т.rating)}</span>
                <span>${т.rating}</span>
                <a class="отзывы-ссылка">(${т.reviewCount} отзывов)</a>
            </div>
            <div class="наличие ${т.inStock ? 'есть' : 'нет'}">
                ${т.inStock ? '✓ Есть в наличии' : '✕ Нет в наличии'}
            </div>
            ${т.colors && т.colors.length > 1 ? `
            <div>
                <div class="вариант-заголовок">Цвет / исполнение:</div>
                <div class="варианты-цвета">
                    ${т.colors.map((ц, i) => `<div class="вариант-цвет ${i === 0 ? 'active' : ''}" data-цвет="${ц}">${ц}</div>`).join('')}
                </div>
            </div>` : ''}
            <div class="блок-цены">
                <div>
                    <span class="цена-сейчас">${форматЦены(т.price)}</span>
                    ${т.oldPrice ? `<span class="цена-было">${форматЦены(т.oldPrice)}</span>` : ''}
                </div>
                <div class="цена-рассрочка">или от ${Math.round(т.price / 12).toLocaleString('ru-RU')} ₽/мес в рассрочку</div>
            </div>
            <div class="кнопки-товара">
                <button class="кнопка-купить ${вК ? 'в-корзине' : ''}" id="кнопка-корзины-товар">
                    ${вК ? '✓ В корзине' : '🛒 В корзину'}
                </button>
                <button class="кнопка-избранное-товар ${вИ ? 'активно' : ''}" id="кнопка-избранного-товар"
                        title="${вИ ? 'Убрать из избранного' : 'В избранное'}">
                    ${вИ ? '♥' : '♡'}
                </button>
            </div>
            <div><a href="tel:+78442250300" class="телефон-товара">📞 +7 (844) 225-03-00</a></div>
        </div>
        <div class="товар-боковая">
            <div class="блок-услуги">
                <h4>Дополнительные работы и услуги</h4>
                <div class="услуга-строка"><span class="услуга-иконка">📐</span><div><div>Замер</div><div class="услуга-подпись">Бесплатно до 5 км</div></div></div>
                <div class="услуга-строка"><span class="услуга-иконка">🚚</span><div><div>Доставка и подъём</div><div class="услуга-подпись">от 600 ₽</div></div></div>
                <div class="услуга-строка"><span class="услуга-иконка">🔧</span><div><div>Монтаж</div><div class="услуга-подпись">от 2 500 ₽</div></div></div>
                <div class="услуга-строка"><span class="услуга-иконка">📅</span><div><div>Дни работы</div><div class="услуга-подпись">Ежедневно 9:00–19:00</div></div></div>
            </div>
            <div class="блок-услуги"><h4>Описание</h4><p style="font-size:13px; line-height:1.6; color:var(--текст-светлый);">${т.description}</p></div>
            <div class="блок-услуги" style="background:var(--фон-серый);"><div class="услуга-строка" style="border:none;"><span class="услуга-иконка">🛡</span><div><div style="font-weight:600;">Гарантия ${т.warranty}</div><div class="услуга-подпись">Официальная от производителя</div></div></div></div>
        </div>
    `;

    навеситьОбработчики();
}

// ============================================================
// ОБРАБОТЧИКИ СОБЫТИЙ (ИСПРАВЛЕНО - добавлены async/await)
// ============================================================

function навеситьОбработчики() {
    
    // Галерея
    document.querySelectorAll('.миниатюра').forEach(м => {
        м.addEventListener('click', () => {
            const фото = м.getAttribute('data-фото');
            const главноеИзображение = document.getElementById('главное-изображение');
            if (главноеИзображение) главноеИзображение.src = фото;
            document.querySelectorAll('.миниатюра').forEach(мм => мм.classList.remove('active'));
            м.classList.add('active');
        });
    });

    // Выбор цвета
    document.querySelectorAll('.вариант-цвет').forEach((в, индекс) => {
        в.addEventListener('click', () => {
            document.querySelectorAll('.вариант-цвет').forEach(вв => вв.classList.remove('active'));
            в.classList.add('active');
            const т = текущийТовар;
            const главноеФото = document.getElementById('главное-изображение');
            if (!главноеФото) return;
            const папки = { entrance: 'entrance', interior: 'interior', hardware: 'hardware' };
            const папка = папки[т.category] || 'interior';
            const цветноеФото = `images/doors/${папка}/p${т.id}-${индекс + 1}.jpg`;
            const тест = new Image();
            тест.onload = () => {
                главноеФото.classList.add('меняется');
                setTimeout(() => { главноеФото.src = цветноеФото; главноеФото.classList.remove('меняется'); }, 200);
                document.querySelectorAll('.миниатюра').forEach((м, i) => { м.classList.toggle('active', i === индекс); });
            };
            тест.onerror = () => {
                главноеФото.classList.add('меняется');
                setTimeout(() => {
                    главноеФото.src = т.image;
                    главноеФото.classList.remove('меняется');
                    let подсказка = document.getElementById('цвет-нет-фото');
                    if (!подсказка) {
                        подсказка = document.createElement('div');
                        подсказка.id = 'цвет-нет-фото';
                        подсказка.className = 'цвет-нет-фото';
                        подсказка.textContent = 'Фото этого цвета пока нет';
                        document.querySelector('.варианты-цвета')?.after(подсказка);
                    }
                    подсказка.style.display = 'block';
                    setTimeout(() => { if (подсказка) подсказка.style.display = 'none'; }, 2000);
                }, 200);
                document.querySelectorAll('.миниатюра').forEach((м, i) => { м.classList.toggle('active', i === 0); });
            };
            тест.src = цветноеФото;
        });
    });

    // ============================================================
    // 3. КНОПКА "В КОРЗИНУ" (ИСПРАВЛЕНО - добавлены async/await)
    // ============================================================
    
    const кнопкаК = document.getElementById('кнопка-корзины-товар');
    if (кнопкаК) {
        кнопкаК.addEventListener('click', async () => {  // ← ДОБАВЛЕН async
            if (await вКорзине(текущийТовар.id)) {       // ← ДОБАВЛЕН await
                await удалитьИзКорзины(текущийТовар.id); // ← ДОБАВЛЕН await
                кнопкаК.textContent = '🛒 В корзину';
                кнопкаК.classList.remove('в-корзине');
            } else {
                const добавлено = await добавитьВКорзину(текущийТовар.id); // ← ДОБАВЛЕН await
                if (добавлено) {
                    кнопкаК.textContent = '✓ В корзине';
                    кнопкаК.classList.add('в-корзине');
                }
            }
            await обновитьСчётчики(); // ← ДОБАВЛЕН await
        });
    }

    // ============================================================
    // 4. КНОПКА "В ИЗБРАННОЕ" (ИСПРАВЛЕНО - добавлены async/await)
    // ============================================================
    
    const кнопкаИ = document.getElementById('кнопка-избранного-товар');
    if (кнопкаИ) {
        кнопкаИ.addEventListener('click', async () => {  // ← ДОБАВЛЕН async
            await добавитьВИзбранное(текущийТовар.id);   // ← ДОБАВЛЕН await
            const сейчасВ = await вИзбранном(текущийТовар.id); // ← ДОБАВЛЕН await
            кнопкаИ.textContent = сейчасВ ? '♥' : '♡';
            кнопкаИ.classList.toggle('активно', сейчасВ);
            await обновитьСчётчики(); // ← ДОБАВЛЕН await
        });
    }
}

// ============================================================
// ТАБЛИЦА ХАРАКТЕРИСТИК
// ============================================================

function нарисоватьХарактеристики() {
    const т = текущийТовар;
    const строки = [
        ['Тип товара', т.subcategory], ['Бренд', т.brand], ['Артикул', т.article],
        ['Материал', т.material], т.thickness ? ['Толщина полотна', т.thickness] : null,
        т.width ? ['Ширина', т.width + ' мм'] : null, т.height ? ['Высота', т.height + ' мм'] : null,
        ['Гарантия', т.warranty], т.installationTime ? ['Срок установки', т.installationTime] : null,
        ['Доставка', т.delivery], ['Цвета', т.colors ? т.colors.join(', ') : '—'],
        ['Рейтинг', `${т.rating} / 5 (${т.reviewCount} отзывов)`],
    ].filter(Boolean);
    const контейнер = document.getElementById('таб-характеристики');
    if (контейнер) контейнер.innerHTML = `<table class="таблица-характеристик">${строки.map(([название, значение]) => `<tr><td>${название}</td><td>${значение || '—'}</td></tr>`).join('')}</table>`;
}

// ============================================================
// ПОХОЖИЕ ТОВАРЫ
// ============================================================

// ============================================================
// ПОХОЖИЕ ТОВАРЫ (ИСПРАВЛЕНО - добавлен async и await)
// ============================================================

async function нарисоватьПохожие() {  // ← ДОБАВЛЕН async
    if (!текущийТовар || !всеТовары) return;
    const похожие = всеТовары.filter(т => т.category === текущийТовар.category && т.id !== текущийТовар.id).slice(0, 4);
    const контейнер = document.getElementById('похожие-товары');
    if (!контейнер || похожие.length === 0) return;
    
    // ВАЖНО: получаем состояния корзины для всех похожих товаров
    const состоянияКорзины = {};
    for (const т of похожие) {
        состоянияКорзины[т.id] = await вКорзине(т.id);  // ← ДОБАВЛЕН await
    }
    
    контейнер.innerHTML = похожие.map(т => {
        const скидка = т.oldPrice ? Math.round((1 - т.price / т.oldPrice) * 100) : 0;
        const вК = состоянияКорзины[т.id];  // ← теперь правильное значение true/false
        
        return `
        <div class="карточка" onclick="window.location.href='product.html?id=${т.id}'">
            <div class="картинка-товара">
                <div class="бейджи-товара">
                    ${скидка ? `<span class="метка метка-скидка">-${скидка}%</span>` : ''}
                    ${т.isNew ? '<span class="метка метка-новинка">Новинка</span>' : ''}
                </div>
                <img src="${т.image}" alt="${т.name}" loading="lazy" onerror="this.style.display='none'">
            </div>
            <div class="инфо-товара">
                <div class="бренд">${т.brand}</div>
                <div class="название-товара">${т.name}</div>
                <div class="звезды">${звёзды(т.rating)}</div>
                <div class="цена-ряд">
                    <div>
                        <div class="цена-текущая">${форматЦены(т.price)}</div>
                        ${т.oldPrice ? `<div class="цена-старая">${форматЦены(т.oldPrice)}</div>` : ''}
                    </div>
                    <div class="кнопка-корзины ${вК ? 'в-корзине' : ''}"
                         onclick="event.stopPropagation(); нажатьКорзинуПохожего(${т.id}, this)">
                        ${вК ? '✓' : '🛒'}
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}
// ============================================================
// КНОПКА КОРЗИНЫ В ПОХОЖИХ ТОВАРАХ (ИСПРАВЛЕНО - добавлены async/await)
// ============================================================

async function нажатьКорзинуПохожего(id, кнопка) {  // ← ДОБАВЛЕН async
    if (await вКорзине(id)) {                       // ← ДОБАВЛЕН await
        await удалитьИзКорзины(id);                 // ← ДОБАВЛЕН await
        кнопка.textContent = '🛒';
        кнопка.classList.remove('в-корзине');
    } else {
        const добавлено = await добавитьВКорзину(id); // ← ДОБАВЛЕН await
        if (добавлено) {
            кнопка.textContent = '✓';
            кнопка.classList.add('в-корзине');
        }
    }
    await обновитьСчётчики(); // ← ДОБАВЛЕН await
}

// ============================================================
// ТАБЫ (ВКЛАДКИ)
// ============================================================

function инициализироватьТабы() {
    document.querySelectorAll('.таб').forEach(таб => {
        таб.addEventListener('click', () => {
            const цель = таб.getAttribute('data-таб');
            document.querySelectorAll('.таб').forEach(т => т.classList.remove('active'));
            таб.classList.add('active');
            document.querySelectorAll('.таб-контент').forEach(контент => контент.classList.add('скрыт'));
            const нужный = document.getElementById('таб-' + цель);
            if (нужный) нужный.classList.remove('скрыт');
        });
    });
}

// ============================================================
// ЗАПУСК СТРАНИЦЫ
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    инициализироватьТабы();
    загрузитьСтраницуТовара();
});