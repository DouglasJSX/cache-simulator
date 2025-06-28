import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function CacheVisualizer({
  cacheState,
  cacheInfo,
  lastAccess,
  className = "",
}) {
  if (!cacheState || !cacheInfo) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Visualização da Cache</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Cache não inicializada</p>
        </CardContent>
      </Card>
    );
  }

  const getCellColor = (line, setIndex, lineIndex) => {
    if (!line.valid) return "bg-gray-100 border-gray-200";

    if (
      lastAccess &&
      lastAccess.setIndex === setIndex &&
      lastAccess.lineIndex === lineIndex
    ) {
      return lastAccess.hit
        ? "bg-green-200 border-green-400 animate-pulse"
        : "bg-red-200 border-red-400 animate-pulse";
    }

    // Estados normais
    if (line.dirty) return "bg-yellow-100 border-yellow-300";
    return "bg-blue-100 border-blue-300";
  };

  const formatTag = (tag) => {
    return `0x${tag.toString(16).toUpperCase().padStart(4, "0")}`;
  };

  const formatLastUsed = (timestamp) => {
    return timestamp > 0 ? `#${timestamp}` : "-";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Visualização da Cache</CardTitle>
        <div className="text-sm text-gray-600">
          {cacheInfo.numSets} conjuntos × {cacheInfo.associativity} linhas ={" "}
          {cacheInfo.numLines} linhas totais
        </div>
      </CardHeader>
      <CardContent>
        {/* Legenda */}
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Inválida</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Válida/Limpa</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Válida/Dirty</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
            <span>Último Hit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-200 border border-red-400 rounded"></div>
            <span>Último Miss</span>
          </div>
        </div>

        {/* Visualização da Cache */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {cacheState.map((cacheSet, setIndex) => (
            <div key={setIndex} className="border rounded-lg p-3 w-max">
              {/* Cabeçalho do Conjunto */}
              <div className="flex justify-between items-center mb-2">
                <Badge variant="outline" className="text-xs">
                  Conjunto {setIndex}
                </Badge>
                <span className="text-xs text-gray-500">
                  {cacheSet.filter((line) => line.valid).length}/
                  {cacheSet.length} ocupadas
                </span>
              </div>

              {/* Linhas do Conjunto */}
              <div
                className="grid gap-2 h-full w-full"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(
                    cacheInfo.associativity,
                    4
                  )}, 1fr)`,
                }}
              >
                {cacheSet.map((line, lineIndex) => (
                  <TooltipProvider key={lineIndex}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          className={`
                          p-2 border-2 rounded text-xs transition-all duration-300 h-full w-full
                          ${getCellColor(line, setIndex, lineIndex)}
                        `}
                        >
                          <div className="font-mono font-bold">
                            L{lineIndex}
                          </div>

                          {line.valid ? (
                            <div className="space-y-1 mt-1">
                              <div className="truncate">
                                Rótulo: {formatTag(line.tag)}
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>{line.dirty ? "D" : "C"}</span>
                                <span>{formatLastUsed(line.lastUsed)}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 mt-1">Vazia</div>
                          )}
                        </div>
                      </TooltipTrigger>

                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <div>
                            <strong>Conjunto:</strong> {setIndex}
                          </div>
                          <div>
                            <strong>Linha:</strong> {lineIndex}
                          </div>
                          {line.valid ? (
                            <>
                              <div>
                                <strong>Rótulo:</strong> {formatTag(line.tag)}
                              </div>
                              <div>
                                <strong>Estado:</strong>{" "}
                                {line.dirty ? "Dirty" : "Clean"}
                              </div>
                              <div>
                                <strong>Último Uso:</strong>{" "}
                                {formatLastUsed(line.lastUsed)}
                              </div>
                              <div>
                                <strong>Endereço Base:</strong> 0x
                                {(
                                  line.tag <<
                                  (cacheInfo.setBits + cacheInfo.offsetBits)
                                )
                                  .toString(16)
                                  .toUpperCase()}
                              </div>
                            </>
                          ) : (
                            <div>
                              <strong>Estado:</strong> Inválida
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 pt-4 border-t space-y-2 text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Configuração:</strong>
              <div>Linha: {cacheInfo.lineSize} bytes</div>
              <div>Rótulo: {cacheInfo.tagBits} bits</div>
            </div>
            <div>
              <strong>Organização:</strong>
              <div>Conjunto: {cacheInfo.setBits} bits</div>
              <div>Palavra: {cacheInfo.offsetBits} bits</div>
            </div>
          </div>

          {lastAccess && (
            <div className="mt-3 p-2 bg-gray-50 rounded">
              <strong>Último Acesso:</strong>
              <div>
                Endereço: 0x
                {lastAccess.originalAddress?.toString(16).toUpperCase()}
              </div>
              <div>
                Rótulo: {formatTag(lastAccess.tag)} | Conjunto:{" "}
                {lastAccess.setIndex} | Resultado:{" "}
                {lastAccess.hit ? "HIT" : "MISS"}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
