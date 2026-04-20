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
      // 1세대 전설 (완전체 + 완전체, 속성 기준)
      { ingredients: [6, 18],   result: 146, ko: '파이어' },    // 리자몽+피죤투 (불+비행)
      { ingredients: [26, 18],  result: 145, ko: '썬더' },      // 라이츄+피죤투 (전기+비행)
      { ingredients: [124, 18], result: 144, ko: '프리져' },    // 루주라+피죤투 (얼음/에스퍼+비행)
      { ingredients: [65, 68],  result: 150, ko: '뮤츠' },      // 후딘+괴력몬 (에스퍼+격투)
      { ingredients: [149, 65], result: 151, ko: '뮤' },        // 망나뇽+후딘 (드래곤+에스퍼)
      // 화석/고대 단독
      { ingredients: [75, 8],   result: 138, ko: '암나이트' },
      { ingredients: [61, 75],  result: 140, ko: '투구' },
      { ingredients: [17, 5],   result: 142, ko: '프테라' },
      { ingredients: [14, 17],  result: 123, ko: '스라크' },
      { ingredients: [64, 8],   result: 124, ko: '루주라' },
      { ingredients: [64, 53],  result: 137, ko: '폴리곤' },
      // 2세대 전설 트리오 (완전체 속성 페어)
      { ingredients: [125, 26],  result: 243, ko: '라이코' },   // 에레브(단독 완전체) + 라이츄 (전기+전기)
      { ingredients: [126, 59],  result: 244, ko: '엔테이' },   // 마그마(단독 완전체) + 윈디 (불+불)
      { ingredients: [131, 62],  result: 245, ko: '스이쿤' },   // 라프라스(단독 완전체) + 강챙이 (물+물)
    ],
  },
  {
    title: '신화 (★5)',
    subtitle: '최종 진화체 / 전설 / 드래곤 페어 → 신화 포켓몬',
    recipes: [
      { ingredients: [6, 18],    result: 250, ko: '호오' },       // 리자몽+피죤투 (불/비행+노말/비행)
      { ingredients: [65, 18],   result: 249, ko: '루기아' },     // 후딘+피죤투 (에스퍼+비행)
      { ingredients: [65, 3],    result: 251, ko: '셀레비' },     // 후딘+이상해꽃 (에스퍼+풀)
      { ingredients: [149, 18],  result: 384, ko: '레쿠쟈' },     // 망나뇽+피죤투 (드래곤/비행)
      { ingredients: [147, 148], result: 483, ko: '디아루가' },   // 미뇽+신뇽 (드래곤+드래곤)
      { ingredients: [149, 130], result: 484, ko: '펄기아' },     // 망나뇽+갸라도스 (드래곤/물)
      { ingredients: [150, 151], result: 493, ko: '아르세우스' }, // 뮤츠+뮤 (에스퍼 신화)
      // 단독 합성 result 페어로 신화
      { ingredients: [122, 124], result: 151, ko: '뮤' },        // 마임맨+루주라 (에스퍼끼리)
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
  {
    title: '이브이 진화체 조합',
    subtitle: '이브이 진화체 페어 → 전설 포켓몬',
    recipes: [
      { ingredients: [134, 135], result: 245, ko: '스이쿤' },   // 샤미드 + 쥬피썬더 (물+전기)
      { ingredients: [136, 135], result: 243, ko: '라이코' },   // 부스터 + 쥬피썬더 (불+전기)
      { ingredients: [136, 134], result: 244, ko: '엔테이' },   // 부스터 + 샤미드 (불+물)
      { ingredients: [196, 197], result: 150, ko: '뮤츠' },     // 에브이 + 블래키 (에스퍼+악)
      { ingredients: [470, 471], result: 251, ko: '셀레비' },   // 리피아 + 글레이시아 (풀+얼음)
      { ingredients: [197, 134], result: 249, ko: '루기아' },   // 블래키 + 샤미드 (악+물)
      { ingredients: [136, 470], result: 250, ko: '호오' },     // 부스터 + 리피아 (불+풀)
      { ingredients: [471, 135], result: 144, ko: '프리져' },   // 글레이시아 + 쥬피썬더 (얼음+전기)
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
