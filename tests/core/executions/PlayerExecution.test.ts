import { PlayerExecution } from "../../../src/core/execution/PlayerExecution";
import {
  Game,
  Player,
  PlayerInfo,
  PlayerType,
  UnitType,
} from "../../../src/core/game/Game";
import { setup } from "../../util/Setup";
import { executeTicks } from "../../util/utils";

let game: Game;
let player: Player;
let otherPlayer: Player;

describe("PlayerExecution", () => {
  beforeEach(async () => {
    game = await setup(
      "big_plains",
      { infiniteGold: true, instantBuild: true },
      [
        new PlayerInfo("player", PlayerType.Human, "client_id1", "player_id"),
        new PlayerInfo("other", PlayerType.Human, "client_id2", "other_id"),
      ],
    );

    player = game.player("player_id");
    otherPlayer = game.player("other_id");

    game.addExecution(new PlayerExecution(player));
    game.addExecution(new PlayerExecution(otherPlayer));
  });

  test("DefensePost lv. 1 is destroyed when tile owner changes", () => {
    const tile = game.ref(50, 50);
    player.conquer(tile);
    const defensePost = player.buildUnit(UnitType.DefensePost, tile, {});

    game.executeNextTick();
    expect(game.unitCount(UnitType.DefensePost)).toBe(1);
    expect(defensePost.level()).toBe(1);

    otherPlayer.conquer(tile);
    executeTicks(game, 2);

    expect(game.unitCount(UnitType.DefensePost)).toBe(0);
  });

  test("DefensePost lv. 2+ is destroyed when tile owner changes", () => {
    const tile = game.ref(50, 50);
    player.conquer(tile);
    const defensePost = player.buildUnit(UnitType.DefensePost, tile, {});
    defensePost.increaseLevel();

    expect(defensePost.level()).toBe(2);
    expect(game.unitCount(UnitType.DefensePost)).toBe(2); // unitCount sums levels
    expect(player.units(UnitType.DefensePost)).toHaveLength(1);
    expect(defensePost.isActive()).toBe(true);

    otherPlayer.conquer(tile);
    executeTicks(game, 2);

    expect(game.unitCount(UnitType.DefensePost)).toBe(0);
    expect(defensePost.isActive()).toBe(false);
  });

  test("Non-DefensePost structures are transferred (not downgraded) when tile owner changes", () => {
    const tile = game.ref(50, 50);
    player.conquer(tile);
    const city = player.buildUnit(UnitType.City, tile, {});

    expect(game.unitCount(UnitType.City)).toBe(1);
    expect(city.level()).toBe(1);
    expect(city.owner()).toBe(player);
    expect(city.isActive()).toBe(true);

    otherPlayer.conquer(tile);
    executeTicks(game, 2);

    expect(game.unitCount(UnitType.City)).toBe(1);
    expect(city.level()).toBe(1);
    expect(city.owner()).toBe(otherPlayer);
    expect(city.isActive()).toBe(true);
  });

  test("an eliminated human takes over the first available living bot nation", () => {
    const unavailableBot = game.addPlayer(
      new PlayerInfo("unavailable", PlayerType.Bot, null, "unavailable_bot"),
    );
    const availableBot = game.addPlayer(
      new PlayerInfo("available", PlayerType.Bot, null, "available_bot"),
    );
    availableBot.conquer(game.ref(70, 70));

    player.conquer(game.ref(60, 60));
    player.relinquish(game.ref(60, 60));
    executeTicks(game, 2);

    expect(player.isAlive()).toBe(false);
    expect(player.clientID()).toBe("client_id1");
    expect(unavailableBot.type()).toBe(PlayerType.Bot);
    expect(availableBot.type()).toBe(PlayerType.Human);
    expect(availableBot.clientID()).toBe("client_id1");
    expect(game.playerByClientID("client_id1")).toBe(availableBot);
    expect(game.stats().getPlayerStats(player)?.killedAt).toBeDefined();
  });

  test("an eliminated human remains eliminated when no living bot is available", () => {
    player.conquer(game.ref(60, 60));
    player.relinquish(game.ref(60, 60));
    executeTicks(game, 2);

    expect(player.isAlive()).toBe(false);
    expect(player.clientID()).toBe("client_id1");
    expect(game.playerByClientID("client_id1")).toBe(player);
  });
});
