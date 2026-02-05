import WebApp from '@twa-dev/sdk';
import type { StateStorage } from 'zustand/middleware';

const isTgAvailable = typeof window !== 'undefined' && WebApp.initData.length > 0;

export const telegramStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (isTgAvailable) {
      return new Promise((resolve) => {
        WebApp.CloudStorage.getItem(name, (err, value) => {
          if (err) {
            console.error('TG Storage Get Error:', err);
            // Fallback to local if error? Or just resolve null.
            resolve(null);
          } else {
            resolve(value || null);
          }
        });
      });
    } else {
      return localStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (isTgAvailable) {
      return new Promise((resolve, reject) => {
        WebApp.CloudStorage.setItem(name, value, (err) => {
          if (err) {
            console.error('TG Storage Set Error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } else {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (isTgAvailable) {
      return new Promise((resolve, reject) => {
        WebApp.CloudStorage.removeItem(name, (err) => {
           if (err) {
            reject(err);
           } else {
             resolve();
           }
        });
      });
    } else {
      localStorage.removeItem(name);
    }
  },
};
