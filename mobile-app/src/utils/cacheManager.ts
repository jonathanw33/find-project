import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

interface CacheData<T> {
  data: T;
  timestamp: number;
}

export class CacheManager {
  private static async setCache<T>(key: string, data: T): Promise<void> {
    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to set cache:', error);
    }
  }

  private static async getCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cacheData: CacheData<T> = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > CACHE_EXPIRY_TIME;

      if (isExpired) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  static async cacheGeofences(userId: string, geofences: any[]): Promise<void> {
    await this.setCache(`geofences_${userId}`, geofences);
  }

  static async getCachedGeofences(userId: string): Promise<any[] | null> {
    return await this.getCache(`geofences_${userId}`);
  }

  static async cacheLinkedGeofences(trackerId: string, geofences: any[]): Promise<void> {
    await this.setCache(`linked_geofences_${trackerId}`, geofences);
  }

  static async getCachedLinkedGeofences(trackerId: string): Promise<any[] | null> {
    return await this.getCache(`linked_geofences_${trackerId}`);
  }

  static async clearCache(pattern?: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = pattern 
        ? keys.filter(key => key.includes(pattern))
        : keys.filter(key => key.startsWith('geofences_') || key.startsWith('linked_geofences_'));
      
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}
