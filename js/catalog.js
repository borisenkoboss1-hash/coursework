/* ========================================================
   catalog.js — логика страницы каталога
   Фильтры, сортировка, пагинация, переключение вида
   ======================================================== */

// Сколько товаров показываем на одной странице
const ТОВАРОВ_НА_СТРАНИЦЕ = 12;

// Текущее состояние каталога
let всеТовары = [];
let отфильтрованные = [];
let текущаяСтраница = 1;
let текущийВид = 'сетка';   // 'сетка' или 'список'

// Активные фильтры
let фильтры = {
    категория: 'all',
    подкатегория: null,
    ценаОт: 0,
    ценаДо: 100000,
    бренды: [],
    цвета: [],      // выбранные группы цветов
    поиск: ''
};

// ==================== ЗАГРУЗКА ТОВАРОВ ====================

async function загрузитьТовары() {
    try {
        const resp = await fetch('data/products.json');
        всеТовары = await resp.json();
        применитьФильтрыИзURL();   // читаем GET-параметры из адресной строки
        заполнитьФильтры();
        обновитьКаталог();
    } catch (e) {
        console.error('Ошибка загрузки товаров:', e);
        document.getElementById('сетка-товаров').innerHTML =
            '<div style="padding:40px;text-align:center;">Ошибка загрузки товаров. Запустите через локальный сервер.</div>';
    }
}

// Читаем параметры из URL: catalog.html?cat=entrance
function применитьФильтрыИзURL() {
    const params = new URLSearchParams(window.location.search);
    const кат = params.get('cat');
    if (кат) фильтры.категория = кат;

    // Поддержка поиска из главной страницы: catalog.html?search=...
    const запросURL = params.get('search');
    if (запросURL) {
        фильтры.поиск = запросURL;
        const поле = document.getElementById('поле-поиска');
        if (поле) поле.value = запросURL;
    }

    // Обновляем заголовок и крошки
    const названия = { entrance: 'Входные двери', interior: 'Межкомнатные двери', hardware: 'Фурнитура', all: 'Все двери' };
    const заголовок = названия[кат] || 'Все двери';
    document.getElementById('заголовок-каталога').textContent = заголовок;
    document.getElementById('крошка-категория').textContent = заголовок;

    // Подсвечиваем активный пункт меню
    document.querySelectorAll('.ссылка-меню').forEach(ссылка => {
        ссылка.classList.toggle('active', ссылка.getAttribute('data-cat') === кат);
    });
}

// ==================== ЗАПОЛНЕНИЕ ФИЛЬТРОВ (подкатегории, цвета) ====================

function заполнитьФильтры() {
    // Бренды убраны — не применяются на данном сайте

    // --- Подкатегории ---
    const подкатегории = [...new Set(всеТовары
        .filter(т => фильтры.категория === 'all' || т.category === фильтры.категория)
        .map(т => т.subcategory))];

    const блокПодкат = document.getElementById('список-подкатегорий');
    if (блокПодкат) {
        блокПодкат.innerHTML = подкатегории.map(п => `
            <a class="подкатегория-ссылка ${фильтры.подкатегория === п ? 'active' : ''}"
               data-sub="${п}">${п}</a>
        `).join('');

        блокПодкат.querySelectorAll('.подкатегория-ссылка').forEach(ссылка => {
            ссылка.addEventListener('click', () => {
                const выбрана = ссылка.getAttribute('data-sub');
                // Повторный клик — сброс подкатегории
                фильтры.подкатегория = (фильтры.подкатегория === выбрана) ? null : выбрана;
                текущаяСтраница = 1;
                // Перерисовываем подкатегории (чтобы обновить класс active)
                блокПодкат.querySelectorAll('.подкатегория-ссылка').forEach(с => {
                    с.classList.toggle('active', с.getAttribute('data-sub') === фильтры.подкатегория);
                });
                обновитьКаталог();
            });
        });
    }

    // --- Цвета (из реальных данных товаров) ---
    // Группируем похожие цвета для удобства
    const цветаГруппы = [
        { назв: 'Белый',   hex: '#f8f5f0', ключи: ['Белый', 'Белый матовый', 'Белый ясень', 'Белый дуб', 'Белый бетон', 'Белый шёлк', 'Слоновая кость', 'Дуб белый', 'Ясень белый', 'Белый RAL 9016'] },
        { назв: 'Чёрный',  hex: '#1a1a1a', ключи: ['Чёрный', 'Чёрный матовый', 'Чёрный бархат', 'Чёрный шёлк', 'Антрацит', 'Графит', 'Серый цемент'] },
        { назв: 'Серый',   hex: '#9e9e9e', ключи: ['Серый', 'Серый бетон', 'Серый дуб', 'Рустик серый', 'Серый RAL 7035', 'Никель матовый', 'Матовый никель'] },
        { назв: 'Венге',   hex: '#3b1f0e', ключи: ['Венге', 'Тёмный орех', 'Шоколад', 'Орех'] },
        { назв: 'Дуб',     hex: '#c8a060', ключи: ['Дуб', 'Дуб Royal', 'Дуб беленый', 'Дуб тёмный', 'Дуб скай', 'Дуб молочный', 'Натуральный дуб', 'Тик', 'Ясень натуральный', 'Ясень светлый', 'Cappuccino', 'Рустик беж'] },
        { назв: 'Металл',  hex: '#a8a8a8', ключи: ['Хром', 'Серебро', 'Никель', 'Нержавеющая сталь', 'Сатин', 'Антик серебро', 'Антик медь', 'Бронза', 'Бронза антик', 'Золото', 'Золото антик'] },
        { назв: 'Коричн.', hex: '#8B4513', ключи: ['Коричневый', 'Rovere Scuro', 'Rovere Chiaro'] },
    ];

    const блокЦветов = document.getElementById('цвета-фильтра');
    if (блокЦветов) {
        блокЦветов.innerHTML = цветаГруппы.map(г => `
            <div class="цвет-свотч ${фильтры.цвета.includes(г.назв) ? 'active' : ''}"
                 style="background:${г.hex}; ${г.назв === 'Белый' ? 'border:2px solid #ddd;' : ''}"
                 data-цвет="${г.назв}"
                 data-ключи="${г.ключи.join('|')}"
                 title="${г.назв}">
            </div>
        `).join('');

        блокЦветов.querySelectorAll('.цвет-свотч').forEach(свотч => {
            свотч.addEventListener('click', () => {
                const назв = свотч.getAttribute('data-цвет');
                if (фильтры.цвета.includes(назв)) {
                    фильтры.цвета = фильтры.цвета.filter(ц => ц !== назв);
                    свотч.classList.remove('active');
                } else {
                    фильтры.цвета.push(назв);
                    свотч.classList.add('active');
                }
                обновитьТегиЦветов();
                текущаяСтраница = 1;
                обновитьКаталог();
            });
        });
    }
}

// ==================== ПРИМЕНЕНИЕ ФИЛЬТРОВ И СОРТИРОВКА ====================

function применитьФильтры() {
    отфильтрованные = всеТовары.filter(т => {
        // По категории
        if (фильтры.категория !== 'all' && т.category !== фильтры.категория) return false;
        // По подкатегории
        if (фильтры.подкатегория && т.subcategory !== фильтры.подкатегория) return false;
        // По цене
        if (т.price < фильтры.ценаОт || т.price > фильтры.ценаДо) return false;
        // По цвету
        if (фильтры.цвета.length > 0) {
            // Карта групп цветов → ключевые слова
            const цветаКарта = {
                'Белый':   ['Белый', 'Белый матовый', 'Белый ясень', 'Белый дуб', 'Белый бетон', 'Белый шёлк', 'Слоновая кость', 'Дуб белый', 'Ясень белый', 'Белый RAL 9016'],
                'Чёрный':  ['Чёрный', 'Чёрный матовый', 'Чёрный бархат', 'Чёрный шёлк', 'Антрацит', 'Графит', 'Серый цемент'],
                'Серый':   ['Серый', 'Серый бетон', 'Серый дуб', 'Рустик серый', 'Серый RAL 7035', 'Никель матовый', 'Матовый никель'],
                'Венге':   ['Венге', 'Тёмный орех', 'Шоколад', 'Орех'],
                'Дуб':     ['Дуб', 'Дуб Royal', 'Дуб беленый', 'Дуб тёмный', 'Дуб скай', 'Дуб молочный', 'Натуральный дуб', 'Тик', 'Ясень натуральный', 'Ясень светлый', 'Cappuccino', 'Рустик беж'],
                'Металл':  ['Хром', 'Серебро', 'Никель', 'Нержавеющая сталь', 'Сатин', 'Антик серебро', 'Антик медь', 'Бронза', 'Бронза антик', 'Золото', 'Золото антик'],
                'Коричн.': ['Коричневый', 'Rovere Scuro', 'Rovere Chiaro'],
            };
            // Собираем все нужные цвета из выбранных групп
            const нужныеЦвета = фильтры.цвета.flatMap(г => цветаКарта[г] || []);
            const цветаТовара = т.colors || [];
            if (!нужныеЦвета.some(ц => цветаТовара.some(тц => тц.includes(ц) || ц.includes(тц)))) return false;
        }
        // По поиску
        if (фильтры.поиск) {
            const запрос = фильтры.поиск.toLowerCase();
            if (!т.name.toLowerCase().includes(запрос) &&
                !т.brand.toLowerCase().includes(запрос)) return false;
        }
        return true;
    });
}

function применитьСортировку() {
    const значение = document.getElementById('сортировка').value;
    const copy = [...отфильтрованные];
    if (значение === 'price-asc')  copy.sort((a, b) => a.price - b.price);
    if (значение === 'price-desc') copy.sort((a, b) => b.price - a.price);
    if (значение === 'rating')     copy.sort((a, b) => b.rating - a.rating);
    if (значение === 'name')       copy.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    отфильтрованные = copy;
}

// ==================== ОТРИСОВКА КАРТОЧЕК ====================

function нарисоватьТовары() {
    const контейнер = document.getElementById('сетка-товаров');
    const счётчик = document.getElementById('счётчик-товаров');

    счётчик.textContent = `Найдено: ${отфильтрованные.length} товаров`;

    if (отфильтрованные.length === 0) {
        контейнер.innerHTML = '<div style="text-align:center; padding:60px; grid-column:1/-1; color:var(--текст-светлый);">Товаров не найдено. Попробуйте изменить фильтры.</div>';
        document.getElementById('пагинация').innerHTML = '';
        return;
    }

    // Срез товаров для текущей страницы
    const начало = (текущаяСтраница - 1) * ТОВАРОВ_НА_СТРАНИЦЕ;
    const конец = начало + ТОВАРОВ_НА_СТРАНИЦЕ;
    const страница = отфильтрованные.slice(начало, конец);

    контейнер.innerHTML = страница.map(т => карточкаHTML(т)).join('');

    // Раскрашиваем точки цветов реальными цветами
    setTimeout(раскраситьТочки, 0);

    // Навешиваем обработчики на кнопки карточек
    контейнер.querySelectorAll('[data-добавить-корзина]').forEach(кнопка => {
        кнопка.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = +кнопка.getAttribute('data-добавить-корзина');
            if (вКорзине(id)) {
                удалитьИзКорзины(id);
            } else {
                добавитьВКорзину(id);
            }
            нарисоватьТовары();   // перерисовываем чтобы обновить кнопку
        });
    });

    контейнер.querySelectorAll('[data-добавить-избранное]').forEach(кнопка => {
        кнопка.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = +кнопка.getAttribute('data-добавить-избранное');
            добавитьВИзбранное(id);
            нарисоватьТовары();
        });
    });

    // Клик по карточке — переход на страницу товара
    контейнер.querySelectorAll('.карточка').forEach(карточка => {
        карточка.addEventListener('click', () => {
            const id = карточка.getAttribute('data-id');
            window.location.href = `product.html?id=${id}`;
        });
    });
}

// HTML одной карточки товара
function карточкаHTML(т) {
    const скидка = процентСкидки(т.price, т.oldPrice);
    const вК = вКорзине(т.id);
    const вИ = вИзбранном(т.id);

    return `
    <div class="карточка" data-id="${т.id}">
        <div class="картинка-товара">
            <div class="бейджи-товара">
                ${!т.inStock ? '<span class="метка метка-нет">Нет в наличии</span>' : ''}
                ${т.isSale && скидка ? `<span class="метка метка-скидка">-${скидка}%</span>` : ''}
                ${т.isNew ? '<span class="метка метка-новинка">Новинка</span>' : ''}
            </div>
            <img src="${т.image}" alt="${т.name}" loading="lazy"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <div class="заглушка-фото" style="display:none">🚪</div>
            <div class="кнопка-избранного ${вИ ? 'в-избранном' : ''}"
                 data-добавить-избранное="${т.id}" title="В избранное">
                ${вИ ? '♥' : '♡'}
            </div>
        </div>
        <div class="инфо-товара">
            <div class="бренд">${т.brand}</div>
            <div class="название-товара">${т.name}</div>
            <div>
                <span class="звезды">${звёзды(т.rating)}</span>
                <span class="отзывы-кол">(${т.reviewCount})</span>
            </div>
            ${т.colors && т.colors.length > 0 ? `
            <div class="карточка-цвета">
                ${т.colors.slice(0, 4).map(ц => `<span class="карточка-цвет-точка" title="${ц}"></span>`).join('')}
                ${т.colors.length > 4 ? `<span style="font-size:10px;color:var(--текст-светлый);">+${т.colors.length - 4}</span>` : ''}
            </div>` : ''}
            <div class="цена-ряд">
                <div class="цены">
                    <span class="цена-текущая">${форматЦены(т.price)}</span>
                    ${т.oldPrice ? `<span class="цена-старая">${форматЦены(т.oldPrice)}</span>` : ''}
                </div>
                <div class="кнопка-корзины ${вК ? 'в-корзине' : ''}"
                     data-добавить-корзина="${т.id}"
                     title="${вК ? 'Убрать из корзины' : 'В корзину'}">
                    ${вК ? '✓' : '🛒'}
                </div>
            </div>
        </div>
    </div>`;
}

// ==================== ПАГИНАЦИЯ ====================

function нарисоватьПагинацию() {
    const всего = Math.ceil(отфильтрованные.length / ТОВАРОВ_НА_СТРАНИЦЕ);
    const контейнер = document.getElementById('пагинация');
    if (всего <= 1) { контейнер.innerHTML = ''; return; }

    let html = '';

    // Кнопка "назад"
    html += `<button class="стр-кнопка" id="стр-назад" ${текущаяСтраница === 1 ? 'disabled' : ''}>‹</button>`;

    // Кнопки страниц
    for (let i = 1; i <= всего; i++) {
        // Показываем не все — только первую, последнюю и соседние
        if (i === 1 || i === всего || Math.abs(i - текущаяСтраница) <= 2) {
            html += `<button class="стр-кнопка ${i === текущаяСтраница ? 'active' : ''}" data-стр="${i}">${i}</button>`;
        } else if (Math.abs(i - текущаяСтраница) === 3) {
            html += `<span style="color:var(--текст-светлый)">…</span>`;
        }
    }

    // Кнопка "вперёд"
    html += `<button class="стр-кнопка" id="стр-вперёд" ${текущаяСтраница === всего ? 'disabled' : ''}>›</button>`;

    контейнер.innerHTML = html;

    // Обработчики
    контейнер.querySelectorAll('[data-стр]').forEach(кнопка => {
        кнопка.addEventListener('click', () => {
            текущаяСтраница = +кнопка.getAttribute('data-стр');
            обновитьКаталог();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
    const назад = document.getElementById('стр-назад');
    const вперёд = document.getElementById('стр-вперёд');
    if (назад) назад.onclick = () => { if (текущаяСтраница > 1) { текущаяСтраница--; обновитьКаталог(); window.scrollTo({top:0, behavior:'smooth'}); }};
    if (вперёд) вперёд.onclick = () => { if (текущаяСтраница < всего) { текущаяСтраница++; обновитьКаталог(); window.scrollTo({top:0, behavior:'smooth'}); }};
}

// ==================== ТЕГИ ВЫБРАННЫХ ЦВЕТОВ ====================

function обновитьТегиЦветов() {
    const контейнер = document.getElementById('выбранные-цвета');
    if (!контейнер) return;
    if (фильтры.цвета.length === 0) { контейнер.innerHTML = ''; return; }
    контейнер.innerHTML = фильтры.цвета.map(ц => `
        <span class="тег-цвета" data-удалить-цвет="${ц}">
            ${ц} ✕
        </span>
    `).join('');
    контейнер.querySelectorAll('[data-удалить-цвет]').forEach(тег => {
        тег.addEventListener('click', () => {
            const ц = тег.getAttribute('data-удалить-цвет');
            фильтры.цвета = фильтры.цвета.filter(х => х !== ц);
            // Убираем active со свотча
            const свотч = document.querySelector(`[data-цвет="${ц}"]`);
            if (свотч) свотч.classList.remove('active');
            обновитьТегиЦветов();
            текущаяСтраница = 1;
            обновитьКаталог();
        });
    });
}

// ==================== ГЛАВНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ ====================

function обновитьКаталог() {
    применитьФильтры();
    применитьСортировку();
    нарисоватьТовары();
    нарисоватьПагинацию();
}

// ==================== ИНИЦИАЛИЗАЦИЯ ЭЛЕМЕНТОВ УПРАВЛЕНИЯ ====================

function инициализироватьУправление() {
    // Сортировка
    document.getElementById('сортировка').addEventListener('change', () => {
        текущаяСтраница = 1;
        обновитьКаталог();
    });

    // Переключение вида: сетка / список
    document.getElementById('вид-сетка').addEventListener('click', () => {
        текущийВид = 'сетка';
        document.getElementById('сетка-товаров').classList.remove('список');
        document.getElementById('вид-сетка').classList.add('active');
        document.getElementById('вид-список').classList.remove('active');
    });
    document.getElementById('вид-список').addEventListener('click', () => {
        текущийВид = 'список';
        document.getElementById('сетка-товаров').classList.add('список');
        document.getElementById('вид-список').classList.add('active');
        document.getElementById('вид-сетка').classList.remove('active');
    });

    // Фильтр по цене
    const ползунок = document.getElementById('ползунок-до');
    const полеДо = document.getElementById('цена-до');
    if (ползунок) {
        ползунок.addEventListener('input', () => {
            полеДо.value = ползунок.value;
        });
    }
    document.getElementById('применить-цену').addEventListener('click', () => {
        фильтры.ценаОт = +document.getElementById('цена-от').value || 0;
        фильтры.ценаДо = +document.getElementById('цена-до').value || 100000;
        текущаяСтраница = 1;
        обновитьКаталог();
    });

    // Сброс всех фильтров
    document.getElementById('сбросить-фильтры').addEventListener('click', () => {
        фильтры.подкатегория = null;
        фильтры.ценаОт = 0;
        фильтры.ценаДо = 100000;
        фильтры.бренды = [];
        фильтры.цвета = [];
        фильтры.поиск = '';
        document.getElementById('цена-от').value = 0;
        document.getElementById('цена-до').value = 100000;
        const ползунок = document.getElementById('ползунок-до');
        if (ползунок) ползунок.value = 100000;
        document.getElementById('поле-поиска').value = '';
        текущаяСтраница = 1;
        заполнитьФильтры();
        обновитьКаталог();
        уведомление('Фильтры сброшены');
    });

    // Поиск
    document.getElementById('поле-поиска').addEventListener('input', (e) => {
        фильтры.поиск = e.target.value;
        текущаяСтраница = 1;
        обновитьКаталог();
    });
}

// ==================== МОБИЛЬНЫЕ ФИЛЬТРЫ ====================

function инициализироватьМобФильтры() {
    const кнопка = document.getElementById('открыть-фильтры');
    if (!кнопка) return;

    // Добавляем оверлей в DOM
    const оверлей = document.createElement('div');
    оверлей.className = 'фильтр-оверлей';
    оверлей.id = 'фильтр-оверлей';
    document.body.appendChild(оверлей);

    кнопка.addEventListener('click', () => {
        const фильтры = document.querySelector('.фильтры');
        if (!фильтры) return;
        фильтры.classList.add('открыты');
        оверлей.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    const закрыть = () => {
        const фильтры = document.querySelector('.фильтры');
        if (фильтры) фильтры.classList.remove('открыты');
        оверлей.classList.remove('active');
        document.body.style.overflow = '';
    };

    оверлей.addEventListener('click', закрыть);

    // Кнопка «Сбросить» тоже закрывает мобильные фильтры
    const сброс = document.getElementById('сбросить-фильтры');
    if (сброс) сброс.addEventListener('click', закрыть);

    // Кнопка «Применить» закрывает
    const применить = document.getElementById('применить-цену');
    if (применить) применить.addEventListener('click', закрыть);
}

// ==================== ЗАПУСК ====================

document.addEventListener('DOMContentLoaded', () => {
    инициализироватьУправление();
    инициализироватьМобФильтры();
    загрузитьТовары();
});

// ==================== ЦВЕТА ТОЧЕК НА КАРТОЧКАХ ====================
// Запускается после отрисовки карточек
function раскраситьТочки() {
    const цветаHex = {
        'Белый': '#f8f5f0', 'Белый матовый': '#f0f0f0', 'Белый ясень': '#f5f0e8',
        'Белый дуб': '#ede8dc', 'Слоновая кость': '#fffff0', 'Дуб белый': '#ede5d0',
        'Чёрный': '#1a1a1a', 'Чёрный матовый': '#222', 'Антрацит': '#2d2d2d',
        'Чёрный бархат': '#1c1c1c', 'Графит': '#3d3d3d', 'Серый цемент': '#888',
        'Серый': '#9e9e9e', 'Серый бетон': '#aaaaaa', 'Рустик серый': '#b0a898',
        'Венге': '#3b1f0e', 'Тёмный орех': '#5c3317', 'Шоколад': '#7b4a2d',
        'Орех': '#8B6914', 'Дуб': '#c8a060', 'Натуральный дуб': '#c4934a',
        'Дуб беленый': '#d4bc8a', 'Дуб тёмный': '#8B6914', 'Тик': '#b8890a',
        'Хром': '#c0c0c0', 'Серебро': '#d0d0d0', 'Бронза': '#cd7f32',
        'Золото': '#ffd700', 'Антик серебро': '#c0c0b0', 'Антик медь': '#b87333',
        'Коричневый': '#8B4513', 'Рустик беж': '#d2b48c', 'Cappuccino': '#c9956c',
    };

    document.querySelectorAll('.карточка-цвет-точка').forEach(точка => {
        const назв = точка.getAttribute('title') || '';
        // Ищем совпадение
        const ключ = Object.keys(цветаHex).find(к =>
            назв.toLowerCase().includes(к.toLowerCase()) ||
            к.toLowerCase().includes(назв.toLowerCase())
        );
        if (ключ) точка.style.background = цветаHex[ключ];
    });
}
