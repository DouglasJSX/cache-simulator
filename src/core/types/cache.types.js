// src/core/types/cache.types.js

// Enums para políticas e operações
export const WritePolicy = {
  WRITE_THROUGH: 0,
  WRITE_BACK: 1,
};

export const ReplacementPolicy = {
  LRU: "LRU",
  RANDOM: "RANDOM",
};

export const Operation = {
  READ: "R",
  WRITE: "W",
};

export const CacheState = {
  INVALID: "INVALID",
  VALID_CLEAN: "VALID_CLEAN",
  VALID_DIRTY: "VALID_DIRTY",
};

export const AccessType = {
  HIT: "HIT",
  MISS: "MISS",
  COMPULSORY_MISS: "COMPULSORY_MISS",
  CAPACITY_MISS: "CAPACITY_MISS",
  CONFLICT_MISS: "CONFLICT_MISS",
};

// Validadores de configuração
export const validateCacheConfig = (config) => {
  const errors = [];

  if (!isPowerOfTwo(config.lineSize)) {
    errors.push("Tamanho da linha deve ser potência de 2");
  }

  if (!isPowerOfTwo(config.numLines)) {
    errors.push("Número de linhas deve ser potência de 2");
  }

  if (!isPowerOfTwo(config.associativity)) {
    errors.push("Associatividade deve ser potência de 2");
  }

  if (config.associativity > config.numLines) {
    errors.push("Associatividade não pode ser maior que o número de linhas");
  }

  if (config.lineSize < 8 || config.lineSize > 4096) {
    errors.push("Tamanho da linha deve estar entre 8 e 4096 bytes");
  }

  if (config.numLines < 1 || config.numLines > 16384) {
    errors.push("Número de linhas deve estar entre 1 e 16384");
  }

  if (config.hitTime <= 0) {
    errors.push("Tempo de hit deve ser positivo");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateMemoryConfig = (config) => {
  const errors = [];

  if (config.readTime <= 0) {
    errors.push("Tempo de leitura deve ser positivo");
  }

  if (config.writeTime <= 0) {
    errors.push("Tempo de escrita deve ser positivo");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Função auxiliar para verificar potência de 2
export const isPowerOfTwo = (n) => {
  return n > 0 && (n & (n - 1)) === 0;
};

// Factory functions para criar objetos padronizados
export const createCacheConfiguration = (config = {}) => {
  const defaultConfig = {
    writePolicy: WritePolicy.WRITE_THROUGH,
    lineSize: 64,
    numLines: 64,
    associativity: 4,
    hitTime: 5,
    replacementPolicy: ReplacementPolicy.LRU,
  };

  const finalConfig = { ...defaultConfig, ...config };
  const validation = validateCacheConfig(finalConfig);

  return {
    ...finalConfig,
    isValid: validation.isValid,
    errors: validation.errors,
  };
};

export const createMemoryConfiguration = (config = {}) => {
  const defaultConfig = {
    readTime: 70,
    writeTime: 70,
  };

  const finalConfig = { ...defaultConfig, ...config };
  const validation = validateMemoryConfig(finalConfig);

  return {
    ...finalConfig,
    isValid: validation.isValid,
    errors: validation.errors,
  };
};

export const createMemoryAccess = (address, operation, lineNumber = null) => {
  // Valida endereço
  if (
    typeof address !== "string" ||
    !/^[0-9a-fA-F]+$/.test(address.replace(/^0x/i, ""))
  ) {
    throw new Error(`Endereço inválido: ${address}`);
  }

  // Valida operação
  if (!Object.values(Operation).includes(operation)) {
    throw new Error(`Operação inválida: ${operation}`);
  }

  return {
    address: address.replace(/^0x/i, "").toUpperCase().padStart(8, "0"),
    operation,
    lineNumber,
    timestamp: Date.now(),
  };
};

export const createCacheLineData = (lineSize = 64) => ({
  valid: false,
  dirty: false,
  tag: 0,
  data: new Uint8Array(lineSize),
  lastUsed: 0,
  accessCount: 0,
  state: CacheState.INVALID,
});

export const createAddressComponents = (address = 0) => ({
  tag: 0,
  setIndex: 0,
  blockOffset: 0,
  originalAddress: address,
  hexAddress: address.toString(16).toUpperCase().padStart(8, "0"),
});

export const createCacheAccessResult = (hit = false) => ({
  hit,
  lineIndex: null,
  setIndex: 0,
  tag: 0,
  evictedLine: null,
  memoryAccesses: [],
  accessType: hit ? AccessType.HIT : AccessType.MISS,
  timestamp: Date.now(),
  cycleCount: 0,
});

export const createMemoryAccessInfo = (type, address, time) => ({
  type, // 'read' ou 'write'
  address,
  time,
  timestamp: Date.now(),
});

export const createSimulationStatistics = () => ({
  totalAccesses: 0,
  readAccesses: 0,
  writeAccesses: 0,
  hits: 0,
  misses: 0,
  readHits: 0,
  readMisses: 0,
  writeHits: 0,
  writeMisses: 0,
  memoryReads: 0,
  memoryWrites: 0,
  hitRate: 0,
  readHitRate: 0,
  writeHitRate: 0,
  averageAccessTime: 0,
  totalCycles: 0,
  compulsoryMisses: 0,
  capacityMisses: 0,
  conflictMisses: 0,
});

export const createSimulationResult = (config, memConfig) => ({
  configuration: { ...config, ...memConfig },
  statistics: createSimulationStatistics(),
  accesses: [],
  finalCacheState: [],
  executionTime: 0,
  startTime: null,
  endTime: null,
  metadata: {
    cacheSize: config.numLines * config.lineSize,
    numSets: config.numLines / config.associativity,
    tagBits: 0,
    setBits: 0,
    offsetBits: 0,
  },
});

export const createExperimentResult = (parameter, value, stats = null) => ({
  parameter,
  value,
  hitRate: stats?.hitRate || 0,
  averageAccessTime: stats?.averageAccessTime || 0,
  memoryReads: stats?.memoryReads || 0,
  memoryWrites: stats?.memoryWrites || 0,
  totalTraffic: (stats?.memoryReads || 0) + (stats?.memoryWrites || 0),
  timestamp: Date.now(),
});

export const createChartDataPoint = (x, y, label = null, metadata = {}) => ({
  x,
  y,
  label: label || `${x}`,
  metadata,
  timestamp: Date.now(),
});

export const createExperimentBatch = (name, description, configs = []) => ({
  name,
  description,
  configs,
  results: [],
  status: "PENDING", // PENDING, RUNNING, COMPLETED, ERROR
  progress: 0,
  startTime: null,
  endTime: null,
  totalExperiments: configs.length,
});

// Constantes para configurações pré-definidas
export const PRESET_CONFIGS = {
  SMALL_CACHE: {
    lineSize: 32,
    numLines: 32,
    associativity: 2,
    writePolicy: WritePolicy.WRITE_THROUGH,
    replacementPolicy: ReplacementPolicy.LRU,
  },
  MEDIUM_CACHE: {
    lineSize: 64,
    numLines: 64,
    associativity: 4,
    writePolicy: WritePolicy.WRITE_BACK,
    replacementPolicy: ReplacementPolicy.LRU,
  },
  LARGE_CACHE: {
    lineSize: 128,
    numLines: 128,
    associativity: 8,
    writePolicy: WritePolicy.WRITE_BACK,
    replacementPolicy: ReplacementPolicy.LRU,
  },
  DIRECT_MAPPED: {
    lineSize: 64,
    numLines: 64,
    associativity: 1,
    writePolicy: WritePolicy.WRITE_THROUGH,
    replacementPolicy: ReplacementPolicy.LRU,
  },
  FULLY_ASSOCIATIVE: {
    lineSize: 64,
    numLines: 32,
    associativity: 32,
    writePolicy: WritePolicy.WRITE_BACK,
    replacementPolicy: ReplacementPolicy.LRU,
  },
};

// Utilitários para análise
export const calculateCacheSize = (numLines, lineSize) => numLines * lineSize;
export const calculateNumSets = (numLines, associativity) =>
  numLines / associativity;
export const formatBytes = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
};

export const formatTime = (ns) => {
  if (ns >= 1000) return `${(ns / 1000).toFixed(2)}μs`;
  return `${ns.toFixed(2)}ns`;
};

export const formatPercentage = (value, decimals = 2) => {
  return `${value.toFixed(decimals)}%`;
};
