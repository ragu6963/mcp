# Discord-TS MCP 서버

Discord API를 위한 MCP 서버로, Claude가 Discord 봇과 상호작용할 수 있게 해주는 TypeScript 기반 프로젝트입니다.

## 도구 목록

1. `get_guild_info`

   - 특정 Discord 서버(길드)의 정보를 가져옵니다
   - 필수 입력값:
     - `guildId` (문자열): 정보를 조회할 Discord 서버의 ID
   - 반환값: 서버 이름, 멤버 수, 생성일, 설명 등의 상세 정보 (JSON 형식)

2. `list_guilds`

   - 봇이 연결된 모든 Discord 서버 목록을 조회합니다
   - 입력값: 없음
   - 반환값: 서버 이름, ID, 멤버 수 등의 리스트 (JSON 형식)

3. `get_bot_info`

   - Discord 봇에 대한 정보를 조회합니다
   - 입력값: 없음
   - 반환값: 봇 사용자명, ID, 가입 서버 수, 업타임 등의 정보 (JSON 형식)

4. `list_channels`

   - 특정 Discord 서버의 모든 채널 목록을 조회합니다
   - 필수 입력값:
     - `guildId` (문자열): 채널을 조회할 Discord 서버의 ID
   - 반환값: 채널 이름, ID, 타입별로 그룹화된 채널 목록 (JSON 형식)

5. `send_message`
   - 특정 Discord 채널에 메시지를 전송합니다
   - 필수 입력값:
     - `channelId` (문자열): 메시지를 전송할 Discord 채널 ID
     - `content` (문자열): 전송할 메시지 내용
   - 반환값: 메시지 전송 성공 여부 및 메시지 ID

## 등록 방법

### 사전 준비 사항

1. Discord 봇 생성 및 토큰 발급

   - [Discord 개발자 포털](https://discord.com/developers/applications)에 접속
   - 새 애플리케이션을 생성하고 봇 추가
   - 봇 토큰을 발급받아 안전하게 보관
   - 필요한 인텐트(Intents)를 활성화 (서버, 메시지, 멤버)
   - OAuth2 URL을 생성하여 봇을 서버에 초대

2. Docker 이미지 빌드

```bash
docker build -t mcp/discord-ts -f Dockerfile .
```

### Claude Desktop에서 사용 방법

`claude_desktop_config.json` 파일에 다음 내용을 추가하세요:

```json
{
  "mcpServers": {
    "discord": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "DISCORD_TOKEN", "mcp/discord-ts"],
      "env": {
        "DISCORD_TOKEN": "디스코드_봇_토큰"
      }
    }
  }
}
```

### 문제 해결

Discord 봇 연결 중 오류가 발생할 경우 다음을 확인하세요:

1. 봇 토큰이 올바르게 설정되었는지 확인
2. 봇에 필요한 인텐트가 Discord 개발자 포털에서 활성화되었는지 확인
3. 봇이 서버에 올바르게 초대되었는지 확인
4. 봇에 필요한 권한이 부여되었는지 확인
5. 채널 ID나 서버 ID가 올바른지 확인 (개발자 모드 활성화 필요)

## 라이선스

이 MCP 서버는 MIT 라이선스로 제공됩니다. 이는 MIT 라이선스의 조건에 따라 소프트웨어를 자유롭게 사용, 수정 및 배포할 수 있음을 의미합니다. 자세한 내용은 프로젝트 저장소의 LICENSE 파일을 참조하세요.
