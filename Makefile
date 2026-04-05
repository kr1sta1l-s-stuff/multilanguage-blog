make start:
	docker-compose -f docker-compose-local.yaml up -d

make stop:
	docker-compose -f docker-compose-local.yaml down

make build:
	docker-compose -f docker-compose-local.yaml build

make start-sync:
	docker-compose -f docker-compose-local.yaml up
