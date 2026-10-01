"use strict";
/* Monmusu TD X wiki: one static page over data/wiki.json (py -m wikitool export) and img/ (images).
   The title is a menu: Units / Sub skills / Dungeons / Summons (later) / Game formulas; each mode
   has its own left list, middle page and filters (picks are kept per mode).
   Units: left = search, sort and the unit's own data under the funnel button (rarity, element,
   class -> weapon, attack, placement, movement, features, collab, race); middle = the unit page;
   right = the Advanced filter (session 9, FILTERS.md): search + Source, tabs Allies | Attack | ETC
   over one record per effect of every skill, race trait, weapon and awakening node (unit.fx).
   Sub skills keep What / Condition / Who ("works for"). Inside a group OR, across groups AND;
   options that would leave nothing are greyed. Each side's clear button clears only its side. */

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private window */ } },
};

let W = null;                       // wiki.json
const state = { lang: store.get("lang", "en"), picksBy: {}, q: "", sel: null, skin: null,
  mode: "units", ssel: null,                     // current mode, selected sub skill
  rank: { base: null, cls: null, rar: null, el: null, sort: "atk", dir: -1, open: null },   // Percentile page: picks, sort, open list
  tier: 5, lv: 5, slv: {}, tab: "details",              // class tier and skill level sliders, unit page tab
  fsec: store.get("fsec", "unit"), page: null,   // filter tab; page = "formulas" or null
  showEtc: store.get("showEtc", false),          // sub skill list: show the Etc. tab (owner: off)
  sort: store.get("sort", "release"), sortDir: store.get("sortDir", "desc") };   // unit list order

const UI = {
  en: {
    filter: "Advanced filter", clear: "Clear advanced filter", search: "Search name, title, species…", none: "No unit matches.", noneSub: "No sub skill matches.",
    pick: "Pick a unit on the left.", skill: "Skill", skills: "Skills", race: "Race trait", act: "ACT", weapon: "Personal weapon",
    cls: "Class", awakening: "Awakening", profile: "Profile", cd: "Cooldown", dur: "Duration", cost: "Cost", lv: "Lv",
    deploy: "Deploy cost", redeploy: "Redeploy", sec: "s", move: "Movement", traits: "Traits", species: "Species",
    awBonus: "Awakened", awTip: "With all 5 awakening nodes unlocked", nawTip: "Before all 5 awakening nodes are unlocked", levels: "levels", block: "Block",
    range: "Range", targets: "Targets", illustrator: "Illustrator", cv: "CV", curse: "Curse", oc: "OC skill",
    self: "on self", allies: "on allies", unknown: "Unknown", nothing: "None",
    buff: "Buff", debuff: "Debuff", ailment: "Ailment", immunity: "Immunity", mechanic: "Mechanic", trait: "Trait",
    tg_stat: "Stat up", tg_damage: "Damage", tg_survival: "Survival", tg_healing: "Healing", tg_debuff: "Debuff",
    tg_ailment: "Ailment", tg_cost: "Cost & time", tg_field: "Battlefield", tg_special: "Special",
    tg_uptime: "Uptime", tg_skillact: "Skill & ACT", tg_combat: "Combat", tg_blockmove: "Blocking & moving",
    tg_situation: "Situation", tg_enemy: "Enemy", tg_team: "Team", tg_drawback: "Drawback",
    h_target: "Target", sc_self: "Self", sc_allies: "Allies",
    whoSec: "Who", whatSec: "What", 
    
    who: "Who", whoNone: "All allies", whoNoneTip: "Buffs every ally, not only one element / race / class", traitSec: "Trait",
    condSec: "Condition", pctTip: "% based", flatTip: "Fixed amount",
    wk_only: "Required", wk_bonus: "Bonus", wk_not: "Not for", wk_allies: "Target",
    subDetailSec: "Sub skill details", h_classWeapon: "Class · Weapon", h_elementRace: "Element · Race",
    h_condition: "Applies as",
    wkindTip_only: "Works only when equipped by these units", wkindTip_bonus: "Extra effect when equipped by these units",
    wkindTip_not: "No effect on these units", wkindTip_allies: "Buffs allies of this kind",
    welement: "Element", wtrait: "Race trait", wrarity: "Rarity", worksFor: "Works for",
    fly: "Flying", warp: "Warp", rush: "Rush", skills_2: "2 skills", pweapon: "Personal weapon", oc_skill: "OC skill",
    act_boost: "ACT boost (race trait / weapon)",
    scopeSelf: "Buffs on self", scopeAllies: "Buffs on allies", scopeEnemy: "Debuffs and ailments on enemies", sc_enemy: "Enemy",
    tier: "Tier",
    detailsTab: "Details", traitsSec: "Traits", clsTrait: "Class trait", artTab: "Art", artNone: "No full art yet.",
    unitSec: "Unit", tagsSec: "Tags", collab: "Collab", formulas: "Game formulas", ranking: "Percentile", rankNote: "Percentiles among the units shown. Click Class, Subclass, Rarity or Element to filter, a stat to sort, a row to open the unit.", rankClear: "Clear", unit: "Unit", deployTip: "Deploy cost (class 5)",
    subclass: "Subclass", stats: "Stats", hp: "HP", atk: "ATK", def: "DEF", mdef: "MDEF",
    crit: "Crit chance", critDmg: "Crit damage", normal: "Normal", statTip: "Lv 1 → Lv {max} (class {tier}, no equipment)",
    capTip: "cap {cap}", critDmgTip: "on top of normal damage (150% in total at +50%)",
    hit_Physical: "Physical", hit_Magic: "Magic", hit_Ignore: "True damage", hit_Heal: "Heal", hit_None: "No attack",
    hitTip_Physical: "Physical attacks (reduced by DEF)", hitTip_Magic: "Magic attacks (reduced by MDEF)",
    hitTip_Ignore: "Piercing attacks (ignore DEF and MDEF)", hitTip_Heal: "Heals allies instead of attacking",
    pl_Near: "Melee", pl_Far: "Ranged", pl_All: "All",
    plTip_Near: "Placed on melee tiles; attacks the enemies she blocks", plTip_Far: "Placed on ranged tiles; hits ground and flying enemies in range",
    plTip_All: "Placed on melee or ranged tiles; hits ground and flying enemies in range",
    mv_Ground: "Ground", mv_Fly: "Flying", mv_Warp: "Warp", mv_Rush: "Rush",
    mvTip_Ground: "Moves on the ground (warp and rush units too)", mvTip_Fly: "Flies (can't block)", mvTip_Warp: "Warps when moving", mvTip_Rush: "Rushes when moving",
    attack: "Attack",
    fxAlliesSec: "Allies", fxAttackSec: "Attack", fxSkillSec: "ETC", fxAlliesSecTip: "Buffs, protection and heals on allies and on herself",
    fxAttackSecTip: "How she attacks and what it does to enemies: shape, damage, debuffs, ailments", fxSkillSecTip: "The skill itself, the battlefield, cost and time, tactics",
    fx_a_shape: "Attack shape", fx_a_change: "Attack change", fx_a_dmg: "Damage", fx_k_skill: "Skill", fx_k_field: "Battlefield",
    fx_k_cost: "Cost & time", fx_k_tactics: "Tactics",
    ak_gauge: "gauge (build-up)", ak_chance: "chance", ak_always: "always lands", failv: "Value", failvTip: "Pick an ailment first",
    ar_b1: "<30", ar_b30: "30–49", ar_b50: "50–79", ar_b80: "80–99", ar_b100: "100",
    arTip_b1: "low", arTip_b30: "medium", arTip_b50: "large", arTip_b80: "very large", arTip_b100: "fills the gauge in one hit",
    ar_c1: "≤20%", ar_c21: "21–50%", ar_c51: "51–99%", ar_c100: "100%",
    ps_s120: "Poison", ps_s190: "Deadly", ps_s280: "Super", psTip: "damage every 3 s", psHead: "strength", psDmg: "dmg", buildUp: "build-up", chance: "chance",
    fxTileTo: "Tile becomes", fxWeatherTo: "Weather becomes", trueDmg: "true",
    
    fxSearch: "Search skill / trait / weapon text…", fxSource: "Source", fs_skill: "Active skill", fs_trait: "Trait", fs_weapon: "Weapon",
    fsTip_skill: "Active skill 1 / 2", fsTip_trait: "Race trait", fsTip_weapon: "Personal weapon",
    fs_awaken: "Awakening", fsTip_awaken: "Awakening nodes (not the flat stat ones: those are in Stats)",
    headTrait: "race trait", headWeapon: "personal weapon", headAwaken: "awakening", redeployMax: "only the biggest cut counts",
    flyTrait: "Flies (race trait)",
    fx_t_atk: "ATK buff", fx_t_def: "DEF buff", fx_t_surv: "Survival", fx_t_heal: "Heal", fx_t_special: "Utility",
    fx_t_trans: "Attack type", fx_t_dmg: "Damage", fx_t_debuff: "Debuff", fx_t_ail: "Ailment",
    aspd: "Attack speed", weaponType: "Weapon", type: "Type", stv_max: "Lv. Max", stv_lv1: "Lv. 1",
    stvTipMax: "Class 5 ({cls}), Lv {max}, all awakening; no equipment, sub skills or personal weapon",
    stvTip1: "Class 1 ({cls}), Lv 1, no awakening", compareWith: "Compare with", allUnits: "All units", sameBase: "Same main class", sameClass: "Same subclass", sameRarity: "Same rarity", pctTip: "Higher than or equal to {p}% of the other {n} units", rankTip: "Rank among the units compared", flyBlockTip: "Flying units can't block", hiddenTip: "The value in the game's data (the text only says it in words)", afterAwaken: "after awakening", sortBy: "Sort", sort_release: "Release", sort_name: "Name", sort_class: "Class", sortAsc: "Ascending", sortDesc: "Descending", costShort: "Cost", moveShort: "Move",
    units: "Units", subskills: "Sub skills", summons: "Summons", soon: "later", subSec: "Sub skill",
    ultimate: "Ultimate", shop: "Sold in the shop", fromRecipe: "Made from a recipe",
    catAttack: "Attack", catDefense: "Defense", catSupport: "Support", family: "Family",
    recipe: "Made from", usedIn: "Used to make", pickSub: "Pick a sub skill on the left.",
    summonsText: "Summons (tokens) will come later.", searchSub: "Search sub skills…",
    dungeons: "Dungeons", jpBox: "In game (Japanese)", jpHint: "find it in game under this group, by this name",
    howGet: "How to get", k_dungeon: "Dungeon", k_clear: "First clear", k_highlevel: "High-level reward",
    k_mission: "Mission", k_shop: "Shop", k_login: "Login bonus", k_pass: "Bonus pass", k_sugoroku: "Sugoroku",
    k_serial: "Serial code", k_recipe: "Crafting", noSource: "Not found in the game data (probably gacha or an event reward).",
    featured: "featured", once: "once", always: "Always open", openUntil: "Open until {d}", opensAt: "Opens {d}",
    closedSince: "Closed since {d}", unlock: "Unlocks after", key: "Key", keyPremium: "Premium key", keyNormal: "Normal key",
    prizes: "Prizes", afterOnce: "After the once-only prizes are taken", weekdays: "Days", everyDay: "every day",
    t_Normal: "Normal", t_Premium: "Premium", t_HighPremium: "H. Premium", day: "day", tier: "tier", odds: "odds",
    moreN: "and {n} more", pickDungeon: "Pick a dungeon on the left.", yen: "¥{p}", gmedal: "{p} gacha medals",
    eventpt: "{p} event points", friendpt: "{p} friend points", q_BossChallenge: "Boss challenge", q_Event: "Event",
    q_Secret: "Secret quest", q_SpecialChallenge: "Special challenge", q_StoryNormal: "Story", q_Daily: "Daily",
    materialFrom: "from", untranslated: "(Japanese, not translated yet)",
    requiredFor: "Required for", reqUnit: "Required", ownUnit: "own this unit to unlock", recLevel: "Recommended level",
    status: "Status", openSub: "open", scene: "Unlocked scene",
    drops: "Drops", showRecipe: "show recipe", hideRecipe: "hide recipe", exchange: "Exchange shop", paid: "Paid pack",
    st_drop: "Drop (dungeon)", st_craft: "Crafted", st_boss: "Boss challenge",
    st_quest: "Quest, mission, exchange shop (in-game currency)", st_etc: "Etc. (packs, bonus pass, login, serial, unknown)",
    g_hp: "H. Premium only", g_p: "Premium only", g_drest: "Other dungeons", g_deepm: "Deep dungeon · floor challenge",
    g_deeps: "Deep dungeon · ★ reward", g_bossm: "Boss challenge · main story", g_bosse: "Boss challenge · event", g_event: "Event",
    g_secret: "Monster Girl's Secret", g_quest: "Other quest", g_mission: "Mission",
    g_exchange: "Exchange shop", g_paid: "Paid pack · bonus pass", g_misc: "Login · serial", g_unknown: "Unknown",
    anyOf: "Any {r} sub skill", anyHint: "any sub skill of this rarity (e.g. a spare one)",
    showJp: "Show in JP", inJp: "In JP", showEtc: "Show Etc.", storyBoss: "Story boss", eventBoss: "Event boss (limited time)", drop: "Drop", questRow: "Quest", missionRow: "Mission", otherRow: "Other",
    deepDungeon: "Deep dungeon", totalStars: "total ★{n}", nShop: "{n} items", otherWays: "Other ways ({n})", rewards: "Rewards", noDrop: "no drop", bossLv: "Boss", recipeUnlock: "Recipe unlock", contents: "Contents", category: "Category",
  },
  ja: {
    filter: "詳細フィルター", clear: "詳細フィルターをクリア", search: "名前・称号・種族…", none: "該当なし", noneSub: "該当なし",
    pick: "左からユニットを選択", skill: "スキル", skills: "スキル", race: "種族特性", act: "ACT", weapon: "専用武器",
    cls: "クラス", awakening: "潜在覚醒", profile: "プロフィール", cd: "再使用", dur: "効果時間", cost: "コスト", lv: "Lv",
    deploy: "出撃コスト", redeploy: "再出撃", sec: "秒", move: "移動", traits: "特性", species: "種族",
    awBonus: "覚醒", awTip: "潜在覚醒5つすべて開放後", nawTip: "潜在覚醒5つすべて開放前", levels: "段階", block: "ブロック", range: "射程", targets: "対象数",
    illustrator: "イラスト", cv: "CV", curse: "呪い", oc: "OCスキル", self: "自身", allies: "味方", unknown: "不明", nothing: "なし",
    buff: "バフ", debuff: "デバフ", ailment: "状態異常", immunity: "無効", mechanic: "特殊", trait: "特性",
    tg_stat: "能力上昇", tg_damage: "ダメージ", tg_survival: "生存", tg_healing: "回復", tg_debuff: "デバフ",
    tg_ailment: "状態異常", tg_cost: "コスト・時間", tg_field: "戦場", tg_special: "特殊",
    tg_uptime: "持続", tg_skillact: "スキル・ACT", tg_combat: "戦闘", tg_blockmove: "ブロック・移動",
    tg_situation: "状況", tg_enemy: "敵", tg_team: "編成", tg_drawback: "デメリット",
    h_target: "対象", sc_self: "自身", sc_allies: "味方",
    whoSec: "対象", whatSec: "効果", 
    
    who: "対象", whoNone: "味方全員", whoNoneTip: "属性・種族・クラスの限定なしで味方を強化", traitSec: "特性",
    condSec: "条件", pctTip: "割合", flatTip: "固定値",
    wk_only: "必須", wk_bonus: "追加効果", wk_not: "対象外", wk_allies: "対象",
    subDetailSec: "サブスキル詳細", h_classWeapon: "クラス · 武器", h_elementRace: "属性 · 種族",
    h_condition: "適用",
    wkindTip_only: "このユニットのみ有効", wkindTip_bonus: "このユニットに追加効果",
    wkindTip_not: "このユニットには効果なし", wkindTip_allies: "この味方を強化",
    welement: "属性", wtrait: "種族特性", wrarity: "レアリティ", worksFor: "対象",
    fly: "飛行", warp: "ワープ", rush: "突進", skills_2: "スキル2つ", pweapon: "専用武器", oc_skill: "OCスキル",
    act_boost: "ACT強化", scopeSelf: "自身へのバフ", scopeAllies: "味方へのバフ", scopeEnemy: "敵へのデバフ・状態異常", sc_enemy: "敵",
    tier: "段階",
    detailsTab: "詳細", traitsSec: "特性", clsTrait: "クラス特性", artTab: "イラスト", artNone: "イラストはまだありません。",
    unitSec: "ユニット", tagsSec: "タグ", collab: "コラボ", formulas: "ゲームの計算式", ranking: "パーセンタイル", rankNote: "表示中のユニットの中でのパーセンタイル。クラス・サブクラス・レアリティ・属性をクリックで絞り込み、ステータスで並べ替え、行でユニットへ。", rankClear: "クリア", unit: "ユニット", deployTip: "出撃コスト（クラス5）",
    subclass: "サブクラス", stats: "ステータス", hp: "HP", atk: "攻撃力", def: "物理防御", mdef: "魔法防御",
    crit: "クリティカル率", critDmg: "クリティカルダメージ", normal: "通常", statTip: "Lv1 → Lv{max}（クラス{tier}、装備なし）",
    capTip: "上限{cap}", critDmgTip: "通常ダメージに上乗せ（+50%で合計150%）",
    hit_Physical: "物理", hit_Magic: "魔法", hit_Ignore: "貫通", hit_Heal: "回復", hit_None: "攻撃なし",
    hitTip_Physical: "物理攻撃（物理防御で軽減）", hitTip_Magic: "魔法攻撃（魔法防御で軽減）", hitTip_Ignore: "貫通攻撃（防御無視）", hitTip_Heal: "攻撃の代わりに回復",
    pl_Near: "近接", pl_Far: "遠隔", pl_All: "遠近距離",
    plTip_Near: "近接マスに配置、ブロックした敵を攻撃", plTip_Far: "遠隔マスに配置、地上と飛行の敵を攻撃", plTip_All: "近接・遠隔マスに配置、地上と飛行の敵を攻撃",
    mv_Ground: "地上", mv_Fly: "飛行", mv_Warp: "ワープ", mv_Rush: "突進",
    mvTip_Ground: "地上を移動（ワープ・突進も含む）", mvTip_Fly: "飛行（ブロック不可）", mvTip_Warp: "ワープで移動", mvTip_Rush: "突進で移動",
    attack: "攻撃",
    aspd: "攻撃速度", weaponType: "武器種", type: "タイプ", stv_max: "Lv.最大", stv_lv1: "Lv.1",
    stvTipMax: "クラス5（{cls}）、Lv{max}、潜在覚醒すべて。装備・サブスキル・専用武器なし",
    stvTip1: "クラス1（{cls}）、Lv1、潜在覚醒なし", compareWith: "比較対象", allUnits: "全ユニット", sameBase: "同じメインクラス", sameClass: "同じサブクラス", sameRarity: "同じレアリティ", pctTip: "他の{n}ユニットのうち{p}%以上を上回る（同値を含む）", rankTip: "比較対象の中での順位", flyBlockTip: "飛行ユニットはブロックできない", hiddenTip: "ゲームデータ上の値（テキストは言葉のみ）", afterAwaken: "潜在覚醒後", sortBy: "並び替え", sort_release: "実装順", sort_name: "名前", sort_class: "クラス", sortAsc: "昇順", sortDesc: "降順", costShort: "コスト", moveShort: "移動",
    units: "ユニット", subskills: "サブスキル", summons: "召喚", soon: "準備中", subSec: "サブスキル",
    ultimate: "究極", shop: "ショップで購入可", fromRecipe: "レシピで作成", catAttack: "攻撃",
    catDefense: "防御", catSupport: "支援", family: "系統", recipe: "素材", usedIn: "作成先",
    pickSub: "左からサブスキルを選択", searchSub: "サブスキル名…",
    dungeons: "ダンジョン", howGet: "入手方法", k_dungeon: "ダンジョン", k_clear: "初回クリア", k_highlevel: "高難度報酬",
    k_mission: "ミッション", k_shop: "ショップ", k_login: "ログインボーナス", k_pass: "ボーナスパス", k_sugoroku: "すごろく",
    k_serial: "シリアルコード", k_recipe: "合成", noSource: "ゲームデータに入手先なし（ガチャ・イベント報酬など）",
    featured: "ピックアップ", once: "1回限り", always: "常設", openUntil: "{d}まで開放", opensAt: "{d}開放",
    closedSince: "{d}終了", unlock: "開放条件", key: "鍵", keyPremium: "プレミアムの鍵", keyNormal: "ノーマルの鍵",
    prizes: "報酬", afterOnce: "1回限りの報酬を獲得後", weekdays: "曜日", everyDay: "毎日",
    t_Normal: "ノーマル", t_Premium: "プレミアム", t_HighPremium: "上級プレミアム", day: "日目", tier: "段階", odds: "確率",
    moreN: "他{n}件", pickDungeon: "左からダンジョンを選択", yen: "{p}円", gmedal: "ガチャメダル{p}", eventpt: "イベントpt {p}",
    friendpt: "フレンドpt {p}", q_BossChallenge: "ボスチャレンジ", q_Event: "イベント", q_Secret: "ヒミツ", q_SpecialChallenge: "スペシャルチャレンジ",
    q_StoryNormal: "ストーリー", q_Daily: "デイリー", materialFrom: "入手", untranslated: "",
    requiredFor: "合成先", reqUnit: "必要", ownUnit: "所持で開放", recLevel: "推奨レベル", status: "開放", openSub: "開く", scene: "開放シーン",
    drops: "ドロップ", showRecipe: "レシピを表示", hideRecipe: "閉じる", exchange: "交換所", paid: "有償パック",
    st_drop: "ドロップ", st_craft: "合成", st_boss: "ボスチャレンジ", st_quest: "クエスト・ミッション・交換所", st_etc: "その他",
    g_hp: "上級プレミアムのみ", g_p: "プレミアムのみ", g_drest: "その他のダンジョン", g_deepm: "大迷宮 · 階層チャレンジ",
    g_deeps: "大迷宮 · ★報酬", g_bossm: "ボスチャレンジ · メインストーリー", g_bosse: "ボスチャレンジ · イベント", g_event: "イベント",
    g_secret: "モンスター娘のひみつ", g_quest: "その他のクエスト", g_mission: "ミッション",
    g_exchange: "交換所", g_paid: "有償パック・パス", g_misc: "ログイン・シリアル", g_unknown: "不明",
    anyOf: "{r}のサブスキル", anyHint: "このレアリティなら何でも可",
    showJp: "日本語", inJp: "日本語", showEtc: "その他を表示", storyBoss: "メインストーリーのボス", eventBoss: "イベントボス（期間限定）", drop: "ドロップ", questRow: "クエスト", missionRow: "ミッション", otherRow: "その他",
    deepDungeon: "大迷宮", totalStars: "総獲得★{n}", nShop: "{n}件", otherWays: "その他（{n}）", rewards: "報酬", noDrop: "ドロップなし", bossLv: "ボス", recipeUnlock: "レシピ（石板）", summonsText: "召喚（トークン）は準備中", contents: "目次", category: "分類",
  },
};
const ui = k => (UI[state.lang] || UI.en)[k] ?? UI.en[k] ?? k;
const isJa = () => state.lang === "ja";
function tx(key) { const t = W.text[key]; return t ? (isJa() ? t[0] : (t[1] || t[0])) : ""; }
function term(group, ja) { if (ja == null) return ""; return isJa() ? ja : ((W.terms[group] || {})[ja] || ja); }
/* tag groups come from the data (lookups.tagGroups): WHAT = the end result, CONDITION = when / how */
const whatCats = () => W.lookups.tagGroups?.what || [];
const condCats = () => W.lookups.tagGroups?.condition || [];
const STAT = { attack: ["ATK", "攻撃力"], hp: ["HP", "HP"], defense: ["DEF", "物理防御"], mdefense: ["MDEF", "魔法防御"] };

/* ---------------- icons drawn in the page ---------------- */
const SVG = {
  skills_2: '<rect class="s" x="3" y="6" width="12" height="14" rx="2"/><path class="s" d="M8 3h11a2 2 0 0 1 2 2v12"/><text x="6" y="16.5">2</text>',
  pweapon: '<path class="s" d="M20 4l-9.5 9.5M20 4h-4.5M20 4v4.5M8 13l3 3M6.5 15.5l2 2L5 21l-2-2z"/>',
  oc_skill: '<rect class="s" x="2" y="6" width="20" height="12" rx="6"/><text x="5.4" y="15.3">OC</text>',
  act_boost: '<rect class="s" x="1.5" y="8" width="16" height="10" rx="3"/><text x="3" y="15.8" style="font-size:7px">ACT</text><path class="s" d="M20 3v8M17 6l3-3 3 3"/>',
};
Object.assign(SVG, {
  recipe: '<path class="s" d="M6 3h9l3 3v15H6zM9 10h6M9 14h6M9 18h4"/>',
  fx: '<path class="s" d="M15.5 4c-2.4 0-3.1 1.2-3.6 3.6l-2.2 10.8c-.5 2.4-1.2 3.6-3.6 3.6M7.5 10h8.5M14 13l4.5 6M18.5 13L14 19"/>',
  unitsic: '<circle class="s" cx="12" cy="8" r="4"/><path class="s" d="M4 21c0-4.5 3.6-7 8-7s8 2.5 8 7"/>',
  summonic: '<path class="s" d="M12 3l2.2 5 5.3.5-4 3.6 1.2 5.3L12 14.7 7.3 17.4l1.2-5.3-4-3.6 5.3-.5z"/><circle class="s" cx="12" cy="12" r="10"/>',
  gate: '<path class="s" d="M4 21V9a8 8 0 0 1 16 0v12M4 21h16M9 21v-7a3 3 0 0 1 6 0v7"/>',
  rankic: '<path class="s" d="M4 20v-7M10 20V8M16 20v-9M2 20h20M3.5 9.5L9.5 4l5.5 4 5-4.5"/>',
  flag: '<path class="s" d="M6 21V4M6 4h11l-2 4 2 4H6"/>',
  mission: '<rect class="s" x="5" y="4" width="14" height="17" rx="2"/><path class="s" d="M9 4V3h6v1M8.5 11l2 2 4-4M8.5 17h7"/>',
  gift: '<rect class="s" x="4" y="9" width="16" height="12" rx="1.5"/><path class="s" d="M3 9h18v-3H3zM12 6v15M12 6c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1"/>',
  crown: '<path class="s" d="M3 18h18M4 18L3 7l5 4 4-6 4 6 5-4-1 11"/>',
  sort: '<path class="s" d="M4 6h16M4 12h11M4 18h6"/>',
});
const svg = (name, cls = "") => `<svg class="gl-ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${SVG[name]}</svg>`;

/* ---------------- units, prepared once ---------------- */
function tagMap(list) {
  const m = new Map();
  for (const t of list || []) {
    const [head, cond] = t.split("|");
    const [id, scope] = head.split(":");       // a third part is the value mark (pct / flat)
    if (!m.has(id)) m.set(id, []);
    m.get(id).push({ scope: scope || "", conds: new Set(cond ? cond.split(",") : []) });
  }
  return m;
}
/* every tag id of a tag map: the effects and their conditions (for the filter counts) */
function tagIds(m) {
  const out = new Set(m.keys());
  for (const list of m.values()) for (const e of list) for (const c of e.conds) out.add(c);
  return out;
}
function prepSub(id, s) {
  s.id = +id;
  s._tags = { own: tagMap(s.tags) };
  s._effs = flatEffects(s._tags);
  s._for = {};                                  // kind -> Set("class:12", "weapon:1103" …)
  for (const [k, list] of Object.entries(s.for || {})) s._for[k] = new Set(list);
  s._icon = s.ultimate ? "SSR1_Ultimate" : s.rarity;
  s._order = W.lookups.subskillRarity[s.rarity]?.order || 0;
  s._src = W.sources.subskills[id] || [];
  const group = { dungeon: "dungeon", clear: "quest", highlevel: "quest", mission: "mission", shop: "shop" };
  s._from = new Set(s._src.map(e => group[e.kind] || "other"));
  if (s.recipe) s._from.add("recipe");
  [s._tab, s._grp] = subGroup(s);
}
const subName = s => tx(`subskill.${s.id}.name`) || String(s.id);
/* the list tab and group of a sub skill, by its main source:
   Drop (H. Premium only | Premium only | other dungeons) > Craft (deep dungeon floor challenge |
   ★ reward) > Quest (boss challenge | quest | mission) > Exchange shop (in-game currency) >
   Other (paid pack | login, pass, serial | unknown) */
function subGroup(x) {
  const S = W.sources, src = x._src;
  const dun = src.filter(e => e.kind === "dungeon");
  if (dun.length) {
    const types = new Set(dun.map(e => S.dungeons[e.quest].type));
    return ["drop", types.size === 1 && types.has("HighPremium") ? "hp" : types.size === 1 && types.has("Premium") ? "p" : "drest"];
  }
  if (x.recipe) return ["craft", (S.recipes[x.id] || []).some(e => e.kind === "mission") ? "deepm" : "deeps"];
  const q = src.filter(e => e.kind === "clear" || e.kind === "highlevel");
  // boss challenges: story bosses and event bosses apart (sources quests[].boss)
  const boss = q.map(e => S.quests[e.quest]?.boss).filter(Boolean);
  if (boss.length) return ["boss", boss.some(b => b.story) ? "bossm" : "bosse"];
  // then (owner): event quests (linked to an event) > Monster Girl's Secret > other quests
  if (q.some(e => S.quests[e.quest]?.event && !S.quests[e.quest]?.secret)) return ["quest", "event"];
  if (q.some(e => S.quests[e.quest]?.secret)) return ["quest", "secret"];
  if (q.length) return ["quest", "quest"];
  if (src.some(e => e.kind === "mission")) return ["quest", "mission"];
  // paid before the exchange shop (owner): the bonus pass (MoP) is paid, so the ultimates
  // that are also in an event exchange shop go to Paid
  if (src.some(e => e.kind === "pass" || (e.kind === "shop" && S.shops[e.shop]?.currency === "point.payment"))) return ["etc", "paid"];
  if (src.some(e => e.kind === "shop")) return ["quest", "exchange"];
  return ["etc", src.length ? "misc" : "unknown"];
}
function prep(u) {
  const fam = W.classes[u.class];
  u._fam = fam;
  u._base = String(Math.floor(u.class / 1000));             // 11 warrior … 17 supporter
  u._weapon = String(fam.weapon);
  u._rar = W.lookups.rarity[u.rarity]?.code || "Unknown";
  u._stags = new Set(u.skills.flatMap(sid => W.skills[sid]?.stags || []));   // Active skill tags
  u._fx = [...u.skills.flatMap(sid => (W.skills[sid]?.fx || []).map(r => parseFx(r, "skill"))),   // Advanced filter records
    ...(u.fx?.race || []).map(r => parseFx(r, "trait")), ...(u.fx?.weapon || []).map(r => parseFx(r, "weapon")),
    ...(u.fx?.awaken || []).map(r => parseFx(r, "awaken"))];
  u._flies = u.move === "Fly" || !!u.head?.["trait.flight"];      // a race trait can make her fly too
  u._feat = new Set(u.features.filter(t => ["skills_2", "weapon", "oc_skill", "act_boost"].includes(t)));
  if (fam.act) u._feat.add("act");
  u._res = u.resource;
  u._deploy = u.deploy[u.deploy.length - 1];                // deploy cost at the last class tier
  u._place = fam.tiers[fam.tiers.length - 1].placement;     // the same for every tier of a family
}
function unitName(u) { return isJa() ? u.name : term("characters", u.name); }
function searchText(u) {
  const sp = W.lookups.species[u.species];
  return [u.name, u.kana, term("characters", u.name), ...W.text[`unit.${u.id}.title`] || [], sp, (W.terms.species || {})[sp]]
    .join(" ").toLowerCase();
}

/* ---------------- filter groups ---------------- */
const RAR_ORDER = ["SSR", "SR", "HR", "R"];
function tagName(id) { if (/^(el|tr):/.test(id)) return whoLabel(id); const t = W._tagById[id]; return t ? (isJa() ? t.ja : t.en) : id; }
function classFamiliesOf(base) { return Object.keys(W.classes).filter(f => String(Math.floor(f / 1000)) === base); }

/* options A–Z by their shown name (race traits: owner) */
const byLabel = (a, b) => a.label.localeCompare(b.label, isJa() ? "ja" : "en");
const HITS = ["Physical", "Magic", "Ignore", "Heal"];          // cJobData.hitType (Ignore = piercing)
const PLACES = ["Near", "Far", "All"];                         // cJobData.summonType
const MOVES = ["Ground", "Fly", "Warp", "Rush"];               // Ground = everyone who doesn't fly
const textOpt = (v, text, tip) => ({ v, text, tip, html: `<span class="kchip">${esc(text)}</span>` });
/* Who an ally buff is for: an element (el:), a main class (cl:), a race trait (tr:) or everyone */
function whoLabel(v) {
  if (v === "none") return ui("whoNone");
  const [k, n] = v.split(":");
  if (k === "el") return term("elements", W.lookups.elements[n]);
  if (k === "cl") { const f = classFamiliesOf(String(+n + 9))[0]; return f ? term("classes", W.classes[f].name) : n; }
  return term("traits", W.lookups.traits[n]) || n;
}
/* ---- the unit filter (session 9, FILTERS.md "Unit filter"): tabs Allies | Attack | ETC, one
   drop-down per block (lookups.fxTabs / fxBlocks), Ailment + Value in Attack (lookups.fxAilments:
   gauge / chance / always; site Game formulas). Every effect of a skill, race trait, weapon or
   awakening node is one record (unit._fx: src, id, blk, scope, who, build / chance / strength /
   element / weather / field; tags.effect_records); an effect pick needs one record that also meets
   the Source row and, for the Allies blocks, Target and Who. */
const FX_SRC = ["skill", "trait", "weapon", "awaken"];
/* ailment value ranges: Stun build-up (the gauge fills at 100: 100 = one hit), the others chance % */
const AIL_RANGES = {
  b: [["b1", 1, 29], ["b30", 30, 49], ["b50", 50, 79], ["b80", 80, 99], ["b100", 100, 100]],
  c: [["c1", 1, 20], ["c21", 21, 50], ["c51", 51, 99], ["c100", 100, 100]],
};
const POISON = [["s120", 120], ["s190", 190], ["s280", 280]];     // poison strength = damage every 3 s
let FXBLK = null;                                  // record id -> its Trait tag category (t_atk …)
let OPT_OF = null;                                 // record id -> [filter block, option] (lookups.fxBlocks)
function optOf(id) {
  if (!OPT_OF) {
    OPT_OF = {};
    for (const [b, opts] of Object.entries(W.lookups.fxBlocks || {}))
      for (const o of opts) for (const id of W.lookups.fxMerged?.[o] || [o]) OPT_OF[id] = [b, o];
  }
  return OPT_OF[id];
}
function parseFx(r, src) {
  FXBLK ??= Object.fromEntries(W.lookups.traitTags.map(t => [t.id, t.cat]));
  const [id, scope, who, val = ""] = r.split("|");
  const num = k => { const m = val.match(new RegExp(k + "(\\d+)")); return m ? +m[1] : null; };
  return { src, id, blk: FXBLK[id] || W._tagById[id]?.cat || "special", scope, who: who ? who.split(",") : [],
    build: num("b"), chance: num("c"), strength: num("s"), el: num("e"), wx: num("w"), field: num("f") };
}
const fxAllies = () => new Set(W.lookups.fxTabs?.allies || []);
function fxOK(r) {                                 // a record meets the Source, Target and Who picks
  const src = picks("fsrc");
  if (src.size && !src.has(r.src)) return false;
  if (fxAllies().has(r.blk)) {
    const sc = picks("fscope"), who = picks("fwho");
    if (sc.size && !sc.has(r.scope)) return false;
    if (who.size && ![...who].some(v => v === "none" ? r.scope === "allies" && !r.who.length : r.who.includes(v))) return false;
  }
  return true;
}
/* the Value picks of the picked ailment ("t_poison|c21", "t_poison|s190"): a range and a strength */
function ailOK(r) {
  const p = [...picks("failv")].filter(v => v.startsWith(r.id + "|")).map(v => v.split("|")[1]);
  const ranges = p.filter(v => v[0] !== "s"), str = p.filter(v => v[0] === "s");
  const val = r.build ?? r.chance;
  if (ranges.length && !ranges.some(k => { const x = [...AIL_RANGES.b, ...AIL_RANGES.c].find(z => z[0] === k);
    return x && val != null && val >= x[1] && val <= x[2] && (k[0] === "b") === (r.build != null); })) return false;
  if (str.length && !str.some(k => r.strength === +k.slice(1))) return false;
  return true;
}
/* Source / Target / Who alone: some record they apply to meets them; with an effect pick they apply
   to, the effect's own match checks them */
function fxModMatch(gid) {
  const rel = gid === "fsrc" ? () => true : r => fxAllies().has(r.blk);
  const applies = g => gid === "fsrc" || fxAllies().has(g.id);
  return u => GROUPS.some(g => g.fx && picks(g.id).size && applies(g)) || u._fx.some(r => rel(r) && fxOK(r));
}
function fxTabDefs() {
  const L = W.lookups, defs = [], cnt = {}, whoCnt = {};
  const add = (c, k) => c[k] = (c[k] || 0) + 1;
  const rangeOf = r => r.build != null ? AIL_RANGES.b.find(x => r.build >= x[1] && r.build <= x[2])?.[0]
    : r.chance != null ? AIL_RANGES.c.find(x => r.chance >= x[1] && r.chance <= x[2])?.[0] : null;
  for (const u of W.units) {
    const ids = new Set(), ws = new Set();
    for (const r of u._fx) {
      ids.add(r.id); ids.add("src:" + r.src);
      const k = rangeOf(r); if (k) ids.add(`${r.id}:${k}`);
      if (r.strength) ids.add(`${r.id}:s${r.strength}`);
      if (r.el) ids.add(`el:${r.el}`);
      if (r.wx) ids.add(`wx:${r.wx}`);
      if (fxAllies().has(r.blk)) (r.who.length ? r.who : r.scope === "allies" ? ["none"] : []).forEach(v => ws.add(v));
    }
    ids.forEach(k => add(cnt, k)); ws.forEach(k => add(whoCnt, k));
  }
  // both panels: the Source row (it also narrows the search box)
  defs.push({ id: "fsrc", sec: "top", single: true, head: ui("fxSource"), match: fxModMatch("fsrc"),
    opts: FX_SRC.map(v => ({ ...textOpt(v, ui("fs_" + v), ui("fsTip_" + v)), cnt: cnt["src:" + v] || 0 })) });
  // one drop-down per block (lookups.fxBlocks, owner: each option in one place): an option is a
  // Trait tag (every source), "st:<skill tag>" (the skill's own) or a merged id (lookups.fxMerged)
  const stc = {};
  for (const u of W.units) for (const v of u._stags) stc[v] = (stc[v] || 0) + 1;
  const optCnt = o => o.startsWith("st:") ? stc[o.slice(3)] || 0
    : L.fxMerged?.[o] ? W.units.filter(u => u._fx.some(r => L.fxMerged[o].includes(r.id))).length : cnt[o] || 0;
  const optLabel = o => { const l = L.fxLabels?.[o]; if (l) return isJa() ? l.ja : l.en;
    const t = L.traitTags.find(x => x.id === o); return isJa() ? t.ja : t.en; };
  const blockMatch = (u, p) => [...p].some(o => o.startsWith("st:") ? u._stags.has(o.slice(3))
    : u._fx.some(r => (L.fxMerged?.[o] ? L.fxMerged[o].includes(r.id) : r.id === o) && fxOK(r)));
  for (const [key, blocks] of Object.entries(L.fxTabs || {})) {
    const tab = key === "skill" ? "fxskill" : key;
    for (const b of blocks) {
      const opts = (L.fxBlocks?.[b] || []).filter(o => optCnt(o)).map(o => ({ v: o, label: optLabel(o), chip: `ttag ${b}`, cnt: optCnt(o) }));
      if (opts.length) defs.push({ id: b, sec: tab, fx: true, dropdown: true, cls: b, label: ui("fx_" + b), opts, match: blockMatch });
      if (b === "k_field") {                         // which element the tile becomes, which weather
        const els = Object.keys(L.elements).filter(n => cnt[`el:${n}`]);
        if (els.length) defs.push({ id: "ftile", sec: tab, fx: true, single: true, dropdown: true, cls: "k_field", label: ui("fxTileTo"),
          match: (u, p) => u._fx.some(r => r.id === "t_tile" && p.has(String(r.el)) && fxOK(r)),
          opts: els.map(n => ({ v: n, label: term("elements", L.elements[n]), chip: "ttag k_field", cnt: cnt[`el:${n}`] })) });
        const wxs = Object.keys(L.weather).filter(n => cnt[`wx:${n}`]);
        if (wxs.length) defs.push({ id: "fweather", sec: tab, fx: true, single: true, dropdown: true, cls: "k_field", label: ui("fxWeatherTo"),
          match: (u, p) => u._fx.some(r => r.id === "t_weather" && p.has(String(r.wx)) && fxOK(r)),
          opts: wxs.map(n => ({ v: n, label: term("weather", L.weather[n]), chip: "ttag k_field", cnt: cnt[`wx:${n}`] })) });
      }
    }
    if (tab !== "allies") continue;
    const tip = v => `${whoLabel(v)} (${whoCnt[v] || 0})`;
    const whoOpts = [
      ...Object.keys(L.elements).filter(n => whoCnt[`el:${n}`]).map(n => ({ v: `el:${n}`, kind: "el", label: whoLabel(`el:${n}`), tip: tip(`el:${n}`),
        cnt: whoCnt[`el:${n}`], html: `<img src="img/element/${n}.webp" alt="">` })),
      ...[2, 3, 4, 5, 6, 7, 8].map(n => ({ v: `cl:${n}`, kind: "cl", label: whoLabel(`cl:${n}`), tip: tip(`cl:${n}`),
        cnt: whoCnt[`cl:${n}`] || 0, html: `<img class="cls-ic" src="img/class/${classFamiliesOf(String(n + 9))[0]}.webp" alt="">` })),
      ...Object.keys(L.traits).map(n => `tr:${n}`).filter(v => whoCnt[v]).sort((a, c) => whoLabel(a).localeCompare(whoLabel(c)))
        .map(v => ({ v, kind: "tr", label: whoLabel(v), chip: "who", cnt: whoCnt[v] })),
      ...(whoCnt.none ? [{ v: "none", kind: "all", label: whoLabel("none"), tip: ui("whoNoneTip"), chip: "who", cnt: whoCnt.none }] : []),
    ];
    defs.push({ id: "fwho", sec: tab, dropdown: true, layout: "who", cls: "who", label: ui("who"), opts: whoOpts, match: fxModMatch("fwho") });
    defs.push({ id: "fscope", sec: tab, head: ui("h_target"), match: fxModMatch("fscope"),
      opts: ["self", "allies"].map(v => textOpt(v, ui("sc_" + v), ui(v === "self" ? "scopeSelf" : "scopeAllies"))) });
  }
  // Enemies: [Ailment] (one pick; in the order of how it lands) and [Value] tied to it: the picked
  // ailment's chance / build-up ranges and, for Poison, its strengths (owner, session 9)
  const ailOpts = [], valOpts = [];
  for (const [kind, ids] of Object.entries(L.fxAilments || {}))
    for (const id of ids) {
      if (!cnt[id]) continue;
      const t = L.traitTags.find(x => x.id === id), name = isJa() ? t.ja : t.en;
      ailOpts.push({ v: id, label: name, chip: "ttag t_ail", cnt: cnt[id], tip: `${name}: ${ui("ak_" + kind)}` });
      const rk = id === "t_stun" ? "b" : kind === "chance" ? "c" : null;
      for (const [k, lo, hi] of rk ? AIL_RANGES[rk] : []) {
        const n = cnt[`${id}:${k}`];
        if (n) valOpts.push({ v: `${id}|${k}`, base: id, label: ui("ar_" + k), chip: "ttag t_ail", cnt: n,
          tip: `${name}: ${ui(rk === "b" ? "buildUp" : "chance")} ${lo === hi ? lo : `${lo}–${hi}`}${rk === "c" ? " %" : ` (${ui("arTip_" + k)})`}` });
      }
      if (id === "t_poison") for (const [k, v] of POISON) {
        const n = cnt[`${id}:${k}`];
        if (n) valOpts.push({ v: `${id}|${k}`, base: id, label: `${v} ${ui("psDmg")}`, chip: "ttag t_ail", cnt: n,
          tip: `${ui("ps_" + k)}: ${ui("psHead")} ${v}, ${ui("psTip")}` });
      }
    }
  if (ailOpts.length) {
    defs.push({ id: "fail", sec: "attack", fx: true, single: true, dropdown: true, cls: "t_ail", label: ui("fx_t_ail"), opts: ailOpts,
      match: (u, p) => u._fx.some(r => p.has(r.id) && fxOK(r) && ailOK(r)) });
    defs.push({ id: "failv", sec: "attack", dropdown: true, cls: "t_ail", label: ui("failv"), opts: valOpts, match: () => true });
  }
  return defs;
}
/* the search box on top of the Advanced filter: skill, race trait and weapon text and the
   effect names (both languages), only in the picked sources */
function fxText(u) {
  if (!u._fxText) {
    const clean = s => (s || "").replace(/\[[^\]]*\]/g, " ").replace(/<[^>]+>/g, "");
    const both = k => (W.text[k] || []).map(clean).join(" ");
    const names = src => u._fx.filter(r => r.src === src).map(r => { const t = W.lookups.traitTags.find(x => x.id === r.id) || W._tagById[r.id];
      return t ? `${t.en} ${t.ja}` : ""; }).join(" ");
    u._fxText = {
      skill: u.skills.map(s => `${both(`skill.${s}.name`)} ${both(`skill.${s}.text`)}`).join(" ") + " " + names("skill"),
      trait: `${both(`race.${u.race}.name`)} ${both(`race.${u.race}.text`)} ${both(`race.${u.race}.bonus`)} ${names("trait")}`,
      weapon: u.weapon ? `${both(`weapon.${u.id}.name`)} ${both(`weapon.${u.id}.text`)} ${names("weapon")}` : "",
    };
    for (const k in u._fxText) u._fxText[k] = u._fxText[k].toLowerCase();
  }
  return u._fxText;
}
const fxWords = () => state.mode === "units" ? (state.fq || "").trim().toLowerCase().split(/\s+/).filter(Boolean) : [];
function fxSearchOK(u, words = fxWords()) {
  if (!words.length) return true;
  const t = fxText(u), src = picks("fsrc");
  const hay = (src.size ? [...src] : FX_SRC).map(k => t[k]).join(" ");
  return words.every(w => hay.includes(w));
}
function tagGroupDefs(tagCount, listed = id => tagCount[id]) {
  const L = W.lookups, defs = [];
  for (const [sec, cats] of [["what", whatCats()], ["cond", condCats()]])
    for (const cat of cats) {
      const opts = L.tags.filter(t => t.cat === cat && listed(t.id)).map(t => ({ v: t.id, label: isJa() ? t.ja : t.en, chip: cat, cnt: tagCount[t.id] }));
      // WHAT: an effect meeting the paired conditions; When / Trigger / Requires: see hasCond;
      // Drawback, Skill type: anywhere on the unit
      const match = sec === "what" ? (x, p) => [...p].some(t => hasTag(x, t))
        : pairedCats().includes(cat) ? (x, p) => hasCond(x) : (x, p) => [...p].some(t => hasTag(x, t, false));
      if (opts.length) defs.push({ id: cat, sec, dropdown: true, cls: cat, label: ui("tg_" + cat), tagGroup: true, match, opts });
    }
  return defs;
}
/* sub skills: who they work for (kind picks, else only / bonus / allies) */
const W_KINDS = ["only", "bonus", "not", "allies"];
function forHas(x, test) {
  const kinds = picks("wkind").size ? [...picks("wkind")] : ["only", "bonus", "allies"];
  return kinds.some(k => x._for[k] && [...x._for[k]].some(test));
}
function worksDefs() {
  const L = W.lookups;
  const bases = [...new Set(Object.keys(W.classes).map(f => String(Math.floor(f / 1000))))].sort();
  const count = (dim) => { const c = {}; for (const x of W._subs) for (const k of W_KINDS) for (const e of x._for[k] || []) {
    const [d, v] = e.split(":"); if (d === dim) c[v] = (c[v] || 0) + 1; } return c; };
  const traitCount = count("trait");
  return [
    // main class -> its weapons; a class entry covers all of its weapons
    { id: "class", sec: "who", single: true, title: ui("subDetailSec"), head: ui("h_classWeapon"), match: (x, p) => [...p].some(b => {
        const subs = [...picks("weapon")].filter(w => w.slice(0, 2) === b);
        return forHas(x, e => e === `class:${b}` || (e.startsWith("weapon:") && e.slice(7, 9) === b && (!subs.length || subs.includes(e.slice(7)))));
      }),
      opts: bases.map(b => { const f = classFamiliesOf(b)[0];
        return { v: b, html: `<img src="img/class/${f}.webp" alt="">`, tip: term("classes", W.classes[f].name) }; }) },
    { id: "weapon", sec: "who", modifier: true, sub: true, single: true,
      opts: Object.keys(W.classes).map(f => { const w = String(W.classes[f].weapon);
        return { v: w, base: w.slice(0, 2), html: `<img src="img/weapon/${w}.webp" alt="">`,
          tip: `${term("classes", W.classes[f].name)} · ${term("weapons", L.weapons[w])}` }; }) },
    { id: "welement", sec: "who", single: true, head: ui("h_elementRace"), match: (x, p) => forHas(x, e => p.has(e.replace("element:", "")) && e.startsWith("element:")),
      opts: Object.keys(L.elements).map(e => ({ v: e, html: `<img src="img/element/${e}.webp" alt="">`, tip: term("elements", L.elements[e]) })) },
    { id: "wtrait", sec: "who", single: true, dropdown: true, cls: "trait", label: ui("wtrait"), match: (x, p) => forHas(x, e => e.startsWith("trait:") && p.has(e.slice(6))),
      opts: Object.keys(L.traits).filter(t => traitCount[t]).map(t => ({ v: t, label: term("traits", L.traits[t]), chip: "trait", cnt: traitCount[t] })).sort(byLabel) },
    { id: "wkind", sec: "who", head: ui("h_condition"), match: (x, p) => [...p].some(k => x._for[k]),
      opts: W_KINDS.map(k => ({ v: k, text: ui("wk_" + k), html: `<span class="kchip">${esc(ui("wk_" + k))}</span>`, tip: ui("wkindTip_" + k) })) },
  ];
}
function subGroupDefs() {
  const L = W.lookups;
  const count = (fn) => { const c = {}; for (const x of W._subs) for (const v of fn(x)) c[v] = (c[v] || 0) + 1; return c; };
  // tags only paid sub skills have are not listed (owner: paid packs don't matter)
  const tagCount = count(x => tagIds(x._tags.own));
  const freeCount = count(x => x._tab === "etc" ? [] : tagIds(x._tags.own));
  const CAT = { Attack: "atk", Defense: "def", Support: "support" };
  const defs = [
    { id: "rarity", sec: "list", match: (x, p) => p.has(x.rarity),
      opts: ["SSR1", "SR1", "R1", "C1"].map(c => ({ v: c, html: `<img src="img/rarity/${c}.webp" alt="">`,
        tip: term("rarities", L.subskillRarity[c]?.name) })) },
    { id: "category", sec: "list", match: (x, p) => p.has(x.category),
      opts: Object.keys(CAT).map(c => ({ v: c, text: ui("cat" + c), html: `<span class="jp-grp cat-chip cat-${c}">${esc(ui("cat" + c))}</span>`, tip: ui("cat" + c) })) },
  ];
  // Target (self / allies) at the bottom of the Condition tab (owner)
  defs.push(...worksDefs(), ...tagGroupDefs(tagCount, id => freeCount[id]), { id: "scope", sec: "cond", head: ui("h_target"), modifier: true,
    opts: [["self", "scopeSelf"], ["allies", "scopeAllies"], ["enemy", "scopeEnemy"]].map(([v, t]) => ({ v, text: ui("sc_" + v), html: `<span class="kchip">${esc(ui("sc_" + v))}</span>`, tip: ui(t) })) });
  return defs;
}
function groupDefs() {
  if (state.mode === "subskills") return subGroupDefs();
  const L = W.lookups;
  const bases = [...new Set(Object.keys(W.classes).map(f => String(Math.floor(f / 1000))))].sort();
  const count = (fn) => { const c = {}; for (const u of W.units) for (const v of fn(u)) c[v] = (c[v] || 0) + 1; return c; };
  const stagCount = count(u => u._stags);
  const traitCount = count(u => u.traits.map(String));
  const collabCount = count(u => u.collab ? [u.collab] : []);
  // the unit's own game data (rarity, cost, element, class, movement, collab, race) is the
  // left-side filter under the funnel button; the right panel filters by what she does (owner, session 5)
  const defs = [
    // rows (owner, session 5): rarity + element | class (+ its weapons) | attack · placement ·
    // movement | features, collab, race; rarity, element, class and weapon: one pick each
    { id: "rarity", sec: "list", row: "a", single: true, match: (u, p) => p.has(u._rar),
      opts: RAR_ORDER.map(c => ({ v: c, html: `<img src="img/rarity/${c}.webp" alt="">`,
        tip: term("rarities", Object.values(L.rarity).find(r => r.code === c)?.name) })) },
    { id: "element", sec: "list", row: "a", single: true, match: (u, p) => p.has(String(u.element)),
      opts: Object.keys(L.elements).map(e => ({ v: e, html: `<img src="img/element/${e}.webp" alt="">`, tip: term("elements", L.elements[e]) })) },
    // main class; a picked main class shows its subclasses (weapon types) under it
    { id: "class", sec: "list", row: "c", single: true, match: (u, p) => {
        if (!p.has(u._base)) return false;
        const subs = [...picks("weapon")].filter(w => w.slice(0, 2) === u._base);
        return !subs.length || subs.includes(u._weapon);
      },
      opts: bases.map(b => { const f = classFamiliesOf(b)[0];
        return { v: b, html: `<img src="img/class/${f}.webp" alt="">`, tip: term("classes", W.classes[f].name) }; }) },
    { id: "weapon", sec: "list", row: "c", modifier: true, sub: true, single: true,
      opts: Object.keys(W.classes).map(f => { const w = String(W.classes[f].weapon);
        return { v: w, base: w.slice(0, 2), html: `<img src="img/weapon/${w}.webp" alt="">`,
          tip: `${term("classes", W.classes[f].name)} · ${term("weapons", L.weapons[w])}` }; }) },
    // the game's own filter words: attack type, placement type, movement type (+ warp, rush)
    { id: "hit", sec: "list", row: "t", single: true, rowLabel: "attack", match: (u, p) => p.has(u.hit),
      opts: HITS.map(h => textOpt(h, ui("hit_" + h), ui("hitTip_" + h))) },
    { id: "place", sec: "list", row: "t", single: true, match: (u, p) => p.has(u._place),
      opts: PLACES.map(v => textOpt(v, ui("pl_" + v), ui("plTip_" + v))) },
    { id: "move", sec: "list", row: "m", single: true, rowLabel: "moveShort", match: (u, p) => [...p].some(v => v === "Ground" ? !u._flies : v === "Fly" ? u._flies : u.move === v),
      opts: MOVES.map(v => textOpt(v, ui("mv_" + v), ui("mvTip_" + v))) },
    { id: "feature", sec: "list", row: "m", match: (u, p) => [...p].some(v => u._feat.has(v)),
      opts: [["skills_2", "skills_2"], ["weapon", "pweapon"], ["act_boost", "act_boost"], ["oc_skill", "oc_skill"]]
        .map(([v, k]) => ({ v, html: svg(k, "c-feat"), tip: ui(k) })) },
    { id: "collab", sec: "list", dropdown: true, cls: "trait", match: (u, p) => p.has(u.collab),
      opts: L.collabs.map(c => ({ v: c, label: term("collabs", c), chip: "trait", cnt: collabCount[c] || 0 })) },
    { id: "trait", sec: "list", dropdown: true, cls: "trait", match: (u, p) => u.traits.some(t => p.has(String(t))),
      opts: Object.keys(L.traits).filter(t => traitCount[t]).map(t => ({ v: t, label: term("traits", L.traits[t]),
        chip: "trait", cnt: traitCount[t] })).sort(byLabel) },
  ];
  // the Advanced filter (demo, session 9): Buff | Debuff | When over every effect record
  defs.push(...fxTabDefs());
  return defs;
}
let GROUPS = [];
function picks(id) {                          // the picks of the current mode
  const P = state.picksBy[state.mode] || (state.picksBy[state.mode] = {});
  return P[id] || (P[id] = new Set());
}

/* a unit has tag t in one of the picked sources (all if none), with a picked scope when the tag has one */
/* condition groups that belong to one effect (from the data; drawbacks count anywhere) */
const pairedCats = () => W.lookups.tagGroups?.paired || [];
/* every effect of an item as one flat list [{src, id, scope, conds}] (fast to scan) */
function flatEffects(tags) {
  const out = [];
  for (const [src, m] of Object.entries(tags)) for (const [id, list] of m) for (const e of list) out.push({ src, id, ...e });
  return out;
}
function effectsOf(u) {                       // [id, effect]
  return u._effs.map(e => [e.id, e]);
}
/* Target: a buff counts by who gets it (self / allies), a debuff or ailment (HARM tags) on enemies;
   effects with no target (damage, field …) pass */
const isHarm = e => !!W._tagById[e.id]?.harm;
const scopeOK = e => { const sc = picks("scope"); if (!sc.size) return true;
  if (e.scope) return sc.has(e.scope);
  return isHarm(e) ? sc.has("enemy") : true; };
const condOK = e => pairedCats().every(g => { const p = picks(g); if (!p.size) return true; for (const c of p) if (e.conds.has(c)) return true; return false; });
/* the unit has effect t (paired: meeting the When / Trigger / Requires picks too) */
function hasTag(u, t, paired = true) {
  for (const e of u._effs) if (e.id === t && scopeOK(e) && (!paired || condOK(e))) return true;
  return false;
}
/* a When / Trigger / Requires pick: checked with the WHAT picks when there are some, else
   on any effect */
function hasCond(u) {
  if (whatCats().some(c => picks(c).size)) return true;
  for (const [, e] of effectsOf(u)) if (scopeOK(e) && condOK(e)) return true;
  return false;
}

/* ---------------- building the page ---------------- */
function faceHTML(u, res, big, cost) {
  const rar = u._rar === "Unknown" ? "Unknown" : u._rar;
  const frame = rar === "Unknown" ? "Frame_Unknown" : `Frame_${rar}_UnitList`;
  return `<div class="face${big ? " big" : ""}">
    <img class="art" src="img/unit/${res}.webp" alt="" loading="lazy">
    <img class="frm" src="img/face/${frame}.webp" alt="">
    <img class="cls" src="img/class/${u.class}.webp" alt="">
    <span class="cost">${cost ?? u._deploy}</span>
    <img class="el" src="img/element/${u.element}.webp" alt=""></div>`;
}

function buildTiles() {
  const box = $("#units");
  const order = [...W.units].sort((a, b) => b.id - a.id);        // newest first
  box.innerHTML = order.map(u => `<button class="tile" data-id="${u.id}" title="${esc(tx(`unit.${u.id}.title`))}">
    ${faceHTML(u, u._res)}<div class="nm">${esc(unitName(u))}</div></button>`).join("") + `<div class="empty" hidden>${ui("none")}</div>`;
  box.onclick = e => { const t = e.target.closest(".tile"); if (t) select(+t.dataset.id); };
  W.units.forEach(u => { u._search = searchText(u); u._el = box.querySelector(`.tile[data-id="${u.id}"]`); });
  sortTiles();
  markSelected();
}
/* unit list order (owner, session 5): Release (= unit id: the data has no release date; the
   gacha tables only keep banners from late 2024) | Name | Class; ↑↓ = direction. The tiles are
   only moved, not rebuilt. */
const SORTS = ["release", "name", "class"];
const SORT_DIR0 = { release: "desc", name: "asc", class: "asc" };   // a new sort key starts here
function sortTiles() {
  const key = state.sort, dir = state.sortDir === "asc" ? 1 : -1;
  const cmp = {
    release: (a, b) => a.id - b.id,
    name: (a, b) => unitName(a).localeCompare(unitName(b), isJa() ? "ja" : "en") || b.id - a.id,
    class: (a, b) => a.class - b.class || (b.id - a.id) * dir,     // newest first inside a class
  }[key];
  const box = $("#units");
  for (const u of [...W.units].sort((a, b) => cmp(a, b) * dir)) box.appendChild(u._el);
  box.appendChild(box.querySelector(".empty"));
}
function sortHTML() {
  return `<div class="sortbox"><button class="sort-btn" id="sortBtn" title="${esc(ui("sortBy"))}">${svg("sort", "c-sort")}<span>${esc(ui("sort_" + state.sort))}</span></button>
    <button class="sort-dir" id="sortDir" title="${esc(ui(state.sortDir === "asc" ? "sortAsc" : "sortDesc"))}">${state.sortDir === "asc" ? "↑" : "↓"}</button>
    <div class="sort-menu" id="sortMenu" hidden>${SORTS.map(k => `<button data-sort="${k}"${k === state.sort ? ' class="on"' : ""}>${esc(ui("sort_" + k))}</button>`).join("")}</div></div>`;
}

function optHTML(g, o) {
  if (o.chip) return `<button class="opt" data-v="${esc(o.v)}"${o.tip ? ` title="${esc(o.tip)}"` : ""}><span class="tag ${o.chip}">${esc(o.label)}</span><span class="cnt">${o.cnt}</span></button>`;
  return `<button class="opt" data-v="${esc(o.v)}"${o.cnt === 0 ? ' data-none="1"' : ""} title="${esc(o.tip)}">${o.html}</button>`;
}
function listHTML(g) {
  if (g.layout !== "who") return g.opts.map(o => optHTML(g, o)).join("");
  const part = k => g.opts.filter(o => o.kind === k).map(o => optHTML(g, o)).join("");
  return `<div class="who-row">${part("all")}</div><div class="who-row">${part("el")}</div><div class="who-row">${part("cl")}</div><div class="who-races">${part("tr")}</div>`;
}
function groupHTML(g) {
  if (g.dropdown)
    return `<div class="fgroup" data-group="${g.id}"><button class="dd-btn"><span class="dd-lbl ${g.cls}">${g.label || ui(g.id)}</span>
      <span class="dd-val"></span><span class="caret">▾</span></button>
      <div class="dd-list${g.layout ? ` ${g.layout}-list` : ""}" hidden>${listHTML(g)}</div></div>`;
  if (g.sub)
    return `<div class="fgroup subgroup" data-group="${g.id}" title="${esc(ui("subclass"))}"><div class="opts">${g.opts.map(o =>
      optHTML(g, o).replace('<button class="opt"', `<button class="opt" data-base="${o.base}"`)).join("")}</div></div>`;
  return `<div class="fgroup" data-group="${g.id}"><div class="opts">${g.opts.map(o => optHTML(g, o)).join("")}</div></div>`;
}
function buildFilters() {
  GROUPS = groupDefs();
  const box = $("#groups");
  const secs = { allies: "", attack: "", fxskill: "", top: "", unit: "", who: "", what: "", cond: "", list: "" };
  const rows = {};
  for (const g of GROUPS) {
    if (g.row) {
      const block = g.sub          // subclasses in the same row as their main classes
        ? `<div class="fsub subgroup" data-group="${g.id}" title="${esc(ui("subclass"))}">${g.opts.map(o =>
            optHTML(g, o).replace('<button class="opt"', `<button class="opt" data-base="${o.base}"`)).join("")}</div>`
        : `<div class="fsub" data-group="${g.id}">${g.rowLabel ? `<span class="rlbl">${esc(ui(g.rowLabel))}</span>` : ""}${g.opts.map(o => optHTML(g, o)).join("")}</div>`;
      if (rows[g.row] === undefined) { rows[g.row] = []; secs[g.sec] += `@@row-${g.row}@@`; }
      rows[g.row].push(block);
    } else secs[g.sec] += (g.title ? `<div class="fttl">${esc(g.title)}</div>` : "")
      + (g.head ? `<div class="fhd">${esc(g.head)}</div>` : "") + groupHTML(g);
  }
  for (const k of Object.keys(secs))
    for (const [r, blocks] of Object.entries(rows))
      secs[k] = secs[k].replace(`@@row-${r}@@`, `<div class="fgroup frow">${blocks.join('<span class="fsep"></span>')}</div>`);
  // sub skills have no own tab (owner, session 4): the list tabs and the rarity order do that
  const tabs = [["allies", "fxAlliesSec"], ["attack", "fxAttackSec"],
    ["fxskill", "fxSkillSec"], ["unit", "unitSec"], ["who", "whoSec"],
    ["what", state.mode === "units" ? "traitSec" : "whatSec"], ["cond", "condSec"]]
    .filter(([k]) => GROUPS.some(g => g.sec === k));
  if (!tabs.some(([k]) => k === state.fsec)) state.fsec = tabs[0][0];
  const fxSearch = state.mode === "units" ? `<div class="fx-search"><input id="fxSearch" type="search" placeholder="${esc(ui("fxSearch"))}"
    value="${esc(state.fq || "")}" autocomplete="off"></div>` : "";
  // units: the search and Source on top, then the tabs
  box.innerHTML = `${fxSearch}${secs.top}<nav class="ftabs">${tabs.map(([k, l]) =>
      `<button data-sec="${k}" title="${esc(UI.en[l + "Tip"] ? ui(l + "Tip") : "")}">${ui(l)}<b></b></button>`).join("")}</nav>
    ${tabs.map(([k]) => `<div class="fsec" data-sec="${k}">${secs[k]}</div>`).join("")}`;
  // the list's own filters (sub skills: rarity, type) sit on the left, behind a button
  $("#subFilter").innerHTML = secs.list + (state.mode !== "subskills" ? "" : `<label class="etc-toggle"><input type="checkbox" id="showEtc"${state.showEtc ? " checked" : ""}>
    ${esc(ui("showEtc"))}</label>`);
  if (state.mode === "units") $("#subFilter .frow")?.insertAdjacentHTML("beforeend", sortHTML());
  showSection();
  box.oninput = e => {                              // the Advanced filter's text search
    if (e.target.id !== "fxSearch") return;
    state.fq = e.target.value; applyFilters(); markSearch();
    clearTimeout(facetTimer); facetTimer = setTimeout(updateFilterUI, 200);
  };
  box.onclick = e => {
    const tab = e.target.closest(".ftabs button");
    if (tab) { state.fsec = tab.dataset.sec; store.set("fsec", state.fsec); showSection(); return; }
    const dx = e.target.closest(".ddpick .x");
    if (dx) { e.stopPropagation(); toggle(dx.closest("[data-group]").dataset.group, dx.parentElement.dataset.v); return; }
    const dd = e.target.closest(".dd-btn");
    if (dd) { toggleList(dd.parentElement); return; }
    const opt = e.target.closest(".opt");
    if (!opt) return;
    const gid = opt.closest("[data-group]").dataset.group;
    toggle(gid, opt.dataset.v);
  };
  updateFilterUI();
}
/* Value follows the Ailment pick: only that ailment's values; greyed with no ailment or none to
   pick; its label says what the values are (Stun: build-up, the others: chance) */
function markAilValue() {
  const el = $('#groups [data-group="failv"]');
  if (!el) return;
  const a = [...picks("fail")][0], g = GROUPS.find(x => x.id === "failv");
  el.querySelectorAll(".dd-list .opt").forEach(o => o.hidden = o.dataset.v.split("|")[0] !== a);
  const none = !a || !g.opts.some(o => o.base === a);
  el.classList.toggle("empty", none);
  el.querySelector(".dd-btn").disabled = none;
  el.querySelector(".dd-btn").title = !a ? ui("failvTip") : "";
  if (none) el.querySelector(".dd-list").hidden = true;
  el.querySelector(".dd-lbl").textContent = a === "t_stun" ? ui("buildUp") : a && !none ? ui("chance") : ui("failv");
}
function showSection() {
  document.querySelectorAll("#groups .ftabs button").forEach(b => b.classList.toggle("on", b.dataset.sec === state.fsec));
  document.querySelectorAll("#groups .fsec").forEach(x => x.hidden = x.dataset.sec !== state.fsec);
}
/* a drop-down opens beside the filter panel (one column), level with its group, so every
   group stays visible; it stays open while picking and closes on another group or outside */
function placeList(group) {
  const list = group.querySelector(".dd-list");
  if (!list || list.hidden) return;
  // the panel's resting place (it may still be sliding in): the right edge minus its width
  const r = group.getBoundingClientRect(), body = $(".filter-body");
  if (group.closest("#subFilter")) {                // the left filter: open under the button
    list.style.right = "auto";
    list.style.left = `${r.left}px`;
    list.style.top = `${Math.max(8, Math.min(r.bottom + 4, window.innerHeight - list.offsetHeight - 8))}px`;
    return;
  }
  list.style.left = "auto";
  const left = $("#filters").getBoundingClientRect().right - body.offsetWidth;
  list.style.right = `${window.innerWidth - left}px`;
  list.style.top = `${Math.max(8, Math.min(r.top, window.innerHeight - list.offsetHeight - 8))}px`;
}
function toggleList(group) {
  const list = group.querySelector(".dd-list");
  const open = list.hidden;
  document.querySelectorAll(".dd-list").forEach(l => l.hidden = true);
  if (!open) return;
  list.hidden = false;
  placeList(group);
}
document.addEventListener("click", e => {
  if (!e.target.closest(".sortbox") && $("#sortMenu")) $("#sortMenu").hidden = true;
  const g = e.target.closest(".fgroup");
  document.querySelectorAll(".dd-list").forEach(l => { if (!g || !g.contains(l)) l.hidden = true; });
});
$(".filter-body").addEventListener("scroll", () => {
  const l = [...document.querySelectorAll(".dd-list")].find(x => !x.hidden);
  if (l) placeList(l.closest(".fgroup"));
});

function toggle(gid, v) {
  const p = picks(gid);
  // Value (tied to the ailment): one range and one strength at a time (owner)
  if (gid === "failv" && !p.has(v)) { const s = v.split("|")[1][0] === "s";
    for (const x of [...p]) if ((x.split("|")[1][0] === "s") === s) p.delete(x); }
  if (gid === "fail") picks("failv").clear();                // another ailment: its values start empty
  const single = GROUPS.find(g => g.id === gid)?.single;
  if (single && !p.has(v)) {                   // one pick only: a new one replaces the old
    if (gid === "class") picks("weapon").clear();
    p.clear();
  }
  p.has(v) ? p.delete(v) : p.add(v);
  if (gid === "class" && !p.has(v)) for (const w of [...picks("weapon")]) if (w.slice(0, 2) === v) picks("weapon").delete(w);
  updateFilterUI();
  applyFilters();
}

/* how many items each option would leave (with the other picks and the search): the
   option alone replaces its group's picks; a weapon also needs its main class */
function facetCounts() {
  const P = state.picksBy[state.mode] || (state.picksBy[state.mode] = {});
  const q = state.q.trim().toLowerCase();
  const out = new Map();
  const words = fxWords();
  if (!q && !words.length && !GROUPS.some(g => P[g.id]?.size)) return out;     // nothing picked: the full counts
  for (const g of GROUPS) {
    if (g.modifier && !g.sub) continue;           // scope / source: no count
    for (const o of g.opts) {
      const saved = {};
      const set = (id, v) => { if (!(id in saved)) saved[id] = P[id]; P[id] = v; };
      if (g.sub) { set("weapon", new Set([o.v])); set("class", new Set([...(P.class || []), o.base])); }
      else set(g.id, new Set([o.v]));
      const active = GROUPS.filter(h => !h.modifier && P[h.id]?.size);
      let n = 0;
      for (const x of items()) if ((!q || x._search.includes(q)) && active.every(h => h.match(x, P[h.id])) && fxSearchOK(x, words)) n++;
      for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete P[k]; else P[k] = v; }
      out.set(`${g.id}\u0001${o.v}`, n);
    }
  }
  return out;
}
function updateFilterUI() {
  let total = 0, listPicks = 0;
  const fc = facetCounts();
  for (const g of GROUPS) {
    const p = picks(g.id);
    total += p.size;
    if (g.sec === "list") listPicks += p.size;
    const el = $(`${g.sec === "list" ? "#subFilter" : "#groups"} [data-group="${g.id}"]`);
    if (!el) continue;
    el.classList.toggle("has-picks", p.size > 0);
    el.querySelectorAll(".opt").forEach(o => {
      const on = p.has(o.dataset.v), n = o.dataset.none ? 0 : fc.get(`${g.id}\u0001${o.dataset.v}`);
      o.classList.toggle("on", on);
      o.classList.toggle("off", n === 0 && !on);
      o.disabled = n === 0 && !on;
      const c = o.querySelector(".cnt");
      if (c) { c.dataset.all ??= c.textContent; c.textContent = n ?? c.dataset.all; }
    });
    // a drop-down whose every option would leave nothing: greyed, can't open
    if (g.dropdown) {
      const dead = !p.size && g.opts.length && g.opts.every(o => fc.get(`${g.id}\u0001${o.v}`) === 0);
      el.classList.toggle("empty", dead);
      el.querySelector(".dd-btn").disabled = dead;
      if (dead) el.querySelector(".dd-list").hidden = true;
    }
    if (g.dropdown) el.querySelector(".dd-val").innerHTML = p.size    // a picked value: × removes it
      ? [...p].map(v => { const o = g.opts.find(x => x.v === v);
          return `<span class="ddpick tag ${o?.chip || ""}" data-v="${esc(v)}">${esc(o?.label || v)}<span class="x">×</span></span>`; }).join("")
      : `<span class="dd-none">---</span>`;
  }
  // subclasses: only those of the picked main classes; the row hides when none is picked
  const mains = picks("class");
  const sub = document.querySelector('#subFilter [data-group="weapon"].subgroup, #groups [data-group="weapon"].subgroup');
  if (sub) {
    sub.hidden = !mains.size;
    sub.querySelectorAll(".opt").forEach(o => o.hidden = !mains.has(o.dataset.base));
  }
  for (const sec of ["allies", "attack", "fxskill", "unit", "who", "what", "cond"]) {
    const n = GROUPS.filter(g => g.sec === sec).reduce((a, g) => a + picks(g.id).size, 0);
    const b = $(`#groups .ftabs button[data-sec="${sec}"] b`);
    if (b) b.textContent = n || "";
  }
  markAilValue();
  $("#filterCount").textContent = total - listPicks + (fxWords().length ? 1 : 0) || "";
  $("#listFilterCount").textContent = listPicks || "";
  $("#listFilterBtn").classList.toggle("has", listPicks > 0);
  markTagChips();
}

/* stay = a tab the user picked: no jump away from it */
function applyFilters(stay) {
  const q = state.q.trim().toLowerCase();
  const active = GROUPS.filter(g => !g.modifier && picks(g.id).size);
  const tagOnlyMods = state.mode === "subskills" && !active.some(g => g.tagGroup) && picks("scope").size;
  let shown = 0;
  const perTab = {};                          // sub skills: matches per list tab (search + filters)
  for (const u of items()) {
    let ok = (!q || u._search.includes(q)) && fxSearchOK(u);
    for (const g of active) { if (!ok) break; ok = g.match(u, picks(g.id)); }
    // scope/source picked without a tag: units with any tag there
    if (ok && tagOnlyMods) ok = [...effectsOf(u)].some(([, e]) => (e.scope || isHarm(e)) && scopeOK(e));
    if (ok && state.mode === "subskills") {
      perTab[u._tab] = (perTab[u._tab] || 0) + 1;
      ok = u._tab === state.stab;
    }
    u._el.hidden = !ok;
    if (ok) shown++;
  }
  // the open sub skill tab has no match but another has: open that one
  if (state.mode === "subskills" && !stay && !perTab[state.stab]) {
    const next = SUB_TABS.map(([t]) => t).find(t => perTab[t] && (t !== "etc" || state.showEtc));
    if (next) { setSubTab(next); return; }
  }
  $("#count").textContent = items().length ? shown : "";
  if (state.mode === "subskills") {
    // the top number: matches in every shown tab (each tab has its own number)
    $("#count").textContent = Object.entries(perTab).reduce((a, [t, n]) => a + (t !== "etc" || state.showEtc ? n : 0), 0);
    document.querySelectorAll("#subs [data-stab]").forEach(b => {
      const n = perTab[b.dataset.stab] || 0;
      b.querySelector("b").textContent = n;
      b.classList.toggle("none", !n);
    });
    document.querySelectorAll("#subs .sgroup").forEach(h => {
      const n = W._subs.filter(x => x._tab === h.dataset.t && x._grp === h.dataset.g && !x._el.hidden).length;
      h.hidden = !n;
      h.querySelector("b").textContent = n;
    });
  }
  const box = listBox();
  if (box && box.querySelector(".empty")) box.querySelector(".empty").hidden = shown > 0;
}

/* ---------------- text with values ---------------- */
const num = n => typeof n === "number" ? String(+n.toFixed(2)) : String(n);
/* skills: one value per level in the data (the game's formula, DATA.md "Game formulas");
   abilities: [Lv1, max] shown as "a→b" */
function atLevel(v, L) {
  if (!Array.isArray(v)) return v;
  if (!L) return v[0];
  return v[Math.min(L.lv, v.length) - 1];
}
function fmtVar(v, L) {
  if (Array.isArray(v)) return L ? num(atLevel(v, L)) : [...new Set(v.map(num))].join("→");
  if (v && typeof v === "object" && v.of) return `${(STAT[v.of] || [v.of, v.of])[isJa() ? 1 : 0]}×${fmtVar(v.v, L)}`;
  return num(v);
}
/* the values into the text: \u0005value\u0006 (rich() makes them bold) */
function fillVars(s, vars, L) {
  if (vars) for (const k of Object.keys(vars).sort((a, b) => b.length - a.length))
    s = s.split(k).join(`\u0005${fmtVar(vars[k], L)}\u0006`);
  return s;
}
function rich(s, vars, L) {
  let h = esc(fillVars(s, vars, L)).replace(/\u0005([^\u0006]*)\u0006/g, '<b class="v">$1</b>')
    .replace(/\u0001([^\u0002]*)\u0002/g, '<span class="df-new">$1</span>').replace(/\u0003([^\u0004]*)\u0004/g, '<span class="df-num">$1</span>');
  h = h.replace(/&lt;aw&gt;([\s\S]*?)&lt;\/aw&gt;/g, `<span class="aw" title="${esc(ui("awTip"))}">$1</span>`)
       .replace(/&lt;naw&gt;([\s\S]*?)&lt;\/naw&gt;/g, `<span class="naw" title="${esc(ui("nawTip"))}">$1</span>`)
       .replace(/&lt;t=(.*?)&gt;([\s\S]*?)&lt;\/t&gt;/g, (_, w, shown) => {
         const g = tx(`glossary.${w}.text`);
         return g ? `<span class="gls" title="${esc(g)}">${shown}</span>` : shown;
       });
  return h;
}
function tagChips(tags) {
  if (!tags || !tags.length) return "";
  const order = [...whatCats(), ...condCats()];
  const chips = new Map();                     // "id:scope" -> {id, scope, cat, marks}
  const add = (id, scope, mk) => {
    const cat = /^(el|tr):/.test(id) ? "who" : W._tagById[id]?.cat || "special";   // who: element / race
    if (cat === "unit") return;
    const k = `${id}:${scope || ""}`;
    if (!chips.has(k)) chips.set(k, { id, scope, cat, marks: new Set() });
    if (mk) chips.get(k).marks.add(mk);
  };
  for (const t of tags) {
    const [head, cond] = t.split("|");
    const [id, scope, mk] = head.split(":");
    add(id, scope, mk);
    for (const c of cond ? cond.split(",") : []) add(c);
  }
  const rank = c => (order.indexOf(c.cat) + 1 || 99) * 1000 + W.lookups.tags.findIndex(t => t.id === c.id);
  return `<div class="tags">${[...chips.values()].sort((a, b) => rank(a) - rank(b)).map(c => {
    const marks = ["pct", "flat"].filter(m => c.marks.has(m)).map(m => `<span class="mk" title="${esc(ui(m + "Tip"))}">${m === "pct" ? "%" : "+"}</span>`).join("");
    return `<button class="tag ${c.cat}" data-tag="${c.id}" data-cat="${c.cat}">${esc(tagName(c.id))}${marks}${c.scope ? `<small>${esc(ui(c.scope))}</small>` : ""}</button>`;
  }).join("")}</div>`;
}
/* Advanced filter records as chips (demo): effect name, then target / Who / chance small;
   a chip toggles that filter */
function fxChips(list, src, keepOrder) {
  if (!list || !list.length) return "";
  const byId = Object.fromEntries(W.lookups.traitTags.map(t => [t.id, t]));
  const order = W.lookups.traitTags.map(t => t.id), seen = new Set();
  const ail = new Set(Object.values(W.lookups.fxAilments || {}).flat());
  const parsed = list.map(r => parseFx(r, src));
  if (!keepOrder) parsed.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return `<div class="tags">${parsed.map(r => {
    const t = byId[r.id] || W._tagById[r.id], k = `${r.id}|${r.scope}|${r.who}|${r.build}|${r.chance}|${r.strength}`;
    if (!t || seen.has(k)) return ""; seen.add(k);
    // the real value in place of the texts' words: Stun build-up, chance %, poison strength
    const val = r.build != null ? `${ui("buildUp")} ${r.build}` : r.chance != null && r.chance < 100 ? `${r.chance}%` : "";
    const str = r.strength ? ui("ps_s" + r.strength) : "";
    const extra = (r.scope ? ` <small>${esc(ui(r.scope))}</small>` : "") + (r.who.length ? ` <small>${esc(r.who.map(whoLabel).join(", "))}</small>` : "")
      + (str ? ` <small>${esc(str)}</small>` : "") + (val ? ` <small>${esc(val)}</small>` : "")
      + (r.el ? ` <small>→ ${esc(term("elements", W.lookups.elements[r.el]))}</small>` : "")
      + (r.wx ? ` <small>→ ${esc(term("weather", W.lookups.weather[r.wx]))}</small>` : "")
      + (r.field ? ` <small>${esc(fieldText(r.field))}</small>` : "");
    const [cat, tag] = ail.has(r.id) ? ["fail", r.id] : optOf(r.id) || ["", ""];
    return `<button class="tag ttag ${r.blk}"${tag ? ` data-tag="${tag}" data-cat="${cat}"` : ""}>${esc(isJa() ? t.ja : t.en)}${extra}</button>`; }).join("")}</div>`;
}
/* a damage field's numbers (lookups.damageFields): damage per hit, how often, how long */
function fieldText(id) {
  const f = W.lookups.damageFields?.[id];
  if (!f) return "";
  const dmg = f.fixed ? `${f.fixed}` : f.rate ? `${f.rate}% ${ui("atk")}` : "";
  const t = n => `${+(n / 30).toFixed(2)}${ui("sec")}`;
  return [dmg && `${dmg} / ${t(f.every)}${f.hit === 3 ? ` ${ui("trueDmg")}` : ""}`, f.lasts > 0 ? t(f.lasts) : ""].filter(Boolean).join(" · ");
}
/* sub skill: who it works for, one line per kind; a chip toggles that filter */
function worksHTML(x) {
  const L = W.lookups, kinds = W_KINDS.filter(k => x._for[k]);
  if (!kinds.length) return "";
  const chip = e => {
    const [d, v] = e.split(":");
    if (d === "class") { const f = classFamiliesOf(v)[0];
      return `<button class="wchip" data-wg="class" data-wv="${v}"><img src="img/class/${f}.webp" alt="">${esc(term("classes", W.classes[f].name))}</button>`; }
    if (d === "weapon") { const f = Object.keys(W.classes).find(k => String(W.classes[k].weapon) === v);
      return `<button class="wchip" data-wg="weapon" data-wv="${v}"><img src="img/weapon/${v}.webp" alt="">${esc(term("weapons", L.weapons[v]))}</button>`; }
    if (d === "element") return `<button class="wchip" data-wg="welement" data-wv="${v}"><img src="img/element/${v}.webp" alt="">${esc(term("elements", L.elements[v]))}</button>`;
    if (d === "rarity") return `<button class="wchip" data-wg="wrarity" data-wv="${v}"><img src="img/rarity/${v}.webp" alt=""></button>`;
    return `<button class="wchip txt" data-wg="wtrait" data-wv="${v}">${esc(term("traits", L.traits[v]) || v)}</button>`;
  };
  return `<div class="works">${kinds.map(k => `<span class="wk ${k}" title="${esc(ui("wkindTip_" + k))}"><b>${esc(ui("wk_" + k))}</b>${[...x._for[k]].map(chip).join("")}</span>`).join("")}</div>`;
}
function markTagChips() {
  document.querySelectorAll("#detail .tag[data-tag]").forEach(b => b.classList.toggle("on", picks(b.dataset.cat).has(b.dataset.tag)));
  document.querySelectorAll("#detail .wchip").forEach(b => b.classList.toggle("on", picks(b.dataset.wg).has(b.dataset.wv)));
}

/* ---------------- the unit page ----------------
   head: face | name, title, icons, chips, skins, class slider | awakening (one per row)
   tabs: Details (left: race trait, class trait of the slider's tier, ACT; right: skills with
   the level slider; then the personal weapon, full width) | Profile */
const sec = s => `${s}${ui("sec")}`;
const MAX_LV = 5, TIERS = 5;
function skillCard(sid, n) {
  const s = W.skills[sid];
  if (!s) return "";
  const L = { lv: Math.min(state.slv[sid] ?? state.lv, s.maxLevel), max: s.maxLevel };
  const meta = [];
  if (s.cooldown) meta.push(metaVal("cd", sec(fmtVar(s.cooldown, L))));
  if (s.duration && fmtVar(s.duration, L) !== "0") meta.push(metaVal("dur", sec(fmtVar(s.duration, L))));
  if (s.cost) meta.push(`<span>${ui("cost")} <b>${fmtVar(s.cost, L)}</b></span>`);
  const oc = s.oc ? `<div class="sub-block head"><span class="kind oc">OC</span><span class="meta" style="margin-left:0">${metaVal("cd", sec(fmtVar(s.oc.cooldown, L)))}</span></div>` : "";
  return `<div class="card" data-skill="${sid}" data-n="${n}"><div class="head"><span class="kind k${n}">${ui("skill")} ${n}</span>
    <span class="name">${esc(tx(`skill.${sid}.name`))}</span><span class="meta">${meta.join("")}</span>${lvControl(L)}</div>
    <div class="desc">${rich(tx(`skill.${sid}.text`), s.vars, L)}</div>${oc}${fxChips(s.fx, "skill")}</div>`;
}
function skillsHTML(u) { return u.skills.map((sid, i) => skillCard(sid, i + 1)).join(""); }
/* cooldown / duration in card heads: an icon (the word as its tip) and the value (owner, session 10) */
const META_SVG = {
  cd: '<path d="M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3h-3M10 7v3.2l2 1.6"/>',                  // clock + arrow round
  dur: '<path d="M6 3h8M6 17h8M7 3v2.5c0 1.8 3 3 3 4.5s-3 2.7-3 4.5V17M13 3v2.5c0 1.8-3 3-3 4.5s3 2.7 3 4.5V17"/>',   // hourglass
};
function metaVal(k, v) {
  return `<span title="${esc(ui(k))}"><svg class="m-ic" viewBox="0 0 20 20" aria-label="${esc(ui(k))}">${META_SVG[k]}</svg><b>${v}</b></span>`;
}
/* skill level in the skill card's head (owner, session 10): − Lv n +, one per skill */
function lvControl(L) {
  if (L.max < 2) return "";
  return `<span class="lvctl"><button data-lvstep="-1"${L.lv <= 1 ? " disabled" : ""} aria-label="level down">−</button><span
    class="lv-n">${ui("lv")} ${L.lv}</span><button data-lvstep="1"${L.lv >= L.max ? " disabled" : ""} aria-label="level up">+</button></span>`;
}
function setSkillLv(card, lv) {
  const sid = card.dataset.skill;
  state.slv[sid] = Math.max(1, Math.min(W.skills[sid].maxLevel, lv));
  card.outerHTML = skillCard(sid, +card.dataset.n);
  markTagChips();
}
function raceCard(u) {
  const key = `race:${u.race}`, a = W.abilities[key] || {};
  const bonus = tx(`race.${u.race}.bonus`);
  return `<div class="card"><div class="head"><span class="kind race">${ui("race")}</span>
    <span class="name">${esc(tx(`race.${u.race}.name`))}</span></div>
    <div class="desc">${rich(tx(`race.${u.race}.text`), a.vars)}</div>
    ${bonus ? `<div class="bonus"><span class="lbl">${ui("awBonus")}</span><span>${rich(bonus, a.vars)}</span></div>` : ""}
    ${fxChips(u.fx?.race, "trait")}</div>`;
}
function actCard(u) {
  const word = u._fam.act;
  if (!word) return "";
  const t = tierOf(u);
  const dur = t.act ? t.act.duration : null;
  const curse = u.curse ? `<div class="sub-block"><span class="kind curse">${ui("curse")}</span>
    <div class="desc">${rich(tx(`curse.${u.curse}.text`), (W.abilities[`curse:${u.curse}`] || {}).vars)}</div></div>` : "";
  return `<div class="card"><div class="head"><span class="kind act">ACT</span>
    <span class="name">${esc(term("glossary", word))}</span>
    ${dur ? `<span class="meta">${metaVal("dur", sec(dur))}</span>` : ""}</div>
    <div class="desc">${rich(tx(`glossary.${word}.text`))}</div>${curse}</div>`;
}
function weaponCard(u) {
  if (!u.weapon) return "";
  const a = W.abilities[`weapon:${u.weapon.ability}`] || {};
  return `<div class="card weapon-card"><img src="img/uw/${u.weapon.ability}.webp" alt="" onerror="this.remove()"><div>
    <div class="head"><span class="kind weapon">${ui("weapon")}</span><span class="name">${esc(tx(`weapon.${u.id}.name`))}</span>
    <span class="meta"><span><b>${u.weapon.levels}</b> ${ui("levels")}</span></span></div>
    <div class="desc">${rich(tx(`weapon.${u.id}.text`), a.vars)}</div>${fxChips(u.fx?.weapon, "weapon")}</div></div>`;
}
/* class trait lines: a line that goes on ("…し、" / "…, and") joins the next, the rest stay lines;
   tails[i] goes after line i (after the join is decided) */
function joinLines(lines, tails = []) {
  return lines.reduce((out, l, i) => {
    l += tails[i] || "";
    if (!i) return l;
    const prev = lines[i - 1].trim();
    return out + (/[、,;:]$|\band$/.test(prev) ? (isJa() ? "" : " ") : "\n") + l;
  }, "");
}
function tierOf(u) { const t = u._fam.tiers; return t[Math.min(state.tier, t.length) - 1]; }
/* flying units can't block: the game shows block 0 (checked in game on Ateel and Argyro, session 5) */
const blockOf = (u, t) => u.move === "Fly" ? 0 : t.block;
const targetsTxt = n => n < 0 ? "—" : n;                  // -1 = no normal attack (Supporter)
function classCard(u) {
  const t = tierOf(u), prev = t === u._fam.tiers[0] ? null : u._fam.tiers[0];   // always against tier 1 (owner)
  // a value no number in the text shows (build: tier.hidden, line -> ["-50%"]) goes after its line,
  // as \u0007a\u0007 … until rich() has run (letters: the diff takes digits for numbers)
  const hv = [];
  const linesOf = (x, mark) => {
    const lines = [], tails = [];
    for (let i = 1; W.text[`class.${x.id}.${i}`]; i++) {
      lines.push(tx(`class.${x.id}.${i}`));
      const h = mark && x.hidden?.[i];
      if (h) { tails[i - 1] = ` \u0007${String.fromCharCode(97 + hv.length)}\u0007`; hv.push(h); }
    }
    return joinLines(lines, tails).split("\n").map(l => fillVars(l, x.vars));
  };
  const cur = linesOf(t, true), before = prev && linesOf(prev);
  // what changed from tier 1 (owner, session 10): new wording red, changed numbers yellow
  const text = (before ? cur.map(l => diffLine(l, before.join("\n"))) : cur).join("\n");
  const val = (v, pv) => `<b${prev && String(v) !== String(pv) ? ' class="df-num"' : ""}>${v}</b>`;
  const stats = [`<span${u.move === "Fly" ? ` title="${esc(ui("flyBlockTip"))}"` : ""}>${ui("block")} ${val(blockOf(u, t), prev && blockOf(u, prev))}</span>`,
    `<span>${ui("targets")} ${val(targetsTxt(t.targets), prev && targetsTxt(prev.targets))}</span>`];
  if (t.range) stats.push(`<span>${ui("range")} ${val(t.range, prev?.range)}</span>`);
  return `<div class="card"><div class="head"><span class="kind cls">${ui("clsTrait")}</span>
    <span class="tierno">${t.tier}</span><span class="name">${esc(term("classes", t.name))}</span>
    <span class="meta">${stats.join("")}</span></div>
    <div class="desc">${rich(text).replace(/\u0007([a-z])\u0007/g, (_, c) =>
      `<span class="hv" title="${esc(ui("hiddenTip"))}">${hv[c.charCodeAt(0) - 97].map(esc).join(" ")}</span>`)}</div></div>`;
}
/* one line against tier 1's text (owner, session 10): the line splits into clauses (at
   "; ", ", and", ", but", "、" …); a clause tier 1 has (numbers aside, any case) stays, with
   the numbers that changed yellow. A clause it doesn't have splits by its numbers: the text pieces
   tier 1 doesn't have are red; a number between two old pieces is yellow when it changed,
   one next to new text is red (kept when the text after it shows the same number before). A new
   text piece at least half like one of tier 1's (words in common, in order): only the
   words that differ are red (Small → Medium: only "Medium").
   Marks: \u0001 red \u0002, \u0003 yellow \u0004 (rich() turns them into spans) */
const DIFF_SPLIT = /( ?\u0007[a-z]\u0007|;\s*|、|。|,\s+(?:and\s+|but\s+|plus\s+)?)/;   // hidden-value marks split too
const DIFF_NUM = /(\u0005[^\u0006]*\u0006|\d+(?:\.\d+)?)/;
const DIFF_WORD = /<[^>]*>|[A-Za-z']+|\s+|[\s\S]/g;
function lcsPairs(A, B) {                    // pair[i] = the index in B that A[i] matches, or -1
  const n = A.length, m = B.length, d = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  const eq = (a, b) => a.toLowerCase() === b.toLowerCase();
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    d[i][j] = eq(A[i], B[j]) ? d[i + 1][j + 1] + 1 : Math.max(d[i + 1][j], d[i][j + 1]);
  const pair = new Array(n).fill(-1);
  for (let i = 0, j = 0; i < n && j < m;) {
    if (eq(A[i], B[j])) pair[i++] = j++; else if (d[i + 1][j] >= d[i][j + 1]) i++; else j++;
  }
  return pair;
}
/* a new text piece against tier 1's pieces: only the differing words red, or null when no
   piece is at least half alike */
function wordDiff(x, pieces) {
  const A = x.match(DIFF_WORD) || [], solid = t => !/^\s+$/.test(t) && !t.startsWith("<");
  const total = A.filter(solid).length;
  if (total < 2) return null;
  let best = 0, pair = null;
  for (const p of pieces) {
    const pr = lcsPairs(A, p.match(DIFF_WORD) || []);
    const score = A.filter((t, i) => pr[i] >= 0 && solid(t)).length / total;
    if (score > best) { best = score; pair = pr; }
  }
  if (best < .5) return null;
  let out = "", run = "", gap = "";
  const close = () => { if (run) out += `\u0001${run}\u0002`; run = ""; out += gap; gap = ""; };
  A.forEach((t, i) => {
    if (/^\s+$/.test(t)) { if (run) gap += t; else out += t; return; }
    if (pair[i] >= 0 || t.startsWith("<")) { close(); out += t; return; }
    run += gap + t; gap = "";
  });
  close();
  return out;
}
function diffLine(line, beforeText) {
  const num = DIFF_NUM.source, low = beforeText.toLowerCase();
  const pieces = beforeText.split("\n").flatMap(l => l.split(DIFF_SPLIT).filter((_, i) => !(i % 2)))
    .flatMap(c => c.split(DIFF_NUM).filter((_, i) => !(i % 2))).filter(p => p.trim());
  const bare = n => n.replace(/[\u0005\u0006]/g, "");
  const lit = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const find = re => beforeText.match(new RegExp(re, "i"));
  const red = x => x.split(/(<[^>]*>)/).map((y, i) => i % 2 || !y.trim() ? y : `\u0001${y}\u0002`).join("");
  const yellowIf = (x, was) => bare(was) === bare(x) ? x : `\u0003${x}\u0004`;
  return line.split(DIFF_SPLIT).map((b, i) => {
    if (i % 2 || !b.trim()) return b;                          // a separator
    const parts = b.split(DIFF_NUM);                           // text, number, text, …
    const m = find(parts.map((x, j) => j % 2 ? num : lit(x)).join(""));
    if (m) { let k = 0; return parts.map((x, j) => j % 2 ? yellowIf(x, m[++k]) : x).join(""); }
    const known = parts.map((x, j) => j % 2 || !x.trim() || low.includes(x.toLowerCase()));
    let lastRed = false;                                       // a unit after a new number ("10s") is new too
    return parts.map((x, j) => {
      if (!(j % 2)) return known[j] && !(lastRed && x.trim().length <= 2) ? x
        : lastRed || known[j] ? red(x) : wordDiff(x, pieces) ?? red(x);
      lastRed = false;
      const L = parts[j - 1], R = parts[j + 1];
      if (known[j - 1] && known[j + 1]) {
        const mm = find(lit(L) + num + lit(R));
        if (mm) return yellowIf(x, mm[1]);
      } else if (known[j + 1] && R.trim()) {
        const mm = find(num + lit(R));
        if (mm && bare(mm[1]) === bare(x)) return x;
      }
      lastRed = true;
      return red(x);
    }).join("");
  }).join("");
}
/* the stat panel like the game's 潜在覚醒 view: Lv. Max = the last class tier at max level with
   every awakening node; Lv. 1 = class 1, level 1, no awakening (both without equipment, sub
   skills and personal weapon). Checked against the game (Elenoire, session 5). */
const CRIT = { crit: [0, 50], critDmg: [150, 300] };   // CharacterDataBase defaults: base, cap (%)
function awakenSum(u) {
  const s = {};
  for (const a of u.awakening)
    for (const [k, v] of Object.entries(W.abilities[`awaken:${a.ability}`]?.stats || {})) s[k] = (s[k] || 0) + v;
  return s;
}
/* Stats tab (owner, session 10): the Muv-Luv wiki's stat card: icon, name, big number per row;
   Lv. Max / Lv. 1 in the head; session 12: one column, the percentiles beside it */
const STAT_SVG = {
  hp: '<path d="M10 17s-6-3.8-6-8.2A3.3 3.3 0 0 1 10 6.6a3.3 3.3 0 0 1 6 2.2C16 13.2 10 17 10 17z"/>',
  atk: '<path d="M4 4l8 8M4 4h3l7 7-3 3-7-7zM12 16l4-4M14 14l3 3"/>',
  def: '<path d="M10 3l6 2v5c0 4-3 6.5-6 7.5C7 16.5 4 14 4 10V5z"/>',
  mdef: '<path d="M10 3l6 2v5c0 4-3 6.5-6 7.5C7 16.5 4 14 4 10V5z"/><path d="M10 7.2l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
  crit: '<path d="M10 2l1.6 5.4L17 9l-5.4 1.6L10 16l-1.6-5.4L3 9l5.4-1.6z"/>',
  critDmg: '<path d="M8 2.5l1.3 4.2 4.2 1.3-4.2 1.3L8 13.5 6.7 9.3 2.5 8l4.2-1.3z"/><path d="M15 12v6M12 15h6"/>',
  range: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3.5"/><circle cx="10" cy="10" r=".6"/>',
  aspd: '<path d="M3 6h7M2 10h9M3 14h7M12 5l5 5-5 5"/>',
};
/* one fight stat as the panel shows it: Lv. Max (last tier, max level, awakening) or Lv. 1 */
function coreStat(u, k, max) {
  const ti = max ? u._fam.tiers.length - 1 : 0, base = u.stats[k][ti][max ? 1 : 0];
  const aw = max ? (u._aw ||= awakenSum(u)) : {};
  let v = base, tip = "";
  if (k === "hp" && aw.hpRate) { v = Math.floor(base * (100 + aw.hpRate) / 100); tip = `${ui("hp")}: ${base} × ${1 + aw.hpRate / 100}`; }
  if (aw[k]) { tip = [tip || `${ui(k)}: ${base}`, `+ ${ui("awakening").toLowerCase()} ${aw[k]}`].join(" "); v += aw[k]; }
  return { v, tip };
}
/* percentiles (owner, session 12: the Muv-Luv wiki's): the share of the other units compared
   that the unit is higher than or equal to, and the rank (1 + how many are higher; ties share it) */
const PCT_KEYS = ["hp", "atk", "def", "mdef"];
const FIGHT_KEYS = [...PCT_KEYS, "crit", "critDmg", "range", "aspd"];
function percentile(u, k, max, units) {
  const v = coreStat(u, k, max).v, others = units.filter(x => x !== u);
  const vals = others.map(x => coreStat(x, k, max).v);
  const rank = 1 + vals.filter(x => x > v).length;
  if (!others.length) return { p: 100, n: 0, rank, of: 1 };
  return { p: Math.round(vals.filter(x => x <= v).length / others.length * 100), n: others.length, rank, of: others.length + 1 };
}
function pctCard(u, max) {
  const scope = state.pscope || "all";
  const units = W.units.filter(x => scope === "base" ? x._base === u._base : scope === "class" ? x.class === u.class
    : scope === "rarity" ? x._rar === u._rar : true);
  const base = classFamiliesOf(u._base)[0];
  const t = u._fam.tiers[max ? u._fam.tiers.length - 1 : 0];
  const rarName = term("rarities", Object.values(W.lookups.rarity).find(r => r.code === u._rar)?.name);
  const chip = (v, inner, tip) => `<button data-pscope="${v}"${scope === v ? ' class="on"' : ""} title="${esc(tip)}">${inner}</button>`;
  // one row per stat row beside it (owner: lined up like the Muv-Luv wiki); crit rows stay empty
  const row = k => {
    if (!PCT_KEYS.includes(k)) return `<div class="st-row pc-row empty"></div>`;
    const { p, n, rank, of } = percentile(u, k, max, units);
    return `<div class="st-row pc-row" title="${esc(`${ui(k)}: ` + ui("pctTip").replace("{p}", p).replace("{n}", n))}"><span class="pbar"><i style="width:${p}%"></i></span>
      <span class="pc-p">${p}%</span><span class="pc-rank" title="${esc(ui("rankTip"))}">#${rank} <small>/ ${of}</small></span></div>`;
  };
  return `<div class="card st-card pc-card"><div class="st-head"><span class="pc-lbl">${ui("compareWith")}</span><div class="stv">
      ${chip("all", ui("allUnits"), ui("allUnits"))}
      ${chip("base", `<img src="img/class/${base}.webp" alt="">`, `${ui("sameBase")}: ${term("classes", W.classes[base].name)}`)}
      ${chip("class", `<img src="img/weapon/${u._weapon}.webp" alt="">`, `${ui("sameClass")}: ${term("classes", t.name)} · ${term("weapons", W.lookups.weapons[u._weapon])}`)}
      ${chip("rarity", `<img src="img/rarity/${u._rar}.webp" alt="">`, `${ui("sameRarity")}: ${rarName}`)}</div></div>
    ${FIGHT_KEYS.map(row).join("")}</div>`;
}
function statPanel(u) {
  const max = state.stv !== "lv1";
  const ti = max ? u._fam.tiers.length - 1 : 0, t = u._fam.tiers[ti], st = u.stats;
  const aw = max ? (u._aw ||= awakenSum(u)) : {};
  const plus = (base, k, label) => aw[k] ? `${label}: ${base} + ${ui("awakening").toLowerCase()} ${aw[k]}` : "";
  const big = v => typeof v === "number" ? v.toLocaleString("en-US") : v;
  const cell = (k, value, tip = "") => `<div class="st-row"${tip ? ` title="${esc(tip)}"` : ""}><svg class="st-ic" viewBox="0 0 20 20"
    aria-hidden="true">${STAT_SVG[k]}</svg><span class="st-name">${ui(k)}</span><span class="st-val">${big(value)}</span></div>`;
  const core = k => { const { v, tip } = coreStat(u, k, max); return cell(k, v, tip); };
  const range = t.range ? t.range + (aw.range || 0) : "—";
  const crit = CRIT.crit[0] + (aw.crit || 0), critDmg = CRIT.critDmg[0] + (aw.critDmg || 0) - 100;
  const capTip = ui("capTip").replace("{cap}", `${CRIT.crit[1] + (aw.critMax || 0)}%`);
  const tabs = ["max", "lv1"].map(k => `<button data-stv="${k}"${(k === "max") === max ? ' class="on"' : ""}>${ui("stv_" + k)}</button>`).join("");
  const note = ui(max ? "stvTipMax" : "stvTip1").replace("{max}", st.maxLevel).replace("{cls}", term("classes", t.name));
  // fight stats | their percentiles side by side (session 12, owner); targets, block, cost, redeploy and
  // movement are in the head (owner: not here)
  return `<div class="st-top"><div class="card st-card st-fight"><div class="st-head"><div class="stv">${tabs}</div></div>
      ${core("hp")}${core("atk")}${core("def")}${core("mdef")}
      ${cell("crit", `+${crit}%`, capTip)}${cell("critDmg", `+${critDmg}%`, ui("critDmgTip"))}
      ${cell("range", range, plus(t.range, "range", ui("range")))}${cell("aspd", t.aspd + (aw.aspd || 0), plus(t.aspd, "aspd", ui("aspd")))}
    </div>${pctCard(u, max)}</div><p class="stats-note">${esc(note)}</p>`;
}
function awakeningList(u) {
  if (!u.awakening.length) return "";
  return `<div class="awk"><div class="awk-h">${ui("awakening")}</div>${u.awakening.map((a, i) =>
    `<div class="awk-row"><span class="n">${i + 1}</span><span>${esc(tx(`awaken.${a.ability}.name`))}</span></div>`).join("")}${
    u.fx?.awaken ? awakenChips(u) : ""}</div>`;   // the nodes' effects: one row under the list (owner)
}
function profileCard(u) {
  const p = tx(`unit.${u.id}.profile`);
  const person = v => v === "不明" ? ui("unknown") : v === "なし" ? ui("nothing") : v;
  const sp = W.lookups.species[u.species];
  return `<div class="card profile">${p ? `<p>${esc(p)}</p>` : ""}<dl>
    ${sp ? `<dt>${ui("species")}</dt><dd>${esc(term("species", sp))}</dd>` : ""}
    <dt>${ui("illustrator")}</dt><dd>${esc(person(u.illustrator) || "—")}</dd>
    <dt>${ui("cv")}</dt><dd>${esc(person(u.cv) || "—")}</dd></dl></div>`;
}
/* skins: ‹ n/N › on the face (owner, session 5: no picture row) */
function skinNav(u) {
  if (u.skins.length < 2) return "";
  const res = state.skin || u._res;
  const i = Math.max(0, u.skins.findIndex(s => s.resource === res));
  return `<div class="skin-nav"><button data-skin="-1" aria-label="previous skin">‹</button>
    <span>${i + 1}/${u.skins.length}</span><button data-skin="1" aria-label="next skin">›</button></div>`;
}
/* Art tab (session 11): the full art as a still picture, img/art/<res>.webp (`py -m wikitool arts`:
   the first frame of the game's Spine full art, the R18 build's art where the game swaps it,
   720 px tall). Shown at its own pixel size (Windows scaling would otherwise enlarge it), never
   wider than the page. The Spine animation version is kept in archive/spine-art/. */
function artHTML(u) {
  const res = state.skin || u._res;
  return `<img class="art-img" src="img/art/${res}.webp" alt="" onload="this.style.width = this.naturalWidth / (window.devicePixelRatio || 1) + 'px'"
    onerror="this.outerHTML = '<div class=&quot;art-msg&quot;>${esc(ui("artNone"))}</div>'">`;
}
const UNIT_TABS = ["details", "class", "stats", "profile", "art"];
const TAB_LABEL = { details: "detailsTab", class: "clsTrait", stats: "stats", profile: "profile", art: "artTab" };

function renderUnit(u) {
  const L = W.lookups;
  const res = state.skin || u._res;
  const fam = u._fam, top = fam.tiers[fam.tiers.length - 1];
  const traits = u.traits.map(t => `<button class="tag trait" data-trait="${t}">${esc(term("traits", L.traits[t]))}</button>`).join("");
  const line = (k, v, wrap) => `<div class="il"><span class="k">${k}</span><span class="v${wrap ? " wrap" : ""}">${v}</span></div>`;
  // three rows, three columns (owner: the head no taller than the picture, session 10: the numbers
  // as lines too; Type and Attack go onto a second line when they don't fit): Class | Attack | Cost, Weapon | Targets | Redeploy, Type (race trait) | Movement |
  // Block; the collab title on the name row
  const [cost, redeploy, block] = keyStats(u, line);
  const mv = u.move === "Normal" ? "Ground" : u.move;
  const lines = [
    line(ui("cls"), `<img src="img/class/${u.class}.webp" alt="">${esc(term("classes", top.name))}`),
    line(ui("attack"), `<span title="${esc(ui("hitTip_" + u.hit))}">${esc(ui("hit_" + u.hit))}</span><span class="dot">·</span>
      <span title="${esc(ui("plTip_" + u._place))}">${esc(ui("pl_" + u._place))}</span>`, true), cost,
    line(ui("weaponType"), `<img src="img/weapon/${fam.weapon}.webp" alt="">${esc(term("weapons", L.weapons[fam.weapon]))}`),
    line(ui("targets"), `${targetsTxt(top.targets)}`), redeploy,
    line(ui("type"), traits || "—", true),
    line(ui("move"), `<span title="${esc(ui("mvTip_" + mv))}">${esc(ui("mv_" + mv))}</span>${u.move !== "Fly" && u._flies
      ? `<span class="dot">·</span><span title="${esc(ui("flyTrait"))}">${esc(ui("mv_Fly"))}</span>` : ""}`), block,
  ].join("");
  if (!UNIT_TABS.includes(state.tab)) state.tab = "details";
  const details = `<div class="det-tab"><div class="cols">
      <div class="col">${raceCard(u)}</div>
      <div class="col" id="skillBox">${skillsHTML(u)}</div></div>
    ${weaponCard(u)}</div>`;
  const cls = `<div class="cls-tab"><div class="tier-btns" id="tierBtns">${tierButtons(u)}</div>
    <div id="classBox">${classCard(u)}${actCard(u)}</div></div>`;
  const stats = `<div class="stats-tab"><div id="statsBox">${statPanel(u)}</div></div>`;
  const tabs = { details, class: cls, stats, profile: profileCard(u), art: `<div class="art-tab" id="artBox">${artHTML(u)}</div>` };
  $("#detail").innerHTML = `
    <div class="summary unit-head"><div class="face-wrap">${faceHTML(u, res, true)}${skinNav(u)}</div><div class="info">
      <div class="h-row"><h2><span class="nm">${esc(unitName(u))}</span><img class="h-el" src="img/element/${u.element}.webp" alt="" title="${esc(term("elements", L.elements[u.element]))}">${isJa() ? "" : `<span class="ruby">${esc(u.name)}</span>`}</h2>${u.collab
        ? `<span class="h-collab" title="${esc(ui("collab"))}">${esc(term("collabs", u.collab))}</span>` : ""}</div>
      <div class="sub">${esc(tx(`unit.${u.id}.title`))}</div>
      <div class="ilines">${lines}</div></div>
      ${awakeningList(u)}</div>
    <nav class="tabs">${UNIT_TABS.map(k => `<button data-tab="${k}">${ui(TAB_LABEL[k])}</button>`).join("")}</nav>
    ${UNIT_TABS.map(k => `<div id="tab_${k}"${state.tab === k ? "" : " hidden"}>${tabs[k]}</div>`).join("")}`;
  markTabs();
  markTagChips();
  markSearch();
  fitAwk();
}
/* the Advanced filter's search words, marked in the unit page's skill / trait / weapon text */
function markSearch() {
  const box = $("#detail");
  if (!box) return;
  box.querySelectorAll("mark.fxm").forEach(m => m.replaceWith(m.textContent));
  box.normalize();
  const words = fxWords();
  if (!words.length || state.mode !== "units") return;
  const re = new RegExp(words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi");
  for (const d of box.querySelectorAll(".desc, .card .name")) {
    const walk = document.createTreeWalker(d, NodeFilter.SHOW_TEXT), nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    for (const n of nodes) {
      if (!re.test(n.data)) continue;
      re.lastIndex = 0;
      const span = document.createElement("span");
      span.innerHTML = esc(n.data).replace(re, m => `<mark class="fxm">${m}</mark>`);
      n.replaceWith(...span.childNodes);
    }
  }
}
/* head: deploy cost, redeploy time, block as head lines (owner, session 10: no boxes); "a → b" =
   before → after awakening */
function keyStats(u, line) {
  const aw = awakenSum(u), h = u.head || {};
  const pair = (label, base, after, fmt, tip) => line(label, `<span class="num" title="${esc(tip)}">${fmt(base)}${
    after !== base ? `<i>→</i><em>${fmt(after)}</em>` : ""}</span>`);
  // left: unit + class + the race trait (always there); → with awakening and the personal weapon
  // (both have to be earned)
  const tc = h["trait.cost"] || 0, wc = h["weapon.cost"] || 0;
  const cost = u._deploy + tc, costAw = cost + wc + (aw.cost || 0) + (h["trait.cost.aw"] || 0);
  const costTip = [ui("deployTip"), tc && `${ui("headTrait")} ${tc > 0 ? "+" : ""}${tc}`, wc && `${ui("headWeapon")} ${wc > 0 ? "+" : ""}${wc}`,
    costAw !== cost && `→ ${ui("headAwaken")} / ${ui("headWeapon")}`].filter(Boolean).join(", ");
  // redeploy: the game keeps only the biggest cut (TalentOption TimeShortening = Max; Game formulas)
  const rd = Math.round(u.redeploy * 10) / 10;
  const cuts = [["headAwaken", aw.redeployPct], ["headTrait", h["trait.redeployPct"]], ["headWeapon", h["weapon.redeployPct"]]].filter(c => c[1]);
  const base = h["trait.redeployPct"] || 0, all = Math.max(base, h["weapon.redeployPct"] || 0, aw.redeployPct || 0);
  const rdTip = cuts.length ? cuts.map(([k, v]) => `${ui(k)} −${v}%`).join(", ") + (cuts.length > 1 ? ` (${ui("redeployMax")})` : "") : ui("redeploy");
  return [pair(ui("costShort"), cost, costAw, v => v, costTip),
    pair(ui("redeploy"), num(rd * (100 - base) / 100), num(rd * (100 - all) / 100), v => v, rdTip),
    headBlock(u, u._fam.tiers[u._fam.tiers.length - 1], pair)];
}
/* the awakening nodes' chips under the awakening list: one row (owner); her own stat buffs last,
   the ones that don't fit go into "+n" (fitAwk) */
function awakenChips(u) {
  const recs = u.fx.awaken.map(r => [r, parseFx(r, "awaken")]);
  const own = p => ["t_atk", "t_def"].includes(p.blk) && p.scope === "self";
  recs.sort((a, b) => own(a[1]) - own(b[1]));
  const html = fxChips(recs.map(x => x[0]), "awaken", true);
  return html.replace('<div class="tags">', '<div class="tags awk-tags">').replace(/<\/div>$/, '<span class="awk-more" hidden></span></div>');
}
/* one row: hide the chips that don't fit (from the end), "+n" names them */
function fitAwk() {
  const el = $("#detail .awk-tags");
  if (!el) return;
  const chips = [...el.querySelectorAll(".tag")], more = el.querySelector(".awk-more");
  chips.forEach(c => c.hidden = false); more.hidden = true;
  const hidden = [];
  while (el.scrollWidth > el.clientWidth + 1 && hidden.length < chips.length - 1) {
    const c = chips[chips.length - 1 - hidden.length];
    c.hidden = true; hidden.unshift(c.textContent.replace(/\s+/g, " ").trim());
    more.hidden = false; more.textContent = `+${hidden.length}`; more.title = hidden.join(", ");
  }
}
window.addEventListener("resize", () => fitAwk());
/* the head's block: the class's (flying: 0), the race trait's / weapon's always-on change (a fixed
   value replaces, a bonus adds); → with the awakened bonus */
function headBlock(u, top, pair) {
  const h = u.head || {}, cls = blockOf(u, top);
  if (u.move === "Fly") return pair(ui("block"), 0, 0, v => v, ui("flyBlockTip"));
  const fixed = h["trait.blockFixed"] ?? h["weapon.blockFixed"];
  const b = (fixed ?? cls) + (h["trait.block"] || 0);
  const a = b + (h["weapon.block"] || 0) + (h["trait.block.aw"] || 0) + (h["weapon.block.aw"] || 0);
  const tip = [`${ui("cls")} ${cls}`, fixed != null && `${ui("headTrait")} = ${fixed}`, h["trait.block"] && `${ui("headTrait")} +${h["trait.block"]}`,
    h["weapon.block"] && `→ ${ui("headWeapon")} +${h["weapon.block"]}`, (h["trait.block.aw"] || h["weapon.block.aw"]) && `→ ${ui("afterAwaken")}`].filter(Boolean).join(", ");
  return pair(ui("block"), b, a, v => v, tip);
}
/* class tiers as buttons, 1 → 5 left to right; the last one is the default */
function tierButtons(u) {
  const cur = Math.min(state.tier, u._fam.tiers.length);
  return u._fam.tiers.map(t => `<button data-tier="${t.tier}"${t.tier === cur ? ' class="on"' : ""}>${esc(term("classes", t.name))}</button>`).join("");
}
function markTabs() {
  document.querySelectorAll("#detail .tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === state.tab));
}
$("#detail").onclick = e => {
  const step = e.target.closest("[data-lvstep]");
  if (step) {                                 // skill level − / +
    const card = step.closest(".card[data-skill]");
    return setSkillLv(card, (state.slv[card.dataset.skill] ?? state.lv) + +step.dataset.lvstep);
  }
  const jb = e.target.closest(".jp-btn");
  if (jb) {                                   // stays on across sub skills until turned off
    state.jp = !state.jp;
    jb.classList.toggle("on", state.jp);
    jb.nextElementSibling.hidden = !state.jp;
    return;
  }
  const ct = e.target.closest(".craft-toggle");
  if (ct) {
    const box = ct.nextElementSibling;
    box.hidden = !box.hidden;
    ct.textContent = `${ui(box.hidden ? "showRecipe" : "hideRecipe")} ${box.hidden ? "▾" : "▴"}`;
    return;
  }
  const pt = e.target.closest("[data-ptab]");
  if (pt) {
    state.ptab = pt.dataset.ptab;
    document.querySelectorAll("#detail .ptabs button").forEach(b => b.classList.toggle("on", b === pt));
    document.querySelectorAll("#detail [data-pgroup]").forEach(g => g.hidden = g.dataset.pgroup !== state.ptab);
    return;
  }
  const rq = e.target.closest(".req[data-req]");
  if (rq) {
    const box = rq.closest(".pz-body").querySelector(".req-box");
    const same = rq.classList.contains("on");
    rq.closest(".pz-req").querySelectorAll(".req").forEach(b => b.classList.remove("on"));
    if (same) { box.hidden = true; return; }
    rq.classList.add("on");
    box.innerHTML = reqCard(W._subById[+rq.dataset.req]);
    box.hidden = false;
    return;
  }
  const un = e.target.closest("[data-unit]");
  if (un) { state.sel = +un.dataset.unit; state.skin = null; setMode("units"); return; }
  const dl = e.target.closest("[data-dungeon]");
  if (dl) { state.dsel = +dl.dataset.dungeon; state.dtab = W.sources.dungeons[state.dsel]?.type; buildDungeons(); setMode("dungeons"); return; }
  const sl = e.target.closest("[data-sub]");
  if (sl) { if (state.mode !== "subskills") { state.ssel = +sl.dataset.sub; setMode("subskills"); } else selectSub(+sl.dataset.sub); return; }
  const tab = e.target.closest(".tabs button[data-tab]");
  if (tab) {
    state.tab = tab.dataset.tab;
    for (const k of UNIT_TABS) $(`#tab_${k}`).hidden = state.tab !== k;
    markTabs();
    return;
  }
  const tb = e.target.closest("[data-tier]");
  if (tb) {
    const u = W._unitById[state.sel];
    state.tier = +tb.dataset.tier;
    $("#tierBtns").innerHTML = tierButtons(u);
    $("#classBox").innerHTML = classCard(u) + actCard(u);
    markTagChips();
    return;
  }
  const sv = e.target.closest("[data-stv], [data-pscope]");
  if (sv) {
    if (sv.dataset.stv) state.stv = sv.dataset.stv; else state.pscope = sv.dataset.pscope;
    $("#statsBox").innerHTML = statPanel(W._unitById[state.sel]);
    return;
  }
  const tag = e.target.closest(".tag[data-tag]");
  if (tag) {
    toggle(tag.dataset.cat, tag.dataset.tag); return;
  }
  const wc = e.target.closest(".wchip");
  if (wc) {
    if (wc.dataset.wg === "weapon" && !picks("weapon").has(wc.dataset.wv)) {
      const b = wc.dataset.wv.slice(0, 2);
      if (!picks("class").has(b)) { picks("class").clear(); picks("weapon").clear(); picks("class").add(b); }
    }
    toggle(wc.dataset.wg, wc.dataset.wv); return;
  }
  const tr = e.target.closest(".tag[data-trait]");
  if (tr) { toggle("trait", tr.dataset.trait); return; }
  const sk = e.target.closest("[data-skin]");
  if (sk) {
    const u = W._unitById[state.sel], n = u.skins.length;
    const i = Math.max(0, u.skins.findIndex(s => s.resource === (state.skin || u._res)));
    state.skin = u.skins[(i + +sk.dataset.skin + n) % n].resource;
    $("#detail .summary .art").src = `img/unit/${state.skin}.webp`;
    $("#detail .skin-nav").outerHTML = skinNav(u);
    $("#artBox").innerHTML = artHTML(u);
  }
};

/* ---------------- history: each page is a step, so Back (browser, Alt+←, the ← button) returns ---------------- */
function go(hash) {
  if (hash === location.hash) return mobileView();   // the same page again (phone: from the list)
  history.pushState({ n: (history.state?.n || 0) + 1 }, "", hash);
  markBack();
}
function markBack() { $("#backBtn").hidden = !(history.state?.n > 0); mobileView(); }
/* phone (session 12, owner: "semi mobile", nothing more): under 760 px one pane at a time:
   the list, or the page of what was picked (a #unit/… link opens the page); ‹ goes back to the list */
function mobileView() {
  const page = /^#(unit|subskill|dungeon)\//.test(location.hash) || ["summons", "formulas"].includes(state.mode);
  $("#layout").classList.toggle("m-page", page);
  $("#mListName").textContent = ui(state.mode);
}
$("#mList").onclick = () => $("#layout").classList.remove("m-page");
$("#backBtn").onclick = () => history.back();
window.addEventListener("popstate", markBack);

/* ---------------- sub skills ---------------- */
const STAGE_LETTER = { Normal: "N", Premium: "P", HighPremium: "H" };
const DEEP_FLOOR0 = 56999;                      // deep dungeon floors: quest 57000 = 地下1階
/* sort key of a sub skill by its first stage: dungeon type, then number; deep floor; ★ */
function stageKey(x) {
  const S = W.sources;
  const d = x._src.filter(e => e.kind === "dungeon").map(e => S.dungeons[e.quest])
    .map(v => ["HighPremium", "Premium", "Normal"].indexOf(v.type) * 1000 + v.number);
  if (d.length) return Math.min(...d);
  const b = x._src.map(e => S.quests[e.quest]?.boss).filter(Boolean);
  if (b.length) return Math.min(...b.map(v => v.series));
  const sc = x._src.map(e => S.quests[e.quest]?.secret).filter(Boolean);
  if (sc.length) return Math.min(...sc.map(v => v.category));
  const r = (S.recipes[x.id] || []).map(e => e.kind === "mission" && e.quest ? e.quest - DEEP_FLOOR0 : e.kind === "eventstar" ? 1000 + e.stars : 9999);
  return r.length ? Math.min(...r) : 99999;
}
function stageChips(x) {
  const S = W.sources, out = [];
  const dun = [...new Set(x._src.filter(e => e.kind === "dungeon").map(e => e.quest))]
    .map(q => S.dungeons[q]).sort((a, b) => ["HighPremium", "Premium", "Normal"].indexOf(a.type) - ["HighPremium", "Premium", "Normal"].indexOf(b.type) || a.number - b.number);
  for (const d of dun) out.push([`c-${d.type}`, STAGE_LETTER[d.type] + d.number]);
  if (x.recipe) for (const e of S.recipes[x.id] || []) {
    if (e.kind === "mission" && e.quest) out.push(["c-Deep", "D" + (e.quest - DEEP_FLOOR0)]);
    if (e.kind === "eventstar") out.push(["c-Deep", "★" + e.stars]);
  }
  // story boss: the stage the boss is from (M1-8 = main story 1-8)
  const stages = [...new Set(x._src.map(e => S.quests[e.quest]?.boss?.stage).filter(Boolean))];
  for (const st of stages) out.push(["c-Main", "M" + st]);
  const groups = [...new Set(x._src.map(e => S.quests[e.quest]?.secret?.group).filter(Boolean))];
  for (const g of groups) out.push(["c-Secret", term("traitGroups", W.lookups.traitGroups[g]?.name)]);
  const max = 5;
  return out.length ? `<span class="stchips">${out.slice(0, max).map(([c, t]) => `<span class="stc ${c}">${t}</span>`).join("")}${out.length > max ? `<span class="stc more">+${out.length - max}</span>` : ""}</span>` : "";
}
function subRow(x) {
  return `<button class="srow" data-id="${x.id}" data-t="${x._tab}" data-g="${x._grp}"><img class="srar" src="img/rarity/${x.rarity}.webp" alt="">
    <span class="snm">${esc(subName(x))}</span>${x._grp === "drest" ? "" : stageChips(x)}${x.ultimate ? `<img class="sult" src="img/subskill/SSR1_Ultimate.webp" alt="" title="${esc(ui("ultimate"))}">` : ""}
    ${x.category ? `<span class="jp-grp cat-chip scat-l cat-${x.category}">${esc(ui("cat" + x.category))}</span>` : ""}</button>`;
}
/* the sub skill list's tabs (owner): Drop > Craft > Boss > Quest (+ mission, exchange shop) > Etc.
   (paid packs, bonus pass, login, serial, unknown) */
const SUB_TABS = [["drop", "gate"], ["craft", "recipe"], ["boss", "crown"], ["quest", "flag"], ["etc", "gift"]];
const SUB_GROUPS = { drop: ["hp", "p", "drest"], craft: ["deepm", "deeps"], boss: ["bossm", "bosse"],
  quest: ["event", "secret", "quest", "mission", "exchange"], etc: ["misc", "paid", "unknown"] };     // login first (owner)
function setSubTab(t) {
  state.stab = t;
  document.querySelectorAll("#subs [data-stab]").forEach(b => b.classList.toggle("on", b.dataset.stab === t));
  applyFilters(true);
}
function buildSubs() {
  if (!SUB_TABS.some(([t]) => t === state.stab) || (state.stab === "etc" && !state.showEtc)) state.stab = "drop";
  const box = $("#subs");
  const byRarity = (a, b) => b._order - a._order || a.family - b.family || a.id - b.id;
  const tabs = `<nav class="dtabs stabs">${SUB_TABS.map(([t, ic]) => `<button data-stab="${t}" title="${esc(ui("st_" + t))}"${t === state.stab ? ' class="on"' : ""}${t === "etc" && !state.showEtc ? " hidden" : ""}>
      ${svg(ic, "d-ic")}<b>${W._subs.filter(x => x._tab === t).length}</b></button>`).join("")}</nav>`;
  const lists = SUB_TABS.map(([t]) => SUB_GROUPS[t].map(g => {
    const rows = W._subs.filter(x => x._tab === t && x._grp === g).sort((a, b) => b._order - a._order || stageKey(a) - stageKey(b) || byRarity(a, b));
    const closed = state.sgClosed?.has(`${t}.${g}`);
    return rows.length ? `<button class="sgroup${closed ? " closed" : ""}" data-t="${t}" data-g="${g}"><span class="sg-c">▾</span>${esc(ui("g_" + g))} <b>${rows.length}</b></button>`
      + `<div class="sgrows${closed ? " folded" : ""}" data-t="${t}" data-g="${g}">${rows.map(subRow).join("")}</div>` : "";
  }).join("")).join("");
  box.innerHTML = tabs + lists + `<div class="empty" hidden>${ui("noneSub")}</div>`;
  box.onclick = e => {
    const tb = e.target.closest("[data-stab]");
    if (tb) { setSubTab(tb.dataset.stab); return; }
    const gh = e.target.closest(".sgroup");
    if (gh) {                                  // fold / unfold a group
      const key = `${gh.dataset.t}.${gh.dataset.g}`;
      state.sgClosed = state.sgClosed || new Set();
      state.sgClosed.has(key) ? state.sgClosed.delete(key) : state.sgClosed.add(key);
      gh.classList.toggle("closed");
      box.querySelector(`.sgrows[data-t="${gh.dataset.t}"][data-g="${gh.dataset.g}"]`).classList.toggle("folded");
      return;
    }
    const r = e.target.closest(".srow"); if (r) selectSub(+r.dataset.id);
  };
  W._subs.forEach(x => { x._search = [tx(`subskill.${x.id}.name`), ...(W.text[`subskill.${x.id}.name`] || [])].join(" ").toLowerCase();
    x._el = box.querySelector(`.srow[data-id="${x.id}"]`); });
}
function subLink(x) {
  return `<button class="sublink" data-sub="${x.id}"><img src="img/rarity/${x.rarity}.webp" alt="">${esc(subName(x))}</button>`;
}
/* sources: labels and dates */
function dateState(open, close) {
  const now = new Date(), d = v => v ? new Date(v.replace(" ", "T") + ":00+09:00") : null;
  const o = d(open), c = d(close), fmt = v => v.slice(0, 10);
  if (o && now < o) return { open: false, text: ui("opensAt").replace("{d}", fmt(open)) };
  if (c && now > c) return { open: false, text: ui("closedSince").replace("{d}", fmt(close)) };
  if (c) return { open: true, text: ui("openUntil").replace("{d}", fmt(close)) };
  return { open: true, text: ui("always") };
}
function dungeonName(qid) {
  const d = W.sources.dungeons[qid];
  return d ? `${ui("t_" + d.type)} ${d.number}` : tx(`quest.${qid}.name`);
}
function questLabel(qid) {
  if (W.sources.dungeons[qid]) return dungeonName(qid);
  const q = W.sources.quests[qid] || {};
  const ev = q.event ? tx(`event.${q.event}.name`) : "";
  const cat = q.category ? ui("q_" + q.category) : "";
  return [cat, ev, tx(`quest.${qid}.name`)].filter(Boolean).join(" · ");
}
function price(sh) {
  const p = sh.price;
  if (sh.currency === "point.payment") return ui("yen").replace("{p}", p);
  if (sh.currency.startsWith("gachamedal.")) return ui("gmedal").replace("{p}", p);
  if (sh.currency.startsWith("event.")) return ui("eventpt").replace("{p}", p);
  if (sh.currency.includes("friend_point")) return ui("friendpt").replace("{p}", p);
  return `${p} ${sh.currency}`;
}
function sourceLine(e) {
  const S = W.sources;
  const kind = `<span class="src-k">${ui("k_" + e.kind)}</span>`;
  if (e.kind === "dungeon") {
    const d = S.dungeons[e.quest], st = dateState(d.open, d.close);
    const prize = Object.values(d.tables).flat().find(p => p.sub === e._sub) || {};
    return `${kind}<button class="dlink" data-dungeon="${e.quest}">${esc(dungeonName(e.quest))}</button>
      ${prize.featured ? `<span class="badge-s">${ui("featured")}</span>` : ""}${prize.limit ? `<span class="badge-s">${ui("once")}</span>` : ""}
      <span class="st-${st.open ? "open" : "closed"}">${esc(st.text)}</span>`;
  }
  if (e.kind === "clear" || e.kind === "highlevel") return `${kind}<span>${esc(questLabel(e.quest))}</span>`;
  if (e.kind === "mission") return `${kind}<span>${esc(tx(`mission.${e.mission}.text`))}</span>`;
  if (e.kind === "shop") {
    const sh = S.shops[e.shop], st = dateState(sh.start, sh.end);
    return `${kind}<span>${esc(tx(`shop.${e.shop}.name`))}</span><span class="price">${esc(price(sh))}</span>
      ${sh.end ? `<span class="st-${st.open ? "open" : "closed"}">${esc(st.text)}</span>` : ""}`;
  }
  if (e.kind === "login") return `${kind}<span>${esc(e.login ? tx(`login.${e.login}.name`) : "")} · ${ui("day")} ${e.day}</span>`;
  if (e.kind === "pass") return `${kind}<span>${esc(tx(`pass.${e.pass}.name`))} · ${ui("tier")} ${e.tier}</span>`;
  if (e.kind === "sugoroku") return `${kind}<span>${ui("odds")} ${e.odds}</span>`;
  if (e.kind === "serial") return `${kind}<span>${esc(tx(`serial.${e.serial}.name`))}</span>`;
  return kind;
}
function sourcesList(x, limit = 8) {
  const order = ["dungeon", "clear", "highlevel", "mission", "login", "pass", "sugoroku", "serial", "shop"];
  const list = [...x._src].map(e => ({ ...e, _sub: x.id })).sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  if (!list.length) return x.recipe ? "" : `<div class="src-none">${ui("noSource")}</div>`;
  const rows = list.map(e => `<div class="src">${sourceLine(e)}</div>`);
  if (rows.length <= limit) return rows.join("");
  return rows.slice(0, limit).join("") + `<details class="more"><summary>${ui("moreN").replace("{n}", rows.length - limit)}</summary>${rows.slice(limit).join("")}</details>`;
}
/* the short "where from" of a recipe material */
function sourceSummary(x) {
  const kinds = [...new Set(x._src.map(e => e.kind))];
  const dungeons = [...new Set(x._src.filter(e => e.kind === "dungeon").map(e => dungeonName(e.quest)))];
  const parts = dungeons.slice(0, 4).concat(kinds.filter(k => k !== "dungeon").map(k => ui("k_" + k)));
  if (x.recipe) parts.push(ui("k_recipe"));
  return parts.join(", ") || ui("noSource");
}
/* ---- how to get: drops first (dungeon with its unit, boss / secret / event stage), then crafting
   (the recipe on click: one line per material with ×n and the material's own drops), then
   rewards (missions, login, pass …), the exchange shop (in-game currency) and paid packs (¥).
   When there is a drop, the shop / mission ways fold under "Other ways". */
const DROP_KINDS = ["dungeon", "clear", "highlevel"];
const isDrop = e => DROP_KINDS.includes(e.kind);
const isPaid = e => e.kind === "shop" && W.sources.shops[e.shop]?.currency === "point.payment";
function dropHTML(e) {
  if (e.kind === "dungeon") {
    const d = W.sources.dungeons[e.quest], st = dateState(d.open, d.close), u = d.unit && W._unitById[d.unit];
    return `<button class="drop" data-dungeon="${e.quest}">${u ? `<img class="drop-face" src="img/unit/${u._res}_s.webp" alt="">`
      : svg("gate", "drop-gate d-" + d.type)}<span class="drop-t"><b>${esc(dungeonName(e.quest))}</b>
      <small class="st-${st.open ? "open" : "closed"}">${esc(st.text)}</small></span></button>`;
  }
  const q = W.sources.quests[e.quest] || {};
  const where = [q.category ? ui("q_" + q.category) : "", q.event ? tx(`event.${q.event}.name`) : ""].filter(Boolean).join(" · ");
  return `<span class="drop">${svg("flag", "drop-gate")}<span class="drop-t"><b>${esc(tx(`quest.${e.quest}.name`))}</b>
    <small>${esc(where)}${where ? " · " : ""}${ui("k_" + e.kind)}</small></span></span>`;
}
function otherHTML(e) {
  if (e.kind === "shop") {
    const sh = W.sources.shops[e.shop], st = dateState(sh.start, sh.end);
    return `<div class="src"><span class="src-k">${ui(isPaid(e) ? "paid" : "exchange")}</span><span>${esc(tx(`shop.${e.shop}.name`))}</span>
      <span class="price">${esc(price(sh))}</span>${sh.end ? `<span class="st-${st.open ? "open" : "closed"}">${esc(st.text)}</span>` : ""}</div>`;
  }
  return `<div class="src">${sourceLine(e)}</div>`;
}
function otherList(list, limit = 6) {
  const order = ["mission", "login", "pass", "sugoroku", "serial", "shop"];
  const rows = [...list].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || isPaid(a) - isPaid(b)).map(otherHTML);
  if (rows.length <= limit) return rows.join("");
  return rows.slice(0, limit).join("") + `<details class="more"><summary>${ui("moreN").replace("{n}", rows.length - limit)}</summary>${rows.slice(limit).join("")}</details>`;
}
function recipeHTML(x) {
  const count = new Map();
  for (const id of x.recipe) count.set(id, (count.get(id) || 0) + 1);
  return [...count].map(([id, n]) => {
    const xn = n > 1 ? `<b class="xn">×${n}</b>` : "";
    if (typeof id === "string" && id.startsWith("any:")) {       // any sub skill of this rarity
      const r = id.slice(4);
      return `<div class="rc-row"><div class="rc-m"><span class="sublink any"><img src="img/rarity/${r}.webp" alt="">${esc(ui("anyOf").replace("{r}", term("rarities", W.lookups.subskillRarity[r]?.name)))}</span>${xn}</div>
        <div class="rc-src"><span class="muted">${ui("anyHint")}</span></div></div>`;
    }
    const m = W._subById[id];
    if (!m) return "";
    return `<div class="rc-row"><div class="rc-m">${subLink(m)}${xn}
      <div class="rc-eff">${rich(tx(`subskill.${m.id}.text`), m.vars)}</div></div><div class="rc-src">${materialWays(m)}</div></div>`;
  }).join("");
}
/* the recipe itself must be unlocked (its tablet): a deep dungeon floor mission or the deep
   dungeon's star rewards (event 魔獣の大迷宮: total ★ over all floors) */
function deepEvents() {
  if (!W._deep) W._deep = new Set(Object.values(W.sources.recipes || {}).flat()
    .filter(e => e.kind === "mission" && e.quest).map(e => W.sources.quests[e.quest]?.event).filter(Boolean));
  return W._deep;
}
function recipeUnlock(x) {
  const list = W.sources.recipes?.[x.id] || [];
  if (!list.length) return "";
  return `<div class="rc-unlock"><span class="k">${ui("recipeUnlock")}</span>${list.map(e => {
    if (e.kind === "mission") {
      const q = e.quest && W.sources.quests[e.quest];
      const where = e.quest ? [q?.event ? tx(`event.${q.event}.name`) : "", tx(`quest.${e.quest}.name`)].filter(Boolean).join(" · ") : "";
      return `<span class="ru">${svg("mission", "ru-ic")}<span><b>${esc(tx(`mission.${e.mission}.text`))}</b>${where ? `<small>${esc(where)}</small>` : ""}</span></span>`;
    }
    const deep = deepEvents().has(e.event) ? `${ui("deepDungeon")} · ` : "";
    return `<span class="ru">${svg("gift", "ru-ic")}<span><b>${esc(deep + tx(`event.${e.event}.name`))}</b><small>${ui("totalStars").replace("{n}", e.stars)}</small></span></span>`;
  }).join("")}</div>`;
}
/* rows: Drop (dungeon chips, one width) | Quest (boss / secret / event stages, plain text) |
   Crafting (recipe unlock + the recipe, always open) | Mission | Other (login, pass …) |
   Exchange shop | Paid pack; with a drop, the shop rows fold */
const row = (label, body) => `<div class="how-row"><div class="how-k">${label}</div><div class="how-v">${body}</div></div>`;
function questLine(e) {
  const q = W.sources.quests[e.quest] || {};
  // a boss challenge: the game's banner + where the boss comes from (story stage / event)
  if (q.boss) {
    const b = q.boss;
    const from = b.story ? `${ui("storyBoss")}: ${tx(`quest.${b.story}.name`)}` : ui("eventBoss");
    return `<div class="bossline"><img class="boss-bn" src="img/boss/${b.series}.webp" alt="" loading="lazy" onerror="this.remove()">
      <div><b>${esc(tx(`quest.${e.quest}.name`))}</b><div class="muted">${esc(from)}</div>
      <div class="muted">${esc([ui("q_" + q.category), ui("k_" + e.kind)].join(" · "))}</div></div></div>`;
  }
  // an event / secret quest: the game's banner of its event (sources quests[].banner)
  if (q.banner) {
    const ev = q.event ? tx(`event.${q.event}.name`) : "";
    return `<div class="bossline"><img class="boss-bn" src="img/${q.banner}.webp" alt="" loading="lazy" onerror="this.remove()">
      <div><b>${esc(tx(`quest.${e.quest}.name`))}</b>${ev ? `<div class="muted">${esc(ev)}</div>` : ""}
      <div class="muted">${esc([ui("q_" + q.category), ui("k_" + e.kind)].join(" · "))}</div></div></div>`;
  }
  const where = [q.category ? ui("q_" + q.category) : "", q.event ? tx(`event.${q.event}.name`) : "", ui("k_" + e.kind)].filter(Boolean).join(" · ");
  return `<div class="qline"><b>${esc(tx(`quest.${e.quest}.name`))}</b><span class="muted">${esc(where)}</span></div>`;
}
function shopRows(list, fold) {
  const out = [];
  for (const [key, test] of [["exchange", e => !isPaid(e)], ["paid", isPaid]]) {
    const items = list.filter(test);
    if (!items.length) continue;
    const lines = items.map(e => { const sh = W.sources.shops[e.shop], st = dateState(sh.start, sh.end);
      return `<div class="qline"><span>${esc(tx(`shop.${e.shop}.name`))}</span><span class="price">${esc(price(sh))}</span>
        ${sh.end ? `<span class="st-${st.open ? "open" : "closed"}">${esc(st.text)}</span>` : ""}</div>`; });
    const body = fold || lines.length > 4
      ? `<details class="more"${fold ? "" : ""}><summary>${ui("nShop").replace("{n}", lines.length)}</summary>${lines.join("")}</details>`
      : lines.join("");
    out.push(row(ui(key), body));
  }
  return out.join("");
}
function howToGet(x) {
  const src = x._src;
  const dungeons = src.filter(e => e.kind === "dungeon");
  const quests = src.filter(e => e.kind === "clear" || e.kind === "highlevel");
  const missions = src.filter(e => e.kind === "mission");
  const other = src.filter(e => ["login", "pass", "sugoroku", "serial"].includes(e.kind));
  const shops = src.filter(e => e.kind === "shop");
  let h = "";
  if (dungeons.length) h += row(ui("drop"), `<div class="drops">${dungeons.map(dropHTML).join("")}</div>`);
  if (quests.length) h += row(ui("questRow"), quests.map(questLine).join(""));
  if (x.recipe) h += row(ui("k_recipe"), recipeUnlock(x) + `<div class="craft-box">${recipeHTML(x)}</div>`);
  if (missions.length) h += row(ui("missionRow"), missions.map(e => `<div class="qline"><span>${esc(tx(`mission.${e.mission}.text`))}</span></div>`).join(""));
  if (other.length) h += row(ui("otherRow"), other.map(e => `<div class="qline">${sourceLine(e)}</div>`).join(""));
  if (shops.length) h += shopRows(shops, dungeons.length + quests.length > 0);
  return h || `<div class="src-none">${ui("noSource")}</div>`;
}
/* a recipe material's ways: its drops (same chips), its quests, else its other ways in short */
function materialWays(m) {
  const dungeons = m._src.filter(e => e.kind === "dungeon"), quests = m._src.filter(e => e.kind === "clear" || e.kind === "highlevel");
  if (dungeons.length || quests.length)
    return (dungeons.length ? `<div class="drops">${dungeons.map(dropHTML).join("")}</div>` : "") + quests.map(questLine).join("");
  const kinds = [...new Set(m._src.map(e => e.kind === "shop" ? (isPaid(e) ? "paid" : "exchange") : "k_" + e.kind))];
  if (m.recipe) kinds.unshift("k_recipe");
  return `<span class="muted">${kinds.length ? kinds.map(ui).join(", ") : ui("noSource")}</span>`;
}
function renderSub(x) {
  const fam = (W.subskills.families[x.family] || [x.id]).map(id => W._subById[id]).filter(Boolean);
  const usedIn = W._subs.filter(y => y.recipe && y.recipe.includes(x.id));
  const rar = W.lookups.subskillRarity[x.rarity];
  const n = W.text[`subskill.${x.id}.name`] || [""];
  const grp = W.lookups.subskillCategory?.[x.category] || "";
  const famCol = fam.length > 1 ? `<h3 class="sec">${ui("family")}</h3><div class="card fam">${fam.map(y =>
    `<button class="famline${y.id === x.id ? " on" : ""}" data-sub="${y.id}"><img src="img/rarity/${y.rarity}.webp" alt="">
      <span class="fl-n">${esc(subName(y))}</span><span class="fl-e">${rich(tx(`subskill.${y.id}.text`), y.vars)}</span></button>`).join("")}</div>`
    : "";
  const jpCard = `<div class="jp-card small" lang="ja"><div>
      ${grp ? `<span class="jp-grp cat-${x.category}">${esc(grp)}</span>` : ""}<div class="jp-name">${esc(n[0])}</div></div></div>`;
  // head (owner, session 4): two columns: [rarity logo] [name / type] | "In JP" + the Japanese card;
  // the effect, tags and "works for" in their own row below
  $("#detail").innerHTML = `
    <div class="summary sub-head2"><div class="sh-left">
      <img class="sh-rarimg" src="img/rarity/${x.rarity}.webp" alt="" title="${esc(term("rarities", rar?.name))}">
      <div class="sh-name"><h2>${esc(subName(x))}</h2>
        <div class="marks">${x.category ? `<span class="jp-grp cat-chip cat-${x.category}">${esc(ui("cat" + x.category))}</span>` : ""}
          ${x.ultimate ? `<span class="chip"><img class="ult-ic" src="img/subskill/SSR1_Ultimate.webp" alt="">${esc(ui("ultimate"))}</span>` : ""}</div></div></div>
      ${isJa() ? "" : `<div class="jp-side"><div class="sh-k">${ui("inJp")}</div>${jpCard}</div>`}</div>
    <div class="card sh-body"><div class="desc big">${rich(tx(`subskill.${x.id}.text`), x.vars)}</div>${tagChips(x.tags)}${worksHTML(x)}</div>
    ${famCol}
    ${usedIn.length ? `<h3 class="sec">${ui("usedIn")}</h3><div class="card links">${usedIn.map(subLink).join("")}</div>` : ""}
    <h3 class="sec">${ui("howGet")}</h3><div class="card how">${howToGet(x)}</div>`;
  markTagChips();
}
function selectSub(id, fromHash) {
  const x = W._subById[id];
  if (!x) return;
  state.ssel = id;
  if (x._tab !== state.stab) setSubTab(x._tab);
  renderSub(x);
  $("#detail").scrollTop = 0;
  markSelected();
  if (!fromHash) go(`#subskill/${id}`);
}

/* ---------------- dungeons ---------------- */
/* the dungeon selector: tabs Normal / Premium / High Premium, then tiles like the units
   (premium: the dungeon's unit in the game frame, the pill = the dungeon number) */
const DTYPES = ["Normal", "Premium", "HighPremium"];
function buildDungeons() {
  const box = $("#dungeonList");
  const all = Object.entries(W.sources.dungeons);
  if (!DTYPES.includes(state.dtab)) state.dtab = W.sources.dungeons[state.dsel]?.type || "Premium";
  const tabs = DTYPES.map(t => `<button data-dtab="${t}"${t === state.dtab ? ' class="on"' : ""}>${svg("gate", "d-ic d-" + t)}
    <span>${ui("t_" + t)}</span><b>${all.filter(([, d]) => d.type === t).length}</b></button>`).join("");
  const tiles = all.filter(([, d]) => d.type === state.dtab).sort(([, x], [, y]) => x.number - y.number).map(([qid, d]) => {
    const st = dateState(d.open, d.close), u = d.unit && W._unitById[d.unit];
    const face = u ? faceHTML(u, u._res, false, d.number)
      : `<div class="face dface d-${d.type}">${svg("gate", "dface-ic")}<span class="dface-n">${d.number}</span></div>`;
    return `<button class="tile dtile${st.open ? "" : " closed"}" data-id="${qid}">${face}
      <div class="nm">${esc(dungeonName(qid))}</div>${u ? `<div class="nm2">${esc(unitName(u))}</div>` : ""}
      ${d.close ? `<div class="dt-st ${st.open ? "st-open" : "st-closed"}">${esc(st.text.replace(/ \d{4}-/, " "))}</div>` : ""}</button>`;
  }).join("");
  box.innerHTML = `<nav class="dtabs">${tabs}</nav><div class="tiles dtiles">${tiles}</div>`;
  box.onclick = e => {
    const tb = e.target.closest("[data-dtab]");
    if (tb) { state.dtab = tb.dataset.dtab; buildDungeons(); markSelected(); return; }
    const r = e.target.closest(".dtile");
    if (r) selectDungeon(+r.dataset.id);
  };
}
/* one prize per line: name | effect + the skills it is a material for (click: that skill's effect) */
function prizeRow(p) {
  const x = W._subById[p.sub];
  if (!x) return "";
  const usedIn = W._subs.filter(y => y.recipe && y.recipe.includes(x.id));
  const jp = isJa() ? "" : `<span class="pz-jp" lang="ja">${esc((W.text[`subskill.${x.id}.name`] || [""])[0])}</span>`;
  return `<div class="prize"><div class="pz-name"><button class="pz-link" data-sub="${x.id}"><img src="img/rarity/${x.rarity}.webp" alt="">
      <span class="pz-t"><span>${esc(subName(x))}</span>${jp}</span></button></div>
    <div class="pz-body"><div class="desc">${rich(tx(`subskill.${x.id}.text`), x.vars)}</div>
      ${usedIn.length ? `<div class="pz-req"><span class="k">${ui("requiredFor")}</span>${usedIn.map(y =>
        `<button class="req" data-req="${y.id}"><img src="img/rarity/${y.rarity}.webp" alt="">${esc(subName(y))}</button>`).join("")}</div>
        <div class="req-box" hidden></div>` : ""}</div></div>`;
}
/* prizes in 2 tabs by rarity: L + E | R + C (the low dungeons have many) */
const PRIZE_TABS = [["high", ["SSR1", "SR1"]], ["low", ["R1", "C1"]]];
function prizeTabs(prizes) {
  const groups = PRIZE_TABS.map(([k, rars]) => [k, rars, prizes.filter(p => rars.includes(W._subById[p.sub]?.rarity))]);
  const used = groups.filter(g => g[2].length);
  if (!used.some(g => g[0] === state.ptab)) state.ptab = used[0]?.[0];
  const tabs = used.length > 1 ? `<nav class="ptabs">${used.map(([k, rars, list]) => `<button data-ptab="${k}"${k === state.ptab ? ' class="on"' : ""}>
    ${rars.map(r => `<img src="img/rarity/${r}.webp" alt="">`).join("")}<b>${list.length}</b></button>`).join("")}</nav>` : "";
  return tabs + used.map(([k, , list]) => `<div class="card prizes" data-pgroup="${k}"${k === state.ptab ? "" : " hidden"}>${list.map(prizeRow).join("")}</div>`).join("");
}
function reqCard(y) {
  const mats = (y.recipe || []).map(id => typeof id === "string" ? { any: id.slice(4) } : W._subById[id]).filter(Boolean);
  return `<div class="req-card"><div class="rc-head"><img src="img/rarity/${y.rarity}.webp" alt=""><b>${esc(subName(y))}</b>
      <button class="dlink" data-sub="${y.id}">${ui("openSub")} →</button></div>
    <div class="desc">${rich(tx(`subskill.${y.id}.text`), y.vars)}</div>
    ${mats.length ? `<div class="rc-mats"><span class="k">${ui("recipe")}</span>${mats.map(m => m.any
      ? `<span class="rc-mat"><img src="img/rarity/${m.any}.webp" alt="">${esc(ui("anyOf").replace("{r}", term("rarities", W.lookups.subskillRarity[m.any]?.name)))}</span>`
      : `<span class="rc-mat"><img src="img/rarity/${m.rarity}.webp" alt="">${esc(subName(m))}</span>`).join("")}</div>` : ""}</div>`;
}
function renderDungeon(qid) {
  const d = W.sources.dungeons[qid];
  const st = dateState(d.open, d.close);
  const u = d.unit && W._unitById[d.unit];
  const line = (k, v) => `<div class="dd"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  const details = [
    line(ui("status"), `<span class="st-${st.open ? "open" : "closed"}">${esc(st.text)}</span>`),
    d.weekdays.every(Boolean) ? "" : line(ui("weekdays"), esc(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].filter((_, i) => d.weekdays[i]).join(", "))),
    d.key !== "premium" ? line(ui("key"), esc(ui(d.key === "normal" ? "keyNormal" : "keyPremium"))) : "",
    d.unlock ? line(ui("unlock"), esc(questLabel(d.unlock))) : "",
    d.level ? line(ui("recLevel"), `<b>${d.level}</b>`) : "",
  ].join("");
  // premium: the table after the once-only prizes has the same skills, so one list (the first)
  const prizes = Object.values(d.tables)[0] || [];
  $("#detail").innerHTML = `<div class="summary dun-sum">
      <div class="dun-title">${svg("gate", "dun-ic d-" + d.type)}<div><h2>${esc(dungeonName(qid))}</h2>
        ${d.scene ? `<div class="scene"><span>${ui("scene")}</span><b>${esc(tx(`story.${d.scene.story}.title`))}</b></div>` : ""}</div></div>
      <div class="dun-details">${details}</div>
      ${u ? `<div class="dun-unit"><div class="du-row"><span class="k">${ui("reqUnit")}:</span>
        <b>${esc(unitName(u))}</b></div><button class="du-face" data-unit="${u.id}">${faceHTML(u, u._res)}</button></div>` : ""}</div>
    <h3 class="sec">${ui("prizes")}</h3>${prizeTabs(prizes)}`;
}
function selectDungeon(qid, fromHash) {
  if (!W.sources.dungeons[qid]) return;
  if (state.dsel !== qid) state.ptab = "high";   // a new dungeon opens on L + E
  state.dsel = qid;
  const type = W.sources.dungeons[qid].type;
  if (type !== state.dtab) { state.dtab = type; buildDungeons(); }
  renderDungeon(qid);
  $("#detail").scrollTop = 0;
  markSelected();
  if (!fromHash) go(`#dungeon/${qid}`);
}

/* ---------------- the Game formulas page ---------------- */
let FORMULAS = null;
async function showFormulas() {
  if (FORMULAS === null) {
    // no-cache: ask the server each time (a stale copy hid page updates, session 12); cheap, it answers 304
    try { FORMULAS = await (await fetch("formulas.html", { cache: "no-cache" })).text(); } catch { FORMULAS = ""; }
  }
  if (state.mode !== "formulas") return;
  $("#detail").innerHTML = `<article class="page">${FORMULAS || `<div class="empty">formulas.html missing</div>`}</article>`;
  $("#detail").scrollTop = 0;
  // the left nav lists the page's sections
  const heads = [...document.querySelectorAll("#detail .page h3")];
  heads.forEach((h, i) => h.id = `f${i}`);
  $("#navInfo").innerHTML = `<div class="toc-h">${ui("contents")}</div>` + heads.map((h, i) =>
    `<button class="toc" data-f="f${i}">${esc(h.textContent)}</button>`).join("");
}
$("#navInfo").onclick = e => {
  const b = e.target.closest(".toc");
  if (b) document.getElementById(b.dataset.f)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

/* ---------------- Percentile page (session 12, owner: like the Muv-Luv wiki's Percentile ranking) ----------------
   the table (fixed columns, owner: no bounce): # | unit | class | subclass | rarity | element | per stat
   its value and % (the value header sorts, the % header is empty); the stats and Lv. Max / Lv. 1 are
   the Stats tab's (coreStat); percentiles among the units shown. Filters (owner): click the Class /
   Subclass / Rarity / Element header for its list, one pick each; nothing on the left */
function rankUnits() {
  const r = state.rank;
  return W.units.filter(u => (!r.base || u._base === r.base) && (!r.cls || u._weapon === r.cls)
    && (!r.rar || u._rar === r.rar) && (!r.el || String(u.element) === r.el));
}
/* each filter: its options [value, icon, name] */
function rankOpts(k) {
  const r = state.rank, L = W.lookups;
  const bases = [...new Set(W.units.map(u => u._base))].sort();
  if (k === "base") return bases.map(b => { const f = classFamiliesOf(b)[0];
    return [b, `<img src="img/class/${f}.webp" alt="">`, term("classes", W.classes[f].name)]; });
  if (k === "cls") return bases.filter(b => !r.base || b === r.base)
    .flatMap(b => classFamiliesOf(b).filter(f => W.units.some(u => String(u.class) === f))).map(f => {
      const w = String(W.classes[f].weapon);
      return [w, `<img src="img/weapon/${w}.webp" alt="">`, `${term("classes", W.classes[f].name)} · ${term("weapons", L.weapons[w])}`]; });
  if (k === "rar") return RAR_ORDER.map(c => [c, `<img src="img/rarity/${c}.webp" alt="">`,
    term("rarities", Object.values(L.rarity).find(x => x.code === c)?.name)]);
  return Object.keys(L.elements).map(e => [e, `<img src="img/element/${e}.webp" alt="">`, term("elements", L.elements[e])]);
}
const RANK_FILTERS = [["base", "cls"], ["cls", "subclass"], ["rar", "wrarity"], ["el", "welement"]];
function rankPop(k) {
  const r = state.rank;
  return `<div class="rk-pop" data-pop="${k}"><button class="rk-o${r[k] ? "" : " on"}" data-rk="${k}" data-v="">${esc(ui("allUnits"))}</button>${
    rankOpts(k).map(([v, html, name]) => `<button class="rk-o${r[k] === v ? " on" : ""}" data-rk="${k}" data-v="${esc(v)}">${html}<span>${esc(name)}</span></button>`).join("")}</div>`;
}
function drawRanking() {
  if (state.mode !== "ranking") return;
  const r = state.rank, max = state.stv !== "lv1", list = rankUnits();
  const val = new Map(list.map(u => [u, Object.fromEntries(PCT_KEYS.map(k => [k, coreStat(u, k, max).v]))]));
  const sorted = Object.fromEntries(PCT_KEYS.map(k => [k, list.map(u => val.get(u)[k]).sort((a, b) => a - b)]));
  const upTo = (a, v) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] <= v) lo = m + 1; else hi = m; } return lo; };
  // the same as the Stats tab: the share of the other units it is higher than or equal to
  const pct = (u, k) => list.length < 2 ? 100 : Math.round((upTo(sorted[k], val.get(u)[k]) - 1) / (list.length - 1) * 100);
  const rows = [...list].sort((a, b) => r.dir * (val.get(a)[r.sort] - val.get(b)[r.sort]) || a.id - b.id);
  // filter headers: the name, or the picked icon; ▾ opens the list
  const fhead = RANK_FILTERS.map(([k, label]) => {
    const pick = r[k] && rankOpts(k).find(o => o[0] === r[k]);
    return `<th class="fth${r[k] ? " on" : ""}${r.open === k ? " open" : ""}" data-fth="${k}"${pick ? ` title="${esc(pick[2])}"` : ""}>${
      pick ? pick[1] : esc(ui(label))}<span class="caret">▾</span>${r.open === k ? rankPop(k) : ""}</th>`; }).join("");
  const head = PCT_KEYS.map(k => `<th class="num stat${r.sort === k ? " on" : ""}" data-sort="${k}">${esc(ui(k))}${
    r.sort === k ? (r.dir < 0 ? " ▼" : " ▲") : ""}</th><th class="pcth"></th>`).join("");
  const body = rows.map((u, i) => `<tr data-unit="${u.id}"><td class="rk">${i + 1}</td>
      <td><div class="rnm"><img class="rpic" src="img/unit/${u._res}_s.webp" alt="" loading="lazy"><span>${esc(unitName(u))}</span></div></td>
      <td class="ric"><img src="img/class/${classFamiliesOf(u._base)[0]}.webp" alt="" title="${esc(term("classes", W.classes[classFamiliesOf(u._base)[0]].name))}"></td>
      <td class="ric"><img src="img/weapon/${u._weapon}.webp" alt="" title="${esc(`${term("classes", u._fam.name)} · ${term("weapons", W.lookups.weapons[u._weapon])}`)}"></td>
      <td class="ric"><img src="img/rarity/${u._rar}.webp" alt=""></td>
      <td class="ric"><img src="img/element/${u.element}.webp" alt="" title="${esc(term("elements", W.lookups.elements[u.element]))}"></td>
      ${PCT_KEYS.map(k => { const on = r.sort === k ? " on" : "";
        return `<td class="num rv${on}">${val.get(u)[k].toLocaleString("en-US")}</td><td class="num rpct${on}">${pct(u, k)}%</td>`; }).join("")}</tr>`).join("");
  const tabs = ["max", "lv1"].map(k => `<button data-rstv="${k}"${(k === "max") === max ? ' class="on"' : ""}>${ui("stv_" + k)}</button>`).join("");
  const any = r.base || r.cls || r.rar || r.el;
  $("#detail").innerHTML = `<div class="rank-page"><div class="rank-bar"><div class="stv">${tabs}</div>
      <span class="rk-count">${list.length}</span>${any ? `<button class="btn" data-rk="clear">${esc(ui("rankClear"))}</button>` : ""}
      <p class="note-line">${esc(ui("rankNote"))}</p></div>
    <div class="card rankcard"><table class="rtable"><colgroup><col class="c-rk"><col class="c-unit">${'<col class="c-ic">'.repeat(4)}${
      '<col class="c-v"><col class="c-p">'.repeat(PCT_KEYS.length)}</colgroup>
    <thead><tr><th class="num">#</th><th>${esc(ui("unit"))}</th>${fhead}${head}</tr></thead>
    <tbody>${body}</tbody></table></div></div>`;
}
$("#detail").addEventListener("click", e => {
  if (state.mode !== "ranking") return;
  const r = state.rank;
  const rk = e.target.closest("[data-rk]");
  if (rk) {                                                   // a pick in a header list, or Clear
    const k = rk.dataset.rk;
    if (k === "clear") r.base = r.cls = r.rar = r.el = null;
    else {
      r[k] = rk.dataset.v || null;
      if (k === "base") r.cls = null;                         // a new class: its subclasses
      if (k === "cls" && r.cls) r.base = r.cls.slice(0, 2);   // a subclass: its class too
    }
    r.open = null;
    return drawRanking();
  }
  const fth = e.target.closest("th[data-fth]");
  if (fth) { r.open = r.open === fth.dataset.fth ? null : fth.dataset.fth; return drawRanking(); }
  if (r.open) { r.open = null; drawRanking(); return; }      // a click elsewhere closes the list
  const sv = e.target.closest("[data-rstv]");
  if (sv) { state.stv = sv.dataset.rstv; return drawRanking(); }
  const th = e.target.closest("th[data-sort]");
  if (th) {
    if (r.sort === th.dataset.sort) r.dir = -r.dir; else { r.sort = th.dataset.sort; r.dir = -1; }
    return drawRanking();
  }
  const row = e.target.closest("tr[data-unit]");
  if (row) location.hash = `#unit/${row.dataset.unit}`;     // that unit's page
});

/* ---------------- units ---------------- */
function select(id, fromHash) {
  const u = W._unitById[id];
  if (!u) return;
  if (state.sel !== id) { state.skin = null; state.tier = TIERS; }   // a new unit opens on her top class
  state.sel = id;
  renderUnit(u);
  $("#detail").scrollTop = 0;
  markSelected();
  if (!fromHash) go(`#unit/${id}`);
}
function markSelected() {
  document.querySelectorAll(".tile.sel, .srow.sel, .dtile.sel").forEach(t => t.classList.remove("sel"));
  const t = state.mode === "units" ? state.sel && $(`.tile[data-id="${state.sel}"]`)
    : state.mode === "subskills" ? state.ssel && $(`#subs .srow[data-id="${state.ssel}"]`)
    : state.mode === "dungeons" ? state.dsel && $(`#dungeonList .dtile[data-id="${state.dsel}"]`) : null;
  if (t) t.classList.add("sel");
}
function showEmpty(key = "pick") { $("#detail").innerHTML = `<div class="empty">${ui(key)}</div>`; }

/* ---------------- modes (the title menu) ---------------- */
const MODES = [["units", "unitsic"], ["subskills", null], ["dungeons", "gate"], ["ranking", "rankic"], ["summons", "summonic"], ["formulas", "fx"]];
function items() { return state.mode === "units" ? W.units : state.mode === "subskills" ? W._subs : []; }
function listBox() { return state.mode === "units" ? $("#units") : state.mode === "subskills" ? $("#subs") : null; }
function buildMenu() {
  $("#menu").innerHTML = MODES.map(([m, ic]) => `<button class="mitem${m === state.mode ? " on" : ""}" data-mode="${m}">
    ${ic ? svg(ic, "m-ic") : `<img class="m-ic" src="img/subskill/SSR1.webp" alt="">`}<span>${ui(m)}</span>
    ${m === "summons" ? `<small>${ui("soon")}</small>` : ""}</button>`).join("")
    + `<div class="lang m-lang" role="group" aria-label="Language">${[["en", "EN"], ["ja", "JP"]].map(([l, t]) =>
      `<button data-lang="${l}"${l === state.lang ? ' class="on"' : ""}>${t}</button>`).join("")}</div>`;
  $("#modeName").textContent = ui(state.mode);
}
$("#menuBtn").onclick = e => { e.stopPropagation(); $("#menu").hidden = !$("#menu").hidden; };
$("#menu").onclick = e => {
  const lb = e.target.closest("button[data-lang]");
  if (lb) {
    $("#menu").hidden = true;
    if (lb.dataset.lang === state.lang) return;
    state.lang = lb.dataset.lang;
    store.set("lang", state.lang);
    applyLang();
    return;
  }
  const b = e.target.closest(".mitem");
  if (!b) return;
  $("#menu").hidden = true;
  setMode(b.dataset.mode);
};
document.addEventListener("click", e => { if (!e.target.closest(".brand-wrap")) $("#menu").hidden = true; });

function setMode(mode, fromHash) {
  state.mode = mode;
  const listed = mode === "units" || mode === "subskills";
  $("#units").hidden = mode !== "units";
  $("#subs").hidden = mode !== "subskills";
  $("#dungeonList").hidden = mode !== "dungeons";
  $("#navInfo").hidden = listed || mode === "dungeons" || mode === "ranking";
  $("#search").hidden = !listed;
  $("#reset").hidden = !listed;
  $("#listFilterBtn").hidden = !listed;
  $("#subFilter").hidden = !listed || !state.lf;
  $("#layout").classList.toggle("nofilter", !listed);
  $("#layout").classList.toggle("formulas", mode === "formulas");   // narrow contents, wide page (owner)
  $("#layout").classList.toggle("ranking", mode === "ranking");     // a narrow left (the top bar only), the table
  $("#search").placeholder = ui(mode === "subskills" ? "searchSub" : "search");
  buildMenu();
  if (listed) { buildFilters(); applyFilters(); } else $("#count").textContent = "";
  markSelected();
  renderMode(fromHash);
}
function renderMode(fromHash) {
  const hash = h => { if (!fromHash) go(h); };
  if (state.mode === "units") { state.sel ? renderUnit(W._unitById[state.sel]) : showEmpty(); hash(state.sel ? `#unit/${state.sel}` : "#units"); }
  else if (state.mode === "subskills") { state.ssel ? renderSub(W._subById[state.ssel]) : showEmpty("pickSub"); hash(state.ssel ? `#subskill/${state.ssel}` : "#subskills"); }
  else if (state.mode === "dungeons") { state.dsel ? renderDungeon(state.dsel) : showEmpty("pickDungeon"); hash(state.dsel ? `#dungeon/${state.dsel}` : "#dungeons"); }
  else if (state.mode === "summons") {
    $("#navInfo").innerHTML = `<div class="empty">${ui("summonsText")}</div>`;
    $("#detail").innerHTML = `<div class="empty">${ui("summonsText")}</div>`; hash("#summons");
  } else if (state.mode === "ranking") { hash("#ranking"); drawRanking(); }
  else { hash("#formulas"); showFormulas(); }
}
function fromLocation() {
  const h = location.hash;
  let m;
  if ((m = h.match(/^#unit\/(\d+)/)) && W._unitById[+m[1]]) { state.sel = +m[1]; return "units"; }
  if ((m = h.match(/^#subskill\/(\d+)/)) && W._subById[+m[1]]) { state.ssel = +m[1]; state.stab = W._subById[+m[1]]._tab; return "subskills"; }
  if ((m = h.match(/^#dungeon\/(\d+)/)) && W.sources.dungeons[m[1]]) {
    state.dsel = +m[1]; state.dtab = W.sources.dungeons[m[1]].type; return "dungeons"; }
  const plain = h.slice(1);
  return MODES.some(([x]) => x === plain) ? plain : "units";
}

/* ---------------- language, pin, search ---------------- */
function applyLang() {
  document.documentElement.lang = isJa() ? "ja" : "en";
  document.querySelectorAll("[data-t]").forEach(el => el.textContent = ui(el.dataset.t));
  document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("on", b.dataset.lang === state.lang));
  $("#search").placeholder = ui("search");
  buildTiles();
  buildSubs();
  buildDungeons();
  setMode(state.mode, true);
}

function setPinned(on) {
  $("#layout").classList.toggle("pinned", on);
  $("#pinBtn").classList.toggle("on", on);
  $("#pinBtn").setAttribute("aria-pressed", on);
  store.set("pinned", on);
}
$("#pinBtn").onclick = () => setPinned(!$("#layout").classList.contains("pinned"));
let facetTimer;
$("#search").oninput = e => {
  state.q = e.target.value; applyFilters();
  clearTimeout(facetTimer); facetTimer = setTimeout(updateFilterUI, 200);
};
$("#listFilterBtn").onclick = () => {
  state.lf = !state.lf;
  $("#subFilter").hidden = !state.lf;
  $("#listFilterBtn").classList.toggle("open", state.lf);
};
$("#subFilter").onchange = e => {                // Show Etc.: the Etc. tab on / off
  if (e.target.id !== "showEtc") return;
  state.showEtc = e.target.checked;
  store.set("showEtc", state.showEtc);
  const tab = $('#subs [data-stab="etc"]');
  if (tab) tab.hidden = !state.showEtc;
  if (!state.showEtc && state.stab === "etc") setSubTab("drop");
  else applyFilters(true);                                  // the total counts Etc. or not
};
$("#subFilter").onclick = e => {
  if (e.target.closest("#sortBtn")) { $("#sortMenu").hidden = !$("#sortMenu").hidden; return; }
  const so = e.target.closest("[data-sort]");
  if (so || e.target.closest("#sortDir")) {
    if (so) { if (state.sort !== so.dataset.sort) state.sortDir = SORT_DIR0[so.dataset.sort]; state.sort = so.dataset.sort; }
    else state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    store.set("sort", state.sort); store.set("sortDir", state.sortDir);
    $("#subFilter .sortbox").outerHTML = sortHTML();
    sortTiles();
    return;
  }
  const dx = e.target.closest(".ddpick .x");
  if (dx) { e.stopPropagation(); toggle(dx.closest("[data-group]").dataset.group, dx.parentElement.dataset.v); return; }
  const dd = e.target.closest(".dd-btn");
  if (dd) { toggleList(dd.parentElement); return; }
  const opt = e.target.closest(".opt");
  if (opt) toggle(opt.closest("[data-group]").dataset.group, opt.dataset.v);
};
/* each side clears only itself (owner, session 5): the panel's button = the advanced filter;
   the reset button on the left = the search and the left filter (the list's own groups) */
function clearSide(left) {
  for (const g of GROUPS) if ((g.sec === "list") === left) picks(g.id).clear();
  if (!left && $("#fxSearch")) { state.fq = ""; $("#fxSearch").value = ""; markSearch(); }
  updateFilterUI(); applyFilters();
}
$("#clear").onclick = () => clearSide(false);
$("#reset").onclick = () => { state.q = ""; $("#search").value = ""; clearSide(true); };
window.addEventListener("hashchange", () => {
  const mode = fromLocation();
  setTimeout(mobileView);
  if (mode !== state.mode) setMode(mode, true);
  else if (mode === "units" && state.sel) select(state.sel, true);
  else if (mode === "subskills" && state.ssel) selectSub(state.ssel, true);
  else if (mode === "dungeons" && state.dsel) selectDungeon(state.dsel, true);
});

/* ---------------- start ---------------- */
fetch("data/wiki.json", { cache: "no-cache" }).then(r => r.json()).then(data => {
  W = data;
  W._tagById = Object.fromEntries(W.lookups.tags.map(t => [t.id, t]));
  W._unitById = Object.fromEntries(W.units.map(u => [u.id, u]));
  W.units.forEach(prep);
  W._subs = Object.entries(W.subskills.subskills).map(([id, x]) => (prepSub(id, x), x));
  W._subById = Object.fromEntries(W._subs.map(x => [x.id, x]));
  $("#menuBtn").title = `Data ${W.meta.ab_version} · ${W.meta.build} · ${W.meta.date}`;
  setPinned(store.get("pinned", false));
  state.mode = fromLocation();
  applyLang();
  mobileView();
}).catch(err => {
  $("#detail").innerHTML = `<div class="empty">Could not load data/wiki.json (${esc(err.message)}).<br>
    Run <code>py -m wikitool export</code>, then open the site with <code>py -m wikitool site</code>.</div>`;
});
