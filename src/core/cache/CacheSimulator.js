// src/core/cache/CacheSimulator.js
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

    stats.hitRate =
      stats.totalAccesses > 0 ? (stats.hits / stats.totalAccesses) * 100 : 0;

    stats.readHitRate =
      stats.readAccesses > 0 ? (stats.readHits / stats.readAccesses) * 100 : 0;

    stats.writeHitRate =
      stats.writeAccesses > 0
        ? (stats.writeHits / stats.writeAccesses) * 100
        : 0;

    // Tempo médio de acesso
    const hitTime = config.hitTime;
    const missTime = hitTime + memConfig.readTime;

    stats.averageAccessTime =
      stats.totalAccesses > 0
        ? hitTime + (stats.misses / stats.totalAccesses) * memConfig.readTime
        : 0;
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
