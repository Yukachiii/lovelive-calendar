import { categories, events as verifiedEvents } from "./data/events.js";
import { StaticEventRepository } from "./services/event-repository.js";

let events = [];

const statusDef = {
  going: { label: "○ 行く", short: "○", cls: "going" },
  maybe: { label: "△ 迷い", short: "△", cls: "maybe" },
  no: { label: "× 行かない", short: "×", cls: "no" },
  unset: { label: "－ 未設定", short: "－", cls: "unset" }
};

const now = new Date();
let viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
let activeCategories = new Set(Object.keys(categories));
let selectedEventId = null;

function loadStatus(id) {
  return localStorage.getItem(`lovecale:${id}`) || "unset";
}

function saveStatus(id, status) {
  localStorage.setItem(`lovecale:${id}`, status);
  render();
  if (selectedEventId === id) openModal(id);
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
  return Array.isArray(event.cast) ? event.cast.join("、") : event.cast;
}

function venueText(event, includeAddress = false) {
  if (typeof event.venue === "string") return event.venue;
  if (!event.venue) return "未定";
  if (includeAddress && event.venue.address) {
    return `${event.venue.name}（${event.venue.address}）`;
  }
  return event.venue.name;
}

function scheduleText(event) {
  const parts = [
    event.doorsAt ? `開場 ${event.doorsAt}` : "開場 記載なし",
    `開演 ${event.startsAt}`
  ];
  if (event.endsAt) parts.push(`終了 ${event.endsAt}`);
  return `${event.date}　${parts.join(" / ")}`;
}

function renderFilters() {
  const element = document.getElementById("filters");
  element.innerHTML = "";
  Object.entries(categories).forEach(([key, category]) => {
    const label = document.createElement("label");
    label.className = "filter";
    label.innerHTML = `<input type="checkbox" ${activeCategories.has(key) ? "checked" : ""} data-cat="${key}">
      <span class="legend-dot" style="background:${category.color}"></span>${category.label}`;
    element.appendChild(label);
  });
  element.querySelectorAll("input").forEach(input => input.addEventListener("change", event => {
    const key = event.target.dataset.cat;
    event.target.checked ? activeCategories.add(key) : activeCategories.delete(key);
    render();
  }));
}

function currentMonthEvents() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  return events.filter(event => {
    const [eventYear, eventMonth] = event.date.split("-").map(Number);
    return eventYear === year && eventMonth === month && activeCategories.has(event.category);
  }).sort((a, b) => `${a.date}${a.startsAt}`.localeCompare(`${b.date}${b.startsAt}`));
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
      const status = loadStatus(event.id);
      const button = document.createElement("button");
      button.className = "event";
      button.style.borderLeftColor = categories[event.category].color;
      button.innerHTML = `
        <div class="event-title">${escapeHtml(displayTitle(event))}</div>
        <div class="event-meta">
          <span>${escapeHtml(event.startsAt)}</span>
          <span class="status-badge">${statusDef[status].short}</span>
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
  const counts = { going: 0, maybe: 0, no: 0, unset: 0 };
  data.forEach(event => counts[loadStatus(event.id)] += 1);
  document.getElementById("summary").textContent =
    `${data.length}公演 / 行く ${counts.going}・迷い ${counts.maybe}`;

  if (!data.length) {
    list.innerHTML = '<div class="empty">表示するイベントがありません。</div>';
    return;
  }

  list.innerHTML = "";
  data.forEach(event => {
    const status = loadStatus(event.id);
    const [, month, day] = event.date.split("-");
    const category = categories[event.category];
    const card = document.createElement("div");
    card.className = "list-card";
    card.innerHTML = `
      <div class="list-top">
        <div class="date-chip">${Number(month)}/${Number(day)} 開演 ${escapeHtml(event.startsAt)}</div>
        <div class="category-chip" style="border-left:4px solid ${category.color}">${category.label}</div>
      </div>
      <h3>${escapeHtml(event.title)}</h3>
      ${event.performanceLabel ? `<div class="performance-label">${escapeHtml(event.performanceLabel)}</div>` : ""}
      <div class="small">${escapeHtml(castText(event))}<br>${escapeHtml(venueText(event))}</div>
      <div class="status-row">
        ${Object.entries(statusDef).map(([key, definition]) =>
          `<button class="status-btn ${definition.cls} ${status === key ? "active" : ""}" data-status="${key}">${definition.label}</button>`
        ).join("")}
      </div>`;
    card.querySelectorAll(".status-btn").forEach(button =>
      button.addEventListener("click", () => saveStatus(event.id, button.dataset.status))
    );
    card.querySelector("h3").style.cursor = "pointer";
    card.querySelector("h3").addEventListener("click", () => openModal(event.id));
    list.appendChild(card);
  });
}

function render() {
  renderFilters();
  renderCalendar();
  renderList();
}

function renderSourceLinks(event) {
  const container = document.getElementById("modalSources");
  container.replaceChildren();
  const sources = [{ label: "公式ページを開く", url: event.officialUrl }];
  if (event.sourceUrl && event.sourceUrl !== event.officialUrl) {
    sources.push({ label: "補足した情報源を開く", url: event.sourceUrl });
  }
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

function openModal(id) {
  const event = events.find(item => item.id === id);
  if (!event) return;
  selectedEventId = id;
  const category = categories[event.category];
  document.getElementById("modalCategory").innerHTML =
    `<span class="category-chip" style="border-left:4px solid ${category.color}">${category.label}</span>`;
  document.getElementById("modalTitle").textContent = displayTitle(event);
  document.getElementById("modalDate").textContent = scheduleText(event);
  document.getElementById("modalCast").textContent = castText(event);
  document.getElementById("modalVenue").textContent = venueText(event, true);
  document.getElementById("modalNote").textContent = event.note || "－";
  document.getElementById("modalVerifiedAt").textContent = `${event.verifiedAt} 時点`;
  renderSourceLinks(event);

  const status = loadStatus(id);
  document.getElementById("modalStatus").innerHTML = Object.entries(statusDef).map(([key, definition]) =>
    `<button class="status-btn ${definition.cls} ${status === key ? "active" : ""}" data-status="${key}">${definition.label}</button>`
  ).join("");
  document.querySelectorAll("#modalStatus .status-btn").forEach(button =>
    button.addEventListener("click", () => saveStatus(id, button.dataset.status))
  );
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
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

async function initialize(eventRepository = new StaticEventRepository(verifiedEvents)) {
  events = await eventRepository.listEvents();
  render();
}

initialize().catch(error => {
  console.error("イベントデータの読み込みに失敗しました。", error);
  document.getElementById("eventList").innerHTML =
    '<div class="empty">イベント情報を読み込めませんでした。</div>';
});
