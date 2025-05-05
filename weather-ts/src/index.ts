import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  WEATHER_CODES,
  CATEGORY_MAP,
  LOCATIONS,
  KmaApiResponse,
  makeKmaRequest,
  getCurrentDateTime,
  ForecastItem,
  ProcessedForecast,
  processForecasts,
} from "./weather-api.js";

// MCP 서버 생성
const server = new McpServer({
  name: process.env.SERVER_NAME || "korean-weather",
  version: process.env.SERVER_VERSION || "1.0.0",
  instructions:
    "이 서버는 한국 기상청의 단기예보 API를 사용하여 날씨 정보를 제공합니다. 지역명을 입력하면 해당 지역의 날씨 예보를 조회할 수 있습니다.",
});

server.tool(
  "get-current-date-time",
  "현재 날짜와 시간을 조회합니다",
  {
    format: z.enum(["YYYY-MM-DD", "YYYYMMDD"]).default("YYYY-MM-DD"),
  },
  ({}) => {
    const { baseDate, baseTime } = getCurrentDateTime();
    return {
      content: [
        {
          type: "text",
          text: `현재 날짜: ${baseDate}, 현재 시간: ${baseTime}`,
        },
      ],
    };
  }
);

// 단기예보 조회 도구 등록
server.tool(
  "get-short-term-forecast",
  "특정 지역의 단기예보(오늘/내일)를 조회합니다",
  {
    location: z.string().describe("조회할 지역명 (예: 서울, 부산, 대구 등)"),
    numOfRows: z
      .number()
      .min(1)
      .max(1000)
      .default(100)
      .describe("반환할 행 개수 (기본값: 100)"),
  },
  async ({ location, numOfRows }) => {
    // 지역 정보 확인
    if (!LOCATIONS[location]) {
      const validLocations = Object.keys(LOCATIONS).join(", ");
      return {
        content: [
          {
            type: "text",
            text: `지원하지 않는 지역입니다. 지원 지역: ${validLocations}`,
          },
        ],
        isError: true,
      };
    }

    // 현재 시간 및 좌표 설정
    const { baseDate, baseTime } = getCurrentDateTime();
    const { nx, ny } = LOCATIONS[location];

    // API 요청 파라미터
    const params = {
      pageNo: 1,
      numOfRows,
      base_date: baseDate,
      base_time: baseTime,
      nx,
      ny,
    };

    // 단기예보 조회
    const forecastData = await makeKmaRequest<KmaApiResponse>(
      "getVilageFcst",
      params
    );

    if (!forecastData) {
      return {
        content: [
          {
            type: "text",
            text: "단기예보 데이터를 가져오는데 실패했습니다.",
          },
        ],
        isError: true,
      };
    }

    // 응답 확인
    const items = forecastData.response.body.items.item;
    if (!items || items.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "예보 데이터가 없습니다.",
          },
        ],
      };
    }

    // 데이터 가공
    const processedForecasts = processForecasts(items as ForecastItem[]);

    // 응답 생성
    const forecastText =
      `${location}의 단기예보 (기준: ${baseDate} ${baseTime}):\n\n` +
      processedForecasts
        .map((period) => {
          const { dateTime, forecasts } = period;

          // 주요 정보 추출
          const temperature = forecasts["1시간 기온(℃)"] || "정보 없음";
          const sky = forecasts["하늘상태"] || "정보 없음";
          const rainfall = forecasts["강수형태"] || "정보 없음";
          const rainProbability = forecasts["강수확률(%)"] || "정보 없음";
          const humidity = forecasts["습도(%)"] || "정보 없음";

          return [
            `${dateTime}:`,
            `온도: ${temperature}℃`,
            `하늘: ${sky}`,
            `강수형태: ${rainfall}`,
            `강수확률: ${rainProbability}%`,
            `습도: ${humidity}%`,
            "---",
          ].join("\n");
        })
        .join("\n");

    return {
      content: [
        {
          type: "text",
          text: forecastText,
        },
      ],
    };
  }
);

// 초단기예보 조회 도구 등록
server.tool(
  "get-ultra-short-term-forecast",
  "특정 지역의 초단기예보(6시간 이내)를 조회합니다",
  {
    location: z.string().describe("조회할 지역명 (예: 서울, 부산, 대구 등)"),
    numOfRows: z
      .number()
      .min(1)
      .max(1000)
      .default(60)
      .describe("반환할 행 개수 (기본값: 60)"),
  },
  async ({ location, numOfRows }) => {
    // 지역 정보 확인
    if (!LOCATIONS[location]) {
      const validLocations = Object.keys(LOCATIONS).join(", ");
      return {
        content: [
          {
            type: "text",
            text: `지원하지 않는 지역입니다. 지원 지역: ${validLocations}`,
          },
        ],
        isError: true,
      };
    }

    // 현재 시간 및 좌표 설정
    const { baseDate, baseTime } = getCurrentDateTime();
    const { nx, ny } = LOCATIONS[location];

    // API 요청 파라미터
    const params = {
      pageNo: 1,
      numOfRows,
      base_date: baseDate,
      base_time: baseTime,
      nx,
      ny,
    };

    // 초단기예보 조회
    const forecastData = await makeKmaRequest<KmaApiResponse>(
      "getUltraSrtFcst",
      params
    );

    if (!forecastData) {
      return {
        content: [
          {
            type: "text",
            text: "초단기예보 데이터를 가져오는데 실패했습니다.",
          },
        ],
        isError: true,
      };
    }

    // 응답 확인
    const items = forecastData.response.body.items.item;
    if (!items || items.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "예보 데이터가 없습니다.",
          },
        ],
      };
    }

    // 데이터 가공
    const processedForecasts = processForecasts(items as ForecastItem[]);

    // 응답 생성
    const forecastText =
      `${location}의 초단기예보 (기준: ${baseDate} ${baseTime}):\n\n` +
      processedForecasts
        .map((period) => {
          const { dateTime, forecasts } = period;

          // 주요 정보 추출
          const temperature = forecasts["1시간 기온(℃)"] || "정보 없음";
          const rainfall = forecasts["강수형태"] || "정보 없음";
          const sky = forecasts["하늘상태"] || "정보 없음";
          const humidity = forecasts["습도(%)"] || "정보 없음";
          const windSpeed = forecasts["풍속(m/s)"] || "정보 없음";

          return [
            `${dateTime}:`,
            `온도: ${temperature}℃`,
            `강수형태: ${rainfall}`,
            `하늘: ${sky}`,
            `습도: ${humidity}%`,
            `풍속: ${windSpeed}m/s`,
            "---",
          ].join("\n");
        })
        .join("\n");

    return {
      content: [
        {
          type: "text",
          text: forecastText,
        },
      ],
    };
  }
);

// 지역 목록 조회 도구 등록
server.tool("list-locations", "지원하는 지역 목록을 조회합니다", async () => {
  const locationsList = Object.keys(LOCATIONS).sort().join(", ");

  return {
    content: [
      {
        type: "text",
        text: `지원하는 지역 목록: ${locationsList}`,
      },
    ],
  };
});

// 현재 날씨 정보 조회 도구 등록
server.tool(
  "get-current-weather",
  "특정 지역의 현재 날씨 정보를 조회합니다",
  {
    location: z.string().describe("조회할 지역명 (예: 서울, 부산, 대구 등)"),
  },
  async ({ location }) => {
    // 지역 정보 확인
    if (!LOCATIONS[location]) {
      const validLocations = Object.keys(LOCATIONS).join(", ");
      return {
        content: [
          {
            type: "text",
            text: `지원하지 않는 지역입니다. 지원 지역: ${validLocations}`,
          },
        ],
        isError: true,
      };
    }

    // 현재 시간 및 좌표 설정
    const { baseDate, baseTime } = getCurrentDateTime();
    const { nx, ny } = LOCATIONS[location];

    // API 요청 파라미터
    const params = {
      pageNo: 1,
      numOfRows: 10,
      base_date: baseDate,
      base_time: baseTime,
      nx,
      ny,
    };

    // 초단기실황 조회
    const weatherData = await makeKmaRequest<KmaApiResponse>(
      "getUltraSrtNcst",
      params
    );

    if (!weatherData) {
      return {
        content: [
          {
            type: "text",
            text: "현재 날씨 데이터를 가져오는데 실패했습니다.",
          },
        ],
        isError: true,
      };
    }

    // 응답 확인
    const items = weatherData.response.body.items.item;
    if (!items || items.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "날씨 데이터가 없습니다.",
          },
        ],
      };
    }

    // 데이터 가공
    const weather: Record<string, string> = {};

    interface NcstItem {
      category: string;
      obsrValue: string;
    }

    for (const item of items as NcstItem[]) {
      const category = item.category;
      let value = item.obsrValue;

      // 값 변환
      if (category === "PTY" && WEATHER_CODES.PTY[value]) {
        value = WEATHER_CODES.PTY[value];
      }

      // 카테고리명 변환
      const displayCategory = CATEGORY_MAP[category] || category;
      weather[displayCategory] = value;
    }

    // 응답 생성
    const weatherText =
      `${location}의 현재 날씨 (기준: ${baseDate} ${baseTime}):\n\n` +
      Object.entries(weather)
        .map(([category, value]) => `${category}: ${value}`)
        .join("\n");

    return {
      content: [
        {
          type: "text",
          text: weatherText,
        },
      ],
    };
  }
);

// 날씨 정보 프롬프트 등록
server.prompt(
  "weather-analysis",
  "특정 지역의 날씨 분석을 위한 프롬프트",
  {
    location: z.string().describe("분석할 지역명 (예: 서울, 부산 등)"),
  },
  ({ location }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `${location}의 날씨 정보를 분석해주세요. 
        
        다음 항목을 중심으로 분석해주세요:
        1. 온도 변화 추이
        2. 강수 확률 및 형태
        3. 하늘 상태
        4. 습도 및 바람
        5. 전반적인 날씨 특징과 예상되는 변화
        
        필요한 정보는 get-current-weather, get-short-term-forecast, get-ultra-short-term-forecast 도구를 사용하여 가져올 수 있습니다.`,
        },
      },
    ],
  })
);

// 여행 날씨 추천 프롬프트 등록
server.prompt(
  "travel-weather-recommendation",
  "여행 계획을 위한 날씨 기반 추천 프롬프트",
  {
    locations: z
      .string()
      .describe("여행 고려 지역들 (쉼표로 구분, 예: 서울, 부산, 제주도)"),
  },
  ({ locations }) => {
    const locationList = locations.split(",").map((l) => l.trim());

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `다음 지역들 중에서 오늘과 내일의 날씨를 기준으로 여행하기 좋은 곳을 추천해주세요: ${locations}
          
          각 지역의 날씨 정보를 get-short-term-forecast 도구를 사용해 확인하고,
          날씨 조건(강수 여부, 온도, 하늘 상태 등)을 기준으로 가장 좋은 여행지를 추천해주세요.
          
          또한 추천하는 지역에서 날씨에 맞는 활동이나 주의사항도 함께 알려주세요.`,
          },
        },
      ],
    };
  }
);

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("기상청 단기예보 MCP 서버가 stdio에서 실행중입니다");
}

main().catch((error) => {
  console.error("main()에서 치명적 오류 발생:", error);
  process.exit(1);
});
