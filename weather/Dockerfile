# 먼저 uv가 사전 설치된 이미지 사용
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS uv

# 작업 디렉토리 설정
WORKDIR /app

# bytecode 컴파일 활성화
ENV UV_COMPILE_BYTECODE=1

# 캐시에서 복사 (링크 대신)
ENV UV_LINK_MODE=copy

# 필요한 패키지 설치
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --no-deps requests python-dotenv

# 최종 이미지 생성
FROM python:3.11-slim-bookworm

WORKDIR /app

# uv에서 설치한 패키지 복사
COPY --from=uv /root/.local /root/.local

# MCP 패키지 복사
COPY mcp/ /app/mcp/

# 환경 변수 설정 (기본값은 비어있고, 컨테이너 실행 시 주입)
ENV WEATHER_API_KEY=""
ENV PATH="/root/.local/bin:$PATH"

# 실행 명령
CMD ["python", "-m", "mcp.weather.weather_api"]
