# mcp-server-git: Git MCP 서버

## 개요

Git 저장소 상호작용 및 자동화를 위한 Model Context Protocol 서버입니다. 이 서버는 대형 언어 모델을 통해 Git 저장소를 읽고, 검색하고, 조작할 수 있는 도구들을 제공합니다.

mcp-server-git은 현재 초기 개발 단계에 있으므로 주의하시기 바랍니다. 기능과 사용 가능한 도구들은 계속 개발하고 개선하는 과정에서 변경되고 확장될 수 있습니다.

### 도구

1. `git_status`

   - 작업 트리 상태를 표시합니다
   - 입력:
     - `repo_path` (문자열): Git 저장소 경로
   - 반환: 작업 디렉토리의 현재 상태를 텍스트로 출력

2. `git_diff_unstaged`

   - 아직 스테이지되지 않은 작업 디렉토리의 변경사항을 표시합니다
   - 입력:
     - `repo_path` (문자열): Git 저장소 경로
   - 반환: 스테이지되지 않은 변경사항의 Diff 출력

3. `git_diff_staged`

   - 커밋을 위해 스테이지된 변경사항을 표시합니다
   - 입력:
     - `repo_path` (문자열): Git 저장소 경로
   - 반환: 스테이지된 변경사항의 Diff 출력

4. `git_diff`

   - 브랜치 또는 커밋 간의 차이점을 표시합니다
   - 입력:
     - `repo_path` (문자열): Git 저장소 경로
     - `target` (문자열): 비교할 대상 브랜치 또는 커밋
   - 반환: 현재 상태와 대상 간의 Diff 출력

5. `git_commit`

   - 저장소에 변경사항을 기록합니다
   - 입력:
     - `repo_path` (문자열): Git 저장소 경로
     - `message` (문자열): 커밋 메시지
   - 반환: 새 커밋 해시와 함께 확인 메시지

6. `git_add`

   - 파일 내용을 스테이징 영역에 추가합니다
   - 입력:
     - `repo_path` (문자열): Git 저장소 경로
     - `files` (문자열 배열): 스테이지할 파일 경로 배열
   - 반환: 스테이지된 파일들의 확인 메시지

7. `git_reset`

   - 모든 스테이지된 변경사항을 언스테이지합니다
   - 입력:
     - `repo_path` (문자열): Git 저장소 경로
   - 반환: 리셋 작업의 확인 메시지

8. `git_log`

   - 커밋 로그를 표시합니다
   - 입력:
     - `repo_path` (문자열): Git 저장소 경로
     - `max_count` (숫자, 선택사항): 표시할 최대 커밋 수 (기본값: 10)
   - 반환: 해시, 작성자, 날짜, 메시지가 포함된 커밋 항목 배열

9. `git_create_branch`

   - 새 브랜치를 생성합니다
   - 입력:
     - `repo_path` (문자열): Git 저장소 경로
     - `branch_name` (문자열): 새 브랜치 이름
     - `start_point` (문자열, 선택사항): 새 브랜치의 시작점
   - 반환: 브랜치 생성 확인 메시지

10. `git_checkout`

    - 브랜치를 전환합니다
    - 입력:
      - `repo_path` (문자열): Git 저장소 경로
      - `branch_name` (문자열): 체크아웃할 브랜치 이름
    - 반환: 브랜치 전환 확인 메시지

11. `git_show`

    - 커밋의 내용을 표시합니다
    - 입력:
      - `repo_path` (문자열): Git 저장소 경로
      - `revision` (문자열): 표시할 리비전 (커밋 해시, 브랜치 이름, 태그)
    - 반환: 지정된 커밋의 내용

12. `git_init`

    - Git 저장소를 초기화합니다
    - 입력:
      - `repo_path` (문자열): Git 저장소를 초기화할 디렉토리 경로
    - 반환: 저장소 초기화 확인 메시지

## 설치

### uv 사용 (권장)

[`uv`](https://docs.astral.sh/uv/)를 사용할 때는 별도의 설치가 필요하지 않습니다. [`uvx`](https://docs.astral.sh/uv/guides/tools/)를 사용하여 *mcp-server-git*을 직접 실행합니다.

### PIP 사용

또는 pip을 통해 `mcp-server-git`을 설치할 수 있습니다:

```
pip install mcp-server-git
```

설치 후, 다음과 같이 스크립트로 실행할 수 있습니다:

```
python -m mcp_server_git
```

## 구성

### Claude Desktop과 함께 사용

`claude_desktop_config.json`에 다음을 추가하세요:

<details>
<summary>uvx 사용</summary>

```json
"mcpServers": {
  "git": {
    "command": "uvx",
    "args": ["mcp-server-git", "--repository", "path/to/git/repo"]
  }
}
```

</details>

<details>
<summary>docker 사용</summary>

- 참고: '/Users/username'을 이 도구가 접근할 수 있도록 하려는 경로로 교체하세요

```json
"mcpServers": {
  "git": {
    "command": "docker",
    "args": ["run", "--rm", "-i", "--mount", "type=bind,src=/Users/username,dst=/Users/username", "mcp/git"]
  }
}
```

</details>

<details>
<summary>pip 설치 사용</summary>

```json
"mcpServers": {
  "git": {
    "command": "python",
    "args": ["-m", "mcp_server_git", "--repository", "path/to/git/repo"]
  }
}
```

</details>

### VS Code와 함께 사용

빠른 설치를 위해 아래의 원클릭 설치 버튼 중 하나를 사용하세요...

[![Install with UV in VS Code](https://img.shields.io/badge/VS_Code-UV-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=git&config=%7B%22command%22%3A%22uvx%22%2C%22args%22%3A%5B%22mcp-server-git%22%5D%7D) [![Install with UV in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-UV-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=git&config=%7B%22command%22%3A%22uvx%22%2C%22args%22%3A%5B%22mcp-server-git%22%5D%7D&quality=insiders)

[![Install with Docker in VS Code](https://img.shields.io/badge/VS_Code-Docker-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=git&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22--mount%22%2C%22type%3Dbind%2Csrc%3D%24%7BworkspaceFolder%7D%2Cdst%3D%2Fworkspace%22%2C%22mcp%2Fgit%22%5D%7D) [![Install with Docker in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Docker-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=git&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22--mount%22%2C%22type%3Dbind%2Csrc%3D%24%7BworkspaceFolder%7D%2Cdst%3D%2Fworkspace%22%2C%22mcp%2Fgit%22%5D%7D&quality=insiders)

수동 설치를 위해 VS Code의 사용자 설정 (JSON) 파일에 다음 JSON 블록을 추가하세요. `Ctrl + Shift + P`를 누르고 `Preferences: Open Settings (JSON)`을 입력하여 이 작업을 수행할 수 있습니다.

선택적으로, 작업 공간에 `.vscode/mcp.json`이라는 파일에 추가할 수 있습니다. 이렇게 하면 다른 사람들과 구성을 공유할 수 있습니다.

> `.vscode/mcp.json` 파일에서는 `mcp` 키가 필요하지 않습니다.

```json
{
  "mcp": {
    "servers": {
      "git": {
        "command": "uvx",
        "args": ["mcp-server-git"]
      }
    }
  }
}
```

Docker 설치용:

```json
{
  "mcp": {
    "servers": {
      "git": {
        "command": "docker",
        "args": [
          "run",
          "--rm",
          "-i",
          "--mount",
          "type=bind,src=${workspaceFolder},dst=/workspace",
          "mcp/git"
        ]
      }
    }
  }
}
```

### [Zed](https://github.com/zed-industries/zed)와 함께 사용

Zed settings.json에 추가하세요:

<details>
<summary>uvx 사용</summary>

```json
"context_servers": [
  "mcp-server-git": {
    "command": {
      "path": "uvx",
      "args": ["mcp-server-git"]
    }
  }
],
```

</details>

<details>
<summary>pip 설치 사용</summary>

```json
"context_servers": {
  "mcp-server-git": {
    "command": {
      "path": "python",
      "args": ["-m", "mcp_server_git"]
    }
  }
},
```

</details>

## 디버깅

서버를 디버깅하기 위해 MCP 인스펙터를 사용할 수 있습니다. uvx 설치의 경우:

```
npx @modelcontextprotocol/inspector uvx mcp-server-git
```

또는 특정 디렉토리에 패키지를 설치했거나 개발 중인 경우:

```
cd path/to/servers/src/git
npx @modelcontextprotocol/inspector uv run mcp-server-git
```

`tail -n 20 -f ~/Library/Logs/Claude/mcp*.log`를 실행하면 서버의 로그를 표시하고 문제를 디버깅하는 데 도움이 될 수 있습니다.

## 개발

로컬 개발을 하는 경우, 변경사항을 테스트하는 두 가지 방법이 있습니다:

1. MCP 인스펙터를 실행하여 변경사항을 테스트하세요. 실행 지침은 [디버깅](#디버깅)을 참조하세요.

2. Claude 데스크톱 앱을 사용하여 테스트하세요. `claude_desktop_config.json`에 다음을 추가하세요:

### Docker

```json
{
  "mcpServers": {
    "git": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--mount",
        "type=bind,src=/Users/username/Desktop,dst=/projects/Desktop",
        "--mount",
        "type=bind,src=/path/to/other/allowed/dir,dst=/projects/other/allowed/dir,ro",
        "--mount",
        "type=bind,src=/path/to/file.txt,dst=/projects/path/to/file.txt",
        "mcp/git"
      ]
    }
  }
}
```

### UVX

```json
{
  "mcpServers": {
    "git": {
      "command": "uv",
      "args": [
        "--directory",
        "/<path to mcp-servers>/mcp-servers/src/git",
        "run",
        "mcp-server-git"
      ]
    }
  }
}
```

## 빌드

Docker 빌드:

```bash
cd src/git
docker build -t mcp/git .
```

## 라이선스

이 MCP 서버는 MIT 라이선스 하에 라이선스됩니다. 이는 MIT 라이선스의 조건에 따라 소프트웨어를 자유롭게 사용, 수정 및 배포할 수 있음을 의미합니다. 자세한 내용은 프로젝트 저장소의 LICENSE 파일을 참조하세요.
