import axios from 'axios';
import { uploadClient, validateUpload, VIDEO_LIMIT, THUMBNAIL_LIMIT } from '../uploadClient';

jest.mock('axios');
const http = axios as jest.Mocked<typeof axios>;
const metadata = { title: 'Title', description: '', category: 'Music', tags: [] };
const video = new File(['data'], 'video.mp4', { type: 'video/mp4' });

describe('uploadClient', () => {
  beforeEach(() => jest.resetAllMocks());

  it('loads categories and existing tags through the public API', async () => {
    http.get.mockResolvedValueOnce({ data: { categories: ['Music'] } }).mockResolvedValueOnce({ data: ['rock'] });
    expect(await uploadClient.options(new AbortController().signal)).toEqual({ categories: ['Music'], tags: ['rock'] });
  });

  it('sends multipart with cookies, CSRF and progress without setting a multipart boundary', async () => {
    http.get.mockResolvedValue({ data: { headerName: 'X-CSRF-TOKEN', token: 'token' } });
    http.post.mockImplementation(async (_url, data, config) => {
      const body = data as FormData;
      expect(body.get('video')).toBe(video);
      expect(body.get('metadata')).toBeInstanceOf(Blob);
      expect(body.get('thumbnail')).toBeNull();
      expect(config?.headers).toEqual({ 'X-CSRF-TOKEN': 'token' });
      expect(config?.withCredentials).toBe(true);
      config?.onUploadProgress?.({ loaded: 50, total: 100, bytes: 50, lengthComputable: true });
      return { data: { id: 7 } };
    });
    const progress = jest.fn();
    expect(await uploadClient.upload(metadata, video, undefined, progress)).toEqual({ id: 7 });
    expect(progress).toHaveBeenCalledWith(50);
  });

  it('includes an optional thumbnail and maps validation, session and network errors without retrying POST', async () => {
    http.get.mockResolvedValue({ data: { headerName: 'X-CSRF-TOKEN', token: 'token' } });
    const image = new File(['image'], 'x.png', { type: 'image/png' });
    for (const status of [400, 401, 403, 413, 503]) {
      http.post.mockRejectedValueOnce({
        response: { status, data: { error: 'failure', errors: { title: 'invalid' } } },
      });
      await expect(uploadClient.upload(metadata, video, image, jest.fn())).rejects.toMatchObject({
        status,
        fields: { title: 'invalid' },
      });
    }
    expect((http.post.mock.calls[0][1] as FormData).get('thumbnail')).toBe(image);
    expect(http.post).toHaveBeenCalledTimes(5);
    http.post.mockRejectedValueOnce(new Error('offline'));
    await expect(uploadClient.upload(metadata, video, undefined, jest.fn())).rejects.toThrow('Comprueba tu conexión');
  });

  it('validates required fields and inclusive binary limits', () => {
    const sized = (file: File, size: number) => {
      Object.defineProperty(file, 'size', { value: size, configurable: true });
      return file;
    };
    expect(validateUpload(metadata, sized(video, VIDEO_LIMIT))).toBeNull();
    expect(validateUpload(metadata, sized(video, VIDEO_LIMIT + 1))).toMatch('100 MiB');
    sized(video, 4);
    const image = new File(['x'], 'x.png', { type: 'image/png' });
    expect(validateUpload(metadata, video, sized(image, THUMBNAIL_LIMIT))).toBeNull();
    expect(validateUpload(metadata, video, sized(image, THUMBNAIL_LIMIT + 1))).toMatch('5 MiB');
    expect(validateUpload({ ...metadata, title: ' ' }, video)).toMatch('título');
    expect(validateUpload({ ...metadata, category: '' }, video)).toMatch('categoría');
    expect(validateUpload(metadata)).toMatch('vacío');
    expect(validateUpload(metadata, new File(['x'], 'x.avi', { type: 'video/avi' }))).toMatch('MP4');
    expect(validateUpload(metadata, video, new File(['x'], 'x.gif', { type: 'image/gif' }))).toMatch('JPG o PNG');
    expect(validateUpload(metadata, video, new File([], 'x.png', { type: 'image/png' }))).toMatch('vacía');
    expect(validateUpload({ ...metadata, tags: Array(41).fill('tag') }, video)).toMatch('40');
  });
});
