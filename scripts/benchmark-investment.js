// scripts/benchmark-investment.js
// Simple benchmark that measures response time and memory usage of the investment-analysis API.
// Run with: node scripts/benchmark-investment.js

import { performance } from 'perf_hooks';
import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/investment-analysis';

async function benchmark(iterations = 5) {
  console.log(`Running ${iterations} iterations against ${API_URL}`);
  const results = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const memStart = process.memoryUsage().heapUsed;
    const res = await fetch(API_URL);
    const data = await res.json();
    const end = performance.now();
    const memEnd = process.memoryUsage().heapUsed;
    const duration = end - start;
    const memDelta = (memEnd - memStart) / 1024 / 1024; // MB
    console.log(`Iter ${i + 1}: ${duration.toFixed(2)} ms, Δ${memDelta.toFixed(2)} MB`);
    results.push({ duration, memDelta, dataSize: JSON.stringify(data).length });
  }
  const avg = results.reduce((a, r) => a + r.duration, 0) / iterations;
  const avgMem = results.reduce((a, r) => a + r.memDelta, 0) / iterations;
  console.log(`\nAverage: ${avg.toFixed(2)} ms, Avg Δ${avgMem.toFixed(2)} MB`);
}

benchmark().catch(err => console.error('Benchmark error:', err));
