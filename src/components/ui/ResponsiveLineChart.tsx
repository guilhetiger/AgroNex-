import { useState } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

type ChartData = {
  labels: string[];
  datasets: Array<{ data: number[]; color?: (opacity: number) => string; strokeWidth?: number }>;
  legend?: string[];
};

type ChartConfig = {
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  decimalPlaces: number;
  color: (opacity?: number) => string;
  labelColor: (opacity?: number) => string;
  propsForDots?: { r: string; fill: string };
  [key: string]: unknown;
};

type Props = {
  data: ChartData;
  height?: number;
  chartConfig: ChartConfig;
  style?: StyleProp<ViewStyle>;
  bezier?: boolean;
};

export function ResponsiveLineChart({ data, height = 210, chartConfig, style, bezier }: Props) {
  const [chartWidth, setChartWidth] = useState(0);

  return (
    <View
      style={[{ width: '100%', overflow: 'hidden' }, style]}
      onLayout={(event) => {
        const nextWidth = Math.floor(event.nativeEvent.layout.width);
        if (nextWidth > 0 && nextWidth !== chartWidth) {
          setChartWidth(nextWidth);
        }
      }}
    >
      {chartWidth > 0 ? (
        <LineChart
          data={data}
          width={chartWidth}
          height={height}
          chartConfig={chartConfig}
          bezier={bezier}
          style={{ borderRadius: 8 }}
        />
      ) : null}
    </View>
  );
}
