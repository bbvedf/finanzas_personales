from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongo_user: str
    mongo_password: str
    mongo_host: str
    mongo_port: int
    db_name: str
    mongo_uri: str = None
    
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DATABASE: str  # ← Note: DATABASE not DB
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str

    class Config:
        env_file = "../.env"

    @property
    def POSTGRES_URI(self):
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DATABASE}"

settings = Settings()

# Generar URI si no está en el .env
if not settings.mongo_uri:
    settings.mongo_uri = f"mongodb://{settings.mongo_user}:{settings.mongo_password}@{settings.mongo_host}:{settings.mongo_port}"

