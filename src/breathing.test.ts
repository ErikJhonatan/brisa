import { describe, expect, it } from 'vitest';
import { phaseAt, practices } from './breathing';
describe('breathing phase timing', () => {
  it('transitions through the double inhale and long exhale without off-by-one errors', () => {
    const sigh = practices[0];
    expect(phaseAt(sigh, 0).label).toBe('Inhala suave');
    expect(phaseAt(sigh, 2).remaining).toBe(1);
    expect(phaseAt(sigh, 3).label).toBe('Un poquito más');
    expect(phaseAt(sigh, 4).label).toBe('Exhala despacio');
    expect(phaseAt(sigh, 9).remaining).toBe(1);
    expect(phaseAt(sigh, 10).index).toBe(0);
  });
  it('keeps body scan independent of controlled breathing', () => {
    const body = practices[3];
    expect(phaseAt(body, 30).label).toBe('Nota tus piernas');
    expect(phaseAt(body, 179).label).toBe('Siente todo tu cuerpo');
    expect(body.phases.every(phase => phase.scale === 1)).toBe(true);
  });
  it('cycles all techniques consistently at exact cycle boundaries', () => {
    for (const practice of practices) {
      const duration = practice.phases.reduce((sum, phase) => sum + phase.seconds, 0);
      expect(phaseAt(practice, duration).index).toBe(0);
      expect(phaseAt(practice, duration - 1).index).toBe(practice.phases.length - 1);
    }
  });
});
