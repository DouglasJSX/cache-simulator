// src/core/utils/statistics.js
import {
  createExperimentResult,
  createChartDataPoint,
} from "../types/cache.types.js";

export class StatisticsCalculator {
  static calculateAverageAccessTime(hitRate, hitTime, memoryTime) {
    const hitRateDecimal = hitRate / 100;
    const missRate = 1 - hitRateDecimal;
    return hitTime + missRate * memoryTime;
  }

  static calculateHitRate(hits, totalAccesses) {
    return totalAccesses > 0 ? (hits / totalAccesses) * 100 : 0;
  }

  static roundToDecimals(value, decimals = 4) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  static formatStatistics(stats) {
    return {
      ...stats,
      hitRate: this.roundToDecimals(stats.hitRate),
      readHitRate: this.roundToDecimals(stats.readHitRate),
      writeHitRate: this.roundToDecimals(stats.writeHitRate),
      averageAccessTime: this.roundToDecimals(stats.averageAccessTime),
    };
  }

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

    summary.averageHitRate = this.roundToDecimals(
      totalHitRate / results.length
    );
    summary.averageAccessTime = this.roundToDecimals(
      totalAccessTime / results.length
    );

    return summary;
  }

  static prepareChartData(results, xParameter, yParameter = "hitRate") {
    return results.map((result) => {
      const xValue = this.extractParameterValue(result, xParameter);
      const yValue = this.extractParameterValue(result, yParameter);

      return createChartDataPoint(xValue, yValue, `${xParameter}: ${xValue}`);
    });
  }

  static extractParameterValue(result, parameter) {
    const config = result.configuration;
    const stats = result.statistics;

    switch (parameter) {
      case "cacheSize":
        return (config.numLines * config.lineSize) / 1024; // KB
      case "lineSize":
        return config.lineSize;
      case "associativity":
        return config.associativity;
      case "numLines":
        return config.numLines;
      case "hitRate":
        return this.roundToDecimals(stats.hitRate);
      case "averageAccessTime":
        return this.roundToDecimals(stats.averageAccessTime);
      case "memoryReads":
        return stats.memoryReads;
      case "memoryWrites":
        return stats.memoryWrites;
      default:
        return config[parameter] || stats[parameter] || 0;
    }
  }

  static generateComparisonTable(results, parameters) {
    const headers = ["Configuração", ...parameters];
    const rows = results.map((result, index) => {
      const row = [`Config ${index + 1}`];
      parameters.forEach((param) => {
        const value = this.extractParameterValue(result, param);
        row.push(this.formatValue(value, param));
      });
      return row;
    });

    return { headers, rows };
  }

  static formatValue(value, parameter) {
    if (parameter.includes("Rate") || parameter.includes("HitRate")) {
      return `${this.roundToDecimals(value, 2)}%`;
    }
    if (parameter.includes("Time")) {
      return `${this.roundToDecimals(value, 2)}ns`;
    }
    if (parameter.includes("Size")) {
      return value >= 1024 ? `${(value / 1024).toFixed(1)}KB` : `${value}B`;
    }
    return value.toString();
  }

  static calculateMemoryTraffic(results) {
    return results.map((result) => ({
      configuration: this.getConfigDescription(result.configuration),
      memoryReads: result.statistics.memoryReads,
      memoryWrites: result.statistics.memoryWrites,
      totalTraffic:
        result.statistics.memoryReads + result.statistics.memoryWrites,
      hitRate: this.roundToDecimals(result.statistics.hitRate),
    }));
  }

  static getConfigDescription(config) {
    const size = (config.numLines * config.lineSize) / 1024;
    return `${size}KB, ${config.lineSize}B block, ${config.associativity}-way`;
  }
}
