#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as tmdbApi from "./tmdb-api.js";

// 서버 인스턴스 생성
const server = new McpServer(
  {
    name: "tmdb-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {
        listChanged: true,
      },
    },
  }
);

// 영화 검색 도구
server.tool(
  "search_movies",
  "영화를 검색합니다",
  {
    query: z.string().describe("검색할 영화 제목"),
    page: z.string().optional().describe("페이지 번호 (기본값: 1)"),
  },
  async ({ query, page = "1" }) => {
    try {
      const result = await tmdbApi.searchMovies(query, page);

      // 결과 포맷팅
      let formattedResults = `영화 검색 결과: "${query}"\n\n총 ${result.total_results}개의 결과 중 ${result.results.length}개 표시 (페이지 ${result.page}/${result.total_pages})\n\n`;

      result.results.forEach((movie: any) => {
        formattedResults += `제목: ${movie.title}\n`;
        formattedResults += `ID: ${movie.id}\n`;
        formattedResults += `개봉일: ${movie.release_date || "정보 없음"}\n`;
        formattedResults += `평점: ${movie.vote_average}/10 (${movie.vote_count}명 투표)\n`;
        formattedResults += `줄거리: ${
          movie.overview || "줄거리 정보 없음"
        }\n\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: formattedResults,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `영화 검색 중 오류가 발생했습니다: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 인기 영화 가져오기 도구
server.tool(
  "get_popular_movies",
  "현재 인기 있는 영화 목록을 가져옵니다",
  {
    page: z.string().optional().describe("페이지 번호 (기본값: 1)"),
  },
  async ({ page = "1" }) => {
    try {
      const result = await tmdbApi.getPopularMovies(page);

      // 결과 포맷팅
      let formattedResults = `인기 영화 목록\n\n총 ${result.total_results}개의 결과 중 ${result.results.length}개 표시 (페이지 ${result.page}/${result.total_pages})\n\n`;

      result.results.forEach((movie: any) => {
        formattedResults += `제목: ${movie.title}\n`;
        formattedResults += `ID: ${movie.id}\n`;
        formattedResults += `개봉일: ${movie.release_date || "정보 없음"}\n`;
        formattedResults += `평점: ${movie.vote_average}/10 (${movie.vote_count}명 투표)\n`;
        formattedResults += `줄거리: ${
          movie.overview || "줄거리 정보 없음"
        }\n\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: formattedResults,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `인기 영화 목록을 가져오는 중 오류가 발생했습니다: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 영화 상세 정보 가져오기 도구
server.tool(
  "get_movie_details",
  "영화의 상세 정보를 가져옵니다",
  {
    movie_id: z.string().describe("영화 ID"),
  },
  async ({ movie_id }) => {
    try {
      const movie = await tmdbApi.getMovieDetails(movie_id);
      const credits = await tmdbApi.getMovieCredits(movie_id);

      // 감독 정보 찾기
      const directors = credits.crew
        .filter((person: any) => person.job === "Director")
        .map((director: any) => director.name)
        .join(", ");

      // 주요 출연진 정보 (상위 5명)
      const mainCast = credits.cast
        .slice(0, 5)
        .map(
          (actor: any) =>
            `${actor.name} (${actor.character || "역할 정보 없음"})`
        )
        .join(", ");

      // 장르 정보
      const genres = movie.genres.map((genre: any) => genre.name).join(", ");

      // 제작사 정보
      const companies = movie.production_companies
        .map((company: any) => company.name)
        .join(", ");

      // 결과 포맷팅
      let formattedResult = `영화 상세 정보: ${movie.title}\n\n`;
      formattedResult += `원제: ${movie.original_title}\n`;
      formattedResult += `ID: ${movie.id}\n`;
      formattedResult += `태그라인: ${movie.tagline || "정보 없음"}\n`;
      formattedResult += `개봉일: ${movie.release_date || "정보 없음"}\n`;
      formattedResult += `러닝타임: ${movie.runtime || "정보 없음"}분\n`;
      formattedResult += `평점: ${movie.vote_average}/10 (${movie.vote_count}명 투표)\n`;
      formattedResult += `장르: ${genres || "정보 없음"}\n`;
      formattedResult += `감독: ${directors || "정보 없음"}\n`;
      formattedResult += `주요 출연진: ${mainCast || "정보 없음"}\n`;
      formattedResult += `제작사: ${companies || "정보 없음"}\n`;
      formattedResult += `예산: $${
        movie.budget ? movie.budget.toLocaleString() : "정보 없음"
      }\n`;
      formattedResult += `수익: $${
        movie.revenue ? movie.revenue.toLocaleString() : "정보 없음"
      }\n`;
      formattedResult += `웹사이트: ${movie.homepage || "정보 없음"}\n\n`;
      formattedResult += `줄거리:\n${movie.overview || "줄거리 정보 없음"}\n`;

      return {
        content: [
          {
            type: "text",
            text: formattedResult,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `영화 상세 정보를 가져오는 중 오류가 발생했습니다: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 배우 검색 도구
server.tool(
  "search_people",
  "배우 및 영화 관계자를 검색합니다",
  {
    query: z.string().describe("검색할 배우/관계자 이름"),
    page: z.string().optional().describe("페이지 번호 (기본값: 1)"),
  },
  async ({ query, page = "1" }) => {
    try {
      const result = await tmdbApi.searchPeople(query, page);

      // 결과 포맷팅
      let formattedResults = `인물 검색 결과: "${query}"\n\n총 ${result.total_results}개의 결과 중 ${result.results.length}개 표시 (페이지 ${result.page}/${result.total_pages})\n\n`;

      result.results.forEach((person: any) => {
        formattedResults += `이름: ${person.name}\n`;
        formattedResults += `ID: ${person.id}\n`;

        // 유명 작품
        const knownFor = person.known_for
          ?.map((work: any) => work.title || work.name || "작품명 정보 없음")
          .join(", ");

        formattedResults += `유명 작품: ${knownFor || "정보 없음"}\n`;
        formattedResults += `직업: ${
          person.known_for_department || "정보 없음"
        }\n`;
        formattedResults += `인기도: ${person.popularity}\n\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: formattedResults,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `인물 검색 중 오류가 발생했습니다: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 배우 상세 정보 가져오기 도구
server.tool(
  "get_person_details",
  "배우 또는 영화 관계자의 상세 정보를 가져옵니다",
  {
    person_id: z.string().describe("인물 ID"),
  },
  async ({ person_id }) => {
    try {
      const person = await tmdbApi.getPersonDetails(person_id);
      const credits = await tmdbApi.getPersonMovieCredits(person_id);

      // 주요 출연작 정보 (상위 5개)
      const topMovies = credits.cast
        .sort((a: any, b: any) => b.popularity - a.popularity)
        .slice(0, 5)
        .map(
          (movie: any) =>
            `${movie.title || "제목 정보 없음"} (${
              movie.release_date?.split("-")[0] || "연도 정보 없음"
            })`
        )
        .join(", ");

      // 결과 포맷팅
      let formattedResult = `인물 상세 정보: ${person.name}\n\n`;
      formattedResult += `ID: ${person.id}\n`;
      formattedResult += `생년월일: ${person.birthday || "정보 없음"}\n`;

      if (person.deathday) {
        formattedResult += `사망일: ${person.deathday}\n`;
      }

      formattedResult += `출생지: ${person.place_of_birth || "정보 없음"}\n`;
      formattedResult += `직업: ${
        person.known_for_department || "정보 없음"
      }\n`;
      formattedResult += `인기도: ${person.popularity}\n`;
      formattedResult += `주요 출연작: ${topMovies || "정보 없음"}\n\n`;
      formattedResult += `약력:\n${person.biography || "약력 정보 없음"}\n`;

      return {
        content: [
          {
            type: "text",
            text: formattedResult,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `인물 상세 정보를 가져오는 중 오류가 발생했습니다: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// TV 프로그램 검색 도구
server.tool(
  "search_tv_shows",
  "TV 프로그램을 검색합니다",
  {
    query: z.string().describe("검색할 TV 프로그램 제목"),
    page: z.string().optional().describe("페이지 번호 (기본값: 1)"),
  },
  async ({ query, page = "1" }) => {
    try {
      const result = await tmdbApi.searchTVShows(query, page);

      // 결과 포맷팅
      let formattedResults = `TV 프로그램 검색 결과: "${query}"\n\n총 ${result.total_results}개의 결과 중 ${result.results.length}개 표시 (페이지 ${result.page}/${result.total_pages})\n\n`;

      result.results.forEach((show: any) => {
        formattedResults += `제목: ${show.name}\n`;
        formattedResults += `ID: ${show.id}\n`;
        formattedResults += `첫 방영일: ${
          show.first_air_date || "정보 없음"
        }\n`;
        formattedResults += `평점: ${show.vote_average}/10 (${show.vote_count}명 투표)\n`;
        formattedResults += `줄거리: ${
          show.overview || "줄거리 정보 없음"
        }\n\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: formattedResults,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `TV 프로그램 검색 중 오류가 발생했습니다: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 인기 TV 프로그램 가져오기 도구
server.tool(
  "get_popular_tv_shows",
  "현재 인기 있는 TV 프로그램 목록을 가져옵니다",
  {
    page: z.string().optional().describe("페이지 번호 (기본값: 1)"),
  },
  async ({ page = "1" }) => {
    try {
      const result = await tmdbApi.getPopularTVShows(page);

      // 결과 포맷팅
      let formattedResults = `인기 TV 프로그램 목록\n\n총 ${result.total_results}개의 결과 중 ${result.results.length}개 표시 (페이지 ${result.page}/${result.total_pages})\n\n`;

      result.results.forEach((show: any) => {
        formattedResults += `제목: ${show.name}\n`;
        formattedResults += `ID: ${show.id}\n`;
        formattedResults += `첫 방영일: ${
          show.first_air_date || "정보 없음"
        }\n`;
        formattedResults += `평점: ${show.vote_average}/10 (${show.vote_count}명 투표)\n`;
        formattedResults += `줄거리: ${
          show.overview || "줄거리 정보 없음"
        }\n\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: formattedResults,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `인기 TV 프로그램 목록을 가져오는 중 오류가 발생했습니다: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// TV 프로그램 상세 정보 가져오기 도구
server.tool(
  "get_tv_show_details",
  "TV 프로그램의 상세 정보를 가져옵니다",
  {
    tv_id: z.string().describe("TV 프로그램 ID"),
  },
  async ({ tv_id }) => {
    try {
      const show = await tmdbApi.getTVShowDetails(tv_id);

      // 장르 정보
      const genres = show.genres.map((genre: any) => genre.name).join(", ");

      // 제작사 정보
      const companies = show.production_companies
        .map((company: any) => company.name)
        .join(", ");

      // 시즌 정보
      const seasons = show.seasons
        .map(
          (season: any) =>
            `시즌 ${season.season_number}: ${season.episode_count}화 (${
              season.air_date?.split("-")[0] || "방영일 정보 없음"
            })`
        )
        .join("\n  ");

      // 결과 포맷팅
      let formattedResult = `TV 프로그램 상세 정보: ${show.name}\n\n`;
      formattedResult += `원제: ${show.original_name}\n`;
      formattedResult += `ID: ${show.id}\n`;
      formattedResult += `첫 방영일: ${show.first_air_date || "정보 없음"}\n`;
      formattedResult += `최종 방영일: ${show.last_air_date || "정보 없음"}\n`;
      formattedResult += `상태: ${show.status || "정보 없음"}\n`;
      formattedResult += `시즌 수: ${show.number_of_seasons || "정보 없음"}\n`;
      formattedResult += `에피소드 수: ${
        show.number_of_episodes || "정보 없음"
      }\n`;
      formattedResult += `에피소드 방영 시간: ${
        show.episode_run_time?.join(", ") || "정보 없음"
      }분\n`;
      formattedResult += `평점: ${show.vote_average}/10 (${show.vote_count}명 투표)\n`;
      formattedResult += `장르: ${genres || "정보 없음"}\n`;
      formattedResult += `제작사: ${companies || "정보 없음"}\n`;
      formattedResult += `웹사이트: ${show.homepage || "정보 없음"}\n\n`;
      formattedResult += `시즌 정보:\n  ${seasons || "정보 없음"}\n\n`;
      formattedResult += `줄거리:\n${show.overview || "줄거리 정보 없음"}\n`;

      return {
        content: [
          {
            type: "text",
            text: formattedResult,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `TV 프로그램 상세 정보를 가져오는 중 오류가 발생했습니다: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 서버 시작
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error("서버 시작 실패:", error);
  process.exit(1);
});

console.error("TMDB MCP 서버 실행 중...");
