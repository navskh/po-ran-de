export type UpgradeStat = 'attack' | 'range' | 'speed';
export type UpgradeRarity = 1 | 2 | 3 | 4 | 5 | 6;

export const UPGRADE_MAX_LEVEL = 10;
export const UPGRADE_BONUS_PER_LEVEL = 0.05; // 레벨당 +5%

export const UPGRADE_STAT_LABELS: Record<UpgradeStat, string> = {
  attack: '공격',
  range: '사거리',
  speed: '속도',
};

export const UPGRADE_STAT_ICONS: Record<UpgradeStat, string> = {
  attack: '⚔️',
  range: '🎯',
  speed: '⚡',
};

export const RARITY_UPGRADE_LABELS: Record<UpgradeRarity, string> = {
  1: 'C · 커먼',
  2: 'U · 언커먼',
  3: 'R · 레어',
  4: 'E · 에픽',
  5: 'L · 전설',
  6: 'M · 신화',
};

export const RARITY_UPGRADE_COLORS: Record<UpgradeRarity, string> = {
  1: '#9aa0c5',
  2: '#66cc66',
  3: '#4488ff',
  4: '#aa55ee',
  5: '#ff9933',
  6: '#ff33dd',
};

export type UpgradeMap = Record<string, number>;

export function upgradeKey(rarity: UpgradeRarity | number, stat: UpgradeStat): string {
  return `${rarity}_${stat}`;
}

export function getUpgradeLevel(upgrades: UpgradeMap, rarity: number, stat: UpgradeStat): number {
  return upgrades[`${rarity}_${stat}`] ?? 0;
}

export function getUpgradeMultiplier(upgrades: UpgradeMap, rarity: number, stat: UpgradeStat): number {
  return 1 + getUpgradeLevel(upgrades, rarity, stat) * UPGRADE_BONUS_PER_LEVEL;
}

export function nextUpgradeCost(currentLevel: number): number {
  // lv 0→1: 1 UP, lv 1→2: 2 UP, ..., lv 9→10: 10 UP
  return currentLevel + 1;
}
