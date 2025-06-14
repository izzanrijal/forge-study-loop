
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum

Base = declarative_base()

class Priority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    pdfs = relationship("PDF", back_populates="user")
    study_sessions = relationship("StudySession", back_populates="user")

class PDF(Base):
    __tablename__ = "pdfs"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    filename = Column(String)
    file_path = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="pdfs")
    learning_objectives = relationship("LearningObjective", back_populates="pdf")

class LearningObjective(Base):
    __tablename__ = "learning_objectives"
    
    id = Column(String, primary_key=True)
    pdf_id = Column(String, ForeignKey("pdfs.id"))
    title = Column(String)
    priority = Column(String)  # High, Medium, Low
    page_range = Column(String)
    tags = Column(JSON)
    content_chunk = Column(Text)
    mastery_percent = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    pdf = relationship("PDF", back_populates="learning_objectives")
    questions = relationship("Question", back_populates="learning_objective")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(String, primary_key=True)
    learning_objective_id = Column(String, ForeignKey("learning_objectives.id"))
    question_text = Column(Text)
    options = Column(JSON)  # List of options for MCQ
    correct_answer = Column(String)
    explanation = Column(Text)
    difficulty = Column(String, default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # FSRS Algorithm fields
    stability = Column(Float, default=1.0)
    difficulty_rating = Column(Float, default=5.0)
    last_reviewed = Column(DateTime)
    next_review = Column(DateTime)
    review_count = Column(Integer, default=0)
    
    # Relationships
    learning_objective = relationship("LearningObjective", back_populates="questions")
    attempts = relationship("QuestionAttempt", back_populates="question")

class StudySession(Base):
    __tablename__ = "study_sessions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    session_type = Column(String)  # "study" or "test"
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    total_questions = Column(Integer)
    correct_answers = Column(Integer)
    accuracy = Column(Float)
    
    # Relationships
    user = relationship("User", back_populates="study_sessions")
    attempts = relationship("QuestionAttempt", back_populates="session")

class QuestionAttempt(Base):
    __tablename__ = "question_attempts"
    
    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("study_sessions.id"))
    question_id = Column(String, ForeignKey("questions.id"))
    user_answer = Column(String)
    is_correct = Column(Boolean)
    response_time = Column(Float)  # in seconds
    difficulty_rating = Column(String)  # easy, medium, hard (user feedback)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("StudySession", back_populates="attempts")
    question = relationship("Question", back_populates="attempts")
