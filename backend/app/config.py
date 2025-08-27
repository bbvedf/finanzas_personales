from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongo_user: str
    mongo_password: str
    mongo_host: str
    mongo_port: int
    db_name: str
    mongo_uri: str = None

    class Config:
        env_file = "../.env"

settings = Settings()

# Generar URI si no está en el .env
if not settings.mongo_uri:
    settings.mongo_uri = f"mongodb://{settings.mongo_user}:{settings.mongo_password}@{settings.mongo_host}:{settings.mongo_port}"
