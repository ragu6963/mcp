# GitHub MCP 서버

GitHub MCP 서버는 [모델 컨텍스트 프로토콜 (MCP)](https://modelcontextprotocol.io/introduction)
서버로, GitHub API와의 원활한 통합을 제공하여 개발자와 도구를 위한 고급 자동화 및 상호작용 기능을 활성화합니다.

[![VS Code에서 Docker로 설치](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=github&inputs=%5B%7B%22id%22%3A%22github_token%22%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22GitHub%20Personal%20Access%20Token%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22-i%22%2C%22--rm%22%2C%22-e%22%2C%22GITHUB_PERSONAL_ACCESS_TOKEN%22%2C%22ghcr.io%2Fgithub%2Fgithub-mcp-server%22%5D%2C%22env%22%3A%7B%22GITHUB_PERSONAL_ACCESS_TOKEN%22%3A%22%24%7Binput%3Agithub_token%7D%22%7D%7D) [![VS Code Insiders에서 Docker로 설치](https://img.shields.io/badge/VS_Code_Insiders-Install_Server-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=github&inputs=%5B%7B%22id%22%3A%22github_token%22%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22GitHub%20Personal%20Access%20Token%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22-i%22%2C%22--rm%22%2C%22-e%22%2C%22GITHUB_PERSONAL_ACCESS_TOKEN%22%2C%22ghcr.io%2Fgithub%2Fgithub-mcp-server%22%5D%2C%22env%22%3A%7B%22GITHUB_PERSONAL_ACCESS_TOKEN%22%3A%22%24%7Binput%3Agithub_token%7D%22%7D%7D&quality=insiders)

## 사용 사례

- GitHub 워크플로우 및 프로세스 자동화
- GitHub 저장소에서 데이터 추출 및 분석
- GitHub 생태계와 상호작용하는 AI 기반 도구 및 애플리케이션 구축

## 전제 조건

1. 컨테이너에서 서버를 실행하려면 [Docker](https://www.docker.com/)가 설치되어 있어야 합니다.
2. Docker를 설치한 후, Docker가 실행 중인지 확인해야 합니다. 이미지는 공개되어 있습니다. Pull 시 오류가 발생하면 토큰이 만료되었을 수 있으므로 `docker logout ghcr.io`를 실행하세요.
3. 마지막으로 [GitHub 개인 액세스 토큰을 생성](https://github.com/settings/personal-access-tokens/new)해야 합니다.
   MCP 서버는 많은 GitHub API를 사용할 수 있으므로 AI 도구에 부여하고 싶은 권한을 활성화하세요 (액세스 토큰에 대해 자세히 알아보려면 [문서](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)를 확인하세요).

## 설치

### VS Code와 함께 사용

빠른 설치를 위해 README 상단의 원클릭 설치 버튼 중 하나를 사용하세요. 해당 흐름을 완료하면 에이전트 모드(Copilot Chat 텍스트 입력 옆)를 토글하면 서버가 시작됩니다.

수동 설치의 경우, VS Code의 사용자 설정(JSON) 파일에 다음 JSON 블록을 추가하세요. `Ctrl + Shift + P`를 누르고 `기본 설정: 사용자 설정 열기(JSON)`를 입력하여 수행할 수 있습니다.

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "github_token",
        "description": "GitHub 개인 액세스 토큰",
        "password": true
      }
    ],
    "servers": {
      "github": {
        "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "-e",
          "GITHUB_PERSONAL_ACCESS_TOKEN",
          "ghcr.io/github/github-mcp-server"
        ],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
        }
      }
    }
  }
}
```

선택적으로, 작업 공간의 `.vscode/mcp.json` 파일에 유사한 예시(mcp 키 없이)를 추가할 수 있습니다. 이를 통해 구성을 다른 사람과 공유할 수 있습니다.

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "github_token",
      "description": "GitHub 개인 액세스 토큰",
      "password": true
    }
  ],
  "servers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
      }
    }
  }
}
```

VS Code의 [에이전트 모드 문서](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)에서 MCP 서버 도구 사용에 대해 자세히 알아볼 수 있습니다.

### Claude Desktop과 함께 사용

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

### 소스에서 빌드

Docker가 없는 경우, `cmd/github-mcp-server` 디렉터리에서 `go build`를 사용하여 바이너리를 빌드하고 `GITHUB_PERSONAL_ACCESS_TOKEN` 환경 변수를 토큰으로 설정한 `github-mcp-server stdio` 명령을 사용할 수 있습니다. 빌드 출력 위치를 지정하려면 `-o` 플래그를 사용하세요. 서버를 구성하여 빌드된 실행 파일을 `command`로 사용해야 합니다. 예를 들어:

```JSON
{
  "mcp": {
    "servers": {
      "github": {
        "command": "/path/to/github-mcp-server",
        "args": ["stdio"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>"
        }
      }
    }
  }
}
```

## 도구 구성

GitHub MCP 서버는 `--toolsets` 플래그를 통해 특정 기능 그룹을 활성화하거나 비활성화할 수 있습니다. 이를 통해 AI 도구에서 사용할 수 있는 GitHub API 기능을 제어할 수 있습니다. 필요한 도구 세트만 활성화하면 LLM의 도구 선택에 도움이 되고 컨텍스트 크기를 줄일 수 있습니다.

### 사용 가능한 도구 세트

다음 도구 세트를 사용할 수 있습니다 (기본적으로 모두 활성화됨):

| 도구 세트       | 설명                                        |
| --------------- | ------------------------------------------- |
| `repos`         | 저장소 관련 도구 (파일 작업, 브랜치, 커밋)  |
| `issues`        | 이슈 관련 도구 (생성, 읽기, 업데이트, 댓글) |
| `users`         | GitHub 사용자와 관련된 모든 것              |
| `pull_requests` | 풀 리퀘스트 작업 (생성, 병합, 리뷰)         |
| `code_security` | 코드 스캐닝 알림 및 보안 기능               |
| `experiments`   | 실험적 기능 (안정적이지 않음)               |

#### 도구 세트 지정

LLM에 사용 가능한 도구 세트를 지정하려면 허용 목록을 두 가지 방법으로 전달할 수 있습니다:

1. **명령줄 인수 사용**:

   ```bash
   github-mcp-server --toolsets repos,issues,pull_requests,code_security
   ```

2. **환경 변수 사용**:
   ```bash
   GITHUB_TOOLSETS="repos,issues,pull_requests,code_security" ./github-mcp-server
   ```

환경 변수 `GITHUB_TOOLSETS`는 둘 다 제공된 경우 명령줄 인수보다 우선합니다.

### Docker와 함께 도구 세트 사용

Docker를 사용할 때는 도구 세트를 환경 변수로 전달할 수 있습니다:

```bash
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<your-token> \
  -e GITHUB_TOOLSETS="repos,issues,pull_requests,code_security,experiments" \
  ghcr.io/github/github-mcp-server
```

### "all" 도구 세트

특수 도구 세트 `all`은 다른 모든 구성에 관계없이 모든 사용 가능한 도구 세트를 활성화하는 데 사용할 수 있습니다:

```bash
./github-mcp-server --toolsets all
```

또는 환경 변수를 사용하여:

```bash
GITHUB_TOOLSETS="all" ./github-mcp-server
```

## 동적 도구 검색

**참고**: 이 기능은 현재 베타 상태이며 모든 환경에서 사용할 수 없을 수 있습니다. 테스트해 보시고 문제가 있으면 알려주세요.

모든 도구를 처음부터 활성화하는 대신 동적 도구 세트 검색을 켤 수 있습니다. 동적 도구 세트를 사용하면 MCP 호스트가 사용자 프롬프트에 응답하여 도구 세트를 나열하고 활성화할 수 있습니다. 이는 모델이 너무 많은 도구로 혼란스러워하는 상황을 피하는 데 도움이 됩니다.

### 동적 도구 검색 사용

바이너리를 사용할 때 `--dynamic-toolsets` 플래그를 전달할 수 있습니다.

```bash
./github-mcp-server --dynamic-toolsets
```

Docker를 사용할 때는 도구 세트를 환경 변수로 전달할 수 있습니다:

```bash
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<your-token> \
  -e GITHUB_DYNAMIC_TOOLSETS=1 \
  ghcr.io/github/github-mcp-server
```

## GitHub Enterprise 서버

`--gh-host` 플래그와 환경 변수 `GITHUB_HOST`를 사용하여 GitHub Enterprise 서버 호스트 이름을 설정할 수 있습니다.
GitHub Enterprise 서버에서 지원하지 않는 `http://`가 기본값이므로 호스트 이름에 `https://` URI 체계를 접두사로 붙이세요.

```json
"github": {
    "command": "docker",
    "args": [
    "run",
    "-i",
    "--rm",
    "-e",
    "GITHUB_PERSONAL_ACCESS_TOKEN",
    "-e",
    "GITHUB_HOST",
    "ghcr.io/github/github-mcp-server"
    ],
    "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}",
        "GITHUB_HOST": "https://<your GHES domain name>"
    }
}
```

## i18n / 설명 재정의

도구의 설명은 바이너리와 동일한 디렉터리에 `github-mcp-server-config.json` 파일을 생성하여 재정의할 수 있습니다.

파일에는 도구 이름을 키로, 새 설명을 값으로 하는 JSON 객체가 포함되어야 합니다. 예를 들어:

```json
{
  "TOOL_ADD_ISSUE_COMMENT_DESCRIPTION": "대체 설명",
  "TOOL_CREATE_BRANCH_DESCRIPTION": "GitHub 저장소에 새 브랜치 생성"
}
```

바이너리를 `--export-translations` 플래그와 함께 실행하여 현재 번역의 내보내기를 생성할 수 있습니다.

이 플래그는 이전에 수행한 모든 번역/재정의를 보존하면서 바이너리에 추가된 새 번역을 추가합니다.

```sh
./github-mcp-server --export-translations
cat github-mcp-server-config.json
```

ENV 변수를 사용하여 설명을 재정의할 수도 있습니다. 환경 변수 이름은 JSON 파일의 키와 동일하며, `GITHUB_MCP_` 접두사와 모두 대문자로 시작합니다.

예를 들어, `TOOL_ADD_ISSUE_COMMENT_DESCRIPTION` 도구를 재정의하려면 다음 환경 변수를 설정할 수 있습니다:

```sh
export GITHUB_MCP_TOOL_ADD_ISSUE_COMMENT_DESCRIPTION="대체 설명"
```

## 제공 기능

### 사용자 관련 기능

- **get_me** - 현재 로그인한 사용자의 정보 조회
  - 필요한 정보가 없음 (매개변수 없음)
  - 설명: 나의 GitHub 계정 정보를 확인할 수 있습니다.

### 이슈(Issue) 관리 기능

- **get_issue** - 특정 이슈의 내용 조회

  - `owner`: 저장소 소유자 이름 (예: "GitHub", 필수)
  - `repo`: 저장소 이름 (예: "docs", 필수)
  - `issue_number`: 이슈 번호 (예: 123, 필수)

- **get_issue_comments** - 이슈의 댓글들 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `issue_number`: 이슈 번호 (필수)

- **create_issue** - 새로운 이슈 생성

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `title`: 이슈 제목 (예: "버그 발견: 로그인 문제", 필수)
  - `body`: 이슈 내용 (선택사항)
  - `assignees`: 담당자 목록 (선택사항)
  - `labels`: 라벨 목록 (예: ["bug", "urgent"], 선택사항)

- **add_issue_comment** - 이슈에 댓글 추가

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `issue_number`: 이슈 번호 (필수)
  - `body`: 댓글 내용 (필수)

- **list_issues** - 이슈 목록 조회 및 필터링

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `state`: 상태별 필터 ('open', 'closed', 'all') (선택사항)
  - `labels`: 라벨로 필터링 (선택사항)
  - `sort`: 정렬 기준 ('created', 'updated', 'comments') (선택사항)
  - `direction`: 정렬 방향 ('asc', 'desc') (선택사항)
  - `since`: 날짜 이후 필터 (ISO 8601 형식) (선택사항)
  - `page`: 페이지 번호 (선택사항)
  - `perPage`: 페이지당 결과 수 (선택사항)

- **update_issue** - 기존 이슈 수정

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `issue_number`: 수정할 이슈 번호 (필수)
  - `title`: 새 제목 (선택사항)
  - `body`: 새 내용 (선택사항)
  - `state`: 새 상태 ('open' 또는 'closed') (선택사항)
  - `labels`: 새 라벨 (선택사항)
  - `assignees`: 새 담당자 (선택사항)
  - `milestone`: 새 마일스톤 번호 (선택사항)

- **search_issues** - 이슈 및 풀 리퀘스트 검색
  - `query`: 검색어 (필수)
  - `sort`: 정렬 필드 (선택사항)
  - `order`: 정렬 순서 (선택사항)
  - `page`: 페이지 번호 (선택사항)
  - `perPage`: 페이지당 결과 수 (선택사항)

### 풀 리퀘스트(Pull Request) 관리 기능

- **get_pull_request** - 특정 풀 리퀘스트 상세 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `pullNumber`: 풀 리퀘스트 번호 (필수)

- **list_pull_requests** - 풀 리퀘스트 목록 조회 및 필터링

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `state`: 상태 (선택사항)
  - `sort`: 정렬 필드 (선택사항)
  - `direction`: 정렬 방향 (선택사항)
  - `perPage`: 페이지당 결과 수 (선택사항)
  - `page`: 페이지 번호 (선택사항)

- **merge_pull_request** - 풀 리퀘스트 병합

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `pullNumber`: 풀 리퀘스트 번호 (필수)
  - `commit_title`: 병합 커밋 제목 (선택사항)
  - `commit_message`: 병합 커밋 메시지 (선택사항)
  - `merge_method`: 병합 방법 (선택사항)

- **get_pull_request_files** - 풀 리퀘스트에서 변경된 파일 목록 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `pullNumber`: 풀 리퀘스트 번호 (필수)

- **get_pull_request_status** - 풀 리퀘스트의 모든 상태 확인 결과 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `pullNumber`: 풀 리퀘스트 번호 (필수)

- **update_pull_request_branch** - 풀 리퀘스트 브랜치를 기본 브랜치의 최신 변경사항으로 업데이트

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `pullNumber`: 풀 리퀘스트 번호 (필수)
  - `expectedHeadSha`: 풀 리퀘스트 HEAD의 예상 SHA (선택사항)

- **get_pull_request_comments** - 풀 리퀘스트의 리뷰 댓글 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `pullNumber`: 풀 리퀘스트 번호 (필수)

- **get_pull_request_reviews** - 풀 리퀘스트의 리뷰 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `pullNumber`: 풀 리퀘스트 번호 (필수)

- **create_pull_request_review** - 풀 리퀘스트에 리뷰 생성

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `pullNumber`: 풀 리퀘스트 번호 (필수)
  - `body`: 리뷰 댓글 내용 (선택사항)
  - `event`: 리뷰 작업 ('APPROVE', 'REQUEST_CHANGES', 'COMMENT') (필수)
  - `commitId`: 리뷰할 커밋의 SHA (선택사항)
  - `comments`: 풀 리퀘스트 변경사항에 대한 줄별 댓글 배열 (선택사항)
    - 인라인 댓글의 경우: `path`, `position` (또는 `line`), `body` 제공
    - 멀티라인 댓글의 경우: `path`, `start_line`, `line`, 선택적 `side`/`start_side`, `body` 제공

- **create_pull_request** - 새로운 풀 리퀘스트 생성

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `title`: 풀 리퀘스트 제목 (필수)
  - `body`: 풀 리퀘스트 설명 (선택사항)
  - `head`: 변경사항이 담긴 브랜치 (필수)
  - `base`: 병합할 대상 브랜치 (필수)
  - `draft`: 초안으로 생성할지 여부 (선택사항)
  - `maintainer_can_modify`: 관리자 편집 허용 여부 (선택사항)

- **add_pull_request_review_comment** - 풀 리퀘스트에 리뷰 댓글 추가 또는 기존 댓글에 답글

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `pull_number`: 풀 리퀘스트 번호 (필수)
  - `body`: 리뷰 댓글 내용 (필수)
  - `commit_id`: 댓글을 달 커밋의 SHA (in_reply_to 사용 시 제외하고 필수)
  - `path`: 댓글을 달 파일의 상대 경로 (in_reply_to 사용 시 제외하고 필수)
  - `line`: 댓글을 달 풀 리퀘스트 diff의 줄 번호 (선택사항)
  - `side`: 댓글을 달 diff의 쪽 (LEFT 또는 RIGHT) (선택사항)
  - `start_line`: 멀티라인 댓글의 경우, 범위의 첫 번째 줄 (선택사항)
  - `start_side`: 멀티라인 댓글의 경우, diff의 시작 쪽 (LEFT 또는 RIGHT) (선택사항)
  - `subject_type`: 댓글이 향하는 수준 (line 또는 file) (선택사항)
  - `in_reply_to`: 답글할 리뷰 댓글의 ID (선택사항). 지정 시, body만 필요하고 다른 매개변수는 무시됨

- **update_pull_request** - 기존 풀 리퀘스트 수정
  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `pullNumber`: 수정할 풀 리퀘스트 번호 (필수)
  - `title`: 새 제목 (선택사항)
  - `body`: 새 설명 (선택사항)
  - `state`: 새 상태 ('open' 또는 'closed') (선택사항)
  - `base`: 새 기본 브랜치 이름 (선택사항)
  - `maintainer_can_modify`: 관리자 편집 허용 여부 (선택사항)

### 저장소(Repository) 관리 기능

- **create_or_update_file** - 저장소에서 단일 파일 생성 또는 업데이트

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `path`: 파일 경로 (필수)
  - `message`: 커밋 메시지 (필수)
  - `content`: 파일 내용 (필수)
  - `branch`: 브랜치 이름 (선택사항)
  - `sha`: 업데이트 시 파일 SHA (선택사항)

- **list_branches** - GitHub 저장소의 브랜치 목록 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `page`: 페이지 번호 (선택사항)
  - `perPage`: 페이지당 결과 수 (선택사항)

- **push_files** - 단일 커밋으로 여러 파일 푸시

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `branch`: 푸시할 브랜치 (필수)
  - `files`: 푸시할 파일들, 각각에 경로와 내용 포함 (배열, 필수)
  - `message`: 커밋 메시지 (필수)

- **search_repositories** - GitHub 저장소 검색

  - `query`: 검색어 (필수)
  - `sort`: 정렬 필드 (선택사항)
  - `order`: 정렬 순서 (선택사항)
  - `page`: 페이지 번호 (선택사항)
  - `perPage`: 페이지당 결과 수 (선택사항)

- **create_repository** - 새로운 GitHub 저장소 생성

  - `name`: 저장소 이름 (필수)
  - `description`: 저장소 설명 (선택사항)
  - `private`: 비공개 저장소 여부 (선택사항)
  - `autoInit`: README로 자동 초기화 여부 (선택사항)

- **get_file_contents** - 파일 또는 디렉터리 내용 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `path`: 파일 경로 (필수)
  - `ref`: Git 참조 (선택사항)

- **fork_repository** - 저장소 포크

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `organization`: 대상 조직 이름 (선택사항)

- **create_branch** - 새로운 브랜치 생성

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `branch`: 새 브랜치 이름 (필수)
  - `sha`: 브랜치를 생성할 SHA (필수)

- **list_commits** - 저장소 브랜치의 커밋 목록 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `sha`: 브랜치 이름, 태그, 또는 커밋 SHA (선택사항)
  - `path`: 이 파일 경로가 포함된 커밋만 (선택사항)
  - `page`: 페이지 번호 (선택사항)
  - `perPage`: 페이지당 결과 수 (선택사항)

- **get_commit** - 저장소에서 커밋 상세 정보 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `sha`: 커밋 SHA, 브랜치 이름, 또는 태그 이름 (필수)
  - `page`: 커밋의 파일에 대한 페이지 번호 (선택사항)
  - `perPage`: 커밋의 파일에 대한 페이지당 결과 수 (선택사항)

- **search_code** - GitHub 저장소에서 코드 검색
  - `query`: 검색어 (필수)
  - `sort`: 정렬 필드 (선택사항)
  - `order`: 정렬 순서 (선택사항)
  - `page`: 페이지 번호 (선택사항)
  - `perPage`: 페이지당 결과 수 (선택사항)

### 사용자 검색 기능

- **search_users** - GitHub 사용자 검색
  - `q`: 검색어 (필수)
  - `sort`: 정렬 필드 (선택사항)
  - `order`: 정렬 순서 (선택사항)
  - `page`: 페이지 번호 (선택사항)
  - `perPage`: 페이지당 결과 수 (선택사항)

### 코드 스캐닝 기능

**코드 스캐닝이란?** 코드에서 보안 취약점이나 문제점을 자동으로 찾아주는 기능입니다.

- **get_code_scanning_alert** - 코드 스캐닝 알림 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `alertNumber`: 알림 번호 (필수)

- **list_code_scanning_alerts** - 저장소의 코드 스캐닝 알림 목록 조회
  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `ref`: Git 참조 (선택사항)
  - `state`: 알림 상태 (선택사항)
  - `severity`: 알림 심각도 (선택사항)
  - `tool_name`: 코드 스캐닝에 사용된 도구 이름 (선택사항)

### 시크릿 스캐닝 기능

**시크릿 스캐닝이란?** 코드에 빠뜨린 비밀번호나 API 키 같은 민감한 정보를 찾아주는 기능입니다.

- **get_secret_scanning_alert** - 시크릿 스캐닝 알림 조회

  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `alertNumber`: 알림 번호 (필수)

- **list_secret_scanning_alerts** - 저장소의 시크릿 스캐닝 알림 목록 조회
  - `owner`: 저장소 소유자 이름 (필수)
  - `repo`: 저장소 이름 (필수)
  - `state`: 알림 상태 (선택사항)
  - `secret_type`: 쉼표로 구분된 필터링할 시크릿 타입 목록 (선택사항)
  - `resolution`: 해결 상태 (선택사항)

## Resources(리소스)

### 저장소 내용

- **저장소 내용 조회**
  특정 경로의 저장소 내용을 조회합니다.

  - **템플릿**: `repo://{owner}/{repo}/contents{/path*}`
  - **매개변수**:
    - `owner`: 저장소 소유자 (필수)
    - `repo`: 저장소 이름 (필수)
    - `path`: 파일 또는 디렉터리 경로 (선택사항)

- **특정 브랜치의 저장소 내용 조회**
  지정된 브랜치의 특정 경로에 있는 저장소 내용을 조회합니다.

  - **템플릿**: `repo://{owner}/{repo}/refs/heads/{branch}/contents{/path*}`
  - **매개변수**:
    - `owner`: 저장소 소유자 (필수)
    - `repo`: 저장소 이름 (필수)
    - `branch`: 브랜치 이름 (필수)
    - `path`: 파일 또는 디렉터리 경로 (선택사항)

- **특정 커밋의 저장소 내용 조회**
  지정된 커밋의 특정 경로에 있는 저장소 내용을 조회합니다.

  - **템플릿**: `repo://{owner}/{repo}/sha/{sha}/contents{/path*}`
  - **매개변수**:
    - `owner`: 저장소 소유자 (필수)
    - `repo`: 저장소 이름 (필수)
    - `sha`: 커밋 SHA (필수)
    - `path`: 파일 또는 디렉터리 경로 (선택사항)

- **특정 태그의 저장소 내용 조회**
  지정된 태그의 특정 경로에 있는 저장소 내용을 조회합니다.

  - **템플릿**: `repo://{owner}/{repo}/refs/tags/{tag}/contents{/path*}`
  - **매개변수**:
    - `owner`: 저장소 소유자 (필수)
    - `repo`: 저장소 이름 (필수)
    - `tag`: 태그 이름 (필수)
    - `path`: 파일 또는 디렉터리 경로 (선택사항)

- **특정 풀 리퀘스트의 저장소 내용 조회**
  지정된 풀 리퀘스트의 특정 경로에 있는 저장소 내용을 조회합니다.
  - **템플릿**: `repo://{owner}/{repo}/refs/pull/{prNumber}/head/contents{/path*}`
  - **매개변수**:
    - `owner`: 저장소 소유자 (필수)
    - `repo`: 저장소 이름 (필수)
    - `prNumber`: 풀 리퀘스트 번호 (필수)
    - `path`: 파일 또는 디렉터리 경로 (선택사항)

## 라이브러리 사용

현재 이 모듈의 내보낸 Go API는 불안정하다고 간주되며, 호환성을 깨는 변경사항이 있을 수 있습니다. 향후 안정성을 제공할 수 있지만, 이것이 유용한 사용 사례가 있다면 이슈를 제출해 주세요.

## 라이센스

이 프로젝트는 MIT 오픈 소스 라이센스 조건에 따라 라이센스가 부여됩니다. 전체 조건은 [MIT](./LICENSE)를 참조하세요.
