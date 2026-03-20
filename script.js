// Данные игр
const games = [
    {
        id: 1,
        title: 'UNDERTALE',
        genre: 'RPG',
        author: 'Toby Fox',
        priceRub: 899,
        description: 'В этой своеобразной RPG вы управляете ребёнком, упавшим в подземный мир монстров. Сражайтесь или щадите врагов, находите друзей и раскройте тайны Подземелья.',
        imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/391540/header.jpg'
    },
    {
        id: 2,
        title: 'DELTARUNE',
        genre: 'RPG / Приключение',
        author: 'Toby Fox',
        priceRub: 0,
        description: 'Новая история с участием знакомых и новых персонажей. Исследуйте тёмный мир, сражайтесь с "воплощениями" и распутайте странные события.',
        imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1671210/header.jpg'
    },
    {
        id: 3,
        title: 'CUPHEAD',
        genre: 'Экшен / Платформер',
        author: 'Studio MDHR',
        priceRub: 1799,
        description: 'Классический платформер с рисованной анимацией в стиле 1930-х. Играйте за Чашку и Кружку, сражайтесь с боссами, чтобы вернуть долг дьяволу.',
        imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/268910/header.jpg'
    },
    {
        id: 4,
        title: 'HOLLOW KNIGHT',
        genre: 'Metroidvania',
        author: 'Team Cherry',
        priceRub: 1349,
        description: 'Окунитесь в мрачный мир насекомых. Исследуйте разрушенное королевство, сражайтесь с опасными тварями и раскройте древние тайны.',
        imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg'
    },
    {
        id: 5,
        title: 'STARDEW VALLEY',
        genre: 'Симулятор фермы',
        author: 'ConcernedApe',
        priceRub: 1349,
        description: 'Унаследуйте старую ферму и начните новую жизнь. Выращивайте урожай, заводите животных, дружите с жителями долины.',
        imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg'
    }
];

// Корзина текущего пользователя
let cart = [];

// Хранение пользователей
let users = [];

// Текущий пользователь (логин)
let currentUser = null;

// Элементы DOM
const gamesGrid = document.getElementById('games-grid');
const searchInput = document.getElementById('search-input');
const cartCountSpan = document.getElementById('cart-count');
const modalOverlay = document.getElementById('modal-overlay');
const modalDetails = document.getElementById('modal-details');
const modalClose = document.getElementById('modal-close');

const profileModal = document.getElementById('profile-modal');
const profileClose = document.getElementById('profile-modal-close');
const profileDetails = document.getElementById('profile-details');

const cartModal = document.getElementById('cart-modal');
const cartModalClose = document.getElementById('cart-modal-close');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const userBlock = document.getElementById('user-block');
const usernameDisplay = document.getElementById('username-display');
const cartBlock = document.getElementById('cart-block');

const authModal = document.getElementById('auth-modal');
const authModalClose = document.getElementById('auth-modal-close');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginSubmit = document.getElementById('login-submit');
const registerSubmit = document.getElementById('register-submit');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

// ========== Инициализация хранилища ==========
function loadUsers() {
    const storedUsers = localStorage.getItem('understore_users');
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    } else {
        // Тестовый пользователь для демо
        users = [{ username: 'player', password: '123' }];
        saveUsers();
    }
}

function saveUsers() {
    localStorage.setItem('understore_users', JSON.stringify(users));
}

function loadCurrentUser() {
    const storedUser = localStorage.getItem('understore_current_user');
    if (storedUser) {
        currentUser = storedUser;
        loadCartForUser(currentUser);
        updateUIForAuth();
    } else {
        currentUser = null;
        cart = [];
        updateUIForAuth();
    }
}

function saveCurrentUser() {
    if (currentUser) {
        localStorage.setItem('understore_current_user', currentUser);
    } else {
        localStorage.removeItem('understore_current_user');
    }
}

// Корзина для пользователя
function saveCartForUser() {
    if (currentUser) {
        localStorage.setItem(`cart_${currentUser}`, JSON.stringify(cart));
    }
}

function loadCartForUser(username) {
    const storedCart = localStorage.getItem(`cart_${username}`);
    if (storedCart) {
        cart = JSON.parse(storedCart);
    } else {
        cart = [];
    }
    updateCartCounter();
}

// ========== Функции авторизации ==========
function login(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = username;
        saveCurrentUser();
        loadCartForUser(currentUser);
        updateUIForAuth();
        closeAuthModal();
        return true;
    } else {
        loginError.textContent = 'Неверный логин или пароль';
        return false;
    }
}

function register(username, password) {
    if (users.find(u => u.username === username)) {
        registerError.textContent = 'Пользователь с таким именем уже существует';
        return false;
    }
    if (username.trim() === '' || password.trim() === '') {
        registerError.textContent = 'Логин и пароль не могут быть пустыми';
        return false;
    }
    users.push({ username, password });
    saveUsers();
    // Автоматически входим после регистрации
    currentUser = username;
    saveCurrentUser();
    cart = [];
    saveCartForUser();
    updateUIForAuth();
    closeAuthModal();
    return true;
}

function logout() {
    // Сохраняем корзину перед выходом
    if (currentUser) {
        saveCartForUser();
    }
    currentUser = null;
    cart = [];
    saveCurrentUser();
    updateUIForAuth();
    closeProfileModal(); // если открыт профиль
    updateCartCounter();
}

function updateUIForAuth() {
    if (currentUser) {
        usernameDisplay.textContent = currentUser;
        userBlock.style.cursor = 'pointer';
    } else {
        usernameDisplay.textContent = 'Войти';
        userBlock.style.cursor = 'pointer';
    }
    // Обновляем кнопку оформления заказа в корзине (при её открытии будет проверка)
}

// ========== Функции корзины ==========
function updateCartCounter() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = totalItems;
    if (currentUser) saveCartForUser();
}

function addToCart(gameId) {
    if (!currentUser) {
        alert('Пожалуйста, войдите в аккаунт, чтобы добавить товары в корзину.');
        openAuthModal();
        return false;
    }
    const existing = cart.find(item => item.id === gameId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: gameId, quantity: 1 });
    }
    updateCartCounter();
    // Если корзина открыта, обновляем её
    if (cartModal.classList.contains('active')) {
        renderCartModal();
    }
    return true;
}

function removeFromCart(gameId) {
    const index = cart.findIndex(item => item.id === gameId);
    if (index !== -1) {
        cart.splice(index, 1);
        updateCartCounter();
        renderCartModal();
    }
}

function changeQuantity(gameId, delta) {
    const item = cart.find(item => item.id === gameId);
    if (item) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            removeFromCart(gameId);
        } else {
            item.quantity = newQty;
            updateCartCounter();
            renderCartModal();
        }
    }
}

function getGameById(id) {
    return games.find(g => g.id === id);
}

function renderCartModal() {
    if (!cartItemsContainer) return;

    if (!currentUser) {
        cartItemsContainer.innerHTML = '<p style="text-align:center;">Войдите в аккаунт, чтобы видеть корзину</p>';
        cartTotalSpan.textContent = 'Итого: 0 ₽';
        checkoutBtn.disabled = true;
        checkoutBtn.style.opacity = '0.5';
        checkoutBtn.style.cursor = 'not-allowed';
        return;
    }

    checkoutBtn.disabled = false;
    checkoutBtn.style.opacity = '1';
    checkoutBtn.style.cursor = 'pointer';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center;">Корзина пуста</p>';
        cartTotalSpan.textContent = 'Итого: 0 ₽';
        return;
    }

    let total = 0;
    let itemsHtml = '';

    cart.forEach(cartItem => {
        const game = getGameById(cartItem.id);
        if (!game) return;
        const itemTotal = game.priceRub * cartItem.quantity;
        total += itemTotal;

        itemsHtml += `
            <div class="cart-item" data-id="${game.id}">
                <img class="cart-item-img" src="${game.imageUrl}" alt="${game.title}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${game.title}</div>
                    <div class="cart-item-price">${game.priceRub} ₽</div>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-quantity">
                        <button class="qty-minus" data-id="${game.id}">-</button>
                        <span>${cartItem.quantity}</span>
                        <button class="qty-plus" data-id="${game.id}">+</button>
                    </div>
                    <button class="cart-item-remove" data-id="${game.id}">🗑️</button>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = itemsHtml;
    cartTotalSpan.textContent = `Итого: ${total} ₽`;

    // Навешиваем обработчики
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            changeQuantity(id, -1);
        });
    });
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            changeQuantity(id, 1);
        });
    });
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            removeFromCart(id);
        });
    });
}

// ========== Рендер карточек ==========
function renderGames(filterText = '') {
    const filtered = games.filter(game =>
        game.title.toLowerCase().includes(filterText.toLowerCase())
    );

    gamesGrid.innerHTML = '';
    filtered.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.id = game.id;

        card.innerHTML = `
            <div class="game-image"><img src="${game.imageUrl}" alt="${game.title}"></div>
            <div class="game-title">${game.title}</div>
            <div class="game-genre">${game.genre}</div>
            <div class="game-author">${game.author}</div>
            <div class="game-price">${game.priceRub} ₽</div>
        `;

        card.addEventListener('click', () => openModal(game));
        gamesGrid.appendChild(card);
    });
}

// ========== Модальное окно игры ==========
function openModal(game) {
    modalDetails.innerHTML = `
        <h2>${game.title}</h2>
        <div class="modal-image"><img src="${game.imageUrl}" alt="${game.title}"></div>
        <p><strong>Жанр:</strong> ${game.genre}</p>
        <p><strong>Автор:</strong> ${game.author}</p>
        <p><strong>Описание:</strong> ${game.description}</p>
        <div class="price">${game.priceRub} ₽</div>
        <button class="add-to-cart-btn" id="modal-add-to-cart">➕ В корзину</button>
    `;

    modalOverlay.classList.add('active');

    const addBtn = document.getElementById('modal-add-to-cart');
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(game.id);
    });
}

// ========== Модалка профиля ==========
function openProfileModal() {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    profileDetails.innerHTML = `
        <h2>Профиль</h2>
        <div class="profile-avatar">👤</div>
        <p><strong>Имя:</strong> ${currentUser}</p>
        <p><strong>На счету:</strong> 5000 ₽</p>
        <p><strong>Скидка:</strong> 5% на второй заказ</p>
        <button class="logout-btn" id="logout-btn">Выйти</button>
    `;
    profileModal.classList.add('active');
    document.getElementById('logout-btn').addEventListener('click', () => {
        logout();
        closeProfileModal();
    });
}

function closeProfileModal() {
    profileModal.classList.remove('active');
}

// ========== Модалка корзины ==========
function openCartModal() {
    renderCartModal();
    cartModal.classList.add('active');
}

function closeCartModal() {
    cartModal.classList.remove('active');
}

// ========== Модалка авторизации ==========
function openAuthModal() {
    // Сброс ошибок и полей
    loginError.textContent = '';
    registerError.textContent = '';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-password').value = '';
    // По умолчанию показываем форму входа
    document.querySelector('.auth-tab[data-tab="login"]').click();
    authModal.classList.add('active');
}

function closeAuthModal() {
    authModal.classList.remove('active');
}

function switchAuthTab(tabId) {
    if (tabId === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
    authTabs.forEach(tab => {
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// ========== Поиск ==========
searchInput.addEventListener('input', (e) => {
    renderGames(e.target.value);
});

// ========== Обработчики ==========
modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
});

profileClose.addEventListener('click', closeProfileModal);
profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) closeProfileModal();
});

cartBlock.addEventListener('click', openCartModal);
cartModalClose.addEventListener('click', closeCartModal);
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) closeCartModal();
});

userBlock.addEventListener('click', () => {
    if (currentUser) {
        openProfileModal();
    } else {
        openAuthModal();
    }
});

// Авторизация
authModalClose.addEventListener('click', closeAuthModal);
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
});

authTabs.forEach(tab => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
});

loginSubmit.addEventListener('click', () => {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    login(username, password);
});

registerSubmit.addEventListener('click', () => {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    register(username, password);
});

// Оформление заказа
checkoutBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert('Необходимо войти в аккаунт для оформления заказа.');
        openAuthModal();
        return;
    }
    if (cart.length === 0) {
        alert('Корзина пуста');
        return;
    }
    alert('Заказ оформлен! Спасибо за покупку!');
    cart = [];
    updateCartCounter();
    closeCartModal();
    renderCartModal(); // обновим на случай, если корзина ещё открыта
    if (currentUser) saveCartForUser();
});

// ========== Инициализация ==========
loadUsers();
loadCurrentUser();
renderGames();
updateCartCounter();