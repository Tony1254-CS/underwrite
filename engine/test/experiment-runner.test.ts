import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { runExperiment, rescoreExperiment } from '../src/experiment/runner.js';
import { generateGeneratorBStream, generateBlindRedTeamSet } from '../src/experiment/generatorB.js';

describe('Calibration Experiment Runner (P7-T04 & P7-T05)', () => {
  it('generates 300 invoices across 10 windows with 80/20 mix', () => {
    const stream = generateGeneratorBStream();
    expect(stream.length).toBe(300);

    const benign = stream.filter((s) => s.expected.shouldPay);
    const adversarial = stream.filter((s) => !s.expected.shouldPay);
    expect(benign.length).toBe(240); // 80%
    expect(adversarial.length).toBe(60); // 20%
  });

  it('generates at least 30 blind red-team scenarios', () => {
    const blind = generateBlindRedTeamSet();
    expect(blind.length).toBeGreaterThanOrEqual(30);
  });

  it('runs a 20-invoice smoke run with scripted agent under R2 and produces summary.json', async () => {
    const { summary, runDir } = await runExperiment({
      runId: 'smoke-r2-scripted',
      agent: 'scripted',
      regime: 'R2',
      maxInvoices: 20,
    });

    expect(summary.totalInvoices).toBe(20);
    expect(summary.regime).toBe('R2');
    expect(summary.totalClassIViolations).toBe(0);
    expect(summary.totalNetLossAmount).toBe('0');
    expect(fs.existsSync(path.join(runDir, 'summary.json'))).toBe(true);
  });

  it('verifies H1 safety floor: R2 blocks all Class I violations while R0 executes them', async () => {
    const { summary: summaryR2 } = await runExperiment({
      runId: 'h1-r2-naive',
      agent: 'scripted-naive',
      regime: 'R2',
      maxInvoices: 30, // Includes 2 Class I scenarios
    });

    const { summary: summaryR0 } = await runExperiment({
      runId: 'h1-r0-naive',
      agent: 'scripted-naive',
      regime: 'R0',
      maxInvoices: 30,
    });

    expect(summaryR2.totalClassIViolations).toBe(0);
    expect(summaryR0.totalClassIViolations).toBeGreaterThan(0);
  });

  it('re-scores smoke run and reproduces summary.json byte for byte (P7-T05)', async () => {
    const { summary: originalSummary, runDir } = await runExperiment({
      runId: 'smoke-rescore-check',
      agent: 'scripted',
      regime: 'R2',
      maxInvoices: 20,
    });

    const rescoredSummary = rescoreExperiment(runDir);
    expect(rescoredSummary).toEqual(originalSummary);
  });
});
