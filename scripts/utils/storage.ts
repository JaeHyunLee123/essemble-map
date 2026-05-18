// 이미지 다운로드 및 업로드 유틸리티
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// process.env에서 환경변수 로드. 테스트 환경에서도 사용 가능하도록.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fake.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'fake-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function downloadImageAsBuffer(url: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const headerContentType = response.headers['content-type'];
  let contentType = 'image/jpeg';
  if (typeof headerContentType === 'string') {
    contentType = headerContentType;
  } else if (Array.isArray(headerContentType) && headerContentType.length > 0) {
    contentType = headerContentType[0];
  }
  return {
    buffer: response.data,
    contentType,
  };
}

export async function uploadImageToSupabase(buffer: ArrayBuffer, contentType: string, fileName: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('studio-images')
    .upload(fileName, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('studio-images')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
