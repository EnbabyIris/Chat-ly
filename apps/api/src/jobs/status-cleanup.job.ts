import { StatusService } from '../services/status.service';

const statusService = new StatusService();

/**
 * Background job to clean up expired statuses
 * This job should be run periodically (e.g., every hour)
 */
export async function cleanupExpiredStatuses(): Promise<void> {
  try {
    console.log('🧹 Starting status cleanup job...');

    await statusService.cleanupExpiredStatuses();

    console.log(`✅ Status cleanup completed.`);

  } catch (error) {
    console.error('❌ Status cleanup job failed:', error);
    // In production, you might want to send alerts or log to monitoring service
  }
}

/**
 * Schedule the cleanup job to run every hour
 * In a production app, you'd use a proper job scheduler like node-cron
 */
export function scheduleStatusCleanup(): void {
  // Run cleanup every hour
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  console.log('📅 Scheduling status cleanup job to run every hour...');

  // Run initial cleanup
  cleanupExpiredStatuses();

  // Schedule recurring cleanup
  setInterval(cleanupExpiredStatuses, INTERVAL_MS);
}