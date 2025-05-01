import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

// .env 파일 로드
dotenv.config();

// 기상청 단기예보 API 기본 정보
const KMA_API_BASE = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
const USER_AGENT = "weather-mcp-server/1.0";

// 환경변수에서 서비스 키 가져오기
const SERVICE_KEY = process.env.SERVICE_KEY || "";

// 서비스 키 유효성 검사
if (!SERVICE_KEY || SERVICE_KEY === "여기에_서비스_키를_입력하세요") {
  console.error("오류: 유효한 SERVICE_KEY가 설정되지 않았습니다.");
  console.error(
    "공공데이터포털에서 발급받은 서비스 키를 .env 파일의 SERVICE_KEY에 설정하세요."
  );
  process.exit(1);
}

// 날씨 코드 매핑 - 인덱스 타입 명시
interface WeatherCodeMap {
  [code: string]: string;
}

const WEATHER_CODES: {
  SKY: WeatherCodeMap;
  PTY: WeatherCodeMap;
} = {
  SKY: {
    "1": "맑음",
    "3": "구름많음",
    "4": "흐림",
  },
  PTY: {
    "0": "없음",
    "1": "비",
    "2": "비/눈",
    "3": "눈",
    "4": "소나기",
  },
};

// 기상 요소 매핑 - 인덱스 타입 명시
interface CategoryMap {
  [category: string]: string;
}

const CATEGORY_MAP: CategoryMap = {
  POP: "강수확률(%)",
  PTY: "강수형태",
  PCP: "1시간 강수량(mm)",
  REH: "습도(%)",
  SNO: "1시간 신적설(cm)",
  SKY: "하늘상태",
  TMP: "1시간 기온(℃)",
  TMN: "일 최저기온(℃)",
  TMX: "일 최고기온(℃)",
  UUU: "풍속(동서성분)(m/s)",
  VVV: "풍속(남북성분)(m/s)",
  WAV: "파고(m)",
  VEC: "풍향(deg)",
  WSD: "풍속(m/s)",
};

// 주요 지역의 격자 좌표 - 인터페이스 정의
interface LocationCoord {
  nx: number;
  ny: number;
}

interface LocationsMap {
  [location: string]: LocationCoord;
}

const LOCATIONS: LocationsMap = {
  서울: { nx: 60, ny: 127 },
  인천: { nx: 55, ny: 124 },
  부산: { nx: 98, ny: 76 },
  대구: { nx: 89, ny: 90 },
  광주: { nx: 58, ny: 74 },
  대전: { nx: 67, ny: 100 },
  울산: { nx: 102, ny: 84 },
  세종: { nx: 66, ny: 103 },
  경기도: { nx: 60, ny: 120 },
  강원도: { nx: 73, ny: 134 },
  충청북도: { nx: 69, ny: 107 },
  충청남도: { nx: 68, ny: 100 },
  전라북도: { nx: 63, ny: 89 },
  전라남도: { nx: 51, ny: 67 },
  경상북도: { nx: 89, ny: 91 },
  경상남도: { nx: 91, ny: 77 },
  제주도: { nx: 52, ny: 38 },
};

// API 응답 타입 정의
interface KmaApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: Array<{
          [key: string]: any;
        }>;
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// 기상청 API 요청을 위한 헬퍼 함수
async function makeKmaRequest<T extends KmaApiResponse>(
  endpoint: string,
  params: Record<string, string | number>
): Promise<T | null> {
  const url = new URL(`${KMA_API_BASE}/${endpoint}`);

  // 공통 파라미터 설정
  url.searchParams.append("serviceKey", SERVICE_KEY);
  url.searchParams.append("dataType", "JSON");

  // 추가 파라미터 설정
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, String(value));
  }

  try {
    console.error(`Requesting: ${url.toString()}`);
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as T;

    // 기상청 API 응답 검증
    if (data.response.header.resultCode !== "00") {
      throw new Error(
        `API error! code: ${data.response.header.resultCode}, message: ${data.response.header.resultMsg}`
      );
    }

    return data;
  } catch (error) {
    console.error("Error making KMA request:", error);
    return null;
  }
}

function getCurrentDateTime(): { baseDate: string; baseTime: string } {
  // 현재 시간 정보 생성
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );

  // 기준 시간 배열 (3시간 단위로 발표)
  const baseTimes = [
    "0200",
    "0500",
    "0800",
    "1100",
    "1400",
    "1700",
    "2000",
    "2300",
  ];

  // 현재 시간과 분
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // 날짜를 YYYYMMDD 형식으로 변환
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  let baseDate = formatDate(now);
  let baseTime = "0200";

  if (currentHour < 2 || (currentHour === 2 && currentMinute < 10)) {
    // 현재 시간이 02시 10분 이전이면 전날 날짜의 23시 발표 데이터 사용
    baseDate = formatDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    baseTime = "2300";
  } else {
    // 현재 시간에 맞는 가장 최근의 발표 시간 찾기
    let found = false;

    for (let i = baseTimes.length - 1; i >= 0; i--) {
      const baseHour = parseInt(baseTimes[i].substring(0, 2));

      // 현재 시간이 발표 시간 이후면 해당 발표 시간 사용
      if (
        currentHour > baseHour ||
        (currentHour === baseHour && currentMinute >= 10)
      ) {
        baseTime = baseTimes[i];
        found = true;
        break;
      }
    }

    // 적절한 발표 시간을 찾지 못했을 경우 (이론적으로는 발생하지 않아야 함)
    if (!found) {
      // 가장 최근의 발표 시간인 전날 23시 데이터 사용
      baseDate = formatDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
      baseTime = "2300";
    }
  }
  return { baseDate, baseTime };
}

// 예보 항목 인터페이스
interface ForecastItem {
  fcstDate: string;
  fcstTime: string;
  category: string;
  fcstValue: string;
}

// 가공된 예보 인터페이스
interface ProcessedForecast {
  dateTime: string;
  forecasts: Record<string, string>;
}

// 예보 데이터 가공 함수
function processForecasts(items: ForecastItem[]): ProcessedForecast[] {
  // 예보 시간별로 데이터 정리
  const forecasts: Record<string, Record<string, string>> = {};

  for (const item of items) {
    const fcstDate = item.fcstDate;
    const fcstTime = item.fcstTime;
    const category = item.category;
    const value = item.fcstValue;

    // 시간별로 구분
    const key = `${fcstDate} ${fcstTime}`;
    if (!forecasts[key]) {
      forecasts[key] = {};
    }

    // 값 변환
    let displayValue = value;
    if (category === "SKY" && WEATHER_CODES.SKY[value]) {
      displayValue = WEATHER_CODES.SKY[value];
    } else if (category === "PTY" && WEATHER_CODES.PTY[value]) {
      displayValue = WEATHER_CODES.PTY[value];
    }

    // 카테고리명 변환
    const displayCategory = CATEGORY_MAP[category] || category;
    forecasts[key][displayCategory] = displayValue;
  }

  // 시간순으로 정렬하여 반환
  return Object.entries(forecasts)
    .map(([dateTime, data]) => {
      // 날짜와 시간 포맷팅
      const [date, time] = dateTime.split(" ");
      const year = date.slice(0, 4);
      const month = date.slice(4, 6);
      const day = date.slice(6, 8);
      const hour = time.slice(0, 2);
      const minute = time.slice(2, 4);

      return {
        dateTime: `${year}-${month}-${day} ${hour}:${minute}`,
        forecasts: data,
      };
    })
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
}

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
  ({ format }) => {
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
