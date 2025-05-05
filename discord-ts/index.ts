// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

// Discord 봇 클라이언트 설정
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// MCP 서버 인스턴스 생성
const server = new Server(
  {
    name: "discord-bot-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Discord 봇 연결 상태 확인
let isDiscordReady = false;

// Discord 봇 이벤트 설정
discordClient.once("ready", () => {
  console.error(`Discord bot logged in as ${discordClient.user?.tag}`);
  isDiscordReady = true;
});

// Discord 봇 로그인
if (process.env.DISCORD_TOKEN) {
  discordClient
    .login(process.env.DISCORD_TOKEN)
    .catch((error) => console.error("Failed to login to Discord:", error));
} else {
  console.error("DISCORD_TOKEN environment variable is not set");
}

// 서버 정보 확인 도구 구현
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_guild_info",
        description: "Get information about a specific Discord guild/server",
        inputSchema: {
          type: "object",
          properties: {
            guildId: {
              type: "string",
              description:
                "The ID of the Discord guild to get information about",
            },
          },
          required: ["guildId"],
        },
      },
      {
        name: "list_guilds",
        description: "List all Discord guilds the bot is connected to",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_bot_info",
        description: "Get information about the Discord bot",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_channels",
        description: "List all channels in a specific Discord guild",
        inputSchema: {
          type: "object",
          properties: {
            guildId: {
              type: "string",
              description: "The ID of the Discord guild to list channels from",
            },
          },
          required: ["guildId"],
        },
      },
      {
        name: "send_message",
        description: "Send a message to a specific Discord channel",
        inputSchema: {
          type: "object",
          properties: {
            channelId: {
              type: "string",
              description:
                "The ID of the Discord channel to send the message to",
            },
            content: {
              type: "string",
              description: "The message content to send",
            },
          },
          required: ["channelId", "content"],
        },
      },
    ],
  };
});

// 도구 실행 핸들러 구현
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!isDiscordReady) {
    throw new Error("Discord bot is not ready yet");
  }

  const { name, arguments: args } = request.params;
  if (!args) {
    throw new Error("Arguments are undefined");
  }

  switch (name) {
    case "get_guild_info": {
      const guildId = args.guildId as string;

      try {
        const guild = await discordClient.guilds.fetch(guildId);

        const info = {
          name: guild.name,
          id: guild.id,
          memberCount: guild.memberCount,
          createdAt: guild.createdAt.toISOString(),
          description: guild.description,
          ownerId: guild.ownerId,
          premiumTier: guild.premiumTier,
          preferredLocale: guild.preferredLocale,
          features: guild.features,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unable to fetch guild information. ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "list_guilds": {
      try {
        const guilds = discordClient.guilds.cache.map((guild) => ({
          name: guild.name,
          id: guild.id,
          memberCount: guild.memberCount,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(guilds, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unable to list guilds. ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "get_bot_info": {
      try {
        const botInfo = {
          username: discordClient.user?.username,
          id: discordClient.user?.id,
          discriminator: discordClient.user?.discriminator,
          avatar: discordClient.user?.avatar,
          guildCount: discordClient.guilds.cache.size,
          uptime: process.uptime(),
          readyAt: discordClient.readyAt?.toISOString(),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(botInfo, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unable to get bot information. ${error}`,
            },
          ],
          isError: true,
        };
      }
    }
    case "list_channels": {
      const guildId = args.guildId as string;

      try {
        const guild = await discordClient.guilds.fetch(guildId);
        const channels = await guild.channels.fetch();

        const channelList = channels
          .map((channel) => ({
            name: channel?.name,
            id: channel?.id,
            type: channel?.type,
            position: channel?.position,
            parentId: channel?.parentId,
          }))
          .filter((channel) => channel.name) // null 채널 제거
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        // 채널 타입별로 그룹화
        const groupedChannels = {
          textChannels: channelList.filter((ch) => ch.type === 0), // GUILD_TEXT
          voiceChannels: channelList.filter((ch) => ch.type === 2), // GUILD_VOICE
          categories: channelList.filter((ch) => ch.type === 4), // GUILD_CATEGORY
          announcementChannels: channelList.filter((ch) => ch.type === 5), // GUILD_ANNOUNCEMENT
          forumChannels: channelList.filter((ch) => ch.type === 15), // GUILD_FORUM
          stageChannels: channelList.filter((ch) => ch.type === 13), // GUILD_STAGE_VOICE
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(groupedChannels, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unable to list channels. ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "send_message": {
      const channelId = args.channelId as string;
      const content = args.content as string;

      try {
        const channel = await discordClient.channels.fetch(channelId);

        // 채널이 텍스트 채널인지 확인
        if (!channel || !channel.isTextBased()) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Channel ${channelId} is not a text channel or doesn't exist`,
              },
            ],
            isError: true,
          };
        }

        // 채널이 존재하고 send 메서드가 있는지 확인
        if (!channel || !("send" in channel)) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Channel ${channelId} doesn't support sending messages`,
              },
            ],
            isError: true,
          };
        }

        const message = await channel.send(content);

        return {
          content: [
            {
              type: "text",
              text: `Message sent successfully! Message ID: ${message.id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unable to send message. ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// 종료 시그널 핸들러 추가
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

async function gracefulShutdown() {
  console.error("종료 시그널 수신, 청소 작업 중...");
  // Discord 클라이언트 정리
  if (discordClient.isReady()) {
    await discordClient.destroy();
  }

  console.error("서버 종료 중...");
  process.exit(0);
}

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Discord MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
