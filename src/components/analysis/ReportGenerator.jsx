// src/components/analysis/ReportGenerator.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Download,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export function ReportGenerator({
  experimentResults = {},
  className = "",
  onExport,
}) {
  const [reportConfig, setReportConfig] = useState({
    authorName: "",
    groupMembers: "",
    includeCharts: true,
    includeRawData: false,
    includeCode: false,
    additionalNotes: "",
  });

  const [generatingReport, setGeneratingReport] = useState(false);

  const checkDataCompleteness = () => {
    const requiredAnalyses = [
      "cacheSize",
      "blockSize",
      "associativity",
      "replacementPolicy",
      "memoryBandwidth",
    ];

    const completedAnalyses = requiredAnalyses.filter((analysis) => {
      if (analysis === "replacementPolicy") {
        return (
          experimentResults[analysis]?.lruResults?.length > 0 &&
          experimentResults[analysis]?.randomResults?.length > 0
        );
      }
      return experimentResults[analysis]?.results?.length > 0;
    });

    return {
      completed: completedAnalyses,
      missing: requiredAnalyses.filter((a) => !completedAnalyses.includes(a)),
      isComplete: completedAnalyses.length === requiredAnalyses.length,
    };
  };

  const generateMarkdownReport = () => {
    const completeness = checkDataCompleteness();
    const timestamp = new Date().toLocaleString("pt-BR");

    let markdown = `# Análise dos Impactos na Memória Cache

## Resumo

Este trabalho apresenta uma análise abrangente dos parâmetros que influenciam o desempenho de memórias cache, utilizando a arquitetura hipotética Z70 como base de estudo. Foram realizados experimentos sistemáticos avaliando o impacto do tamanho da cache, tamanho do bloco, associatividade, políticas de substituição e largura de banda da memória.

**Palavras-chave:** Memória cache, Arquitetura Z70, Performance de sistemas, Hierarquia de memória.

**Autores:** ${reportConfig.authorName || "Nome do Autor"}
${
  reportConfig.groupMembers
    ? `**Colaboradores:** ${reportConfig.groupMembers}`
    : ""
}
**Instituição:** Universidade de Caxias do Sul - Curso de Ciência da Computação
**Disciplina:** FBI4019 - Fundamentos de Arquitetura de Computadores
**Data:** ${timestamp}

---

## 1. Introdução

A memória cache desempenha papel fundamental na hierarquia de memórias dos sistemas computacionais modernos. Este estudo analisa sistematicamente os principais parâmetros que influenciam o desempenho de caches associativas por conjunto, utilizando como base a arquitetura hipotética Z70.

## 2. Programa de Simulação

### 2.1 Arquitetura do Simulador

O simulador desenvolvido implementa uma cache associativa por conjunto configurável, baseada nos princípios da arquitetura Z70. A estrutura do programa compreende os seguintes módulos principais:

- **CacheSimulator:** Classe central responsável pela coordenação de todas as operações
- **AddressDecoder:** Módulo de decodificação de endereços de 32 bits
- **CacheLine:** Estrutura de dados que representa uma linha individual da cache
- **ReplacementPolicy:** Implementação dos algoritmos LRU e aleatório

### 2.2 Repositório
O código fonte completo está disponível em: [Inserir URL do repositório]

---
`;

    // Adiciona seções de análise
    if (experimentResults.cacheSize?.results) {
      markdown += generateCacheSizeSection(experimentResults.cacheSize);
    }

    if (experimentResults.blockSize?.results) {
      markdown += generateBlockSizeSection(experimentResults.blockSize);
    }

    if (experimentResults.associativity?.results) {
      markdown += generateAssociativitySection(experimentResults.associativity);
    }

    if (experimentResults.replacementPolicy?.lruResults) {
      markdown += generateReplacementPolicySection(
        experimentResults.replacementPolicy
      );
    }

    if (experimentResults.memoryBandwidth?.results) {
      markdown += generateMemoryBandwidthSection(
        experimentResults.memoryBandwidth
      );
    }

    // Conclusões
    markdown += generateConclusionsSection();

    // Tabelas
    markdown += `## Anexo A - Tabelas de Resultados\n\n`;

    Object.entries(experimentResults).forEach(([analysisName, data]) => {
      if (analysisName === "replacementPolicy") {
        if (data.lruResults && data.lruResults.length > 0) {
          markdown += generateResultsTable("LRU", data.lruResults);
        }
        if (data.randomResults && data.randomResults.length > 0) {
          markdown += generateResultsTable("Random", data.randomResults);
        }
      } else if (data.results && data.results.length > 0) {
        markdown += generateResultsTable(analysisName, data.results);
      }
    });

    if (reportConfig.additionalNotes) {
      markdown += `\n## Observações Adicionais\n\n${reportConfig.additionalNotes}\n`;
    }

    return markdown;
  };

  const generateCacheSizeSection = (data) => {
    const maxHitRate = Math.max(
      ...data.results.map((r) => r.statistics.hitRate)
    );
    const minHitRate = Math.min(
      ...data.results.map((r) => r.statistics.hitRate)
    );

    return `## 3. Impacto do Tamanho da Cache

### 3.1 Metodologia Experimental
Esta análise avalia como diferentes tamanhos de cache afetam a taxa de acerto, mantendo fixos:
- Tamanho do bloco: 128 bytes
- Política de escrita: Write-through  
- Algoritmo de substituição: LRU
- Associatividade: 4-way

### 3.2 Resultados
${
  reportConfig.includeCharts
    ? "A Figura 1 apresenta a relação entre tamanho da cache e taxa de acerto.\n"
    : ""
}
A análise demonstra melhoria de ${minHitRate.toFixed(
      1
    )}% até ${maxHitRate.toFixed(1)}% conforme o aumento da capacidade.

### 3.3 Discussão
A curva característica mostra crescimento inicial acentuado seguido de estabilização, indicando retornos diminuídos além de determinado tamanho.

---
`;
  };

  const generateBlockSizeSection = (data) => {
    const optimalResult = data.results.reduce((best, current) =>
      current.statistics.hitRate > best.statistics.hitRate ? current : best
    );

    return `## 4. Impacto do Tamanho do Bloco

### 4.1 Metodologia Experimental
Análise da variação do tamanho do bloco de 8B a 4KB mantendo:
- Cache total: 8KB
- Política de escrita: Write-through
- Algoritmo de substituição: LRU  
- Associatividade: 2-way

### 4.2 Resultados
O tamanho ótimo identificado foi **${
      optimalResult.configuration.lineSize
    } bytes** com ${optimalResult.statistics.hitRate.toFixed(
      1
    )}% de taxa de acerto.

### 4.3 Discussão
O resultado evidencia o trade-off entre localidade espacial e poluição da cache.

---
`;
  };

  const generateAssociativitySection = (data) => {
    const directMapped = data.results.find(
      (r) => r.configuration.associativity === 1
    );
    const fullyAssoc = data.results[data.results.length - 1];

    return `## 5. Impacto da Associatividade

### 5.1 Metodologia Experimental
Comparação de 1-way até 64-way com cache de 8KB, blocos de 128 bytes e política write-back.

### 5.2 Resultados
Evolução de direct-mapped (${directMapped?.statistics.hitRate.toFixed(
      1
    )}%) para fully associative (${fullyAssoc?.statistics.hitRate.toFixed(1)}%).

### 5.3 Discussão
Maior associatividade reduz conflict misses com retornos diminuídos após 8-way.

---
`;
  };

  const generateReplacementPolicySection = (data) => {
    const lruAvg =
      data.lruResults.reduce((sum, r) => sum + r.statistics.hitRate, 0) /
      data.lruResults.length;
    const randomAvg =
      data.randomResults.reduce((sum, r) => sum + r.statistics.hitRate, 0) /
      data.randomResults.length;

    return `## 6. Impacto da Política de Substituição

### 6.1 Metodologia Experimental
Comparação entre LRU e substituição aleatória variando tamanho da cache.

### 6.2 Resultados
LRU demonstrou superioridade com ${lruAvg.toFixed(
      1
    )}% contra ${randomAvg.toFixed(1)}% da substituição aleatória.

### 6.3 Discussão
LRU explora eficientemente a localidade temporal mantendo dados recentes na cache.

---
`;
  };

  const generateMemoryBandwidthSection = (data) => {
    const writeThrough = data.results.filter(
      (r) => r.configuration.writePolicy === 0
    );
    const writeBack = data.results.filter(
      (r) => r.configuration.writePolicy === 1
    );

    const avgWTTraffic =
      writeThrough.reduce(
        (sum, r) => sum + r.statistics.memoryReads + r.statistics.memoryWrites,
        0
      ) / writeThrough.length;
    const avgWBTraffic =
      writeBack.reduce(
        (sum, r) => sum + r.statistics.memoryReads + r.statistics.memoryWrites,
        0
      ) / writeBack.length;

    return `## 7. Largura de Banda da Memória

### 7.1 Metodologia Experimental
Comparação de tráfego entre write-through e write-back em múltiplas configurações.

### 7.2 Resultados
Write-back demonstra redução de ${(
      (1 - avgWBTraffic / avgWTTraffic) *
      100
    ).toFixed(1)}% no tráfego de memória.

### 7.3 Discussão
A redução é obtida através do agrupamento de escritas, minimizando acessos à memória principal.

---
`;
  };

  const generateConclusionsSection = () => {
    return `## 8. Conclusões

### 8.1 Síntese dos Resultados
Esta pesquisa demonstrou quantitativamente o impacto de diferentes parâmetros na performance de memórias cache:

1. **Tamanho da Cache:** Relação direta entre capacidade e taxa de acerto
2. **Tamanho do Bloco:** Existe ponto ótimo entre localidade espacial e eficiência
3. **Associatividade:** Configurações 4-way a 8-way oferecem melhor custo-benefício
4. **Políticas de Substituição:** LRU supera substituição aleatória
5. **Largura de Banda:** Write-back reduz significativamente tráfego de memória

### 8.2 Configuração Recomendada
- Tamanho: 16-32KB
- Bloco: 64-128 bytes  
- Associatividade: 4-way
- Política: Write-back + LRU

## Bibliografia

[1] STALLINGS, William. **Arquitetura e organização de computadores**. 10. ed. São Paulo: Pearson, 2017.

[2] TANENBAUM, Andrew S.; AUSTIN, Todd. **Organização estruturada de computadores**. 6. ed. São Paulo: Pearson, 2013.

[3] MONTEIRO, Mário Antonio. **Introdução à organização de computadores**. 5. ed. Rio de Janeiro: LTC, 2007.

---
`;
  };

  const generateResultsTable = (analysisName, results) => {
    let table = `### Tabela - Resultados ${analysisName}

| Configuração | Taxa de Acerto (%) | Tempo Médio (ns) | Leituras MP | Escritas MP |
|--------------|-------------------|------------------|-------------|-------------|
`;

    results.slice(0, 8).forEach((result) => {
      const config = getConfigDescription(result.configuration, analysisName);
      table += `| ${config} | ${result.statistics.hitRate.toFixed(
        2
      )} | ${result.statistics.averageAccessTime.toFixed(2)} | ${
        result.statistics.memoryReads
      } | ${result.statistics.memoryWrites} |\n`;
    });

    return table + "\n";
  };

  const getConfigDescription = (config, analysisType) => {
    const cacheSize = ((config.numLines * config.lineSize) / 1024).toFixed(1);

    switch (analysisType) {
      case "cacheSize":
        return `${cacheSize}KB`;
      case "blockSize":
        return `${config.lineSize}B`;
      case "associativity":
        return `${config.associativity}-way`;
      case "LRU":
      case "Random":
        return `${cacheSize}KB ${config.replacementPolicy}`;
      case "memoryBandwidth":
        return `${cacheSize}KB ${config.writePolicy === 0 ? "WT" : "WB"}`;
      default:
        return `${cacheSize}KB`;
    }
  };

  const handleExportReport = async () => {
    setGeneratingReport(true);

    try {
      const markdown = generateMarkdownReport();

      const blob = new Blob([markdown], {
        type: "text/markdown;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `TDE2_Relatorio_Cache_${Date.now()}.md`;
      link.click();

      if (onExport) {
        onExport(markdown);
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const completeness = checkDataCompleteness();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Gerador de Relatório TDE 2
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status das análises */}
        <div>
          <h4 className="font-medium mb-3">Status das Análises</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { key: "cacheSize", name: "Tamanho da Cache" },
              { key: "blockSize", name: "Tamanho do Bloco" },
              { key: "associativity", name: "Associatividade" },
              { key: "replacementPolicy", name: "Política de Substituição" },
              { key: "memoryBandwidth", name: "Largura de Banda" },
            ].map((analysis) => (
              <div key={analysis.key} className="flex items-center gap-2">
                {completeness.completed.includes(analysis.key) ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">{analysis.name}</span>
                <Badge
                  variant={
                    completeness.completed.includes(analysis.key)
                      ? "default"
                      : "secondary"
                  }
                >
                  {(() => {
                    if (analysis.key === "replacementPolicy") {
                      const lru =
                        experimentResults[analysis.key]?.lruResults?.length ||
                        0;
                      const random =
                        experimentResults[analysis.key]?.randomResults
                          ?.length || 0;
                      return Math.max(lru, random);
                    }
                    return (
                      experimentResults[analysis.key]?.results?.length || 0
                    );
                  })()}{" "}
                  resultados
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Configuração */}
        <div className="space-y-4">
          <h4 className="font-medium">Configuração do Relatório</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nome do Autor
              </label>
              <Input
                placeholder="Seu nome completo"
                value={reportConfig.authorName}
                onChange={(e) =>
                  setReportConfig((prev) => ({
                    ...prev,
                    authorName: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Membros do Grupo
              </label>
              <Input
                placeholder="Nomes dos integrantes"
                value={reportConfig.groupMembers}
                onChange={(e) =>
                  setReportConfig((prev) => ({
                    ...prev,
                    groupMembers: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Observações Adicionais
            </label>
            <Textarea
              placeholder="Adicione observações ou insights..."
              value={reportConfig.additionalNotes}
              onChange={(e) =>
                setReportConfig((prev) => ({
                  ...prev,
                  additionalNotes: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={reportConfig.includeCharts}
              onChange={(e) =>
                setReportConfig((prev) => ({
                  ...prev,
                  includeCharts: e.target.checked,
                }))
              }
            />
            Incluir referências a gráficos
          </label>
        </div>

        {/* Export */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {completeness.completed.length}/5 análises completas
          </div>

          <Button
            onClick={handleExportReport}
            disabled={generatingReport || reportConfig.authorName.trim() === ""}
          >
            {generatingReport ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
