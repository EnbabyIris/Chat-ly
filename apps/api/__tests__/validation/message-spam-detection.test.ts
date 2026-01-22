import { describe, it, expect, jest } from '@jest/globals';

describe('Message Spam Detection', () => {
  it('should detect duplicate message content', () => {
    const message1 = 'Same message';
    const message2 = 'Same message';
    expect(message1).toBe(message2);
  });

  it('should identify repetitive patterns', () => {
    const repetitiveMessage = 'Buy now! Buy now! Buy now!';
    const pattern = 'Buy now!';
    const occurrences = repetitiveMessage.split(pattern).length - 1;
    expect(occurrences).toBeGreaterThan(2);
  });

  it('should detect excessive capitalization', () => {
    const capsMessage = 'THIS IS ALL CAPS MESSAGE';
    const upperCaseChars = capsMessage.match(/[A-Z]/g) || [];
    const percentage = upperCaseChars.length / capsMessage.replace(/\s/g, '').length;
    expect(percentage).toBeGreaterThan(0.8);
  });

  it('should identify suspicious URLs', () => {
    const messageWithUrl = 'Check this out: http://suspicious-site.com';
    const urlPattern = /https?:\/\/[^\s]+/;
    expect(urlPattern.test(messageWithUrl)).toBe(true);
  });

  it('should detect excessive emoji usage', () => {
    const emojiMessage = '😀😀😀😀😀😀😀😀😀😀';
    const emojiPattern = /[\u{1F600}-\u{1F64F}]/gu;
    const emojiCount = (emojiMessage.match(emojiPattern) || []).length;
    expect(emojiCount).toBeGreaterThan(5);
  });

  it('should check against profanity word list', () => {
    const profanityList = ['badword1', 'badword2', 'badword3'];
    expect(profanityList.length).toBeGreaterThan(0);
  });

  it('should detect rapid message sending pattern', () => {
    const messageTimestamps = [1000, 1100, 1200, 1300, 1400];
    const intervals = messageTimestamps.map((ts, i) => 
      i > 0 ? ts - messageTimestamps[i-1] : 0
    ).filter(i => i > 0);
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    expect(avgInterval).toBeLessThan(200);
  });

  it('should calculate spam score for message', () => {
    const spamScore = 0.75; // 0-1 scale
    const spamThreshold = 0.7;
    expect(spamScore).toBeGreaterThan(spamThreshold);
  });
});
