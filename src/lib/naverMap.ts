// 네이버 지도 URL에서 위경도 정보를 추출하는 라이브러리
import { successResponse } from "./api-response";

/**
 * 네이버 지도 URL 파싱 오류 시 발생하는 커스텀 에러 클래스
 */
export class InvalidNaverMapUrlError extends Error {
  constructor(message: string = "유효한 네이버 지도 링크가 아닙니다.") {
    super(message);
    this.name = "InvalidNaverMapUrlError";
  }
}

interface ParseResult {
  lat: number;
  lng: number;
  placeId: string;
  name: string;
}

/**
 * 네이버 지도 단축 URL 및 풀 URL을 파싱하여 WGS84 위도/경도를 반환합니다.
 * @param url 네이버 지도 URL (naver.me 또는 map.naver.com)
 */
export async function parseNaverMapUrl(url: string): Promise<ParseResult> {
  let targetUrl = url.trim();

  // 1. URL 기본 검증
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    throw new InvalidNaverMapUrlError("유효하지 않은 URL 형식입니다.");
  }

  try {
    const parsedUrl = new URL(targetUrl);
    
    // 2. naver.me 단축 URL인 경우 리다이렉션 추적
    if (parsedUrl.hostname === "naver.me" || parsedUrl.hostname.endsWith(".naver.me")) {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      targetUrl = response.url;
    }
  } catch (error) {
    if (error instanceof InvalidNaverMapUrlError) {
      throw error;
    }
    throw new InvalidNaverMapUrlError("네이버 지도 링크를 확인하는 중 오류가 발생했습니다.");
  }

  // 3. 플레이스 고유 ID 파싱
  // 예: https://map.naver.com/p/entry/place/11554946?c=15,0,0,0,dh
  // 예: https://map.naver.com/v5/entry/place/11554946
  const placeIdRegex = /place\/(\d+)/;
  const match = targetUrl.match(placeIdRegex);
  
  if (!match || !match[1]) {
    throw new InvalidNaverMapUrlError("네이버 플레이스 ID를 찾을 수 없습니다.");
  }

  const placeId = match[1];

  // 4. 네이버 플레이스 요약 API 호출 (최신 /p/api/place/summary 엔드포인트 적용)
  const summaryApiUrl = `https://map.naver.com/p/api/place/summary/${placeId}`;
  
  try {
    const summaryResponse = await fetch(summaryApiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://map.naver.com/",
      },
    });

    if (!summaryResponse.ok) {
      throw new InvalidNaverMapUrlError("네이버 플레이스 정보를 불러오지 못했습니다.");
    }

    const data = await summaryResponse.json();
    const placeDetail = data?.data?.placeDetail;
    
    if (!placeDetail || !placeDetail.coordinate) {
      throw new InvalidNaverMapUrlError("네이버 플레이스 정보에 좌표가 유효하지 않습니다.");
    }

    const lng = parseFloat(placeDetail.coordinate.longitude);
    const lat = parseFloat(placeDetail.coordinate.latitude);

    if (isNaN(lng) || isNaN(lat)) {
      throw new InvalidNaverMapUrlError("올바르지 않은 좌표 형식입니다.");
    }

    return {
      lat,
      lng,
      placeId,
      name: placeDetail.name || "알 수 없는 합주실",
    };
  } catch (error) {
    if (error instanceof InvalidNaverMapUrlError) {
      throw error;
    }
    throw new InvalidNaverMapUrlError("네이버 플레이스 정보를 파싱하는 중 오류가 발생했습니다.");
  }
}
