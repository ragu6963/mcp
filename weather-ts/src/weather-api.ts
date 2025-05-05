// 기상청 API 관련 모듈
// 기상청 단기예보 API 기본 정보 및 데이터 처리 함수 모음

// 기상청 단기예보 API 기본 정보
const KMA_API_BASE = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
const USER_AGENT = "weather-mcp-server/1.0";

// 환경변수에서 서비스 키 가져오기
const SERVICE_KEY = process.env.SERVICE_KEY || "";

// 날씨 코드 매핑 - 인덱스 타입 명시
interface WeatherCodeMap {
  [code: string]: string;
}

export const WEATHER_CODES: {
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

export const CATEGORY_MAP: CategoryMap = {
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

export const LOCATIONS: LocationsMap = {
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
export interface KmaApiResponse {
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
export async function makeKmaRequest<T extends KmaApiResponse>(
  endpoint: string,
  params: Record<string, string | number>
): Promise<T | null> {
  const url = new URL(`${KMA_API_BASE}/${endpoint}`);

  // 서비스 키 유효성 검사
  if (!SERVICE_KEY || SERVICE_KEY === "여기에_서비스_키를_입력하세요") {
    console.error("오류: 유효한 SERVICE_KEY가 설정되지 않았습니다.");
    console.error(
      "공공데이터포털에서 발급받은 서비스 키를 .env 파일의 SERVICE_KEY에 설정하세요."
    );
    return null;
  }

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

export function getCurrentDateTime(): { baseDate: string; baseTime: string } {
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
export interface ForecastItem {
  fcstDate: string;
  fcstTime: string;
  category: string;
  fcstValue: string;
}

// 가공된 예보 인터페이스
export interface ProcessedForecast {
  dateTime: string;
  forecasts: Record<string, string>;
}

// 예보 데이터 가공 함수
export function processForecasts(items: ForecastItem[]): ProcessedForecast[] {
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
