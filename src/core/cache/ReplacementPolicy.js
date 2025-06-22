// src/core/cache/ReplacementPolicy.js
import { ReplacementPolicy } from "../types/cache.types.js";

export class LRUReplacementPolicy {
  selectVictim(cacheSet) {
    let oldestTime = Infinity;
    let victimIndex = 0;

    for (let i = 0; i < cacheSet.length; i++) {
      if (!cacheSet[i].valid) {
        return i; // Retorna primeira linha inválida
      }

      if (cacheSet[i].lastUsed < oldestTime) {
        oldestTime = cacheSet[i].lastUsed;
        victimIndex = i;
      }
    }

    return victimIndex;
  }
}

export class RandomReplacementPolicy {
  selectVictim(cacheSet) {
    // Procura por linha inválida primeiro
    for (let i = 0; i < cacheSet.length; i++) {
      if (!cacheSet[i].valid) {
        return i;
      }
    }

    // Se todas são válidas, seleciona aleatoriamente
    return Math.floor(Math.random() * cacheSet.length);
  }
}

export class ReplacementPolicyFactory {
  static create(policy) {
    switch (policy) {
      case ReplacementPolicy.LRU:
        return new LRUReplacementPolicy();
      case ReplacementPolicy.RANDOM:
        return new RandomReplacementPolicy();
      default:
        throw new Error(`Política de substituição não suportada: ${policy}`);
    }
  }
}

export function findLineInSet(cacheSet, tag) {
  for (let i = 0; i < cacheSet.length; i++) {
    if (cacheSet[i].matches(tag)) {
      return i;
    }
  }
  return -1; // Não encontrado
}

export function hasEmptyLine(cacheSet) {
  return cacheSet.some((line) => !line.valid);
}

export function getEmptyLineIndex(cacheSet) {
  for (let i = 0; i < cacheSet.length; i++) {
    if (!cacheSet[i].valid) {
      return i;
    }
  }
  return -1;
}
