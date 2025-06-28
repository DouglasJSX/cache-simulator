import { useState, useCallback } from "react";
import { CacheSimulator } from "../core/cache/CacheSimulator.js";
import { FileParser } from "../core/utils/fileParser.js";

export function useSimulation() {
  const [experiments, setExperiments] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [traceData, setTraceData] = useState(null);

  const loadTraceFile = useCallback(async (fileContent) => {
    try {
      const accesses = FileParser.parseTraceFile(fileContent);
      const stats = FileParser.createTraceStatistics(accesses);

      setTraceData({ accesses, stats });
      return { accesses, stats };
    } catch (error) {
      console.error("Erro ao carregar arquivo:", error);
      throw error;
    }
  }, []);

  const runExperiment = useCallback(async (config, memConfig, accesses) => {
    const simulator = new CacheSimulator(config, memConfig);

    for (const access of accesses) {
      simulator.access(access.address, access.operation);
    }

    return simulator.getResults();
  }, []);

  const runBatchExperiments = useCallback(
    async (configs, accesses) => {
      setIsRunning(true);
      setProgress(0);

      const results = [];

      try {
        for (let i = 0; i < configs.length; i++) {
          const { cacheConfig, memoryConfig } = configs[i];
          const result = await runExperiment(
            cacheConfig,
            memoryConfig,
            accesses
          );

          results.push(result);
          setProgress(((i + 1) / configs.length) * 100);

          // Pequeno delay para não travar a UI
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        setExperiments((prev) => [...prev, ...results]);
        return results;
      } finally {
        setIsRunning(false);
        setProgress(0);
      }
    },
    [runExperiment]
  );

  const clearExperiments = useCallback(() => {
    setExperiments([]);
  }, []);

  const generateConfigurations = useCallback((baseConfig, variations) => {
    const configs = [];

    variations.forEach((variation) => {
      const config = {
        cacheConfig: { ...baseConfig.cache, ...variation.cache },
        memoryConfig: { ...baseConfig.memory, ...variation.memory },
      };
      configs.push(config);
    });

    return configs;
  }, []);

  const exportResults = useCallback(
    (format = "json") => {
      if (format === "json") {
        return JSON.stringify(experiments, null, 2);
      }

      if (format === "csv") {
        const headers = [
          "Config",
          "Hit Rate",
          "Avg Access Time",
          "Memory Reads",
          "Memory Writes",
        ];
        const rows = experiments.map((exp, i) => [
          `Config ${i + 1}`,
          exp.statistics.hitRate.toFixed(4),
          exp.statistics.averageAccessTime.toFixed(4),
          exp.statistics.memoryReads,
          exp.statistics.memoryWrites,
        ]);

        return [headers, ...rows].map((row) => row.join(",")).join("\n");
      }
    },
    [experiments]
  );

  return {
    // Estado
    experiments,
    isRunning,
    progress,
    traceData,

    // Ações
    loadTraceFile,
    runExperiment,
    runBatchExperiments,
    clearExperiments,
    generateConfigurations,
    exportResults,
  };
}
