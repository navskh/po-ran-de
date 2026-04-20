import { GridSystem } from './GridSystem';
import { TowerUnit } from '../entities/TowerUnit';
import { getPokemon } from '../data/pokemonData';
import { findRecipe } from '../data/recipes';
import { EEVEE_ID, UMBREON_ID, getEeveeEvolutionFor } from '../data/eeveeEvolutions';

const METAMON_ID = 132;

export type MergeOutcome =
  | 'levelup'
  | 'starUp'
  | 'evolve'
  | 'metamonMerge'
  | 'metamonStar'
  | 'eeveeMerge'
  | 'legendary'
  | 'none';

export interface IMergeEvaluation {
  type: MergeOutcome;
  legendaryId?: number;
  legendaryKo?: string;
  eeveeId?: number;
  eeveeKo?: string;
}

export class MergeSystem {
  constructor(private grid: GridSystem) {}

  evaluate(dragged: TowerUnit, target: TowerUnit): IMergeEvaluation {
    if (dragged === target) return { type: 'none' };

    if (dragged.pokemon.id === EEVEE_ID && target.pokemon.id === EEVEE_ID) {
      return { type: 'eeveeMerge', eeveeId: UMBREON_ID, eeveeKo: '블래키' };
    }

    if (dragged.pokemon.id === target.pokemon.id) {
      const newLevel = target.level + dragged.level;
      if (newLevel > target.maxLevel()) {
        if (target.pokemon.evolvesTo !== null) return { type: 'evolve' };
        return { type: 'starUp' };
      }
      return { type: 'levelup' };
    }

    if (dragged.pokemon.id === METAMON_ID && target.pokemon.id !== METAMON_ID) {
      // 메타몽은 전설/신화(rarity 5+)에는 적용 불가 (너무 쉽게 별업 방지)
      if (target.pokemon.rarity >= 5) return { type: 'none' };
      if (target.pokemon.evolvesTo !== null) return { type: 'metamonMerge' };
      return { type: 'metamonStar' };
    }

    if (dragged.pokemon.id === EEVEE_ID && target.pokemon.id !== EEVEE_ID) {
      // 중간 진화체는 자연 진화시키도록 차단 (이상해풀 같은 stage 2+ 진화 잔여)
      if (target.pokemon.stage > 1 && target.pokemon.evolvesTo !== null) {
        return { type: 'none' };
      }
      const evo = getEeveeEvolutionFor(target.pokemon.types[0]);
      if (evo) return { type: 'eeveeMerge', eeveeId: evo.id, eeveeKo: evo.ko };
      return { type: 'none' };
    }

    const recipe = findRecipe(dragged.pokemon.id, target.pokemon.id);
    if (recipe) {
      return { type: 'legendary', legendaryId: recipe.result, legendaryKo: recipe.ko };
    }

    return { type: 'none' };
  }

  apply(dragged: TowerUnit, target: TowerUnit): IMergeEvaluation {
    const result = this.evaluate(dragged, target);
    if (result.type === 'none') return result;

    // 합산 기반: target/dragged 순서 무관하게 level/star 합산
    const combinedStars = target.extraStars + dragged.extraStars;
    const evolvedStars = Math.floor(combinedStars / 2); // 진화 시 합산의 절반 반영

    if (result.type === 'levelup') {
      const newLevel = Math.min(target.level + dragged.level, target.maxLevel());
      target.setLevel(newLevel);
      target.setStars(combinedStars);
      this.grid.removeUnit(dragged);
    } else if (result.type === 'starUp') {
      // 만렙 같은 종: dragged 별 + target 별 + 1(starUp)
      target.setStars(combinedStars + 1);
      this.grid.removeUnit(dragged);
    } else if (result.type === 'evolve') {
      const newPokemon = getPokemon(target.pokemon.evolvesTo!);
      target.evolveTo(newPokemon);
      target.setStars(evolvedStars);
      this.grid.removeUnit(dragged);
    } else if (result.type === 'metamonMerge') {
      const newPokemon = getPokemon(target.pokemon.evolvesTo!);
      target.evolveTo(newPokemon);
      target.setStars(evolvedStars);
      this.grid.removeUnit(dragged);
    } else if (result.type === 'metamonStar') {
      target.setStars(combinedStars + 1);
      this.grid.removeUnit(dragged);
    } else if (result.type === 'eeveeMerge') {
      const newPokemon = getPokemon(result.eeveeId!);
      const inheritedLevel = target.level;
      dragged.evolveTo(newPokemon);
      dragged.inherit(inheritedLevel, evolvedStars);
      const tCol = target.col;
      const tRow = target.row;
      this.grid.removeUnit(dragged);
      this.grid.removeUnit(target);
      this.grid.place(dragged, tCol, tRow);
    } else if (result.type === 'legendary') {
      const newPokemon = getPokemon(result.legendaryId!);
      target.evolveTo(newPokemon);
      target.setStars(evolvedStars);
      this.grid.removeUnit(dragged);
    }

    return result;
  }
}
