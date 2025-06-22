// src/components/simulator/StatsDisplay.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

export function StatsDisplay({ statistics, configuration, className = "" }) {
  if (!statistics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Nenhuma simulação executada</p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  const formatPercentage = (num) => {
    return `${num.toFixed(2)}%`;
  };

  const formatTime = (num) => {
    return `${num.toFixed(4)} ns`;
  };

  const getHitRateColor = (rate) => {
    if (rate >= 90) return "[&>div]:bg-green-500";
    if (rate >= 70) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Estatísticas da Simulação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Taxa de Acerto Geral */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Taxa de Acerto Geral</span>
            <Badge variant="secondary">
              {formatPercentage(statistics.hitRate)}
            </Badge>
          </div>
          <Progress
            value={statistics.hitRate}
            className={`h-2 ${getHitRateColor(statistics.hitRate)}`}
          />
        </div>

        {/* Acessos Totais */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(statistics.totalAccesses)}
            </div>
            <div className="text-sm text-blue-600">Total</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(statistics.hits)}
            </div>
            <div className="text-sm text-green-600">Hits</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(statistics.misses)}
            </div>
            <div className="text-sm text-red-600">Misses</div>
          </div>
        </div>

        {/* Detalhes por Operação */}
        <div className="space-y-4">
          <h4 className="font-medium">Detalhes por Operação</h4>

          {/* Leituras */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <div className="font-medium">Leituras</div>
              <div className="text-sm text-gray-600">
                {formatNumber(statistics.readAccesses)} acessos
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {formatPercentage(statistics.readHitRate)}
              </div>
              <div className="text-sm text-gray-600">
                {formatNumber(statistics.readHits)} hits
              </div>
            </div>
          </div>

          {/* Escritas */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <div className="font-medium">Escritas</div>
              <div className="text-sm text-gray-600">
                {formatNumber(statistics.writeAccesses)} acessos
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {formatPercentage(statistics.writeHitRate)}
              </div>
              <div className="text-sm text-gray-600">
                {formatNumber(statistics.writeHits)} hits
              </div>
            </div>
          </div>
        </div>

        {/* Tráfego de Memória */}
        <div className="space-y-4">
          <h4 className="font-medium">Tráfego de Memória</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl font-bold">
                {formatNumber(statistics.memoryReads)}
              </div>
              <div className="text-sm text-gray-600">Leituras da MP</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl font-bold">
                {formatNumber(statistics.memoryWrites)}
              </div>
              <div className="text-sm text-gray-600">Escritas na MP</div>
            </div>
          </div>
        </div>

        {/* Tempo de Acesso */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatTime(statistics.averageAccessTime)}
            </div>
            <div className="text-sm text-blue-600">Tempo Médio de Acesso</div>
          </div>
        </div>

        {/* Configuração Resumida */}
        {configuration && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">Configuração</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                Cache:{" "}
                {(
                  (configuration.numLines * configuration.lineSize) /
                  1024
                ).toFixed(1)}{" "}
                KB
              </div>
              <div>Linha: {configuration.lineSize} bytes</div>
              <div>Associatividade: {configuration.associativity}-way</div>
              <div>
                Política:{" "}
                {configuration.writePolicy === 0
                  ? "Write-Through"
                  : "Write-Back"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
