function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function performanceSortKey(event) {
  return `${event.startsAt || "99:99"}${event.doorsAt || "99:99"}${event.id}`;
}

/**
 * 同じイベントグループの同日公演を、画面表示用の1イベントへまとめます。
 * 元データは各部のまま保持するため、将来APIへ移行しても公演単位の時刻を失いません。
 */
export function groupEventsByDate(events) {
  const groups = new Map();

  events.forEach(event => {
    const groupKey = `${event.eventGroupId || event.id}:${event.date}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(event);
  });

  return [...groups.entries()].map(([groupKey, groupEvents]) => {
    const sortedEvents = [...groupEvents].sort((left, right) =>
      performanceSortKey(left).localeCompare(performanceSortKey(right))
    );
    const first = sortedEvents[0];
    const performances = sortedEvents.map(event => ({
      id: event.id,
      performanceLabel: event.performanceLabel || "",
      doorsAt: event.doorsAt,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      cast: [...asArray(event.cast)],
      allCast: [...asArray(event.allCast)],
      category: event.category,
      officialUrl: event.officialUrl,
      sourceUrl: event.sourceUrl,
      note: event.note || ""
    }));
    const isMultiPerformance = performances.length > 1;

    return {
      ...first,
      id: isMultiPerformance ? `group:${groupKey}` : first.id,
      sourceEventIds: sortedEvents.map(event => event.id),
      categoryKeys: unique(sortedEvents.map(event => event.category)),
      cast: unique(sortedEvents.flatMap(event => asArray(event.cast))),
      allCast: unique(sortedEvents.flatMap(event => asArray(event.allCast))),
      series: unique(sortedEvents.flatMap(event => asArray(event.series))),
      performanceLabel: isMultiPerformance ? "" : first.performanceLabel,
      performances,
      isMultiPerformance,
      note: unique(sortedEvents.map(event => event.note)).join(" / "),
      verifiedAt: sortedEvents.map(event => event.verifiedAt).filter(Boolean).sort().at(-1) || first.verifiedAt
    };
  });
}
