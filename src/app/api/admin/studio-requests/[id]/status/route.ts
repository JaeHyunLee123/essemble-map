// 합주실 정보 수정 요청의 승인 및 반려 처리를 담당하는 어드민 API 핸들러
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios, studioUpdateRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { parseNaverMapUrl, InvalidNaverMapUrlError } from "@/lib/naverMap";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * 어드민 수정 요청 상태 변경 (PATCH /api/admin/studio-requests/:id/status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 어드민 인증 검증
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "로그인이 필요합니다."),
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        errorResponse("FORBIDDEN", "관리자 권한이 필요합니다."),
        { status: 403 }
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

    const { status, denyReason, name, description, mapUrl } = body;

    if (!status || (status !== "approved" && status !== "rejected")) {
      return NextResponse.json(
        errorResponse("INVALID_INPUT", "올바른 status 값('approved' 또는 'rejected')을 입력해야 합니다."),
        { status: 400 }
      );
    }

    if (status === "rejected" && (!denyReason || !denyReason.trim())) {
      return NextResponse.json(
        errorResponse("INVALID_INPUT", "반려 시에는 반려 사유(denyReason)를 반드시 입력해야 합니다."),
        { status: 400 }
      );
    }

    // 3. 수정 요청 및 원본 합주실 조회
    const { id: requestId } = await params;
    const mockJoinResult = await db
      .select({
        studio_update_requests: studioUpdateRequests,
        studios: studios,
      })
      .from(studioUpdateRequests)
      .innerJoin(studios, eq(studioUpdateRequests.studioId, studios.id))
      .where(eq(studioUpdateRequests.id, requestId));

    if (!mockJoinResult || mockJoinResult.length === 0) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", "해당 수정 요청을 찾을 수 없습니다."),
        { status: 404 }
      );
    }

    const { studio_update_requests: updateReq, studios: originalStudio } = mockJoinResult[0];

    // 4. 반려(rejected) 처리
    if (status === "rejected") {
      const [updatedReq] = await db
        .update(studioUpdateRequests)
        .set({
          status: "rejected",
          denyReason: denyReason.trim(),
          updatedAt: new Date(),
        })
        .where(eq(studioUpdateRequests.id, requestId))
        .returning();

      return NextResponse.json(successResponse(updatedReq));
    }

    // 5. 승인(approved) 처리
    // 최종 조율 필드 값 결정 (어드민 입력값 우선, 없으면 유저 제안값)
    const finalName = name !== undefined ? name : updateReq.name;
    const finalDescription = description !== undefined ? description : updateReq.description;
    const finalMapUrl = mapUrl !== undefined ? mapUrl : updateReq.mapUrl;

    if (!finalName || !finalName.trim() || !finalMapUrl || !finalMapUrl.trim()) {
      return NextResponse.json(
        errorResponse("INVALID_INPUT", "합주실 이름과 네이버 지도 링크는 필수입니다."),
        { status: 400 }
      );
    }

    let finalLat = originalStudio.lat;
    let finalLng = originalStudio.lng;

    // 지도 링크가 변경되었는지 확인
    if (finalMapUrl.trim() !== originalStudio.mapUrl) {
      try {
        const parseResult = await parseNaverMapUrl(finalMapUrl.trim());
        finalLat = parseResult.lat;
        finalLng = parseResult.lng;
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
    }

    // 원본 합주실과 수정 요청 상태 동시 업데이트 (트랜잭션)
    const result = await db.transaction(async (tx) => {
      // 1. 원본 합주실 정보 업데이트
      await tx
        .update(studios)
        .set({
          name: finalName.trim(),
          description: finalDescription ? finalDescription.trim() : null,
          mapUrl: finalMapUrl.trim(),
          lat: finalLat,
          lng: finalLng,
          updatedAt: new Date(),
        })
        .where(eq(studios.id, originalStudio.id));

      // 2. 수정 요청 레코드 상태를 approved로 업데이트
      const [updatedRequest] = await tx
        .update(studioUpdateRequests)
        .set({
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(studioUpdateRequests.id, requestId))
        .returning();

      return updatedRequest;
    });

    return NextResponse.json(successResponse(result));
  } catch (error) {
    console.error("Change status of studio update request error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
