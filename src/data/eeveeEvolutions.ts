import type { PokemonType } from './typeChart';

export interface IEeveeEvolution {
  id: number;
  ko: string;
}

export const EEVEE_ID = 133;
export const UMBREON_ID = 197;

export const EEVEE_EVOLUTIONS: Partial<Record<PokemonType, IEeveeEvolution>> = {
  water:    { id: 134, ko: '샤미드' },
  electric: { id: 135, ko: '쥬피썬더' },
  fire:     { id: 136, ko: '부스터' },
  psychic:  { id: 196, ko: '에브이' },
  grass:    { id: 470, ko: '리피아' },
  ice:      { id: 471, ko: '글레이시아' },
};

export function getEeveeEvolutionFor(type: PokemonType): IEeveeEvolution | null {
  return EEVEE_EVOLUTIONS[type] ?? null;
}
