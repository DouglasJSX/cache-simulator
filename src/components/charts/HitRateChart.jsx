// src/components/charts/HitRateChart.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function HitRateChart({
  data = [],
  title = "Taxa de Acerto vs Parâmetro",
  xAxisLabel = "Parâmetro",
  yAxisLabel = "Taxa de Acerto (%)",
  className = "",
}) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Nenhum dado disponível para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formata dados para o gráfico
  const chartData = data.map((point) => ({
    x: point.x,
    hitRate: typeof point.y === "number" ? Number(point.y.toFixed(2)) : 0,
    label: point.label || point.x,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${xAxisLabel}: ${label}`}</p>
          <p className="text-blue-600">
            {`${yAxisLabel}: ${payload[0].value}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const formatYAxisTick = (value) => `${value}%`;

  const formatXAxisTick = (value) => {
    // Se for um número grande, formata adequadamente
    if (typeof value === "number" && value >= 1024) {
      return `${(value / 1024).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="x"
                tickFormatter={formatXAxisTick}
                className="text-xs"
              />
              <YAxis
                tickFormatter={formatYAxisTick}
                domain={[0, 100]}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="hitRate"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Estatísticas do gráfico */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-medium text-gray-900">
                {Math.max(...chartData.map((d) => d.hitRate)).toFixed(1)}%
              </div>
              <div className="text-gray-500">Máximo</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {Math.min(...chartData.map((d) => d.hitRate)).toFixed(1)}%
              </div>
              <div className="text-gray-500">Mínimo</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {(
                  chartData.reduce((sum, d) => sum + d.hitRate, 0) /
                  chartData.length
                ).toFixed(1)}
                %
              </div>
              <div className="text-gray-500">Média</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
