import { CacheLine } from "./CacheLine.js";
import { AddressDecoder } from "./AddressDecoder.js";
import {
  ReplacementPolicyFactory,
  findLineInSet,
} from "./ReplacementPolicy.js";
import {
  WritePolicy,
  Operation,
  createCacheAccessResult,
  createSimulationStatistics,
} from "../types/cache.types.js";
import {
  formatToFourDecimals,
  formatPercentage,
  formatTime,
  formatInteger,
  isValidNumber,
} from "../utils/formatters.js";

export class CacheSimulator {
  constructor(cacheConfig, memoryConfig) {
    this.config = cacheConfig;
    this.memConfig = memoryConfig;
    this.decoder = new AddressDecoder(cacheConfig);
    this.replacementPolicy = ReplacementPolicyFactory.create(
      cacheConfig.replacementPolicy
    );

    this.initializeCache();
    this.resetStatistics();
    this.timestamp = 0;
  }

  initializeCache() {
    const numSets = this.config.numLines / this.config.associativity;
    this.cache = Array.from({ length: numSets }, () =>
      Array.from(
        { length: this.config.associativity },
        () => new CacheLine(this.config.lineSize)
      )
    );
  }

  resetStatistics() {
    this.stats = createSimulationStatistics();
    this.accesses = [];
  }

  access(address, operation) {
    this.timestamp++;
    const components = this.decoder.decodeAddress(address);
    const result = createCacheAccessResult();

    result.setIndex = components.setIndex;
    result.tag = components.tag;

    const cacheSet = this.cache[components.setIndex];
    const lineIndex = findLineInSet(cacheSet, components.tag);

    this.updateStatistics(operation, lineIndex !== -1);

    if (lineIndex !== -1) {
      // Cache Hit
      result.hit = true;
      result.lineIndex = lineIndex;
      this.handleCacheHit(cacheSet[lineIndex], operation);
    } else {
      // Cache Miss
      result.hit = false;
      this.handleCacheMiss(cacheSet, components, operation, result);
    }

    this.accesses.push(result);
    return result;
  }

  handleCacheHit(cacheLine, operation) {
    cacheLine.updateLastUsed(this.timestamp);

    if (operation === Operation.WRITE) {
      if (this.config.writePolicy === WritePolicy.WRITE_BACK) {
        cacheLine.markDirty(this.timestamp);
      } else {
        // Write-through: escreve na memória
        this.stats.memoryWrites++;
      }
    }
  }

  handleCacheMiss(cacheSet, components, operation, result) {
    const victimIndex = this.replacementPolicy.selectVictim(cacheSet);
    const victimLine = cacheSet[victimIndex];

    // Se linha é dirty no write-back, escreve na memória
    if (
      victimLine.valid &&
      victimLine.dirty &&
      this.config.writePolicy === WritePolicy.WRITE_BACK
    ) {
      this.stats.memoryWrites++;
      result.evictedLine = victimLine.getData();
    }

    // Carrega novo bloco da memória
    this.stats.memoryReads++;
    victimLine.loadData(components.tag, this.timestamp);

    result.lineIndex = victimIndex;

    // Trata escrita em miss
    if (operation === Operation.WRITE) {
      if (this.config.writePolicy === WritePolicy.WRITE_BACK) {
        victimLine.markDirty(this.timestamp);
      } else {
        this.stats.memoryWrites++;
      }
    }
  }

  updateStatistics(operation, isHit) {
    this.stats.totalAccesses++;

    if (operation === Operation.READ) {
      this.stats.readAccesses++;
      if (isHit) this.stats.readHits++;
      else this.stats.readMisses++;
    } else {
      this.stats.writeAccesses++;
      if (isHit) this.stats.writeHits++;
      else this.stats.writeMisses++;
    }

    if (isHit) this.stats.hits++;
    else this.stats.misses++;
  }

  calculateFinalStatistics() {
    const { stats, config, memConfig } = this;

    // Calcula taxas de acerto como NÚMEROS REAIS (4 casas decimais)
    stats.hitRate =
      stats.totalAccesses > 0
        ? parseFloat(
            formatToFourDecimals((stats.hits / stats.totalAccesses) * 100)
          )
        : parseFloat(formatToFourDecimals(0));

    stats.readHitRate =
      stats.readAccesses > 0
        ? parseFloat(
            formatToFourDecimals((stats.readHits / stats.readAccesses) * 100)
          )
        : parseFloat(formatToFourDecimals(0));

    stats.writeHitRate =
      stats.writeAccesses > 0
        ? parseFloat(
            formatToFourDecimals((stats.writeHits / stats.writeAccesses) * 100)
          )
        : parseFloat(formatToFourDecimals(0));

    // Tempo médio de acesso como NÚMERO REAL (4 casas decimais)
    const hitTime = config.hitTime;

    stats.averageAccessTime =
      stats.totalAccesses > 0
        ? parseFloat(
            formatToFourDecimals(
              hitTime +
                (stats.misses / stats.totalAccesses) * memConfig.readTime
            )
          )
        : parseFloat(formatToFourDecimals(0));

    // Garantir que contadores sejam INTEIROS (sem decimais)
    stats.totalAccesses = parseInt(stats.totalAccesses) || 0;
    stats.readAccesses = parseInt(stats.readAccesses) || 0;
    stats.writeAccesses = parseInt(stats.writeAccesses) || 0;
    stats.hits = parseInt(stats.hits) || 0;
    stats.misses = parseInt(stats.misses) || 0;
    stats.readHits = parseInt(stats.readHits) || 0;
    stats.readMisses = parseInt(stats.readMisses) || 0;
    stats.writeHits = parseInt(stats.writeHits) || 0;
    stats.writeMisses = parseInt(stats.writeMisses) || 0;
    stats.memoryReads = parseInt(stats.memoryReads) || 0;
    stats.memoryWrites = parseInt(stats.memoryWrites) || 0;
  }

  getResults() {
    this.calculateFinalStatistics();

    return {
      configuration: { ...this.config, ...this.memConfig },
      statistics: this.stats,
      accesses: this.accesses,
      finalCacheState: this.cache.map((set) =>
        set.map((line) => line.getData())
      ),
    };
  }

  getCacheState() {
    return this.cache.map((set) => set.map((line) => line.getData()));
  }
}
