.PHONY: up
up:
	docker-compose up

.PHONY: build
build:
	docker-compose rm && docker-compose build

.PHONY: test
test:
	docker-compose -f docker-compose.yml -f docker-compose.test.yml up --exit-code-from api

.PHONY: build-test
build-test:
	docker-compose rm && docker-compose -f docker-compose.yml -f docker-compose.test.yml build

.PHONY: prod
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up

.PHONY: build-prod
build-prod:
	docker-compose rm && docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
