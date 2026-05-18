// 스토리지 유틸리티 유닛 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { downloadImageAsBuffer, uploadImageToSupabase } from '../storage';

// Supabase 클라이언트를 모킹하기 위한 설정
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      storage: {
        from: () => ({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        }),
      },
    }),
  };
});

vi.mock('axios');

describe('Storage Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('downloadImageAsBuffer', () => {
    it('should download an image and return an ArrayBuffer', async () => {
      const fakeBuffer = new ArrayBuffer(8);
      vi.mocked(axios.get).mockResolvedValue({
        data: fakeBuffer,
        headers: { 'content-type': 'image/jpeg' }
      });

      const url = 'http://example.com/image.jpg';
      const result = await downloadImageAsBuffer(url);

      expect(axios.get).toHaveBeenCalledWith(url, { responseType: 'arraybuffer' });
      expect(result.buffer).toBe(fakeBuffer);
      expect(result.contentType).toBe('image/jpeg');
    });

    it('should fallback to image/jpeg if content-type header is missing', async () => {
      const fakeBuffer = new ArrayBuffer(8);
      vi.mocked(axios.get).mockResolvedValue({
        data: fakeBuffer,
        headers: {} // No content-type
      });

      const url = 'http://example.com/image.png';
      const result = await downloadImageAsBuffer(url);

      expect(result.contentType).toBe('image/jpeg');
    });

    it('should throw an error on download failure', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));
      await expect(downloadImageAsBuffer('http://example.com/bad')).rejects.toThrow('Network error');
    });
  });

  describe('uploadImageToSupabase', () => {
    it('should upload arraybuffer and return public URL', async () => {
      const fakeBuffer = new ArrayBuffer(8);
      mockUpload.mockResolvedValue({ data: { path: 'path/to/file.jpg' }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://fake-supabase.com/file.jpg' } });

      const url = await uploadImageToSupabase(fakeBuffer, 'image/jpeg', 'test-image.jpg');

      expect(mockUpload).toHaveBeenCalledWith('test-image.jpg', fakeBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });
      expect(mockGetPublicUrl).toHaveBeenCalledWith('test-image.jpg');
      expect(url).toBe('https://fake-supabase.com/file.jpg');
    });

    it('should throw error if upload fails', async () => {
      const fakeBuffer = new ArrayBuffer(8);
      mockUpload.mockResolvedValue({ data: null, error: new Error('Upload error') });

      await expect(uploadImageToSupabase(fakeBuffer, 'image/jpeg', 'test-image.jpg'))
        .rejects.toThrow('Upload error');
    });
  });
});
