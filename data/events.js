export const categories = {
  official: { label: "公式", color: "var(--official)" },
  cast: { label: "キャスト", color: "var(--cast)" },
  unit: { label: "別ユニット・番組", color: "var(--unit)" },
  stage: { label: "舞台・朗読", color: "var(--stage)" },
  guest: { label: "ゲスト出演", color: "var(--guest)" }
};

const VERIFIED_AT = "2026-09-09";

// 会場を独立した形にしておくと、将来Supabaseのvenuesテーブルや
// Mapbox用の緯度・経度へ移行しやすくなります。現時点では地図表示しません。
const venues = {
  tokyoTba: { id: "tokyo-tba", name: "東京都内某所", prefecture: "東京都", address: null, coordinates: null },
  scienceHall: { id: "science-hall", name: "科学技術館サイエンスホール", prefecture: "東京都", address: "東京都千代田区北の丸公園2-1", coordinates: null },
  dejimaMesse: { id: "dejima-messe-nagasaki", name: "出島メッセ長崎 コンベンションホール", prefecture: "長崎県", address: "長崎県長崎市尾上町4-1", coordinates: null },
  aruaruCity: { id: "aruaru-city-7f", name: "あるあるCity 7Fホール", prefecture: "福岡県", address: "福岡県北九州市小倉北区浅野2-14-5", coordinates: null },
  shibuyaLovez: { id: "shibuya-lovez", name: "Shibuya LOVEZ", prefecture: "東京都", address: null, coordinates: null },
  tokyoKinemaClub: { id: "tokyo-kinema-club", name: "東京キネマ倶楽部", prefecture: "東京都", address: null, coordinates: null },
  takachihoUniversity: { id: "takachiho-university-building-1", name: "高千穂大学 1号館", prefecture: "東京都", address: null, coordinates: null },
  gardenHall: { id: "the-garden-hall", name: "ザ・ガーデンホール", prefecture: "東京都", address: null, coordinates: null },
  hakuhinkanTheater: { id: "hakuhinkan-theater", name: "博品館劇場", prefecture: "東京都", address: "東京都中央区銀座8-8-11", coordinates: null },
  theaterMilanoZa: { id: "theater-milano-za", name: "THEATER MILANO-Za", prefecture: "東京都", address: null, coordinates: null },
  hotelSpringsMakuhari: { id: "hotel-springs-makuhari", name: "ホテルスプリングス幕張 スプリングスホール", prefecture: "千葉県", address: "千葉県千葉市美浜区ひび野1-11", coordinates: null },
  suginamiHall: { id: "suginami-workers-welfare-hall", name: "杉並区勤労福祉会館", prefecture: "東京都", address: null, coordinates: null }
};

function verifiedEvent({ endsAt = null, performanceLabel = "", note = "", sourceUrl = null, ...event }) {
  return {
    ...event,
    endsAt,
    performanceLabel,
    note,
    officialUrl: event.officialUrl,
    sourceUrl: sourceUrl || event.officialUrl,
    verifiedAt: VERIFIED_AT
  };
}

const liellaGamersUrl = "https://www.gamers.co.jp/contents/event_fair/detail.php?id=7324";
const liellaAnimateUrl = "https://www.animate-onlineshop.jp/contents/fair_event/detail.php?id=114983";
const nakoRadioUrl = "https://www.onsen.ag/program/nako#event";
const nonakaNagasakiUrl = "https://audee-membership.jp/cocona-nonaka/articles/news/aro5FxvnGQH6AoHKDg83UHN8";
const yabushimaUrl = "https://aruarucity.com/event/?act=Detail&mode=View&e_id=00002440";
const filmLiveUrl = "https://www.lovelive-anime.jp/special/live/live_detail.php?p=15thzenyasai";
const sakakuraUrl = "https://aruarucity.com/event/?act=Detail&mode=View&e_id=00002436";
const sagaraKitoUrl = "https://aruarucity.com/event/?act=Detail&mode=View&e_id=00002438";
const inamiTourUrl = "https://www.sma.co.jp/s/sma/music/inamianju_ticket";
const characterMixUrl = "https://eplus.jp/sf/detail/4551510001-P0030002P021001?P6=001";
const podcastUrl = "https://audee-membership.jp/cocona-nonaka/articles/news/arH3damGggnJVU5WsP7bGhFv";
const sherlockUrl = "https://hakuhinkantheater.com/sherlockholmes/";
const hanamiyaUrl = "https://milano-za.jp/events/article?id=20261024";
const konyaitoUrl = "https://nicochannel.jp/tsukine-kona/articles/news/ar5PYDswmxC6DLFNDWe2nMtX";
const fioriUrl = "https://nkplanning.wixsite.com/nk-event/%E8%A4%87%E8%A3%BD-%E6%9C%97%E8%AA%AD%E3%81%A8%E6%AD%8C%E3%81%A8%E3%81%8A%E3%81%97%E3%82%83%E3%81%B9%E3%82%8A%E3%82%92%E3%81%8D%E3%81%BF%E3%81%A8-w-smmmiloop";

// 1レコードを1公演・1出演枠として扱います。
export const events = [
  ...[
    ["date-sayuri", "14:20", "15:00", "伊達さゆり"],
    ["liyuu", "15:30", "16:10", "Liyuu"],
    ["aoyama-nagisa", "16:40", "17:20", "青山なぎさ"],
    ["suzuhara-nozomi", "17:50", "18:30", "鈴原希実"],
    ["yabushima-akane", "19:00", "19:40", "薮島朱音"],
    ["yuina", "20:10", "20:50", "結那"]
  ].map(([suffix, startsAt, endsAt, castName]) => verifiedEvent({
    id: `liella-gamers-20261002-${suffix}`,
    eventGroupId: "liella-musubu-gamers-20261002",
    date: "2026-10-02",
    doorsAt: null,
    startsAt,
    endsAt,
    category: "official",
    title: "『Liella!と結ぶプロジェクト』発売記念お渡し会",
    performanceLabel: castName,
    cast: [castName],
    venue: venues.tokyoTba,
    officialUrl: liellaGamersUrl
  })),
  verifiedEvent({
    id: "nako-radio-20261003-part1", eventGroupId: "nako-radio-20261003", date: "2026-10-03",
    doorsAt: "13:30", startsAt: "14:00", endsAt: "15:30", category: "cast",
    title: "岬なこのそんなこんなこラジオ！イベント", performanceLabel: "第1部 なこの部",
    cast: ["岬なこ"], venue: venues.scienceHall, officialUrl: nakoRadioUrl,
    sourceUrl: "https://eplus.jp/sf/detail/4022590001"
  }),
  verifiedEvent({
    id: "nako-radio-20261003-part2", eventGroupId: "nako-radio-20261003", date: "2026-10-03",
    doorsAt: "16:30", startsAt: "17:00", endsAt: "19:00", category: "cast",
    title: "岬なこのそんなこんなこラジオ！イベント", performanceLabel: "第2部 ちゃーんの部",
    cast: ["岬なこ", "佳原萌枝", "七瀬つむぎ", "松田彩音"], venue: venues.scienceHall, officialUrl: nakoRadioUrl,
    sourceUrl: "https://eplus.jp/sf/detail/4022590001"
  }),
  ...[
    ["part1", "第1部", "11:00", "11:30", "13:00"],
    ["part2", "第2部", "13:30", "14:00", "15:30"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt, endsAt]) => verifiedEvent({
    id: `nonaka-nagasaki-20261003-${suffix}`, eventGroupId: "nonaka-nagasaki-20261003", date: "2026-10-03",
    doorsAt, startsAt, endsAt, category: "cast",
    title: "野中ここなのノナカの野望 1周年スペシャルイベント in 長崎", performanceLabel,
    cast: ["野中ここな"], venue: venues.dejimaMesse, officialUrl: nonakaNagasakiUrl,
    sourceUrl: suffix === "part1" ? "https://www.eventernote.com/events/490548" : nonakaNagasakiUrl
  })),
  ...[
    ["part1", "第1部", "11:30", "12:00"],
    ["part2", "第2部", "15:15", "15:45"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt]) => verifiedEvent({
    id: `yabushima-yattekuru-20261004-${suffix}`, eventGroupId: "yabushima-yattekuru-20261004", date: "2026-10-04",
    doorsAt, startsAt, category: "cast", title: "薮島朱音がYATTEKURU", performanceLabel,
    cast: ["薮島朱音"], venue: venues.aruaruCity, officialUrl: yabushimaUrl
  })),
  verifiedEvent({
    id: "cute-aggression-20261004-part1", eventGroupId: "cute-aggression-20261004", date: "2026-10-04",
    doorsAt: "13:00", startsAt: "13:30", endsAt: "15:30", category: "guest",
    title: "もえ・つむぎ・きゅーとあぐれっしょんっ！あやねもいるよ♪", performanceLabel: "第1部 うどんの部",
    cast: ["佳原萌枝", "七瀬つむぎ", "松田彩音", "岬なこ（ゲスト）"], venue: venues.scienceHall, officialUrl: nakoRadioUrl,
    sourceUrl: "https://eplus.jp/sf/detail/4447380001"
  }),
  verifiedEvent({
    id: "cute-aggression-20261004-part2", eventGroupId: "cute-aggression-20261004", date: "2026-10-04",
    doorsAt: "16:30", startsAt: "17:00", endsAt: "18:30", category: "cast",
    title: "もえ・つむぎ・きゅーとあぐれっしょんっ！あやねもいるよ♪", performanceLabel: "第2部 どんぶりの部",
    cast: ["佳原萌枝", "七瀬つむぎ", "松田彩音"], venue: venues.scienceHall, officialUrl: nakoRadioUrl,
    sourceUrl: "https://eplus.jp/sf/detail/4447380001"
  }),
  ...[
    ["payton-naomi", "14:20", "15:00", "ペイトン尚未"],
    ["misaki-nako", "15:30", "16:10", "岬なこ"],
    ["okuma-wakana", "16:40", "17:20", "大熊和奏"],
    ["emori-aya", "17:50", "18:30", "絵森彩"],
    ["sakakura-sakura", "19:00", "19:40", "坂倉花"]
  ].map(([suffix, startsAt, endsAt, castName]) => verifiedEvent({
    id: `liella-animate-20261009-${suffix}`, eventGroupId: "liella-musubu-animate-20261009", date: "2026-10-09",
    doorsAt: null, startsAt, endsAt, category: "official",
    title: "『Liella!と結ぶプロジェクト』発売記念お渡し会", performanceLabel: castName,
    cast: [castName], venue: venues.tokyoTba, officialUrl: liellaAnimateUrl
  })),
  ...[
    ["20261010-day", "2026-10-10", "Day.1 昼公演", "13:30", "14:30"],
    ["20261010-night", "2026-10-10", "Day.1 夜公演", "17:30", "18:30"],
    ["20261011-day", "2026-10-11", "Day.2 昼公演", "13:00", "14:00"],
    ["20261011-night", "2026-10-11", "Day.2 夜公演", "17:00", "18:00"]
  ].map(([suffix, date, performanceLabel, doorsAt, startsAt]) => verifiedEvent({
    id: `film-live-${suffix}`, eventGroupId: "lovelive-film-live-20261010-11", date,
    doorsAt, startsAt, category: "official", title: "ラブライブ！フェス 前夜祭 FILM LIVE", performanceLabel,
    cast: ["シリーズ合同（詳細は公式ページ参照）"], venue: venues.shibuyaLovez, officialUrl: filmLiveUrl,
    sourceUrl: "https://shibuyalovez.jp/schedule/?month=10&year=2026"
  })),
  ...[
    ["part1", "第1部", "12:00", "12:30"],
    ["part2", "第2部", "16:00", "16:30"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt]) => verifiedEvent({
    id: `sakakura-yattekuru-20261010-${suffix}`, eventGroupId: "sakakura-yattekuru-20261010", date: "2026-10-10",
    doorsAt, startsAt, category: "cast", title: "坂倉花がYATTEKURU", performanceLabel,
    cast: ["坂倉花"], venue: venues.aruaruCity, officialUrl: sakakuraUrl
  })),
  ...[
    ["part1", "第1部", "11:30", "12:00"],
    ["part2", "第2部", "15:15", "15:45"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt]) => verifiedEvent({
    id: `sagara-kito-yattekuru-20261012-${suffix}`, eventGroupId: "sagara-kito-yattekuru-20261012", date: "2026-10-12",
    doorsAt, startsAt, category: "cast", title: "相良茉優と鬼頭明里がYATTEKURU", performanceLabel,
    cast: ["相良茉優", "鬼頭明里"], venue: venues.aruaruCity, officialUrl: sagaraKitoUrl
  })),
  verifiedEvent({
    id: "inami-anju-tour-20261014-tokyo", eventGroupId: "inami-anju-live-tour-2026", date: "2026-10-14",
    doorsAt: "18:30", startsAt: "19:30", category: "cast",
    title: "伊波杏樹 LIVE TOUR 2026『NONSTOP the 愛愛愛っ!♡』", performanceLabel: "東京 Special Night Stage／SOLO side",
    cast: ["伊波杏樹"], venue: venues.tokyoKinemaClub, officialUrl: inamiTourUrl
  }),
  ...[
    ["part1", "第1部", "13:00", "13:30", "夏目妃菜"],
    ["part2", "第2部", "15:30", "16:00", "飯田ヒカル"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt, partCast]) => verifiedEvent({
    id: `character-mix-20261017-${suffix}`, eventGroupId: "character-mix-20261017", date: "2026-10-17",
    doorsAt, startsAt, category: "guest", title: "キャラミクス トークイベント vol.2 in 高千穂大学", performanceLabel,
    cast: ["矢吹健太朗", "月音こな", "遠藤璃菜", "ペイトン尚未", "前島亜美", partCast],
    venue: venues.takachihoUniversity, officialUrl: characterMixUrl
  })),
  ...[
    ["part1", "第1部『小林愛香のきゃんがきゅんと』", "12:30", "13:30", "https://eventing.now/ja/event/8601"],
    ["part2", "第2部『野中ここなのノナカの野望』", "16:00", "17:00", "https://eventing.now/ja/event/8602"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt, sourceUrl]) => verifiedEvent({
    id: `podcast-joint-20261017-${suffix}`, eventGroupId: "podcast-joint-20261017", date: "2026-10-17",
    doorsAt, startsAt, category: "unit", title: "ポッドキャストメンバーシップ1周年合同イベント", performanceLabel,
    cast: ["小林愛香", "野中ここな"], venue: venues.gardenHall, officialUrl: podcastUrl, sourceUrl
  })),
  verifiedEvent({
    id: "sherlock-holmes-20261020-1900", eventGroupId: "sherlock-holmes-20261020-25", date: "2026-10-20",
    doorsAt: null, startsAt: "19:00", category: "stage",
    title: "名作リーディングシアター『シャーロック・ホームズ〜緋色の研究・出会い〜』", performanceLabel: "10月20日公演",
    cast: ["小林裕介", "幸村恵理", "仲村宗悟", "小林竜之", "ペイトン尚未"],
    venue: venues.hakuhinkanTheater, officialUrl: sherlockUrl
  }),
  ...[
    ["1230", "12:30", ["神尾晋一郎", "伊波杏樹", "野上翔", "石谷春貴", "月音こな"]],
    ["1800", "18:00", ["細谷佳正", "山中真尋", "永塚拓馬", "米内佑希", "野中ここな"]]
  ].map(([suffix, startsAt, cast]) => verifiedEvent({
    id: `sherlock-holmes-20261025-${suffix}`, eventGroupId: "sherlock-holmes-20261020-25", date: "2026-10-25",
    doorsAt: null, startsAt, category: "stage",
    title: "名作リーディングシアター『シャーロック・ホームズ〜緋色の研究・出会い〜』", performanceLabel: `${startsAt}公演`,
    cast, venue: venues.hakuhinkanTheater, officialUrl: sherlockUrl
  })),
  ...[
    ["part1", "第1部", "14:15", "15:00"],
    ["part2", "第2部", "17:45", "18:30"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt]) => verifiedEvent({
    id: `hanamiya-birthday-20261024-${suffix}`, eventGroupId: "hanamiya-birthday-20261024", date: "2026-10-24",
    doorsAt, startsAt, category: "cast", title: "217find! presents 花宮初奈 誕生日イベント～ファラオの祝祭～", performanceLabel,
    cast: ["花宮初奈"], venue: venues.theaterMilanoZa, officialUrl: hanamiyaUrl
  })),
  ...[
    ["day", "昼の部", "13:30", "14:30", ["月音こな", "野中ここな（ゲスト）"]],
    ["night", "夜の部", "17:00", "18:00", ["月音こな"]]
  ].map(([suffix, performanceLabel, doorsAt, startsAt, cast]) => verifiedEvent({
    id: `konyaito-meeting2-20261024-${suffix}`, eventGroupId: "konyaito-meeting2-20261024", date: "2026-10-24",
    doorsAt, startsAt, category: suffix === "day" ? "guest" : "cast",
    title: "月音こなのまだ本気出してないだけだから！こにゃいと本気ミーティング2", performanceLabel,
    cast, venue: venues.hotelSpringsMakuhari, officialUrl: konyaitoUrl,
    sourceUrl: suffix === "night" ? "https://www.eventernote.com/events/489775" : konyaitoUrl
  })),
  ...[
    ["day", "昼の部", "13:30", "14:00"],
    ["night", "夜の部", "17:30", "18:00"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt]) => verifiedEvent({
    id: `fiori-surprise-party-20261031-${suffix}`, eventGroupId: "fiori-surprise-party-20261031", date: "2026-10-31",
    doorsAt, startsAt, category: "stage",
    title: "朗読と歌とおしゃべりをきみと 〜W〜『Fioriのサプライズパーティー』", performanceLabel,
    cast: ["紫月杏朱彩", "梅澤めぐ", "菅叶和", "湊みや"], venue: venues.suginamiHall, officialUrl: fioriUrl
  }))
];
