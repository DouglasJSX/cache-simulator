// src/components/charts/BlockSizeChart.jsx
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
  ReferenceLine,
} from "recharts";

export function BlockSizeChart({
  data = [],
  title = "Taxa de Acerto vs Tamanho do Bloco",
  className = "",
  showOptimal = true,
}) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Nenhum dado disponível para análise de tamanho de bloco
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formata dados para o gráfico
  const chartData = data.map((point) => ({
    blockSize: point.x,
    hitRate: Number(point.y.toFixed(2)),
    label: `${point.x}B`,
    formatted:
      point.x >= 1024 ? `${(point.x / 1024).toFixed(0)}KB` : `${point.x}B`,
  }));

  // Encontra o ponto ótimo (maior hit rate)
  const optimalPoint = chartData.reduce(
    (max, current) => (current.hitRate > max.hitRate ? current : max),
    chartData[0]
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`Tamanho do Bloco: ${data.formatted}`}</p>
          <p className="text-blue-600">{`Taxa de Acerto: ${payload[0].value}%`}</p>
          {showOptimal && data.blockSize === optimalPoint.blockSize && (
            <p className="text-green-600 text-sm">✓ Ponto Ótimo</p>
          )}
        </div>
      );
    }
    return null;
  };

  const formatXAxisTick = (value) => {
    if (value >= 1024) {
      return `${(value / 1024).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-gray-600">
          Análise da localidade espacial - Impacto do tamanho do bloco na taxa
          de acerto
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="blockSize"
                tickFormatter={formatXAxisTick}
                className="text-xs"
                scale="log"
                domain={["dataMin", "dataMax"]}
              />
              <YAxis
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Linha principal */}
              <Line
                type="monotone"
                dataKey="hitRate"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2 }}
              />

              {/* Linha de referência para o ponto ótimo */}
              {showOptimal && (
                <ReferenceLine
                  x={optimalPoint.blockSize}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  label={{ value: "Ótimo", position: "top" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Análise dos resultados */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
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
              <div className="font-medium text-green-600">
                {optimalPoint.formatted}
              </div>
              <div className="text-gray-500">Tamanho Ótimo</div>
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

        {/* Insights automáticos */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Análise Automática:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Tamanho ótimo: {optimalPoint.formatted} ({optimalPoint.hitRate}%
              hit rate)
            </li>
            <li>
              • Melhoria:{" "}
              {(
                optimalPoint.hitRate -
                Math.min(...chartData.map((d) => d.hitRate))
              ).toFixed(1)}
              % vs menor bloco
            </li>
            {chartData.length > 1 && (
              <li>
                • Tendência:{" "}
                {chartData[chartData.length - 1].hitRate > chartData[0].hitRate
                  ? "Crescente"
                  : "Decrescente"}{" "}
                com tamanhos maiores
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
