import assert from "node:assert/strict";
import test from "node:test";

import { castBySeries, events } from "../data/events.js";
import { groupEventsByDate } from "../services/event-grouper.js";
import { availableCastNames, matchesCast } from "../services/event-filters.js";
import { createEventStatusStore } from "../services/event-status-store.js";

const GROUP_ID = "sherlock-holmes-20261020-25";
const groupedEvents = groupEventsByDate(events);
const sherlockEvents = events.filter(event => event.eventGroupId === GROUP_ID);
const sherlockGroups = groupedEvents.filter(event => event.eventGroupId === GROUP_ID);
const findGroup = date => sherlockGroups.find(event => event.date === date);

// 劇場公式の配役表のうち、ラブライブ！キャストが出演する回（2026-10-20確認）
const EXPECTED = [
  { id: "sherlock-holmes-20261020-1900", date: "2026-10-20", startsAt: "19:00", loveLiveCast: ["ペイトン尚未"] },
  { id: "sherlock-holmes-20261022-1900", date: "2026-10-22", startsAt: "19:00", loveLiveCast: ["小泉萌香"] },
  { id: "sherlock-holmes-20261023-1900", date: "2026-10-23", startsAt: "19:00", loveLiveCast: ["久保田未夢"] },
  { id: "sherlock-holmes-20261024-1300", date: "2026-10-24", startsAt: "13:00", loveLiveCast: ["薮島朱音"] },
  { id: "sherlock-holmes-20261025-1230", date: "2026-10-25", startsAt: "12:30", loveLiveCast: ["伊波杏樹", "月音こな"] },
  { id: "sherlock-holmes-20261025-1800", date: "2026-10-25", startsAt: "18:00", loveLiveCast: ["野中ここな"] }
];

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

test("シャーロック・ホームズはラブライブ！キャスト出演の6公演を重複なく登録する", () => {
  assert.deepEqual(
    sherlockEvents.map(({ id, date, startsAt }) => ({ id, date, startsAt })),
    EXPECTED.map(({ id, date, startsAt }) => ({ id, date, startsAt }))
  );

  const ids = events.map(event => event.id);
  assert.equal(new Set(ids).size, ids.length, "イベントIDが重複しています");

  const slots = sherlockEvents.map(event => `${event.date} ${event.startsAt}`);
  assert.equal(new Set(slots).size, slots.length, "同じ日時の公演が重複しています");
});

test("全出演者をallCastに保持し、castにはラブライブ！キャストだけを渡す", () => {
  const loveLiveNames = new Set(Object.values(castBySeries).flat());

  EXPECTED.forEach(expected => {
    const event = sherlockEvents.find(item => item.id === expected.id);
    assert.equal(event.allCast.length, 5, `${expected.id} の出演者数`);
    assert.deepEqual(event.cast, expected.loveLiveCast);
    assert.ok(event.cast.every(name => event.allCast.includes(name)));
    assert.ok(event.allCast.filter(name => !event.cast.includes(name)).every(name => !loveLiveNames.has(name)));
    assert.equal(event.doorsAt, null, "開場時刻は公式未記載のため推測しない");
    assert.equal(event.venue.id, "hakuhinkan-theater");
    assert.equal(event.venue.address, "東京都中央区銀座8-8-11");
  });

  assert.deepEqual(sherlockEvents.find(event => event.date === "2026-10-22").series, ["nijigasaki"]);
  assert.deepEqual(sherlockEvents.find(event => event.date === "2026-10-23").series, ["nijigasaki"]);
  assert.deepEqual(sherlockEvents.find(event => event.date === "2026-10-24").series, ["liella"]);
});

test("同日公演だけを統合し、日付ごとに別イベントとして表示する", () => {
  assert.deepEqual(sherlockGroups.map(event => event.date), [
    "2026-10-20", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"
  ]);
  assert.deepEqual(sherlockGroups.map(event => event.performances.length), [1, 1, 1, 1, 2]);
  assert.equal(new Set(sherlockGroups.map(event => event.id)).size, sherlockGroups.length);

  // 単独公演は従来どおり公演IDのまま、10月25日は統合IDになる
  assert.equal(findGroup("2026-10-20").id, "sherlock-holmes-20261020-1900");
  assert.equal(findGroup("2026-10-24").id, "sherlock-holmes-20261024-1300");
  assert.equal(findGroup("2026-10-25").id, `group:${GROUP_ID}:2026-10-25`);

  // 10月24日の他イベントとは統合しない
  const october24 = groupedEvents.filter(event => event.date === "2026-10-24");
  assert.ok(october24.length > 1);
  assert.equal(findGroup("2026-10-24").sourceEventIds.length, 1);
});

test("出演者フィルターで追加公演のラブライブ！キャストを選べる", () => {
  const names = availableCastNames(groupedEvents);
  ["小泉萌香", "久保田未夢", "薮島朱音"].forEach(name => assert.ok(names.has(name), name));
  ["鈴木達央", "夏川椎菜", "緒方恵美"].forEach(name => assert.equal(names.has(name), false, name));

  const sherlockDatesFor = name => groupedEvents
    .filter(event => event.eventGroupId === GROUP_ID && matchesCast(event, name))
    .map(event => event.date);

  assert.deepEqual(sherlockDatesFor("小泉萌香"), ["2026-10-22"]);
  assert.deepEqual(sherlockDatesFor("久保田未夢"), ["2026-10-23"]);
  assert.deepEqual(sherlockDatesFor("薮島朱音"), ["2026-10-24"]);
  assert.deepEqual(sherlockDatesFor("月音こな"), ["2026-10-25"]);
  assert.equal(availableCastNames(groupedEvents, "nijigasaki").has("久保田未夢"), true);
});

test("全公演の詳細に当日券の販売開始・抽選・受付終了条件を表示する", () => {
  sherlockGroups.forEach(event => {
    assert.match(event.note, /各回の開場時間から、会場の「当日券受付」窓口で販売/);
    assert.match(event.note, /販売予定枚数を上回る場合は抽選/);
    assert.match(event.note, /予定枚数に達し次第、受付終了/);
    assert.match(event.note, /現金またはキャッシュレス決済/);
    // 同日2公演の統合時に同じ案内が重複表示されない
    assert.equal(event.note.split("当日券：").length - 1, 1, `${event.date} の当日券案内が重複`);
    assert.equal(event.verifiedAt, "2026-10-20");
  });
});

test("既存公演IDに保存済みの参加ステータスをそのまま引き継ぐ", () => {
  const storage = new MemoryStorage([
    ["lovecale:sherlock-holmes-20261020-1900", "going"],
    ["lovecale:sherlock-holmes-20261025-1230", "maybe"],
    ["lovecale:sherlock-holmes-20261025-1800", "no"]
  ]);
  const store = createEventStatusStore(storage);
  assert.equal(store.migrateEvents(sherlockGroups), 0);

  assert.equal(store.get(findGroup("2026-10-20").id), "going");
  assert.deepEqual(store.getEventStatuses(findGroup("2026-10-25")), [
    { id: "sherlock-holmes-20261025-1230", status: "maybe" },
    { id: "sherlock-holmes-20261025-1800", status: "no" }
  ]);
  ["2026-10-22", "2026-10-23", "2026-10-24"].forEach(date =>
    assert.equal(store.get(findGroup(date).id), "unset")
  );
});
