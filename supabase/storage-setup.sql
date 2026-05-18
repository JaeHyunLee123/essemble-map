-- Supabase Storage 버킷 초기 설정 SQL
-- 실행 방법: Supabase 콘솔 > SQL Editor에서 이 파일 내용을 붙여넣고 실행

-- ============================================================
-- 버킷 생성
-- ============================================================

-- 합주실/방 이미지 업로드용 버킷 (공개 읽기 허용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-images', 'studio-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS(Row Level Security) 정책 설정
-- ============================================================

-- [공개 읽기] 누구나 studio-images 버킷의 파일을 읽을 수 있음
CREATE POLICY "studio-images 공개 읽기"
ON storage.objects FOR SELECT
USING (bucket_id = 'studio-images');

-- [인증된 유저 업로드] 로그인한 유저만 파일을 업로드할 수 있음
CREATE POLICY "studio-images 인증 유저 업로드"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'studio-images');

-- [본인 파일 삭제] 자신이 업로드한 파일만 삭제 가능
CREATE POLICY "studio-images 본인 파일 삭제"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'studio-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
