export interface IRecipe {
  ingredients: [number, number];
  result: number;
  ko: string;
}

export interface IRecipePage {
  title: string;
  subtitle: string;
  recipes: IRecipe[];
}

export const RECIPE_PAGES: IRecipePage[] = [
  {
    title: '진화체 합성 1',
    subtitle: '기본 진화 페어 — 베이스 두 마리',
    recipes: [
      { ingredients: [4, 37],   result: 6,   ko: '리자몽' },
      { ingredients: [7, 129],  result: 9,   ko: '거북왕' },
      { ingredients: [1, 10],   result: 3,   ko: '이상해꽃' },
      { ingredients: [16, 19],  result: 18,  ko: '피죤투' },
      { ingredients: [63, 39],  result: 65,  ko: '후딘' },
      { ingredients: [66, 58],  result: 68,  ko: '괴력몬' },
      { ingredients: [147, 66], result: 149, ko: '망나뇽' },
      { ingredients: [10, 13],  result: 12,  ko: '버터플' },
    ],
  },
  {
    title: '진화체 합성 2',
    subtitle: '추가 진화 페어 — 쉬움',
    recipes: [
      { ingredients: [129, 16], result: 130, ko: '갸라도스' },
      { ingredients: [74, 58],  result: 59,  ko: '윈디' },
      { ingredients: [92, 63],  result: 94,  ko: '팬텀' },
      { ingredients: [60, 66],  result: 62,  ko: '강챙이' },
      { ingredients: [39, 1],   result: 143, ko: '잠만보' },
      { ingredients: [13, 16],  result: 15,  ko: '독침붕' },
      { ingredients: [74, 50],  result: 76,  ko: '딱구리' },
      { ingredients: [19, 52],  result: 20,  ko: '레트라' },
    ],
  },
  {
    title: '1세대 전설',
    subtitle: '1차 진화체끼리 합성 — 중간',
    recipes: [
      { ingredients: [5, 17],   result: 146, ko: '파이어' },
      { ingredients: [26, 61],  result: 145, ko: '썬더' },
      { ingredients: [38, 2],   result: 144, ko: '프리져' },
      { ingredients: [64, 67],  result: 150, ko: '뮤츠' },
      { ingredients: [148, 64], result: 151, ko: '뮤' },
    ],
  },
  {
    title: '메가 / 신화 전설',
    subtitle: '최종 진화체 또는 전설끼리 — 어려움',
    recipes: [
      { ingredients: [6, 18],    result: 250, ko: '호오' },
      { ingredients: [65, 18],   result: 249, ko: '루기아' },
      { ingredients: [65, 3],    result: 251, ko: '셀레비' },
      { ingredients: [149, 18],  result: 384, ko: '레쿠쟈' },
      { ingredients: [144, 145], result: 483, ko: '디아루가' },
      { ingredients: [250, 249], result: 484, ko: '펄기아' },
      { ingredients: [150, 151], result: 493, ko: '아르세우스' },
    ],
  },
];

export const RECIPES: IRecipe[] = RECIPE_PAGES.flatMap((p) => p.recipes);

export interface ILegendaryMatch {
  result: number;
  ko: string;
}

export function findRecipe(idA: number, idB: number): ILegendaryMatch | null {
  for (const r of RECIPES) {
    const [a, b] = r.ingredients;
    if ((a === idA && b === idB) || (a === idB && b === idA)) {
      return { result: r.result, ko: r.ko };
    }
  }
  return null;
}
