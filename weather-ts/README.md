# Weather-TS MCP 서버

날씨 API를 위한 MCP 서버로, Claude가 날씨 정보에 접근할 수 있게 해주는 TypeScript 기반 프로젝트입니다.

## 도구 목록

1. `get-current-date-time`

   - 현재 날짜와 시간을 조회합니다
   - 선택적 입력값:
     - `format` (문자열, 기본값: "YYYY-MM-DD"): 날짜 형식 지정
   - 반환값: 지정된 형식의 현재 날짜와 시간

2. `get-short-term-forecast`

   - 특정 지역의 단기예보(오늘/내일)를 조회합니다
   - 필수 입력값:
     - `location` (문자열): 조회할 지역명 (예: 서울, 부산, 대구 등)
   - 선택적 입력값:
     - `numOfRows` (숫자, 기본값: 100): 반환할 행 개수
   - 반환값: 해당 지역의 단기 날씨 예보 정보

3. `get-ultra-short-term-forecast`

   - 특정 지역의 초단기예보(6시간 이내)를 조회합니다
   - 필수 입력값:
     - `location` (문자열): 조회할 지역명 (예: 서울, 부산, 대구 등)
   - 선택적 입력값:
     - `numOfRows` (숫자, 기본값: 60): 반환할 행 개수
   - 반환값: 해당 지역의 초단기 날씨 예보 정보

4. `list-locations`

   - 지원하는 지역 목록을 조회합니다
   - 입력값: 없음
   - 반환값: 서비스에서 지원하는 지역 목록

5. `get-current-weather`
   - 특정 지역의 현재 날씨 정보를 조회합니다
   - 필수 입력값:
     - `location` (문자열): 조회할 지역명 (예: 서울, 부산, 대구 등)
   - 반환값: 해당 지역의 현재 날씨 상태, 기온, 습도 등의 정보

## 등록 방법

### 사전 준비 사항

1. 날씨 API 키 발급

   - [기상청 날씨 오픈 API](https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15084084) 페이지를 방문합니다.
   - 회원가입 후 API 키를 신청합니다.
   - 발급받은 서비스 키를 안전하게 보관합니다.

2. Docker 이미지 빌드

```bash
docker build -t mcp/weather-ts -f Dockerfile .
```

### Claude Desktop에서 사용 방법

`claude_desktop_config.json` 파일에 다음 내용을 추가하세요:

```json
{
  "mcpServers": {
    "weather": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "WEATHER_API_KEY",
        "-e",
        "mcp/weather-ts"
      ],
      "env": {
        "WEATHER_API_KEY": "발급받은_DECODING_API_키"
      }
    }
  }
}
```

### 문제 해결

API 호출 중 오류가 발생할 경우 다음을 확인하세요:

1. API 키가 올바르게 설정되었는지 확인
2. 네트워크 연결 상태 확인
3. 일일 API 호출 한도 초과 여부 확인
4. 지원되는 지역 이름인지 확인 (`list-locations` 도구 사용)

## 라이선스

이 MCP 서버는 MIT 라이선스로 제공됩니다. 이는 MIT 라이선스의 조건에 따라 소프트웨어를 자유롭게 사용, 수정 및 배포할 수 있음을 의미합니다. 자세한 내용은 프로젝트 저장소의 LICENSE 파일을 참조하세요.
