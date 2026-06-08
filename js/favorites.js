/* ========================================================
   favorites.js — логика страницы избранного
   ======================================================== */

async function загрузитьИзбранное() {
    const польз = получитьПользователя();
    if (!польз) {
        document.getElementById('блок-не-залогинен').style.display = 'block';
        return;
    }

    const избранное = получитьИзбранное();
    document.getElementById('заголовок-кол').textContent = избранное.length ? `(${избранное.length})` : '';

    if (избранное.length === 0) {
        document.getElementById('блок-пусто').style.display = 'block';
        return;
    }

    try {
        const resp = await fetch('data/products.json');
        const всеТовары = await resp.json();
        const сетка = document.getElementById('сетка-избранного');

        const товары = избранное
            .map(з => всеТовары.find(т => т.id === з.idТовара))
            .filter(Boolean);

        if (товары.length === 0) {
            document.getElementById('блок-пусто').style.display = 'block';
            return;
        }

        сетка.innerHTML = товары.map(т => {
            const скидка = т.oldPrice ? Math.round((1 - т.price / т.oldPrice) * 100) : 0;
            const вК = вКорзине(т.id);
            return `
            <div class="карточка" data-id="${т.id}">
                <div class="картинка-товара">
                    <div class="бейджи-товара">
                        ${т.isSale && скидка ? `<span class="метка метка-скидка">-${скидка}%</span>` : ''}
                        ${т.isNew ? '<span class="метка метка-новинка">Новинка</span>' : ''}
                    </div>
                    <img src="${т.image}" alt="${т.name}" loading="lazy"
                         onerror="this.style.display='none'">
                    <!-- Кнопка убрать из избранного -->
                    <div class="кнопка-избранного в-избранном" data-убрать="${т.id}" title="Убрать из избранного">♥</div>
                </div>
                <div class="инфо-товара">
                    <div class="бренд">${т.brand}</div>
                    <div class="название-товара">${т.name}</div>
                    <div><span class="звезды">${звёзды(т.rating)}</span><span class="отзывы-кол">(${т.reviewCount})</span></div>
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

        // Кнопки убрать из избранного
        сетка.querySelectorAll('[data-убрать]').forEach(кн => {
            кн.addEventListener('click', e => {
                e.stopPropagation();
                const id = +кн.getAttribute('data-убрать');
                добавитьВИзбранное(id); // toggle — если уже в избранном, удалит
                загрузитьИзбранное();
            });
        });

        // Кнопки корзины
        сетка.querySelectorAll('[data-корзина]').forEach(кн => {
            кн.addEventListener('click', e => {
                e.stopPropagation();
                const id = +кн.getAttribute('data-корзина');
                if (вКорзине(id)) { удалитьИзКорзины(id); } else { добавитьВКорзину(id); }
                загрузитьИзбранное();
            });
        });

        // Клик по карточке
        сетка.querySelectorAll('.карточка').forEach(к => {
            к.addEventListener('click', () => {
                window.location.href = `product.html?id=${к.getAttribute('data-id')}`;
            });
        });

    } catch (e) {
        уведомление('Ошибка загрузки данных', 'ошибка');
    }
}

document.addEventListener('DOMContentLoaded', загрузитьИзбранное);
