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
      if (target.pokemon.evolvesTo !== null) return { type: 'metamonMerge' };
      return { type: 'metamonStar' };
    }

    if (dragged.pokemon.id === EEVEE_ID && target.pokemon.id !== EEVEE_ID) {
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

    if (result.type === 'levelup') {
      target.setLevel(target.level + dragged.level);
      this.grid.removeUnit(dragged);
    } else if (result.type === 'starUp') {
      target.addStar();
      this.grid.removeUnit(dragged);
    } else if (result.type === 'evolve') {
      const newPokemon = getPokemon(target.pokemon.evolvesTo!);
      target.evolveTo(newPokemon);
      this.grid.removeUnit(dragged);
    } else if (result.type === 'metamonMerge') {
      const newPokemon = getPokemon(target.pokemon.evolvesTo!);
      target.evolveTo(newPokemon);
      this.grid.removeUnit(dragged);
    } else if (result.type === 'metamonStar') {
      target.addStar();
      this.grid.removeUnit(dragged);
    } else if (result.type === 'eeveeMerge') {
      const newPokemon = getPokemon(result.eeveeId!);
      const inheritedLevel = target.level;
      const inheritedStars = target.extraStars;
      dragged.evolveTo(newPokemon);
      dragged.inherit(inheritedLevel, inheritedStars);
      const tCol = target.col;
      const tRow = target.row;
      this.grid.removeUnit(dragged);
      this.grid.removeUnit(target);
      this.grid.place(dragged, tCol, tRow);
    } else if (result.type === 'legendary') {
      const newPokemon = getPokemon(result.legendaryId!);
      target.evolveTo(newPokemon);
      this.grid.removeUnit(dragged);
    }

    return result;
  }
}
