
# RecallForge Backend

FastAPI backend for RecallForge - AI-powered spaced repetition learning system.

## Features

- PDF upload and processing with AI chunking
- Automatic question generation using Gemini AI
- FSRS algorithm for spaced repetition scheduling
- Question coverage detection and auto-generation
- Study session management
- Performance tracking

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. Set up database:
```bash
# Install PostgreSQL and create database
createdb recallforge
```

4. Run the application:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Key Components

### AI Services (`app/services/ai_service.py`)
- PDF text extraction
- Learning objectives parsing
- Content chunking
- Question generation
- Coverage detection

### FSRS Service (`app/services/fsrs_service.py`)
- Spaced repetition algorithm
- Card scheduling
- Difficulty adjustment
- Review interval calculation

### API Routes
- `/api/pdf/` - PDF upload and processing
- `/api/questions/` - Question management and generation
- `/api/study/` - Study sessions and progress
- `/api/auth/` - Authentication (placeholder for Supabase)

## Development

The backend is designed to work with the React frontend and can be easily integrated with Supabase for production deployment.

Key features implemented:
- ✅ PDF processing and AI chunking
- ✅ Automatic question generation
- ✅ FSRS spaced repetition algorithm
- ✅ Question coverage detection
- ✅ Background task processing
- ✅ Study session management

Next steps for production:
- Integrate with Supabase Auth
- Add proper error handling and logging
- Implement Celery for background tasks
- Add API rate limiting
- Add comprehensive testing
