// src/app/simulator/page.jsx
"use client";

import React, { useState } from "react";
import { ConfigPanel } from "../../components/simulator/ConfigPanel";
import { MemoryAddressInput } from "../../components/simulator/MemoryAddressInput";
import { CacheVisualizer } from "../../components/simulator/CacheVisualizer";
import { StatsDisplay } from "../../components/simulator/StatsDisplay";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useCache } from "../../hooks/useCache";
import { FileParser } from "../../core/utils/fileParser";
import { RotateCcw, Download } from "lucide-react";

export default function SimulatorPage() {
  const {
    config,
    memConfig,
    simulator,
    isRunning,
    results,
    cacheInfo,
    isConfigValid,
    updateConfig,
    updateMemoryConfig,
    initializeSimulator,
    runSingleAccess,
    runSimulation,
    resetSimulation,
    getCacheState,
  } = useCache();

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

      await runSimulation(accesses);

      // Adiciona acessos ao histórico
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Simulador de Cache</h1>
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

          {/* Quick Stats */}
          {accessHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Total de Acessos</div>
                    <div className="text-xl font-bold">
                      {accessHistory.length}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Taxa de Hit Atual</div>
                    <div className="text-xl font-bold text-green-600">
                      {accessHistory.length > 0
                        ? (
                            (accessHistory.filter((a) => a.hit).length /
                              accessHistory.length) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
