#!/bin/sh

poetry run alembic upgrade head
poetry run uvicorn main:app --host $APP_HOST --port $APP_PORT --reload
