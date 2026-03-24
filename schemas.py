from pydantic import BaseModel
from typing import Optional, List

# === Схемы для игр ===
class GameBase(BaseModel):
    title: str
    genre: Optional[str] = None
    author: Optional[str] = None
    price: int
    description: Optional[str] = None
    image_url: Optional[str] = None

class GameCreate(GameBase):
    pass

class GameUpdate(BaseModel):
    title: Optional[str] = None
    genre: Optional[str] = None
    author: Optional[str] = None
    price: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class Game(GameBase):
    id: int
    
    class Config:
        from_attributes = True


# === Схемы для пользователей ===
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: bool

class User(UserBase):
    id: int
    balance: int
    
    class Config:
        from_attributes = True


# === Схемы для корзины ===
class CartBase(BaseModel):
    user_id: int
    game_id: int
    quantity: int = 1

class CartCreate(CartBase):
    pass

class CartItem(BaseModel):
    id: int
    user_id: int
    game_id: int
    quantity: int
    game: Game

    class Config:
        from_attributes = True

class CartUpdate(BaseModel):
    quantity: Optional[int] = None

class CheckoutResponse(BaseModel):
    success: bool
    message: str
    total: int = 0
    new_balance: int = 0