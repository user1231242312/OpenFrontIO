import { Execution, Game, Player } from "../game/Game";

// Large but safely representable in the client update path. The admin can
// invoke the refill again at any time, giving the intended unlimited-resources
// experience without exposing unbounded numeric values to the renderer.
const ADMIN_GOLD_REFILL = 1_000_000_000_000n;
const ADMIN_TROOP_REFILL = 1_000_000_000_000;

/**
 * Deterministic simulation action for a server-authorized admin resource refill.
 * Authorization happens in GameServer before this execution reaches a turn.
 */
export class AdminGrantResourcesExecution implements Execution {
  private active = true;
  private target: Player | null = null;

  constructor(private targetClientID: string) {}

  init(game: Game): void {
    this.target = game.playerByClientID(this.targetClientID);
    if (this.target === null || !this.target.isAlive()) {
      this.active = false;
    }
  }

  tick(): void {
    if (this.target !== null) {
      this.target.addGold(ADMIN_GOLD_REFILL);
      this.target.addTroops(ADMIN_TROOP_REFILL);
    }
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  activeDuringSpawnPhase(): boolean {
    return true;
  }
}
