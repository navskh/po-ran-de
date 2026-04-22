import { GameState } from '../state/GameState';
import { GridSystem } from './GridSystem';
import { ALL_POKEMON_IDS } from '../data/pokemonData';
import { SYNERGY_GROUPS } from '../data/synergies';

const EEVEE_EVOLVED_IDS = [134, 135, 136, 196, 197, 470, 471];
const LEGENDARY_IDS = new Set([144, 145, 146, 150, 151, 243, 244, 245, 638, 649]);
const MYTHIC_IDS = new Set([249, 250, 251, 384, 483, 484, 493]);
const MEGA_IDS = new Set([10033, 10035, 10036, 10037, 10042, 10043]);

export class AchievementSystem {
  constructor(private state: GameState, private grid: GridSystem) {}

  // 웨이브 종료 시
  onWaveEnd(wave: number, livesBefore: number): void {
    if (wave >= 10) this.state.unlockAchievement('wave-10');
    if (wave >= 25) this.state.unlockAchievement('wave-25');
    if (wave >= 50) this.state.unlockAchievement('wave-50');
    if (wave >= 75) this.state.unlockAchievement('wave-75');
    if (wave >= 100) this.state.unlockAchievement('wave-100');
    // 라이프 20 유지 채 웨이브 10 클리어
    if (wave >= 10 && livesBefore === 20 && this.state.lives === 20) {
      this.state.unlockAchievement('no-life-lost');
    }
  }

  // 도감 추가 시
  onDexAdded(): void {
    const total = ALL_POKEMON_IDS.length;
    const acquired = this.state.dex.size;
    const pct = acquired / total;
    if (pct >= 0.25) this.state.unlockAchievement('dex-25');
    if (pct >= 0.50) this.state.unlockAchievement('dex-50');
    if (pct >= 0.75) this.state.unlockAchievement('dex-75');
    if (pct >= 1.00) this.state.unlockAchievement('dex-100');

    // 이브이 7종
    if (EEVEE_EVOLVED_IDS.every((id) => this.state.dex.has(id))) {
      this.state.unlockAchievement('eevee-all');
    }
  }

  // 합성 결과에 따라
  onMerge(resultType: string, resultId?: number): void {
    if (resultType === 'evolve' || resultType === 'metamonMerge') {
      this.state.unlockAchievement('first-evolve');
    }
    if (resultId !== undefined) {
      if (LEGENDARY_IDS.has(resultId)) this.state.unlockAchievement('first-legendary');
      if (MYTHIC_IDS.has(resultId)) this.state.unlockAchievement('first-mythic');
      if (resultId === 493) this.state.unlockAchievement('arceus');
    }
  }

  // 진화 후 (evolveTo 결과 id 확인)
  onEvolveTo(newId: number): void {
    this.state.unlockAchievement('first-evolve');
    if (MEGA_IDS.has(newId)) this.state.unlockAchievement('mega-evolution');
    if (LEGENDARY_IDS.has(newId)) this.state.unlockAchievement('first-legendary');
    if (MYTHIC_IDS.has(newId)) this.state.unlockAchievement('first-mythic');
    if (newId === 493) this.state.unlockAchievement('arceus');
  }

  // 보스 처치
  onBossKill(): void {
    this.state.unlockAchievement('first-boss');
  }

  // 콤보 달성
  onCombo(count: number): void {
    if (count >= 10) this.state.unlockAchievement('combo-10');
    if (count >= 25) this.state.unlockAchievement('combo-25');
  }

  // 시너지 활성화
  onSynergyActive(activeIds: string[]): void {
    if (activeIds.length > 0) this.state.unlockAchievement('synergy-any');
    if (activeIds.length >= 3) this.state.unlockAchievement('synergy-3');
    for (const id of activeIds) this.state.markSynergySeen(id);
    // 모든 시너지 한 번씩
    const totalSyn = SYNERGY_GROUPS.length;
    if (this.state.synergySeen.size >= totalSyn) {
      this.state.unlockAchievement('synergy-all');
    }
  }

  // 골드 변화
  onGoldChange(gold: number): void {
    if (gold >= 1000) this.state.unlockAchievement('gold-1k');
  }

  // 칸 확장
  onColsChanged(unlocked: number, maxCols: number): void {
    if (unlocked >= maxCols) this.state.unlockAchievement('expand-max');
  }

  void(): void {
    // 타입 확장용
    void this.grid;
  }
}
