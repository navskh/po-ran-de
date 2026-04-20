import type { PokemonType } from './typeChart';

interface IPokemonInfo {
  ko: string;
  types: PokemonType[];
}

const POKEMON_INFO: Record<number, IPokemonInfo> = {
  1:   { ko: '이상해씨',   types: ['grass', 'poison'] },
  2:   { ko: '이상해풀',   types: ['grass', 'poison'] },
  3:   { ko: '이상해꽃',   types: ['grass', 'poison'] },
  4:   { ko: '파이리',     types: ['fire'] },
  5:   { ko: '리자드',     types: ['fire'] },
  6:   { ko: '리자몽',     types: ['fire', 'flying'] },
  7:   { ko: '꼬부기',     types: ['water'] },
  8:   { ko: '어니부기',   types: ['water'] },
  9:   { ko: '거북왕',     types: ['water'] },
  10:  { ko: '캐터피',     types: ['bug'] },
  11:  { ko: '단데기',     types: ['bug'] },
  12:  { ko: '버터플',     types: ['bug', 'flying'] },
  13:  { ko: '뿔충이',     types: ['bug', 'poison'] },
  14:  { ko: '딱충이',     types: ['bug', 'poison'] },
  15:  { ko: '독침붕',     types: ['bug', 'poison'] },
  16:  { ko: '구구',       types: ['normal', 'flying'] },
  17:  { ko: '피죤',       types: ['normal', 'flying'] },
  18:  { ko: '피죤투',     types: ['normal', 'flying'] },
  19:  { ko: '꼬렛',       types: ['normal'] },
  20:  { ko: '레트라',     types: ['normal'] },
  25:  { ko: '피카츄',     types: ['electric'] },
  26:  { ko: '라이츄',     types: ['electric'] },
  35:  { ko: '삐삐',       types: ['normal'] },
  36:  { ko: '픽시',       types: ['normal'] },
  37:  { ko: '식스테일',   types: ['fire'] },
  38:  { ko: '나인테일',   types: ['fire'] },
  39:  { ko: '푸린',       types: ['normal'] },
  40:  { ko: '푸크린',     types: ['normal'] },
  50:  { ko: '디그다',     types: ['ground'] },
  51:  { ko: '닥트리오',   types: ['ground'] },
  52:  { ko: '나옹',       types: ['normal'] },
  53:  { ko: '페르시온',   types: ['normal'] },
  58:  { ko: '가디',       types: ['fire'] },
  59:  { ko: '윈디',       types: ['fire'] },
  60:  { ko: '발챙이',     types: ['water'] },
  61:  { ko: '슈륙챙이',   types: ['water'] },
  62:  { ko: '강챙이',     types: ['water', 'fighting'] },
  63:  { ko: '캐이시',     types: ['psychic'] },
  64:  { ko: '윤겔라',     types: ['psychic'] },
  65:  { ko: '후딘',       types: ['psychic'] },
  66:  { ko: '알통몬',     types: ['fighting'] },
  67:  { ko: '근육몬',     types: ['fighting'] },
  68:  { ko: '괴력몬',     types: ['fighting'] },
  74:  { ko: '꼬마돌',     types: ['rock', 'ground'] },
  75:  { ko: '데구리',     types: ['rock', 'ground'] },
  76:  { ko: '딱구리',     types: ['rock', 'ground'] },
  83:  { ko: '파오리',     types: ['normal', 'flying'] },
  92:  { ko: '고오스',     types: ['ghost', 'poison'] },
  93:  { ko: '고우스트',   types: ['ghost', 'poison'] },
  94:  { ko: '팬텀',       types: ['ghost', 'poison'] },
  129: { ko: '잉어킹',     types: ['water'] },
  130: { ko: '갸라도스',   types: ['water', 'flying'] },
  132: { ko: '메타몽',     types: ['normal'] },
  133: { ko: '이브이',     types: ['normal'] },
  134: { ko: '샤미드',     types: ['water'] },
  135: { ko: '쥬피썬더',   types: ['electric'] },
  136: { ko: '부스터',     types: ['fire'] },
  143: { ko: '잠만보',     types: ['normal'] },
  144: { ko: '프리져',     types: ['ice', 'flying'] },
  145: { ko: '썬더',       types: ['electric', 'flying'] },
  146: { ko: '파이어',     types: ['fire', 'flying'] },
  147: { ko: '미뇽',       types: ['dragon'] },
  148: { ko: '신뇽',       types: ['dragon'] },
  149: { ko: '망나뇽',     types: ['dragon', 'flying'] },
  150: { ko: '뮤츠',       types: ['psychic'] },
  151: { ko: '뮤',         types: ['psychic'] },
  249: { ko: '루기아',     types: ['psychic', 'flying'] },
  250: { ko: '호오',       types: ['fire', 'flying'] },
  251: { ko: '셀레비',     types: ['psychic', 'grass'] },
  384: { ko: '레쿠쟈',     types: ['dragon', 'flying'] },
  483: { ko: '디아루가',   types: ['dragon'] },
  484: { ko: '펄기아',     types: ['dragon', 'water'] },
  493: { ko: '아르세우스', types: ['normal'] },
  196: { ko: '에브이',     types: ['psychic'] },
  197: { ko: '블래키',     types: ['dark'] },
  470: { ko: '리피아',     types: ['grass'] },
  471: { ko: '글레이시아', types: ['ice'] },

  // 1세대 단독 추가
  95:  { ko: '롱스톤',     types: ['rock', 'ground'] },
  106: { ko: '시라소몬',   types: ['fighting'] },
  107: { ko: '홍수몬',     types: ['fighting'] },
  108: { ko: '내루미',     types: ['normal'] },
  113: { ko: '럭키',       types: ['normal'] },
  114: { ko: '덩쿠리',     types: ['grass'] },
  115: { ko: '캥카',       types: ['normal'] },
  122: { ko: '마임맨',     types: ['psychic'] },
  123: { ko: '스라크',     types: ['bug', 'flying'] },
  124: { ko: '루주라',     types: ['ice', 'psychic'] },
  125: { ko: '에레브',     types: ['electric'] },
  126: { ko: '마그마',     types: ['fire'] },
  127: { ko: '쁘사이저',   types: ['bug'] },
  128: { ko: '켄타로스',   types: ['normal'] },
  131: { ko: '라프라스',   types: ['water', 'ice'] },
  137: { ko: '폴리곤',     types: ['normal'] },
  138: { ko: '암나이트',   types: ['rock', 'water'] },
  139: { ko: '암스타',     types: ['rock', 'water'] },
  140: { ko: '투구',       types: ['rock', 'water'] },
  141: { ko: '투구푸스',   types: ['rock', 'water'] },
  142: { ko: '프테라',     types: ['rock', 'flying'] },

  // 2세대 진화체
  208: { ko: '강철톤',     types: ['steel', 'ground'] },
  212: { ko: '핫삼',       types: ['bug', 'steel'] },
  233: { ko: '폴리곤2',    types: ['normal'] },
  242: { ko: '해피너스',   types: ['normal'] },

  // 2세대 전설 트리오
  243: { ko: '라이코',     types: ['electric'] },
  244: { ko: '엔테이',     types: ['fire'] },
  245: { ko: '스이쿤',     types: ['water'] },

  // 4세대 진화체
  466: { ko: '에레키블',   types: ['electric'] },
  467: { ko: '마그마번',   types: ['fire'] },
  474: { ko: '폴리곤Z',    types: ['normal'] },

  // 메가 진화 (1세대 8종)
  10033: { ko: '메가 이상해꽃',  types: ['grass', 'poison'] },
  10035: { ko: '메가 리자몽Y',   types: ['fire', 'flying'] },
  10036: { ko: '메가 거북왕',   types: ['water'] },
  10037: { ko: '메가 후딘',     types: ['psychic'] },
  10042: { ko: '메가 갸라도스', types: ['water', 'dark'] },
  10043: { ko: '메가 뮤츠Y',    types: ['psychic'] },
};

const EVOLUTION_CHAINS: number[][] = [
  // 메가 진화 포함 체인
  [1, 2, 3, 10033],           // 이상해씨 → 이상해풀 → 이상해꽃 → 메가 이상해꽃
  [4, 5, 6, 10035],            // 파이리 → 리자드 → 리자몽 → 메가 리자몽Y
  [7, 8, 9, 10036],            // 꼬부기 → 어니부기 → 거북왕 → 메가 거북왕
  [63, 64, 65, 10037],         // 캐이시 → 윤겔라 → 후딘 → 메가 후딘
  [129, 130, 10042],           // 잉어킹 → 갸라도스 → 메가 갸라도스
  [150, 10043],                // 뮤츠 → 메가 뮤츠Y

  // 일반 진화 체인
  [10, 11, 12], [13, 14, 15], [16, 17, 18],
  [60, 61, 62], [66, 67, 68],
  [74, 75, 76], [92, 93, 94], [147, 148, 149],
  [19, 20], [25, 26], [35, 36], [37, 38], [39, 40], [50, 51], [52, 53],
  [58, 59], [133, 134],

  // 신규 자연 진화 체인 (단독 포켓몬의 2단계 진화)
  [95, 208],                   // 롱스톤 → 강철톤
  [113, 242],                  // 럭키 → 해피너스
  [123, 212],                  // 스라크 → 핫삼
  [125, 466],                  // 에레브 → 에레키블
  [126, 467],                  // 마그마 → 마그마번
  [137, 233, 474],             // 폴리곤 → 폴리곤2 → 폴리곤Z
  [138, 139],                  // 암나이트 → 암스타
  [140, 141],                  // 투구 → 투구푸스

  // 단독 (진화 없음)
  [83], [132], [143], [144], [145], [146], [151],
  [135], [136], [196], [197], [470], [471],
  [249], [250], [251], [384], [483], [484], [493],
  [106], [107], [108], [114], [122], [124], [127], [128], [131],
  [243], [244], [245],
];

const BASE_RARITY: Record<number, 1 | 2 | 3 | 4 | 5 | 6> = {
  10: 1, 13: 1, 16: 1, 19: 1,
  1: 2, 4: 2, 7: 2, 25: 2, 35: 2, 37: 2, 39: 2, 50: 2, 52: 2,
  58: 2, 60: 2, 63: 2, 66: 2, 74: 2, 92: 2, 129: 2, 95: 2,
  83: 3, 132: 3, 133: 3, 147: 3,
  106: 3, 107: 3, 108: 3, 113: 3, 114: 3, 115: 3, 122: 3, 123: 3,
  124: 3, 125: 3, 126: 3, 127: 3, 128: 3, 137: 3, 138: 3, 140: 3,
  134: 4, 135: 4, 136: 4, 196: 4, 197: 4, 470: 4, 471: 4,
  131: 4, 142: 4, 143: 4,
  144: 5, 145: 5, 146: 5, 150: 5, 151: 5,
  243: 5, 244: 5, 245: 5,
  249: 5, 250: 5, 251: 5, 384: 5,
  483: 6, 484: 6, 493: 6,
};

// 단독 합성 결과 (RECIPES result) - 기본 뽑기에서 제외, 고급 뽑기에 일정 확률로 포함
const RECIPE_RESULTS = new Set<number>([
  // 1세대 단독 (rarity 3~4)
  95, 106, 107, 108, 113, 114, 115, 122, 123, 124,
  125, 126, 127, 128, 131, 137, 138, 140, 142, 143,
  // 1세대 전설 (rarity 5)
  144, 145, 146, 150, 151,
  // 2세대 전설 (rarity 5)
  243, 244, 245,
]);

const GACHA_EXCLUDED = new Set<number>([
  // 이브이 진화체 (이브이로만 얻기)
  134, 135, 136, 196, 197, 470, 471,
  // 신화/메가 전설 (합성으로만)
  249, 250, 251, 384, 483, 484, 493,
  // 2세대/4세대 진화체 (자연 진화로만)
  139, 141, 208, 212, 233, 242, 466, 467, 474,
  // 메가 진화 (자연 진화로만)
  10033, 10035, 10036, 10037, 10042, 10043,
  // 단독 합성 결과 (고급 뽑기로만)
  ...RECIPE_RESULTS,
]);

const RARITY_BASE_STATS: Record<number, { hp: number; attack: number; range: number; attackSpeed: number }> = {
  1: { hp: 80,   attack: 12,   range: 240, attackSpeed: 1.0 },
  2: { hp: 130,  attack: 22,   range: 260, attackSpeed: 1.1 },
  3: { hp: 220,  attack: 38,   range: 280, attackSpeed: 1.2 },
  4: { hp: 380,  attack: 65,   range: 300, attackSpeed: 1.3 },
  5: { hp: 1100, attack: 200,  range: 400, attackSpeed: 1.8 },
  6: { hp: 3500, attack: 1200, range: 500, attackSpeed: 2.2 },
};

export const RARITY_COLORS: Record<number, number> = {
  1: 0x9aa0c5,
  2: 0x66cc66,
  3: 0x4488ff,
  4: 0xaa55ee,
  5: 0xff9933,
  6: 0xff33dd,
};

export const RARITY_NAMES: Record<number, string> = {
  1: 'C', 2: 'U', 3: 'R', 4: 'E', 5: 'L', 6: 'M',
};

export const MAX_LEVEL = 5;

// 특정 포켓몬의 진화 난이도 커스텀 (id별 오버라이드)
const CUSTOM_MAX_LEVEL: Record<number, number> = {
  // 빨리 진화 (실제 포켓몬 게임에서 low-level 진화)
  10: 1, 11: 1,   // 캐터피 → 단데기 → 버터플 (한방)
  13: 1, 14: 1,   // 뿔충이 → 딱충이 → 독침붕
  // 느리게 진화 (실제 망나뇽/카이리 류, 55레벨 진화)
  147: 3, 148: 4, // 미뇽 → 신뇽 → 망나뇽
  129: 3,         // 잉어킹 → 갸라도스 (20레벨)
  63: 3, 64: 3,   // 캐이시 → 윤겔라 → 후딘
};

export function getMaxLevel(stage: number, id?: number): number {
  if (id !== undefined && CUSTOM_MAX_LEVEL[id] !== undefined) {
    return CUSTOM_MAX_LEVEL[id];
  }
  if (stage === 1) return 1;
  if (stage === 2) return 2;
  if (stage === 3) return 3;
  return 5;
}

export const GACHA_RATES: Record<number, number> = {
  1: 0.55,
  2: 0.30,
  3: 0.11,
  4: 0.035,
  5: 0.005,
};

const NEXT_EVOLUTION: Record<number, number | null> = {};
const STAGE: Record<number, number> = {};
const BASE_OF: Record<number, number> = {};

// 신화 그레이드 (stage 5): 전설 위의 최상위 티어
const MYTHIC_STAGE_OVERRIDE: Record<number, number> = {
  249: 5, 250: 5, 251: 5, 384: 5,  // 2세대 전설 신화 격상
  483: 5, 484: 5, 493: 5,          // 3세대 신화
};

for (const chain of EVOLUTION_CHAINS) {
  for (let i = 0; i < chain.length; i++) {
    NEXT_EVOLUTION[chain[i]] = chain[i + 1] ?? null;
    STAGE[chain[i]] = i + 1;
    BASE_OF[chain[i]] = chain[0];
  }
}
for (const [id, s] of Object.entries(MYTHIC_STAGE_OVERRIDE)) {
  STAGE[Number(id)] = s;
}

export interface IPokemon {
  id: number;
  ko: string;
  types: PokemonType[];
  stage: number;
  evolvesTo: number | null;
  rarity: 1 | 2 | 3 | 4 | 5 | 6;
  hp: number;
  attack: number;
  range: number;
  attackSpeed: number;
}

export function getPokemon(id: number): IPokemon {
  const info = POKEMON_INFO[id];
  if (!info) throw new Error(`Unknown pokemon id: ${id}`);
  const baseId = BASE_OF[id];
  const rarity = BASE_RARITY[baseId];
  const stage = STAGE[id];
  const stats = RARITY_BASE_STATS[rarity];
  const stageMult =
    stage === 1 ? 1 :
    stage === 2 ? 2.2 :
    stage === 3 ? 4.5 :
    stage === 4 ? 8.0 :
    stage === 5 ? 1.5 :  // 신화: rarity 5/6 위에 1.5배 가중
    1;
  return {
    id,
    ko: info.ko,
    types: info.types,
    stage,
    evolvesTo: NEXT_EVOLUTION[id],
    rarity,
    hp: Math.floor(stats.hp * stageMult),
    attack: Math.floor(stats.attack * stageMult),
    range: stats.range + (stage - 1) * 20,
    attackSpeed: stats.attackSpeed + (stage - 1) * 0.15,
  };
}

export function getSpriteKey(id: number): string {
  return `pkmn-${id}`;
}

export function getSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export const ALL_POKEMON_IDS: number[] = Object.keys(POKEMON_INFO).map(Number);
export const BASE_POKEMON_IDS: number[] = Object.keys(BASE_RARITY)
  .map(Number)
  .filter((id) => !GACHA_EXCLUDED.has(id));

export function rollGachaRarity(): 1 | 2 | 3 | 4 | 5 {
  const r = Math.random();
  let acc = 0;
  for (const rarityStr of [1, 2, 3, 4, 5] as const) {
    acc += GACHA_RATES[rarityStr];
    if (r < acc) return rarityStr;
  }
  return 1;
}

export function rollRandomPokemonId(): number {
  const rarity = rollGachaRarity();
  const candidates = BASE_POKEMON_IDS.filter((id) => BASE_RARITY[id] === rarity);
  if (candidates.length === 0) {
    return BASE_POKEMON_IDS[Math.floor(Math.random() * BASE_POKEMON_IDS.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// 고급 뽑기: 30% 확률로 단독 합성 결과(전설 제외) + 70%는 일반 풀 + 5% 확률로 1세대 전설
export const ADVANCED_RECIPE_POOL: number[] = [
  95, 106, 107, 108, 113, 114, 115, 122, 123, 124,
  125, 126, 127, 128, 131, 137, 138, 140, 142, 143,
];
export const ADVANCED_LEGENDARY_POOL: number[] = [144, 145, 146, 150, 151, 243, 244, 245];

export function rollAdvancedRandomPokemonId(): number {
  // 전설/신화는 조합으로만 (고급 뽑기에서 제거)
  const r = Math.random();
  if (r < 0.40) {
    return ADVANCED_RECIPE_POOL[Math.floor(Math.random() * ADVANCED_RECIPE_POOL.length)];
  }
  // 2성 이상 가중 뽑기 (1성 뿔충이/캐터피 등 제외)
  const rr = Math.random();
  let rarity: 2 | 3 | 4;
  if (rr < 0.55) rarity = 2;
  else if (rr < 0.88) rarity = 3;
  else rarity = 4;
  const candidates = BASE_POKEMON_IDS.filter((id) => BASE_RARITY[id] === rarity);
  if (candidates.length === 0) {
    const fallback = BASE_POKEMON_IDS.filter((id) => BASE_RARITY[id] >= 2);
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}
void ADVANCED_LEGENDARY_POOL;
