const API_URL = 'http://127.0.0.1:8000';

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = [];

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log("Приложение запущено");
    updateUI();
    renderGames();
    if (currentUser) loadCart();
    setupEventListeners();
});

// 1. Отрисовка игр
async function renderGames(filterText = '') {
    try {
        const response = await fetch(`${API_URL}/games`);
        const games = await response.json();
        const grid = document.getElementById('games-grid');
        if (!grid) return;

        grid.innerHTML = '';
        games.filter(g => g.title.toLowerCase().includes(filterText.toLowerCase()))
             .forEach(game => {
                const card = document.createElement('div');
                card.className = 'game-card';
                card.innerHTML = `
                    <div class="game-image"><img src="${game.image_url || ''}" alt="${game.title}"></div>
                    <div class="game-title">${game.title}</div>
                    <div class="game-genre">${game.genre || 'RPG'}</div>
                    <div class="game-price">${game.price} ₽</div>
                `;
                // Используем addEventListener вместо onclick для надежности
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log("Клик по игре:", game.title);
                    openModal(game);
                });
                grid.appendChild(card);
            });
    } catch (err) {
        console.error("Ошибка загрузки игр:", err);
    }
}

// Пополнение баланса
async function topupBalance() {
    if (!currentUser) return;
    const response = await fetch(`${API_URL}/users/${currentUser.id}/topup`, { method: 'POST' });
    const updatedUser = await response.json();
    currentUser.balance = updatedUser.balance;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUI();
}

// Удаление из корзины
async function removeFromCart(cartId) {
    await fetch(`${API_URL}/cart/remove/${cartId}`, { method: 'DELETE' });
    loadCart(); // Перерисовываем корзину
}

// Показ библиотеки
async function loadLibrary() {
    if (!currentUser) return;
    const response = await fetch(`${API_URL}/library/${currentUser.id}`);
    const items = await response.json();
    const container = document.getElementById('library-items-container');
    
    container.innerHTML = items.length ? items.map(item => `
        <div class="cart-item">
            <span>${item.game.title}</span>
            <span style="color: #0f0;">УСТАНОВЛЕНО</span>
        </div>
    `).join('') : "Пока тут пусто...";
    
    document.getElementById('library-modal').style.display = 'flex';
}

async function clearCart() {
    if (!currentUser) return;
    if (!confirm("Вы уверены, что хотите очистить всю корзину?")) return;

    try {
        const response = await fetch(`${API_URL}/cart/clear/${currentUser.id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadCart(); // Обновляем интерфейс
        }
    } catch (err) {
        console.error("Ошибка при очистке корзины:", err);
    }
}

// 2. Открытие модального окна (с исправлением контента)
function openModal(game) {
    const overlay = document.getElementById('modal-overlay');
    const details = document.getElementById('modal-details');
    
    if (!overlay || !details) {
        console.error("Не найдены элементы модального окна в HTML!");
        return;
    }

    // Заполняем данными. Используем структуру, которая точно есть в CSS
    details.innerHTML = `
        <div class="modal-image"><img src="${game.image_url}" alt="${game.title}"></div>
        <h2>${game.title}</h2>
        <p><strong>Жанр:</strong> ${game.genre}</p>
        <p><strong>Автор:</strong> ${game.author}</p>
        <p>${game.description || 'Описание отсутствует'}</p>
        <div class="price">${game.price} ₽</div>
        <button class="add-to-cart-btn" id="modal-buy-action">ДОБАВИТЬ В КОРЗИНУ</button>
    `;

    // Принудительно показываем через инлайновый стиль, чтобы перебить CSS
    overlay.style.display = 'flex';
    overlay.classList.add('active');

    document.getElementById('modal-buy-action').onclick = () => {
        if (!currentUser) {
            alert("Сначала войдите в аккаунт");
            overlay.style.display = 'none';
            document.getElementById('auth-modal').style.display = 'flex';
        } else {
            addToCart(game.id);
            overlay.style.display = 'none';
        }
    };
}

// 3. Логика корзины (с защитой от 500 ошибки и пустых игр)
async function loadCart() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${API_URL}/cart/${currentUser.id}`);
        if (!response.ok) return;
        cart = await response.json();
        updateCartUI();
        const total = calculateTotal(); // предположим, сумма считается тут
    const creditBtn = document.getElementById('credit-btn');
    
    // Показываем кнопку кредита, если денег меньше, чем сумма корзины
    if (currentUser && currentUser.balance < total) {
        creditBtn.style.display = 'block';
    } else {
        creditBtn.style.display = 'none';
    }
    } catch (err) {
        console.error("Ошибка корзины:", err);
    }
}

// Новая функция для подсчета суммы
function calculateTotal() {
    let total = 0;
    cart.forEach(item => {
        if (item.game) {
            total += item.game.price * item.quantity;
        }
    });
    return total;
}

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    if (!container || !totalEl) return;

    container.innerHTML = '';
    let total = 0;
    let totalItems = 0; // Добавили переменную для счетчика

    cart.forEach(item => {
        // Если бэкенд не прислал игру, ставим заглушку
        const game = item.game || { title: "Ошибка загрузки", price: 0 };

        total += game.price * item.quantity;
        totalItems += item.quantity; // Считаем общее количество

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-title">${game.title}</div>
                <div>${game.price} ₽ x ${item.quantity}</div>
            </div>
        `;
        container.appendChild(div);
    });

    totalEl.textContent = `ИТОГО: ${total} ₽`;

    // Обновляем счетчик в меню
    const count = document.getElementById('cart-count');
    if (count) count.textContent = totalItems;
}

// 4. События и Кнопки
function setupEventListeners() {
    // Закрытие модалок
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.modal-overlay').forEach(m => {
                m.style.display = 'none';
                m.classList.remove('active');
            });
        };
    document.getElementById('library-btn').addEventListener('click', loadLibrary);
    document.getElementById('credit-btn').onclick = takeCredit;
    document.getElementById('library-btn').onclick = loadLibrary;
    document.getElementById('clear-cart-btn').onclick = clearCart;
    });

    // Поиск
    document.getElementById('search-input').oninput = (e) => renderGames(e.target.value);

    // Блоки в сайдбаре
    document.getElementById('user-block').onclick = () => {
        if (!currentUser) {
            // Если не авторизован - показываем окно входа
            document.getElementById('auth-modal').style.display = 'flex';
        } else {
            // Если авторизован - спрашиваем, хочет ли он выйти
            if (confirm("Вы хотите выйти из аккаунта?")) {
                localStorage.removeItem('currentUser'); // Удаляем из памяти браузера
                location.reload(); // Перезагружаем страницу
            }
        }
    };

    document.getElementById('cart-block').onclick = () => {
        if (currentUser) {
            loadCart();
            document.getElementById('cart-modal').style.display = 'flex';
        } else {
            alert("Войдите в аккаунт");
        }
    };

    // Авторизация
    document.getElementById('login-submit').onclick = () => handleAuth('login');
    document.getElementById('register-submit').onclick = () => handleAuth('register');

    document.getElementById('checkout-btn').onclick = handleCheckout;

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.onclick = (e) => {
            // 1. Убираем красное подчеркивание со всех вкладок
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));

            // 2. Делаем активной ту вкладку, на которую только что нажали
            e.target.classList.add('active');

            // 3. Узнаем, какую форму нужно показать ('login' или 'reg')
            const targetForm = e.target.dataset.tab;

            // 4. Скрываем одну форму и показываем другую
            if (targetForm === 'login') {
                document.getElementById('login-form').classList.remove('hidden');
                document.getElementById('register-form').classList.add('hidden');
            } else {
                document.getElementById('login-form').classList.add('hidden');
                document.getElementById('register-form').classList.remove('hidden');
            }
        };
    });
}


// Функция пополнения
async function takeCredit() {
    if (!currentUser) return;
    const response = await fetch(`${API_URL}/users/${currentUser.id}/topup`, { method: 'POST' });
    const updatedUser = await response.json();
    
    // Обновляем данные локально
    currentUser.balance = updatedUser.balance;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUI();
    loadCart(); // Пересчитываем корзину, чтобы скрыть/показать кнопку
}

// Вспомогательные функции (Auth/UI)
async function handleAuth(type) {
    const prefix = type === 'login' ? 'login' : 'reg';
    const username = document.getElementById(`${prefix}-username`).value;
    const password = document.getElementById(`${prefix}-password`).value;
    
    try {
        const endpoint = type === 'login' ? 'login' : 'register';
        const res = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        if (res.ok) {
            const data = await res.json();
            if (type === 'login') {
                localStorage.setItem('currentUser', JSON.stringify(data));
                location.reload();
            } else {
                alert("Успех! Войдите.");
            }
        }
    } catch (e) { console.error(e); }
}

function updateUI() {
    const display = document.getElementById('username-display');
    if (display && currentUser) {
        display.textContent = `${currentUser.username} (${currentUser.balance} ₽)`;
    }
}

async function addToCart(gameId) {
    await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_id: currentUser.id, game_id: gameId, quantity: 1})
    });
    loadCart();
}

// Функция оформления заказа
async function handleCheckout() {
    if (!currentUser) return;

    try {
        // Отправляем запрос на бэкенд
        const response = await fetch(`${API_URL}/cart/checkout/${currentUser.id}`, {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            // Если всё прошло успешно
            alert("Успешно! " + result.message);

            // Обновляем баланс пользователя в памяти браузера
            currentUser.balance = result.new_balance;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Обновляем имя и баланс в левом меню
            updateUI();

            // Закрываем корзину и перезагружаем её (она станет пустой)
            document.getElementById('cart-modal').style.display = 'none';
            document.getElementById('cart-modal').classList.remove('active');
            loadCart();
        } else {
            // Если бэкенд вернул ошибку (например, недостаточно денег)
            alert("Ошибка: " + result.detail);
        }
    } catch (err) {
        console.error("Ошибка при оформлении заказа:", err);
        alert("Произошла ошибка при связи с сервером.");
    }
}