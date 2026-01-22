import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ErrorHandler } from '../../src/utils/error-handler';

describe('ErrorHandler Circuit Breaker', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should execute function normally when circuit is closed', async () => {
    const circuitBreaker = errorHandler.createCircuitBreaker(3, 60000);
    const mockFn = jest.fn().mockResolvedValue('success');

    const result = await circuitBreaker.execute(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(circuitBreaker.getState().state).toBe('closed');
  });

  it('should open circuit after threshold failures', async () => {
    const circuitBreaker = errorHandler.createCircuitBreaker(3, 60000);
    const mockFn = jest.fn().mockRejectedValue(new Error('Test failure'));

    // Fail 3 times to reach threshold
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test failure');
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test failure');
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test failure');

    expect(circuitBreaker.getState().state).toBe('open');
    expect(circuitBreaker.getState().failureCount).toBe(3);
  });

  it('should reject immediately when circuit is open', async () => {
    const circuitBreaker = errorHandler.createCircuitBreaker(2, 60000);
    const mockFn = jest.fn().mockRejectedValue(new Error('Test failure'));

    // Fail enough times to open circuit
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test failure');
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test failure');

    // Next call should be rejected immediately
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is open');
    
    // Original function should not be called again
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should transition to half-open after timeout', async () => {
    const circuitBreaker = errorHandler.createCircuitBreaker(2, 60000);
    const mockFn = jest.fn().mockRejectedValue(new Error('Test failure'));

    // Open the circuit
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();

    expect(circuitBreaker.getState().state).toBe('open');

    // Fast forward past reset timeout
    jest.advanceTimersByTime(61000);

    // Reset mockFn to resolve successfully
    mockFn.mockResolvedValue('success');

    const result = await circuitBreaker.execute(mockFn);
    expect(result).toBe('success');
    expect(circuitBreaker.getState().state).toBe('closed');
  });

  it('should reset failure count after successful half-open execution', async () => {
    const circuitBreaker = errorHandler.createCircuitBreaker(2, 60000);
    const mockFn = jest.fn();

    // Open circuit
    mockFn.mockRejectedValue(new Error('Test failure'));
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();

    expect(circuitBreaker.getState().failureCount).toBe(2);

    // Wait for reset timeout
    jest.advanceTimersByTime(61000);

    // Succeed on next attempt
    mockFn.mockResolvedValue('success');
    await circuitBreaker.execute(mockFn);

    const state = circuitBreaker.getState();
    expect(state.state).toBe('closed');
    expect(state.failureCount).toBe(0);
  });

  it('should use custom threshold and timeout values', async () => {
    const circuitBreaker = errorHandler.createCircuitBreaker(5, 30000);
    const mockFn = jest.fn().mockRejectedValue(new Error('Test failure'));

    // Fail 4 times - should not open yet
    for (let i = 0; i < 4; i++) {
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test failure');
    }
    expect(circuitBreaker.getState().state).toBe('closed');

    // 5th failure should open circuit
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Test failure');
    expect(circuitBreaker.getState().state).toBe('open');

    // Should not reset after 25 seconds
    jest.advanceTimersByTime(25000);
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is open');

    // Should reset after 30 seconds
    jest.advanceTimersByTime(6000);
    mockFn.mockResolvedValue('success');
    const result = await circuitBreaker.execute(mockFn);
    expect(result).toBe('success');
  });

  it('should handle multiple circuit breaker instances independently', async () => {
    const cb1 = errorHandler.createCircuitBreaker(2, 60000);
    const cb2 = errorHandler.createCircuitBreaker(3, 60000);
    
    const mockFn1 = jest.fn().mockRejectedValue(new Error('Failure 1'));
    const mockFn2 = jest.fn().mockRejectedValue(new Error('Failure 2'));

    // Open first circuit
    await expect(cb1.execute(mockFn1)).rejects.toThrow();
    await expect(cb1.execute(mockFn1)).rejects.toThrow();

    expect(cb1.getState().state).toBe('open');
    expect(cb2.getState().state).toBe('closed');

    // Second circuit should still work
    await expect(cb2.execute(mockFn2)).rejects.toThrow('Failure 2');
    expect(cb2.getState().state).toBe('closed');
  });
});