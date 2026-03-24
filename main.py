from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

# Импортируем файлы
import models, schemas, crud

# Создаем таблицы в базе данных (если их еще нет)
models.Base.metadata.create_all(bind=models.engine)

def seed_initial_data():
    # Открываем временную сессию для проверки базы
    db = models.SessionLocal()
    try:
        # Если в таблице Game нет ни одной записи (база только что создана)
        if db.query(models.Game).count() == 0:
            undertale = models.Game(
                title="UNDERTALE",
                price=899,
                genre="RPG",
                author="Toby Fox",
                description="The RPG game where you don't have to destroy anyone.",
                image_url="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRej2CONlSJVMDYk0QKtPS9m-zIpBWU4wB_HQ&s"
            )
            db.add(undertale)
            db.commit()
            print("✅ Стартовая игра UNDERTALE успешно добавлена в новую базу!")
    finally:
        db.close() # Обязательно закрываем сессию

# Запускаем нашу функцию при старте файла
seed_initial_data()
app = FastAPI(title="UnderStore API")

# Разрешаем фронтенду (JS) делать запросы к бэкенду.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # В продакшене тут стоит указать адрес OpenServer
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Функция для получения сессии базы данных
def get_db():
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === Эндпоинты для Игр ===

@app.get("/games", response_model=List[schemas.Game])
def read_games(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_games(db, skip=skip, limit=limit)

@app.post("/games", response_model=schemas.Game)
def create_game(game: schemas.GameCreate, db: Session = Depends(get_db)):
    return crud.create_game(db, game)

# === Эндпоинты для Пользователей ===

@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь уже существует")
    return crud.create_user(db, user)

@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.authenticate_user(db, user.username, user.password)
    if not db_user:
        raise HTTPException(status_code=400, detail="Неверный логин или пароль")
    return db_user

# === Эндпоинты для Корзины ===

@app.post("/cart/add")
def add_to_cart(item: schemas.CartCreate, db: Session = Depends(get_db)):
    return crud.add_to_cart(db, item) # Передаем db и объект целиком

@app.get("/cart/{user_id}", response_model=List[schemas.CartItem])
def get_user_cart(user_id: int, db: Session = Depends(get_db)):
    return crud.get_cart_items(db, user_id)

@app.post("/cart/checkout/{user_id}")
def checkout(user_id: int, db: Session = Depends(get_db)):
    result = crud.checkout(db, user_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/users/{user_id}/topup")
def topup_balance(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.balance += 1000
        db.commit()
        db.refresh(user)
    return user

@app.get("/library/{user_id}", response_model=List[schemas.CartItem])
def get_library(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user_library(db, user_id)

@app.delete("/cart/clear/{user_id}")
def clear_user_cart(user_id: int, db: Session = Depends(get_db)):
    # Удаляем все записи из таблицы Cart для этого пользователя, где статус "cart"
    db.query(models.Cart).filter(
        models.Cart.user_id == user_id, 
        models.Cart.status == "cart"
    ).delete()
    db.commit()
    return {"success": True}