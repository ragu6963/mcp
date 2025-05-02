import fs from "fs/promises";
import path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "pdf-server",
  version: "1.0.0",
});

server.resource(
  "example-pdf", // 리소스 이름
  "pdf://example", // 리소스 URI
  {
    description: "예제 PDF 파일",
    mimeType: "application/pdf",
  },
  async (uri) => {
    try {
      // PDF 파일 경로 (index.ts와 동일한 위치)
      const pdfPath = path.join("resources", "example.pdf");

      // PDF 파일 읽기
      const pdfData = await fs.readFile(pdfPath);

      // Base64로 인코딩
      const base64Data = pdfData.toString("base64");

      // 리소스 반환
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/pdf",
            blob: base64Data, // Base64로 인코딩된 PDF 데이터
          },
        ],
      };
    } catch (error) {
      throw new Error(`PDF 파일을 읽는 중 오류가 발생했습니다.${error}`);
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
