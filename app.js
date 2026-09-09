const categories = {
  official: {label:"公式", color:"var(--official)"},
  cast:     {label:"キャスト", color:"var(--cast)"},
  unit:     {label:"別ユニット", color:"var(--unit)"},
  stage:    {label:"舞台・朗読", color:"var(--stage)"},
  guest:    {label:"ゲスト出演", color:"var(--guest)"}
};

const events = [
  {id:"e1002", date:"2026-10-02", time:"18:00", category:"official", title:"『Liella!と結ぶプロジェクト』発売記念お渡し会", cast:"Liella! キャスト", venue:"東京都内", note:"MVP用サンプル"},
  {id:"e1003a", date:"2026-10-03", time:"13:30", category:"cast", title:"岬なこのそんなこんなこラジオ！イベント 昼", cast:"岬なこ", venue:"科学技術館サイエンスホール", note:"2公演想定"},
  {id:"e1003b", date:"2026-10-03", time:"17:00", category:"cast", title:"野中ここなのノナカの野望 1周年スペシャルイベント", cast:"野中ここな", venue:"出島メッセ長崎", note:"地方イベント表示テスト"},
  {id:"e1004a", date:"2026-10-04", time:"14:00", category:"cast", title:"薮島朱音がYATTEKURU", cast:"薮島朱音", venue:"あるあるCity", note:""},
  {id:"e1004b", date:"2026-10-04", time:"18:00", category:"guest", title:"もえ・つむぎ・きゅーとあぐれっしょんっ！", cast:"岬なこ（ゲスト）", venue:"科学技術館サイエンスホール", note:"ゲスト出演カテゴリのテスト"},
  {id:"e1009", date:"2026-10-09", time:"18:30", category:"official", title:"『Liella!と結ぶプロジェクト』発売記念お渡し会", cast:"Liella! キャスト", venue:"東京都内", note:""},
  {id:"e1010a", date:"2026-10-10", time:"14:00", category:"official", title:"ラブライブ！フェス 前夜祭 FILM LIVE Day.1 昼", cast:"シリーズ合同", venue:"Shibuya LOVEZ", note:""},
  {id:"e1010b", date:"2026-10-10", time:"18:30", category:"cast", title:"坂倉 花がYATTEKURU", cast:"坂倉花", venue:"あるあるCity", note:""},
  {id:"e1011", date:"2026-10-11", time:"17:00", category:"official", title:"ラブライブ！フェス 前夜祭 FILM LIVE Day.2", cast:"シリーズ合同", venue:"Shibuya LOVEZ", note:""},
  {id:"e1012", date:"2026-10-12", time:"15:00", category:"cast", title:"相良茉優と鬼頭明里がYATTEKURU", cast:"相良茉優、鬼頭明里", venue:"あるあるCity", note:""},
  {id:"e1014", date:"2026-10-14", time:"19:00", category:"cast", title:"伊波杏樹 LIVE TOUR 2026 東京", cast:"伊波杏樹", venue:"東京キネマ倶楽部", note:"ソロ音楽活動もキャストカテゴリに含める案"},
  {id:"e1017a", date:"2026-10-17", time:"13:00", category:"guest", title:"キャラミクス トークイベント vol.2", cast:"月音こな、ペイトン尚未 ほか", venue:"高千穂大学", note:"同日複数イベントの確認用"},
  {id:"e1017b", date:"2026-10-17", time:"18:00", category:"unit", title:"番組合同イベント", cast:"小林愛香、野中ここな", venue:"恵比寿", note:"別ユニット・合同企画の例"},
  {id:"e1020", date:"2026-10-20", time:"18:30", category:"stage", title:"名作リーディングシアター『シャーロック・ホームズ』", cast:"月音こな ほか", venue:"博品館劇場", note:"朗読劇カテゴリ"},
  {id:"e1024a", date:"2026-10-24", time:"14:00", category:"cast", title:"花宮初奈 誕生日イベント", cast:"花宮初奈", venue:"THEATER MILANO-Za", note:""},
  {id:"e1024b", date:"2026-10-24", time:"18:00", category:"cast", title:"こにゃいと本気ミーティング2", cast:"月音こな、野中ここな", venue:"幕張", note:""},
  {id:"e1025", date:"2026-10-25", time:"14:00", category:"stage", title:"リーディングシアター『シャーロック・ホームズ』", cast:"伊波杏樹、月音こな ほか", venue:"博品館劇場", note:""},
  {id:"e1031", date:"2026-10-31", time:"17:00", category:"stage", title:"朗読と歌とおしゃべりをきみと", cast:"菅叶和", venue:"杉並区勤労福祉会館", note:""}
];

const statusDef = {
  going:{label:"○ 行く", short:"○", cls:"going"},
  maybe:{label:"△ 迷い", short:"△", cls:"maybe"},
  no:{label:"× 行かない", short:"×", cls:"no"},
  unset:{label:"－ 未設定", short:"－", cls:"unset"}
};

let viewDate = new Date(2026, 9, 1);
let activeCategories = new Set(Object.keys(categories));
let selectedEventId = null;

function loadStatus(id){
  return localStorage.getItem("lovecale:"+id) || "unset";
}
function saveStatus(id,status){
  localStorage.setItem("lovecale:"+id,status);
  render();
  if(selectedEventId===id) openModal(id);
}

function ymd(d){
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
}

function renderFilters(){
  const el = document.getElementById("filters");
  el.innerHTML = "";
  Object.entries(categories).forEach(([key,c])=>{
    const label = document.createElement("label");
    label.className = "filter";
    label.innerHTML = `<input type="checkbox" ${activeCategories.has(key)?"checked":""} data-cat="${key}">
      <span class="legend-dot" style="background:${c.color}"></span>${c.label}`;
    el.appendChild(label);
  });
  el.querySelectorAll("input").forEach(i=>i.addEventListener("change",e=>{
    const key=e.target.dataset.cat;
    e.target.checked ? activeCategories.add(key) : activeCategories.delete(key);
    render();
  }));
}

function currentMonthEvents(){
  const y=viewDate.getFullYear(), m=viewDate.getMonth()+1;
  return events.filter(e=>{
    const [ey,em]=e.date.split("-").map(Number);
    return ey===y && em===m && activeCategories.has(e.category);
  }).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
}

function renderCalendar(){
  const grid=document.getElementById("calendarGrid");
  grid.innerHTML="";
  const y=viewDate.getFullYear(), m=viewDate.getMonth();
  document.getElementById("monthLabel").textContent=`${y}年 ${m+1}月`;

  const first=new Date(y,m,1);
  const start=new Date(y,m,1-first.getDay());
  const today=new Date();
  const byDate={};
  currentMonthEvents().forEach(e=>(byDate[e.date] ||= []).push(e));

  for(let i=0;i<42;i++){
    const d=new Date(start);
    d.setDate(start.getDate()+i);
    const key=ymd(d);
    const cell=document.createElement("div");
    cell.className="day"+(d.getMonth()!==m?" outside":"");
    if(key===ymd(today)) cell.classList.add("today");
    cell.innerHTML=`<div class="date">${d.getDate()}</div><div class="events"></div>`;
    const box=cell.querySelector(".events");

    (byDate[key]||[]).forEach(e=>{
      const st=loadStatus(e.id);
      const btn=document.createElement("button");
      btn.className="event";
      btn.style.borderLeftColor=categories[e.category].color;
      btn.innerHTML=`
        <div class="event-title">${e.title}</div>
        <div class="event-meta">
          <span>${e.time}</span>
          <span class="status-badge">${statusDef[st].short}</span>
        </div>`;
      btn.addEventListener("click",()=>openModal(e.id));
      box.appendChild(btn);
    });
    grid.appendChild(cell);
  }
}

function renderList(){
  const list=document.getElementById("eventList");
  const data=currentMonthEvents();
  const counts={going:0,maybe:0,no:0,unset:0};
  data.forEach(e=>counts[loadStatus(e.id)]++);
  document.getElementById("summary").textContent=
    `${data.length}件 / 行く ${counts.going}・迷い ${counts.maybe}`;

  if(!data.length){
    list.innerHTML='<div class="empty">表示するイベントがありません。</div>';
    return;
  }
  list.innerHTML="";
  data.forEach(e=>{
    const st=loadStatus(e.id);
    const [yy,mm,dd]=e.date.split("-");
    const c=categories[e.category];
    const card=document.createElement("div");
    card.className="list-card";
    card.innerHTML=`
      <div class="list-top">
        <div class="date-chip">${Number(mm)}/${Number(dd)} ${e.time}</div>
        <div class="category-chip" style="border-left:4px solid ${c.color}">${c.label}</div>
      </div>
      <h3>${e.title}</h3>
      <div class="small">${e.cast}<br>${e.venue}</div>
      <div class="status-row">
        ${Object.entries(statusDef).map(([key,s])=>
          `<button class="status-btn ${s.cls} ${st===key?"active":""}" data-status="${key}">${s.label}</button>`
        ).join("")}
      </div>`;
    card.querySelectorAll(".status-btn").forEach(b=>b.addEventListener("click",()=>saveStatus(e.id,b.dataset.status)));
    card.querySelector("h3").style.cursor="pointer";
    card.querySelector("h3").addEventListener("click",()=>openModal(e.id));
    list.appendChild(card);
  });
}

function render(){
  renderFilters();
  renderCalendar();
  renderList();
}

function openModal(id){
  const e=events.find(x=>x.id===id);
  if(!e) return;
  selectedEventId=id;
  const c=categories[e.category];
  document.getElementById("modalCategory").innerHTML=`<span class="category-chip" style="border-left:4px solid ${c.color}">${c.label}</span>`;
  document.getElementById("modalTitle").textContent=e.title;
  document.getElementById("modalDate").textContent=`${e.date} ${e.time}`;
  document.getElementById("modalCast").textContent=e.cast;
  document.getElementById("modalVenue").textContent=e.venue;
  document.getElementById("modalNote").textContent=e.note || "－";
  const st=loadStatus(id);
  document.getElementById("modalStatus").innerHTML=Object.entries(statusDef).map(([key,s])=>
    `<button class="status-btn ${s.cls} ${st===key?"active":""}" data-status="${key}">${s.label}</button>`
  ).join("");
  document.querySelectorAll("#modalStatus .status-btn").forEach(b=>b.addEventListener("click",()=>saveStatus(id,b.dataset.status)));
  document.getElementById("modalBackdrop").classList.add("open");
}

function closeModal(){
  document.getElementById("modalBackdrop").classList.remove("open");
  selectedEventId=null;
}

document.getElementById("prevMonth").addEventListener("click",()=>{
  viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()-1,1);render();
});
document.getElementById("nextMonth").addEventListener("click",()=>{
  viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,1);render();
});
document.getElementById("modalClose").addEventListener("click",closeModal);
document.getElementById("modalBackdrop").addEventListener("click",e=>{
  if(e.target.id==="modalBackdrop") closeModal();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape") closeModal();});

render();
