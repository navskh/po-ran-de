export type AchievementCategory = 'progress' | 'collection' | 'merge' | 'combat' | 'synergy' | 'economy';

export interface IAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  /** 숨김 업적 (달성 전엔 힌트만 표시) */
  hidden?: boolean;
}

export const ACHIEVEMENTS: IAchievement[] = [
  // 진행도
  { id: 'wave-10',  name: '신예 트레이너',    description: '웨이브 10 도달',      icon: '🥉', category: 'progress' },
  { id: 'wave-25',  name: '숙련된 트레이너',  description: '웨이브 25 도달',      icon: '🥈', category: 'progress' },
  { id: 'wave-50',  name: '챔피언',          description: '웨이브 50 클리어',    icon: '🥇', category: 'progress' },
  { id: 'wave-75',  name: '엔드리스 도전자', description: '엔드리스 웨이브 75',  icon: '🏅', category: 'progress' },
  { id: 'wave-100', name: '전설의 트레이너', description: '엔드리스 웨이브 100', icon: '🏆', category: 'progress' },

  // 수집
  { id: 'dex-25',  name: '입문자',       description: '도감 25% 달성',  icon: '📗', category: 'collection' },
  { id: 'dex-50',  name: '연구자',       description: '도감 50% 달성',  icon: '📘', category: 'collection' },
  { id: 'dex-75',  name: '박사',         description: '도감 75% 달성',  icon: '📙', category: 'collection' },
  { id: 'dex-100', name: '완전 마스터',  description: '도감 100% 달성', icon: '📕', category: 'collection' },

  // 합성
  { id: 'first-evolve',    name: '첫 진화',            description: '포켓몬 처음 진화',             icon: '✨', category: 'merge' },
  { id: 'first-legendary', name: '전설의 시작',        description: '전설 포켓몬 첫 합성',          icon: '⭐', category: 'merge' },
  { id: 'first-mythic',    name: '신화의 경지',        description: '신화 포켓몬 첫 합성',          icon: '🌟', category: 'merge' },
  { id: 'arceus',          name: '창조신',             description: '아르세우스 합성',              icon: '👑', category: 'merge' },
  { id: 'eevee-all',       name: '이브이 마스터',      description: '이브이 진화체 7종 모두 획득', icon: '🦊', category: 'merge' },
  { id: 'mega-evolution',  name: '메가 진화의 힘',    description: '메가 진화 포켓몬 만들기',      icon: '💎', category: 'merge' },

  // 전투
  { id: 'first-boss', name: '첫 승리',      description: '첫 보스 처치',   icon: '⚔', category: 'combat' },
  { id: 'combo-10',   name: '연속 공격',    description: '10 콤보 달성',   icon: '🔥', category: 'combat' },
  { id: 'combo-25',   name: '폭풍 몰아치기', description: '25 콤보 달성', icon: '⚡', category: 'combat' },
  { id: 'no-life-lost', name: '완벽 방어',  description: '라이프 20 유지한 채 웨이브 10 클리어', icon: '🛡', category: 'combat' },

  // 시너지
  { id: 'synergy-any', name: '팀워크',           description: '시너지 활성화 성공', icon: '🤝', category: 'synergy' },
  { id: 'synergy-3',   name: '트리플 시너지',    description: '동시에 시너지 3개 활성', icon: '🎯', category: 'synergy' },
  { id: 'synergy-all', name: '모든 시너지 수집가', description: '모든 시너지 한 번씩 활성화', icon: '🏵', category: 'synergy' },

  // 경제
  { id: 'gold-1k',    name: '자산가',         description: '골드 1000 보유',      icon: '💰', category: 'economy' },
  { id: 'expand-max', name: '영역 확장자',    description: '모든 칸 해금',         icon: '🗺', category: 'economy' },
];

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  progress: '진행도',
  collection: '수집',
  merge: '합성',
  combat: '전투',
  synergy: '시너지',
  economy: '경제',
};
