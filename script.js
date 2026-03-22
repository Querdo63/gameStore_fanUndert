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
    } catch (err) {
        console.error("Ошибка корзины:", err);
    }
}

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    if (!container || !totalEl) return;

    container.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        // Защита от ошибки "Данные игры не найдены"
        const game = item.game || { title: "Игра удалена", price: 0 };
        total += game.price * item.quantity;

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
    const count = document.getElementById('cart-count');
    if (count) count.textContent = cart.length;
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
    });

    // Поиск
    document.getElementById('search-input').oninput = (e) => renderGames(e.target.value);

    // Блоки в сайдбаре
    document.getElementById('user-block').onclick = () => {
        if (!currentUser) {
            document.getElementById('auth-modal').style.display = 'flex';
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