import { act, renderHook, waitFor } from '@testing-library/react';
import { useRecommendations } from '../useRecommendations';

describe('useRecommendations', () => {
  afterEach(() => jest.restoreAllMocks());

  it('ignores late results after navigation and keeps the audience for the new request', async () => {
    let finishFirst!: (response: Response) => void;
    const first = new Promise<Response>((resolve) => {
      finishFirst = resolve;
    });
    const response = (id: number) => ({ ok: true, json: async () => [{ id }] }) as Response;
    const request = jest.spyOn(global, 'fetch').mockReturnValueOnce(first).mockResolvedValueOnce(response(99));
    const { result, rerender } = renderHook(({ id }) => useRecommendations(id, 'CHILDREN'), {
      initialProps: { id: 1 },
    });
    rerender({ id: 2 });
    expect(request.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(request.mock.calls[1][0]).toEqual(expect.stringContaining('/videos/2/recommendations?audience=CHILDREN'));
    await waitFor(() => expect(result.current).toMatchObject({ status: 'success', data: [{ id: 99 }] }));
    await act(async () => finishFirst(response(12)));
    expect(result.current).toMatchObject({ status: 'success', data: [{ id: 99 }] });
  });
});
