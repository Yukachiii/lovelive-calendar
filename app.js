import { castBySeries, categories, events as verifiedEvents, seriesDefinitions } from "./data/events.js";
import { groupEventsByDate } from "./services/event-grouper.js";
import {
  availableCastNames as availableCastNamesIn,
  castList,
  matchesCast,
  matchesSeries
} from "./services/event-filters.js";
import { StaticEventRepository } from "./services/event-repository.js";
import { createEventStatusStore } from "./services/event-status-store.js";

let events = [];
const statusStore = createEventStatusStore(localStorage);

const statusDef = {
  going: { label: "○ 行く", short: "○", cls: "going" },
  maybe: { label: "△ 迷い", short: "△", cls: "maybe" },
  no: { label: "× 行かない", short: "×", cls: "no" },
  unset: { label: "－ 未設定", short: "－", cls: "unset" }
};

const SELECT_FILTERS = ["series", "cast", "region", "status"];
const allCategoryKeys = () => new Set(Object.keys(categories));

const now = new Date();
let viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
let activeCategories = allCategoryKeys();
let selectedEventId = null;
const filterState = {
  query: "",
  ...Object.fromEntries(SELECT_FILTERS.map(filter => [filter, "all"]))
};

function saveStatus(id, status) {
  statusStore.set(id, status);
  render();
  if (selectedEventId) openModal(selectedEventId);
}

function ymd(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

function displayTitle(event) {
  return event.performanceLabel
    ? `${event.title}（${event.performanceLabel}）`
    : event.title;
}

function castText(event) {
  const cast = castList(event);
  return cast.length ? cast.join("、") : "記載なし";
}

function eventCategoryKeys(event) {
  return event.categoryKeys || [event.category];
}

function seriesText(event) {
  if (!event.series?.length) return "その他関連";
  return event.series.map(series => seriesDefinitions[series]?.label || series).join("、");
}

function venueText(event, includeAddress = false) {
  if (typeof event.venue === "string") return event.venue;
  if (!event.venue) return "未定";
  if (includeAddress && event.venue.address) {
    return `${event.venue.name}（${event.venue.address}）`;
  }
  return event.venue.name;
}

function performanceTimeText(performance) {
  const parts = [
    performance.doorsAt ? `開場 ${performance.doorsAt}` : "開場 記載なし",
    performance.startsAt ? `開演 ${performance.startsAt}` : "開演 未定"
  ];
  if (performance.endsAt) parts.push(`終了 ${performance.endsAt}`);
  return parts.join(" / ");
}

function scheduleText(event) {
  return `${event.date}　${performanceTimeText(event)}`;
}

function performanceName(performance, index) {
  return performance.performanceLabel || `公演 ${index + 1}`;
}

function statusOptionsHtml(status) {
  return Object.entries(statusDef).map(([key, definition]) =>
    `<option value="${key}"${status === key ? " selected" : ""}>${definition.label}</option>`
  ).join("");
}

function statusButtonsHtml(status) {
  return Object.entries(statusDef).map(([key, definition]) =>
    `<button class="status-btn ${definition.cls} ${status === key ? "active" : ""}" data-status="${key}">${definition.label}</button>`
  ).join("");
}

function bindStatusButtons(container, id) {
  container.querySelectorAll(".status-btn").forEach(button =>
    button.addEventListener("click", () => saveStatus(id, button.dataset.status))
  );
}

function performanceListHtml(event, { showStatus = false } = {}) {
  if (!event.isMultiPerformance) {
    return event.performanceLabel
      ? `<div class="performance-label">${escapeHtml(event.performanceLabel)}</div>`
      : "";
  }

  return `<div class="performance-list">
    ${event.performances.map((performance, index) => `
      <div class="performance-item">
        <span class="performance-name">${escapeHtml(performanceName(performance, index))}</span>
        <span class="performance-time">${escapeHtml(performanceTimeText(performance))}</span>
        ${showStatus ? `
          <label class="performance-status-label">
            <span class="sr-only">${escapeHtml(performanceName(performance, index))}の参加ステータス</span>
            <select class="performance-status-select" data-event-id="${escapeHtml(performance.id)}">
              ${statusOptionsHtml(statusStore.get(performance.id))}
            </select>
          </label>` : ""}
      </div>`).join("")}
  </div>`;
}

function bindPerformanceStatusControls(container) {
  container.querySelectorAll(".performance-status-select").forEach(select => {
    select.addEventListener("change", () => saveStatus(select.dataset.eventId, select.value));
  });
}

function categoryChipsHtml(event) {
  return eventCategoryKeys(event).map(categoryKey => {
    const category = categories[categoryKey];
    return `<span class="category-chip" style="border-left:4px solid ${category.color}">${escapeHtml(category.label)}</span>`;
  }).join("");
}

function normalizeSearchText(value = "") {
  return String(value).normalize("NFKC").toLocaleLowerCase("ja");
}

function eventRegion(event) {
  return event.venue?.prefecture || (event.venue?.id === "online" ? "online" : "unknown");
}

function unfilteredMonthEvents() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  return events.filter(event => {
    const [eventYear, eventMonth] = event.date.split("-").map(Number);
    return eventYear === year && eventMonth === month;
  });
}

function matchesQuery(event) {
  if (!filterState.query) return true;
  const searchable = [
    event.title,
    event.performanceLabel,
    event.performances?.map(performance => performance.performanceLabel).join(" "),
    castText(event),
    venueText(event, true),
    seriesText(event),
    event.venue?.prefecture
  ].join(" ");
  return normalizeSearchText(searchable).includes(normalizeSearchText(filterState.query));
}

function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  select.replaceChildren(new Option("すべて", "all"));
  options.forEach(({ value, label }) => select.add(new Option(label, value)));
}

function availableCastNames(seriesKey = "all") {
  return availableCastNamesIn(events, seriesKey);
}

function populateCastFilter() {
  const select = document.getElementById("castFilter");
  const allOption = new Option("すべて", "all");
  select.replaceChildren(allOption);

  const availableNames = availableCastNames(filterState.series);
  const seriesKeys = castBySeries[filterState.series]
    ? [filterState.series]
    : Object.keys(castBySeries);
  const addedNames = new Set();

  seriesKeys.forEach(seriesKey => {
    const names = castBySeries[seriesKey]
      .filter(name => availableNames.has(name) && !addedNames.has(name));
    if (!names.length) return;

    const group = document.createElement("optgroup");
    group.label = seriesDefinitions[seriesKey]?.label || seriesKey;
    names.forEach(name => {
      group.appendChild(new Option(name, name));
      addedNames.add(name);
    });
    select.appendChild(group);
  });

  if (filterState.cast !== "all" && !addedNames.has(filterState.cast)) {
    filterState.cast = "all";
  }
  select.disabled = addedNames.size === 0;
  allOption.textContent = select.disabled ? "該当キャストなし" : "すべて";
  select.value = filterState.cast;
}

function setupFilterControls() {
  const categoryContainer = document.getElementById("categoryFilters");
  Object.entries(categories).forEach(([key, category]) => {
    const label = document.createElement("label");
    label.className = "filter";
    label.innerHTML = `<input type="checkbox" checked data-cat="${key}">
      <span class="legend-dot" style="background:${category.color}"></span>${category.label}`;
    categoryContainer.appendChild(label);
  });

  const availableSeries = new Set(events.flatMap(event => event.series || []));
  const hasOtherSeries = events.some(event => !event.series?.length);
  const seriesOptions = Object.entries(seriesDefinitions)
    .filter(([key]) => availableSeries.has(key))
    .map(([value, definition]) => ({ value, label: definition.label }));
  if (hasOtherSeries) seriesOptions.push({ value: "other", label: "その他関連" });
  populateSelect("seriesFilter", seriesOptions);

  populateCastFilter();

  const regions = [...new Set(events.map(eventRegion))].sort((a, b) => {
    if (a === "online") return 1;
    if (b === "online") return -1;
    return a.localeCompare(b, "ja");
  });
  populateSelect("regionFilter", regions.map(value => ({
    value,
    label: value === "online" ? "オンライン" : value === "unknown" ? "地域未定" : value
  })));

  populateSelect("statusFilter", Object.entries(statusDef).map(([value, definition]) => ({
    value,
    label: definition.label
  })));

  categoryContainer.querySelectorAll("input").forEach(input => input.addEventListener("change", event => {
    const category = event.target.dataset.cat;
    event.target.checked ? activeCategories.add(category) : activeCategories.delete(category);
    render();
  }));

  document.getElementById("queryFilter").addEventListener("input", event => {
    filterState.query = event.target.value.trim();
    render();
  });
  document.getElementById("seriesFilter").addEventListener("change", event => {
    filterState.series = event.target.value;
    populateCastFilter();
    render();
  });
  SELECT_FILTERS.filter(filter => filter !== "series").forEach(filter => {
    document.getElementById(`${filter}Filter`).addEventListener("change", event => {
      filterState[filter] = event.target.value;
      render();
    });
  });
  document.getElementById("resetFilters").addEventListener("click", resetFilters);
}

function activeFilterCount() {
  const selectFilters = SELECT_FILTERS
    .filter(filter => filterState[filter] !== "all").length;
  const categoryFilter = activeCategories.size === Object.keys(categories).length ? 0 : 1;
  return Number(Boolean(filterState.query)) + selectFilters + categoryFilter;
}

function syncFilterControls() {
  const queryInput = document.getElementById("queryFilter");
  if (queryInput.value !== filterState.query) queryInput.value = filterState.query;
  SELECT_FILTERS.forEach(filter => {
    const select = document.getElementById(`${filter}Filter`);
    if (select.value !== filterState[filter]) select.value = filterState[filter];
  });
  document.querySelectorAll("#categoryFilters input").forEach(input => {
    input.checked = activeCategories.has(input.dataset.cat);
  });
  const count = activeFilterCount();
  document.getElementById("filterCount").textContent = count ? `${count}条件を適用中` : "条件なし";
  document.getElementById("resetFilters").disabled = count === 0;
}

function resetFilters() {
  filterState.query = "";
  SELECT_FILTERS.forEach(filter => {
    filterState[filter] = "all";
  });
  activeCategories = allCategoryKeys();
  populateCastFilter();
  render();
}

function matchesFilters(event) {
  const regionMatches = filterState.region === "all" || eventRegion(event) === filterState.region;
  return eventCategoryKeys(event).some(category => activeCategories.has(category))
    && matchesSeries(event, filterState.series)
    && matchesCast(event, filterState.cast)
    && regionMatches
    && statusStore.eventMatchesStatus(event, filterState.status)
    && matchesQuery(event);
}

const eventSortKey = event => `${event.date}${event.startsAt || "99:99"}`;

function currentMonthEvents() {
  return unfilteredMonthEvents()
    .filter(matchesFilters)
    .sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)));
}

function calendarStatusText(event) {
  if (!event.isMultiPerformance) return statusDef[statusStore.get(event.id)].short;
  const counts = statusStore.getEventCounts(event);
  return Object.keys(statusDef)
    .filter(status => counts[status] > 0)
    .map(status => `${statusDef[status].short}${counts[status]}`)
    .join(" ");
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  document.getElementById("monthLabel").textContent = `${year}年 ${month + 1}月`;

  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const today = new Date();
  const byDate = {};
  currentMonthEvents().forEach(event => (byDate[event.date] ||= []).push(event));

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = ymd(date);
    const cell = document.createElement("div");
    cell.className = `day${date.getMonth() !== month ? " outside" : ""}`;
    if (key === ymd(today)) cell.classList.add("today");
    cell.innerHTML = `<div class="date">${date.getDate()}</div><div class="events"></div>`;
    const eventContainer = cell.querySelector(".events");

    (byDate[key] || []).forEach(event => {
      const button = document.createElement("button");
      button.className = "event";
      button.style.borderLeftColor = categories[event.category].color;
      button.innerHTML = `
        <div class="event-title">${escapeHtml(displayTitle(event))}</div>
        <div class="event-meta">
          <span>${event.isMultiPerformance ? `${event.performances.length}公演` : escapeHtml(event.startsAt || "未定")}</span>
          <span class="status-badge">${calendarStatusText(event)}</span>
        </div>`;
      button.addEventListener("click", () => openModal(event.id));
      eventContainer.appendChild(button);
    });
    grid.appendChild(cell);
  }
}

function renderList() {
  const list = document.getElementById("eventList");
  const data = currentMonthEvents();
  const total = unfilteredMonthEvents().length;
  const counts = statusStore.countPerformances(data);
  const performanceCount = data.reduce((sum, event) => sum + event.performances.length, 0);
  document.getElementById("summary").textContent =
    `${data.length} / 全${total}イベント（表示${performanceCount}公演）　` +
    `行く ${counts.going}・迷い ${counts.maybe}・行かない ${counts.no}・未設定 ${counts.unset}`;

  if (!data.length) {
    list.innerHTML = activeFilterCount()
      ? '<div class="empty">条件に合うイベントがありません。<br>絞り込みを変更してください。</div>'
      : '<div class="empty">表示するイベントがありません。</div>';
    return;
  }

  list.innerHTML = "";
  data.forEach(event => {
    const status = statusStore.get(event.id);
    const [, month, day] = event.date.split("-");
    const card = document.createElement("div");
    card.className = "list-card";
    card.innerHTML = `
      <div class="list-top">
        <div class="date-chip">${Number(month)}/${Number(day)} ${event.isMultiPerformance ? `${event.performances.length}公演` : `開演 ${escapeHtml(event.startsAt || "未定")}`}</div>
        <div class="category-chips">${categoryChipsHtml(event)}</div>
      </div>
      <h3>${escapeHtml(event.title)}</h3>
      ${performanceListHtml(event, { showStatus: true })}
      <div class="small">関連：${escapeHtml(seriesText(event))}<br>関連キャスト：${escapeHtml(castText(event))}<br>会場：${escapeHtml(venueText(event))}</div>
      ${event.isMultiPerformance ? "" : `<div class="status-row">
        ${statusButtonsHtml(status)}
      </div>`}`;
    bindPerformanceStatusControls(card);
    bindStatusButtons(card, event.id);
    const heading = card.querySelector("h3");
    heading.style.cursor = "pointer";
    heading.addEventListener("click", () => openModal(event.id));
    list.appendChild(card);
  });
}

function render() {
  syncFilterControls();
  renderCalendar();
  renderList();
}

function setMobileView(view) {
  if (!["list", "calendar"].includes(view)) return;
  document.getElementById("viewContainer").dataset.mobileView = view;
  document.querySelectorAll("[data-mobile-view]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.mobileView === view));
  });
}

function renderSourceLinks(event) {
  const container = document.getElementById("modalSources");
  container.replaceChildren();
  const performances = event.performances || [event];
  const sources = [];
  const seenUrls = new Set();
  const addSource = (label, url) => {
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    sources.push({ label, url });
  };

  performances.forEach(performance => addSource("公式ページを開く", performance.officialUrl));
  performances.forEach(performance => {
    if (performance.sourceUrl !== performance.officialUrl) {
      addSource("補足した情報源を開く", performance.sourceUrl);
    }
  });
  sources.forEach((source, index) => {
    if (index > 0) container.append(" / ");
    const link = document.createElement("a");
    link.href = source.url;
    link.textContent = source.label;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "official-link";
    container.appendChild(link);
  });
}

function renderModalSchedule(event) {
  const container = document.getElementById("modalDate");
  if (!event.isMultiPerformance) {
    container.textContent = scheduleText(event);
    return;
  }

  container.innerHTML = `
    <div class="modal-event-date">${escapeHtml(event.date)}</div>
    ${performanceListHtml(event, { showStatus: true })}`;
  bindPerformanceStatusControls(container);
}

function openModal(id) {
  const event = events.find(item => item.id === id);
  if (!event) return;
  selectedEventId = id;
  document.getElementById("modalCategory").innerHTML = categoryChipsHtml(event);
  document.getElementById("modalTitle").textContent = displayTitle(event);
  renderModalSchedule(event);
  document.getElementById("modalSeries").textContent = seriesText(event);
  document.getElementById("modalCast").textContent = castText(event);
  document.getElementById("modalVenue").textContent = venueText(event, true);
  document.getElementById("modalNote").textContent = event.note || "－";
  document.getElementById("modalVerifiedAt").textContent = `${event.verifiedAt} 時点`;
  renderSourceLinks(event);

  const modalStatus = document.getElementById("modalStatus");
  modalStatus.innerHTML = event.isMultiPerformance ? "" : statusButtonsHtml(statusStore.get(event.id));
  bindStatusButtons(modalStatus, id);
  document.getElementById("modalBackdrop").classList.add("open");
}

function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("open");
  selectedEventId = null;
}

document.getElementById("prevMonth").addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  render();
});
document.getElementById("nextMonth").addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  render();
});
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", event => {
  if (event.target.id === "modalBackdrop") closeModal();
});
document.querySelectorAll("[data-mobile-view]").forEach(button => {
  button.addEventListener("click", () => setMobileView(button.dataset.mobileView));
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

async function initialize(eventRepository = new StaticEventRepository(verifiedEvents)) {
  events = groupEventsByDate(await eventRepository.listEvents());
  statusStore.migrateEvents(events);
  setupFilterControls();
  render();
}

initialize().catch(error => {
  console.error("イベントデータの読み込みに失敗しました。", error);
  document.getElementById("eventList").innerHTML =
    '<div class="empty">イベント情報を読み込めませんでした。</div>';
});
