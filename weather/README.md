# 기상청 단기예보 API 활용 프로그램

## 프로그램 소개

이 프로그램은 기상청에서 제공하는 단기예보 오픈 API를 활용하여 날씨 정보를 가져오는 파이썬 프로그램입니다.

## 필요한 라이브러리 설치

프로그램을 실행하기 전에 필요한 라이브러리를 설치해주세요:

```bash
pip install requests python-dotenv
```

## 사용 방법

### 1. API 키 발급받기

- [공공데이터포털](https://www.data.go.kr/)에 접속하여 회원가입 및 로그인
- '기상청*단기예보 ((구)*동네예보) 조회서비스' API 활용 신청
- 승인 후 발급된 일반 인증키(Decoding) 복사

### 2. 환경 변수 설정

1. `.env.example` 파일을 `.env`로 복사
2. `.env` 파일 내의 'WEATHER_API_KEY' 값을 발급받은 API 키로 변경

```
WEATHER_API_KEY=여기에_발급받은_DECODING_API키_입력
```

### 3. Claude MCP 설정

- uv 전체 경로는 `which uv` 로 확인

```json
{
  "mcpServers": {
    "weather": {
      "command": "uv 전체 경로",
      "args": ["--directory", "server.py 폴더 절대 경로", "run", "server.py"]
    }
  }
}
```
