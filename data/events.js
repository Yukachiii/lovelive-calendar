export const categories = {
  official: { label: "公式", color: "var(--official)" },
  cast: { label: "キャスト", color: "var(--cast)" },
  unit: { label: "別ユニット・番組", color: "var(--unit)" },
  stage: { label: "舞台・朗読", color: "var(--stage)" },
  guest: { label: "ゲスト出演", color: "var(--guest)" }
};

export const seriesDefinitions = {
  muse: { label: "μ’s" },
  aqours: { label: "Aqours" },
  nijigasaki: { label: "虹ヶ咲" },
  liella: { label: "Liella!" },
  hasunosora: { label: "蓮ノ空" },
  ikizurai: { label: "いきづらい部！" },
  musical: { label: "スクールアイドルミュージカル" },
  series: { label: "シリーズ合同" }
};

// UIと将来のAPIで共通利用する、シリーズ別のラブライブ！キャスト名簿です。
// イベントの全出演者はallCastに残し、画面にはこの名簿に一致するcastだけを渡します。
// 参照: https://www.lovelive-anime.jp/special/members/ （2026-09-10確認）
export const castBySeries = {
  muse: ["新田恵海", "南條愛乃", "内田彩", "三森すずこ", "飯田里穂", "Pile", "楠田亜衣奈", "久保ユリカ", "徳井青空"],
  aqours: ["伊波杏樹", "逢田梨香子", "諏訪ななか", "小宮有紗", "斉藤朱夏", "小林愛香", "高槻かなこ", "鈴木愛奈", "降幡愛"],
  nijigasaki: ["矢野妃菜喜", "大西亜玖璃", "相良茉優", "前田佳織里", "久保田未夢", "村上奈津実", "鬼頭明里", "楠木ともり", "林鼓子", "指出毬亜", "田中ちえ美", "小泉萌香", "内田秀", "法元明菜"],
  liella: ["伊達さゆり", "Liyuu", "岬なこ", "ペイトン尚未", "青山なぎさ", "鈴原希実", "薮島朱音", "大熊和奏", "絵森彩", "結那", "坂倉花"],
  hasunosora: ["楡井希実", "野中ここな", "花宮初奈", "佐々木琴子", "菅叶和", "月音こな", "櫻井陽菜", "葉山風花", "来栖りん", "三宅美羽", "進藤あまね"],
  ikizurai: ["綾咲穂音", "遠藤璃菜", "宮野芹", "藤野こころ", "坂野愛羽", "瀬古梨愛", "奥村優季", "天沢朱音", "小戸森穂花", "涼ノ瀬葵音"]
};

const loveLiveCastNames = new Set(Object.values(castBySeries).flat());

function normalizeCastName(name = "") {
  return String(name).replace(/[（(].*$/, "").trim();
}

function isLoveLiveCast(name) {
  return loveLiveCastNames.has(normalizeCastName(name));
}

function deriveSeries(event) {
  const related = new Set(Array.isArray(event.series) ? event.series : []);
  const cast = Array.isArray(event.cast) ? event.cast : [event.cast].filter(Boolean);

  Object.entries(castBySeries).forEach(([series, names]) => {
    if (cast.some(name => names.includes(normalizeCastName(name)))) {
      related.add(series);
    }
  });

  if (event.title.includes("いきづらい部！")) related.add("ikizurai");
  if (event.title.includes("スクールアイドルミュージカル")) related.add("musical");
  if (event.title.includes("ラブライブ！フェス")) related.add("series");

  return Object.keys(seriesDefinitions).filter(series => related.has(series));
}

const DEFAULT_VERIFIED_AT = "2026-09-09";
const SEPTEMBER_VERIFIED_AT = "2026-09-10";

// 会場を独立した形にしておくと、将来Supabaseのvenuesテーブルや
// Mapbox用の緯度・経度へ移行しやすくなります。現時点では地図表示しません。
const venues = {
  tokyoGymnasium: { id: "tokyo-gymnasium-main-arena", name: "東京体育館 メインアリーナ", prefecture: "東京都", address: "東京都渋谷区千駄ケ谷1-17-1", coordinates: null },
  animateHallBlack: { id: "animate-hall-black", name: "animate hall BLACK（アニメイト池袋本店 北館9F）", prefecture: "東京都", address: "東京都豊島区東池袋1-20-7", coordinates: null },
  akihabaraGamers: { id: "akihabara-gamers-6f", name: "AKIHABARAゲーマーズ本店 6Fイベントスペース", prefecture: "東京都", address: "東京都千代田区外神田1-14-7 外神田一丁目ビル", coordinates: null },
  esportsField: { id: "esports-field", name: "eスポーツフィールド", prefecture: "東京都", address: "東京都板橋区高島平1-79-3 トミコシ会館2F", coordinates: null },
  owlSpot: { id: "owlspot", name: "あうるすぽっと（豊島区立舞台芸術交流センター）", prefecture: "東京都", address: "東京都豊島区東池袋4-5-2 ライズアリーナビル2F", coordinates: null },
  theater1010: { id: "theater-1010", name: "シアター1010", prefecture: "東京都", address: "東京都足立区千住3-92 ミルディスI番館11F", coordinates: null },
  sunshineCityFountain: { id: "sunshine-city-fountain-plaza", name: "サンシャインシティ 噴水広場", prefecture: "東京都", address: "東京都豊島区東池袋3-1 サンシャインシティ 専門店街アルパB1", coordinates: null },
  shinjukuReny: { id: "shinjuku-reny", name: "新宿ReNY", prefecture: "東京都", address: "東京都新宿区西新宿6-5-1 新宿アイランドホール2F", coordinates: null },
  goldenPigsRed: { id: "golden-pigs-red-stage", name: "GOLDEN PIGS RED STAGE", prefecture: "新潟県", address: "新潟県新潟市中央区東堀通6番町1051-1 G.E.ビル5F", coordinates: null },
  keioArena: { id: "keio-arena-tokyo-main", name: "京王アリーナTOKYO メインアリーナ", prefecture: "東京都", address: "東京都調布市西町290-11", coordinates: null },
  lalaportNumazu: { id: "lalaport-numazu-umi-plaza", name: "ららぽーと沼津 1F 屋外イベントスペース うみの広場", prefecture: "静岡県", address: "静岡県沼津市東椎路字東荒301-3", coordinates: null },
  shiodomeUnderground: { id: "shiodome-siosite-underground", name: "汐留シオサイト地下歩道", prefecture: "東京都", address: "東京都港区東新橋1-8-8 B1", coordinates: null },
  namcoTokyo: { id: "namco-tokyo", name: "namco TOKYO", prefecture: "東京都", address: "東京都新宿区歌舞伎町1-29-1 東急歌舞伎町タワー3F", coordinates: null },
  towerRecordsShibuya: { id: "tower-records-shibuya-5f", name: "タワーレコード渋谷店 5Fイベントスペース", prefecture: "東京都", address: "東京都渋谷区神南1-22-14", coordinates: null },
  kiwaTennoz: { id: "kiwa-tennoz", name: "KIWA TENNOZ", prefecture: "東京都", address: "東京都品川区東品川2-1-3", coordinates: null },
  zendenTsurodoHall: { id: "zenden-tsurodo-hall", name: "全電通労働会館 多目的ホール", prefecture: "東京都", address: "東京都千代田区神田駿河台3-6", coordinates: null },
  saitamaHall: { id: "saitama-kaikan-main-hall", name: "埼玉会館 大ホール", prefecture: "埼玉県", address: "埼玉県さいたま市浦和区高砂3-1-4", coordinates: null },
  hamarikyuAsahiSmall: { id: "hamarikyu-asahi-small-hall", name: "浜離宮朝日ホール 小ホール", prefecture: "東京都", address: "東京都中央区築地5-3-2 朝日新聞東京本社・新館2F", coordinates: null },
  online: { id: "online", name: "オンライン", prefecture: null, address: null, coordinates: null },
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

function verifiedEvent({ endsAt = null, performanceLabel = "", note = "", sourceUrl = null, verifiedAt = DEFAULT_VERIFIED_AT, ...event }) {
  const allCast = (Array.isArray(event.cast) ? event.cast : [event.cast]).filter(Boolean);
  const cast = allCast.filter(isLoveLiveCast);

  return {
    ...event,
    allCast,
    cast,
    series: deriveSeries({ ...event, cast }),
    endsAt,
    performanceLabel,
    note,
    officialUrl: event.officialUrl,
    sourceUrl: sourceUrl || event.officialUrl,
    verifiedAt
  };
}

function septemberEvent(event) {
  return verifiedEvent({ ...event, verifiedAt: SEPTEMBER_VERIFIED_AT });
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

const liellaTaiikusaiUrl = "https://www.lovelive-anime.jp/yuigaoka/live/live_detail.php?p=taiikusai";
const onishiReleaseUrl = "https://columbia.jp/artist-info/onishiaguri/live/";
const natsuChannelUrl = "https://ch.nicovideo.jp/natyaaaaaaan/blomaga/ar2233113";
const liyuuYattekuruUrl = "https://aruarucity.com/event/?act=Detail&e_id=00002399&mode=View";
const nekoTanUrl = "https://apollobay.jp/news/%E3%80%8C%E3%83%8D%E3%82%B3%E3%81%9F%E3%82%93%EF%BC%81%EF%BD%9E%E7%8C%AB%E7%94%BA%E6%80%AA%E7%95%B0%E5%A5%87%E8%AD%9A%EF%BD%9E%E3%80%8D%E9%9B%AA%E5%A4%9C%E5%8F%89%E4%BC%9D%E6%89%BF%E6%AE%BA%E7%8C%AB/";
const nobunagaUrl = "https://hijstage.com/nobunaga2026/";
const kobayashiAkihabaraUrl = "https://kobayashiaika.jp/news_305377/";
const kobayashiNumazuUrl = "https://kobayashiaika.jp/news_305378/";
const kobayashiShiodomeUrl = "https://kobayashiaika.jp/news_305406/";
const kobayashiFreeLiveUrl = "https://kobayashiaika.jp/news_305407/";
const kobayashiNamcoUrl = "https://kobayashiaika.jp/news_305408/";
const kobayashiTowerUrl = "https://kobayashiaika.jp/news_305409/";
const kobayashiBenefitUrl = "https://kobayashiaika.jp/news_305410/";
const ikizuraiUrl = "https://www.lovelive-anime.jp/lovehigh/live/live_detail.php?_id=2ndLIVE";
const onishiUchidaUrl = "https://aruarucity.com/event/?act=Detail&e_id=00002407&mode=View";
const studioAbcUrl = "https://apollobay.jp/news/%E3%80%90%E3%82%B9%E3%82%BF%E3%82%B8%E3%82%AAabc%E3%80%91%E5%85%AC%E9%96%8B%E5%8F%8E%E9%8C%B2%E6%B1%BA%E5%AE%9A%EF%BC%81%EF%BC%81/";
const seiguraUrl = "https://seigura.com/news/174411/";
const happyLuckyUrl = "https://joqr.net/ag/article/181628/";
const kanKanjirouUrl = "https://sunrisetokyo.com/detail/35751/";
const kobayashiYattekuruUrl = "https://aruarucity.com/event/?act=Detail&e_id=00002417&mode=View";
const aidaYattekuruUrl = "https://aruarucity.com/event/?act=Detail&e_id=00002419&mode=View";
const onsenJointUrl = "https://www.onsen.ag/program/ktk";
const kobayashiTalkUrl = "https://kobayashiaika.jp/mob/news/diarKijiShw.php?aff=ROBO004&id=305411&site=AND";
const kobayashiSignUrl = "https://kobayashiaika.jp/mob/news/diarKijiShw.php?aff=ROBO004&id=305412&site=AND";

const liellaCast = [
  "伊達さゆり", "Liyuu", "岬なこ", "ペイトン尚未", "青山なぎさ", "鈴原希実",
  "薮島朱音", "大熊和奏", "絵森彩", "結那", "坂倉花"
];
const ikizuraiCast = [
  "綾咲穂音", "遠藤璃菜", "宮野芹", "藤野こころ", "坂野愛羽",
  "瀬古梨愛", "奥村優季", "天沢朱音", "小戸森穂花", "涼ノ瀬葵音"
];

// 1レコードを1公演・1出演枠として扱います。
const candidateEvents = [
  ...[
    ["20260905-day", "2026-09-05", "昼の部", "13:00", "14:00", [...liellaCast, "相良茉優", "田中ちえ美"]],
    ["20260905-night", "2026-09-05", "夜の部", "17:30", "18:30", [...liellaCast, "相良茉優", "田中ちえ美"]],
    ["20260906-day", "2026-09-06", "昼の部", "13:00", "14:00", [...liellaCast, "斉藤朱夏", "小林愛香"]],
    ["20260906-night", "2026-09-06", "夜の部", "17:30", "18:30", [...liellaCast, "斉藤朱夏", "小林愛香"]]
  ].map(([suffix, date, performanceLabel, doorsAt, startsAt, cast]) => septemberEvent({
    id: `liella-taiikusai-${suffix}`, eventGroupId: "liella-taiikusai-20260905-06", date,
    doorsAt, startsAt, category: "official", title: "ラブライブ！スーパースター!! Liella! 結女体育祭", performanceLabel,
    cast, venue: venues.tokyoGymnasium, officialUrl: liellaTaiikusaiUrl
  })),
  ...[
    ["20260905-talk", "2026-09-05", "13:00", "トーク＆ミニライブ＆お見送り会", venues.animateHallBlack, "https://columbia.jp/artist-info/onishiaguri/live/93691.html"],
    ["20260905-janken", "2026-09-05", "16:00", "あぐぽんじゃんけんぽん大会", venues.animateHallBlack, "https://columbia.jp/artist-info/onishiaguri/live/93691.html"],
    ["20260906-part1", "2026-09-06", "12:00", "あぐぽんじゃんけんぽん大会 第1回", venues.akihabaraGamers, "https://columbia.jp/artist-info/onishiaguri/live/93685.html"],
    ["20260906-part2", "2026-09-06", "15:00", "あぐぽんじゃんけんぽん大会 第2回", venues.akihabaraGamers, "https://columbia.jp/artist-info/onishiaguri/live/93685.html"],
    ["20260906-part3", "2026-09-06", "18:00", "あぐぽんじゃんけんぽん大会 第3回", venues.akihabaraGamers, "https://columbia.jp/artist-info/onishiaguri/live/93685.html"],
    ["20260919-animate", "2026-09-19", "13:00", "あぐぽんじゃんけんぽん大会 アニメイト回", venues.aruaruCity, "https://columbia.jp/artist-info/onishiaguri/live/93694.html"],
    ["20260919-gamers", "2026-09-19", "17:00", "あぐぽんじゃんけんぽん大会 ゲーマーズ回", venues.aruaruCity, "https://columbia.jp/artist-info/onishiaguri/live/93686.html"],
    ["20260927-part1", "2026-09-27", "12:00", "あぐぽんじゃんけんぽん大会 第1回", venues.akihabaraGamers, "https://columbia.jp/artist-info/onishiaguri/live/93687.html"],
    ["20260927-part2", "2026-09-27", "15:00", "あぐぽんじゃんけんぽん大会 第2回", venues.akihabaraGamers, "https://columbia.jp/artist-info/onishiaguri/live/93687.html"],
    ["20260927-part3", "2026-09-27", "18:00", "あぐぽんじゃんけんぽん大会 第3回", venues.akihabaraGamers, "https://columbia.jp/artist-info/onishiaguri/live/93687.html"]
  ].map(([suffix, date, startsAt, performanceLabel, venue, officialUrl]) => septemberEvent({
    id: `onishi-goodbye-lullaby-${suffix}`, eventGroupId: `onishi-goodbye-lullaby-${date.replaceAll("-", "")}`, date,
    doorsAt: null, startsAt, category: "cast", title: "大西亜玖璃 9thシングル『グッバイ・ララバイ』発売記念イベント", performanceLabel,
    cast: ["大西亜玖璃"], venue, officialUrl, sourceUrl: onishiReleaseUrl
  })),
  ...[
    ["day", "昼の部", "12:15", "13:00", ["村上奈津実"]],
    ["night", "夜の部", "17:45", "18:30", ["村上奈津実", "田中ちえ美"]]
  ].map(([suffix, performanceLabel, doorsAt, startsAt, cast]) => septemberEvent({
    id: `natsu-channel7-20260906-${suffix}`, eventGroupId: "natsu-channel7-20260906", date: "2026-09-06",
    doorsAt, startsAt, category: suffix === "night" ? "guest" : "cast", title: "村上奈津実のなっチャンネル なっチャンネルイベント#7", performanceLabel,
    cast, venue: venues.esportsField, officialUrl: natsuChannelUrl
  })),
  ...[
    ["part1", "第1部", "12:00", "12:30"],
    ["part2", "第2部", "16:00", "16:30"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt]) => septemberEvent({
    id: `liyuu-yattekuru-20260913-${suffix}`, eventGroupId: "liyuu-yattekuru-20260913", date: "2026-09-13",
    doorsAt, startsAt, category: "cast", title: "LiyuuがYATTEKURU", performanceLabel,
    cast: ["Liyuu"], venue: venues.aruaruCity, officialUrl: liyuuYattekuruUrl
  })),
  ...[
    ["20260915-1900", "2026-09-15", "19:00", "開幕直前スペシャルイベント", ["鈴原希実", "伊達さゆり", "月音こな", "滝佳保子"]],
    ["20260916-1300", "2026-09-16", "13:00", "9月16日 13:00公演", ["鈴原希実", "鈴木達央", "橘美來", "戸谷菊之介", "緒方恵美", "置鮎龍太郎", "滝佳保子"]],
    ["20260916-1900", "2026-09-16", "19:00", "9月16日 19:00公演", ["伊達さゆり", "鈴木達央", "涼本あきほ", "益山武明", "田所陽向", "阿部敦", "滝佳保子"]],
    ["20260917-1900", "2026-09-17", "19:00", "9月17日公演", ["月音こな", "寺島惇太", "峯田茉優", "宮﨑雅也", "岸尾だいすけ", "増元拓也", "滝佳保子"]],
    ["20260918-1300", "2026-09-18", "13:00", "9月18日 13:00公演", ["月音こな", "保住有哉", "幸村恵理", "日向朔公", "緒方恵美", "山中真尋", "滝佳保子"]],
    ["20260918-1900", "2026-09-18", "19:00", "9月18日 19:00公演", ["月音こな", "保住有哉", "逢田梨香子", "山本和臣", "中澤まさとも", "山中真尋", "滝佳保子"]],
    ["20260919-1230", "2026-09-19", "12:30", "9月19日 12:30公演", ["伊達さゆり", "北村健人", "鈴木みのり", "長岡龍歩", "細貝圭", "神尾晋一郎", "滝佳保子"]],
    ["20260919-1730", "2026-09-19", "17:30", "9月19日 17:30公演", ["鈴原希実", "北村健人", "鈴木みのり", "重松千晴", "細貝圭", "神尾晋一郎", "滝佳保子"]],
    ["20260920-1230", "2026-09-20", "12:30", "9月20日 12:30公演", ["鈴原希実", "浦和希", "内田彩", "市川蒼", "山口智広", "深町寿成", "滝佳保子"]],
    ["20260920-1730", "2026-09-20", "17:30", "9月20日 17:30公演", ["伊達さゆり", "浦和希", "内田彩", "市川蒼", "山口智広", "野上翔", "滝佳保子"]]
  ].map(([suffix, date, startsAt, performanceLabel, cast]) => septemberEvent({
    id: `neko-tan-${suffix}`, eventGroupId: "neko-tan-20260915-20", date,
    doorsAt: null, startsAt, category: "stage", title: "『ネコたん！～猫町怪異奇譚～』雪夜叉伝承殺猫事件", performanceLabel,
    cast, venue: venues.owlSpot, officialUrl: nekoTanUrl
  })),
  ...[
    ["20260917-1800-a", "2026-09-17", "17:30", "18:00", "Aキャスト", ["小泉萌香", "野中ここな"]],
    ["20260918-1300-a", "2026-09-18", "12:30", "13:00", "Aキャスト", ["小泉萌香", "野中ここな"]],
    ["20260918-1800-b", "2026-09-18", "17:30", "18:00", "Bキャスト", ["小泉萌香"]],
    ["20260919-1230-b", "2026-09-19", "12:00", "12:30", "Bキャスト", ["小泉萌香"]],
    ["20260919-1730-a", "2026-09-19", "17:00", "17:30", "Aキャスト", ["小泉萌香", "野中ここな"]],
    ["20260920-1230-a", "2026-09-20", "12:00", "12:30", "Aキャスト", ["小泉萌香", "野中ここな"]],
    ["20260920-1730-b", "2026-09-20", "17:00", "17:30", "Bキャスト", ["小泉萌香"]],
    ["20260921-1230-b", "2026-09-21", "12:00", "12:30", "Bキャスト", ["小泉萌香"]]
  ].map(([suffix, date, doorsAt, startsAt, performanceLabel, cast]) => septemberEvent({
    id: `musical-nobunaga-${suffix}`, eventGroupId: "musical-nobunaga-20260917-21", date,
    doorsAt, startsAt, category: "stage", title: "ミュージカル信長～朧炎ノ刻～", performanceLabel,
    cast, venue: venues.theater1010, officialUrl: nobunagaUrl,
    note: "出演欄はラブライブ！シリーズ関連キャストを掲載。受付・ロビー開場は開演60分前、客席開場は30分前。"
  })),
  ...[
    ["20260905-part1", "2026-09-05", "第1部", "12:30", "13:00", venues.akihabaraGamers, kobayashiAkihabaraUrl],
    ["20260905-part2", "2026-09-05", "第2部", "15:30", "16:00", venues.akihabaraGamers, kobayashiAkihabaraUrl],
    ["20260913-part1", "2026-09-13", "第1部", "12:30", "13:00", venues.lalaportNumazu, kobayashiNumazuUrl],
    ["20260913-part2", "2026-09-13", "第2部", "16:00", "16:30", venues.lalaportNumazu, kobayashiNumazuUrl],
    ["20260916", "2026-09-16", "ミニライブ＆サイン会", "18:30", "19:00", venues.shiodomeUnderground, kobayashiShiodomeUrl],
    ["20260919-part1", "2026-09-19", "第1部", "13:30", "14:00", venues.namcoTokyo, kobayashiNamcoUrl],
    ["20260919-part2", "2026-09-19", "第2部", "16:30", "17:00", venues.namcoTokyo, kobayashiNamcoUrl],
    ["20260920-part1", "2026-09-20", "第1部", "12:00", "12:30", venues.towerRecordsShibuya, kobayashiTowerUrl],
    ["20260920-part2", "2026-09-20", "第2部", "15:00", "15:30", venues.towerRecordsShibuya, kobayashiTowerUrl]
  ].map(([suffix, date, performanceLabel, doorsAt, startsAt, venue, officialUrl]) => septemberEvent({
    id: `kobayashi-blue-magic-${suffix}`, eventGroupId: `kobayashi-blue-magic-${date.replaceAll("-", "")}`, date,
    doorsAt, startsAt, category: "cast", title: "小林愛香『BLUE MAGIC』発売記念イベント", performanceLabel,
    cast: ["小林愛香"], venue, officialUrl
  })),
  septemberEvent({
    id: "kobayashi-blue-magic-20260918", eventGroupId: "kobayashi-blue-magic-release-202609", date: "2026-09-18",
    doorsAt: "17:00", startsAt: "17:30", category: "cast", title: "小林愛香『BLUE MAGIC』発売記念フリーライブ", performanceLabel: "ミニライブ＆サイン会",
    cast: ["小林愛香"], venue: venues.sunshineCityFountain, officialUrl: kobayashiFreeLiveUrl
  }),
  ...[
    ["20260919-day", "2026-09-19", "昼公演 / BAND side", "14:00", "14:45", venues.shinjukuReny],
    ["20260919-night", "2026-09-19", "夜公演 / BAND side", "17:45", "18:30", venues.shinjukuReny],
    ["20260926", "2026-09-26", "新潟公演 / SOLO side", "16:30", "17:00", venues.goldenPigsRed]
  ].map(([suffix, date, performanceLabel, doorsAt, startsAt, venue]) => septemberEvent({
    id: `inami-nonstop-${suffix}`, eventGroupId: "inami-nonstop-tour-2026", date,
    doorsAt, startsAt, category: "cast", title: "伊波杏樹 LIVE TOUR 2026『NONSTOP the 愛愛愛っ!♡』", performanceLabel,
    cast: ["伊波杏樹"], venue, officialUrl: inamiTourUrl
  })),
  ...[
    ["day1", "2026-09-19", "Day.1", "16:00", "17:00", "https://keio-arena.tokyo/schedule/2026/0919_16324.php"],
    ["day2", "2026-09-20", "Day.2", "15:00", "16:00", "https://keio-arena.tokyo/schedule/2026/0920_16325.php"]
  ].map(([suffix, date, performanceLabel, doorsAt, startsAt, sourceUrl]) => septemberEvent({
    id: `ikizurai-2nd-live-${suffix}`, eventGroupId: "ikizurai-2nd-live-20260919-20", date,
    doorsAt, startsAt, category: "official", title: "いきづらい部！2nd LIVE Dou-Da? DOING! ～Reply to L～", performanceLabel,
    cast: ikizuraiCast, venue: venues.keioArena, officialUrl: ikizuraiUrl, sourceUrl
  })),
  ...[
    ["part1", "第1部", "11:30", "12:00"],
    ["part2", "第2部", "15:15", "15:45"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt]) => septemberEvent({
    id: `onishi-uchida-yattekuru-20260920-${suffix}`, eventGroupId: "onishi-uchida-yattekuru-20260920", date: "2026-09-20",
    doorsAt, startsAt, category: "cast", title: "大西亜玖璃と内田秀がYATTEKURU", performanceLabel,
    cast: ["大西亜玖璃", "内田秀"], venue: venues.aruaruCity, officialUrl: onishiUchidaUrl
  })),
  ...[
    ["part1", "第1部", "13:30", "14:00"],
    ["part2", "第2部", "16:30", "17:00"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt]) => septemberEvent({
    id: `studio-abc-20260920-${suffix}`, eventGroupId: "studio-abc-20260920", date: "2026-09-20",
    doorsAt, startsAt, category: "unit", title: "スタジオABC公開収録#1", performanceLabel,
    cast: ["荒井瑠里", "内田将綺", "月音こな"], venue: venues.kiwaTennoz, officialUrl: studioAbcUrl
  })),
  ...[
    ["period1", "1限目", "13:00", "14:00", "15:30"],
    ["period2", "2限目", "16:30", "17:30", "19:00"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt, endsAt]) => septemberEvent({
    id: `seigura-seminar-20260921-${suffix}`, eventGroupId: "seigura-seminar-20260921", date: "2026-09-21",
    doorsAt, startsAt, endsAt, category: "unit", title: "声グラゼミナール2026 夏の特別授業", performanceLabel,
    cast: ["小鹿なお", "坂倉花", "月音こな", "渡瀬結月", "豊田萌絵"], venue: venues.zendenTsurodoHall, officialUrl: seiguraUrl
  })),
  ...[
    ["part1", "第1部", "13:00", "14:00", "15:30", ["葉山風花", "カイロくん"]],
    ["part2", "第2部", "17:00", "18:00", "19:30", ["葉山風花", "岬なこ"]]
  ].map(([suffix, performanceLabel, doorsAt, startsAt, endsAt, cast]) => septemberEvent({
    id: `happy-lucky-20260922-${suffix}`, eventGroupId: "happy-lucky-20260922", date: "2026-09-22",
    doorsAt, startsAt, endsAt, category: suffix === "part2" ? "guest" : "cast", title: "Happy Lucky ～お願い！成就する～", performanceLabel,
    cast, venue: venues.scienceHall, officialUrl: happyLuckyUrl
  })),
  ...[
    ["day", "昼の部", "13:30", "14:30", "16:00", ["菅叶和", "楡井希実"]],
    ["night", "夜の部", "17:00", "18:00", "19:30", ["菅叶和"]]
  ].map(([suffix, performanceLabel, doorsAt, startsAt, endsAt, cast]) => septemberEvent({
    id: `kan-kanjirou-20260926-${suffix}`, eventGroupId: "kan-kanjirou-20260926", date: "2026-09-26",
    doorsAt, startsAt, endsAt, category: suffix === "day" ? "guest" : "cast", title: "菅叶和 かんかんじろう", performanceLabel,
    cast, venue: venues.saitamaHall, officialUrl: kanKanjirouUrl
  })),
  ...[
    ["part1", "第1部", "11:30", "12:00"],
    ["part2", "第2部", "16:30", "17:00"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt]) => septemberEvent({
    id: `kobayashi-yattekuru-20260926-${suffix}`, eventGroupId: "kobayashi-yattekuru-20260926", date: "2026-09-26",
    doorsAt, startsAt, category: "cast", title: "小林愛香がYATTEKURU", performanceLabel,
    cast: ["小林愛香"], venue: venues.aruaruCity, officialUrl: kobayashiYattekuruUrl
  })),
  septemberEvent({
    id: "kobayashi-blue-magic-benefit-20260926", eventGroupId: "kobayashi-blue-magic-20260926", date: "2026-09-26",
    doorsAt: null, startsAt: "14:15", category: "cast", title: "小林愛香『BLUE MAGIC』発売＆YATTEKURU開催記念特典お渡し会",
    cast: ["小林愛香"], venue: venues.aruaruCity, officialUrl: kobayashiBenefitUrl
  }),
  ...[
    ["part1", "第1部", "11:30", "12:00"],
    ["part2", "第2部", "15:15", "15:45"]
  ].map(([suffix, performanceLabel, doorsAt, startsAt]) => septemberEvent({
    id: `aida-yattekuru-20260927-${suffix}`, eventGroupId: "aida-yattekuru-20260927", date: "2026-09-27",
    doorsAt, startsAt, category: "cast", title: "逢田梨香子がYATTEKURU", performanceLabel,
    cast: ["逢田梨香子"], venue: venues.aruaruCity, officialUrl: aidaYattekuruUrl
  })),
  ...[
    ["part1", "第1部 ことこ・こな・はな", "14:00", "14:30", "16:00", ["佐々木琴子", "月音こな", "菱川花菜"]],
    ["part2", "第2部 ことこ・こな・かおり", "17:30", "18:00", "19:30", ["佐々木琴子", "月音こな", "前田佳織里"]]
  ].map(([suffix, performanceLabel, doorsAt, startsAt, endsAt, cast]) => septemberEvent({
    id: `onsen-joint-20260927-${suffix}`, eventGroupId: "onsen-joint-20260927", date: "2026-09-27",
    doorsAt, startsAt, endsAt, category: "unit", title: "音泉合同イベント2026秋", performanceLabel,
    cast, venue: venues.hamarikyuAsahiSmall, officialUrl: onsenJointUrl
  })),
  ...[
    ["part1", "第1部", "12:00", "13:00"],
    ["part2", "第2部", "13:15", "14:15"]
  ].map(([suffix, performanceLabel, startsAt, endsAt]) => septemberEvent({
    id: `kobayashi-online-talk-20260927-${suffix}`, eventGroupId: "kobayashi-online-talk-20260927", date: "2026-09-27",
    doorsAt: null, startsAt, endsAt, category: "cast", title: "小林愛香『BLUE MAGIC』発売記念1対1オンライントーク会", performanceLabel,
    cast: ["小林愛香"], venue: venues.online, officialUrl: kobayashiTalkUrl
  })),
  septemberEvent({
    id: "kobayashi-online-sign-20260927", eventGroupId: "kobayashi-online-sign-20260927", date: "2026-09-27",
    doorsAt: null, startsAt: "15:30", category: "cast", title: "小林愛香『BLUE MAGIC』発売記念インターネットサイン会",
    cast: ["小林愛香"], venue: venues.online, officialUrl: kobayashiSignUrl
  }),
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

// 他作品の出演者だけの枠は掲載対象から外します。シリーズ公式イベントは、
// 登壇キャストの記載がない場合もseries情報があれば残します。
export const events = candidateEvents.filter(event => event.cast.length || event.series.length);
