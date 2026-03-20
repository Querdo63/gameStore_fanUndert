from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

# Импортируем файлы
import models, schemas, crud

# Создаем таблицы в базе данных (если их еще нет)
models.Base.metadata.create_all(bind=models.engine)

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

@app.get("/cart/{user_id}")
def get_user_cart(user_id: int, db: Session = Depends(get_db)):
    return crud.get_cart_items(db, user_id)

@app.post("/cart/checkout/{user_id}")
def checkout(user_id: int, db: Session = Depends(get_db)):
    result = crud.checkout(db, user_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result