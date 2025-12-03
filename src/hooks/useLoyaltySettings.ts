import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export interface LoyaltyLevelInfo {
  name: string;
  color: string;
  stars: number;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerRupiah: number;
  level1Name: string;
  level2Name: string;
  level3Name: string;
  level4Name: string;
  level1Max: number;
  level2Min: number;
  level2Max: number;
  level3Min: number;
  level3Max: number;
  level4Min: number;
}

// Default values
const DEFAULT_LEVEL_NAMES = {
  level1: 'Bronze',
  level2: 'Silver',
  level3: 'Gold',
  level4: 'Platinum',
};

const DEFAULT_COLORS = {
  level1: 'text-orange-600 bg-orange-100',
  level2: 'text-gray-600 bg-gray-100',
  level3: 'text-yellow-600 bg-yellow-100',
  level4: 'text-purple-600 bg-purple-100',
};

const DEFAULT_STARS = {
  level1: 2,
  level2: 3,
  level3: 4,
  level4: 5,
};

export function useLoyaltySettings() {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiService.getSettings();
      if (response.success && response.data) {
        const flatSettings: Partial<LoyaltySettings> = {};
        
        // Flatten grouped settings
        Object.values(response.data).forEach((group: any) => {
          if (Array.isArray(group)) {
            group.forEach((setting: any) => {
              const key = setting.key;
              let value = setting.value;

              // Convert based on type
              if (setting.type === 'boolean') {
                value = value === '1' || value === true;
              } else if (setting.type === 'integer') {
                value = parseInt(value) || 0;
              }

              // Map keys
              const keyMapping: Record<string, keyof LoyaltySettings> = {
                'loyalty_enabled': 'enabled',
                'loyalty_points_per_rupiah': 'pointsPerRupiah',
                'loyalty_level1_name': 'level1Name',
                'loyalty_level2_name': 'level2Name',
                'loyalty_level3_name': 'level3Name',
                'loyalty_level4_name': 'level4Name',
                'loyalty_level1_max': 'level1Max',
                'loyalty_level2_min': 'level2Min',
                'loyalty_level2_max': 'level2Max',
                'loyalty_level3_min': 'level3Min',
                'loyalty_level3_max': 'level3Max',
                'loyalty_level4_min': 'level4Min',
              };

              const mappedKey = keyMapping[key];
              if (mappedKey) {
                flatSettings[mappedKey] = value as any;
              }
            });
          }
        });

        setSettings({
          enabled: flatSettings.enabled ?? true,
          pointsPerRupiah: flatSettings.pointsPerRupiah ?? 200,
          level1Name: flatSettings.level1Name || DEFAULT_LEVEL_NAMES.level1,
          level2Name: flatSettings.level2Name || DEFAULT_LEVEL_NAMES.level2,
          level3Name: flatSettings.level3Name || DEFAULT_LEVEL_NAMES.level3,
          level4Name: flatSettings.level4Name || DEFAULT_LEVEL_NAMES.level4,
          level1Max: flatSettings.level1Max ?? 4999,
          level2Min: flatSettings.level2Min ?? 5000,
          level2Max: flatSettings.level2Max ?? 24999,
          level3Min: flatSettings.level3Min ?? 25000,
          level3Max: flatSettings.level3Max ?? 99999,
          level4Min: flatSettings.level4Min ?? 100000,
        });
      }
    } catch (error) {
      console.error('Error fetching loyalty settings:', error);
      // Use defaults on error
      setSettings({
        enabled: true,
        pointsPerRupiah: 200,
        level1Name: DEFAULT_LEVEL_NAMES.level1,
        level2Name: DEFAULT_LEVEL_NAMES.level2,
        level3Name: DEFAULT_LEVEL_NAMES.level3,
        level4Name: DEFAULT_LEVEL_NAMES.level4,
        level1Max: 4999,
        level2Min: 5000,
        level2Max: 24999,
        level3Min: 25000,
        level3Max: 99999,
        level4Min: 100000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Map level key to display info
  const getLevelInfo = (level: string): LoyaltyLevelInfo => {
    // Handle both new format (level1-4) and old format (bronze, silver, gold, platinum)
    const levelMap: Record<string, 'level1' | 'level2' | 'level3' | 'level4'> = {
      'level1': 'level1',
      'level2': 'level2',
      'level3': 'level3',
      'level4': 'level4',
      'bronze': 'level1',
      'silver': 'level2',
      'gold': 'level3',
      'platinum': 'level4',
    };

    const normalizedLevel = levelMap[level.toLowerCase()] || 'level1';

    const nameMap = {
      level1: settings?.level1Name || DEFAULT_LEVEL_NAMES.level1,
      level2: settings?.level2Name || DEFAULT_LEVEL_NAMES.level2,
      level3: settings?.level3Name || DEFAULT_LEVEL_NAMES.level3,
      level4: settings?.level4Name || DEFAULT_LEVEL_NAMES.level4,
    };

    return {
      name: nameMap[normalizedLevel],
      color: DEFAULT_COLORS[normalizedLevel],
      stars: DEFAULT_STARS[normalizedLevel],
    };
  };

  const getLevelText = (level: string): string => {
    return getLevelInfo(level).name;
  };

  const getLevelColor = (level: string): string => {
    return getLevelInfo(level).color;
  };

  const getLevelStars = (level: string): number => {
    return getLevelInfo(level).stars;
  };

  // Get all level options for dropdowns
  const getLevelOptions = (): Array<{ value: string; label: string }> => {
    return [
      { value: 'level1', label: settings?.level1Name || DEFAULT_LEVEL_NAMES.level1 },
      { value: 'level2', label: settings?.level2Name || DEFAULT_LEVEL_NAMES.level2 },
      { value: 'level3', label: settings?.level3Name || DEFAULT_LEVEL_NAMES.level3 },
      { value: 'level4', label: settings?.level4Name || DEFAULT_LEVEL_NAMES.level4 },
    ];
  };

  return {
    settings,
    loading,
    getLevelInfo,
    getLevelText,
    getLevelColor,
    getLevelStars,
    getLevelOptions,
    refetch: fetchSettings,
  };
}

