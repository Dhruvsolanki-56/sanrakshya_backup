from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sanrakshya API"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    DATABASE_URL: str
    GROQ_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    MODELS_DIR: str = "app/ai_models"
    REPORTS_BASE_DIR: str = "sanrakshya-reports/reports"
    REPORTS_MASTER_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
