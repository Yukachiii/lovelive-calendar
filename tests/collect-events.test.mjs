import assert from "node:assert/strict";
import test from "node:test";

import {
  extractFacts,
  extractMonitorFacts,
  factsDiff,
  factsHaveComparableScope
} from "../scripts/collect-events.mjs";

const ARUARU_URL = "https://aruarucity.com/event/?act=Detail&mode=View&e_id=00002438";
const CAST_NAMES = ["相良茉優", "鬼頭明里", "絵森彩", "月音こな"];

function eventPage({
  title = "相良茉優と鬼頭明里がYATTEKURU",
  date = "2026年10月12日(月)",
  times = "【第1部】開場/11:30 開演/12:00 【第2部】開場/15:15 開演/15:45",
  casts = "相良茉優、鬼頭明里",
  notice = "予定どおり開催します",
  relatedDate = "2026年10月11日(日)",
  relatedCast = "絵森彩"
} = {}) {
  return `<!doctype html>
    <html><body>
      <header>別イベント ${relatedDate} ${relatedCast}</header>
      <div class="event_center">
        <div class="side_box">
          <h4>${title}</h4>
          <table>
            <tr><th>開催日</th><td>${date}</td></tr>
            <tr><th>開催時間</th><td>${times}</td></tr>
            <tr><th>出演</th><td>${casts}</td></tr>
          </table>
        </div>
        <article class="event_detail"><p>${notice}</p></article>
        <div class="relation_box">
          <h3>関連イベント</h3>
          <time>${relatedDate}</time><p>出演 ${relatedCast}</p>
        </div>
      </div>
    </body></html>`;
}

test("別イベント欄の日付・出演者だけが変わっても監視factsは変わらない", () => {
  const previous = extractMonitorFacts(eventPage(), ARUARU_URL, CAST_NAMES);
  const current = extractMonitorFacts(eventPage({
    relatedDate: "2026年12月26日(土)",
    relatedCast: "月音こな"
  }), ARUARU_URL, CAST_NAMES);

  assert.equal(previous.fingerprint, current.fingerprint);
  assert.deepEqual(previous.dates, ["2026-10-12"]);
  assert.deepEqual(previous.casts, ["鬼頭明里", "相良茉優"]);
  assert.equal(previous.scope, "aruarucity:event-primary:v1");
});

test("対象公演の日時・出演者・中止情報が変わった場合は検出する", () => {
  const previous = extractMonitorFacts(eventPage(), ARUARU_URL, CAST_NAMES);
  const current = extractMonitorFacts(eventPage({
    title: "相良茉優と絵森彩がYATTEKURU",
    date: "2026年10月13日(火)",
    times: "【第1部】開場/12:30 開演/13:00 【第2部】開場/16:15 開演/16:45",
    casts: "相良茉優、絵森彩",
    notice: "出演者変更に伴い開催中止となりました"
  }), ARUARU_URL, CAST_NAMES);
  const diff = factsDiff(previous, current);

  assert.deepEqual(diff.addedDates, ["2026-10-13"]);
  assert.deepEqual(diff.removedDates, ["2026-10-12"]);
  assert.deepEqual(diff.addedTimes, ["12:30", "13:00", "16:15", "16:45"]);
  assert.deepEqual(diff.removedTimes, ["11:30", "12:00", "15:15", "15:45"]);
  assert.deepEqual(diff.addedCasts, ["絵森彩"]);
  assert.deepEqual(diff.removedCasts, ["鬼頭明里"]);
  assert.deepEqual(diff.addedStatusTerms, ["出演者変更", "中止"]);
});

test("旧全ページfactsから本文限定factsへの初回移行だけは差分比較しない", () => {
  const legacy = extractFacts("2026年10月12日 相良茉優 鬼頭明里", CAST_NAMES);
  const scoped = extractMonitorFacts(eventPage(), ARUARU_URL, CAST_NAMES);
  const nextScoped = extractMonitorFacts(eventPage(), ARUARU_URL, CAST_NAMES);

  assert.equal(factsHaveComparableScope(legacy, scoped), false);
  assert.equal(factsHaveComparableScope(scoped, nextScoped), true);
});
