/**
 * @file matcher.test.js
 * Unit tests for resume matcher logic
 */
import { calculateMatchScore } from '../utils/similarity.js';

describe('🧩 Resume Matcher Logic', () => {
  test('should return 100% if all skills match', () => {
    const resume = ['node', 'express', 'mongodb'];
    const job = ['node', 'express', 'mongodb'];
    const result = calculateMatchScore(resume, job);
    expect(result.score).toBe(100);
  });

  test('should handle partial matches', () => {
    const resume = ['node', 'express'];
    const job = ['node', 'express', 'react'];
    const result = calculateMatchScore(resume, job);
    expect(result.score).toBeLessThan(100);
  });

  test('should return 0% if no skills match', () => {
    const resume = ['excel', 'word'];
    const job = ['python', 'django'];
    const result = calculateMatchScore(resume, job);
    expect(result.score).toBe(0);
  });
});
