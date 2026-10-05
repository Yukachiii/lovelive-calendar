import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { castBySeries, events } from "../data/events.js";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

const STATUS_TERMS = [
  "中止",
  "延期",
  "振替",
  "開催見送り",
  "出演見合わせ",
  "出演キャンセル",
  "欠席",
  "出演者変更",
  "会場変更",
  "時間変更",
  "開演時間変更",
  "払い戻し"
];

const FACT_LINE_TERMS = [
  "日程",
  "開催日",
  "開催日時",
  "会場",
  "開催場所",
  "開場",
  "開演",
  "出演",
  "ゲスト",
  "受付期間",
  "申込期間",
  "抽選",
  ...STATUS_TERMS
];

const EVENT_TITLE_TERMS = [
  "イベント出演",
  "出演決定",
  "開催決定",
  "LIVE",
  "出演",
  "公演",
  "舞台挨拶",
  "公開収録",
  "お渡し会",
  "サイン会",
  "トーク",
  "ファンミ",
  "上映会",
  "生放送",
  "リスニングパーティー"
];

const NON_EVENT_NEWS_TERMS = [
  "アーカイブ",
  "グッズ",
  "チケット情報",
  "チケット販売",
  "会場CD",
  "購入者特典",
  "店舗特典",
  "手荷物",
  "持ち込み禁止",
  "コラボドリンク",
  "配信開始",
  "誤植"
];

function parseArguments(argv) {
  const options = {
    config: resolve(projectRoot, "automation", "sources.json"),
    state: resolve(projectRoot, ".automation-cache", "source-state.json"),
    output: resolve(projectRoot, "automation-output"),
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--config") options.config = resolve(argv[++index]);
    else if (argument === "--state") options.state = resolve(argv[++index]);
    else if (argument === "--output") options.output = resolve(argv[++index]);
    else if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--help") {
      console.log("node scripts/collect-events.mjs [--config path] [--state path] [--output dir] [--dry-run]");
      process.exit(0);
    } else {
      throw new Error(`不明な引数です: ${argument}`);
    }
  }

  return options;
}

function decodeHtml(value = "") {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(html = "") {
  return decodeHtml(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6])\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right, "ja"));
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    }
    url.pathname = url.pathname.replace(/\/{2,}/g, "/");
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
    url.searchParams.sort();
    return url.toString();
  } catch {
    return value;
  }
}

function localDateIso(timeZone = "Asia/Tokyo") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatJstTimestamp() {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());
}

function normalizeDate(year, month, day) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)
  ) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function extractDates(text) {
  const dates = [];
  for (const match of text.matchAll(/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日/g)) {
    dates.push(normalizeDate(match[1], match[2], match[3]));
  }
  for (const match of text.matchAll(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/g)) {
    dates.push(normalizeDate(match[1], match[2], match[3]));
  }
  return unique(dates);
}

function extractFacts(text, castNames) {
  const compactText = text.replace(/\s+/g, "");
  const casts = castNames.filter(name => compactText.includes(name.replace(/\s+/g, "")));
  const times = unique([...text.matchAll(/(?:^|[^\d])(\d{1,2}:\d{2})(?!\d)/g)].map(match => match[1]));
  const statusTerms = STATUS_TERMS.filter(term => text.includes(term));
  const factLines = unique(
    text
      .split("\n")
      .filter(line => FACT_LINE_TERMS.some(term => line.includes(term)))
      .map(line => line.slice(0, 300))
  ).slice(0, 120);

  const facts = {
    dates: extractDates(text),
    times,
    casts: unique(casts),
    statusTerms: unique(statusTerms),
    factLines
  };
  facts.fingerprint = hash(JSON.stringify(facts));
  return facts;
}

function extractPageTitle(html, fallback) {
  const openGraph = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  const title = openGraph?.[1] || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return htmlToText(title || fallback).split("|")[0].trim() || fallback;
}

function difference(current = [], previous = []) {
  const previousSet = new Set(previous);
  return current.filter(value => !previousSet.has(value));
}

function factsDiff(previous, current) {
  return {
    addedDates: difference(current.dates, previous.dates),
    removedDates: difference(previous.dates, current.dates),
    addedTimes: difference(current.times, previous.times),
    removedTimes: difference(previous.times, current.times),
    addedCasts: difference(current.casts, previous.casts),
    removedCasts: difference(previous.casts, current.casts),
    addedStatusTerms: difference(current.statusTerms, previous.statusTerms),
    addedLines: difference(current.factLines, previous.factLines).slice(0, 12),
    removedLines: difference(previous.factLines, current.factLines).slice(0, 12)
  };
}

function hasMeaningfulDiff(diff) {
  return Object.values(diff).some(values => values.length > 0);
}

function isPotentialEvent(title, category) {
  if (STATUS_TERMS.some(term => title.includes(term))) return true;
  if (NON_EVENT_NEWS_TERMS.some(term => title.includes(term))) return false;

  const eventTitle = title
    .replace(/ラブライブ[！!]?/g, "")
    .replace(/LoveLive!/gi, "");
  const hasEventTerm = EVENT_TITLE_TERMS.some(term => eventTitle.includes(term));

  if (category === "キャスト配信/ラジオ") {
    return /(生放送|公開収録|番組|ラジオ|イベント)/.test(eventTitle);
  }
  if (category === "劇場") {
    return /(舞台挨拶|上映会|登壇|トーク)/.test(eventTitle);
  }
  if (category === "音楽商品") {
    return /(発売記念|リリースイベント|お渡し会|サイン会|トークイベント|リスニングパーティー)/.test(eventTitle);
  }
  if (category === "ご当地情報") {
    return /(出演|イベント|祭|ステージ|トーク|お渡し会|サイン会)/.test(eventTitle);
  }
  return hasEventTerm;
}

function parseLoveLiveNews(html) {
  const entries = [];
  const cardPattern = /<a href=["'](?<url>https:\/\/www\.lovelive-anime\.jp\/news\/[^"']+)["'] class=["']detailwrap["']>(?<body>[\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(cardPattern)) {
    const body = match.groups.body;
    const date = body.match(/datetime=["'](\d{4}-\d{2}-\d{2})["']/i)?.[1] || null;
    const category = htmlToText(body.match(/c-category__subcategory["'][^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/i)?.[1] || "");
    const title = htmlToText(body.match(/c-card__title["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || "");
    const series = unique(
      [...body.matchAll(/c-category__series[^>]*>([\s\S]*?)<\/li>/gi)]
        .map(seriesMatch => htmlToText(seriesMatch[1]))
    );
    if (date && title) {
      entries.push({
        date,
        category,
        series,
        title,
        url: normalizeUrl(match.groups.url)
      });
    }
  }
  return entries;
}

function extractLinks(html, baseUrl, allowUrlPattern) {
  const pattern = new RegExp(allowUrlPattern, "i");
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = normalizeUrl(new URL(decodeHtml(match[1]), baseUrl).toString());
      if (!pattern.test(url)) continue;
      const label = htmlToText(match[2]) || decodeHtml(match[2].match(/alt=["']([^"']+)["']/i)?.[1] || "");
      links.push({ url, label });
    } catch {
      // 壊れた相対URLは候補から除外します。
    }
  }
  return [...new Map(links.map(link => [link.url, link])).values()];
}

function isCurrentOrFutureCandidate(facts, today, lookbackDays) {
  if (facts.dates.length === 0) return true;
  const threshold = new Date(`${today}T00:00:00Z`);
  threshold.setUTCDate(threshold.getUTCDate() - lookbackDays);
  const thresholdIso = threshold.toISOString().slice(0, 10);
  return facts.dates.some(date => date >= thresholdIso);
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function sleep(milliseconds) {
  return new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds));
}

async function fetchHtml(url, config) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(config.timeoutMs),
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "ja-JP,ja;q=0.9,en;q=0.8",
      "referer": "https://www.lovelive-anime.jp/",
      "user-agent": "Mozilla/5.0 (compatible; lovelive-calendar-event-monitor/0.1; +https://github.com/Yukachiii/lovelive-calendar)"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text") && !contentType.includes("html")) {
    throw new Error(`HTMLではありません: ${contentType || "unknown"}`);
  }
  return {
    html: await response.text(),
    finalUrl: normalizeUrl(response.url || url)
  };
}

function publishedUrlMap() {
  const map = new Map();
  for (const event of events) {
    if (!event.officialUrl) continue;
    const url = normalizeUrl(event.officialUrl);
    if (!map.has(url)) map.set(url, new Set());
    map.get(url).add(`${event.date} ${event.title}${event.performanceLabel ? ` ${event.performanceLabel}` : ""}`);
  }
  return map;
}

function publishedReferenceUrls() {
  const urls = new Set();
  for (const event of events) {
    for (const value of [event.officialUrl, event.sourceUrl]) {
      if (value) urls.add(normalizeUrl(value));
    }
  }
  return urls;
}

function addCandidate(candidateMap, candidate) {
  if (!candidateMap.has(candidate.url)) candidateMap.set(candidate.url, candidate);
}

function formatList(values) {
  return values.length ? values.join("、") : "なし";
}

function buildMarkdown(report) {
  const lines = [
    "# イベント情報 自動収集レポート",
    "",
    `確認日時: ${report.checkedAt}（JST）`,
    `監視成功: ${report.stats.successfulMonitors}件 / 監視失敗: ${report.stats.failedMonitors}件`,
    ""
  ];

  if (report.newCandidates.length) {
    lines.push("## 新規候補", "");
    for (const candidate of report.newCandidates) {
      const details = [candidate.date, candidate.category, candidate.series?.join("・")].filter(Boolean).join(" / ");
      lines.push(`- [${candidate.title}](${candidate.url})${details ? ` — ${details}` : ""}`);
      if (candidate.discoveredFrom) lines.push(`  - 発見元: ${candidate.discoveredFrom}`);
    }
    lines.push("");
  }

  if (report.changes.length) {
    lines.push("## 掲載済み情報の変更候補", "");
    for (const change of report.changes) {
      lines.push(`### [${change.label}](${change.url})`, "");
      if (change.events.length) lines.push(`掲載イベント: ${change.events.join(" / ")}`, "");
      if (change.diff.addedDates.length) lines.push(`- 追加された日付: ${formatList(change.diff.addedDates)}`);
      if (change.diff.removedDates.length) lines.push(`- 消えた日付: ${formatList(change.diff.removedDates)}`);
      if (change.diff.addedTimes.length) lines.push(`- 追加された時刻: ${formatList(change.diff.addedTimes)}`);
      if (change.diff.removedTimes.length) lines.push(`- 消えた時刻: ${formatList(change.diff.removedTimes)}`);
      if (change.diff.addedCasts.length) lines.push(`- 追加されたキャスト: ${formatList(change.diff.addedCasts)}`);
      if (change.diff.removedCasts.length) lines.push(`- 消えたキャスト: ${formatList(change.diff.removedCasts)}`);
      if (change.diff.addedStatusTerms.length) lines.push(`- 新たに検出した重要語句: ${formatList(change.diff.addedStatusTerms)}`);
      if (change.diff.addedLines.length) {
        lines.push("- 追加・変更された可能性がある記述:");
        for (const line of change.diff.addedLines) lines.push(`  - ${line}`);
      }
      if (change.diff.removedLines.length) {
        lines.push("- 消えた可能性がある記述:");
        for (const line of change.diff.removedLines) lines.push(`  - ${line}`);
      }
      lines.push("");
    }
  }

  if (report.warnings.length) {
    lines.push("## 継続している監視エラー", "");
    for (const warning of report.warnings) {
      lines.push(`- [${warning.label}](${warning.url}): ${warning.error}`);
    }
    lines.push("");
  }

  if (report.transientErrors.length) {
    lines.push("## 今回の一時的な取得エラー（通知対象外）", "");
    for (const warning of report.transientErrors) {
      lines.push(`- [${warning.label}](${warning.url}): ${warning.error}`);
    }
    lines.push("", "同じ取得エラーが2回続いた場合に、確認用Issueの対象になります。", "");
  }

  if (!report.hasAlerts) {
    lines.push("新規候補・重要な変更・継続的な監視エラーは見つかりませんでした。", "");
  }

  lines.push("自動抽出結果です。公開前に必ずリンク先の一次情報を確認してください。", "");
  return lines.join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const config = await readJson(options.config, null);
  if (!config || config.version !== 1) throw new Error("automation/sources.json を読み込めませんでした。");

  const state = await readJson(options.state, {
    version: 1,
    updatedAt: null,
    sources: {},
    checks: {},
    seenCandidates: {}
  });
  state.sources ||= {};
  state.checks ||= {};
  state.seenCandidates ||= {};

  const today = localDateIso();
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - config.lookbackDays);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const castNames = unique(Object.values(castBySeries).flat());
  const published = publishedUrlMap();
  const publishedReferences = publishedReferenceUrls();
  const candidateMap = new Map();
  const monitorMap = new Map();
  const fetchCache = new Map();
  const runErrors = [];

  const recordCheckSuccess = (key, label, url) => {
    state.checks[key] = {
      label,
      url,
      lastSuccessAt: new Date().toISOString(),
      consecutiveFailures: 0,
      lastError: null,
      failureWarningReported: false
    };
  };

  const recordCheckFailure = (key, label, url, error) => {
    const previous = state.checks[key];
    state.checks[key] = {
      ...(previous || {}),
      label,
      url,
      consecutiveFailures: (previous?.consecutiveFailures || 0) + 1,
      lastError: error.message,
      lastFailureAt: new Date().toISOString(),
      failureWarningReported: previous?.failureWarningReported || false
    };
    runErrors.push({ label, url, error: error.message });
  };

  const getPage = async url => {
    const normalized = normalizeUrl(url);
    if (!fetchCache.has(normalized)) {
      const request = (async () => {
        await sleep(config.requestDelayMs);
        return fetchHtml(normalized, config);
      })();
      fetchCache.set(normalized, request);
    }
    return fetchCache.get(normalized);
  };

  if (config.monitorPublishedOfficialUrls) {
    for (const [url, eventLabels] of published) {
      monitorMap.set(url, {
        url,
        label: [...eventLabels][0],
        events: [...eventLabels],
        kind: "published"
      });
    }
  }

  for (const source of config.newsSources || []) {
    for (let page = 1; page <= source.pages; page += 1) {
      const url = source.urlTemplate.replace("{page}", String(page));
      const checkKey = `news:${source.id}:${page}`;
      try {
        const response = await getPage(url);
        recordCheckSuccess(checkKey, `${source.label} ${page}ページ`, url);
        const entries = parseLoveLiveNews(response.html);
        for (const entry of entries) {
          if (entry.date < cutoffIso) continue;
          if (!source.categories.includes(entry.category)) continue;
          if (!isPotentialEvent(entry.title, entry.category)) continue;
          if (publishedReferences.has(entry.url) || state.seenCandidates[entry.url]) continue;
          addCandidate(candidateMap, {
            ...entry,
            discoveredFrom: source.label,
            sourceKind: "news"
          });
        }
      } catch (error) {
        recordCheckFailure(checkKey, `${source.label} ${page}ページ`, url, error);
      }
    }
  }

  for (const source of config.linkSources || []) {
    const indexCheckKey = `index:${source.id}`;
    try {
      const response = await getPage(source.url);
      recordCheckSuccess(indexCheckKey, source.label, source.url);
      const links = extractLinks(response.html, response.finalUrl, source.allowUrlPattern);
      for (const link of links) {
        if (publishedReferences.has(link.url)) continue;
        const detailCheckKey = `detail:${link.url}`;
        try {
          const detail = await getPage(link.url);
          recordCheckSuccess(detailCheckKey, link.label || source.label, link.url);
          const text = htmlToText(detail.html);
          const facts = extractFacts(text, castNames);
          if (!isCurrentOrFutureCandidate(facts, today, config.lookbackDays)) continue;
          const title = extractPageTitle(detail.html, link.label || source.label);
          monitorMap.set(link.url, { url: link.url, label: title, events: [], kind: "candidate" });
          if (!state.seenCandidates[link.url]) {
            addCandidate(candidateMap, {
              title,
              url: link.url,
              date: facts.dates.find(date => date >= today) || facts.dates.at(-1) || null,
              category: "公式ライブ一覧",
              series: [],
              discoveredFrom: source.label,
              sourceKind: "live-index"
            });
          }
        } catch (error) {
          recordCheckFailure(detailCheckKey, link.label || source.label, link.url, error);
        }
      }
    } catch (error) {
      recordCheckFailure(indexCheckKey, source.label, source.url, error);
    }
  }

  for (const source of config.seedCandidateSources || []) {
    const url = normalizeUrl(source.url);
    if (!publishedReferences.has(url)) {
      monitorMap.set(url, { url, label: source.label, events: [], kind: "candidate" });
      if (!state.seenCandidates[url]) {
        const checkKey = `seed:${source.id}`;
        try {
          const detail = await getPage(url);
          recordCheckSuccess(checkKey, source.label, url);
          const text = htmlToText(detail.html);
          const facts = extractFacts(text, castNames);
          addCandidate(candidateMap, {
            title: extractPageTitle(detail.html, source.label),
            url,
            date: facts.dates.find(date => date >= today) || facts.dates.at(-1) || null,
            category: "登録済み監視候補",
            series: [],
            discoveredFrom: "automation/sources.json",
            sourceKind: "seed"
          });
        } catch (error) {
          recordCheckFailure(checkKey, source.label, url, error);
        }
      }
    }
  }

  const changes = [];
  let successfulMonitors = 0;
  let failedMonitors = 0;

  for (const monitor of monitorMap.values()) {
    const previous = state.sources[monitor.url];
    try {
      const response = await getPage(monitor.url);
      const text = htmlToText(response.html);
      const facts = extractFacts(text, castNames);
      const label = extractPageTitle(response.html, monitor.label);
      successfulMonitors += 1;

      if (previous?.facts?.fingerprint && previous.facts.fingerprint !== facts.fingerprint) {
        const diff = factsDiff(previous.facts, facts);
        if (hasMeaningfulDiff(diff)) {
          changes.push({
            url: monitor.url,
            label,
            events: monitor.events,
            diff
          });
        }
      }

      state.sources[monitor.url] = {
        label,
        kind: monitor.kind,
        facts,
        lastSuccessAt: new Date().toISOString(),
        consecutiveFailures: 0,
        lastError: null,
        failureWarningReported: false
      };
    } catch (error) {
      failedMonitors += 1;
      const failures = (previous?.consecutiveFailures || 0) + 1;
      state.sources[monitor.url] = {
        ...(previous || {}),
        label: monitor.label,
        kind: monitor.kind,
        consecutiveFailures: failures,
        lastError: error.message,
        lastFailureAt: new Date().toISOString(),
        failureWarningReported: previous?.failureWarningReported || false
      };
      runErrors.push({ label: monitor.label, url: monitor.url, error: error.message });
    }
  }

  const newCandidates = [...candidateMap.values()].sort((left, right) => {
    return String(left.date || "9999-99-99").localeCompare(String(right.date || "9999-99-99"))
      || left.title.localeCompare(right.title, "ja");
  });

  for (const candidate of newCandidates) {
    state.seenCandidates[candidate.url] = {
      title: candidate.title,
      firstSeenAt: new Date().toISOString(),
      sourceKind: candidate.sourceKind
    };
  }

  const warnings = [
    ...Object.entries(state.sources)
      .filter(([, sourceState]) => sourceState.consecutiveFailures >= 2 && !sourceState.failureWarningReported)
      .map(([url, sourceState]) => ({
        label: sourceState.label || url,
        url,
        error: `${sourceState.lastError}（${sourceState.consecutiveFailures}回連続）`
      })),
    ...Object.values(state.checks)
      .filter(checkState => checkState.consecutiveFailures >= 2 && !checkState.failureWarningReported)
      .map(checkState => ({
        label: checkState.label || checkState.url,
        url: checkState.url,
        error: `${checkState.lastError}（${checkState.consecutiveFailures}回連続）`
      }))
  ];

  for (const warning of warnings) {
    if (state.sources[warning.url]) state.sources[warning.url].failureWarningReported = true;
    for (const checkState of Object.values(state.checks)) {
      if (checkState.url === warning.url) checkState.failureWarningReported = true;
    }
  }

  const warningUrls = new Set(warnings.map(warning => warning.url));
  const transientErrors = runErrors.filter(error => !warningUrls.has(error.url));

  state.updatedAt = new Date().toISOString();
  const report = {
    checkedAt: formatJstTimestamp(),
    hasAlerts: newCandidates.length + changes.length + warnings.length > 0,
    newCandidates,
    changes,
    warnings,
    transientErrors,
    stats: {
      publishedEventUrls: published.size,
      monitoredUrls: monitorMap.size,
      successfulMonitors,
      failedMonitors,
      discoveryFailures: runErrors.length - failedMonitors,
      fetchedUrls: fetchCache.size
    }
  };

  const markdown = buildMarkdown(report);
  await mkdir(options.output, { recursive: true });
  await writeFile(resolve(options.output, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(resolve(options.output, "report.md"), markdown, "utf8");

  if (!options.dryRun) {
    await mkdir(dirname(options.state), { recursive: true });
    await writeFile(options.state, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  }

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `has_alerts=${report.hasAlerts}\nalert_count=${newCandidates.length + changes.length + warnings.length}\n`, "utf8");
  }

  console.log(JSON.stringify({
    ...report.stats,
    newCandidates: newCandidates.length,
    changes: changes.length,
    warnings: warnings.length,
    stateSaved: !options.dryRun
  }, null, 2));
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
