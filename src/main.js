import { advertisers as seedAdvertisers } from "./data/advertisers.js";
import "./styles.css";

const STORAGE_KEY = "ad-affiliate-transparency-board:v1";
const state = { rows: loadRows(), search: "", category: "全部行业", model: "全部模式", transparency: "全部透明度", sortKey: "updatedAt", sortDir: "desc" };
const app = document.querySelector("#app");

function loadRows() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedAdvertisers; } catch { return seedAdvertisers; } }
function saveRows() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.rows)); }
function uniqueOptions(key, prefix) { return [prefix, ...Array.from(new Set(state.rows.map((r) => r[key]).filter(Boolean))).sort()]; }
function filteredRows() {
  const kw = state.search.trim().toLowerCase();
  return state.rows.filter((r) => {
    const text = Object.values(r).join(" ").toLowerCase();
    return (!kw || text.includes(kw)) && (state.category === "全部行业" || r.category === state.category) && (state.model === "全部模式" || r.model.includes(state.model)) && (state.transparency === "全部透明度" || r.transparency === state.transparency);
  }).sort((a, b) => {
    const left = String(a[state.sortKey] || "");
    const right = String(b[state.sortKey] || "");
    return state.sortDir === "asc" ? left.localeCompare(right, "zh-Hans-CN") : right.localeCompare(left, "zh-Hans-CN");
  });
}
function escapeHtml(v) { return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function csvEscape(v) { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s; }
function stat(label, value, hint) { return `<article class="stat-card"><span>${label}</span><strong>${value}</strong><small>${hint}</small></article>`; }
function select(id, options, value) { return `<select id="${id}">${options.map((o) => `<option value="${escapeHtml(o)}" ${o === value ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}</select>`; }
function th(key, label) { const arrow = state.sortKey === key ? (state.sortDir === "asc" ? " ↑" : " ↓") : ""; return `<th><button class="th-button" data-sort="${key}">${label}${arrow}</button></th>`; }
function badge(v) { const cls = { "公开": "success", "需申请": "warning", "联系商务": "business", "待核实": "muted" }[v] || "muted"; return `<span class="badge ${cls}">${escapeHtml(v)}</span>`; }
function row(r) { return `<tr><td><strong>${escapeHtml(r.advertiser)}</strong><small>${escapeHtml(r.source)}</small></td><td>${escapeHtml(r.project)}<small>${escapeHtml(r.requirements)}</small></td><td><span class="pill">${escapeHtml(r.category)}</span></td><td>${escapeHtml(r.model)}</td><td class="price">${escapeHtml(r.price)}<small>最低提现：${escapeHtml(r.minPayout)}｜归因：${escapeHtml(r.cookie)}</small></td><td>${escapeHtml(r.geo)}</td><td>${badge(r.transparency)}</td><td>${escapeHtml(r.updatedAt)}</td></tr>`; }

function render() {
  const rows = filteredRows();
  const stats = { pub: rows.filter((r) => r.transparency === "公开").length, apply: rows.filter((r) => r.transparency === "需申请").length, biz: rows.filter((r) => r.transparency === "联系商务").length, cats: new Set(rows.map((r) => r.category)).size };
  app.innerHTML = `<header class="hero"><nav class="nav"><div class="brand">广告联盟透明报价台</div><a class="github-link" href="https://github.com/miaofei1985/lala4" target="_blank" rel="noreferrer">GitHub 项目</a></nav><section class="hero-grid"><div><p class="eyebrow">Affiliate Price Intelligence</p><h1>把广告主项目、计费模式和价格状态放到一个透明页面。</h1><p class="subtitle">适合广告联盟、导购站、流量主、运营团队维护广告主报价库。所有价格都带透明度、来源和更新时间。</p><div class="actions"><button id="exportCsv">导出 CSV</button><label class="upload-button">导入 CSV<input id="importCsv" type="file" accept=".csv,text/csv" hidden /></label><button class="secondary" id="resetData">恢复样例数据</button></div></div><div class="notice-card"><strong>数据原则</strong><p>广告价格会随国家、流量质量、类目和合同变化。页面会明确标注“公开、需申请、联系商务、待核实”。</p></div></section></header><main class="container"><section class="stats-grid">${stat("当前结果", rows.length, "条广告项目")}${stat("公开报价", stats.pub, "官网或后台可核实")}${stat("需申请", stats.apply, "后台批准后可见")}${stat("联系商务", stats.biz, "合同或商务报价")}</section><section class="filters"><input id="search" type="search" placeholder="搜索广告主、联盟、项目、国家、要求..." value="${escapeHtml(state.search)}" />${select("category", uniqueOptions("category", "全部行业"), state.category)}${select("model", ["全部模式", "CPC", "CPM", "CPA", "CPS", "CPL", "RevShare", "收入分成", "佣金分成"], state.model)}${select("transparency", uniqueOptions("transparency", "全部透明度"), state.transparency)}</section><section class="table-card"><div class="table-header"><div><h2>广告主项目与价格表</h2><p>点击表头可排序；价格列建议后续接入官方后台、合同或 API 自动更新。</p></div><span>${stats.cats} 个行业分类</span></div><div class="table-wrap"><table><thead><tr>${th("advertiser", "广告主 / 联盟")}${th("project", "项目")}${th("category", "行业")}${th("model", "计费")}${th("price", "价格 / 佣金")}${th("geo", "地区")}${th("transparency", "透明度")}${th("updatedAt", "更新")}</tr></thead><tbody>${rows.map(row).join("") || `<tr><td colspan="8" class="empty">没有匹配结果，请调整筛选条件。</td></tr>`}</tbody></table></div></section><section class="guide-grid"><article><h3>怎样做到明明白白</h3><p>每条数据都必须有价格说明、来源、更新时间和透明度。没有官方价格的广告主不要瞎填。</p></article><article><h3>后续可接入</h3><p>Supabase / PostgreSQL 管理后台、定时价格更新、报价截图存档、广告主审核状态。</p></article><article><h3>CSV 字段</h3><p>advertiser, project, category, geo, model, price, minPayout, cookie, requirements, transparency, source, updatedAt</p></article></section></main>`;
  bindEvents();
}

function bindEvents() {
  document.querySelector("#search").addEventListener("input", (e) => { state.search = e.target.value; render(); });
  ["category", "model", "transparency"].forEach((id) => document.querySelector(`#${id}`).addEventListener("change", (e) => { state[id] = e.target.value; render(); }));
  document.querySelectorAll("[data-sort]").forEach((b) => b.addEventListener("click", () => { const key = b.dataset.sort; if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc"; else { state.sortKey = key; state.sortDir = "asc"; } render(); }));
  document.querySelector("#exportCsv").addEventListener("click", exportCsv);
  document.querySelector("#importCsv").addEventListener("change", importCsv);
  document.querySelector("#resetData").addEventListener("click", () => { state.rows = seedAdvertisers; saveRows(); render(); });
}
function exportCsv() { const headers = ["advertiser", "project", "category", "geo", "model", "price", "minPayout", "cookie", "requirements", "transparency", "source", "updatedAt"]; const lines = [headers.join(","), ...state.rows.map((r) => headers.map((h) => csvEscape(r[h])).join(","))]; const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "advertisers.csv"; a.click(); URL.revokeObjectURL(url); }
function splitCsvLine(line) { const out = []; let cur = "", q = false; for (let i = 0; i < line.length; i++) { const c = line[i], n = line[i + 1]; if (c === '"' && q && n === '"') { cur += '"'; i++; } else if (c === '"') q = !q; else if (c === "," && !q) { out.push(cur); cur = ""; } else cur += c; } out.push(cur); return out; }
function importCsv(e) { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { const lines = String(reader.result || "").split(/\r?\n/).filter(Boolean); if (lines.length < 2) return alert("CSV 没有可导入的数据"); const headers = splitCsvLine(lines[0]); state.rows = lines.slice(1).map((line) => splitCsvLine(line).reduce((r, v, i) => (r[headers[i]] = v, r), {})); saveRows(); render(); }; reader.readAsText(file, "utf-8"); }
render();
