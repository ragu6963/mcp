import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

// Initialize McpServer
const server = new McpServer({
  name: "weather",
  version: "1.0.0",
});

// 환경 변수에서 API 키 가져오기
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "";
if (!WEATHER_API_KEY) {
  console.log("경고: WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.");
}

// 단기예보 API 정보
const FORECAST_URL =
  "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";

/**
 * 공공 데이터 포털 API에 요청을 보내고 응답을 처리합니다.
 */
async function makeApiRequest(
  url: string,
  params: Record<string, any>
): Promise<Record<string, any> | null> {
  try {
    const response = await axios.get(url, {
      params,
      timeout: 30000, // 30초 타임아웃
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`API 요청 URL: ${response.config.url}`); // 디버깅용 URL 출력
    return response.data;
  } catch (error) {
    console.log(`API 요청 중 오류 발생: ${error}`);
    return null;
  }
}

/**
 * 현재 시간을 기준으로 가장 최근의 기상청 발표 시간을 반환합니다.
 */
function getBaseTime(): [string, string] {
  // 현재 시간 정보 생성
  const now = new Date();

  // 기준 시간 구하기 (3시간 단위로 발표: 02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 20:00, 23:00)
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
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let baseDate: string;
  let baseTime: string;

  // 첫 발표 시간(0200) 이전이면 전 날 발표를 사용
  if (currentHour < 2) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    baseDate = formatDate(yesterday);
    baseTime = "2300";
  } else {
    for (let i = 0; i < baseTimes.length; i++) {
      const time = baseTimes[i];
      const timeHour = parseInt(time.substring(0, 2));

      // API 발표 후 실제 데이터가 업데이트되는데 약간의 시간이 필요하므로,
      // 발표 시간에서 10분을 더 기다림
      if (
        currentHour < timeHour ||
        (currentHour === timeHour && currentMinute < 10)
      ) {
        if (i === 0) {
          // 첫 번째 발표 시간보다 이전인 경우 전날 마지막 발표
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          baseDate = formatDate(yesterday);
          baseTime = baseTimes[baseTimes.length - 1];
        } else {
          baseDate = formatDate(now);
          baseTime = baseTimes[i - 1];
        }
        return [baseDate, baseTime];
      }
    }

    // 모든 발표 시간이 지난 경우 오늘 마지막 발표
    baseDate = formatDate(now);
    baseTime = baseTimes[baseTimes.length - 1];
  }

  return [baseDate, baseTime];
}

/**
 * Date 객체를 'YYYYMMDD' 형식의 문자열로 변환합니다.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * 기상청 API 응답 데이터를 시간대별로 구조화합니다.
 */
function parseWeatherData(
  items: any[]
): Record<string, Record<string, string>> {
  // 예보 데이터 정리
  const forecasts: Record<string, Record<string, string>> = {};

  for (const item of items) {
    const fcstDate = item.fcstDate;
    const fcstTime = item.fcstTime;
    const category = item.category;
    const value = item.fcstValue;

    const key = `${fcstDate}_${fcstTime}`;

    if (!forecasts[key]) {
      forecasts[key] = {};
    }

    forecasts[key][category] = value;
  }

  return forecasts;
}

/**
 * 가공된 예보 데이터를 사용자가 읽기 싶은 형태로 변환합니다.
 */
function formatForecast(
  forecasts: Record<string, Record<string, string>>,
  limit: number = 8
): string[] {
  // 예보 시간별로 정렬
  const sortedKeys = Object.keys(forecasts).sort();

  // 예보 메시지 생성
  const results: string[] = [];

  for (let i = 0; i < Math.min(sortedKeys.length, limit); i++) {
    const key = sortedKeys[i];
    const [dateStr, timeStr] = key.split("_");
    const dateFormat = `${dateStr.substring(0, 4)}-${dateStr.substring(
      4,
      6
    )}-${dateStr.substring(6, 8)}`;
    const timeFormat = `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
    const timeLabel = `${dateFormat} ${timeFormat}`;

    const data = forecasts[key];

    // 하늘상태(SKY) 코드 변환
    const skyConditionMap: Record<string, string> = {
      "1": "맑음",
      "3": "구름많음",
      "4": "흐림",
    };
    const skyCondition = skyConditionMap[data.SKY] || "알 수 없음";

    // 강수형태(PTY) 코드 변환
    const precipitationTypeMap: Record<string, string> = {
      "0": "없음",
      "1": "비",
      "2": "비/눈",
      "3": "눈",
      "4": "소나기",
    };
    const precipitationType = precipitationTypeMap[data.PTY] || "알 수 없음";

    const temp = data.TMP || "알 수 없음"; // 기온
    const pop = data.POP || "알 수 없음"; // 강수확률
    const humidity = data.REH || "알 수 없음"; // 습도
    const windSpeed = data.WSD || "알 수 없음"; // 풍속

    const forecastText = `
${timeLabel}:
기온: ${temp}°C
날씨: ${skyCondition}
강수형태: ${precipitationType}
강수확률: ${pop}%
습도: ${humidity}%
풍속: ${windSpeed}m/s
`;
    results.push(forecastText);
  }

  return results;
}

// 도구 스키마 정의
const forecastSchema = z.object({
  nx: z.number().describe("기상청 X좌표 (예: 서울 중구 60)"),
  ny: z.number().describe("기상청 Y좌표 (예: 서울 중구 127)"),
});

// 도구 등록: 단기 예보 조회
server.tool(
  "get-forecast",
  "기상청 좌표계(X,Y) 기준으로 단기 예보를 조회합니다.",
  {
    nx: z.number().describe("기상청 X좌표 (예: 서울 중구 60)"),
    ny: z.number().describe("기상청 Y좌표 (예: 서울 중구 127)"),
  },
  async (args) => {
    // API 키가 없으면 오류 메시지 반환
    if (!WEATHER_API_KEY) {
      return {
        content: [
          {
            type: "text",
            text: "API 키가 설정되지 않았습니다. WEATHER_API_KEY 환경 변수를 설정해주세요.",
          },
        ],
      };
    }

    // 최신 발표 기준시간 구하기
    const [baseDate, baseTime] = getBaseTime();

    // API 요청 파라미터 설정
    const params = {
      serviceKey: WEATHER_API_KEY, // URL 인코딩된 API 키 사용
      numOfRows: "1000", // 충분한 데이터를 가져오기 위해 큰 값 설정
      pageNo: "1",
      dataType: "JSON",
      base_date: baseDate,
      base_time: baseTime,
      nx: args.nx,
      ny: args.ny,
    };

    // API 요청
    const data = await makeApiRequest(FORECAST_URL, params);

    // 응답 확인 및 데이터 추출
    if (!data || !data.response) {
      return {
        content: [
          {
            type: "text",
            text: "날씨 정보를 가져올 수 없습니다. API 응답이 유효하지 않습니다.",
          },
        ],
      };
    }

    // 응답 코드 확인
    const responseCode = data.response?.header?.resultCode;
    if (responseCode !== "00") {
      const errorMsg = data.response?.header?.resultMsg || "알 수 없는 오류";
      return {
        content: [
          {
            type: "text",
            text: `API 오류: ${errorMsg} (코드: ${responseCode})`,
          },
        ],
      };
    }

    // 데이터 추출
    const items = data.response?.body?.items?.item || [];

    if (!items.length) {
      return {
        content: [
          {
            type: "text",
            text: "날씨 예보 데이터가 없습니다.",
          },
        ],
      };
    }

    // 데이터 파싱 및 포맷팅
    const forecasts = parseWeatherData(items);
    const formattedForecasts = formatForecast(forecasts);

    // 결과 반환
    if (!formattedForecasts.length) {
      return {
        content: [
          {
            type: "text",
            text: "날씨 예보를 처리할 수 없습니다.",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: formattedForecasts.join("\n---\n"),
        },
      ],
    };
  }
);

// 도구 등록: 현재 날씨 조회
server.tool(
  "get-current-weather",
  "기상청 좌표계(X,Y) 기준으로 현재 날씨를 조회합니다.",
  {
    nx: z.number().describe("기상청 X좌표 (예: 서울 중구 60)"),
    ny: z.number().describe("기상청 Y좌표 (예: 서울 중구 127)"),
  },
  async (args) => {
    // API 키가 없으면 오류 메시지 반환
    if (!WEATHER_API_KEY) {
      return {
        content: [
          {
            type: "text",
            text: "API 키가 설정되지 않았습니다. WEATHER_API_KEY 환경 변수를 설정해주세요.",
          },
        ],
      };
    }

    // 최신 발표 기준시간 구하기
    const [baseDate, baseTime] = getBaseTime();

    // API 요청 파라미터 설정
    const params = {
      serviceKey: WEATHER_API_KEY,
      numOfRows: "1000",
      pageNo: "1",
      dataType: "JSON",
      base_date: baseDate,
      base_time: baseTime,
      nx: args.nx,
      ny: args.ny,
    };

    // API 요청
    const data = await makeApiRequest(FORECAST_URL, params);

    // 응답 확인 및 데이터 추출
    if (!data || !data.response) {
      return {
        content: [
          {
            type: "text",
            text: "날씨 정보를 가져올 수 없습니다. API 응답이 유효하지 않습니다.",
          },
        ],
      };
    }

    // 응답 코드 확인
    const responseCode = data.response?.header?.resultCode;
    if (responseCode !== "00") {
      const errorMsg = data.response?.header?.resultMsg || "알 수 없는 오류";
      return {
        content: [
          {
            type: "text",
            text: `API 오류: ${errorMsg} (코드: ${responseCode})`,
          },
        ],
      };
    }

    // 데이터 추출
    const items = data.response?.body?.items?.item || [];

    if (!items.length) {
      return {
        content: [
          {
            type: "text",
            text: "날씨 데이터가 없습니다.",
          },
        ],
      };
    }

    // 데이터 파싱
    const forecasts = parseWeatherData(items);

    // 가장 첫 번째 시간대 데이터를 현재 날씨로 사용
    if (Object.keys(forecasts).length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "날씨 데이터를 처리할 수 없습니다.",
          },
        ],
      };
    }

    const sortedKeys = Object.keys(forecasts).sort();
    const currentTimeKey = sortedKeys[0];
    const currentData = forecasts[currentTimeKey];

    // 날씨 데이터 변환
    const skyConditionMap: Record<string, string> = {
      "1": "맑음",
      "3": "구름많음",
      "4": "흐림",
    };
    const skyCondition = skyConditionMap[currentData.SKY] || "알 수 없음";

    const precipitationTypeMap: Record<string, string> = {
      "0": "없음",
      "1": "비",
      "2": "비/눈",
      "3": "눈",
      "4": "소나기",
    };
    const precipitationType =
      precipitationTypeMap[currentData.PTY] || "알 수 없음";

    // 데이터 메시지 구성
    const currentWeather = `현재 날씨 정보 (기준시간: ${baseDate} ${baseTime})
기온: ${currentData.TMP || "알 수 없음"}°C
날씨: ${skyCondition}
강수형태: ${precipitationType}
강수확률: ${currentData.POP || "알 수 없음"}%
습도: ${currentData.REH || "알 수 없음"}%
풍속: ${currentData.WSD || "알 수 없음"}m/s
`;

    return {
      content: [
        {
          type: "text",
          text: currentWeather,
        },
      ],
    };
  }
);

// 메인 함수 실행
async function main() {
  // 시작 시 환경 변수 확인 및 정보 출력
  console.log(
    `API 키 설정 여부: ${WEATHER_API_KEY ? "설정됨" : "설정되지 않음"}`
  );

  // 서버 실행
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log("Weather MCP Server running on stdio");
}

// 직접 실행된 경우 메인 함수 호출
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

// 모듈로 사용될 경우 server 서버 인스턴스 내보내기
export { server };
