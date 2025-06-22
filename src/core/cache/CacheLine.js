// src/core/cache/CacheLine.js
import { createCacheLineData } from "../types/cache.types.js";

export class CacheLine {
  constructor(lineSize = 64) {
    this.lineSize = lineSize;
    this.data = createCacheLineData(lineSize);
  }

  // Getters
  get valid() {
    return this.data.valid;
  }
  get dirty() {
    return this.data.dirty;
  }
  get tag() {
    return this.data.tag;
  }
  get lastUsed() {
    return this.data.lastUsed;
  }
  get dataArray() {
    return this.data.data;
  }

  // Setters
  set valid(value) {
    this.data.valid = value;
  }
  set dirty(value) {
    this.data.dirty = value;
  }
  set tag(value) {
    this.data.tag = value;
  }
  set lastUsed(value) {
    this.data.lastUsed = value;
  }

  invalidate() {
    this.data.valid = false;
    this.data.dirty = false;
    this.data.tag = 0;
    this.data.lastUsed = 0;
    this.data.data.fill(0);
  }

  loadData(tag, timestamp, data = null) {
    this.data.valid = true;
    this.data.tag = tag;
    this.data.lastUsed = timestamp;
    this.data.dirty = false;

    if (data) {
      this.data.data.set(data.slice(0, this.lineSize));
    } else {
      // Simula dados aleatórios
      for (let i = 0; i < this.lineSize; i++) {
        this.data.data[i] = Math.floor(Math.random() * 256);
      }
    }
  }

  markDirty(timestamp) {
    this.data.dirty = true;
    this.data.lastUsed = timestamp;
  }

  updateLastUsed(timestamp) {
    this.data.lastUsed = timestamp;
  }

  matches(tag) {
    return this.data.valid && this.data.tag === tag;
  }

  getData() {
    return {
      valid: this.data.valid,
      dirty: this.data.dirty,
      tag: this.data.tag,
      data: new Uint8Array(this.data.data),
      lastUsed: this.data.lastUsed,
    };
  }

  setData(data) {
    this.data = {
      valid: data.valid,
      dirty: data.dirty,
      tag: data.tag,
      data: new Uint8Array(data.data),
      lastUsed: data.lastUsed,
    };
  }

  toString() {
    const { valid, dirty, tag, lastUsed } = this.data;
    return `CacheLine{valid=${valid}, dirty=${dirty}, tag=0x${tag.toString(
      16
    )}, lastUsed=${lastUsed}}`;
  }
}
