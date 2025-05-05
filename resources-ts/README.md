# Resources-TS MCP 서버

파일 리소스(마크다운, PDF 등)를 제공하는 MCP 서버로, Claude가 외부 문서 파일에 접근할 수 있게 해주는 TypeScript 기반 프로젝트입니다.

## 리소스 목록

1. `ai-inspect-markdown`

   - 기술 문서 작성을 위한 가이드를 담은 마크다운 파일을 제공합니다
   - 입력값: 없음
   - 반환값: 마크다운 형식의 기술 문서 작성 가이드 내용

## 등록 방법

### 사전 준비 사항

1. 리소스 파일 준비

   - 제공하고자 하는 리소스 파일(예: 마크다운, PDF, 이미지 등)을 준비합니다
   - `/resources` 디렉토리 내에 해당 파일들을 위치시킵니다
   - 현재는 마크다운 파일만 지원됩니다

2. Docker 이미지 빌드

```bash
docker build -t mcp/resources-ts -f Dockerfile .
```

### Claude Desktop에서 사용 방법

`claude_desktop_config.json` 파일에 다음 내용을 추가하세요:

```json
{
  "mcpServers": {
    "resources": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp/resources-ts"]
    }
  }
}
```

### 문제 해결

리소스 서버 사용 중 오류가 발생할 경우 다음을 확인하세요:

1. 리소스 파일이 `/resources` 디렉토리에 정확히 위치해 있는지 확인
2. 파일 이름과 경로가 코드에서 참조하는 이름과 일치하는지 확인
3. Docker 컨테이너가 정상적으로 실행 중인지 확인
4. 코드에서 지원하는 파일 형식(현재는 마크다운)인지 확인

## 라이선스

이 MCP 서버는 MIT 라이선스로 제공됩니다. 이는 MIT 라이선스의 조건에 따라 소프트웨어를 자유롭게 사용, 수정 및 배포할 수 있음을 의미합니다. 자세한 내용은 프로젝트 저장소의 LICENSE 파일을 참조하세요.
