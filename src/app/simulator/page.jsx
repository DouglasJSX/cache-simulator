"use client";

import React, { useState } from "react";
import { ConfigPanel } from "../../components/simulator/ConfigPanel";
import { MemoryAddressInput } from "../../components/simulator/MemoryAddressInput";
import { CacheVisualizer } from "../../components/simulator/CacheVisualizer";
import { StatsDisplay } from "../../components/simulator/StatsDisplay";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useCache } from "../../hooks/useCache";
import { FileParser } from "../../core/utils/fileParser";
import { RotateCcw } from "lucide-react";

export default function SimulatorPage() {
  const {
    config,
    memConfig,
    simulator,
    isRunning,
    results,
    cacheInfo,
    isConfigValid,
    loadedTraceData,
    isAutoRunning,
    updateConfig,
    updateMemoryConfig,
    initializeSimulator,
    runSingleAccess,
    runSimulation,
    resetSimulation,
    getCacheState,
    storeTraceData,
  } = useCache();

  console.log(results);

  const [accessHistory, setAccessHistory] = useState([]);
  const [lastAccess, setLastAccess] = useState(null);
  const [error, setError] = useState("");

  const handleSingleAccess = async (address, operation) => {
    try {
      if (!simulator) {
        initializeSimulator();
      }

      const result = runSingleAccess(address, operation);

      const accessInfo = {
        address,
        operation,
        hit: result.hit,
        setIndex: result.setIndex,
        lineIndex: result.lineIndex,
        timestamp: Date.now(),
      };

      setAccessHistory((prev) => [...prev, accessInfo]);
      setLastAccess({ ...result, originalAddress: parseInt(address, 16) });
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileLoad = async (fileContent) => {
    try {
      const accesses = FileParser.parseTraceFile(fileContent);

      if (accesses.length === 0) {
        throw new Error("Nenhum acesso válido encontrado no arquivo");
      }

      storeTraceData(accesses);

      await runSimulation(accesses);

      const newHistory = accesses.map((access, index) => ({
        address: access.address,
        operation: access.operation,
        hit: results?.accesses?.[index]?.hit || false,
        timestamp: Date.now() + index,
      }));

      setAccessHistory((prev) => [...prev, ...newHistory]);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = () => {
    resetSimulation();
    setAccessHistory([]);
    setLastAccess(null);
    setError("");
  };

  const handleClearHistory = () => {
    setAccessHistory([]);
    setLastAccess(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-5 md:gap-0 justify-between items-center text-center md:text-start">
        <div>
          <h1 className="text-3xl font-bold pb-4 md:pb-0">
            Simulador de Cache
          </h1>
          <p className="text-gray-600">
            Simule e analise o comportamento de diferentes configurações de
            cache
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isAutoRunning && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Recalculando com nova configuração...
          </AlertDescription>
        </Alert>
      )}
      {loadedTraceData && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          {loadedTraceData.length} acessos carregados - Mudanças de configuração
          serão aplicadas automaticamente
        </div>
      )}
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          <ConfigPanel
            config={config}
            memConfig={memConfig}
            onConfigChange={updateConfig}
            onMemConfigChange={updateMemoryConfig}
            onReset={() => {
              updateConfig({
                writePolicy: 0,
                lineSize: 64,
                numLines: 64,
                associativity: 4,
                hitTime: 5,
                replacementPolicy: "LRU",
              });
              updateMemoryConfig({
                readTime: 70,
                writeTime: 70,
              });
            }}
            isValid={isConfigValid}
            disabled={isRunning}
            hasLoadedData={!!loadedTraceData}
          />

          <MemoryAddressInput
            onSingleAccess={handleSingleAccess}
            onFileLoad={handleFileLoad}
            onClearHistory={handleClearHistory}
            disabled={isRunning || !isConfigValid.isValid}
            accessHistory={accessHistory}
          />
        </div>

        {/* Middle Column - Visualization */}
        <div className="space-y-6">
          <CacheVisualizer
            cacheState={getCacheState()}
            cacheInfo={cacheInfo}
            lastAccess={lastAccess}
          />
        </div>

        {/* Right Column - Statistics */}
        <div>
          <StatsDisplay
            statistics={results?.statistics}
            configuration={results?.configuration}
          />
        </div>
      </div>
    </div>
  );
}
