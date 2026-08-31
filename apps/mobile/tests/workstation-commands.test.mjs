import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveWorkstationCommands,
  workstationCommandIds,
} from "../src/commands/workstation-commands.ts";

test("workstation registry keeps stable unique commands and shortcuts", () => {
  const commands = resolveWorkstationCommands({
    busy: false,
    view: "chat",
  });
  const ids = commands.map(({ id }) => id);

  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(
    commands.find(({ id }) => id === workstationCommandIds.newChat)?.modifiers,
    ["command"],
  );
  assert.equal(
    commands.find(({ id }) => id === workstationCommandIds.commandPalette)?.key,
    "p",
  );
  assert.equal(
    commands.find(({ id }) => id === workstationCommandIds.showChat)?.selected,
    true,
  );
  assert.equal(
    commands.find(({ id }) => id === workstationCommandIds.showAgents)?.key,
    "3",
  );
  assert.equal(
    commands.find(({ id }) => id === workstationCommandIds.showMemory)?.key,
    "4",
  );
  assert.equal(
    commands.find(({ id }) => id === workstationCommandIds.showAudio)?.key,
    "6",
  );
  assert.equal(
    commands.find(({ id }) => id === workstationCommandIds.showProviders)?.key,
    "5",
  );
  assert.equal(
    commands.find(({ id }) => id === workstationCommandIds.startBuild)?.enabled,
    false,
  );
  assert.equal(
    commands.find(({ id }) => id === workstationCommandIds.startResearch)
      ?.enabled,
    false,
  );
});

test("workstation command state follows active work and navigation", () => {
  const commands = resolveWorkstationCommands({
    busy: true,
    view: "craft",
  });
  const command = (id) => commands.find((candidate) => candidate.id === id);

  assert.equal(command(workstationCommandIds.newChat)?.enabled, false);
  assert.equal(command(workstationCommandIds.startResearch)?.enabled, false);
  assert.equal(command(workstationCommandIds.refreshSession)?.enabled, false);
  assert.equal(command(workstationCommandIds.showCraft)?.selected, true);
});
