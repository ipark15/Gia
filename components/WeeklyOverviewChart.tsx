import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Line as SvgLine, Text as SvgText } from 'react-native-svg';

type WeeklyPoint = {
  day: string;
  date: string;
  consistency: number | null;
  satisfaction: number | null;
  routineCompleted: boolean;
  flareReported: boolean;
};

interface WeeklyOverviewChartProps {
  data: WeeklyPoint[];
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 200;
const PADDING_X = 36;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 32;

export const WeeklyOverviewChart: React.FC<WeeklyOverviewChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const innerWidth = CHART_WIDTH - PADDING_X * 2;
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const consistencyValues = data.map((d) => d.consistency ?? 0);
  const maxConsistency = Math.max(100, ...consistencyValues);

  const satisfactionScaled = data.map((d) =>
    d.satisfaction != null ? (d.satisfaction - 1) * 25 : null
  );

  const getX = (index: number) => {
    const n = data.length;
    if (n === 1) return PADDING_X + innerWidth / 2;
    return PADDING_X + (index / (n - 1)) * innerWidth;
  };

  const getYConsistency = (value: number | null) => {
    const v = value ?? 0;
    const ratio = 1 - Math.min(Math.max(v / maxConsistency, 0), 1);
    return PADDING_TOP + ratio * innerHeight;
  };

  const getYSatisfaction = (scaled: number | null) => {
    const v = scaled ?? 0;
    const ratio = 1 - Math.min(Math.max(v / 100, 0), 1);
    return PADDING_TOP + ratio * innerHeight;
  };

  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    return points.reduce(
      (acc, p, i) => acc + `${i === 0 ? 'M' : 'L'}${p.x},${p.y} `,
      ''
    );
  };

  const consistencyPoints = data.map((d, i) => ({
    x: getX(i),
    y: getYConsistency(d.consistency),
  }));

  const satisfactionPoints = data
    .map((d, i) =>
      satisfactionScaled[i] != null
        ? { x: getX(i), y: getYSatisfaction(satisfactionScaled[i]) }
        : null
    )
    .filter((p): p is { x: number; y: number } => p != null);

  const gridTicks = [0, 25, 50, 75, 100];

  return (
    <View style={styles.container}>
      <Svg
        width="100%"
        height={CHART_HEIGHT}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        {/* Grid lines */}
        {gridTicks.map((t) => {
          const y = getYConsistency(t);
          return (
            <SvgLine
              key={`grid-${t}`}
              x1={PADDING_X}
              x2={CHART_WIDTH - PADDING_X}
              y1={y}
              y2={y}
              stroke="#D8D5CF"
              strokeDasharray="3,3"
              opacity={0.3}
            />
          );
        })}

        {/* Left axis (0–100) */}
        <SvgLine
          x1={PADDING_X}
          x2={PADDING_X}
          y1={PADDING_TOP}
          y2={PADDING_TOP + innerHeight}
          stroke="#95C98E"
          strokeWidth={1}
        />
        {gridTicks.map((t) => {
          const y = getYConsistency(t);
          return (
            <SvgText
              key={`yleft-${t}`}
              x={PADDING_X - 6}
              y={y + 3}
              fontSize={10}
              fill="#5F8575"
              textAnchor="end"
            >
              {t}
            </SvgText>
          );
        })}

        {/* Left axis label */}
        <SvgText
          x={10}
          y={PADDING_TOP + innerHeight / 2}
          fontSize={10}
          fill="#5F8575"
          rotation={-90}
          origin={`${10},${PADDING_TOP + innerHeight / 2}`}
        >
          Consistency %
        </SvgText>

        {/* Right axis (1–5) */}
        <SvgLine
          x1={CHART_WIDTH - PADDING_X}
          x2={CHART_WIDTH - PADDING_X}
          y1={PADDING_TOP}
          y2={PADDING_TOP + innerHeight}
          stroke="#F49EC4"
          strokeWidth={1}
        />
        {[0, 25, 50, 75, 100].map((t) => {
          const y = getYSatisfaction(t);
          const label = 1 + t / 25;
          return (
            <SvgText
              key={`yright-${t}`}
              x={CHART_WIDTH - PADDING_X + 6}
              y={y + 3}
              fontSize={10}
              fill="#F49EC4"
            >
              {label}
            </SvgText>
          );
        })}

        {/* Right axis label */}
        <SvgText
          x={CHART_WIDTH - 10}
          y={PADDING_TOP + innerHeight / 2}
          fontSize={10}
          fill="#F49EC4"
          rotation={90}
          origin={`${CHART_WIDTH - 10},${PADDING_TOP + innerHeight / 2}`}
        >
          Satisfaction (1–5)
        </SvgText>

        {/* X axis labels */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = PADDING_TOP + innerHeight + 16;
          return (
            <SvgText
              key={`x-${d.day}-${i}`}
              x={x}
              y={y}
              fontSize={11}
              fill="#6B8B7D"
              textAnchor="middle"
            >
              {d.day}
            </SvgText>
          );
        })}

        {/* Consistency line */}
        <Path
          d={buildPath(consistencyPoints)}
          fill="none"
          stroke="#95C98E"
          strokeWidth={3}
        />
        {consistencyPoints.map((p, i) => (
          <Circle
            key={`c-cons-${i}`}
            cx={p.x}
            cy={p.y}
            r={6}
            fill="#5F8575"
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        ))}

        {/* Satisfaction line */}
        {satisfactionPoints.length > 0 && (
          <>
            <Path
              d={buildPath(satisfactionPoints)}
              fill="none"
              stroke="#F49EC4"
              strokeWidth={3}
            />
            {satisfactionPoints.map((p, i) => (
              <Circle
                key={`c-sat-${i}`}
                cx={p.x}
                cy={p.y}
                r={6}
                fill="#F49EC4"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            ))}
          </>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: CHART_HEIGHT,
    marginBottom: 12,
  },
});

export default WeeklyOverviewChart;

