/* =========================================================
   MENTE SERENA — Videollamadas (opción A)
   · Cada profesional tiene SU sala fija de Google Meet o Zoom.
     Se guarda en una colección privada (salas/general): la web
     pública nunca la ve; solo el paciente de esa cita.
   · Toda cita online recibe sola el enlace de su profesional
     (al crearla, al asignar profesional o al abrir el panel).
   · En Mi Espacio el botón «Entrar a mi sesión» se activa 10 min antes.
   ========================================================= */
let SALAS = null;
const SALAS_DEMO = { camila: "https://meet.google.com/cam-ort-ega", andres: "https://zoom.us/j/5551234567", valeria: "https://meet.google.com/val-mon-tes" };
async function cargarSalas(forzar) {
  if (SALAS && !forzar) return SALAS;
  let s = null; try { s = await DB.getDocX("salas", "general"); } catch (e) { console.warn("salas:", e.message); }
  if (!s && String((window.FIREBASE_CONFIG || {}).apiKey || "PEGA").startsWith("PEGA")) { s = { ...SALAS_DEMO }; await DB.setDocX("salas", "general", s); }
  SALAS = s || {}; return SALAS;
}
const salaDe = id => (id && SALAS && SALAS[id]) || "";
const esSalaAuto = (u, aj) => !u || Object.values(SALAS || {}).includes(u) || (aj && u === aj.enlaceFijo);
const docPorNombre = n => { const k = String(n || "").toLowerCase().replace(/^(ps\.|dra?\.)\s*/, "").trim(); return k ? DOCS.find(d => d.n && d.n.toLowerCase().includes(k)) : null; };
const okUrl = u => /^https:\/\/[^\s]+\.[^\s]+/.test(u || "");
const puedeEditarSala = id => esAdm() || (miProf() && miProf() === id) || !esClin();

/* ---- 1) Enlace automático al guardar o crear citas ---- */
const _guardarCitaV = DB.guardarCita.bind(DB);
DB.guardarCita = async (id, data) => {
  try {
    if (data && ("vetId" in data || "modalidad" in data) && !("enlace" in data)) {
      await cargarSalas(); const c = { ...(CITAS[id] || {}), ...data };
      if (esOnline(c) && c.estado !== "atendida") { const s = salaDe(c.vetId); if (s && esSalaAuto(c.enlace, CUR.aj)) data = { ...data, enlace: s }; }
    }
  } catch (e) { console.warn(e); }
  return _guardarCitaV(id, data);
};
const _crearCitaV = DB.crearCita.bind(DB);
DB.crearCita = async (base, cap) => {
  try { await cargarSalas(); if (esOnline(base) && !base.enlace && salaDe(base.vetId)) base = { ...base, enlace: salaDe(base.vetId) }; } catch (e) {}
  return _crearCitaV(base, cap);
};

/* ---- 2) Completar enlaces pendientes (citas web) al abrir Inicio o Agenda ---- */
let _ultBarrido = 0;
async function completarEnlaces() {
  if (Date.now() - _ultBarrido < 60000) return 0; _ultBarrido = Date.now();
  await cargarSalas(); if (typeof cargarDocs === "function" && !DOCS.length) await cargarDocs();
  const hoy = todayISO(), l = await DB.rango("citas", hoy, addDays(hoy, 30)); let n = 0;
  for (const c of l) {
    if (!esOnline(c) || c.enlace || ["atendida", "no-asistio", "cancelada"].includes(c.estado)) continue;
    let patch = null;
    if (c.vetId && salaDe(c.vetId)) patch = { enlace: salaDe(c.vetId) };
    else if (!c.vetId && c.preferencia) { const d = docPorNombre(c.preferencia); if (d && salaDe(d.id)) patch = { vetId: d.id, vet: d.n, enlace: salaDe(d.id) }; }
    if (patch) { await _guardarCitaV(c.id, patch); CITAS[c.id] = { ...c, ...patch }; n++; }
  }
  if (n) toast(`${n} cita${n > 1 ? "s" : ""} online recibieron el enlace de su profesional`);
  return n;
}
["inicio", "agenda", "citas"].forEach(v => { const o = VIEWS[v]; if (!o) return;
  VIEWS[v] = async (...a) => { try { await completarEnlaces(); } catch (e) { console.warn("enlaces:", e.message); } return o(...a); }; });

/* ---- 3) Tarjeta de cita: entrar a la sala ---- */
const _citaCardV = citaCard;
citaCard = function (c, opt = {}) {   // eslint-disable-line no-global-assign
  let h = _citaCardV(c, opt);
  if (esOnline(c) && c.enlace && !["atendida", "no-asistio"].includes(c.estado) && c.fecha === todayISO())
    h = h.replace('<div class="c-acts">', `<div class="c-acts"><a class="btn btn-pri btn-sm" href="${esc(c.enlace)}" target="_blank" rel="noopener" data-sala="${esc(c.id)}">${ico("video")}<span>Abrir sala</span></a>`);
  if (esOnline(c) && !c.enlace && c.vetId && SALAS && !salaDe(c.vetId))
    h = h.replace('<span class="st bad">Falta enlace</span>', `<span class="st bad" title="Este profesional aún no tiene sala">Falta sala del profesional</span>`);
  return h;
};
document.addEventListener("click", e => {
  const a = e.target.closest("a[data-sala]"); if (!a) return;
  const c = CITAS[a.dataset.sala];
  if (c && window.RADIO && RADIO.sesion && miProf() && c.vetId === miProf()) RADIO.sesion(true, true);
});

/* ---- 4) Poner enlace: propone la sala del profesional ---- */
const _ponerEnlaceV = ponerEnlace;
ponerEnlace = async function (c) {   // eslint-disable-line no-global-assign
  await cargarSalas();
  await _ponerEnlaceV(c);
  const s = salaDe(c.vetId), inp = $("#modalForm [name=enlace]"); if (!inp) return;
  if (s && (!c.enlace || esSalaAuto(c.enlace, CUR.aj))) inp.value = s;
  const p = $("#mBody p.sub:last-of-type");
  if (p) p.innerHTML = c.vetId ? (s ? `Es la sala de <b>${esc(c.vet || "")}</b>. El paciente verá el botón «Entrar a mi sesión» en Mi Espacio 10 minutos antes.`
    : `<b>${esc(c.vet || "Este profesional")}</b> aún no tiene sala. Agrégala en <b>Profesionales → Sala</b> y las próximas citas la tendrán solas.`)
    : `Asigna un profesional y la cita tomará su sala automáticamente.`;
};

/* ---- 5) Nueva cita: al elegir profesional se pone su sala ---- */
document.addEventListener("change", async e => {
  if (!e.target.closest("#modalForm") || !["vetId", "modalidad"].includes(e.target.name)) return;
  await cargarSalas();
  const F = $("#modalForm"), v = $("[name=vetId]", F)?.value, inp = $("[name=enlace]", F); if (!inp) return;
  if (salaDe(v) && esSalaAuto(inp.value.trim(), CUR.aj)) inp.value = salaDe(v);
});

/* ---- 6) Profesionales: sala de cada uno ---- */
const _docsV = VIEWS.doctores;
VIEWS.doctores = async (...a) => {
  await cargarSalas(true); await _docsV(...a);
  $$("#view .doc-card[data-di]").forEach(card => { const d = DOCS[+card.dataset.di]; if (!d) return; const s = salaDe(d.id);
    card.querySelector(".doc-acts")?.insertAdjacentHTML("beforebegin", `<div class="sala-row ${s ? "ok" : ""}">${ico("video")}
      <span>${s ? `<b>Sala:</b> <a href="${esc(s)}" target="_blank" rel="noopener">${esc(s.replace(/^https:\/\//, "").slice(0, 34))}</a>` : "Sin sala de videollamada"}</span>
      ${puedeEditarSala(d.id) ? `<button class="btn btn-light btn-sm" data-dsala="${esc(d.id)}">${s ? "Cambiar" : "Poner sala"}</button>` : ""}</div>`); });
  const sin = docsActivos().filter(d => !salaDe(d.id));
  if (sin.length) $("#view .docs")?.insertAdjacentHTML("beforebegin", `<div class="alergia-bar warn-bar">${ico("video")} <span><b>${sin.map(d => esc(d.n)).join(", ")}</b> ${sin.length > 1 ? "no tienen" : "no tiene"} sala de videollamada. Sus citas online quedarán «sin enlace» hasta que la agregues.</span></div>`);
};
function salaForm(id) {
  const d = DOCS.find(x => x.id === id); if (!d) return;
  modal(`Sala de videollamada · ${d.n}`, `<div class="grid2">${fld("sala", "Enlace fijo de su sala (Google Meet o Zoom)", salaDe(id), { full: true, type: "url", ph: "https://meet.google.com/abc-defg-hij · https://zoom.us/j/…" })}</div>
    <div class="sala-tips"><b>Cómo obtenerla:</b>
      <p><b>Google Meet:</b> en Google Calendar crea un evento que se repita todas las semanas y pulsa «Agregar videoconferencia de Google Meet». Copia ese enlace: siempre será el mismo.</p>
      <p><b>Zoom:</b> Perfil → «ID de reunión personal» (PMI). Activa la <b>sala de espera</b> para que el siguiente paciente no entre mientras atiendes al anterior.</p>
      <p>Usa una sala distinta por profesional. Nunca compartas la misma sala entre dos personas que atienden a la misma hora.</p></div>`, async v => {
    const u = (v.sala || "").trim();
    if (u && !okUrl(u)) { toast("Pega un enlace que empiece con https://", true); return false; }
    const otro = u && DOCS.find(x => x.id !== id && salaDe(x.id) === u);
    if (otro) { toast(`Esa sala ya es de ${otro.n}. Cada profesional necesita la suya.`, true); return false; }
    const prev = salaDe(id); SALAS = { ...SALAS, [id]: u };
    await DB.setDocX("salas", "general", { [id]: u });
    // actualizar las próximas citas online de este profesional que tenían la sala anterior o ninguna
    const hoy = todayISO(), l = (await DB.rango("citas", hoy, addDays(hoy, 60))).filter(c => c.vetId === id && esOnline(c) && !["atendida", "no-asistio"].includes(c.estado) && (!c.enlace || c.enlace === prev));
    for (const c of l) await _guardarCitaV(c.id, { enlace: u });
    toast(u ? `Sala guardada${l.length ? ` · ${l.length} cita${l.length > 1 ? "s" : ""} online actualizada${l.length > 1 ? "s" : ""}` : ""}` : "Sala quitada");
    refresh();
  }, "Guardar sala");
}
document.addEventListener("click", e => { const b = e.target.closest("[data-dsala]"); if (b && $("#view").contains(b)) salaForm(b.dataset.dsala); });
