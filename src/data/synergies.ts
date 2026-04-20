export interface ISynergyEffect {
  attack?: number;
  hp?: number;
  attackSpeed?: number;
}

export interface ISynergyGroup {
  id: string;
  name: string;
  memberIds: number[];
  // true: 전부 모여야 발동 / false: 수에 비례 스케일링 (per-member 효과 반복)
  requireAll: boolean;
  effect: ISynergyEffect;
  description: string;
}

export const SYNERGY_GROUPS: ISynergyGroup[] = [
  {
    id: 'legendary-beasts',
    name: '전설의 개 트리오',
    memberIds: [243, 244, 245],
    requireAll: true,
    effect: { attack: 1.30 },
    description: '공격력 +30%',
  },
  {
    id: 'legendary-birds',
    name: '전설의 새 트리오',
    memberIds: [144, 145, 146],
    requireAll: true,
    effect: { attackSpeed: 1.20 },
    description: '공격속도 +20%',
  },
  {
    id: 'mewtwo-mew',
    name: '뮤츠 & 뮤',
    memberIds: [150, 151],
    requireAll: true,
    effect: { hp: 1.40 },
    description: '체력 +40%',
  },
  {
    id: 'tower-duo',
    name: '탑 듀오 (호오/루기아)',
    memberIds: [249, 250],
    requireAll: true,
    effect: { attack: 1.30 },
    description: '공격력 +30%',
  },
  {
    id: 'gen1-starters',
    name: '1세대 스타터 최종체',
    memberIds: [3, 6, 9],
    requireAll: true,
    effect: { attack: 1.10, hp: 1.20 },
    description: '공격력 +10%, 체력 +20%',
  },
  {
    id: 'dragon-trio',
    name: '드래곤 트리오',
    memberIds: [149, 384, 483],
    requireAll: true,
    effect: { attack: 1.25 },
    description: '공격력 +25%',
  },
  {
    id: 'eevee-family',
    name: '이브이 가족',
    memberIds: [133, 134, 135, 136, 196, 197, 470, 471],
    requireAll: false,
    effect: { attack: 1.05 },
    description: '구성원 1마리당 공격력 +5% (중첩)',
  },
];

export interface IActiveSynergy {
  group: ISynergyGroup;
  count: number; // requireAll일 때는 group.memberIds.length
}
