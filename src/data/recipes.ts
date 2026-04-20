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
    title: '단독 합성 — 기본',
    subtitle: '베이스 포켓몬 페어 → 단독 포켓몬',
    recipes: [
      { ingredients: [39, 1],   result: 143, ko: '잠만보' },
      { ingredients: [10, 13],  result: 127, ko: '쁘사이저' },
      { ingredients: [4, 37],   result: 126, ko: '마그마' },
      { ingredients: [25, 19],  result: 125, ko: '에레브' },
      { ingredients: [7, 129],  result: 131, ko: '라프라스' },
      { ingredients: [74, 50],  result: 95,  ko: '롱스톤' },
      { ingredients: [66, 63],  result: 122, ko: '마임맨' },
      { ingredients: [66, 58],  result: 106, ko: '시라소몬' },
      { ingredients: [66, 52],  result: 107, ko: '홍수몬' },
      { ingredients: [52, 19],  result: 128, ko: '켄타로스' },
      { ingredients: [35, 39],  result: 113, ko: '럭키' },
      { ingredients: [1, 10],   result: 114, ko: '덩쿠리' },
      { ingredients: [52, 39],  result: 108, ko: '내루미' },
      { ingredients: [35, 52],  result: 115, ko: '캥카' },
    ],
  },
  {
    title: '단독 합성 — 고급',
    subtitle: '1차 진화체 페어 → 전설 / 강한 단독',
    recipes: [
      // 1세대 전설
      { ingredients: [5, 17],   result: 146, ko: '파이어' },
      { ingredients: [26, 61],  result: 145, ko: '썬더' },
      { ingredients: [38, 2],   result: 144, ko: '프리져' },
      { ingredients: [64, 67],  result: 150, ko: '뮤츠' },
      { ingredients: [148, 64], result: 151, ko: '뮤' },
      // 화석/고대 단독
      { ingredients: [75, 8],   result: 138, ko: '암나이트' },
      { ingredients: [61, 75],  result: 140, ko: '투구' },
      { ingredients: [17, 5],   result: 142, ko: '프테라' },
      { ingredients: [14, 17],  result: 123, ko: '스라크' },
      { ingredients: [64, 8],   result: 124, ko: '루주라' },
      { ingredients: [64, 53],  result: 137, ko: '폴리곤' },
      // 2세대 전설 트리오 (단독 합성 result 페어로 chain 깊이 추가)
      { ingredients: [127, 123], result: 243, ko: '라이코' },   // 쁘사이저 + 스라크
      { ingredients: [126, 125], result: 244, ko: '엔테이' },   // 마그마 + 에레브
      { ingredients: [143, 131], result: 245, ko: '스이쿤' },   // 잠만보 + 라프라스
    ],
  },
  {
    title: '메가 / 신화 전설',
    subtitle: '최종 진화체 또는 전설끼리 합성',
    recipes: [
      { ingredients: [6, 18],    result: 250, ko: '호오' },
      { ingredients: [65, 18],   result: 249, ko: '루기아' },
      { ingredients: [65, 3],    result: 251, ko: '셀레비' },
      { ingredients: [149, 18],  result: 384, ko: '레쿠쟈' },
      { ingredients: [144, 145], result: 483, ko: '디아루가' },
      { ingredients: [250, 249], result: 484, ko: '펄기아' },
      { ingredients: [150, 151], result: 493, ko: '아르세우스' },
      // 단독 합성 result 페어로 신화 만들기
      { ingredients: [122, 124], result: 151, ko: '뮤' },        // 마임맨 + 루주라 (에스퍼끼리)
      { ingredients: [128, 115], result: 384, ko: '레쿠쟈' },    // 켄타로스 + 캥카 (강한 단독 페어)
      { ingredients: [113, 108], result: 251, ko: '셀레비' },    // 럭키 + 내루미 (귀여운 노말 페어)
    ],
  },
  {
    title: '이브이 진화',
    subtitle: '이브이 + 같은 타입 포켓몬 → 해당 진화체 (예시)',
    recipes: [
      { ingredients: [133, 133], result: 197, ko: '블래키' },
      { ingredients: [133, 7],   result: 134, ko: '샤미드' },
      { ingredients: [133, 25],  result: 135, ko: '쥬피썬더' },
      { ingredients: [133, 4],   result: 136, ko: '부스터' },
      { ingredients: [133, 63],  result: 196, ko: '에브이' },
      { ingredients: [133, 1],   result: 470, ko: '리피아' },
      { ingredients: [133, 124], result: 471, ko: '글레이시아' },
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
