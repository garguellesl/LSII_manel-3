import axios from 'axios';
import { userClient } from '../userClient';

jest.mock('axios');
const http = axios as jest.Mocked<typeof axios>;

describe('userClient', () => {
  beforeEach(() => {
    http.get.mockReset();
  });

  it('loads the owner analytics with session cookies', async () => {
    const analytics = [{ videoId: 1, title: 'Video', viewsCount: 3, likesCount: 2, commentsCount: 1 }];
    const signal = new AbortController().signal;
    http.get.mockResolvedValue({ data: analytics });
    expect(await userClient.analytics(4, signal)).toEqual(analytics);
    expect(http.get).toHaveBeenCalledWith('other/users/4/analytics', { withCredentials: true, signal });
  });

  it('loads the own watch history with session cookies', async () => {
    http.get.mockResolvedValue({ data: [] });
    expect(await userClient.watchHistory(4)).toEqual([]);
    expect(http.get).toHaveBeenCalledWith('other/users/4/watch-history', { withCredentials: true, signal: undefined });
  });

  it('propagates request failures', async () => {
    http.get.mockRejectedValue(new Error('Offline'));
    await expect(userClient.analytics(4)).rejects.toThrow('Offline');
  });
});
