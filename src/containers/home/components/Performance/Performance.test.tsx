import { render, screen } from '@testing-library/react';
import type { PerformanceSummary } from '@/types/performance';
import Performance from './Performance';

// Pretend the section is on screen, so it fetches immediately
vi.mock('@hooks/useInView', () => ({
  useInView: () => ({ ref: { current: null }, inView: true }),
}));

const summary: PerformanceSummary = {
  generatedAt: '2026-10-28T00:00:00.000Z',
  days: 30,
  sessions: 120,
  renders: 4800,
  slowRate: 0.042,
  p75: 6.5,
  p95: 21.3,
  longTasksPerSession: 0.4,
  areas: [
    { id: 'experience', renders: 900, p75: 9.1, p95: 30.2 },
    { id: 'hero', renders: 600, p75: 3.2, p95: 8.4 },
  ],
  byDay: [
    { day: '2026-10-27', sessions: 60, p75: 6.9 },
    { day: '2026-10-28', sessions: 60, p75: 6.1 },
  ],
  devices: [{ device: '4 GB · 8 cores', sessions: 40, p75: 9.4 }],
};

const mockFetch = (response: Response | Promise<never>) =>
  vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() =>
      response instanceof Response ? Promise.resolve(response) : response
    );

afterEach(() => vi.restoreAllMocks());

describe('Performance section', () => {
  it('shows the live summary', async () => {
    mockFetch(Response.json(summary));
    render(<Performance />);

    expect(await screen.findByText('120')).toBeInTheDocument();
    expect(screen.getByText('6.5 ms')).toBeInTheDocument();
    expect(screen.getByText('4.2%')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('4 GB · 8 cores')).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/performance',
      expect.anything()
    );
  });

  it('says it is still collecting when there are no visits yet', async () => {
    mockFetch(Response.json({ ...summary, sessions: 0 }));
    render(<Performance />);

    expect(
      await screen.findByText(/Collecting the first measurements/)
    ).toBeInTheDocument();
  });

  it('degrades gracefully when the API is unavailable', async () => {
    mockFetch(new Response(null, { status: 503 }));
    render(<Performance />);

    expect(
      await screen.findByText("Live data isn't available right now.")
    ).toBeInTheDocument();
  });
});
