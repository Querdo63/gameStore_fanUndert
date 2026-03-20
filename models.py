from sqlalchemy import create_engine, Column, String, Integer, ForeignKey, r
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

engine = create_engine("sqlite:///store.db", echo=True)

Base = declarative_base()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Users (Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(20))
    password = Column(Integer)
    balance = Column(Integer, default=5000)

    cart_items = relationship("Cart", back_populates="user")

class Game (Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True)
    name = Column(String(20))
    price = Column(Integer)
    type = Column(String(20))
    author = Column(String(20))
    description = Column(String(20))
    image_url = Column(String(100))

    cart_items = relationship("Cart", back_populates="game")


class Cart (Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, )
    game_id = Column(Integer, nullable=False)
    quanity = Column(Integer)

    user = relationship("User", back_populates="cart_items")
    game = relationship("Game", back_populates="cart_items")
