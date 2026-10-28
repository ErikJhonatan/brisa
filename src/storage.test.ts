import { afterEach, describe, expect, it, vi } from 'vitest';
import { calendarFile, loadSettings, weekDates } from './storage';
import { isBreathing, withoutHolds, practices } from './breathing';
afterEach(() => vi.unstubAllGlobals());
describe('local preferences and schedules', () => {
  it('sanitizes invalid persisted preferences instead of passing them to audio', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ audio:{ track:'unknown', musicVolume:4, breathVolume:-2 }, goal:99, reminder:'99:00', favorites:[3, 'sigh'] }) });
    const settings = loadSettings();
    expect(settings.audio).toMatchObject({ track:'off', musicVolume:1, breathVolume:0 });
    expect(settings.goal).toBe(5); expect(settings.reminder).toBe('20:00'); expect(settings.favorites).toEqual(['sigh']);
  });
  it('uses a local Monday to Sunday week even across month boundaries', () => {
    expect(weekDates(new Date(2026, 10, 1, 12))).toEqual(['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01']);
  });
  it('exports a daily calendar event with an alarm and the requested local time', () => {
    const calendar = calendarFile('20:15');
    expect(calendar).toContain('T201500\r\n'); expect(calendar).toContain('RRULE:FREQ=DAILY'); expect(calendar).toContain('BEGIN:VALARM');
  });
});
describe('practice alternatives', () => {
  it('omits only breath holds and leaves natural-breathing exercises untouched', () => {
    const box = practices.find(p => p.id === 'box')!;
    expect(withoutHolds(box).phases.map(p => p.label)).toEqual(['Inhala suave', 'Exhala despacio']);
    expect(box.phases).toHaveLength(4);
    expect(isBreathing(practices.find(p => p.id === 'ground')!)).toBe(false);
    expect(isBreathing(practices.find(p => p.id === '478')!)).toBe(true);
  });
});
