import fs from "fs/promises";
import path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "pdf-server",
  version: "1.0.0",
});

server.resource(
  "ai-inspect-markdown", // 리소스 이름
  "file:///ai-inspect", // 리소스 URI
  {
    description: "예제 마크다운 파일", // 설명 업데이트
    mimeType: "text/markdown", // 마크다운 MIME 타입
  },
  async (uri) => {
    try {
      // 마크다운 파일 경로 (index.ts와 동일한 위치)
      const markdownPath = path.join("resources", "ai-inspect.md");

      // 마크다운 파일 읽기
      const markdownData = await fs.readFile(markdownPath, "utf-8"); // utf-8로 직접 읽기

      // 리소스 반환 - 마크다운은 텍스트이므로 Base64 인코딩 불필요
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: markdownData, // 마크다운 텍스트를 직접 반환
          },
        ],
      };
    } catch (error) {
      throw new Error(`마크다운 파일을 읽는 중 오류가 발생했습니다: ${error}`);
    }
  }
);

async function main() {
  // 서버 시작
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("main()에서 치명적 오류 발생:", error);
  process.exit(1);
});
