import { describe, expect, it } from 'vitest';
import { APP_TITLE } from '../src/appInfo';

describe('appInfo', () => {
  it('has the Hebrew app title', () => {
    expect(APP_TITLE).toBe('סימון');
  });
});
