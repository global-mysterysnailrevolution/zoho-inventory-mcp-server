// zoho/limiter.js
class SimpleLimiter {
  constructor({ minGapMs = 250 }) {
    this.minGapMs = minGapMs;       // minimum gap between requests
    this.nextAt = 0;                // earliest time a new request may start
  }
  async wait() {
    const now = Date.now();
    const delay = Math.max(0, this.nextAt - now);
    if (delay) await new Promise(r => setTimeout(r, delay));
  }
  notifyDone() {
    this.nextAt = Date.now() + this.minGapMs;
  }
  async pause(ms) {
    this.nextAt = Date.now() + ms;
  }
}

const minGapMs = Number(process.env.ZOHO_MIN_GAP_MS || 300); // start conservative
module.exports = new SimpleLimiter({ minGapMs });
