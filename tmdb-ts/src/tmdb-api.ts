import axios from "axios";

// TMDB API 기본 URL
const BASE_URL = "https://api.themoviedb.org/3";
const API_TOKEN = process.env.TMDB_API_TOKEN;

if (!API_TOKEN) {
  throw new Error(
    "TMDB API 키가 설정되지 않았습니다. TMDB_API_TOKEN를 설정해주세요."
  );
}

/**
 * TMDB API 요청 기본 함수
 */
async function fetchFromTMDB(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<any> {
  const queryParams = {
    ...params,
  };

  try {
    // axios로 API 호출하기
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      params: queryParams,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // axios 에러 처리
      const status = error.response?.status;
      const statusText = error.response?.statusText;

      console.error("TMDB API 요청 실패:", error.message);
      throw new Error(`TMDB API 오류: ${status} ${statusText}`);
    } else {
      // 기타 에러 처리
      console.error("TMDB API 요청 실패:", error);
      throw error;
    }
  }
}

/**
 * 영화 검색 함수
 */
export async function searchMovies(
  query: string,
  page: string = "1"
): Promise<any> {
  return fetchFromTMDB("/search/movie", { query, page });
}

/**
 * 인기 영화 가져오기
 */
export async function getPopularMovies(page: string = "1"): Promise<any> {
  return fetchFromTMDB("/movie/popular", { page });
}

/**
 * 영화 상세 정보 가져오기
 */
export async function getMovieDetails(movieId: string): Promise<any> {
  return fetchFromTMDB(`/movie/${movieId}`);
}

/**
 * 영화 크레딧 정보 가져오기
 */
export async function getMovieCredits(movieId: string): Promise<any> {
  return fetchFromTMDB(`/movie/${movieId}/credits`);
}

/**
 * 배우 검색 함수
 */
export async function searchPeople(
  query: string,
  page: string = "1"
): Promise<any> {
  return fetchFromTMDB("/search/person", { query, page });
}

/**
 * 배우 상세 정보 가져오기
 */
export async function getPersonDetails(personId: string): Promise<any> {
  return fetchFromTMDB(`/person/${personId}`);
}

/**
 * 배우의 출연작 정보 가져오기
 */
export async function getPersonMovieCredits(personId: string): Promise<any> {
  return fetchFromTMDB(`/person/${personId}/movie_credits`);
}

/**
 * TV 프로그램 검색 함수
 */
export async function searchTVShows(
  query: string,
  page: string = "1"
): Promise<any> {
  return fetchFromTMDB("/search/tv", { query, page });
}

/**
 * 인기 TV 프로그램 가져오기
 */
export async function getPopularTVShows(page: string = "1"): Promise<any> {
  return fetchFromTMDB("/tv/popular", { page });
}

/**
 * TV 프로그램 상세 정보 가져오기
 */
export async function getTVShowDetails(tvId: string): Promise<any> {
  return fetchFromTMDB(`/tv/${tvId}`);
}
