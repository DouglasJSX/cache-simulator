import { useState, useCallback, useMemo, useEffect } from "react";
import { CacheSimulator } from "../core/cache/CacheSimulator.js";
import {
  createCacheConfiguration,
  createMemoryConfiguration,
} from "../core/types/cache.types.js";
import {
  formatToFourDecimals,
  isValidNumber,
} from "../core/utils/formatters.js";

export function useCache() {
  const [config, setConfig] = useState(() => createCacheConfiguration());
  const [memConfig, setMemConfig] = useState(() => createMemoryConfiguration());
  const [simulator, setSimulator] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [loadedTraceData, setLoadedTraceData] = useState(null);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  const updateConfig = useCallback((newConfig) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const updateMemoryConfig = useCallback((newMemConfig) => {
    setMemConfig((prev) => ({ ...prev, ...newMemConfig }));
  }, []);

  // Função para armazenar dados do arquivo
  const storeTraceData = useCallback((accesses) => {
    setLoadedTraceData(accesses);
  }, []);

  const initializeSimulator = useCallback(() => {
    try {
      const sim = new CacheSimulator(config, memConfig);
      setSimulator(sim);
      return sim;
    } catch (error) {
      console.error("Erro ao inicializar simulador:", error);
      throw error;
    }
  }, [config, memConfig]);

  const runSingleAccess = useCallback(
    (address, operation) => {
      if (!simulator) {
        throw new Error("Simulador não inicializado");
      }

      try {
        const result = simulator.access(address, operation);
        return result;
      } catch (error) {
        console.error("Erro no acesso:", error);
        throw error;
      }
    },
    [simulator]
  );

  const runSimulation = useCallback(
    async (accesses) => {
      setIsRunning(true);

      try {
        const sim = initializeSimulator();

        for (const access of accesses) {
          sim.access(access.address, access.operation);
        }

        const finalResults = sim.getResults();

        // Garantir que os resultados incluam todas as métricas requeridas
        const enhancedResults = {
          ...finalResults,
          // Certificar que temos todas as saídas requeridas pelo documento
          totalAccesses: accesses.length,
          readAccesses: accesses.filter((a) => a.operation === "R").length,
          writeAccesses: accesses.filter((a) => a.operation === "W").length,
          // Tempo médio de acesso usando a fórmula: hit_time + miss_rate * miss_penalty
          averageAccessTime: calculateAverageAccessTime(
            finalResults,
            config,
            memConfig
          ),
          // Configurações usadas na simulação
          simulationConfig: {
            cache: { ...config },
            memory: { ...memConfig },
          },
        };

        setResults(enhancedResults);
        return enhancedResults;
      } catch (error) {
        console.error("Erro na simulação:", error);
        throw error;
      } finally {
        setIsRunning(false);
      }
    },
    [initializeSimulator, config, memConfig]
  );

  // Função para calcular tempo médio de acesso conforme especificação
  const calculateAverageAccessTime = useCallback(
    (results, cacheConfig, memoryConfig) => {
      if (!results || !isValidNumber(results.statistics.hitRate)) {
        return parseFloat(formatToFourDecimals(0));
      }

      const hitTime = cacheConfig.hitTime || 5;
      const memoryTime = memoryConfig.readTime || 70;
      const missRate = (100 - results.statistics.hitRate) / 100;

      const avgTime = hitTime + missRate * memoryTime;
      return parseFloat(formatToFourDecimals(avgTime));
    },
    []
  );

  const resetSimulation = useCallback(() => {
    setSimulator(null);
    setResults(null);
    setLoadedTraceData(null);
  }, []);

  const getCacheState = useCallback(() => {
    return simulator?.getCacheState() || [];
  }, [simulator]);

  const cacheInfo = useMemo(() => {
    if (!simulator) return null;
    return simulator.decoder.getCacheInfo();
  }, [simulator]);

  const isConfigValid = useMemo(() => {
    const errors = [];

    // Validações conforme especificação do documento
    if (
      config.lineSize <= 0 ||
      (config.lineSize & (config.lineSize - 1)) !== 0
    ) {
      errors.push("Tamanho da linha deve ser potência de 2");
    }

    if (
      config.numLines <= 0 ||
      (config.numLines & (config.numLines - 1)) !== 0
    ) {
      errors.push("Número de linhas deve ser potência de 2");
    }

    if (
      config.associativity <= 0 ||
      (config.associativity & (config.associativity - 1)) !== 0
    ) {
      errors.push("Associatividade deve ser potência de 2");
    }

    if (config.associativity > config.numLines) {
      errors.push("Associatividade não pode ser maior que número de linhas");
    }

    // Validação adicional: associatividade mínima = 1
    if (config.associativity < 1) {
      errors.push("Associatividade deve ser no mínimo 1");
    }

    return { isValid: errors.length === 0, errors };
  }, [config]);

  useEffect(() => {
    if (loadedTraceData && isConfigValid.isValid && !isRunning) {
      setIsAutoRunning(true);

      // Debounce para evitar muitas execuções
      const timeoutId = setTimeout(async () => {
        try {
          await runSimulation(loadedTraceData);
        } catch (error) {
          console.error("Erro na re-simulação:", error);
        } finally {
          setIsAutoRunning(false);
        }
      }, 500); // 500ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [config, memConfig, loadedTraceData, isConfigValid.isValid]);

  // Função para formatar resultados conforme especificação (4 casas decimais)
  const formatResults = useCallback((results) => {
    if (!results) return null;

    return {
      ...results,
      statistics: {
        ...results.statistics,
        hitRate: parseFloat(
          formatToFourDecimals(results.statistics.hitRate || 0)
        ),
        readHitRate: parseFloat(
          formatToFourDecimals(results.statistics.readHitRate || 0)
        ),
        writeHitRate: parseFloat(
          formatToFourDecimals(results.statistics.writeHitRate || 0)
        ),
        averageAccessTime: parseFloat(
          formatToFourDecimals(results.statistics.averageAccessTime || 0)
        ),

        totalAccesses: parseInt(results.statistics.totalAccesses) || 0,
        readAccesses: parseInt(results.statistics.readAccesses) || 0,
        writeAccesses: parseInt(results.statistics.writeAccesses) || 0,
        hits: parseInt(results.statistics.hits) || 0,
        misses: parseInt(results.statistics.misses) || 0,
        readHits: parseInt(results.statistics.readHits) || 0,
        readMisses: parseInt(results.statistics.readMisses) || 0,
        writeHits: parseInt(results.statistics.writeHits) || 0,
        writeMisses: parseInt(results.statistics.writeMisses) || 0,
        memoryReads: parseInt(results.statistics.memoryReads) || 0,
        memoryWrites: parseInt(results.statistics.memoryWrites) || 0,
      },
    };
  }, []);

  return {
    // Estado
    config,
    memConfig,
    simulator,
    isRunning,
    results: formatResults(results),
    cacheInfo,
    isConfigValid,
    loadedTraceData,
    isAutoRunning,

    // Ações
    updateConfig,
    updateMemoryConfig,
    initializeSimulator,
    runSingleAccess,
    runSimulation,
    resetSimulation,
    getCacheState,
    storeTraceData,

    // Utilitários (cálculos conforme especificação)
    cacheSize: config.numLines * config.lineSize,
    numSets: config.numLines / config.associativity,

    // Função auxiliar para experimentos
    calculateAverageAccessTime,
    formatResults,
  };
}
