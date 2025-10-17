# WebinarWins MVP - Quick Start Guide

Get up and running in 10 minutes! 🚀

## Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+
- PostgreSQL 14+
- OpenAI API key

## Quick Setup

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd webinarwins-mvp

# Run setup script (macOS/Linux)
./scripts/setup-dev.sh

# OR setup manually:
```

### 2. Backend Setup (Manual)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp ../ENV_TEMPLATE.txt .env
# Edit .env with your values

# Setup database
createdb webinarwins_dev  # Create PostgreSQL database
alembic upgrade head      # Run migrations

# Start server
uvicorn app.main:app --reload --port 8000
```

Backend should now be running at `http://localhost:8000`

### 3. Frontend Setup (Manual)

```bash
cd frontend

# Install dependencies
pnpm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000/api" > .env
echo "VITE_ENV=development" >> .env

# Start development server
pnpm dev
```

Frontend should now be running at `http://localhost:5173`

## Verify Installation

1. **Backend**: Visit http://localhost:8000/docs
   - Should see API documentation

2. **Frontend**: Visit http://localhost:5173
   - Should see WebinarWins homepage

3. **Health Check**: 
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"healthy"}
   ```

## Next Steps

1. Read the [README.md](README.md) for full documentation
2. Check [docs/api.md](docs/api.md) for API details
3. Review [WebinarWins_MVP_PRD.md](WebinarWins_MVP_PRD.md) for product requirements

## Common Issues

**Port already in use:**
```bash
# Backend (change port)
uvicorn app.main:app --reload --port 8001

# Frontend (edit vite.config.js or kill the process)
lsof -ti:5173 | xargs kill
```

**Database connection error:**
```bash
# Make sure PostgreSQL is running
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Create database if needed
createdb webinarwins_dev
```

**Python version issues:**
```bash
# Use specific Python version
python3.11 -m venv venv
```

## Development Workflow

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
pnpm dev

# Terminal 3: Watch logs, run tests, etc.
```

## Need Help?

- Check [README.md](README.md) for detailed setup
- Review internal documentation in `docs/`
- Contact the development team via Slack or email
- Open an issue in the private GitHub repository

Happy coding! 🎉

