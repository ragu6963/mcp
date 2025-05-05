# Discord-TS MCP 서버

## 사용법

### 사전 준비

1. 디스코드 봇 생성
2. 서버 초대

### Docker 이미지 빌드

```bash
docker build -t mcp/discord-ts -f Dockerfile .
```

### Claude Desktop에서 사용 방법

`claude_desktop_config.json` 파일에 다음 내용을 추가하세요:

#### docker 사용

```json
{
  "mcpServers": {
    "discord": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "DISCORD_TOKEN", "mcp/discord-ts"],
      "env": {
        "DISCORD_TOKEN": "디스코드 봇 Token"
      }
    }
  }
}
```

## 라이선스

이 MCP 서버는 MIT 라이선스로 제공됩니다. 이는 MIT 라이선스의 조건에 따라 소프트웨어를 자유롭게 사용, 수정 및 배포할 수 있음을 의미합니다. 자세한 내용은 프로젝트 저장소의 LICENSE 파일을 참조하세요.
