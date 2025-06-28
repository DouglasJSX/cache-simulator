import { createAddressComponents } from "../types/cache.types.js";

export class AddressDecoder {
  constructor(config) {
    this.lineSize = config.lineSize;
    this.numLines = config.numLines;
    this.associativity = config.associativity;

    this.calculateBitFields();
  }

  calculateBitFields() {
    // Número de bits para palavra dentro do bloco
    this.offsetBits = Math.log2(this.lineSize);

    // Número de conjuntos
    this.numSets = this.numLines / this.associativity;

    // Número de bits para índice do conjunto
    this.setBits = Math.log2(this.numSets);

    // Número de bits para tag (assumindo endereço de 32 bits)
    this.tagBits = 32 - this.setBits - this.offsetBits;

    // Máscaras para extração de bits
    this.offsetMask = (1 << this.offsetBits) - 1;
    this.setMask = (1 << this.setBits) - 1;
    this.tagMask = (1 << this.tagBits) - 1;
  }

  decodeAddress(address) {
    const addr =
      typeof address === "string"
        ? parseInt(address.replace("0x", ""), 16)
        : address;

    const components = createAddressComponents();
    components.originalAddress = addr;

    // Extrai palavra do bloco
    components.blockOffset = addr & this.offsetMask;

    // Extrai índice do conjunto
    components.setIndex = (addr >> this.offsetBits) & this.setMask;

    // Extrai tag
    components.tag = (addr >> (this.offsetBits + this.setBits)) & this.tagMask;

    return components;
  }

  getBlockAddress(address) {
    const addr =
      typeof address === "string"
        ? parseInt(address.replace("0x", ""), 16)
        : address;

    // Remove o palavra para obter endereço do bloco
    return addr & ~this.offsetMask;
  }

  getCacheInfo() {
    return {
      lineSize: this.lineSize,
      numLines: this.numLines,
      numSets: this.numSets,
      associativity: this.associativity,
      offsetBits: this.offsetBits,
      setBits: this.setBits,
      tagBits: this.tagBits,
    };
  }

  validateConfiguration() {
    const errors = [];

    if (!this.isPowerOfTwo(this.lineSize)) {
      errors.push("Tamanho da linha deve ser potência de 2");
    }

    if (!this.isPowerOfTwo(this.numLines)) {
      errors.push("Número de linhas deve ser potência de 2");
    }

    if (!this.isPowerOfTwo(this.associativity)) {
      errors.push("Associatividade deve ser potência de 2");
    }

    if (this.associativity > this.numLines) {
      errors.push("Associatividade não pode ser maior que o número de linhas");
    }

    return errors;
  }

  isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
  }
}
