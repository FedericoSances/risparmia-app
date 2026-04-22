import { useState, useEffect, useMemo } from "react";

const DEFAULT_CATEGORIES = [
  { id: "vizi", label: "Vizi", emoji: "🚬" },
  { id: "cibo", label: "Cibo", emoji: "🍕" },
  { id: "trasporti", label: "Trasporti", emoji: "🚌" },
  { id: "svago", label: "Svago", emoji: "🎮" },
  { id: "casa", label: "Casa", emoji: "🏠" },
  { id: "shopping", label: "Shopping", emoji: "🛒" },
  { id: "salute", label: "Salute", emoji: "💊" },
  { id: "altro", label: "Altro", emoji: "⭐" },
];

const THEMES = [
  { id: "verde", label: "Verde foresta", accent: "#22c55e", bg: "#0d1a0f", card: "#1a2e1c", border: "#2d4a30", sub: "#64748b" },
  { id: "blu", label: "Oceano notturno", accent: "#38bdf8", bg: "#0a1628", card: "#0f2040", border: "#1e3a5f", sub: "#64748b" },
  { id: "viola", label: "Galassia", accent: "#a78bfa", bg: "#120d1f", card: "#1e1535", border: "#2e1f52", sub: "#6b6a7a" },
  { id: "ambra", label: "Tramonto", accent: "#f59e0b", bg: "#1a1100", card: "#2a1e00", border: "#3d2e00", sub: "#7a6a4a" },
  { id: "rosa", label: "Ciliegio", accent: "#f472b6", bg: "#1a0d14", card: "#2d1520", border: "#4a1f35", sub: "#7a5a6a" },
];

const CAT_COLORS = {
  vizi: "#a78bfa", cibo: "#fb923c", trasporti: "#60a5fa",
  svago: "#f472b6", casa: "#34d399", shopping: "#fbbf24",
  salute: "#f87171", altro: "#94a3b8",
};

const MONTHS_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const DAYS_IT = ["lun","mar","mer","gio","ven","sab","dom"];

function fmt(n) {
  return Number(n).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STORE_KEY = "risparmia_v5";
function loadData() {
  try { const d = localStorage.getItem(STORE_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
}
function saveData(data) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch {}
}

export default function App() {
  const today = new Date();
  const [tab, setTab] = useState("calendario");
  const [prevTab, setPrevTab] = useState("calendario");
  const [curYear, setCurYear] = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());
  const [selDay, setSelDay] = useState(today.getDate());
  const [spese, setSpese] = useState({});
  const [entrate, setEntrate] = useState({});
  const [presets, setPresets] = useState([
    { id: 1, nome: "Sigarette", importo: 5.80, categoria: "vizi" },
    { id: 2, nome: "Terea", importo: 5.50, categoria: "vizi" },
  ]);
  const [speseFisse, setSpeseFisse] = useState([]);
  const [extraCats, setExtraCats] = useState([]);
  const [themeId, setThemeId] = useState("verde");
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [tipoSpesaFissa, setTipoSpesaFissa] = useState("mensile");

  const [customDesc, setCustomDesc] = useState("");
  const [customAmt, setCustomAmt] = useState("");
  const [customCat, setCustomCat] = useState("altro");
  const [customNote, setCustomNote] = useState("");

  const [entrataDesc, setEntrataDesc] = useState("Stipendio");
  const [entrataAmt, setEntrataAmt] = useState("");
  const [entrataData, setEntrataData] = useState(today.toISOString().slice(0, 10));

  const [newPresetNome, setNewPresetNome] = useState("");
  const [newPresetAmt, setNewPresetAmt] = useState("");
  const [newPresetCat, setNewPresetCat] = useState("altro");

  const [sfDesc, setSfDesc] = useState("");
  const [sfAmt, setSfAmt] = useState("");
  const [sfCat, setSfCat] = useState("altro");
  const [sfGiorno, setSfGiorno] = useState("");

  const [spDesc, setSpDesc] = useState("");
  const [spAmt, setSpAmt] = useState("");
  const [spCat, setSpCat] = useState("altro");
  const [spGiornoInizio, setSpGiornoInizio] = useState("");
  const [spGiornoFine, setSpGiornoFine] = useState("");
  const [spFreq, setSpFreq] = useState("1");

  const [storYear, setStorYear] = useState(today.getFullYear());
  const [storMonth, setStorMonth] = useState(today.getMonth() === 0 ? 11 : today.getMonth() - 1);

  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("");

  useEffect(() => {
    const d = loadData();
    if (d) {
      if (d.spese) setSpese(d.spese);
      if (d.entrate) setEntrate(d.entrate);
      if (d.presets) setPresets(d.presets);
      if (d.speseFisse) setSpeseFisse(d.speseFisse);
      if (d.extraCats) setExtraCats(d.extraCats);
      if (d.themeId) setThemeId(d.themeId);
    }
  }, []);

  useEffect(() => {
    saveData({ spese, entrate, presets, speseFisse, extraCats, themeId });
  }, [spese, entrate, presets, speseFisse, extraCats, themeId]);

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const CATEGORIES = [...DEFAULT_CATEGORIES, ...extraCats];
  const getCatEmoji = (id) => CATEGORIES.find(c => c.id === id)?.emoji || "⭐";
  const getCatLabel = (id) => CATEGORIES.find(c => c.id === id)?.label || id;
  const getCatColor = (id) => CAT_COLORS[id] || theme.accent;

  const monthKey = `${curYear}-${curMonth}`;

  function calcSaldo(year, month, depth) {
    if (depth > 24) return 0;
    let pm = month - 1, py = year;
    if (pm < 0) { pm = 11; py--; }
    const pk = `${py}-${pm}`;
    const hasData = entrate[pk] || spese[pk];
    if (!hasData) return 0;
    const prevSaldo = calcSaldo(py, pm, depth + 1);
    const prevEnt = (entrate[pk] || []).reduce((s, x) => s + x.importo, 0);
    const prevSp = Object.values(spese[pk] || {}).flat().reduce((s, x) => s + x.importo, 0);
    const prevFisse = speseFisse.filter(x => x.tipo !== "periodica").reduce((s, x) => s + x.importo, 0);
    const prevPeriodiche = speseFisse.filter(x => x.tipo === "periodica").reduce((acc, sp) => {
      const inizio = sp.giornoInizio || 1;
      const fine = sp.giornoFine || 28;
      const freq = sp.freq || 1;
      let tot = 0;
      for (let g = inizio; g <= fine; g += freq) tot += sp.importo;
      return acc + tot;
    }, 0);
    return prevSaldo + prevEnt - prevSp - prevFisse - prevPeriodiche;
  }

  const saldoPortato = useMemo(() => calcSaldo(curYear, curMonth, 0), [curYear, curMonth, spese, entrate, speseFisse]);

  const speseDelMese = useMemo(() => {
    const mese = spese[monthKey] || {};
    return Object.values(mese).flat();
  }, [spese, monthKey]);

  const spesePeriodicheDelMese = useMemo(() => {
    return speseFisse.filter(x => x.tipo === "periodica").reduce((acc, sp) => {
      const inizio = sp.giornoInizio || 1;
      const fine = sp.giornoFine || 28;
      const freq = sp.freq || 1;
      for (let g = inizio; g <= fine; g += freq) {
        acc.push({ ...sp, giornoEffettivo: Math.round(g) });
      }
      return acc;
    }, []);
  }, [speseFisse]);

  const totaleSpeseM = speseDelMese.reduce((s, x) => s + x.importo, 0);
  const totaleSpeseFixedM = speseFisse.filter(x => x.tipo !== "periodica").reduce((s, x) => s + x.importo, 0);
  const totaleSpesePeriodicheM = spesePeriodicheDelMese.reduce((s, x) => s + x.importo, 0);
  const totaleSpeseAll = totaleSpeseM + totaleSpeseFixedM + totaleSpesePeriodicheM;

  const totalEntrateM = useMemo(() => {
    return (entrate[monthKey] || []).reduce((s, x) => s + x.importo, 0);
  }, [entrate, monthKey]);

  const risparmioNetto = saldoPortato + totalEntrateM - totaleSpeseAll;
  const percSpesa = (saldoPortato + totalEntrateM) > 0 ? (totaleSpeseAll / (saldoPortato + totalEntrateM) * 100).toFixed(1) : null;

  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const firstDow = (new Date(curYear, curMonth, 1).getDay() + 6) % 7;
  const speseDel = (d) => (spese[monthKey]?.[d] || []).reduce((s, x) => s + x.importo, 0);

  const todayDay = today.getMonth() === curMonth && today.getFullYear() === curYear ? today.getDate() : daysInMonth;
  const mediaGiornaliera = daysInMonth > 0 ? totaleSpeseAll / daysInMonth : 0;
  const proiezioneMese = todayDay > 0 ? (totaleSpeseAll / todayDay) * daysInMonth : 0;

  const spesePCat = useMemo(() => {
    const acc = {};
    speseDelMese.forEach(x => { acc[x.cat] = (acc[x.cat] || 0) + x.importo; });
    speseFisse.filter(x => x.tipo !== "periodica").forEach(x => { acc[x.cat] = (acc[x.cat] || 0) + x.importo; });
    spesePeriodicheDelMese.forEach(x => { acc[x.cat] = (acc[x.cat] || 0) + x.importo; });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [speseDelMese, speseFisse, spesePeriodicheDelMese]);

  const top5 = useMemo(() => {
    const acc = {};
    speseDelMese.forEach(x => { acc[x.desc] = (acc[x.desc] || 0) + x.importo; });
    speseFisse.filter(x => x.tipo !== "periodica").forEach(x => { acc[x.desc] = (acc[x.desc] || 0) + x.importo; });
    spesePeriodicheDelMese.forEach(x => { acc[x.desc] = (acc[x.desc] || 0) + x.importo; });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [speseDelMese, speseFisse, spesePeriodicheDelMese]);

  const storKey = `${storYear}-${storMonth}`;
  const storSpeseRaw = useMemo(() => {
    const mese = spese[storKey] || {};
    return Object.entries(mese).flatMap(([day, arr]) => arr.map(x => ({ ...x, giorno: parseInt(day) })));
  }, [spese, storKey]);
  const storSaldoPortato = useMemo(() => calcSaldo(storYear, storMonth, 0), [storYear, storMonth, spese, entrate, speseFisse]);
  const storFisse = speseFisse.filter(x => x.tipo !== "periodica").reduce((s, x) => s + x.importo, 0);
  const storPeriodiche = speseFisse.filter(x => x.tipo === "periodica").reduce((acc, sp) => {
    const inizio = sp.giornoInizio || 1;
    const fine = sp.giornoFine || 28;
    const freq = sp.freq || 1;
    let tot = 0;
    for (let g = inizio; g <= fine; g += freq) tot += sp.importo;
    return acc + tot;
  }, 0);
  const storTotaleSpese = storSpeseRaw.reduce((s, x) => s + x.importo, 0) + storFisse + storPeriodiche;
  const storEntrate = entrate[storKey] || [];
  const storTotaleEntrate = storEntrate.reduce((s, x) => s + x.importo, 0);
  const storRisparmio = storSaldoPortato + storTotaleEntrate - storTotaleSpese;
  const storPercSpesa = (storSaldoPortato + storTotaleEntrate) > 0 ? (storTotaleSpese / (storSaldoPortato + storTotaleEntrate) * 100).toFixed(1) : null;
  const storCat = useMemo(() => {
    const acc = {};
    storSpeseRaw.forEach(x => { acc[x.cat] = (acc[x.cat] || 0) + x.importo; });
    speseFisse.filter(x => x.tipo !== "periodica").forEach(x => { acc[x.cat] = (acc[x.cat] || 0) + x.importo; });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [storSpeseRaw, speseFisse]);

  function addSpesa(importo, desc, cat, note) {
    if (!importo || importo <= 0) return;
    setSpese(prev => {
      const m = { ...(prev[monthKey] || {}) };
      const day = m[selDay] ? [...m[selDay]] : [];
      day.push({ id: Date.now(), desc, importo: Number(importo), cat, note: note || "" });
      return { ...prev, [monthKey]: { ...m, [selDay]: day } };
    });
  }

  function removeSpesa(dayN, id) {
    setSpese(prev => {
      const m = { ...(prev[monthKey] || {}) };
      m[dayN] = (m[dayN] || []).filter(x => x.id !== id);
      return { ...prev, [monthKey]: { ...m } };
    });
  }

  function addEntrata() {
    const amt = parseFloat(entrataAmt);
    if (!amt || amt <= 0 || !entrataDesc.trim()) return;
    setEntrate(prev => {
      const list = [...(prev[monthKey] || [])];
      list.push({ id: Date.now(), desc: entrataDesc, importo: amt, data: entrataData });
      return { ...prev, [monthKey]: list };
    });
    setEntrataAmt("");
  }

  function removeEntrata(id) {
    setEntrate(prev => {
      const list = (prev[monthKey] || []).filter(x => x.id !== id);
      return { ...prev, [monthKey]: list };
    });
  }

  function addPreset() {
    const amt = parseFloat(newPresetAmt);
    if (!newPresetNome.trim() || !amt || amt <= 0) return;
    setPresets(prev => [...prev, { id: Date.now(), nome: newPresetNome, importo: amt, categoria: newPresetCat }]);
    setNewPresetNome(""); setNewPresetAmt(""); setNewPresetCat("altro");
  }

  function addSpesaFissa() {
    const amt = parseFloat(sfAmt);
    if (!sfDesc.trim() || !amt || amt <= 0) return;
    const giorno = sfGiorno ? parseInt(sfGiorno) : null;
    setSpeseFisse(prev => [...prev, { id: Date.now(), desc: sfDesc, importo: amt, cat: sfCat, giorno, tipo: "mensile" }]);
    setSfDesc(""); setSfAmt(""); setSfCat("altro"); setSfGiorno("");
  }

  function addSpesaPeriodica() {
    const amt = parseFloat(spAmt);
    const inizio = parseInt(spGiornoInizio);
    const fine = parseInt(spGiornoFine);
    const freq = parseInt(spFreq) || 1;
    if (!spDesc.trim() || !amt || amt <= 0 || !inizio || !fine || inizio > fine) return;
    setSpeseFisse(prev => [...prev, { id: Date.now(), desc: spDesc, importo: amt, cat: spCat, giornoInizio: inizio, giornoFine: fine, freq, tipo: "periodica" }]);
    setSpDesc(""); setSpAmt(""); setSpCat("altro"); setSpGiornoInizio(""); setSpGiornoFine(""); setSpFreq("1");
  }

  function addExtraCat() {
    if (!newCatLabel.trim()) return;
    const id = "cat_" + Date.now();
    const emoji = newCatEmoji.trim() || "📌";
    setExtraCats(prev => [...prev, { id, label: newCatLabel.trim(), emoji }]);
    setNewCatLabel(""); setNewCatEmoji("");
  }

  function resetAll() {
    setSpese({}); setEntrate({});
    setPresets([
      { id: 1, nome: "Sigarette", importo: 5.80, categoria: "vizi" },
      { id: 2, nome: "Terea", importo: 5.50, categoria: "vizi" },
    ]);
    setSpeseFisse([]); setExtraCats([]);
    setShowResetConfirm(false);
  }

  function handleGear() {
    if (tab === "impostazioni") {
      setTab(prevTab);
    } else {
      setPrevTab(tab);
      setTab("impostazioni");
    }
  }

  const speseSelDay = spese[monthKey]?.[selDay] || [];
  const speseFisseSelDay = speseFisse.filter(x => x.tipo !== "periodica" && x.giorno === selDay);
  const spesePeriodicheSelDay = spesePeriodicheDelMese.filter(x => x.giornoEffettivo === selDay);
  const totaleSelDay = speseSelDay.reduce((s, x) => s + x.importo, 0)
    + speseFisseSelDay.reduce((s, x) => s + x.importo, 0)
    + spesePeriodicheSelDay.reduce((s, x) => s + x.importo, 0);

  const s = {
    app: { background: theme.bg, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "system-ui,sans-serif", color: "#e2e8f0", maxWidth: 430, margin: "0 auto" },
    logoBox: { width: 36, height: 36, borderRadius: 10, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
    presetBtn: { background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, color: "#e2e8f0", padding: "0 10px", height: 36, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" },
    kpiGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
    kpi: { background: theme.card, borderRadius: 10, padding: "10px 12px" },
    kpiLabel: { fontSize: 10, color: theme.sub, textTransform: "uppercase", letterSpacing: 0.5, margin: 0 },
    kpiVal: (col) => ({ fontSize: 18, fontWeight: 700, color: col || "#fbbf24", margin: "2px 0 0" }),
    tabs: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, background: theme.card, margin: "0 16px 12px", borderRadius: 12, padding: 4 },
    tabBtn: (active) => ({ padding: "10px 0", borderRadius: 8, border: "none", background: active ? theme.bg : "transparent", color: active ? "#e2e8f0" : theme.sub, fontSize: 12, cursor: "pointer", fontWeight: active ? 600 : 400 }),
    content: { flex: 1, padding: "0 16px 80px" },
    card: { background: theme.card, borderRadius: 12, padding: "14px", marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 600, color: "#e2e8f0", margin: "0 0 10px" },
    label: { fontSize: 11, color: theme.sub, margin: "0 0 4px" },
    input: { width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, color: "#e2e8f0", padding: "8px 10px", fontSize: 14, boxSizing: "border-box" },
    greenBtn: { width: "100%", background: theme.accent, border: "none", borderRadius: 8, color: theme.bg, padding: "11px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 },
    catGrid: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 },
    catPill: (active) => ({ background: active ? theme.accent : theme.bg, border: `1px solid ${active ? theme.accent : theme.border}`, borderRadius: 20, padding: "5px 10px", fontSize: 12, color: active ? theme.bg : "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }),
    presetChip: { background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
    delBtn: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, padding: 0 },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${theme.bg}` },
    segmented: (active) => ({ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: active ? theme.accent : theme.bg, color: active ? theme.bg : theme.sub, fontSize: 12, cursor: "pointer", fontWeight: active ? 600 : 400 }),
  };

  const KpiSection = () => (
    <div style={s.kpiGrid}>
      {saldoPortato !== 0 && (
        <div style={{ ...s.kpi, gridColumn: "1 / -1" }}>
          <p style={s.kpiLabel}>Saldo da mese precedente</p>
          <p style={s.kpiVal(saldoPortato >= 0 ? theme.accent : "#f87171")}>{fmt(saldoPortato)} €</p>
        </div>
      )}
      <div style={s.kpi}><p style={s.kpiLabel}>Entrate mese</p><p style={s.kpiVal("#fbbf24")}>{fmt(totalEntrateM)} €</p></div>
      <div style={s.kpi}><p style={s.kpiLabel}>Spese mese</p><p style={s.kpiVal(theme.accent)}>{fmt(totaleSpeseAll)} €</p></div>
      <div style={s.kpi}><p style={s.kpiLabel}>Risparmio netto</p><p style={s.kpiVal(risparmioNetto >= 0 ? theme.accent : "#f87171")}>{fmt(risparmioNetto)} €</p></div>
      <div style={s.kpi}><p style={s.kpiLabel}>% Spesa / Entrate</p><p style={s.kpiVal(theme.accent)}>{percSpesa !== null ? percSpesa + "%" : "---"}</p></div>
    </div>
  );

  return (
    <div style={s.app}>
      <div style={{ padding: "16px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={s.logoBox}>💼</div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Risparmia</p>
            <p style={{ fontSize: 11, color: theme.sub, margin: 0 }}>Traccia ogni spesa, costruisci il tuo futuro</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={s.presetBtn} onClick={() => setShowPresetModal(true)}>+ preset</button>
          <button onClick={handleGear} style={{ background: tab === "impostazioni" ? theme.accent : theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, color: tab === "impostazioni" ? theme.bg : "#e2e8f0", width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</button>
        </div>
      </div>

      <div style={s.tabs}>
        {[["calendario","📅 Calendario"],["statistiche","📊 Statistiche"],["entrate","↕ Entrate"],["storico","🗂 Storico"]].map(([k, l]) => (
          <button key={k} style={s.tabBtn(tab === k)} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab !== "impostazioni" && (
        <div style={{ padding: "0 16px 12px" }}><KpiSection /></div>
      )}

      <div style={s.content}>

        {tab === "calendario" && (
          <>
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <button onClick={() => { let m = curMonth - 1, y = curYear; if (m < 0) { m = 11; y--; } setCurMonth(m); setCurYear(y); setSelDay(1); }} style={{ background: "none", border: "none", color: "#e2e8f0", fontSize: 20, cursor: "pointer" }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{MONTHS_IT[curMonth]} {curYear}</span>
                <button onClick={() => { let m = curMonth + 1, y = curYear; if (m > 11) { m = 0; y++; } setCurMonth(m); setCurYear(y); setSelDay(1); }} style={{ background: "none", border: "none", color: "#e2e8f0", fontSize: 20, cursor: "pointer" }}>›</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
                {DAYS_IT.map(d => <div key={d} style={{ fontSize: 10, color: theme.sub, paddingBottom: 4 }}>{d}</div>)}
                {Array.from({ length: firstDow }).map((_, i) => <div key={"e" + i} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const hasSp = speseDel(d) > 0;
                  const hasEn = (entrate[monthKey] || []).some(x => new Date(x.data).getDate() === d);
                  const hasFissa = speseFisse.some(x => x.tipo !== "periodica" && x.giorno === d);
                  const hasPeriodica = spesePeriodicheDelMese.some(x => x.giornoEffettivo === d);
                  const isSel = d === selDay;
                  const isToday = d === today.getDate() && curMonth === today.getMonth() && curYear === today.getFullYear();
                  const dots = [];
                  if (hasSp) dots.push(isSel ? theme.bg : theme.accent);
                  if (hasEn) dots.push(isSel ? theme.bg : "#fbbf24");
                  if (hasFissa || hasPeriodica) dots.push(isSel ? theme.bg : "#a78bfa");
                  return (
                    <div key={d} onClick={() => setSelDay(d)} style={{ padding: "6px 2px", borderRadius: 8, cursor: "pointer", background: isSel ? theme.accent : isToday ? theme.card : "transparent", color: isSel ? theme.bg : "#e2e8f0", fontSize: 13, fontWeight: isSel ? 700 : 400, position: "relative" }}>
                      {d}
                      {dots.length > 0 && (
                        <div style={{ position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 }}>
                          {dots.map((col, idx) => <span key={idx} style={{ width: 4, height: 4, borderRadius: 2, background: col, display: "block" }} />)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <span style={{ fontSize: 10, color: theme.accent }}>● Spese</span>
                <span style={{ fontSize: 10, color: "#fbbf24" }}>● Entrate</span>
                <span style={{ fontSize: 10, color: "#a78bfa" }}>● Fisse</span>
              </div>
            </div>

            <div style={s.card}>
              <div style={{ fontSize: 11, color: theme.sub }}>GIORNO SELEZIONATO</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
                {["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"][new Date(curYear, curMonth, selDay).getDay()]} {selDay} {MONTHS_IT[curMonth]}
              </div>
              <div style={{ background: theme.accent, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: theme.bg, fontWeight: 600 }}>TOTALE DEL GIORNO</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.bg }}>{fmt(totaleSelDay)} €</div>
              </div>

              {presets.length > 0 && (
                <>
                  <div style={s.sectionTitle}>Aggiungi rapido</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {presets.map(p => (
                      <div key={p.id} style={s.presetChip} onClick={() => addSpesa(p.importo, p.nome, p.categoria, "")}>
                        <span style={{ fontSize: 16 }}>{getCatEmoji(p.categoria)}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nome}</div>
                          <div style={{ fontSize: 11, color: theme.accent }}>{fmt(p.importo)} €</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={s.sectionTitle}>Spesa personalizzata</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Descrizione" style={{ ...s.input, flex: 1 }} />
                <input value={customAmt} onChange={e => setCustomAmt(e.target.value)} placeholder="€" type="number" style={{ ...s.input, width: 70, flex: "none" }} />
                <button onClick={() => { addSpesa(parseFloat(customAmt), customDesc || "Spesa", customCat, customNote); setCustomDesc(""); setCustomAmt(""); setCustomNote(""); }} style={{ background: theme.accent, border: "none", borderRadius: 8, color: theme.bg, width: 38, fontSize: 20, cursor: "pointer", fontWeight: 700 }}>+</button>
              </div>
              <input value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="Nota opzionale (es. cena con Marco)" style={{ ...s.input, marginBottom: 8, fontSize: 12 }} />
              <div style={s.catGrid}>
                {CATEGORIES.map(c => (
                  <button key={c.id} style={s.catPill(customCat === c.id)} onClick={() => setCustomCat(c.id)}>
                    <span style={{ fontSize: 14 }}>{c.emoji}</span>{c.label}
                  </button>
                ))}
              </div>

              {(speseSelDay.length > 0 || speseFisseSelDay.length > 0 || spesePeriodicheSelDay.length > 0) && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, color: theme.sub, marginBottom: 6 }}>Spese registrate ({speseSelDay.length + speseFisseSelDay.length + spesePeriodicheSelDay.length})</div>
                  {speseSelDay.map(x => (
                    <div key={x.id} style={{ ...s.row, flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{getCatEmoji(x.cat)}</span>
                          <div>
                            <div style={{ fontSize: 14 }}>{x.desc}</div>
                            <div style={{ fontSize: 11, color: theme.sub }}>{getCatLabel(x.cat)}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: theme.accent }}>{fmt(x.importo)} €</span>
                          <button onClick={() => removeSpesa(selDay, x.id)} style={s.delBtn}>🗑</button>
                        </div>
                      </div>
                      {x.note && <div style={{ fontSize: 11, color: theme.sub, paddingLeft: 26, fontStyle: "italic" }}>"{x.note}"</div>}
                    </div>
                  ))}
                  {speseFisseSelDay.map(x => (
                    <div key={x.id} style={s.row}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{getCatEmoji(x.cat)}</span>
                        <div>
                          <div style={{ fontSize: 14 }}>{x.desc}</div>
                          <div style={{ fontSize: 11, color: "#a78bfa" }}>Spesa fissa · {getCatLabel(x.cat)}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#a78bfa" }}>{fmt(x.importo)} €</span>
                    </div>
                  ))}
                  {spesePeriodicheSelDay.map((x, i) => (
                    <div key={x.id + "_" + i} style={s.row}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{getCatEmoji(x.cat)}</span>
                        <div>
                          <div style={{ fontSize: 14 }}>{x.desc}</div>
                          <div style={{ fontSize: 11, color: "#60a5fa" }}>Periodica · {getCatLabel(x.cat)}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#60a5fa" }}>{fmt(x.importo)} €</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={s.card}>
              <div style={{ display: "flex", background: theme.bg, borderRadius: 10, padding: 3, gap: 3, marginBottom: 14 }}>
                <button style={s.segmented(tipoSpesaFissa === "mensile")} onClick={() => setTipoSpesaFissa("mensile")}>📌 Mensile fissa</button>
                <button style={s.segmented(tipoSpesaFissa === "periodica")} onClick={() => setTipoSpesaFissa("periodica")}>🔁 Periodica</button>
              </div>

              {tipoSpesaFissa === "mensile" && (
                <>
                  <div style={s.sectionTitle}>Spese mensili fisse</div>
                  {speseFisse.filter(x => x.tipo !== "periodica").length === 0
                    ? <div style={{ color: theme.sub, fontSize: 13, fontStyle: "italic", marginBottom: 12 }}>Nessuna spesa fissa aggiunta</div>
                    : speseFisse.filter(x => x.tipo !== "periodica").map(x => (
                      <div key={x.id} style={s.row}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{getCatEmoji(x.cat)}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{x.desc}</div>
                            <div style={{ fontSize: 11, color: theme.sub }}>{getCatLabel(x.cat)}{x.giorno ? " · giorno " + x.giorno : " · nessun giorno fisso"}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#a78bfa" }}>{fmt(x.importo)} €</span>
                          <button onClick={() => setSpeseFisse(prev => prev.filter(sf => sf.id !== x.id))} style={s.delBtn}>🗑</button>
                        </div>
                      </div>
                    ))
                  }
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, color: theme.sub, marginBottom: 6 }}>Aggiungi spesa fissa</div>
                    <input value={sfDesc} onChange={e => setSfDesc(e.target.value)} placeholder="Es. Affitto, Netflix..." style={{ ...s.input, marginBottom: 8 }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div><div style={s.label}>Importo €</div><input value={sfAmt} onChange={e => setSfAmt(e.target.value)} placeholder="0,00" type="number" style={s.input} /></div>
                      <div><div style={s.label}>Giorno del mese (opz.)</div><input value={sfGiorno} onChange={e => setSfGiorno(e.target.value)} placeholder="Es. 4, 20..." type="number" min="1" max="31" style={s.input} /></div>
                    </div>
                    <div style={s.catGrid}>
                      {CATEGORIES.map(c => <button key={c.id} style={s.catPill(sfCat === c.id)} onClick={() => setSfCat(c.id)}><span style={{ fontSize: 14 }}>{c.emoji}</span>{c.label}</button>)}
                    </div>
                    <button style={{ ...s.greenBtn, marginTop: 10 }} onClick={addSpesaFissa}>+ Aggiungi spesa fissa</button>
                  </div>
                </>
              )}

              {tipoSpesaFissa === "periodica" && (
                <>
                  <div style={s.sectionTitle}>Spese periodiche</div>
                  {speseFisse.filter(x => x.tipo === "periodica").length === 0
                    ? <div style={{ color: theme.sub, fontSize: 13, fontStyle: "italic", marginBottom: 12 }}>Nessuna spesa periodica aggiunta</div>
                    : speseFisse.filter(x => x.tipo === "periodica").map(x => (
                      <div key={x.id} style={s.row}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{getCatEmoji(x.cat)}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{x.desc}</div>
                            <div style={{ fontSize: 11, color: theme.sub }}>ogni {x.freq}gg · giorni {x.giornoInizio}-{x.giornoFine} · {getCatLabel(x.cat)}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#60a5fa" }}>{fmt(x.importo)} €</span>
                          <button onClick={() => setSpeseFisse(prev => prev.filter(sf => sf.id !== x.id))} style={s.delBtn}>🗑</button>
                        </div>
                      </div>
                    ))
                  }
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, color: theme.sub, marginBottom: 6 }}>Aggiungi spesa periodica</div>
                    <input value={spDesc} onChange={e => setSpDesc(e.target.value)} placeholder="Es. Pastiglie cane, Palestra..." style={{ ...s.input, marginBottom: 8 }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div><div style={s.label}>Importo €</div><input value={spAmt} onChange={e => setSpAmt(e.target.value)} placeholder="0,00" type="number" style={s.input} /></div>
                      <div><div style={s.label}>Giorno inizio</div><input value={spGiornoInizio} onChange={e => setSpGiornoInizio(e.target.value)} placeholder="Es. 15" type="number" min="1" max="31" style={s.input} /></div>
                      <div><div style={s.label}>Giorno fine</div><input value={spGiornoFine} onChange={e => setSpGiornoFine(e.target.value)} placeholder="Es. 21" type="number" min="1" max="31" style={s.input} /></div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={s.label}>Ogni quanti giorni</div>
                      <input value={spFreq} onChange={e => setSpFreq(e.target.value)} placeholder="Es. 1 = ogni giorno, 2 = a giorni alterni" type="number" min="1" max="31" style={s.input} />
                    </div>
                    <div style={s.catGrid}>
                      {CATEGORIES.map(c => <button key={c.id} style={s.catPill(spCat === c.id)} onClick={() => setSpCat(c.id)}><span style={{ fontSize: 14 }}>{c.emoji}</span>{c.label}</button>)}
                    </div>
                    <button style={{ ...s.greenBtn, marginTop: 10 }} onClick={addSpesaPeriodica}>+ Aggiungi spesa periodica</button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {tab === "statistiche" && (
          <>
            <div style={{ fontSize: 11, color: theme.sub, marginBottom: 4 }}>STATISTICHE</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{MONTHS_IT[curMonth]} {curYear}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={s.kpi}><p style={s.kpiLabel}>Media giornaliera</p><p style={s.kpiVal("#fbbf24")}>{fmt(mediaGiornaliera)} €</p></div>
              <div style={s.kpi}><p style={s.kpiLabel}>Proiezione mese</p><p style={s.kpiVal(theme.accent)}>{fmt(proiezioneMese)} €</p></div>
            </div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Spese per categoria</div>
              {spesePCat.length === 0
                ? <div style={{ color: theme.sub, fontSize: 13, fontStyle: "italic" }}>Nessuna spesa questo mese</div>
                : spesePCat.map(([cat, tot]) => (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                      <span>{getCatEmoji(cat)} {getCatLabel(cat)}</span>
                      <span style={{ color: theme.accent, fontWeight: 600 }}>{fmt(tot)} €</span>
                    </div>
                    <div style={{ background: theme.bg, borderRadius: 4, height: 6 }}>
                      <div style={{ background: getCatColor(cat), height: 6, borderRadius: 4, width: `${Math.min(100, tot / totaleSpeseAll * 100)}%` }} />
                    </div>
                  </div>
                ))
              }
            </div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Top 5 voci del mese</div>
              {top5.length === 0
                ? <div style={{ color: theme.sub, fontSize: 13, fontStyle: "italic" }}>Nessun dato</div>
                : top5.map(([desc, tot], i) => (
                  <div key={desc} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < top5.length - 1 ? `1px solid ${theme.bg}` : "none", fontSize: 13 }}>
                    <span style={{ color: "#94a3b8" }}>#{i + 1} {desc}</span>
                    <span style={{ color: "#fbbf24", fontWeight: 600 }}>{fmt(tot)} €</span>
                  </div>
                ))
              }
            </div>
          </>
        )}

        {tab === "entrate" && (
          <>
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ ...s.logoBox, width: 32, height: 32, borderRadius: 8, fontSize: 15 }}>💼</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Entrate · {MONTHS_IT[curMonth]} {curYear}</div>
                  <div style={{ fontSize: 11, color: theme.sub }}>Stipendi, bonus, regali tutto quello che entra</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: theme.sub }}>TOTALE ENTRATE DEL MESE</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.accent, marginBottom: 14 }}>{fmt(totalEntrateM)} €</div>
              <div style={s.sectionTitle}>Aggiungi entrata</div>
              <div style={s.label}>Descrizione</div>
              <input value={entrataDesc} onChange={e => setEntrataDesc(e.target.value)} style={{ ...s.input, marginBottom: 8 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
                <div><div style={s.label}>Importo €</div><input value={entrataAmt} onChange={e => setEntrataAmt(e.target.value)} placeholder="0,00" type="number" style={s.input} /></div>
                <div><div style={s.label}>Data</div><input value={entrataData} onChange={e => setEntrataData(e.target.value)} type="date" style={s.input} /></div>
              </div>
              <button style={s.greenBtn} onClick={addEntrata}>+ Registra entrata</button>
            </div>
            <div style={{ fontSize: 13, color: theme.sub, marginBottom: 8 }}>Entrate del mese ({(entrate[monthKey] || []).length})</div>
            {(entrate[monthKey] || []).length === 0
              ? <div style={{ color: theme.sub, fontSize: 13, fontStyle: "italic", textAlign: "center", padding: 20 }}>Nessuna entrata registrata per questo mese</div>
              : (entrate[monthKey] || []).map(x => (
                <div key={x.id} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontWeight: 600 }}>{x.desc}</div><div style={{ fontSize: 11, color: theme.sub }}>{x.data}</div></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: theme.accent, fontWeight: 700 }}>{fmt(x.importo)} €</span>
                    <button onClick={() => removeEntrata(x.id)} style={s.delBtn}>🗑</button>
                  </div>
                </div>
              ))
            }
          </>
        )}

        {tab === "storico" && (
          <>
            <div style={{ fontSize: 11, color: theme.sub, marginBottom: 4 }}>STORICO MENSILE</div>
            <div style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => { let m = storMonth - 1, y = storYear; if (m < 0) { m = 11; y--; } setStorMonth(m); setStorYear(y); }} style={{ background: "none", border: "none", color: "#e2e8f0", fontSize: 20, cursor: "pointer" }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{MONTHS_IT[storMonth]} {storYear}</span>
              <button onClick={() => { let m = storMonth + 1, y = storYear; if (m > 11) { m = 0; y++; } setStorMonth(m); setStorYear(y); }} style={{ background: "none", border: "none", color: "#e2e8f0", fontSize: 20, cursor: "pointer" }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {storSaldoPortato !== 0 && <div style={{ ...s.kpi, gridColumn: "1 / -1" }}><p style={s.kpiLabel}>Saldo da mese precedente</p><p style={s.kpiVal(storSaldoPortato >= 0 ? theme.accent : "#f87171")}>{fmt(storSaldoPortato)} €</p></div>}
              <div style={s.kpi}><p style={s.kpiLabel}>Entrate</p><p style={s.kpiVal("#fbbf24")}>{fmt(storTotaleEntrate)} €</p></div>
              <div style={s.kpi}><p style={s.kpiLabel}>Spese totali</p><p style={s.kpiVal(theme.accent)}>{fmt(storTotaleSpese)} €</p></div>
              <div style={s.kpi}><p style={s.kpiLabel}>Risparmio netto</p><p style={s.kpiVal(storRisparmio >= 0 ? theme.accent : "#f87171")}>{fmt(storRisparmio)} €</p></div>
              <div style={s.kpi}><p style={s.kpiLabel}>% Spesa / Entrate</p><p style={s.kpiVal(theme.accent)}>{storPercSpesa !== null ? storPercSpesa + "%" : "---"}</p></div>
            </div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Entrate ({storEntrate.length})</div>
              {storEntrate.length === 0
                ? <div style={{ color: theme.sub, fontSize: 13, fontStyle: "italic" }}>Nessuna entrata registrata</div>
                : storEntrate.map(x => (
                  <div key={x.id} style={s.row}>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{x.desc}</div><div style={{ fontSize: 11, color: theme.sub }}>{x.data}</div></div>
                    <span style={{ color: "#fbbf24", fontWeight: 700 }}>{fmt(x.importo)} €</span>
                  </div>
                ))
              }
            </div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Spese per categoria</div>
              {storCat.length === 0
                ? <div style={{ color: theme.sub, fontSize: 13, fontStyle: "italic" }}>Nessuna spesa</div>
                : storCat.map(([cat, tot]) => (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                      <span>{getCatEmoji(cat)} {getCatLabel(cat)}</span>
                      <span style={{ color: theme.accent, fontWeight: 600 }}>{fmt(tot)} €</span>
                    </div>
                    <div style={{ background: theme.bg, borderRadius: 4, height: 6 }}>
                      <div style={{ background: getCatColor(cat), height: 6, borderRadius: 4, width: `${Math.min(100, storTotaleSpese > 0 ? tot / storTotaleSpese * 100 : 0)}%` }} />
                    </div>
                  </div>
                ))
              }
            </div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Tutte le spese ({storSpeseRaw.length})</div>
              {storSpeseRaw.length === 0
                ? <div style={{ color: theme.sub, fontSize: 13, fontStyle: "italic" }}>Nessuna spesa registrata</div>
                : storSpeseRaw.sort((a, b) => a.giorno - b.giorno).map(x => (
                  <div key={x.id} style={{ ...s.row, flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{getCatEmoji(x.cat)}</span>
                        <div>
                          <div style={{ fontSize: 13 }}>{x.desc}</div>
                          <div style={{ fontSize: 10, color: theme.sub }}>{getCatLabel(x.cat)} · giorno {x.giorno}</div>
                        </div>
                      </div>
                      <span style={{ color: theme.accent, fontWeight: 600, fontSize: 13 }}>{fmt(x.importo)} €</span>
                    </div>
                    {x.note && <div style={{ fontSize: 11, color: theme.sub, paddingLeft: 26, fontStyle: "italic" }}>"{x.note}"</div>}
                  </div>
                ))
              }
            </div>
          </>
        )}

        {tab === "impostazioni" && (
          <>
            <div style={{ fontSize: 11, color: theme.sub, marginBottom: 4 }}>IMPOSTAZIONI</div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Tema colore</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {THEMES.map(t => (
                  <div key={t.id} onClick={() => setThemeId(t.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, border: `1px solid ${themeId === t.id ? t.accent : theme.border}`, background: themeId === t.id ? t.bg : "transparent", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, border: `2px solid ${t.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: t.accent }} />
                      </div>
                      <span style={{ fontSize: 14, color: "#e2e8f0" }}>{t.label}</span>
                    </div>
                    {themeId === t.id && <span style={{ color: t.accent, fontSize: 18 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Categorie personalizzate</div>
              {extraCats.length === 0
                ? <div style={{ color: theme.sub, fontSize: 13, fontStyle: "italic", marginBottom: 12 }}>Nessuna categoria aggiunta</div>
                : extraCats.map(c => (
                  <div key={c.id} style={s.row}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{c.emoji}</span>
                      <span style={{ fontSize: 14 }}>{c.label}</span>
                    </div>
                    <button onClick={() => setExtraCats(prev => prev.filter(x => x.id !== c.id))} style={s.delBtn}>🗑</button>
                  </div>
                ))
              }
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: theme.sub, marginBottom: 6 }}>Aggiungi categoria</div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><div style={s.label}>Nome</div><input value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)} placeholder="Es. Animali" style={s.input} /></div>
                  <div><div style={s.label}>Emoji</div><input value={newCatEmoji} onChange={e => setNewCatEmoji(e.target.value)} placeholder="🐾" style={s.input} /></div>
                </div>
                <button style={s.greenBtn} onClick={addExtraCat}>+ Aggiungi categoria</button>
              </div>
            </div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Dati</div>
              <div style={{ fontSize: 13, color: theme.sub, marginBottom: 12 }}>Cancella tutti i dati: spese, entrate, preset e categorie. Operazione irreversibile.</div>
              {!showResetConfirm
                ? <button onClick={() => setShowResetConfirm(true)} style={{ width: "100%", background: "transparent", border: "1px solid #ef4444", borderRadius: 8, color: "#ef4444", padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancella tutti i dati</button>
                : <div style={{ background: theme.bg, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 14, color: "#e2e8f0", marginBottom: 12, textAlign: "center" }}>Sei sicuro? Non si puo annullare.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={() => setShowResetConfirm(false)} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, color: "#e2e8f0", padding: "10px", fontSize: 14, cursor: "pointer" }}>Annulla</button>
                    <button onClick={resetAll} style={{ background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", padding: "10px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Si, cancella</button>
                  </div>
                </div>
              }
            </div>
          </>
        )}
      </div>

      <div style={{ fontSize: 11, color: theme.sub, textAlign: "center", padding: "8px 0 12px" }}>
        Made by Sances Federico & Claude<br />
        <span style={{ fontSize: 10 }}>(tipo grazie al cazzo mica so fare tutto questo da solo)</span>
      </div>

      {showPresetModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", zIndex: 100 }} onClick={() => setShowPresetModal(false)}>
          <div style={{ background: theme.card, borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxHeight: "80vh", overflowY: "auto", boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>Preset di spesa</span>
              <button onClick={() => setShowPresetModal(false)} style={{ background: "none", border: "none", color: "#e2e8f0", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {presets.map(p => (
              <div key={p.id} style={{ background: theme.bg, borderRadius: 10, padding: "12px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>{getCatEmoji(p.categoria)}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.nome}</div>
                    <div style={{ fontSize: 12, color: "#a78bfa" }}>{fmt(p.importo)} · {getCatLabel(p.categoria)}</div>
                  </div>
                </div>
                <button onClick={() => setPresets(prev => prev.filter(x => x.id !== p.id))} style={s.delBtn}>🗑</button>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Nuovo preset</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><div style={s.label}>Nome</div><input value={newPresetNome} onChange={e => setNewPresetNome(e.target.value)} placeholder="Es. Caffe" style={s.input} /></div>
                <div><div style={s.label}>Importo €</div><input value={newPresetAmt} onChange={e => setNewPresetAmt(e.target.value)} placeholder="0,00" type="number" style={s.input} /></div>
              </div>
              <div style={{ fontSize: 12, color: theme.sub, marginBottom: 6 }}>Categoria</div>
              <div style={s.catGrid}>
                {CATEGORIES.map(c => <button key={c.id} style={s.catPill(newPresetCat === c.id)} onClick={() => setNewPresetCat(c.id)}><span style={{ fontSize: 14 }}>{c.emoji}</span>{c.label}</button>)}
              </div>
              <button style={{ ...s.greenBtn, marginTop: 12 }} onClick={addPreset}>Aggiungi preset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}