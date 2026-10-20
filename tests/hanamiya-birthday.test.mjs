import assert from "node:assert/strict";
import test from "node:test";

import { events } from "../data/events.js";
import { groupEventsByDate } from "../services/event-grouper.js";
import { createEventStatusStore } from "../services/event-status-store.js";

const GROUP_ID = "hanamiya-birthday-20261024";
const OFFICIAL_URL = "https://milano-za.jp/events/article?id=20261024";
const parts = events.filter(event => event.eventGroupId === GROUP_ID);
const grouped = groupEventsByDate(events).filter(event => event.eventGroupId === GROUP_ID);

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

test("ファラオの祝祭の昼夜2公演はID・時刻・出演者・会場・公式URLを維持する", () => {
  assert.deepEqual(parts.map(({ id, date, performanceLabel, doorsAt, startsAt }) => ({
    id, date, performanceLabel, doorsAt, startsAt
  })), [
    { id: "hanamiya-birthday-20261024-part1", date: "2026-10-24", performanceLabel: "第1部", doorsAt: "14:15", startsAt: "15:00" },
    { id: "hanamiya-birthday-20261024-part2", date: "2026-10-24", performanceLabel: "第2部", doorsAt: "17:45", startsAt: "18:30" }
  ]);
  parts.forEach(event => {
    assert.deepEqual(event.cast, ["花宮初奈"]);
    assert.equal(event.venue.id, "theater-milano-za");
    assert.equal(event.officialUrl, OFFICIAL_URL);
    assert.equal(event.category, "cast");
  });
});

test("両公演の備考に券種・価格と入場時の注意事項を載せる", () => {
  parts.forEach(event => {
    assert.match(event.note, /最前列確定チケット 21,700円/);
    assert.match(event.note, /特典つきチケット 12,170円/);
    assert.match(event.note, /通常チケット 7,120円/);
    assert.match(event.note, /税込・全席指定・ドリンク代込/);
    assert.match(event.note, /払い戻し・変更・再発行は不可/);
    assert.match(event.note, /専用BOX/);
    assert.match(event.note, /飲食物・開封済みの品物・金券類は不可/);
    assert.equal(event.verifiedAt, "2026-10-21");
  });
});

test("本人確認は可能性として記載し、未確認の販売状況・当日券は載せない", () => {
  parts.forEach(event => {
    assert.match(event.note, /本人確認を行う場合あり/);
    assert.doesNotMatch(event.note, /本人確認(が|は)?必須|必ず本人確認/);
    assert.doesNotMatch(event.note, /当日券|完売|販売中|売り切れ|残りわずか/);
  });
});

test("同日2公演は1件に統合し、詳細画面の備考は1回だけ表示する", () => {
  assert.equal(grouped.length, 1);
  const [event] = grouped;
  assert.equal(event.id, `group:${GROUP_ID}:2026-10-24`);
  assert.equal(event.isMultiPerformance, true);
  assert.deepEqual(event.performances.map(performance => performance.id), parts.map(part => part.id));
  // 統合イベントの備考は各公演の note を重複除去して結合するため、同一文が1回だけ入る
  assert.equal(event.note, parts[0].note);
  event.performances.forEach(performance => assert.equal(performance.note, parts[0].note));

  // 同日の別イベントとは統合しない
  const october24Groups = groupEventsByDate(events).filter(item => item.date === "2026-10-24");
  assert.ok(october24Groups.length > 1);
  assert.ok(october24Groups.filter(item => item.id !== event.id).every(item => item.eventGroupId !== GROUP_ID));
});

test("昼夜それぞれに保存済みの参加ステータスを維持する", () => {
  const storage = new MemoryStorage([
    ["lovecale:hanamiya-birthday-20261024-part1", "going"],
    ["lovecale:hanamiya-birthday-20261024-part2", "maybe"]
  ]);
  const store = createEventStatusStore(storage);
  assert.equal(store.migrateEvents(grouped), 0);
  assert.deepEqual(store.getEventStatuses(grouped[0]), [
    { id: "hanamiya-birthday-20261024-part1", status: "going" },
    { id: "hanamiya-birthday-20261024-part2", status: "maybe" }
  ]);
});
