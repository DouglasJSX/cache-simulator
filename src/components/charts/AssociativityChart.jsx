import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  formatToFourDecimals,
  formatPercentage,
  isValidNumber,
} from "../../core/utils/formatters.js";

export function AssociativityChart({
  data = [],
  title = "Taxa de Acerto vs Associatividade",
  className = "",
  chartType = "line", // "line" ou "bar"
}) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Nenhum dado disponível para análise de associatividade
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formata dados para o gráfico
  const chartData = data.map((point) => ({
    associativity: point.x,
    hitRate: isValidNumber(point.y)
      ? parseFloat(formatToFourDecimals(point.y))
      : parseFloat(formatToFourDecimals(0)),
    label: point.x === 1 ? "Direct" : `${point.x}-way`,
    conflictMisses: point.metadata?.conflictMisses || 0,
  }));

  // Calcula melhoria incremental
  const improvements = chartData.map((point, index) => {
    if (index === 0) return { ...point, improvement: 0 };
    const prevHitRate = chartData[index - 1].hitRate;
    const improvement = point.hitRate - prevHitRate;
    return { ...point, improvement };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`Associatividade: ${data.label}`}</p>
          <p className="text-blue-600">{`Taxa de Acerto: ${formatPercentage(
            payload[0].value
          )}`}</p>
          {data.improvement !== undefined && data.improvement > 0 && (
            <p className="text-green-600 text-sm">
              +{formatPercentage(data.improvement)} vs anterior
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const formatXAxisTick = (value) => {
    return value === 1 ? "Direct" : `${value}-way`;
  };

  // Calcula ponto de diminishing returns
  const findDiminishingReturns = () => {
    for (let i = 1; i < improvements.length; i++) {
      if (improvements[i].improvement < 2.0) {
        // Menos de 2% de melhoria
        return improvements[i - 1].associativity;
      }
    }
    return improvements[improvements.length - 1].associativity;
  };

  const diminishingPoint = findDiminishingReturns();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-gray-600">
          Análise do impacto da associatividade na redução de conflict misses
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="associativity"
                  tickFormatter={formatXAxisTick}
                  className="text-xs"
                />
                <YAxis
                  tickFormatter={(value) => formatPercentage(value)}
                  domain={[0, 100]}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hitRate" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="associativity"
                  tickFormatter={formatXAxisTick}
                  className="text-xs"
                  scale="log"
                  domain={["dataMin", "dataMax"]}
                />
                <YAxis
                  tickFormatter={(value) => formatPercentage(value)}
                  domain={[0, 100]}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="hitRate"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: "#2563eb", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: "#2563eb", strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Análise dos resultados */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-medium text-gray-900">
                {formatPercentage(chartData[0]?.hitRate)}
              </div>
              <div className="text-gray-500">Direct-Mapped</div>
            </div>

            <div>
              <div className="font-medium text-gray-900">
                {formatPercentage(chartData[chartData.length - 1]?.hitRate)}
              </div>
              <div className="text-gray-500">Fully Associative</div>
            </div>

            <div>
              <div className="font-medium text-orange-600">
                {formatXAxisTick(diminishingPoint)}
              </div>
              <div className="text-gray-500">Ponto Ótimo</div>
            </div>

            <div>
              <div className="font-medium text-green-600">
                +
                {formatPercentage(
                  chartData[chartData.length - 1]?.hitRate -
                    chartData[0]?.hitRate
                )}
              </div>
              <div className="text-gray-500">Ganho Total</div>
            </div>
          </div>
        </div>

        {/* Tabela de melhorias incrementais */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Melhorias Incrementais:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {improvements.slice(1).map((item, index) => (
              <div key={index} className="text-center p-2 bg-white rounded">
                <div className="font-medium">{item.label}</div>
                <div
                  className={`${
                    item.improvement >= 2 ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  +{formatPercentage(item.improvement)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights automáticos */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Análise Automática:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Ganho total:{" "}
              {formatPercentage(
                chartData[chartData.length - 1]?.hitRate - chartData[0]?.hitRate
              )}{" "}
              de direct-mapped para fully associative
            </li>
            <li>
              • Ponto de diminishing returns:{" "}
              {formatXAxisTick(diminishingPoint)}
            </li>
            <li>
              • Maior melhoria individual:{" "}
              {formatPercentage(
                Math.max(...improvements.slice(1).map((i) => i.improvement))
              )}{" "}
              (2-way vs direct)
            </li>
            <li>
              • Recomendação:{" "}
              {diminishingPoint <= 4
                ? `${diminishingPoint}-way oferece bom custo-benefício`
                : "Consider higher associativity"}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
