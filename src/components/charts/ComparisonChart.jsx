// src/components/charts/ComparisonChart.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export function ComparisonChart({
  datasets = [],
  title = "Comparação de Políticas",
  xAxisLabel = "Parâmetro",
  yAxisLabel = "Taxa de Acerto (%)",
  className = "",
  chartType = "line", // "line" ou "bar"
  showDifference = true,
}) {
  if (!datasets || datasets.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Nenhum dado disponível para comparação
          </div>
        </CardContent>
      </Card>
    );
  }

  // Cores para diferentes séries
  const colors = [
    "#2563eb", // blue
    "#dc2626", // red
    "#16a34a", // green
    "#ca8a04", // yellow
    "#9333ea", // purple
    "#c2410c", // orange
  ];

  // Combina datasets em um formato único para o gráfico
  const chartData = datasets[0].data.map((_, index) => {
    const point = { x: datasets[0].data[index].x };

    datasets.forEach((dataset, datasetIndex) => {
      const dataPoint = dataset.data[index];
      point[dataset.name] = Number(dataPoint.y.toFixed(2));
    });

    // Calcula diferença entre primeira e segunda série se aplicável
    if (showDifference && datasets.length >= 2) {
      const diff = point[datasets[0].name] - point[datasets[1].name];
      point.difference = Number(diff.toFixed(2));
    }

    return point;
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${xAxisLabel}: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}%`}
            </p>
          ))}
          {showDifference && payload[0]?.payload?.difference !== undefined && (
            <p
              className={`text-sm ${
                payload[0].payload.difference >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              Diferença: {payload[0].payload.difference >= 0 ? "+" : ""}
              {payload[0].payload.difference}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const formatXAxisTick = (value) => {
    if (typeof value === "number" && value >= 1024) {
      return `${(value / 1024).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Calcula estatísticas de comparação
  const calculateStats = () => {
    if (datasets.length < 2) return null;

    const dataset1 = datasets[0];
    const dataset2 = datasets[1];

    const avg1 =
      dataset1.data.reduce((sum, p) => sum + p.y, 0) / dataset1.data.length;
    const avg2 =
      dataset2.data.reduce((sum, p) => sum + p.y, 0) / dataset2.data.length;

    const maxDiff = Math.max(
      ...chartData.map((p) => Math.abs(p.difference || 0))
    );
    const avgDiff =
      chartData.reduce((sum, p) => sum + (p.difference || 0), 0) /
      chartData.length;

    return {
      avg1: avg1.toFixed(1),
      avg2: avg2.toFixed(1),
      avgDiff: avgDiff.toFixed(1),
      maxDiff: maxDiff.toFixed(1),
      winner: avg1 > avg2 ? dataset1.name : dataset2.name,
    };
  };

  const stats = calculateStats();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-gray-600">
          Comparação entre diferentes configurações/políticas
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="x"
                  tickFormatter={formatXAxisTick}
                  className="text-xs"
                />
                <YAxis
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {datasets.map((dataset, index) => (
                  <Bar
                    key={dataset.name}
                    dataKey={dataset.name}
                    fill={colors[index % colors.length]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="x"
                  tickFormatter={formatXAxisTick}
                  className="text-xs"
                />
                <YAxis
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {datasets.map((dataset, index) => (
                  <Line
                    key={dataset.name}
                    type="monotone"
                    dataKey={dataset.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={3}
                    dot={{
                      fill: colors[index % colors.length],
                      strokeWidth: 2,
                      r: 4,
                    }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Estatísticas de comparação */}
        {stats && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="font-medium" style={{ color: colors[0] }}>
                  {stats.avg1}%
                </div>
                <div className="text-gray-500">{datasets[0].name} (Média)</div>
              </div>

              <div>
                <div className="font-medium" style={{ color: colors[1] }}>
                  {stats.avg2}%
                </div>
                <div className="text-gray-500">{datasets[1].name} (Média)</div>
              </div>

              <div>
                <div className="font-medium text-green-600">{stats.winner}</div>
                <div className="text-gray-500">Melhor Performance</div>
              </div>

              <div>
                <div className="font-medium text-gray-900">
                  ±{stats.maxDiff}%
                </div>
                <div className="text-gray-500">Maior Diferença</div>
              </div>
            </div>
          </div>
        )}

        {/* Análise ponto a ponto */}
        {showDifference && stats && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Análise Detalhada:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {chartData.map((point, index) => (
                <div key={index} className="text-center p-2 bg-white rounded">
                  <div className="font-medium">{formatXAxisTick(point.x)}</div>
                  <div
                    className={`${
                      point.difference >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {point.difference >= 0 ? "+" : ""}
                    {point.difference}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights automáticos */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Insights:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {stats && (
              <>
                <li>
                  • {stats.winner} tem melhor performance média (
                  {stats.avg1 > stats.avg2 ? stats.avg1 : stats.avg2}%)
                </li>
                <li>
                  • Diferença média: {Math.abs(parseFloat(stats.avgDiff))}%
                  entre as políticas
                </li>
                <li>
                  • Maior vantagem: {stats.maxDiff}% em favor da melhor política
                </li>
                {Math.abs(parseFloat(stats.avgDiff)) < 2 && (
                  <li>
                    • As políticas têm performance similar (diferença {"<"} 2%)
                  </li>
                )}
              </>
            )}
            <li>• Comparação baseada em {chartData.length} pontos de dados</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
