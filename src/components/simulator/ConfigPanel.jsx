// src/components/simulator/ConfigPanel.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import {
  WritePolicy,
  ReplacementPolicy,
} from "../../core/types/cache.types.js";

export function ConfigPanel({
  config,
  memConfig,
  onConfigChange,
  onMemConfigChange,
  onReset,
  isValid,
  disabled = false,
}) {
  const handleCacheConfigChange = (field, value) => {
    const numValue =
      field !== "writePolicy" && field !== "replacementPolicy"
        ? parseInt(value) || 0
        : value;
    onConfigChange({ [field]: numValue });
  };

  const handleMemoryConfigChange = (field, value) => {
    onMemConfigChange({ [field]: parseInt(value) || 0 });
  };

  const getPowerOfTwoOptions = (min, max) => {
    const options = [];
    for (let i = min; i <= max; i *= 2) {
      options.push(i);
    }
    return options;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração da Cache</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isValid.isValid && (
          <Alert variant="destructive">
            <AlertDescription>{isValid.errors.join(", ")}</AlertDescription>
          </Alert>
        )}

        {/* Configurações da Cache */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lineSize">Tamanho da Linha (bytes)</Label>
            <Select
              value={config.lineSize.toString()}
              onValueChange={(value) =>
                handleCacheConfigChange("lineSize", value)
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getPowerOfTwoOptions(8, 4096).map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="numLines">Número de Linhas</Label>
            <Select
              value={config.numLines.toString()}
              onValueChange={(value) =>
                handleCacheConfigChange("numLines", value)
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getPowerOfTwoOptions(8, 1024).map((lines) => (
                  <SelectItem key={lines} value={lines.toString()}>
                    {lines}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="associativity">Associatividade</Label>
            <Select
              value={config.associativity.toString()}
              onValueChange={(value) =>
                handleCacheConfigChange("associativity", value)
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getPowerOfTwoOptions(1, Math.min(64, config.numLines)).map(
                  (assoc) => (
                    <SelectItem key={assoc} value={assoc.toString()}>
                      {assoc}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="hitTime">Tempo de Hit (ns)</Label>
            <Input
              id="hitTime"
              type="number"
              value={config.hitTime}
              onChange={(e) =>
                handleCacheConfigChange("hitTime", e.target.value)
              }
              disabled={disabled}
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="writePolicy">Política de Escrita</Label>
            <Select
              value={config.writePolicy.toString()}
              onValueChange={(value) =>
                handleCacheConfigChange("writePolicy", parseInt(value))
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WritePolicy.WRITE_THROUGH.toString()}>
                  Write-Through
                </SelectItem>
                <SelectItem value={WritePolicy.WRITE_BACK.toString()}>
                  Write-Back
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="replacementPolicy">Política de Substituição</Label>
            <Select
              value={config.replacementPolicy}
              onValueChange={(value) =>
                handleCacheConfigChange("replacementPolicy", value)
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ReplacementPolicy.LRU}>LRU</SelectItem>
                <SelectItem value={ReplacementPolicy.RANDOM}>
                  Aleatório
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Configurações da Memória */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Configuração da Memória</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="readTime">Tempo de Leitura (ns)</Label>
              <Input
                id="readTime"
                type="number"
                value={memConfig.readTime}
                onChange={(e) =>
                  handleMemoryConfigChange("readTime", e.target.value)
                }
                disabled={disabled}
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="writeTime">Tempo de Escrita (ns)</Label>
              <Input
                id="writeTime"
                type="number"
                value={memConfig.writeTime}
                onChange={(e) =>
                  handleMemoryConfigChange("writeTime", e.target.value)
                }
                disabled={disabled}
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Informações da Cache */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Informações Calculadas</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              Tamanho Total:{" "}
              {((config.numLines * config.lineSize) / 1024).toFixed(1)} KB
            </p>
            <p>Número de Conjuntos: {config.numLines / config.associativity}</p>
            <p>Linhas por Conjunto: {config.associativity}</p>
          </div>
        </div>

        {onReset && (
          <Button
            variant="outline"
            onClick={onReset}
            disabled={disabled}
            className="w-full"
          >
            Resetar Configuração
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
