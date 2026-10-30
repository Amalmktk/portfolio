import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  longFramesPerView: 0.25,
  minSamples: 30,
  areas: [
    {
      id: 'experience',
      samples: 90,
      renders: 900,
      mounts: 120,
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
      mounts: 120,
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
  blocks: [
    { area: null, count: 20, totalMs: 1500, maxMs: 140 },
    { area: 'experience', count: 10, totalMs: 500, maxMs: 90 },
  ],
  worst: [
    {
      area: 'experience',
      ms: 48.2,
      phase: 'update',
      deviceClass: 'low',
      day: '2026-10-28',
    },
  ],
  release: {
    current: { version: 'abc1234', since: '2026-10-27', samples: 60, p75: 6.1 },
    previous: {
      version: 'def5678',
      since: '2026-10-20',
      samples: 90,
      p75: 8.2,
    },
    areas: [{ id: 'experience', current: 9.1, previous: 12.4 }],
  },
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
    expect(screen.getByText(/1 more still collecting/)).toBeInTheDocument();
    // Main-thread blocks by section, including outside React renders
    expect(screen.getByText('Outside React renders')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/render-pulse-stats',
      expect.anything()
    );
  });

  it('shows the rest of the metrics on request', async () => {
    mockFetch(Response.json(stats));
    render(<Performance />);

    const toggle = await screen.findByRole('button', {
      name: 'Show all metrics',
    });
    expect(screen.queryByText('Slowest renders')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Slowest renders')).toBeInTheDocument();
    expect(screen.getByText('48.2 ms')).toBeInTheDocument();
    // 120 first renders and 780 updates over 120 page views
    expect(screen.getByText(/1\.0 \+ 6\.5/)).toBeInTheDocument();
    expect(screen.getByText('abc1234')).toHaveAttribute(
      'href',
      'https://github.com/Amalmktk/portfolio/commit/abc1234'
    );
    expect(screen.getByText('(2.1 ms faster)')).toBeInTheDocument();
    expect(screen.getAllByText('Low-end devices').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Show fewer metrics' }));
    expect(screen.queryByText('Slowest renders')).not.toBeInTheDocument();
  });

  it('says so when no frame blocked the main thread', async () => {
    mockFetch(Response.json({ ...stats, blocks: [] }));
    render(<Performance />);
    expect(
      await screen.findByText('No frames over 50 ms in the last 30 days.')
    ).toBeInTheDocument();
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
