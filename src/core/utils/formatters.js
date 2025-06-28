/**
 * Utilitários para formatação de números conforme especificação do TDE 2
 * "Todas as saídas que forem números reais devem ter 4 casas decimais"
 * Números inteiros (contadores, tamanhos) não devem ter casas decimais
 */

/**
 * Formata um número REAL para ter exatamente 4 casas decimais
 * @param {number} value - Valor numérico a ser formatado
 * @returns {string} String formatada com 4 casas decimais
 */
export function formatToFourDecimals(value) {
  if (typeof value !== "number" || isNaN(value)) {
    return "0.0000";
  }
  return value.toFixed(4);
}

/**
 * Formata uma porcentagem (NÚMERO REAL) para ter exatamente 4 casas decimais
 * @param {number} value - Valor de 0 a 100 (ex: 54.9 para 54.9%)
 * @returns {string} String formatada como "54.9000%"
 */
export function formatPercentage(value) {
  if (typeof value !== "number" || isNaN(value)) {
    return "0.0000%";
  }
  return `${value.toFixed(4)}%`;
}

/**
 * Formata tempo (NÚMERO REAL) em nanossegundos com 4 casas decimais
 * @param {number} value - Tempo em nanossegundos
 * @returns {string} String formatada como "37.6000ns"
 */
export function formatTime(value) {
  if (typeof value !== "number" || isNaN(value)) {
    return "0.0000ns";
  }
  return `${value.toFixed(4)}ns`;
}

/**
 * Formata um valor INTEIRO (contadores, número de acessos, etc.)
 * @param {number} value - Valor inteiro
 * @returns {string} String do valor inteiro SEM decimais
 */
export function formatInteger(value) {
  if (typeof value !== "number" || isNaN(value)) {
    return "0";
  }
  return Math.round(value).toString();
}

/**
 * Formata bytes/KB/MB como INTEIROS (tamanhos não são números reais)
 * @param {number} bytes - Número de bytes
 * @returns {string} String formatada como "8KB", "1MB" (SEM decimais)
 */
export function formatBytes(bytes) {
  if (typeof bytes !== "number" || isNaN(bytes)) {
    return "0B";
  }

  if (bytes >= 1024 * 1024) {
    const mb = Math.round(bytes / (1024 * 1024));
    return `${mb}MB`;
  } else if (bytes >= 1024) {
    const kb = Math.round(bytes / 1024);
    return `${kb}KB`;
  } else {
    return `${Math.round(bytes)}B`;
  }
}

/**
 * Formata tamanho de cache de forma inteligente
 * @param {number} numLines - Número de linhas
 * @param {number} lineSize - Tamanho da linha em bytes
 * @returns {string} Tamanho formatado adequadamente
 */
export function formatCacheSize(numLines, lineSize) {
  const totalBytes = numLines * lineSize;
  return formatBytes(totalBytes);
}

/**
 * Formata taxa de acerto com contagem entre parênteses
 * @param {number} rate - Taxa de acerto (0-100) - NÚMERO REAL
 * @param {number} hits - Número de hits - INTEIRO
 * @param {number} total - Total de acessos - INTEIRO
 * @returns {string} String formatada como "54.9000% (2750/5000)"
 */
export function formatHitRateWithCount(rate, hits, total) {
  const formattedRate = formatPercentage(rate);
  const formattedHits = formatInteger(hits);
  const formattedTotal = formatInteger(total);
  return `${formattedRate} (${formattedHits}/${formattedTotal})`;
}

/**
 * Formata associatividade de forma legível
 * @param {number} associativity - Nível de associatividade
 * @returns {string} Formato legível (ex: "Direct-mapped", "4-way")
 */
export function formatAssociativity(associativity) {
  if (associativity === 1) {
    return "Direct-mapped";
  }
  return `${formatInteger(associativity)}-way`;
}

/**
 * Formata política de escrita
 * @param {number} writePolicy - 0 = write-through, 1 = write-back
 * @returns {string} Nome da política
 */
export function formatWritePolicy(writePolicy) {
  return writePolicy === 0 ? "Write-through" : "Write-back";
}

/**
 * Formata endereço hexadecimal
 * @param {string|number} address - Endereço
 * @returns {string} Endereço formatado
 */
export function formatAddress(address) {
  if (typeof address === "string") {
    return `0x${address.toUpperCase()}`;
  }
  return `0x${address.toString(16).toUpperCase().padStart(8, "0")}`;
}

/**
 * Converte uma string formatada de porcentagem de volta para número
 * @param {string} formattedValue - String formatada (ex: "54.9000%")
 * @returns {number} Número original
 */
export function parseFormattedPercentage(formattedValue) {
  return parseFloat(formattedValue.replace("%", ""));
}

/**
 * Converte uma string formatada de tempo de volta para número
 * @param {string} formattedValue - String formatada (ex: "37.6000ns")
 * @returns {number} Número original em nanossegundos
 */
export function parseFormattedTime(formattedValue) {
  return parseFloat(formattedValue.replace("ns", ""));
}

/**
 * Valida se um número é válido para formatação
 * @param {any} value - Valor a ser validado
 * @returns {boolean} True se for um número válido
 */
export function isValidNumber(value) {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

/**
 * Formata valor baseado no tipo/contexto
 * @param {number} value - Valor a ser formatado
 * @param {string} type - Tipo do valor para formatação correta
 * @returns {string} Valor formatado
 */
export function formatByType(value, type) {
  if (!isValidNumber(value)) {
    return type.includes("Rate") || type.includes("Time") ? "0.0000" : "0";
  }

  switch (type) {
    case "percentage":
    case "hitRate":
    case "readHitRate":
    case "writeHitRate":
      return formatPercentage(value);

    case "time":
    case "averageAccessTime":
    case "hitTime":
    case "memoryTime":
      return formatTime(value);

    case "bytes":
    case "cacheSize":
    case "lineSize":
      return formatBytes(value);

    case "integer":
    case "count":
    case "accesses":
    case "hits":
    case "misses":
    case "reads":
    case "writes":
    case "numLines":
    case "associativity":
      return formatInteger(value);

    case "real":
    case "decimal":
      return formatToFourDecimals(value);

    default:
      // Se contém palavras que indicam contador/inteiro
      if (
        type.includes("Count") ||
        type.includes("Number") ||
        type.includes("Reads") ||
        type.includes("Writes") ||
        type.includes("Accesses") ||
        type.includes("Hits") ||
        type.includes("Misses") ||
        type.includes("Lines")
      ) {
        return formatInteger(value);
      }

      // Se contém palavras que indicam percentual
      if (type.includes("Rate") || type.includes("Percentage")) {
        return formatPercentage(value);
      }

      // Se contém palavras que indicam tempo
      if (type.includes("Time")) {
        return formatTime(value);
      }

      // Se contém palavras que indicam tamanho
      if (type.includes("Size") || type.includes("Bytes")) {
        return formatBytes(value);
      }

      // Default: assumir que é número real se tiver decimais
      return Number.isInteger(value)
        ? formatInteger(value)
        : formatToFourDecimals(value);
  }
}
