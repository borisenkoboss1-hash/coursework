/* ========================================================
   login.js — логика страницы входа
   ======================================================== */

// Если уже залогинен — на главную
if (получитьПользователя()) {
    window.location.href = 'index.html';
}

async function войти(событие) {
    событие.preventDefault();

    const emailПоле  = document.getElementById('вх-email');
    const парольПоле = document.getElementById('вх-пароль');
    const ошибкаEmail  = document.getElementById('ошибка-вх-email');
    const ошибкаПароль = document.getElementById('ошибка-вх-пароль');

    // Сбрасываем ошибки
    ошибкаEmail.textContent = '';
    ошибкаПароль.textContent = '';
    emailПоле.classList.remove('ошибка', 'успех');
    парольПоле.classList.remove('ошибка', 'успех');

    const email  = emailПоле.value.trim();
    const пароль = парольПоле.value;

    let ок = true;
    if (!email) { ошибкаEmail.textContent = 'Введите email'; emailПоле.classList.add('ошибка'); ок = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { ошибкаEmail.textContent = 'Неверный формат email'; emailПоле.classList.add('ошибка'); ок = false; }
    if (!пароль) { ошибкаПароль.textContent = 'Введите пароль'; парольПоле.classList.add('ошибка'); ок = false; }
    if (!ок) return;

    try {
        const resp = await fetch('data/users.json');
        const пользователи = await resp.json();
        const польз = пользователи.find(u => u.email === email && u.password === пароль);

        if (!польз) {
            ошибкаEmail.textContent = 'Неверный email или пароль';
            emailПоле.classList.add('ошибка');
            парольПоле.classList.add('ошибка');
            return;
        }

        localStorage.setItem('пользователь', JSON.stringify(польз));
        уведомление(`Добро пожаловать, ${польз.name}!`, 'успех');

        const кнопка = document.getElementById('кнопка-входа-стр');
        кнопка.disabled = true;
        кнопка.textContent = '✓ Входим...';

        // Администратор → панель админа, пользователь → главная
        setTimeout(() => {
            window.location.href = польз.role === 'admin' ? 'admin.html' : 'index.html';
        }, 800);

    } catch (e) {
        уведомление('Ошибка подключения к серверу', 'ошибка');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('форма-входа')?.addEventListener('submit', войти);

    // Показать/скрыть пароль
    const кн = document.getElementById('показать-вх-пароль');
    const поле = document.getElementById('вх-пароль');
    if (кн && поле) {
        кн.addEventListener('click', () => {
            поле.type = поле.type === 'password' ? 'text' : 'password';
            кн.textContent = поле.type === 'password' ? '👁' : '🙈';
        });
    }
});
