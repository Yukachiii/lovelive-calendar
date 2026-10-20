export const EVENT_STATUSES = ["going", "maybe", "no", "unset"];

const DEFAULT_PREFIX = "lovecale:";
const DEFAULT_STATUS = "unset";

function isEventStatus(value) {
  return EVENT_STATUSES.includes(value);
}

function emptyCounts() {
  return Object.fromEntries(EVENT_STATUSES.map(status => [status, 0]));
}

function performanceIds(event) {
  if (Array.isArray(event.performances) && event.performances.length) {
    return event.performances.map(performance => performance.id);
  }
  if (Array.isArray(event.sourceEventIds) && event.sourceEventIds.length) {
    return [...event.sourceEventIds];
  }
  return [event.id];
}

export function createEventStatusStore(storage, { prefix = DEFAULT_PREFIX } = {}) {
  const storageKey = id => `${prefix}${id}`;

  const getStored = id => {
    const value = storage.getItem(storageKey(id));
    return isEventStatus(value) ? value : null;
  };

  const get = id => getStored(id) || DEFAULT_STATUS;

  const set = (id, status) => {
    if (!isEventStatus(status)) throw new Error(`不正な参加ステータスです: ${status}`);
    storage.setItem(storageKey(id), status);
  };

  const migrateEvent = event => {
    if (!event.isMultiPerformance) return false;
    const groupedStatus = getStored(event.id);
    if (!groupedStatus) return false;

    performanceIds(event).forEach(id => {
      if (!getStored(id)) set(id, groupedStatus);
    });
    storage.removeItem(storageKey(event.id));
    return true;
  };

  const migrateEvents = events => events.reduce(
    (count, event) => count + Number(migrateEvent(event)),
    0
  );

  const getEventStatuses = event => performanceIds(event).map(id => ({ id, status: get(id) }));

  const getEventCounts = event => getEventStatuses(event).reduce((counts, entry) => {
    counts[entry.status] += 1;
    return counts;
  }, emptyCounts());

  const eventMatchesStatus = (event, status) => {
    if (status === "all") return true;
    return getEventStatuses(event).some(entry => entry.status === status);
  };

  const countPerformances = events => events.reduce((totals, event) => {
    const counts = getEventCounts(event);
    EVENT_STATUSES.forEach(status => {
      totals[status] += counts[status];
    });
    return totals;
  }, emptyCounts());

  return {
    countPerformances,
    eventMatchesStatus,
    get,
    getEventCounts,
    getEventStatuses,
    migrateEvent,
    migrateEvents,
    set
  };
}
