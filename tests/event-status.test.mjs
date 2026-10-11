import assert from "node:assert/strict";
import test from "node:test";

import { events } from "../data/events.js";
import { groupEventsByDate } from "../services/event-grouper.js";
import { createEventStatusStore } from "../services/event-status-store.js";

class MemoryStorage {
  constructor(entries = []) {
    this.values = new Map(entries);
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const groupedEvents = groupEventsByDate(events);
const findGroup = (eventGroupId, date) => groupedEvents.find(event =>
  event.eventGroupId === eventGroupId && event.date === date
);

test("10月17日・24日・25日の同日公演を日付別の1イベントにまとめる", () => {
  const characterMix = findGroup("character-mix-20261017", "2026-10-17");
  const konyaito = findGroup("konyaito-meeting2-20261024", "2026-10-24");
  const sherlock20 = findGroup("sherlock-holmes-20261020-25", "2026-10-20");
  const sherlock25 = findGroup("sherlock-holmes-20261020-25", "2026-10-25");

  assert.equal(characterMix.performances.length, 2);
  assert.equal(konyaito.performances.length, 2);
  assert.equal(sherlock20.performances.length, 1);
  assert.equal(sherlock25.performances.length, 2);
  assert.notEqual(sherlock20.id, sherlock25.id);
});

test("同じ統合イベント内で異なる参加状態を保存し、再読み込み後も保持する", () => {
  const storage = new MemoryStorage();
  const konyaito = findGroup("konyaito-meeting2-20261024", "2026-10-24");
  const [day, night] = konyaito.performances;
  const store = createEventStatusStore(storage);

  store.set(day.id, "going");
  store.set(night.id, "no");

  assert.deepEqual(store.getEventStatuses(konyaito), [
    { id: day.id, status: "going" },
    { id: night.id, status: "no" }
  ]);
  assert.deepEqual(store.getEventCounts(konyaito), { going: 1, maybe: 0, no: 1, unset: 0 });
  assert.deepEqual(store.countPerformances([konyaito]), { going: 1, maybe: 0, no: 1, unset: 0 });
  assert.equal(store.eventMatchesStatus(konyaito, "going"), true);
  assert.equal(store.eventMatchesStatus(konyaito, "no"), true);
  assert.equal(store.eventMatchesStatus(konyaito, "maybe"), false);

  const reloadedStore = createEventStatusStore(storage);
  assert.equal(reloadedStore.get(day.id), "going");
  assert.equal(reloadedStore.get(night.id), "no");
});

test("従来の公演別ステータスを統合IDの値で上書きしない", () => {
  const characterMix = findGroup("character-mix-20261017", "2026-10-17");
  const [part1, part2] = characterMix.performances;
  const storage = new MemoryStorage([
    [`lovecale:${part1.id}`, "going"],
    [`lovecale:${part2.id}`, "no"],
    [`lovecale:${characterMix.id}`, "maybe"]
  ]);
  const store = createEventStatusStore(storage);

  assert.equal(store.migrateEvent(characterMix), true);
  assert.equal(store.get(part1.id), "going");
  assert.equal(store.get(part2.id), "no");
  assert.equal(storage.getItem(`lovecale:${characterMix.id}`), null);
});

test("統合IDだけに保存された状態は未設定の各公演へ移行する", () => {
  const sherlock = findGroup("sherlock-holmes-20261020-25", "2026-10-25");
  const [day, night] = sherlock.performances;
  const storage = new MemoryStorage([
    [`lovecale:${day.id}`, "going"],
    [`lovecale:${sherlock.id}`, "maybe"]
  ]);
  const store = createEventStatusStore(storage);

  assert.equal(store.migrateEvents([sherlock]), 1);
  assert.equal(store.get(day.id), "going");
  assert.equal(store.get(night.id), "maybe");
  assert.equal(storage.getItem(`lovecale:${sherlock.id}`), null);
});
