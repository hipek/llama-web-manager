.PHONY: test build run stop

test:
	uv run pytest tests/

build:
	docker build --build-arg VITE_API_URL=$(VITE_API_URL) \
	  -t llama-web-manager-frontend:latest frontend/

run:
	docker run -d --name llama-web-manager-frontend \
	  -p 8000:8000 \
	  llama-web-manager-frontend:latest

stop:
	docker stop llama-web-manager-frontend && docker rm llama-web-manager-frontend
