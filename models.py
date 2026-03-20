from sqlalchemy import create_engine, Column, String, Integer, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

# Создаем движок
engine = create_engine("sqlite:///./store.db", connect_args={"check_same_thread": False})
Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(20), unique=True)
    password = Column(String)
    balance = Column(Integer, default=5000)
    
    # Имя класса здесь должно быть 'Cart', а back_populates ссылаться на поле в классе Cart
    cart_items = relationship("Cart", back_populates="user")

class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(50))
    price = Column(Integer)
    genre = Column(String(20))
    author = Column(String(20))
    description = Column(String(255))
    image_url = Column(String(255))
    
    cart_items = relationship("Cart", back_populates="game")

class Cart(Base):
    __tablename__ = "carts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    game_id = Column(Integer, ForeignKey("games.id"))
    quantity = Column(Integer, default=1)
    status = Column(String, default="cart")
    
    # ВНИМАНИЕ: Проверь, что здесь написано "User" (имя класса выше)
    user = relationship("User", back_populates="cart_items")
    game = relationship("Game", back_populates="cart_items")