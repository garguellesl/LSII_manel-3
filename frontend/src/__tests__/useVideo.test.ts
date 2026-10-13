import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useVideo } from '../useVideo';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const videoFor = (id: number) => ({
  id,
  title: `Video ${id}`,
  user: '',
  description: '',
  duration: 0,
  thumbnailUrl: `/media/${id}.webp`,
  videoUrl: `/media/${id}.mp4`,
});

describe('useVideo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores a stale response when the id changes before it resolves', async () => {
    let rejectFirst: (reason: unknown) => void = () => {};
    mockedAxios.get
      .mockReturnValueOnce(
        new Promise((_resolve, reject) => {
          rejectFirst = reject;
        })
      )
      .mockResolvedValueOnce({ status: 200, data: videoFor(2) });

    const { result, rerender } = renderHook(({ id }) => useVideo(id), { initialProps: { id: '1' } });
    rerender({ id: '2' });

    await waitFor(() => expect(result.current.loading).toBe('success'));
    rejectFirst(new Error('Network Error'));
    await Promise.resolve();

    expect(result.current.loading).toBe('success');
    expect(result.current.value).toEqual(videoFor(2));
  });
});
