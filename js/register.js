/* ========================================================
   register.js — логика регистрации с валидацией
   ======================================================== */

// ==================== ВАЛИДАЦИЯ ПОЛЕЙ ====================
// Правила:
// - Имя: минимум 2 слова, только буквы
// - Email: формат user@domain.ru
// - Телефон: российский формат +7 или 8
// - Пароль: минимум 6 символов, есть цифра и буква
// - Пароль2: совпадает с паролем
// - Согласие: отмечено

const правила = {
    имя(значение) {
        if (!значение) return 'Введите имя и фамилию';
        if (значение.trim().split(/\s+/).length < 2) return 'Введите имя и фамилию через пробел';
        if (!/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(значение)) return 'Только буквы, пробел и дефис';
        return '';
    },
    email(значение) {
        if (!значение) return 'Введите email';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(значение)) return 'Неверный формат email';
        return '';
    },
    телефон(значение) {
        if (!значение) return 'Введите телефон';
        const чистый = значение.replace(/[\s\-()]/g, '');
        if (!/^(\+7|8)\d{10}$/.test(чистый)) return 'Формат: +7 (999) 000-00-00';
        return '';
    },
    пароль(значение) {
        if (!значение) return 'Введите пароль';
        if (значение.length < 6) return 'Минимум 6 символов';
        if (!/\d/.test(значение)) return 'Пароль должен содержать цифру';
        if (!/[a-zA-Zа-яА-Я]/.test(значение)) return 'Пароль должен содержать букву';
        return '';
    },
    пароль2(значение) {
        const пароль = document.getElementById('рег-пароль').value;
        if (!значение) return 'Повторите пароль';
        if (значение !== пароль) return 'Пароли не совпадают';
        return '';
    },
    согласие() {
        if (!document.getElementById('рег-согласие').checked) return 'Необходимо согласие';
        return '';
    }
};

// Показываем ошибку или успех у поля
function показатьСтатусПоля(поле, ошибкаЭл, ошибка) {
    if (ошибка) {
        поле.classList.add('ошибка');
        поле.classList.remove('успех');
        ошибкаЭл.textContent = ошибка;
    } else {
        поле.classList.remove('ошибка');
        поле.classList.add('успех');
        ошибкаЭл.textContent = '';
    }
}

// Проверяем одно поле
function проверитьПоле(идПоля, правило) {
    const поле = document.getElementById(идПоля);
    const ошибкаЭл = document.getElementById('ошибка-' + идПоля.replace('рег-', ''));
    if (!поле || !ошибкаЭл) return true;
    const ошибка = правило(поле.value.trim());
    показатьСтатусПоля(поле, ошибкаЭл, ошибка);
    return !ошибка;
}

// ==================== СИЛА ПАРОЛЯ ====================

function вычислитьСилуПароля(пароль) {
    let сила = 0;
    if (пароль.length >= 6)  сила++;
    if (пароль.length >= 10) сила++;
    if (/\d/.test(пароль))   сила++;
    if (/[A-Z]/.test(пароль) || /[А-Я]/.test(пароль)) сила++;
    if (/[!@#$%^&*]/.test(пароль)) сила++;
    return сила;
}

function обновитьСилуПароля() {
    const пароль = document.getElementById('рег-пароль').value;
    const полоска = document.getElementById('сила-полоска');
    const текст = document.getElementById('сила-текст');
    if (!полоска) return;

    if (!пароль) { полоска.style.width = '0'; текст.textContent = ''; return; }

    const сила = вычислитьСилуПароля(пароль);
    const уровни = [
        { ширина: '20%', цвет: '#e74c3c', текст: 'Очень слабый' },
        { ширина: '40%', цвет: '#e67e22', текст: 'Слабый' },
        { ширина: '60%', цвет: '#f39c12', текст: 'Средний' },
        { ширина: '80%', цвет: '#27ae60', текст: 'Хороший' },
        { ширина: '100%', цвет: '#1abc9c', текст: 'Отличный' },
    ];
    const уровень = уровни[Math.min(сила - 1, 4)] || уровни[0];
    полоска.style.width = уровень.ширина;
    полоска.style.background = уровень.цвет;
    текст.textContent = уровень.текст;
    текст.style.color = уровень.цвет;
}

// ==================== ПОКАЗАТЬ/СКРЫТЬ ПАРОЛЬ ====================

function настроитьКнопкиПоказатьПароль() {
    [['показать-пароль', 'рег-пароль'], ['показать-пароль2', 'рег-пароль2']].forEach(([идКн, идПоля]) => {
        const кн = document.getElementById(идКн);
        const поле = document.getElementById(идПоля);
        if (!кн || !поле) return;
        кн.addEventListener('click', () => {
            const скрыт = поле.type === 'password';
            поле.type = скрыт ? 'text' : 'password';
            кн.textContent = скрыт ? '🙈' : '👁';
        });
    });
}

// ==================== МАСКА ТЕЛЕФОНА ====================

function настроитьМаскуТелефона() {
    const поле = document.getElementById('рег-телефон');
    if (!поле) return;
    поле.addEventListener('input', () => {
        let значение = поле.value.replace(/\D/g, '');
        if (значение.startsWith('8')) значение = '7' + значение.slice(1);
        if (значение.startsWith('7')) {
            let форматированный = '+7';
            if (значение.length > 1) форматированный += ' (' + значение.slice(1, 4);
            if (значение.length >= 4) форматированный += ') ' + значение.slice(4, 7);
            if (значение.length >= 7) форматированный += '-' + значение.slice(7, 9);
            if (значение.length >= 9) форматированный += '-' + значение.slice(9, 11);
            поле.value = форматированный;
        }
    });
}

// ==================== ОТПРАВКА ФОРМЫ ====================

async function отправитьФорму(событие) {
    событие.preventDefault();

    // Проверяем все поля
    const результаты = [
        проверитьПоле('рег-имя',      правила.имя),
        проверитьПоле('рег-email',    правила.email),
        проверитьПоле('рег-телефон',  правила.телефон),
        проверитьПоле('рег-пароль',   правила.пароль),
        проверитьПоле('рег-пароль2',  правила.пароль2),
    ];

    // Согласие отдельно (у него нет .поле-ввода)
    const согласие = document.getElementById('рег-согласие');
    const ошибкаСогл = document.getElementById('ошибка-согласие');
    const согласиеОК = согласие.checked;
    if (!согласиеОК) ошибкаСогл.textContent = 'Необходимо согласие с условиями';
    else ошибкаСогл.textContent = '';
    результаты.push(согласиеОК);

    if (результаты.includes(false)) return; // есть ошибки — стоп

    // Проверяем, не занят ли email
    try {
        const resp = await fetch('data/users.json');
        const пользователи = await resp.json();
        const emailПоле = document.getElementById('рег-email');
        const существует = пользователи.some(u => u.email === emailПоле.value.trim());

        if (существует) {
            показатьСтатусПоля(emailПоле, document.getElementById('ошибка-email'), 'Этот email уже зарегистрирован');
            return;
        }

        // Создаём нового пользователя (сохраняем в localStorage)
        const новыйПользователь = {
            id: Date.now(),
            name: document.getElementById('рег-имя').value.trim(),
            email: emailПоле.value.trim(),
            password: document.getElementById('рег-пароль').value,
            phone: document.getElementById('рег-телефон').value.trim(),
            role: 'user',
            avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
            createdAt: new Date().toISOString().split('T')[0]
        };

        // В реальном проекте — POST запрос на сервер
        // Здесь сразу логиним пользователя
        localStorage.setItem('пользователь', JSON.stringify(новыйПользователь));

        уведомление('Регистрация прошла успешно! Добро пожаловать!', 'успех');

        // Блокируем кнопку чтобы не нажали дважды
        const кнопка = document.getElementById('кнопка-регистрации');
        кнопка.disabled = true;
        кнопка.textContent = '✓ Готово!';

        setTimeout(() => window.location.href = 'index.html', 1200);

    } catch (e) {
        уведомление('Ошибка при регистрации. Попробуйте позже.', 'ошибка');
    }
}

// ==================== ЗАПУСК ====================

document.addEventListener('DOMContentLoaded', () => {
    настроитьКнопкиПоказатьПароль();
    настроитьМаскуТелефона();

    // Валидация при вводе (в реальном времени)
    document.getElementById('рег-имя')?.addEventListener('blur', () => проверитьПоле('рег-имя', правила.имя));
    document.getElementById('рег-email')?.addEventListener('blur', () => проверитьПоле('рег-email', правила.email));
    document.getElementById('рег-телефон')?.addEventListener('blur', () => проверитьПоле('рег-телефон', правила.телефон));
    document.getElementById('рег-пароль')?.addEventListener('input', () => {
        обновитьСилуПароля();
        if (document.getElementById('рег-пароль').value.length > 3) {
            проверитьПоле('рег-пароль', правила.пароль);
        }
    });
    document.getElementById('рег-пароль2')?.addEventListener('input', () => проверитьПоле('рег-пароль2', правила.пароль2));

    document.getElementById('форма-регистрации')?.addEventListener('submit', отправитьФорму);
});
