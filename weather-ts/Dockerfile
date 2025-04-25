# 빌드 단계를 위한 베이스 이미지
FROM node:22-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json 및 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 파일 복사
COPY tsconfig.json ./
COPY src/ ./src/

# TypeScript 컴파일
RUN npm run build

# 실행 단계를 위한 베이스 이미지
FROM node:22-alpine AS release

# 작업 디렉토리 설정
WORKDIR /app

# 빌드 단계에서 컴파일된 코드 복사
COPY --from=builder /app/build/ ./build/


# 애플리케이션 실행
CMD ["node", "build/index.js"]