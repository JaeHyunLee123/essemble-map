// 합주실 정보 수정 요청 제출을 처리하는 API 핸들러
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios, studioUpdateRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { parseNaverMapUrl, InvalidNaverMapUrlError } from "@/lib/naverMap";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * 합주실 정보 수정 요청 등록 (POST /api/studios/:id/update-request)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 사용자 인증 확인
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "로그인이 필요합니다."),
        { status: 401 }
      );
    }

    // 2. 바디 데이터 추출 및 유효성 검사
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        errorResponse("BAD_REQUEST", "유효하지 않은 요청 데이터 형식입니다."),
        { status: 400 }
      );
    }

    const { name, mapUrl, description } = body;

    if (!name || !name.trim() || !mapUrl || !mapUrl.trim()) {
      return NextResponse.json(
        errorResponse("INVALID_INPUT", "합주실 이름과 네이버 지도 링크는 필수 입력 항목입니다."),
        { status: 400 }
      );
    }

    // 3. 대상 합주실 존재 여부 확인
    const { id: studioId } = await params;
    const [existingStudio] = await db
      .select()
      .from(studios)
      .where(eq(studios.id, studioId));

    if (!existingStudio) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", "해당 합주실을 찾을 수 없습니다."),
        { status: 404 }
      );
    }

    // 4. 네이버 지도 URL로부터 위경도 자동 추출
    let lat: number;
    let lng: number;

    try {
      const parseResult = await parseNaverMapUrl(mapUrl);
      lat = parseResult.lat;
      lng = parseResult.lng;
    } catch (error) {
      if (error instanceof InvalidNaverMapUrlError) {
        return NextResponse.json(
          errorResponse("INVALID_MAP_URL", error.message),
          { status: 400 }
        );
      }
      return NextResponse.json(
        errorResponse("INVALID_MAP_URL", "네이버 지도 링크를 파싱하는 도중 에러가 발생했습니다."),
        { status: 400 }
      );
    }

    // 5. DB에 수정 요청 정보 등록 (status는 pending 고정)
    const [newRequest] = await db
      .insert(studioUpdateRequests)
      .values({
        studioId,
        name: name.trim(),
        mapUrl: mapUrl.trim(),
        description: description ? description.trim() : null,
        lat,
        lng,
        status: "pending",
        createdBy: user.userId,
      })
      .returning();

    return NextResponse.json(
      successResponse({
        id: newRequest?.id,
        studioId: newRequest?.studioId,
        name: newRequest?.name,
        status: newRequest?.status,
        message: "합주실 정보 수정 요청이 정상적으로 접수되었습니다. 관리자 검토 후 반영됩니다.",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Update request studio error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
