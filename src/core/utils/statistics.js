import { createChartDataPoint } from "../types/cache.types.js";
import {
  formatToFourDecimals,
  formatPercentage,
  formatTime,
  formatInteger,
  formatBytes,
  formatHitRateWithCount,
  formatCacheSize,
  formatAssociativity,
  formatWritePolicy,
  formatByType,
  isValidNumber,
} from "./formatters.js";

export class StatisticsCalculator {
  static calculateAverageAccessTime(hitRate, hitTime, memoryTime) {
    if (
      !isValidNumber(hitRate) ||
      !isValidNumber(hitTime) ||
      !isValidNumber(memoryTime)
    ) {
      return 0;
    }
    const hitRateDecimal = hitRate / 100;
    const missRate = 1 - hitRateDecimal;
    return hitTime + missRate * memoryTime;
  }

  static calculateHitRate(hits, totalAccesses) {
    if (
      !isValidNumber(hits) ||
      !isValidNumber(totalAccesses) ||
      totalAccesses === 0
    ) {
      return 0;
    }
    return (hits / totalAccesses) * 100;
  }

  static roundToDecimals(value, decimals = 4) {
    if (!isValidNumber(value)) {
      return 0;
    }
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Formata estatísticas conforme especificação do TDE 2
   * Números reais = 4 casas decimais | Inteiros = sem decimais
   */
  static formatStatistics(stats) {
    return {
      ...stats,
      // NÚMEROS REAIS (4 casas decimais)
      hitRate: formatToFourDecimals(stats.hitRate || 0),
      readHitRate: formatToFourDecimals(stats.readHitRate || 0),
      writeHitRate: formatToFourDecimals(stats.writeHitRate || 0),
      averageAccessTime: formatToFourDecimals(stats.averageAccessTime || 0),

      // Formatação para relatório com contadores
      hitRateWithCount: formatHitRateWithCount(
        stats.hitRate || 0,
        stats.hits || 0,
        stats.totalAccesses || 0
      ),
      readHitRateWithCount: formatHitRateWithCount(
        stats.readHitRate || 0,
        stats.readHits || 0,
        stats.readAccesses || 0
      ),
      writeHitRateWithCount: formatHitRateWithCount(
        stats.writeHitRate || 0,
        stats.writeHits || 0,
        stats.writeAccesses || 0
      ),

      // NÚMEROS INTEIROS (sem decimais)
      totalAccesses: formatInteger(stats.totalAccesses || 0),
      readAccesses: formatInteger(stats.readAccesses || 0),
      writeAccesses: formatInteger(stats.writeAccesses || 0),
      hits: formatInteger(stats.hits || 0),
      misses: formatInteger(stats.misses || 0),
      readHits: formatInteger(stats.readHits || 0),
      readMisses: formatInteger(stats.readMisses || 0),
      writeHits: formatInteger(stats.writeHits || 0),
      writeMisses: formatInteger(stats.writeMisses || 0),
      memoryReads: formatInteger(stats.memoryReads || 0),
      memoryWrites: formatInteger(stats.memoryWrites || 0),
    };
  }

  /**
   * Cria resumo com formatação adequada
   */
  static createExperimentSummary(results) {
    const summary = {
      totalExperiments: results.length,
      averageHitRate: 0,
      averageAccessTime: 0,
      bestConfiguration: null,
      worstConfiguration: null,
    };

    if (results.length === 0) return summary;

    let bestHitRate = -1;
    let worstHitRate = 101;
    let totalHitRate = 0;
    let totalAccessTime = 0;

    results.forEach((result) => {
      const hitRate = result.statistics.hitRate;
      totalHitRate += hitRate;
      totalAccessTime += result.statistics.averageAccessTime;

      if (hitRate > bestHitRate) {
        bestHitRate = hitRate;
        summary.bestConfiguration = result;
      }

      if (hitRate < worstHitRate) {
        worstHitRate = hitRate;
        summary.worstConfiguration = result;
      }
    });

    // Médias são NÚMEROS REAIS = 4 casas decimais
    summary.averageHitRate = formatToFourDecimals(
      totalHitRate / results.length
    );
    summary.averageAccessTime = formatToFourDecimals(
      totalAccessTime / results.length
    );

    return summary;
  }

  /**
   * Prepara dados para gráficos
   */
  static prepareChartData(results, xParameter, yParameter = "hitRate") {
    return results.map((result) => {
      const xValue = this.extractParameterValue(result, xParameter);
      const yValue = this.extractParameterValue(result, yParameter);

      return createChartDataPoint(xValue, yValue, `${xParameter}: ${xValue}`);
    });
  }

  /**
   * Extrai valores com formatação correta
   */
  static extractParameterValue(result, parameter) {
    const config = result.configuration;
    const stats = result.statistics;

    switch (parameter) {
      case "cacheSize":
        return Math.round((config.numLines * config.lineSize) / 1024);
      case "lineSize":
        return config.lineSize;
      case "associativity":
        return config.associativity;
      case "hitRate":
        return parseFloat(formatToFourDecimals(stats.hitRate || 0));
      case "averageAccessTime":
        return parseFloat(formatToFourDecimals(stats.averageAccessTime || 0));
      default:
        return config[parameter] || stats[parameter] || 0;
    }
  }

  /**
   * Formata valores conforme o tipo
   */
  static formatValue(value, parameter) {
    if (!isValidNumber(value)) {
      return parameter.includes("Rate") || parameter.includes("Time")
        ? "0.0000"
        : "0";
    }

    return formatByType(value, parameter);
  }

  /**
   * Calcula tráfego de memória formatado
   */
  static calculateMemoryTraffic(results) {
    return results.map((result) => ({
      configuration: this.getConfigDescription(result.configuration),
      memoryReads: formatInteger(result.statistics.memoryReads || 0),
      memoryWrites: formatInteger(result.statistics.memoryWrites || 0),
      totalTraffic: formatInteger(
        (result.statistics.memoryReads || 0) +
          (result.statistics.memoryWrites || 0)
      ),
      hitRate: formatPercentage(result.statistics.hitRate || 0),
    }));
  }

  /**
   * Descrição da configuração
   */
  static getConfigDescription(config) {
    const size = formatCacheSize(config.numLines, config.lineSize);
    const lineSize = formatBytes(config.lineSize);
    const assoc = formatAssociativity(config.associativity);
    return `${size}, ${lineSize} block, ${assoc}`;
  }

  /**
   * Gera relatório TDE 2 com formatação EXATA da especificação
   */
  static generateTDE2Report(result) {
    const config = result.configuration;
    const stats = result.statistics;

    return {
      // Parâmetros de entrada (inteiros quando apropriado)
      parametros: {
        politicaEscrita: formatWritePolicy(config.writePolicy),
        tamanhoLinha: formatBytes(config.lineSize),
        numeroLinhas: formatInteger(config.numLines),
        associatividade: formatAssociativity(config.associativity),
        tempoHit: formatTime(config.hitTime), // NÚMERO REAL
        politicaSubstituicao: config.replacementPolicy,
        tempoLeituraMP: formatTime(config.readTime || 70), // NÚMERO REAL
        tempoEscritaMP: formatTime(config.writeTime || 70), // NÚMERO REAL
      },

      // Total de endereços (INTEIROS)
      totalEnderecos: {
        total: formatInteger(stats.totalAccesses || 0),
        leituras: formatInteger(stats.readAccesses || 0),
        escritas: formatInteger(stats.writeAccesses || 0),
      },

      // Acessos à memória principal (INTEIROS)
      acessosMemoriaPrincipal: {
        leituras: formatInteger(stats.memoryReads || 0),
        escritas: formatInteger(stats.memoryWrites || 0),
      },

      // Taxas de acerto (NÚMEROS REAIS) com contadores (INTEIROS)
      taxasAcerto: {
        leitura: formatHitRateWithCount(
          stats.readHitRate || 0,
          stats.readHits || 0,
          stats.readAccesses || 0
        ),
        escrita: formatHitRateWithCount(
          stats.writeHitRate || 0,
          stats.writeHits || 0,
          stats.writeAccesses || 0
        ),
        global: formatHitRateWithCount(
          stats.hitRate || 0,
          stats.hits || 0,
          stats.totalAccesses || 0
        ),
      },

      // Tempo médio de acesso (NÚMERO REAL)
      tempoMedioAcesso: formatTime(stats.averageAccessTime || 0),
    };
  }
}
