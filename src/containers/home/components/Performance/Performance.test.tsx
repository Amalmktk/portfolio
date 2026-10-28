import { render, screen, waitFor } from '@testing-library/react';
import type { PerformanceStats } from '@/types/performance';
import Performance from './Performance';

const stats: PerformanceStats = {
  updatedAt: '2026-10-28T00:00:00.000Z',
  range: { from: '2026-10-27', to: '2026-10-28' },
  pageViews: 120,
  renders: 4800,
  slowShare: 0.042,
  p50: 3.1,
  p75: 6.5,
  p95: 21.3,
  longTasksPerView: 0.4,
  minSamples: 30,
  areas: [
    {
      id: 'experience',
      samples: 90,
      renders: 900,
      slowShare: 0.1,
      p50: 5,
      p75: 9.1,
      p95: 30.2,
      byDevice: {},
    },
    {
      id: 'hero',
      samples: 120,
      renders: 600,
      slowShare: 0,
      p50: 2,
      p75: 3.2,
      p95: 8.4,
      byDevice: {},
    },
  ],
  hiddenAreas: 1,
  devices: [{ deviceClass: 'low', pageViews: 40, p75: 9.4 }],
  trend: [
    { day: '2026-10-27', pageViews: 60, p75: 6.9 },
    { day: '2026-10-28', pageViews: 60, p75: 6.1 },
  ],
};

const mockFetch = (response: Response) =>
  vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() => Promise.resolve(response));

afterEach(() => vi.restoreAllMocks());

describe('Performance section', () => {
  it('shows the live stats', async () => {
    mockFetch(Response.json(stats));
    render(<Performance />);

    expect(await screen.findByText('120')).toBeInTheDocument();
    expect(screen.getByText('6.5 ms')).toBeInTheDocument();
    expect(screen.getByText('4.2%')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Low-end devices')).toBeInTheDocument();
    expect(screen.getByText(/1 more still collecting/)).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/render-pulse-stats',
      expect.anything()
    );
  });

  it('renders nothing while loading', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise<Response>(() => {})
    );
    const { container } = render(<Performance />);
    expect(container).toBeEmptyDOMElement();
  });

  it('stays hidden until there is data', async () => {
    mockFetch(Response.json({ ...stats, pageViews: 0 }));
    const { container } = render(<Performance />);

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it('stays hidden when the API is unavailable', async () => {
    mockFetch(new Response(null, { status: 503 }));
    const { container } = render(<Performance />);

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
