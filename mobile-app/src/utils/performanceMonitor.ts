export class PerformanceMonitor {
  private static timers: { [key: string]: number } = {};

  static startTimer(operation: string): void {
    this.timers[operation] = Date.now();
    console.log(`🚀 Started: ${operation}`);
  }

  static endTimer(operation: string): number {
    const startTime = this.timers[operation];
    if (!startTime) {
      console.warn(`⚠️ Timer for ${operation} was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    delete this.timers[operation];
    
    console.log(`✅ Completed: ${operation} in ${duration}ms`);
    
    // Log slow operations
    if (duration > 3000) {
      console.warn(`🐌 Slow operation detected: ${operation} took ${duration}ms`);
    }
    
    return duration;
  }

  static async measureAsync<T>(operation: string, asyncFn: () => Promise<T>): Promise<T> {
    this.startTimer(operation);
    try {
      const result = await asyncFn();
      this.endTimer(operation);
      return result;
    } catch (error) {
      this.endTimer(operation);
      console.error(`❌ Failed: ${operation}`, error);
      throw error;
    }
  }
}

// Usage example:
// PerformanceMonitor.measureAsync('loadGeofences', () => geofenceService.getGeofences())
