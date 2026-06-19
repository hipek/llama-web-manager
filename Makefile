.PHONY: test build run stop check-types ci

test:
	uv run pytest backend/tests/

check-types:
	cd frontend && pnpm tsc --noEmit

ci: check-types test

build:
	docker build --build-arg NEXT_PUBLIC_API_URL=$(NEXT_PUBLIC_API_URL) \
	  -t llama-web-manager-frontend:latest frontend/

run:
	docker run -d --name llama-web-manager-frontend \
	  -p 8000:8000 \
	  llama-web-manager-frontend:latest

stop:
	docker stop llama-web-manager-frontend && docker rm llama-web-manager-frontend
