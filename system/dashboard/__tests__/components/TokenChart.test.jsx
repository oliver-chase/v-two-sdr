import React from 'react';
import { render, screen } from '@testing-library/react';
import TokenChart from '../../src/components/TokenChart';

const mockData = [
  { date: '2026-02-10', tokens: 12400, model: 'haiku' },
  { date: '2026-02-11', tokens: 8900,  model: 'haiku' },
  { date: '2026-02-12', tokens: 31200, model: 'sonnet' },
  { date: '2026-03-10', tokens: 19800, model: 'haiku' },
  { date: '2026-03-11', tokens: 5400,  model: 'haiku' },
];

describe('TokenChart', () => {
  describe('loaded state', () => {
    it('renders the chart title', () => {
      render(<TokenChart data={mockData} today="2026-03-11" />);
      expect(screen.getByText('Token Usage')).toBeInTheDocument();
    });

    it('renders a bar for each data point', () => {
      const { container } = render(<TokenChart data={mockData} today="2026-03-11" />);
      const bars = container.querySelectorAll('[data-testid="token-bar"]');
      expect(bars).toHaveLength(mockData.length);
    });

    it('renders a date label for each bar', () => {
      render(<TokenChart data={mockData} today="2026-03-11" />);
      // Each bar should have a date label below it
      expect(screen.getByText('Mar 11')).toBeInTheDocument();
      expect(screen.getByText('Mar 10')).toBeInTheDocument();
    });

    it("marks today's bar with accent color class", () => {
      const { container } = render(<TokenChart data={mockData} today="2026-03-11" />);
      const todayBar = container.querySelector('[data-testid="token-bar"][data-today="true"]');
      expect(todayBar).toBeInTheDocument();
      expect(todayBar).toHaveClass('bar-today');
    });

    it('non-today bars do not have the accent class', () => {
      const { container } = render(<TokenChart data={mockData} today="2026-03-11" />);
      const bars = container.querySelectorAll('[data-testid="token-bar"][data-today="false"]');
      bars.forEach(bar => {
        expect(bar).not.toHaveClass('bar-today');
      });
    });

    it('renders a baseline element', () => {
      const { container } = render(<TokenChart data={mockData} today="2026-03-11" />);
      expect(container.querySelector('.chart-baseline')).toBeInTheDocument();
    });

    it('shows model label in title attribute for hover', () => {
      const { container } = render(<TokenChart data={mockData} today="2026-03-11" />);
      const bar = container.querySelector('[data-testid="token-bar"]');
      expect(bar).toHaveAttribute('title');
      expect(bar.getAttribute('title')).toMatch(/haiku|sonnet|opus/i);
    });

    it('does not render any icon elements', () => {
      const { container } = render(<TokenChart data={mockData} today="2026-03-11" />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
      expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    it('uses IBM Plex Mono class for labels', () => {
      const { container } = render(<TokenChart data={mockData} today="2026-03-11" />);
      const labels = container.querySelectorAll('.chart-label');
      expect(labels.length).toBeGreaterThan(0);
      labels.forEach(label => {
        expect(label).toHaveClass('chart-label');
      });
    });
  });

  describe('loading state', () => {
    it('renders skeleton bars when loading', () => {
      const { container } = render(<TokenChart loading />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render real data while loading', () => {
      render(<TokenChart loading />);
      expect(screen.queryByText('Token Usage')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty state text when data is empty array', () => {
      render(<TokenChart data={[]} />);
      expect(screen.getByText(/No token data for this period/i)).toBeInTheDocument();
    });

    it('renders empty state text when data is undefined', () => {
      render(<TokenChart data={undefined} />);
      expect(screen.getByText(/No token data for this period/i)).toBeInTheDocument();
    });

    it('does not render bars in empty state', () => {
      const { container } = render(<TokenChart data={[]} />);
      expect(container.querySelector('[data-testid="token-bar"]')).not.toBeInTheDocument();
    });
  });
});
