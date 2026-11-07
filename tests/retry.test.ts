import { describe, expect, it, vi } from 'vitest';
import { withRetries } from '@/lib/retry';

describe('withRetries', () => {
  it('returns the first answer without trying again', async () => {
    const work = vi.fn().mockResolvedValue('held');
    await expect(withRetries(work, 3, 1)).resolves.toBe('held');
    expect(work).toHaveBeenCalledTimes(1);
  });

  it('gets past a bad moment', async () => {
    const work = vi.fn().mockRejectedValueOnce(new Error('503')).mockRejectedValueOnce(new Error('503')).mockResolvedValue('held');
    await expect(withRetries(work, 3, 1)).resolves.toBe('held');
    expect(work).toHaveBeenCalledTimes(3);
  });

  it('gives up after the last try, with the last failure', async () => {
    const work = vi.fn().mockRejectedValueOnce(new Error('first')).mockRejectedValue(new Error('last'));
    await expect(withRetries(work, 2, 1)).rejects.toThrow('last');
    expect(work).toHaveBeenCalledTimes(2);
  });
});
