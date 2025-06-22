// src/app/analysis/page.jsx
"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { HitRateChart } from "../../components/charts/HitRateChart";
import { BlockSizeChart } from "../../components/charts/BlockSizeChart";
import { AssociativityChart } from "../../components/charts/AssociativityChart";
import { ComparisonChart } from "../../components/charts/ComparisonChart";
import { TableDisplay } from "../../components/analysis/TableDisplay";
import { ReportGenerator } from "../../components/analysis/ReportGenerator";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useSimulation } from "../../hooks/useSimulation";
import {
  createCacheConfiguration,
  createMemoryConfiguration,
  WritePolicy,
  ReplacementPolicy,
} from "../../core/types/cache.types";
import { StatisticsCalculator } from "../../core/utils/statistics";
import { Play, Download, Upload } from "lucide-react";

export default function AnalysisPage() {
  const {
    experiments,
    isRunning,
    progress,
    traceData,
    loadTraceFile,
    runBatchExperiments,
    clearExperiments,
    exportResults,
  } = useSimulation();

  const [activeAnalysis, setActiveAnalysis] = useState("cache-size");
  const [analysisResults, setAnalysisResults] = useState({});
  const [error, setError] = useState("");

  // Configurações base para análises
  const baseConfig = {
    cache: createCacheConfiguration({
      lineSize: 128,
      writePolicy: WritePolicy.WRITE_THROUGH,
      replacementPolicy: ReplacementPolicy.LRU,
      hitTime: 5,
    }),
    memory: createMemoryConfiguration({
      readTime: 70,
      writeTime: 70,
    }),
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const content = await file.text();
      await loadTraceFile(content);
      setError("");
    } catch (err) {
      setError(`Erro ao carregar arquivo: ${err.message}`);
    }
  };

  const runCacheSizeAnalysis = async () => {
    if (!traceData) {
      setError("Carregue um arquivo de trace primeiro");
      return;
    }

    const variations = [];
    // 8, 16, 32, 64, 128, 256, 512, 1024 blocos
    for (let numLines = 8; numLines <= 1024; numLines *= 2) {
      variations.push({
        cache: { numLines, associativity: 4 },
        memory: {},
      });
    }

    try {
      const configs = generateConfigurations(baseConfig, variations);
      const results = await runBatchExperiments(configs, traceData.accesses);

      const chartData = StatisticsCalculator.prepareChartData(
        results,
        "cacheSize",
        "hitRate"
      );

      setAnalysisResults((prev) => ({
        ...prev,
        cacheSize: { results, chartData },
      }));
    } catch (err) {
      setError(`Erro na análise: ${err.message}`);
    }
  };

  const runBlockSizeAnalysis = async () => {
    if (!traceData) {
      setError("Carregue um arquivo de trace primeiro");
      return;
    }

    const variations = [];
    // 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096 bytes
    for (let lineSize = 8; lineSize <= 4096; lineSize *= 2) {
      const numLines = Math.floor(8192 / lineSize); // Cache de 8KB
      variations.push({
        cache: { lineSize, numLines, associativity: 2 },
        memory: {},
      });
    }

    try {
      const configs = generateConfigurations(baseConfig, variations);
      const results = await runBatchExperiments(configs, traceData.accesses);

      const chartData = StatisticsCalculator.prepareChartData(
        results,
        "lineSize",
        "hitRate"
      );

      setAnalysisResults((prev) => ({
        ...prev,
        blockSize: { results, chartData },
      }));
    } catch (err) {
      setError(`Erro na análise: ${err.message}`);
    }
  };

  const runAssociativityAnalysis = async () => {
    if (!traceData) {
      setError("Carregue um arquivo de trace primeiro");
      return;
    }

    const variations = [];
    // 1, 2, 4, 8, 16, 32, 64-way
    for (let assoc = 1; assoc <= 64; assoc *= 2) {
      const numLines = 64; // Cache de 8KB com linhas de 128 bytes
      variations.push({
        cache: {
          numLines,
          associativity: assoc,
          writePolicy: WritePolicy.WRITE_BACK,
        },
        memory: {},
      });
    }

    try {
      const configs = generateConfigurations(baseConfig, variations);
      const results = await runBatchExperiments(configs, traceData.accesses);

      const chartData = StatisticsCalculator.prepareChartData(
        results,
        "associativity",
        "hitRate"
      );

      setAnalysisResults((prev) => ({
        ...prev,
        associativity: { results, chartData },
      }));
    } catch (err) {
      setError(`Erro na análise: ${err.message}`);
    }
  };

  const runReplacementPolicyAnalysis = async () => {
    if (!traceData) {
      setError("Carregue um arquivo de trace primeiro");
      return;
    }

    const variations = [];

    // Para cada tamanho de cache, testa LRU e Random
    for (let numLines = 16; numLines <= 1024; numLines *= 2) {
      variations.push(
        {
          cache: {
            numLines,
            associativity: 4,
            replacementPolicy: ReplacementPolicy.LRU,
          },
          memory: {},
        },
        {
          cache: {
            numLines,
            associativity: 4,
            replacementPolicy: ReplacementPolicy.RANDOM,
          },
          memory: {},
        }
      );
    }

    try {
      const configs = generateConfigurations(baseConfig, variations);
      const results = await runBatchExperiments(configs, traceData.accesses);

      // Separa resultados por política
      const lruResults = results.filter(
        (r) => r.configuration.replacementPolicy === ReplacementPolicy.LRU
      );
      const randomResults = results.filter(
        (r) => r.configuration.replacementPolicy === ReplacementPolicy.RANDOM
      );

      const lruChartData = StatisticsCalculator.prepareChartData(
        lruResults,
        "cacheSize",
        "hitRate"
      );
      const randomChartData = StatisticsCalculator.prepareChartData(
        randomResults,
        "cacheSize",
        "hitRate"
      );

      setAnalysisResults((prev) => ({
        ...prev,
        replacementPolicy: {
          lruResults,
          randomResults,
          lruChartData,
          randomChartData,
        },
      }));
    } catch (err) {
      setError(`Erro na análise: ${err.message}`);
    }
  };

  const runMemoryBandwidthAnalysis = async () => {
    if (!traceData) {
      setError("Carregue um arquivo de trace primeiro");
      return;
    }

    const variations = [
      // Write-through
      {
        cache: {
          numLines: 128,
          lineSize: 64,
          associativity: 2,
          writePolicy: WritePolicy.WRITE_THROUGH,
        },
      },
      {
        cache: {
          numLines: 128,
          lineSize: 128,
          associativity: 2,
          writePolicy: WritePolicy.WRITE_THROUGH,
        },
      },
      {
        cache: {
          numLines: 256,
          lineSize: 64,
          associativity: 2,
          writePolicy: WritePolicy.WRITE_THROUGH,
        },
      },
      {
        cache: {
          numLines: 256,
          lineSize: 128,
          associativity: 2,
          writePolicy: WritePolicy.WRITE_THROUGH,
        },
      },
      {
        cache: {
          numLines: 128,
          lineSize: 64,
          associativity: 4,
          writePolicy: WritePolicy.WRITE_THROUGH,
        },
      },
      {
        cache: {
          numLines: 128,
          lineSize: 128,
          associativity: 4,
          writePolicy: WritePolicy.WRITE_THROUGH,
        },
      },
      {
        cache: {
          numLines: 256,
          lineSize: 64,
          associativity: 4,
          writePolicy: WritePolicy.WRITE_THROUGH,
        },
      },
      {
        cache: {
          numLines: 256,
          lineSize: 128,
          associativity: 4,
          writePolicy: WritePolicy.WRITE_THROUGH,
        },
      },

      // Write-back
      {
        cache: {
          numLines: 128,
          lineSize: 64,
          associativity: 2,
          writePolicy: WritePolicy.WRITE_BACK,
        },
      },
      {
        cache: {
          numLines: 128,
          lineSize: 128,
          associativity: 2,
          writePolicy: WritePolicy.WRITE_BACK,
        },
      },
      {
        cache: {
          numLines: 256,
          lineSize: 64,
          associativity: 2,
          writePolicy: WritePolicy.WRITE_BACK,
        },
      },
      {
        cache: {
          numLines: 256,
          lineSize: 128,
          associativity: 2,
          writePolicy: WritePolicy.WRITE_BACK,
        },
      },
      {
        cache: {
          numLines: 128,
          lineSize: 64,
          associativity: 4,
          writePolicy: WritePolicy.WRITE_BACK,
        },
      },
      {
        cache: {
          numLines: 128,
          lineSize: 128,
          associativity: 4,
          writePolicy: WritePolicy.WRITE_BACK,
        },
      },
      {
        cache: {
          numLines: 256,
          lineSize: 64,
          associativity: 4,
          writePolicy: WritePolicy.WRITE_BACK,
        },
      },
      {
        cache: {
          numLines: 256,
          lineSize: 128,
          associativity: 4,
          writePolicy: WritePolicy.WRITE_BACK,
        },
      },
    ].map((v) => ({ ...v, memory: {} }));

    try {
      const configs = generateConfigurations(baseConfig, variations);
      const results = await runBatchExperiments(configs, traceData.accesses);

      const trafficData = StatisticsCalculator.calculateMemoryTraffic(results);

      setAnalysisResults((prev) => ({
        ...prev,
        memoryBandwidth: { results, trafficData },
      }));
    } catch (err) {
      setError(`Erro na análise: ${err.message}`);
    }
  };

  const handleClearResults = () => {
    clearExperiments();
    setAnalysisResults({});
    setError("");
  };

  const generateConfigurations = (base, variations) => {
    return variations.map((variation) => ({
      cacheConfig: { ...base.cache, ...variation.cache },
      memoryConfig: { ...base.memory, ...variation.memory },
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Análises de Cache</h1>
          <p className="text-gray-600">
            Execute análises conforme especificado no TDE 2
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClearResults}>
            Limpar Resultados
          </Button>
        </div>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Arquivo de Trace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept=".cache,.txt,.trace"
                onChange={handleFileUpload}
                className="hidden"
                id="trace-file"
              />
              <label htmlFor="trace-file">
                <Button variant="outline" asChild className="cursor-pointer">
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Carregar Arquivo de Trace
                  </span>
                </Button>
              </label>
            </div>

            {traceData && (
              <div className="text-sm text-gray-600">
                <div>{traceData.stats.totalAccesses} acessos carregados</div>
                <div>
                  {traceData.stats.readAccesses} leituras |{" "}
                  {traceData.stats.writeAccesses} escritas
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Executando análise...</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Tabs */}
      <Tabs value={activeAnalysis} onValueChange={setActiveAnalysis}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cache-size">Tamanho Cache</TabsTrigger>
          <TabsTrigger value="block-size">Tamanho Bloco</TabsTrigger>
          <TabsTrigger value="associativity">Associatividade</TabsTrigger>
          <TabsTrigger value="replacement">Substituição</TabsTrigger>
          <TabsTrigger value="bandwidth">Largura Banda</TabsTrigger>
        </TabsList>

        <TabsContent value="cache-size" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impacto do Tamanho da Cache</CardTitle>
              <p className="text-sm text-gray-600">
                Linha: 128 bytes | Write-through | LRU | 4-way
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runCacheSizeAnalysis}
                disabled={!traceData || isRunning}
                className="mb-4"
              >
                <Play className="w-4 h-4 mr-2" />
                Executar Análise
              </Button>

              {analysisResults.cacheSize && (
                <div className="space-y-6">
                  <HitRateChart
                    data={analysisResults.cacheSize.chartData}
                    title="Taxa de Acerto vs Tamanho da Cache"
                    xAxisLabel="Tamanho da Cache (KB)"
                  />

                  <TableDisplay
                    data={analysisResults.cacheSize.results.map((r) => ({
                      cacheSize: `${(
                        (r.configuration.numLines * r.configuration.lineSize) /
                        1024
                      ).toFixed(1)}KB`,
                      hitRate: r.statistics.hitRate,
                      avgAccessTime: r.statistics.averageAccessTime,
                      memoryReads: r.statistics.memoryReads,
                      memoryWrites: r.statistics.memoryWrites,
                    }))}
                    columns={[
                      { key: "cacheSize", label: "Tamanho da Cache" },
                      { key: "hitRate", label: "Taxa de Acerto (%)" },
                      { key: "avgAccessTime", label: "Tempo Médio (ns)" },
                      { key: "memoryReads", label: "Leituras MP" },
                      { key: "memoryWrites", label: "Escritas MP" },
                    ]}
                    title="Resultados - Tamanho da Cache"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="block-size" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impacto do Tamanho do Bloco</CardTitle>
              <p className="text-sm text-gray-600">
                Cache: 8KB | Write-through | LRU | 2-way
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runBlockSizeAnalysis}
                disabled={!traceData || isRunning}
                className="mb-4"
              >
                <Play className="w-4 h-4 mr-2" />
                Executar Análise
              </Button>

              {analysisResults.blockSize && (
                <div className="space-y-6">
                  <BlockSizeChart
                    data={analysisResults.blockSize.chartData}
                    title="Taxa de Acerto vs Tamanho do Bloco"
                    showOptimal={true}
                  />

                  <TableDisplay
                    data={analysisResults.blockSize.results.map((r) => ({
                      blockSize: `${r.configuration.lineSize}B`,
                      hitRate: r.statistics.hitRate,
                      avgAccessTime: r.statistics.averageAccessTime,
                      memoryReads: r.statistics.memoryReads,
                      memoryWrites: r.statistics.memoryWrites,
                    }))}
                    columns={[
                      { key: "blockSize", label: "Tamanho do Bloco" },
                      { key: "hitRate", label: "Taxa de Acerto (%)" },
                      { key: "avgAccessTime", label: "Tempo Médio (ns)" },
                      { key: "memoryReads", label: "Leituras MP" },
                      { key: "memoryWrites", label: "Escritas MP" },
                    ]}
                    title="Resultados - Tamanho do Bloco"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="associativity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impacto da Associatividade</CardTitle>
              <p className="text-sm text-gray-600">
                Linha: 128 bytes | Write-back | LRU | 8KB cache
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runAssociativityAnalysis}
                disabled={!traceData || isRunning}
                className="mb-4"
              >
                <Play className="w-4 h-4 mr-2" />
                Executar Análise
              </Button>

              {analysisResults.associativity && (
                <div className="space-y-6">
                  <AssociativityChart
                    data={analysisResults.associativity.chartData}
                    title="Taxa de Acerto vs Associatividade"
                    chartType="line"
                  />

                  <TableDisplay
                    data={analysisResults.associativity.results.map((r) => ({
                      associativity:
                        r.configuration.associativity === 1
                          ? "Direct"
                          : `${r.configuration.associativity}-way`,
                      hitRate: r.statistics.hitRate,
                      avgAccessTime: r.statistics.averageAccessTime,
                      memoryReads: r.statistics.memoryReads,
                      memoryWrites: r.statistics.memoryWrites,
                    }))}
                    columns={[
                      { key: "associativity", label: "Associatividade" },
                      { key: "hitRate", label: "Taxa de Acerto (%)" },
                      { key: "avgAccessTime", label: "Tempo Médio (ns)" },
                      { key: "memoryReads", label: "Leituras MP" },
                      { key: "memoryWrites", label: "Escritas MP" },
                    ]}
                    title="Resultados - Associatividade"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replacement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impacto da Política de Substituição</CardTitle>
              <p className="text-sm text-gray-600">
                Linha: 128 bytes | Write-through | 4-way
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runReplacementPolicyAnalysis}
                disabled={!traceData || isRunning}
                className="mb-4"
              >
                <Play className="w-4 h-4 mr-2" />
                Executar Análise
              </Button>

              {analysisResults.replacementPolicy && (
                <div className="space-y-6">
                  <ComparisonChart
                    datasets={[
                      {
                        name: "LRU",
                        data: analysisResults.replacementPolicy.lruChartData,
                      },
                      {
                        name: "Aleatório",
                        data: analysisResults.replacementPolicy.randomChartData,
                      },
                    ]}
                    title="Comparação: LRU vs Aleatório"
                    xAxisLabel="Tamanho da Cache (KB)"
                    showDifference={true}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TableDisplay
                      data={analysisResults.replacementPolicy.lruResults.map(
                        (r) => ({
                          cacheSize: `${(
                            (r.configuration.numLines *
                              r.configuration.lineSize) /
                            1024
                          ).toFixed(1)}KB`,
                          hitRate: r.statistics.hitRate,
                          avgAccessTime: r.statistics.averageAccessTime,
                        })
                      )}
                      columns={[
                        { key: "cacheSize", label: "Tamanho" },
                        { key: "hitRate", label: "Hit Rate (%)" },
                        { key: "avgAccessTime", label: "Tempo (ns)" },
                      ]}
                      title="Resultados - LRU"
                    />

                    <TableDisplay
                      data={analysisResults.replacementPolicy.randomResults.map(
                        (r) => ({
                          cacheSize: `${(
                            (r.configuration.numLines *
                              r.configuration.lineSize) /
                            1024
                          ).toFixed(1)}KB`,
                          hitRate: r.statistics.hitRate,
                          avgAccessTime: r.statistics.averageAccessTime,
                        })
                      )}
                      columns={[
                        { key: "cacheSize", label: "Tamanho" },
                        { key: "hitRate", label: "Hit Rate (%)" },
                        { key: "avgAccessTime", label: "Tempo (ns)" },
                      ]}
                      title="Resultados - Aleatório"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bandwidth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Largura de Banda da Memória</CardTitle>
              <p className="text-sm text-gray-600">
                Comparação Write-through vs Write-back
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runMemoryBandwidthAnalysis}
                disabled={!traceData || isRunning}
                className="mb-4"
              >
                <Play className="w-4 h-4 mr-2" />
                Executar Análise
              </Button>

              {analysisResults.memoryBandwidth && (
                <div className="space-y-6">
                  <TableDisplay
                    data={analysisResults.memoryBandwidth.trafficData}
                    columns={[
                      { key: "configuration", label: "Configuração" },
                      { key: "memoryReads", label: "Leituras MP" },
                      { key: "memoryWrites", label: "Escritas MP" },
                      { key: "totalTraffic", label: "Tráfego Total" },
                      { key: "hitRate", label: "Hit Rate (%)" },
                    ]}
                    title="Análise de Tráfego de Memória"
                    className="w-full"
                  />

                  {/* Estatísticas resumidas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Write-Through</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const wtResults =
                            analysisResults.memoryBandwidth.results.filter(
                              (r) => r.configuration.writePolicy === 0
                            );
                          const avgTraffic =
                            wtResults.reduce(
                              (sum, r) =>
                                sum +
                                r.statistics.memoryReads +
                                r.statistics.memoryWrites,
                              0
                            ) / wtResults.length;
                          return (
                            <div className="space-y-2">
                              <div>
                                Tráfego Médio: {avgTraffic.toFixed(0)} acessos
                              </div>
                              <div>Configurações: {wtResults.length}</div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Write-Back</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const wbResults =
                            analysisResults.memoryBandwidth.results.filter(
                              (r) => r.configuration.writePolicy === 1
                            );
                          const avgTraffic =
                            wbResults.reduce(
                              (sum, r) =>
                                sum +
                                r.statistics.memoryReads +
                                r.statistics.memoryWrites,
                              0
                            ) / wbResults.length;
                          return (
                            <div className="space-y-2">
                              <div>
                                Tráfego Médio: {avgTraffic.toFixed(0)} acessos
                              </div>
                              <div>Configurações: {wbResults.length}</div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Gerador de Relatório */}
      {Object.keys(analysisResults).length > 0 && (
        <div className="mt-8">
          <ReportGenerator
            experimentResults={analysisResults}
            onExport={(markdown) => {
              console.log("Relatório gerado:", markdown);
            }}
          />
        </div>
      )}
    </div>
  );
}
