// src/core/utils/fileParser.js
import { createMemoryAccess, Operation } from "../types/cache.types.js";

export class FileParser {
  static parseTraceFile(fileContent) {
    const lines = fileContent.trim().split("\n");
    const accesses = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue; // Pula comentários e linhas vazias

      try {
        const access = this.parseLine(line, i + 1);
        if (access) {
          accesses.push(access);
        }
      } catch (error) {
        console.warn(`Erro na linha ${i + 1}: ${error.message}`);
      }
    }

    return accesses;
  }

  static parseLine(line, lineNumber) {
    const parts = line.split(/\s+/);

    if (parts.length < 2) {
      throw new Error(`Formato inválido: esperado "endereço operação"`);
    }

    const [addressStr, operationStr] = parts;

    // Valida endereço
    const address = this.validateAddress(addressStr);

    // Valida operação
    const operation = this.validateOperation(operationStr);

    return createMemoryAccess(address, operation, lineNumber);
  }

  static validateAddress(addressStr) {
    // Remove prefixo 0x se existir
    const cleanAddr = addressStr.replace(/^0x/i, "");

    // Verifica se é hexadecimal válido
    if (!/^[0-9a-fA-F]+$/.test(cleanAddr)) {
      throw new Error(`Endereço inválido: ${addressStr}`);
    }

    // Verifica se não é muito grande (32 bits)
    if (cleanAddr.length > 8) {
      throw new Error(`Endereço muito grande: ${addressStr}`);
    }

    return cleanAddr.padStart(8, "0");
  }

  static validateOperation(operationStr) {
    const op = operationStr.toUpperCase();

    if (op !== Operation.READ && op !== Operation.WRITE) {
      throw new Error(`Operação inválida: ${operationStr}. Use 'R' ou 'W'`);
    }

    return op;
  }

  static generateSampleFile(numAccesses = 100) {
    const operations = [Operation.READ, Operation.WRITE];
    const lines = ["# Arquivo de trace de exemplo"];

    for (let i = 0; i < numAccesses; i++) {
      const address = Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(8, "0");
      const operation =
        operations[Math.floor(Math.random() * operations.length)];
      lines.push(`${address} ${operation}`);
    }

    return lines.join("\n");
  }

  static validateFileFormat(fileContent) {
    const lines = fileContent.trim().split("\n");
    const errors = [];
    let validLines = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      try {
        this.parseLine(line, i + 1);
        validLines++;
      } catch (error) {
        errors.push(`Linha ${i + 1}: ${error.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      totalLines: lines.length,
      validLines,
      invalidLines: errors.length,
    };
  }

  static createTraceStatistics(accesses) {
    const stats = {
      totalAccesses: accesses.length,
      readAccesses: 0,
      writeAccesses: 0,
      uniqueAddresses: new Set(),
      addressRange: { min: Infinity, max: 0 },
    };

    accesses.forEach((access) => {
      if (access.operation === Operation.READ) {
        stats.readAccesses++;
      } else {
        stats.writeAccesses++;
      }

      stats.uniqueAddresses.add(access.address);

      const addr = parseInt(access.address, 16);
      stats.addressRange.min = Math.min(stats.addressRange.min, addr);
      stats.addressRange.max = Math.max(stats.addressRange.max, addr);
    });

    stats.uniqueAddresses = stats.uniqueAddresses.size;

    return stats;
  }
}
