import { describe, it, expect, beforeEach } from '@jest/globals';
import { ErrorHandler, AppError } from '../../src/utils/error-handler';

describe('ErrorHandler Statistics', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearStats();
  });

  it('should track error counts by code', () => {
    const errors = [
      new Error('validation failed'),
      new Error('validation failed'),
      new Error('not found'),
      new Error('validation failed'),
      new Error('timeout occurred')
    ];

    errors.forEach(error => errorHandler.handle(error));

    const stats = errorHandler.getErrorStats();
    expect(stats['VALIDATION_ERROR']).toBe(3);
    expect(stats['NOT_FOUND']).toBe(1);
    expect(stats['TIMEOUT']).toBe(1);
  });

  it('should return empty stats initially', () => {
    const stats = errorHandler.getErrorStats();
    expect(stats).toEqual({});
    expect(Object.keys(stats)).toHaveLength(0);
  });

  it('should increment existing error counts', () => {
    const error = new Error('internal error');

    errorHandler.handle(error);
    expect(errorHandler.getErrorStats()['INTERNAL_ERROR']).toBe(1);

    errorHandler.handle(error);
    expect(errorHandler.getErrorStats()['INTERNAL_ERROR']).toBe(2);

    errorHandler.handle(error);
    expect(errorHandler.getErrorStats()['INTERNAL_ERROR']).toBe(3);
  });

  it('should track different error types separately', () => {
    const errors = [
      new AppError({ code: 'CUSTOM_ERROR_1', message: 'Custom 1', statusCode: 400 }),
      new AppError({ code: 'CUSTOM_ERROR_2', message: 'Custom 2', statusCode: 500 }),
      new AppError({ code: 'CUSTOM_ERROR_1', message: 'Custom 1 again', statusCode: 400 }),
      new AppError({ code: 'CUSTOM_ERROR_3', message: 'Custom 3', statusCode: 404 })
    ];

    errors.forEach(error => errorHandler.handle(error));

    const stats = errorHandler.getErrorStats();
    expect(stats['CUSTOM_ERROR_1']).toBe(2);
    expect(stats['CUSTOM_ERROR_2']).toBe(1);
    expect(stats['CUSTOM_ERROR_3']).toBe(1);
    expect(Object.keys(stats)).toHaveLength(3);
  });

  it('should clear all statistics', () => {
    // Generate some errors first
    const errors = [
      new Error('validation failed'),
      new Error('not found'),
      new Error('timeout'),
      new Error('validation failed')
    ];

    errors.forEach(error => errorHandler.handle(error));

    // Verify stats exist
    const statsBeforeClear = errorHandler.getErrorStats();
    expect(Object.keys(statsBeforeClear).length).toBeGreaterThan(0);

    // Clear and verify
    errorHandler.clearStats();
    const statsAfterClear = errorHandler.getErrorStats();
    expect(statsAfterClear).toEqual({});
    expect(Object.keys(statsAfterClear)).toHaveLength(0);
  });

  it('should handle high volume error tracking', () => {
    const errorCount = 1000;
    
    for (let i = 0; i < errorCount; i++) {
      if (i % 3 === 0) {
        errorHandler.handle(new Error('validation failed'));
      } else if (i % 3 === 1) {
        errorHandler.handle(new Error('not found'));
      } else {
        errorHandler.handle(new Error('internal error'));
      }
    }

    const stats = errorHandler.getErrorStats();
    const totalErrors = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    expect(totalErrors).toBe(errorCount);
    expect(stats['VALIDATION_ERROR']).toBeCloseTo(errorCount / 3, 1);
    expect(stats['NOT_FOUND']).toBeCloseTo(errorCount / 3, 1);
    expect(stats['INTERNAL_ERROR']).toBeCloseTo(errorCount / 3, 1);
  });

  it('should return immutable stats object', () => {
    const error = new Error('test error');
    errorHandler.handle(error);

    const stats1 = errorHandler.getErrorStats();
    const stats2 = errorHandler.getErrorStats();

    // Modify one reference
    stats1['NEW_ERROR'] = 999;

    // Other reference should not be affected
    expect(stats2['NEW_ERROR']).toBeUndefined();
    
    // Original stats should not be affected
    const stats3 = errorHandler.getErrorStats();
    expect(stats3['NEW_ERROR']).toBeUndefined();
  });

  it('should maintain accuracy across multiple operations', () => {
    // Mixed operations
    errorHandler.handle(new Error('validation failed'));
    errorHandler.handle(new Error('not found'));
    
    let stats = errorHandler.getErrorStats();
    expect(stats['VALIDATION_ERROR']).toBe(1);
    expect(stats['NOT_FOUND']).toBe(1);

    // Add more errors
    errorHandler.handle(new Error('validation failed'));
    errorHandler.handle(new Error('validation failed'));
    
    stats = errorHandler.getErrorStats();
    expect(stats['VALIDATION_ERROR']).toBe(3);
    expect(stats['NOT_FOUND']).toBe(1);

    // Clear and add new error
    errorHandler.clearStats();
    errorHandler.handle(new Error('timeout'));
    
    stats = errorHandler.getErrorStats();
    expect(stats['VALIDATION_ERROR']).toBeUndefined();
    expect(stats['NOT_FOUND']).toBeUndefined();
    expect(stats['TIMEOUT']).toBe(1);
  });
});