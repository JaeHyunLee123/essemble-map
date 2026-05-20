// 네이버 지도 URL 위경도 파싱 라이브러리를 테스트하는 단위 테스트 파일.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseNaverMapUrl, InvalidNaverMapUrlError } from "@/lib/naverMap";

describe("naverMap 라이브러리 단위 테스트", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("올바른 네이버 플레이스 상세 URL에서 위경도를 추출할 수 있어야 합니다.", async () => {
    // 실제 외부 API 호출을 모킹합니다.
    const mockResponse = {
      ok: true,
      json: async () => ({
        data: {
          placeDetail: {
            id: "11554946",
            name: "낙원합주실",
            coordinate: {
              longitude: "127.123456",
              latitude: "37.123456",
            },
          },
        },
      }),
      url: "https://map.naver.com/p/entry/place/11554946",
    };
    
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(mockResponse as any);

    const result = await parseNaverMapUrl("https://map.naver.com/p/entry/place/11554946");
    
    expect(result).toEqual({
      lat: 37.123456,
      lng: 127.123456,
      placeId: "11554946",
      name: "낙원합주실",
    });
    
    expect(fetchMock).toHaveBeenCalled();
  });

  it("단축 URL(naver.me)을 입력받았을 때 리다이렉션을 추적하여 최종 플레이스 정보를 추출해야 합니다.", async () => {
    // 첫 번째 호출(단축 URL 조회)은 최종 URL로 리다이렉트됩니다.
    // 두 번째 호출(API 호출)은 사이트 요약 정보를 반환합니다.
    const mockRedirectResponse = {
      ok: true,
      url: "https://map.naver.com/p/entry/place/11554946?c=15,0,0,0,dh",
    };

    const mockSummaryResponse = {
      ok: true,
      json: async () => ({
        data: {
          placeDetail: {
            id: "11554946",
            name: "낙원합주실",
            coordinate: {
              longitude: "127.123456",
              latitude: "37.123456",
            },
          },
        },
      }),
    };

    const fetchMock = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(mockRedirectResponse as any)
      .mockResolvedValueOnce(mockSummaryResponse as any);

    const result = await parseNaverMapUrl("https://naver.me/5TvD0v3J");

    expect(result).toEqual({
      lat: 37.123456,
      lng: 127.123456,
      placeId: "11554946",
      name: "낙원합주실",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("잘못된 형식의 URL을 입력하면 InvalidNaverMapUrlError가 발생해야 합니다.", async () => {
    await expect(parseNaverMapUrl("https://google.com")).rejects.toThrow(
      InvalidNaverMapUrlError
    );
  });

  it("네이버 플레이스 ID 파싱이 실패하면 InvalidNaverMapUrlError가 발생해야 합니다.", async () => {
    const mockResponse = {
      ok: true,
      url: "https://map.naver.com/p/entry/no-place-here",
    };
    vi.spyOn(global, "fetch").mockResolvedValue(mockResponse as any);

    await expect(parseNaverMapUrl("https://naver.me/invalid-link")).rejects.toThrow(
      InvalidNaverMapUrlError
    );
  });
});
