# blog-backend

## Процесс локального запуска

1. Создать docker network:
```bash
docker network create blog-network
```

2. Копировать файл .env.example в .env:
```bash
cp .env.example .env
```

3. Запустить docker compose:
```bash
make start
```

4. Создать миграции (в уже запущенном контейнере):
```bash
poetry run alembic revision --autogenerate -m "описание миграции"
```
