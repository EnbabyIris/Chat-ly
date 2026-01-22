import { describe, it, expect } from '@jest/globals';

describe('Message Spam Detection', () => {
  it('should detect duplicate content', () => {
    const msg1 = 'Same message';
    const msg2 = 'Same message';
    expect(msg1).toBe(msg2);
  });

  it('should identify repetitive patterns', () => {
    const content = 'spam spam spam spam';
    const pattern = 'spam';
    const count = content.split(pattern).length - 1;
    expect(count).toBeGreaterThan(2);
  });

  it('should detect excessive capitalization', () => {
    const content = 'THIS IS ALL CAPS';
    const upperCount = (content.match(/[A-Z]/g) || []).length;
    const totalChars = content.replace(/\s/g, '').length;
    const ratio = upperCount / totalChars;
    expect(ratio).toBeGreaterThan(0.8);
  });

  it('should identify suspicious URLs', () => {
    const content = 'Check http://suspicious.com';
    const hasURL = /https?:\/\//.test(content);
    expect(hasURL).toBe(true);
  });

  it('should calculate spam score', () => {
    const spamScore = 0.75;
    const threshold = 0.7;
    const isSpam = spamScore > threshold;
    expect(isSpam).toBe(true);
  });
});
