import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { runFullCalibrationProtocol } from '../src/experiment/protocol.js';
import { rescoreExperiment } from '../src/experiment/runner.js';

describe('Calibration Experiment Protocol (P7-T06, P7-T07, QG-7)', () => {
  it('runs full 9-condition matrix and passes all hypotheses & deterministic rescoring', async () => {
    const repoRoot = process.cwd().endsWith('engine') ? path.join(process.cwd(), '..') : process.cwd();
    const outDir = path.resolve(repoRoot, 'evidence/experiments/main-run');
    const output = await runFullCalibrationProtocol(outDir);

    console.log('Hypotheses outcomes:', output.hypotheses);
    expect(output.streamSize).toBe(330);
    expect(Object.keys(output.results).length).toBe(9);

    // H1: Safety floor (zero Class I violations in R1 & R2)
    expect(output.hypotheses.H1_safetyFloor).toBe(true);

    // H2: Calibration (Beta error rate <= CP bound)
    expect(output.hypotheses.H2_calibration).toBe(true);

    // H3: Discrimination (Gamma loss <= Beta loss)
    expect(output.hypotheses.H3_discrimination).toBe(true);

    // H4: Distribution shift observed on blind red-team set
    expect(output.hypotheses.H4_distributionShift).toBe(true);

    // Mechanism check: BondPool payout reimburses losses in R2
    expect(output.hypotheses.mechanismCheck).toBe(true);

    // Every condition must match rescoring byte for byte
    for (const [key, res] of Object.entries(output.results)) {
      expect(res.rescoreMatch).toBe(true);
      const rescored = rescoreExperiment(res.runDir);
      expect(rescored.totalInvoices).toBe(330);
      expect(rescored.summarySha256 || rescored.automationRate).toBe(res.summary.summarySha256 || res.summary.automationRate);
    }

    // Verify protocol-summary.json and chart.json exist
    expect(fs.existsSync(path.join(outDir, 'protocol-summary.json'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'chart.json'))).toBe(true);
  }, 30000);
});
