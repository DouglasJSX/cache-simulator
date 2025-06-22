// src/hooks/useCache.js
import { useState, useCallback, useMemo } from "react";
import { CacheSimulator } from "../core/cache/CacheSimulator.js";
import {
  createCacheConfiguration,
  createMemoryConfiguration,
  WritePolicy,
  ReplacementPolicy,
} from "../core/types/cache.types.js";

export function useCache() {
  const [config, setConfig] = useState(() => createCacheConfiguration());
  const [memConfig, setMemConfig] = useState(() => createMemoryConfiguration());
  const [simulator, setSimulator] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const updateConfig = useCallback((newConfig) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const updateMemoryConfig = useCallback((newMemConfig) => {
    setMemConfig((prev) => ({ ...prev, ...newMemConfig }));
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
        setResults(finalResults);

        return finalResults;
      } catch (error) {
        console.error("Erro na simulação:", error);
        throw error;
      } finally {
        setIsRunning(false);
      }
    },
    [initializeSimulator]
  );

  const resetSimulation = useCallback(() => {
    setSimulator(null);
    setResults(null);
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

    return { isValid: errors.length === 0, errors };
  }, [config]);

  return {
    // Estado
    config,
    memConfig,
    simulator,
    isRunning,
    results,
    cacheInfo,
    isConfigValid,

    // Ações
    updateConfig,
    updateMemoryConfig,
    initializeSimulator,
    runSingleAccess,
    runSimulation,
    resetSimulation,
    getCacheState,

    // Utilitários
    cacheSize: config.numLines * config.lineSize,
    numSets: config.numLines / config.associativity,
  };
}
