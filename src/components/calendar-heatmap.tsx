/**
 * 90-day calendar heatmap. Each cell = a day. Color intensity ramps with
 * the number of wins (or total submissions, depending on the metric).
 *
 * GitHub-style: 7 rows (days of week, Sun → Sat) × N columns (weeks).
 * Tap a cell to see the date + count below the grid.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DayBucket } from '@/lib/progress-stats';

const CELL = 16;
const GAP = 4;

type Metric = 'wins' | 'total';

type Props = {
  weeks: DayBucket[][];
  metric?: Metric;
  /** Used for the units in the tooltip ("3 hops" vs "3 submissions"). */
  unitSingular?: string;
  unitPlural?: string;
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarHeatmap({
  weeks,
  metric = 'wins',
  unitSingular = 'hop',
  unitPlural = 'hops',
}: Props) {
  const theme = useTheme();
  const [selected, setSelected] = useState<DayBucket | null>(null);

  // Color ramp from background → accent based on value.
  const palette = [
    theme.background,        // 0
    '#D7E3D4',               // 1
    '#A8BDA5',               // 2-3
    '#7A957A',               // 4-5
    theme.accent,            // 6+
  ];
  const colorFor = (value: number): string => {
    if (value === 0) return palette[0];
    if (value === 1) return palette[1];
    if (value <= 3) return palette[2];
    if (value <= 5) return palette[3];
    return palette[4];
  };

  // Each week column is a fixed 7 days; pad short weeks (start/end of window)
  // with empty slots so columns line up vertically.
  const fullWeeks: (DayBucket | null)[][] = weeks.map((week) => {
    const slots: (DayBucket | null)[] = Array.from({ length: 7 }, () => null);
    for (const d of week) {
      slots[d.date.getDay()] = d;
    }
    return slots;
  });

  return (
    <View>
      <View style={styles.gridRow}>
        {/* Day-of-week labels column */}
        <View style={styles.labelsCol}>
          {DAY_LABELS.map((l, i) => (
            <ThemedText
              key={`d-${i}`}
              type="small"
              themeColor="textMuted"
              style={[
                styles.dayLabel,
                // Show only odd rows (M W F S) to reduce visual noise
                { opacity: i % 2 === 1 || i === 6 ? 1 : 0 },
              ]}
            >
              {l}
            </ThemedText>
          ))}
        </View>

        {/* Week columns */}
        <View style={styles.weeksRow}>
          {fullWeeks.map((week, wi) => (
            <View key={`w-${wi}`} style={styles.weekCol}>
              {week.map((cell, di) => {
                if (!cell) {
                  return (
                    <View
                      key={`c-${wi}-${di}`}
                      style={[styles.cell, { backgroundColor: 'transparent' }]}
                    />
                  );
                }
                const value = cell[metric];
                const isSelected = selected?.key === cell.key;
                return (
                  <Pressable
                    key={`c-${wi}-${di}`}
                    onPress={() => setSelected(isSelected ? null : cell)}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: colorFor(value),
                        borderColor: isSelected ? theme.text : theme.border,
                        borderWidth: isSelected ? 1.5 : 0.5,
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <ThemedText type="small" themeColor="textMuted">
          Less
        </ThemedText>
        {[0, 1, 2, 4, 6].map((v) => (
          <View
            key={v}
            style={[
              styles.legendCell,
              { backgroundColor: colorFor(v), borderColor: theme.border },
            ]}
          />
        ))}
        <ThemedText type="small" themeColor="textMuted">
          More
        </ThemedText>
      </View>

      {/* Tooltip */}
      <View style={styles.tooltipSlot}>
        {selected ? (
          <ThemedText type="small" themeColor="text">
            <ThemedText type="smallBold">
              {selected.date.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </ThemedText>
            {' · '}
            {selected[metric] === 0
              ? `no ${unitPlural}`
              : `${selected[metric]} ${selected[metric] === 1 ? unitSingular : unitPlural}`}
            {metric === 'wins' && selected.total > selected.wins
              ? ` (${selected.total} total submitted)`
              : ''}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textMuted">
            Tap any day to see the details.
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridRow: { flexDirection: 'row', alignItems: 'flex-start' },
  labelsCol: {
    width: 20,
    marginRight: Spacing.one,
    gap: GAP,
  },
  dayLabel: {
    height: CELL,
    lineHeight: CELL,
    textAlign: 'right',
    fontSize: 11,
  },
  weeksRow: {
    flexDirection: 'row',
    gap: GAP,
    flexWrap: 'nowrap',
  },
  weekCol: { gap: GAP },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    marginTop: Spacing.three,
  },
  legendCell: {
    width: CELL - 4,
    height: CELL - 4,
    borderRadius: 3,
    borderWidth: 0.5,
  },
  tooltipSlot: {
    minHeight: 28,
    marginTop: Spacing.two,
  },
});
