/**
 * Tests for the progress calculation logic used by useProgress hook.
 * We test the core domain comparison and trend calculation directly.
 */

interface DomainProgress {
  domain: string;
  currentScore: number;
  previousScore: number | null;
  trend: 'up' | 'down' | 'stable';
  change: number;
  percentile: number;
}

// Extract the pure calculation logic from useProgress for direct testing
function calculateDomainProgress(
  latestScores: Array<{ domain: string; percentile: number | null }>,
  previousScoresMap: Record<string, number>
): DomainProgress[] {
  return latestScores.map((score) => {
    const percentile = score.percentile ?? 0;
    const previousPercentile = previousScoresMap[score.domain] ?? null;
    const change = previousPercentile !== null ? percentile - previousPercentile : 0;
    const trend: 'up' | 'down' | 'stable' =
      change > 2 ? 'up' : change < -2 ? 'down' : 'stable';

    return {
      domain: score.domain,
      currentScore: percentile,
      previousScore: previousPercentile,
      trend,
      change,
      percentile,
    };
  });
}

describe('useProgress - domain progress calculation', () => {
  it('marks trend as "up" when change exceeds +2', () => {
    const result = calculateDomainProgress(
      [{ domain: 'communication', percentile: 75 }],
      { communication: 70 }
    );

    expect(result[0].trend).toBe('up');
    expect(result[0].change).toBe(5);
    expect(result[0].currentScore).toBe(75);
    expect(result[0].previousScore).toBe(70);
  });

  it('marks trend as "down" when change is below -2', () => {
    const result = calculateDomainProgress(
      [{ domain: 'gross_motor', percentile: 40 }],
      { gross_motor: 55 }
    );

    expect(result[0].trend).toBe('down');
    expect(result[0].change).toBe(-15);
  });

  it('marks trend as "stable" when change is within [-2, +2]', () => {
    const exact = calculateDomainProgress(
      [{ domain: 'fine_motor', percentile: 50 }],
      { fine_motor: 50 }
    );
    expect(exact[0].trend).toBe('stable');
    expect(exact[0].change).toBe(0);

    const slightUp = calculateDomainProgress(
      [{ domain: 'fine_motor', percentile: 52 }],
      { fine_motor: 50 }
    );
    expect(slightUp[0].trend).toBe('stable');
    expect(slightUp[0].change).toBe(2);

    const slightDown = calculateDomainProgress(
      [{ domain: 'fine_motor', percentile: 48 }],
      { fine_motor: 50 }
    );
    expect(slightDown[0].trend).toBe('stable');
    expect(slightDown[0].change).toBe(-2);
  });

  it('handles no previous scores (first assessment)', () => {
    const result = calculateDomainProgress(
      [
        { domain: 'communication', percentile: 60 },
        { domain: 'gross_motor', percentile: 45 },
      ],
      {}
    );

    expect(result).toHaveLength(2);
    result.forEach((d) => {
      expect(d.previousScore).toBeNull();
      expect(d.change).toBe(0);
      expect(d.trend).toBe('stable');
    });
  });

  it('handles null percentile from database', () => {
    const result = calculateDomainProgress(
      [{ domain: 'problem_solving', percentile: null }],
      { problem_solving: 50 }
    );

    expect(result[0].currentScore).toBe(0);
    expect(result[0].percentile).toBe(0);
    expect(result[0].change).toBe(-50);
    expect(result[0].trend).toBe('down');
  });

  it('calculates progress for all five ASQ-3 domains', () => {
    const domains = [
      { domain: 'communication', percentile: 80 },
      { domain: 'gross_motor', percentile: 65 },
      { domain: 'fine_motor', percentile: 70 },
      { domain: 'problem_solving', percentile: 55 },
      { domain: 'personal_social', percentile: 90 },
    ];
    const previous: Record<string, number> = {
      communication: 75,
      gross_motor: 60,
      fine_motor: 72,
      problem_solving: 55,
      personal_social: 85,
    };

    const result = calculateDomainProgress(domains, previous);

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({
      domain: 'communication',
      currentScore: 80,
      previousScore: 75,
      trend: 'up',
      change: 5,
      percentile: 80,
    });
    expect(result[1]).toEqual({
      domain: 'gross_motor',
      currentScore: 65,
      previousScore: 60,
      trend: 'up',
      change: 5,
      percentile: 65,
    });
    expect(result[2]).toEqual({
      domain: 'fine_motor',
      currentScore: 70,
      previousScore: 72,
      trend: 'stable',
      change: -2,
      percentile: 70,
    });
    expect(result[3]).toEqual({
      domain: 'problem_solving',
      currentScore: 55,
      previousScore: 55,
      trend: 'stable',
      change: 0,
      percentile: 55,
    });
    expect(result[4]).toEqual({
      domain: 'personal_social',
      currentScore: 90,
      previousScore: 85,
      trend: 'up',
      change: 5,
      percentile: 90,
    });
  });

  it('handles mixed: some domains have previous, some do not', () => {
    const result = calculateDomainProgress(
      [
        { domain: 'communication', percentile: 60 },
        { domain: 'gross_motor', percentile: 50 },
      ],
      { communication: 40 }  // only communication has previous
    );

    expect(result[0].previousScore).toBe(40);
    expect(result[0].change).toBe(20);
    expect(result[0].trend).toBe('up');

    expect(result[1].previousScore).toBeNull();
    expect(result[1].change).toBe(0);
    expect(result[1].trend).toBe('stable');
  });

  it('handles boundary values at trend thresholds', () => {
    // Exactly +3: should be "up"
    const up = calculateDomainProgress(
      [{ domain: 'a', percentile: 53 }],
      { a: 50 }
    );
    expect(up[0].trend).toBe('up');

    // Exactly -3: should be "down"
    const down = calculateDomainProgress(
      [{ domain: 'a', percentile: 47 }],
      { a: 50 }
    );
    expect(down[0].trend).toBe('down');
  });

  it('handles empty scores array', () => {
    const result = calculateDomainProgress([], { communication: 50 });
    expect(result).toEqual([]);
  });
});
