import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveWorkstationCommands,
  workstationCommandIds,
} from "../src/commands/workstation-commands.ts";

test("workstation registry keeps stable unique commands and shortcuts", () => {
  const commands = resolveWorkstationCommands({
    busy: false,
    sidebarVisible: true,
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
    commands.find(({ id }) => id === workstationCommandIds.showIssues)?.key,
    "3",
  );
  assert.equal(
    commands.find(({ id }) => id === workstationCommandIds.showMemory)?.key,
    "4",
  );
  assert.equal(
    commands.find(({ id }) => id === workstationCommandIds.showAudio)?.key,
    "5",
  );
});

test("workstation command state follows active work and navigation", () => {
  const commands = resolveWorkstationCommands({
    busy: true,
    sidebarVisible: false,
    view: "craft",
  });
  const command = (id) => commands.find((candidate) => candidate.id === id);

  assert.equal(command(workstationCommandIds.newChat)?.enabled, false);
  assert.equal(command(workstationCommandIds.startResearch)?.enabled, false);
  assert.equal(command(workstationCommandIds.refreshSession)?.enabled, false);
  assert.equal(command(workstationCommandIds.showCraft)?.selected, true);
  assert.equal(command(workstationCommandIds.toggleSidebar)?.selected, false);
});
