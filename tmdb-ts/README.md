# TMDB MCP 서버

영화, TV 프로그램, 배우 등의 정보를 검색하고 조회할 수 있는 TMDB(The Movie Database) API를 위한 MCP 서버로, Claude가 영화 데이터베이스에 접근할 수 있게 해주는 TypeScript 기반 프로젝트입니다.

## 도구 목록

1. `search_movies`

   - 영화를 검색합니다
   - 필수 입력값:
     - `query` (문자열): 검색할 영화 제목
   - 선택적 입력값:
     - `page` (문자열, 기본값: '1'): 페이지 번호
   - 반환값: 영화 검색 결과 목록 (제목, ID, 개봉일, 평점, 줄거리 등)

2. `get_popular_movies`

   - 현재 인기 있는 영화 목록을 가져옵니다
   - 선택적 입력값:
     - `page` (문자열, 기본값: '1'): 페이지 번호
   - 반환값: 인기 영화 목록 (제목, ID, 개봉일, 평점, 줄거리 등)

3. `get_movie_details`

   - 영화의 상세 정보를 가져옵니다
   - 필수 입력값:
     - `movie_id` (문자열): 영화 ID
   - 반환값: 영화 상세 정보 (제목, 원제, 태그라인, 개봉일, 러닝타임, 장르, 감독, 출연진, 제작사, 예산, 수익, 줄거리 등)

4. `search_people`

   - 배우 및 영화 관계자를 검색합니다
   - 필수 입력값:
     - `query` (문자열): 검색할 배우/관계자 이름
   - 선택적 입력값:
     - `page` (문자열, 기본값: '1'): 페이지 번호
   - 반환값: 인물 검색 결과 목록 (이름, ID, 유명 작품, 직업, 인기도 등)

5. `get_person_details`

   - 배우 또는 영화 관계자의 상세 정보를 가져옵니다
   - 필수 입력값:
     - `person_id` (문자열): 인물 ID
   - 반환값: 인물 상세 정보 (이름, 생년월일, 출생지, 직업, 주요 출연작, 약력 등)

6. `search_tv_shows`

   - TV 프로그램을 검색합니다
   - 필수 입력값:
     - `query` (문자열): 검색할 TV 프로그램 제목
   - 선택적 입력값:
     - `page` (문자열, 기본값: '1'): 페이지 번호
   - 반환값: TV 프로그램 검색 결과 목록 (제목, ID, 첫 방영일, 평점, 줄거리 등)

7. `get_popular_tv_shows`

   - 현재 인기 있는 TV 프로그램 목록을 가져옵니다
   - 선택적 입력값:
     - `page` (문자열, 기본값: '1'): 페이지 번호
   - 반환값: 인기 TV 프로그램 목록 (제목, ID, 첫 방영일, 평점, 줄거리 등)

8. `get_tv_show_details`

   - TV 프로그램의 상세 정보를 가져옵니다
   - 필수 입력값:
     - `tv_id` (문자열): TV 프로그램 ID
   - 반환값: TV 프로그램 상세 정보 (제목, 원제, 첫/최종 방영일, 상태, 시즌 수, 에피소드 수, 장르, 제작사, 줄거리 등)

## 등록 방법

### 사전 준비 사항

1. TMDB API Read Access Token 발급

   - [TMDB 공식 사이트](https://www.themoviedb.org/)에 가입합니다.
   - 계정 설정에서 API 항목으로 이동하여 API Read Access Token 을 발급받습니다.
   - 발급받은 API Read Access Token 는 환경 변수 설정에 사용됩니다.

2. Docker 이미지 빌드

```bash
docker build -t mcp/tmdb-ts -f Dockerfile .
```

### Claude Desktop에서 사용 방법

`claude_desktop_config.json` 파일에 다음 내용을 추가하세요:

```json
{
  "mcpServers": {
    "tmdb": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "TMDB_API_TOKEN", "mcp/tmdb-ts"],
      "env": {
        "TMDB_API_TOKEN": "발급받은 TMDB API Read Access Token"
      }
    }
  }
}
```

### 문제 해결

TMDB MCP 서버 호출 중 오류가 발생할 경우 다음을 확인하세요:

1. API 키가 올바르게 설정되었는지 확인하세요. `.env` 파일 또는 Docker 실행 시 환경변수로 전달되어야 합니다.
2. 네트워크 연결 상태를 확인하세요. TMDB API에 접근하려면 인터넷 연결이 필요합니다.
3. TMDB API 서비스 상태를 확인하세요. 간혹 TMDB 서비스에 문제가 있을 수 있습니다.
4. 요청 제한(Rate Limit)에 도달했는지 확인하세요. TMDB API는 일정 시간 내 요청 횟수에 제한이 있습니다.

## 라이선스

이 MCP 서버는 MIT 라이선스로 제공됩니다. 이는 MIT 라이선스의 조건에 따라 소프트웨어를 자유롭게 사용, 수정 및 배포할 수 있음을 의미합니다. 자세한 내용은 프로젝트 저장소의 LICENSE 파일을 참조하세요.
