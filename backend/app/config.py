import os


class Settings:
    app_name: str = os.getenv("APP_NAME", "Distance Tracker ChatBot API")
    app_env: str = os.getenv("APP_ENV", "development")
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")


settings = Settings()
