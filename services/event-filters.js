/**
 * 画面の絞り込みで使う、DOMに依存しない判定処理です。
 * app.js とテストの両方から同じ実装を使います。
 */

export function castList(event) {
  return Array.isArray(event.cast) ? event.cast : [event.cast].filter(Boolean);
}

export function normalizeCastName(name = "") {
  return String(name).replace(/[（(].*$/, "").trim();
}

export function matchesSeries(event, seriesKey) {
  if (seriesKey === "all") return true;
  return seriesKey === "other" ? !event.series?.length : Boolean(event.series?.includes(seriesKey));
}

export function matchesCast(event, castName) {
  return castName === "all"
    || castList(event).some(name => normalizeCastName(name) === castName);
}

export function availableCastNames(events, seriesKey = "all") {
  return new Set(events
    .filter(event => matchesSeries(event, seriesKey))
    .flatMap(event => castList(event).map(normalizeCastName)));
}
