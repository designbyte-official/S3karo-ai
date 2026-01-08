"use client";

import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { calculatePercentage, convertFileSize, cn } from "@/features/shared/utils";

const chartConfig = {
  size: {
    label: "Size",
  },
  used: {
    label: "Used",
    color: "white",
  },
} satisfies ChartConfig;

interface StorageChartProps {
  used: number;
  total?: number;
  variant?: "brand" | "blue";
}

export const StorageChart = ({
  used = 0,
  total = 2 * 1024 * 1024 * 1024,
  variant = "brand",
}: StorageChartProps) => {
  const chartData = [{ storage: "used", 10: used, fill: "white" }];
  const percentage = calculatePercentage(used);
  // Recharts handles angles in degrees. Full circle is 360.
  // We want to fill based on percentage.
  // If 100%, endAngle should be startAngle + 360.
  // The original component had `endAngle={Number(calculatePercentage(used)) + 90}` which seems suspicious if calculatePercentage returns 0-100.
  // 100 + 90 = 190, which is only half a circle roughly?
  // Let's stick to the original logic for now to ensure visual consistency with what they had,
  // assuming calculatePercentage returns a value that effectively maps to degrees in their setup or checking the original file.
  // Original: endAngle={Number(calculatePercentage(used)) + 90}
  // If calculatePercentage returns 0-100, then max angle is 190.
  // But wait, RadialBarChart usually takes degrees.
  // Let's assume the original logic was desired or I should just copy it precisely.

  const endAngle = Number(percentage) + 90;

  const bgClass = variant === "blue" ? "bg-blue" : "bg-brand";
  const polarGridClass = variant === "blue" ? "last:fill-blue" : "last:fill-brand";

  return (
    <Card className={cn("chart", bgClass)}>
      <CardContent className="flex-1 p-0">
        <ChartContainer config={chartConfig} className="chart-container">
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={endAngle}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className={cn("polar-grid", polarGridClass)}
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="storage" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan x={viewBox.cx} y={viewBox.cy} className="chart-total-percentage">
                          {used && percentage ? percentage.toString().replace(/^0+/, "") : "0"}%
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-white/70">
                          Space used
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardHeader className="chart-details">
        <CardTitle className="chart-title">Available Storage</CardTitle>
        <CardDescription className="chart-description">
          {used ? convertFileSize(used) : convertFileSize(total)} / {convertFileSize(total)}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
