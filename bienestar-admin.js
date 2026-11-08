/* =========================================================
   MENTE SERENA — Mi día en el panel:
   el profesional asigna retos diarios, ve el gráfico de evolución
   (ánimo, retos, ejercicios, sesiones y asistencia), lee lo que el
   paciente registró y recibe alertas de ánimo bajo.
   (se carga al último)
   ========================================================= */
const EJ_LIB = { respiracion478: "Respiración 4-7-8", cuadrada: "Respiración cuadrada", anclaje: "Anclaje 5-4-3-2-1", relajacion: "Relajación muscular", gratitud: "Diario de gratitud", pensamientos: "Registro de pensamientos" };
const EMOJI = ["", "😞", "🙁", "😐", "🙂", "😄"], EMO_T = ["", "Muy mal", "Mal", "Regular", "Bien", "Muy bien"];
const actReg = r => r && (r.animo || Object.values(r.retos || {}).some(Boolean) || (r.ejercicios || []).length || (r.gratitud || []).length || (r.pensamientos || []).length);
const verClinico = () => esClin() || esAdm();

function bienStats(regs, m, citas) {
  const by = {}; regs.forEach(r => by[r.fecha] = r);
  const hoy = todayISO(), dia = n => addDays(hoy, n);
  const prom = (a, b) => { const v = []; for (let i = a; i <= b; i++) { const r = by[dia(i)]; if (r && r.animo) v.push(+r.animo); } return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null; };
  let racha = 0, i = actReg(by[hoy]) ? 0 : -1; while (actReg(by[dia(i)])) { racha++; i--; }
  let asig = 0, hech = 0;
  for (let k = -13; k <= 0; k++) { const f = dia(k), act = (m.retos || []).filter(r => r.activo !== false && (!r.desde || r.desde <= f) && (!r.hasta || r.hasta >= f)); asig += act.length; hech += act.filter(r => ((by[f] || {}).retos || {})[r.id]).length; }
  const ej30 = regs.filter(r => r.fecha >= dia(-29)).reduce((a, r) => a + (r.ejercicios || []).length, 0);
  const c60 = citas.filter(c => c.fecha >= dia(-60) && c.fecha <= hoy);
  return { by, p7: prom(-6, 0), p7a: prom(-13, -7), dias30: regs.filter(r => r.fecha >= dia(-29) && actReg(r)).length, racha, pct: asig ? Math.round(hech / asig * 100) : null, ej30,
    at: c60.filter(c => c.estado === "atendida").length, nv: c60.filter(c => c.estado === "no-asistio").length };
}
function evolucionSVG(st, m, citas) {
  const hoy = todayISO(), dias = Array.from({ length: 30 }, (_, i) => addDays(hoy, i - 29)), W = 720, H = 210, pl = 34, pr = 10, pt = 22, pb = 54;
  const X = i => pl + i * (W - pl - pr) / 29, Y = a => pt + (5 - a) * (H - pt - pb) / 4;
  const pts = dias.map((f, i) => ({ i, f, a: (st.by[f] || {}).animo })).filter(p => p.a);
  const act = f => { const r = st.by[f] || {}; return Object.values(r.retos || {}).filter(Boolean).length + (r.ejercicios || []).length; }, maxA = Math.max(1, ...dias.map(act));
  const ses = new Set((m.historial || []).filter(h => !h.compra).map(h => h.f)), nv = new Set(citas.filter(c => c.estado === "no-asistio").map(c => c.fecha));
  return `<svg class="evo" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de los últimos 30 días">
    ${[1, 2, 3, 4, 5].map(a => `<line x1="${pl}" x2="${W - pr}" y1="${Y(a)}" y2="${Y(a)}" class="gl"/><text x="4" y="${Y(a) + 5}" class="ge">${EMOJI[a]}</text>`).join("")}
    ${dias.map((f, i) => `${ses.has(f) ? `<line x1="${X(i)}" x2="${X(i)}" y1="${pt - 6}" y2="${H - pb}" class="gs"/><text x="${X(i)}" y="${pt - 9}" class="gst">S</text>` : ""}${nv.has(f) ? `<text x="${X(i)}" y="${pt - 9}" class="gnv">✕</text>` : ""}
      ${act(f) ? `<rect x="${X(i) - 6}" y="${H - 20 - act(f) / maxA * 26}" width="12" height="${act(f) / maxA * 26}" rx="3" class="gb"><title>${f}: ${act(f)} reto(s)/ejercicio(s)</title></rect>` : ""}
      ${i % 3 === 0 || i === 29 ? `<text x="${X(i)}" y="${H - 4}" class="gd">${fmtD(f).replace(/^\S+\s/, "")}</text>` : ""}`).join("")}
    ${pts.length > 1 ? `<polyline points="${pts.map(p => `${X(p.i).toFixed(1)},${Y(p.a).toFixed(1)}`).join(" ")}" class="gline"/>` : ""}
    ${pts.map(p => `<circle cx="${X(p.i).toFixed(1)}" cy="${Y(p.a).toFixed(1)}" r="4.5" class="gp ${p.a <= 2 ? "low" : ""}"><title>${fmt(p.f)}: ${EMO_T[p.a]}</title></circle>`).join("")}
  </svg>`;
}
async function bienCard() {
  const m = CUR.m, code = CUR.code; if (!m) return;
  const [regs, citas] = await Promise.all([DB.listRegistro(code, CUR.id), DB.citasDeCliente(code)]);
  const cs = citas.filter(c => c.mascotaId === CUR.id), st = bienStats(regs, m, cs), clin = verClinico();
  const tend = st.p7 != null && st.p7a != null ? st.p7 - st.p7a : null;
  const retos = m.retos || [], hoy = todayISO();
  const ult = regs.slice().reverse().filter(r => actReg(r)).slice(0, 10);
  const html = `<div class="card bien-adm" id="bienCard">
    <div class="card-h"><h2>${ico("chart")} Mi día · evolución y retos</h2>${clin ? `<button class="btn btn-pri btn-sm" data-reto-new>${ico("plus")} Asignar reto</button>` : ""}</div>
    <p class="sub" style="margin:-4px 0 12px">Lo que el paciente registra cada día en Mi Espacio: ánimo, retos y ejercicios guiados.</p>
    <div class="kpis">
      <div class="kpi"><small>Ánimo (7 días)</small><b>${st.p7 != null ? EMOJI[Math.round(st.p7)] + " " + st.p7.toFixed(1) : "—"}</b>${tend != null ? `<em class="${tend >= 0 ? "c-ok" : "c-red"}">${tend >= 0 ? "▲" : "▼"} ${Math.abs(tend).toFixed(1)} vs semana anterior</em>` : `<em>sin datos suficientes</em>`}</div>
      <div class="kpi"><small>Racha</small><b>${st.racha} día${st.racha === 1 ? "" : "s"}</b><em>${st.dias30} días activos en 30</em></div>
      <div class="kpi"><small>Retos cumplidos (14 días)</small><b>${st.pct != null ? st.pct + "%" : "—"}</b><em>${st.ej30} ejercicio${st.ej30 === 1 ? "" : "s"} en 30 días</em></div>
      <div class="kpi"><small>Asistencia (60 días)</small><b>${st.at + st.nv ? Math.round(st.at / (st.at + st.nv) * 100) + "%" : "—"}</b><em>${st.at} atendida${st.at === 1 ? "" : "s"} · ${st.nv} falta${st.nv === 1 ? "" : "s"}</em></div>
    </div>
    ${regs.length || cs.length ? evolucionSVG(st, m, cs) + `<p class="evo-ley"><span class="l1"></span>Ánimo diario <span class="l2"></span>Retos y ejercicios <b>S</b> Sesión <b class="c-red">✕</b> No asistió</p>` : `<p class="empty">Aún no hay registros. Cuando el paciente entre a Mi Espacio y marque su ánimo o sus retos, aquí verás su evolución.</p>`}
    <div class="ret-adm"><div class="seg-g">Retos asignados <span>${retos.filter(r => r.activo !== false).length} activos</span></div>
      ${retos.map(r => { const vig = r.activo !== false && (!r.hasta || r.hasta >= hoy), n14 = regs.filter(x => x.fecha >= addDays(hoy, -13) && (x.retos || {})[r.id]).length;
        return `<div class="li ${vig ? "" : "dim"}"><i class="ret-ic">${ico(r.ej ? "leaf" : "task")}</i><div><b>${esc(r.t)}</b><small>${r.ej ? esc(EJ_LIB[r.ej] || "") + " · " : ""}${r.d ? esc(r.d) + " · " : ""}desde ${fmtD(r.desde || hoy)}${r.hasta ? " hasta " + fmtD(r.hasta) : ""} · <b>${n14}/14 días</b></small></div>
          ${clin ? `<button class="btn btn-light btn-sm" data-reto-pausa="${esc(r.id)}">${r.activo === false ? "Reactivar" : "Pausar"}</button><button class="icon-btn" data-reto-del="${esc(r.id)}" aria-label="Quitar">${ico("trash")}</button>` : `<span class="st ${vig ? "ok" : ""}">${vig ? "Activo" : "Pausado"}</span>`}</div>`; }).join("") || `<p class="empty">Sin retos. ${clin ? "Asigna 1 a 3 retos sencillos: es más fácil cumplirlos." : ""}</p>`}
    </div>
    ${clin ? `<div class="seg-g" style="margin-top:14px">Lo que escribió el paciente <span>${ult.length}</span></div><div class="regs">${ult.map(r => `<details class="reg"><summary><b>${fmt(r.fecha)}</b>${r.animo ? `<span class="emo-s ${r.animo <= 2 ? "low" : ""}">${EMOJI[r.animo]} ${EMO_T[r.animo]}</span>` : ""}
        <small>${[Object.values(r.retos || {}).filter(Boolean).length ? Object.values(r.retos).filter(Boolean).length + " reto(s)" : "", (r.ejercicios || []).length ? r.ejercicios.length + " ejercicio(s)" : "", (r.pensamientos || []).length ? "registro de pensamientos" : "", (r.gratitud || []).length ? "gratitud" : ""].filter(Boolean).join(" · ")}</small>${r.nota ? `<em>“${esc(r.nota.slice(0, 70))}${r.nota.length > 70 ? "…" : ""}”</em>` : ""}</summary>
        <div class="reg-b">${r.nota ? `<p><b>Nota para su terapeuta:</b> ${esc(r.nota)}</p>` : ""}
          ${(r.ejercicios || []).length ? `<p><b>Ejercicios:</b> ${r.ejercicios.map(e => `${esc(EJ_LIB[e.k] || e.k)}${e.hora ? " (" + esc(e.hora) + ")" : ""}`).join(", ")}</p>` : ""}
          ${Object.keys(r.retos || {}).filter(k => r.retos[k]).length ? `<p><b>Retos cumplidos:</b> ${Object.keys(r.retos).filter(k => r.retos[k]).map(k => esc((retos.find(x => x.id === k) || {}).t || k)).join(", ")}</p>` : ""}
          ${(r.gratitud || []).length ? `<p><b>Gratitud:</b></p><ul>${r.gratitud.map(g => `<li>${esc(g)}</li>`).join("")}</ul>` : ""}
          ${(r.pensamientos || []).map(p => `<div class="pens"><span><b>Situación:</b> ${esc(p.s)}</span><span><b>Pensamiento:</b> ${esc(p.p)}</span><span><b>Emoción:</b> ${esc(p.e || "—")} · ${p.i}/10</span>${p.a ? `<span><b>Alternativa:</b> ${esc(p.a)}</span>` : ""}<span><b>Después:</b> ${p.i2}/10 ${+p.i2 < +p.i ? `<em class="c-ok">(bajó ${p.i - p.i2})</em>` : ""}</span></div>`).join("")}
        </div></details>`).join("") || `<p class="empty">Todavía no hay registros.</p>`}</div>` : `<p class="sub" style="margin-top:12px">${ico("lock")} Lo que escribe el paciente (notas, pensamientos) solo lo ven los profesionales.</p>`}
  </div>`;
  const cq = [...$$("#view .card")].find(c => /Cuestionarios de seguimiento/.test(c.querySelector("h2")?.textContent || ""));
  const old = $("#bienCard"); if (old) old.outerHTML = html; else if (cq) cq.insertAdjacentHTML("beforebegin", html);
}
const _mascotaB = VIEWS.mascota;
VIEWS.mascota = async p => { await _mascotaB(p); await safe(bienCard); };

function retoForm() {
  modal("Asignar reto diario", `<p class="sub" style="margin-bottom:12px">${esc(CUR.m.nombre)} lo verá cada día en <b>Mi Espacio → Mi día</b> y lo irá marcando. Si eliges un ejercicio guiado, se marca solo al terminarlo.</p><div class="grid2">
    ${fld("ej", "Tipo de reto", "", { full: true, opts: [["", "Reto libre (lo escribo yo)"], ...Object.entries(EJ_LIB).map(([k, n]) => [k, "Ejercicio guiado · " + n])] })}
    ${fld("t", "Reto", "", { req: true, full: true, list: "retosL", ph: "Ej. Caminar 20 minutos" })}
    ${fld("d", "Indicación corta (opcional)", "", { full: true, ph: "Ej. De preferencia de día" })}
    ${fld("desde", "Desde", todayISO(), { type: "date" })}${fld("hasta", "Hasta (opcional)", "", { type: "date" })}
  </div>${datalist("retosL", ["Caminar 20 minutos", "Dormir antes de las 11 pm", "Escribir cómo me sentí hoy", "Llamar o escribir a alguien querido", "Una actividad que disfrute", "Comer en un horario fijo", "Sin pantallas 1 hora antes de dormir", "Salir al sol 15 minutos"])}`, async d => {
    const r = { id: uid(), t: d.t, d: d.d, ej: d.ej, activo: true, desde: d.desde || todayISO(), hasta: d.hasta || "" };
    await petUpdate({ retos: [...(CUR.m.retos || []), r] }, "Reto asignado · el paciente ya lo ve en Mi día");
  }, "Asignar reto");
  const F = $("#modalForm"); $("[name=ej]", F).addEventListener("change", e => { const t = $("[name=t]", F); if (e.target.value && (!t.value || Object.values(EJ_LIB).some(n => t.value.startsWith(n)))) t.value = EJ_LIB[e.target.value] + " (1 vez al día)"; });
}

/* ---------- Alertas de ánimo bajo ---------- */
async function alertasAnimo() {
  if (!verClinico()) return [];
  const [regs, ms] = await Promise.all([DB.registroDesde(addDays(todayISO(), -3)), DB.allMascotas()]);
  const pac = {}; ms.forEach(m => pac[m.code + "|" + m.id] = m);
  const g = {}; regs.filter(r => r.animo).forEach(r => { const k = r.code + "|" + r.mid; (g[k] = g[k] || []).push(r); });
  const mio = esClin() && !esAdm() ? miProf() : "";
  return Object.entries(g).map(([k, l]) => { l.sort((a, b) => b.fecha.localeCompare(a.fecha)); const bajos = l.filter(r => +r.animo <= 2), m = pac[k];
    return bajos.length && m && (!mio || m.profId === mio || (m.psiquiatra && m.psiquiatra === YO().nombre)) ? { m, ult: l[0], bajos, min: Math.min(...bajos.map(r => +r.animo)) } : null; })
    .filter(Boolean).sort((a, b) => a.min - b.min || b.bajos.length - a.bajos.length);
}
const msgComoEstas = (m, c) => `Hola ${String(m.nombre || c.dueno || "").split(" ")[0]}, te saluda *${NOMBRE_V}* 🌿\n\nVimos en Mi Espacio que estos días no te has sentido bien y queríamos saber cómo estás. Si quieres, podemos adelantar tu sesión o conversar un momento.\n\nSi en algún momento sientes que no puedes más o piensas en hacerte daño, llama gratis a la *Línea 113, opción 5* (24 horas) o acude a la emergencia más cercana.`;
const alertaLi = a => `<div class="li alerta-li" data-pet="${esc(a.m.id)}" data-code="${esc(a.m.code)}" style="cursor:pointer">${avatarP(a.m)}<div><b>${esc(a.m.nombre)} <span class="emo-s low">${EMOJI[a.min]} ${EMO_T[a.min]}</span></b><small>${a.bajos.length} día(s) con ánimo bajo · último registro ${fmtD(a.ult.fecha)}${a.ult.nota ? ` · “${esc(a.ult.nota.slice(0, 50))}${a.ult.nota.length > 50 ? "…" : ""}”` : ""}</small></div>${avisadoR(a.m.avisoAnimo) ? `<span class="st ok">Contactado ✓ ${fmtD(a.m.avisoAnimo)}</span>` : ""}<button class="btn btn-wa btn-sm" data-bwa>${ico("wa")}<span class="hide-m">¿Cómo estás?</span></button></div>`;
const _inicioB = VIEWS.inicio;
VIEWS.inicio = async () => {
  await _inicioB(); if (!verClinico()) return;
  const al = await safe(alertasAnimo) || []; if (!al.length) return;
  $("#view .two-col > div:last-child")?.insertAdjacentHTML("afterbegin", `<div class="card alerta-card"><div class="card-h"><h2>${ico("alert")} Ánimo bajo (últimos 3 días)</h2></div><p class="sub" style="margin:-4px 0 10px">Pacientes que marcaron «Mal» o «Muy mal» en Mi día.</p><div class="list">${al.slice(0, 5).map(alertaLi).join("")}</div></div>`);
};
const _segB = VIEWS.vacunas;
VIEWS.vacunas = async () => {
  await _segB(); if (!verClinico()) return;
  const al = await safe(alertasAnimo) || [];
  const F = CUR.segF || "todo";
  $(".seg-bar")?.insertAdjacentHTML("afterend", `<div class="card seg-sec alerta-card" data-seg="animo" ${F !== "todo" ? "hidden" : ""}><div class="card-h"><h2>${ico("alert")} Ánimo bajo <span class="seg-n">${al.length}</span></h2><small class="sub">Registrado por el paciente en Mi día (últimos 3 días). Solo lo ven los profesionales.</small></div><div class="list">${al.map(alertaLi).join("") || `<p class="empty">Ningún paciente marcó ánimo bajo estos días.</p>`}</div></div>`);
};

/* ---------- Clics ---------- */
document.addEventListener("click", async e => {
  const t = e.target.closest("button"); if (!t || !$("#view").contains(t)) return;
  if (t.matches("[data-bwa]")) {
    e.stopPropagation();
    const row = t.closest("[data-pet]"), code = row.dataset.code, id = row.dataset.pet, [c, m] = await Promise.all([DB.getCliente(code), DB.getMascota(code, id)]);
    openWA(c.celular, msgComoEstas(m, c)); await DB.saveMascota(code, id, { avisoAnimo: todayISO() }); toast("Mensaje preparado · marcado como contactado"); return refresh();
  }
  if (CUR.v !== "mascota") return;
  if (t.matches("[data-reto-new]")) return retoForm();
  if (t.dataset.retoDel) return confirmDel("Se quitará este reto (el paciente ya no lo verá).", () => petUpdate({ retos: (CUR.m.retos || []).filter(r => r.id !== t.dataset.retoDel) }, "Reto quitado"));
  if (t.dataset.retoPausa) { const l = (CUR.m.retos || []).map(r => r.id === t.dataset.retoPausa ? { ...r, activo: r.activo === false } : r); return petUpdate({ retos: l }, "Reto actualizado"); }
});

/* ---------- Todos los módulos cargados: recién ahora se abre la sesión ---------- */
window.__panelListo = true;
window.dispatchEvent(new Event("panel-listo"));
