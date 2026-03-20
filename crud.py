from fastapi import FastAPI

from sqlalchemy.orm import Session
from sqlalchemy import and_
import models, schemas

# ========== CRUD для игр ==========
def get_games(db: Session, skip: int = 0, limit: int = 100):
    """Получить все игры"""
    return db.query(models.Game).offset(skip).limit(limit).all()

def get_game(db: Session, game_id: int):
    """Получить игру по ID"""
    return db.query(models.Game).filter(models.Game.id == game_id).first()

def create_game(db: Session, game: schemas.GameCreate):
    """Создать новую игру"""
    db_game = models.Game(**game.model_dump())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game

def update_game(db: Session, game_id: int, game: schemas.GameUpdate):
    """Обновить игру"""
    db_game = get_game(db, game_id)
    if db_game:
        update_data = game.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_game, key, value)
        db.commit()
        db.refresh(db_game)
    return db_game

def delete_game(db: Session, game_id: int):
    """Удалить игру"""
    db_game = get_game(db, game_id)
    if db_game:
        db.delete(db_game)
        db.commit()
        return True
    return False


# ========== CRUD для пользователей ==========
def get_user_by_username(db: Session, username: str):
    """Получить пользователя по имени"""
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_id(db: Session, user_id: int):
    """Получить пользователя по ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    """Создать пользователя"""
    db_user = models.User(username=user.username, password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    """Аутентификация пользователя"""
    user = get_user_by_username(db, username)
    if user and user.password == password:
        return user
    return None


# ========== CRUD для корзины ==========
def get_cart_items(db: Session, user_id: int):
    # .all() вернет список объектов Cart, у которых должно быть свойство .game
    return db.query(models.Cart).filter(models.Cart.user_id == user_id).all()

def add_to_cart(db: Session, item: schemas.CartCreate):
    db_item = models.Cart(
        user_id=item.user_id,
        game_id=item.game_id,
        quantity=item.quantity  # Проверь, как написано в models: quanity или quantity
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
    
    if cart_item:
        cart_item.quantity += quantity
    else:
        cart_item = models.Cart(
            user_id=user_id,
            game_id=game_id,
            quantity=quantity
        )
        db.add(cart_item)
    
    db.commit()
    db.refresh(cart_item)
    return cart_item

def update_cart_item(db: Session, cart_id: int, quantity: int):
    """Обновить количество товара в корзине"""
    cart_item = db.query(models.Cart).filter(models.Cart.id == cart_id).first()
    if cart_item:
        cart_item.quantity = quantity
        db.commit()
        db.refresh(cart_item)
    return cart_item

def remove_from_cart(db: Session, cart_id: int):
    """Удалить товар из корзины"""
    cart_item = db.query(models.Cart).filter(models.Cart.id == cart_id).first()
    if cart_item:
        db.delete(cart_item)
        db.commit()
        return True
    return False

def checkout(db: Session, user_id: int):
    """Оформить заказ"""
    cart_items = get_cart_items(db, user_id, status="cart")
    
    if not cart_items:
        return {"success": False, "message": "Корзина пуста"}
    
    # Считаем общую сумму
    total = 0
    for item in cart_items:
        if item.game:
            total += item.game.price * item.quantity
    
    user = get_user_by_id(db, user_id)
    
    if user.balance < total:
        return {"success": False, "message": f"Недостаточно средств. Нужно {total} ₽, у вас {user.balance} ₽"}
    
    # Списываем деньги
    user.balance -= total
    
    # Меняем статус товаров в корзине
    for item in cart_items:
        item.status = "ordered"
    
    db.commit()
    
    return {
        "success": True, 
        "message": "Заказ оформлен!", 
        "total": total,
        "new_balance": user.balance
    }