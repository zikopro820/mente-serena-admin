/* =========================================================
   MENTE SERENA — ajustes finales (se carga al último):
   inicio, citas presenciales/online con enlace, citas que se
   repiten, inasistencias, ficha de sesión con nota privada y
   paquetes, permisos por rol, reportes y modo sesión de la radio.
   ========================================================= */
const MODS = ["Presencial", "Online"];
const esOnline = c => /online/i.test((c && c.modalidad) || "");
const docDe = id => (typeof DOCS !== "undefined" ? DOCS : []).find(d => d.id === id);
const areaDoc = id => (docDe(id) || {}).area || "psicologia";

/* ---------- Permisos por rol ---------- */
const VISTAS_ADMIN = ["reportes", "editor", "servicios", "categorias", "ajustes", "tienda", "paginas", "personalizar"];
function aplicarRol() {
  const r = YO().rol || "Administración", adm = esAdm(), clin = esClin();
  $$("#nav [data-rol]").forEach(b => b.style.display = b.dataset.rol === "admin" ? (adm ? "" : "none") : b.dataset.rol === "caja" ? (clin && !adm ? "none" : "") : "");
  const tg = $("#rolTag"); if (tg) tg.textContent = r;
  const w = $("#who"); if (w && YO().nombre) w.textContent = YO().nombre;
}
const _goSer = go;
go = async function (v, p = {}) {   // eslint-disable-line no-global-assign
  aplicarRol();
  if (VISTAS_ADMIN.includes(v) && !esAdm()) { toast("Tu rol no tiene acceso a esta sección", true); v = "inicio"; p = {}; }
  if (v === "caja" && esClin() && !esAdm()) { toast("La caja la maneja recepción", true); v = "inicio"; }
  return _goSer(v, p);
};

/* =========================================================
   INICIO
   ========================================================= */
VIEWS.inicio = async () => {
  await cargarMarca(); await cargarDocs(); aplicarRol();
  const hoy = todayISO(), mio = miProf(), clin = esClin() && mio;
  const [aj, citasHoy0, movs, prox] = await Promise.all([cargarAjustes(), DB.rango("citas", hoy, hoy), DB.rango("movimientos", hoy, hoy), DB.rango("citas", addDays(hoy, -60), addDays(hoy, 60))]);
  const citasHoy = citasHoy0.filter(c => !clin || c.vetId === mio).sort((a, b) => a.hora.localeCompare(b.hora));
  const ingreso = movs.filter(m => !m.anulado).reduce((a, m) => a + (+m.total || 0), 0);
  const porCobrar = prox.filter(c => pagoInfo(c).saldo > 0 && c.estado === "atendida");
  const R = await recordatoriosData();
  const enSesion = TIEMPO_REAL ? citasHoy0.filter(c => c.inicio && !c.fin && c.estado !== "atendida") : [];
  const online = citasHoy.filter(c => esOnline(c) && c.estado === "confirmada");
  const h = new Date().getHours();
  $("#view").innerHTML = topBar(`${h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"}${YO().nombre && YO().rol !== "Administración" ? ", " + esc(String(YO().nombre).replace(/^(Dra?\.|Ps\.)\s*/, "").split(" ")[0]) : ""}`, `${esc(NOMBRE_V)} · ${largo(hoy)} · ${esc(YO().rol || "")}`,
    `<button class="btn btn-pri" data-act="nueva">${ico("plus")} Nueva cita</button>`) + `
    <div class="stats">
      ${clin ? `<div class="stat"><i>${ico("cal")}</i><div><b>${citasHoy.length}</b><span>Mis sesiones hoy</span></div></div>
        <div class="stat"><i>${ico("check")}</i><div><b>${citasHoy.filter(c => c.estado === "atendida").length}</b><span>Atendidas</span></div></div>`
      : `<div class="stat"><i>${ic2("cash")}</i><div><b>${S(ingreso)}</b><span>Ingresos de hoy</span></div></div>
        <div class="stat"><i>${ico("cal")}</i><div><b>${citasHoy.length}</b><span>Sesiones hoy</span></div></div>`}
      <div class="stat"><i>${ico("video")}</i><div><b>${online.length}</b><span>Online hoy${online.some(c => !c.enlace) ? ` · <b class="c-red">${online.filter(c => !c.enlace).length} sin enlace</b>` : ""}</span></div></div>
      <div class="stat"><i>${ico("box")}</i><div><b>${R.paquetes.length}</b><span>Paquetes por terminar</span></div></div>
    </div>
    <div class="two-col">
      <div class="card"><div class="card-h"><h2>${ico("cal")} ${clin ? "Mis sesiones de hoy" : "Sesiones de hoy"}</h2><button class="btn btn-light btn-sm" data-goto="agenda">Ver agenda</button></div>
        <div class="citas">${citasHoy.map(c => citaCard(c)).join("") || `<p class="empty">No hay sesiones hoy.</p>`}</div></div>
      <div>
        ${DOCS.length ? `<div class="card"><div class="card-h"><h2>${ico("users")} Profesionales ahora</h2><button class="btn btn-light btn-sm" data-goto="doctores">Ver</button></div><div class="list">${docsActivos().map(d => {
          const aus = ausente(d, hoy), tr = (d.dias || []).includes(toD(hoy).getDay()), n = citasHoy0.filter(c => c.vetId === d.id).length, ses = enSesion.find(c => c.vetId === d.id);
          return `<div class="li">${avatarDoc(d)}<div><b>${esc(d.n)}</b><small>${esc(d.esp || "")}${tr && !aus ? ` · ${n} sesión${n === 1 ? "" : "es"} hoy` : ""}</small></div><span class="st ${aus ? "dark" : ses ? "bad" : tr ? "ok" : ""}">${aus ? "No vino" : ses ? "🔕 En sesión" : tr ? "Libre" : "Descanso"}</span></div>`; }).join("")}</div>
          ${!TIEMPO_REAL ? `<p class="sub" style="margin-top:8px">Activa «Iniciar / Terminar sesión» en <b>Ajustes</b> para ver quién está en sesión.</p>` : ""}</div>` : ""}
        ${!clin && porCobrar.length ? `<div class="card"><div class="card-h"><h2>${ic2("cash")} Saldos por cobrar</h2></div><div class="list">${porCobrar.slice(0, 5).map(c => `<div class="li"><div><b>${esc(c.mascota)}</b><small>${esc(c.servicio)} · ${fmtD(c.fecha)}</small></div><span class="st warn">${S(pagoInfo(c).saldo)}</span></div>`).join("")}</div></div>` : ""}
        <div class="card"><div class="card-h"><h2>${ico("bell")} Seguimiento</h2><button class="btn btn-light btn-sm" data-goto="vacunas">${R.porAvisar ? `<b class="pill-n">${R.porAvisar}</b> por avisar` : "Ver todo"}</button></div>
          <div class="list">${[...R.manana.slice(0, 3).map(x => `<div class="li">${avatarP({ nombre: x.c.mascota })}<div><b>${esc(x.c.mascota)} · mañana ${esc(x.c.hora)} h</b><small>${esc(x.c.servicio)} · ${esc(x.c.modalidad || "Presencial")}</small></div><span class="st ${x.c.recordado ? "ok" : "info"}">${x.c.recordado ? "Avisado" : "Recordar"}</span></div>`),
            ...R.paquetes.slice(0, 3).map(x => `<div class="li" data-pet="${esc(x.m.id)}" data-code="${esc(x.m.code)}" style="cursor:pointer">${avatarP(x.m)}<div><b>${esc(x.m.nombre)} · paquete</b><small>${x.e.quedan ? `Quedan ${x.e.quedan} sesión(es)` : "Sin sesiones"}</small></div><span class="st warn">Renovar</span></div>`),
            ...R.inactivos.slice(0, 2).map(x => `<div class="li" data-pet="${esc(x.m.id)}" data-code="${esc(x.m.code)}" style="cursor:pointer">${avatarP(x.m)}<div><b>${esc(x.m.nombre)}</b><small>Sin sesiones desde ${fmt(x.ult.f)}</small></div><span class="st">Retomar</span></div>`)].join("") || `<p class="empty">Nada pendiente por avisar.</p>`}</div></div>
      </div>
    </div>`;
};

/* =========================================================
   TARJETA DE CITA: modalidad, enlace online, paquete, inasistencia
   ========================================================= */
const _pagoInfoS = pagoInfo;
pagoInfo = function (c) {   // eslint-disable-line no-global-assign
  if (c && c.paqueteId && !totalDe(c) && !(+c.pagado)) return { cls: "ok", txt: "Incluida en paquete", wa: "Incluida en tu paquete", saldo: 0 };
  return _pagoInfoS(c);
};
const _citaCardS = citaCard;
citaCard = function (c, opt = {}) {   // eslint-disable-line no-global-assign
  let h = _citaCardS(c, opt);
  const at = c.estado === "atendida", nv = c.estado === "no-asistio";
  const b = [`<span class="st ${esOnline(c) ? "online" : ""}">${esOnline(c) ? ico("video") + " Online" : "Presencial"}</span>`];
  if (esOnline(c) && !at && !nv) b.push(c.enlace ? `<a class="st ok" href="${esc(c.enlace)}" target="_blank" rel="noopener">Enlace listo ↗</a>` : `<span class="st bad">Falta enlace</span>`);
  if (c.paqueteId) b.push(`<span class="st info">${ico("box")} Paquete</span>`);
  if (nv) b.push(`<span class="st dark">No asistió</span>`);
  h = h.replace('<div class="badges">', `<div class="badges">${b.join("")}`);
  if (c.paqueteId && !totalDe(c)) h = h.replace(/<button class="btn btn-light btn-sm" data-act="cobrar">[\s\S]*?<\/button>/, "");
  if (nv) h = h.replace('<span class="st warn">Por cerrar</span>', "").replace('class="cita ', 'class="cita nv ');
  const extra = [];
  if (esOnline(c) && !at && !nv) extra.push(`<button class="btn btn-light btn-sm" data-act="enlace">${ico("video")}<span>${c.enlace ? "Enlace" : "Poner enlace"}</span></button>`);
  if (!at && !nv && c.fecha <= todayISO()) extra.push(`<button class="btn btn-light btn-sm" data-act="noasistio" title="Marcar inasistencia">${ico("x2")}<span>No asistió</span></button>`);
  if (nv) extra.push(`<button class="btn btn-wa btn-sm" data-act="reprog">${ico("wa")}<span>Reprogramar</span></button>`);
  if (extra.length) h = h.replace('<div class="c-acts">', `<div class="c-acts">${extra.join("")}`);
  return h;
};
const _msgCitaS = msgCitaWA;
msgCitaWA = function (c, aj) {   // eslint-disable-line no-global-assign
  let t = _msgCitaS(c, aj);
  t = t.replace(/• Servicio: (.*)\n/, `• Servicio: $1\n• Modalidad: ${esOnline(c) ? "Online (videollamada)" : "Presencial"}\n`);
  if (esOnline(c) && c.estado !== "atendida") {
    t = t.replace(/• Dirección: .*\n?/, "");
    t = t.replace("Te esperamos 10 minutos antes.", c.enlace ? `🎥 Enlace de la videollamada:\n${c.enlace}\nConéctate 5 minutos antes desde un lugar privado.` : "Te enviaremos el enlace de la videollamada antes de la sesión.");
  }
  return t.replace("Tus citas y pagos con tu código", "Tus sesiones, tareas y pagos en Mi Espacio con tu código");
};
async function ponerEnlace(c) {
  const aj = await cargarAjustes();
  modal("Enlace de la videollamada", `<p class="sub" style="margin-bottom:12px">${esc(c.mascota)} · ${esc(c.servicio)} · ${fmtD(c.fecha)} ${esc(c.hora)} h</p><div class="grid2">
    ${fld("enlace", "Enlace de Google Meet, Zoom o WhatsApp", c.enlace || aj.enlaceFijo || "", { req: true, full: true, type: "url", ph: "https://meet.google.com/…" })}
    ${fld("enviar", "Enviar el enlace al paciente por WhatsApp", true, { type: "checkbox", full: true })}</div>
    <p class="sub">Aparece también en <b>Mi Espacio</b> con el botón «Entrar a la videollamada».${aj.enlaceFijo ? "" : " Puedes guardar un enlace fijo en Ajustes."}</p>`, async d => {
    if (!/^https?:\/\//.test(d.enlace)) { toast("Pega un enlace que empiece con https://", true); return false; }
    await DB.guardarCita(c.id, { enlace: d.enlace, modalidad: "Online" });
    toast("Enlace guardado"); if (d.enviar && c.celular) openWA(c.celular, msgCitaWA({ ...c, enlace: d.enlace, modalidad: "Online" }, aj)); refresh();
  }, "Guardar enlace");
}
async function noAsistio(c) {
  const faltas = c.code ? (await DB.citasDeCliente(c.code)).filter(x => x.mascotaId === c.mascotaId && x.estado === "no-asistio").length : 0;
  modal("Marcar inasistencia", `<p>${esc(c.mascota)} no asistió a <b>${esc(c.servicio)}</b> (${fmtD(c.fecha)} · ${esc(c.hora)} h).</p>
    ${faltas ? `<p class="sub" style="margin-top:6px">Ya tiene <b>${faltas}</b> inasistencia(s) anteriores.</p>` : ""}
    ${c.paqueteId ? fld("descontar", "Descontar la sesión del paquete (según la política del centro)", false, { type: "checkbox", full: true }) : ""}
    ${fld("enviar", "Escribirle por WhatsApp para reprogramar", true, { type: "checkbox", full: true })}`, async d => {
    await DB.guardarCita(c.id, { estado: "no-asistio", noAsistio: new Date().toISOString() });
    if (d.descontar && c.code && c.mascotaId) { const m = await DB.getMascota(c.code, c.mascotaId), l = (m.paquetes || []).map(p => p.id === c.paqueteId ? { ...p, usadas: Math.min((+p.usadas || 0) + 1, +p.ses) } : p); await DB.saveMascota(c.code, c.mascotaId, { paquetes: l }); }
    toast("Inasistencia registrada"); if (d.enviar && c.celular) openWA(c.celular, msgReprog(c)); refresh();
  }, "Marcar inasistencia");
}
const msgReprog = c => `Hola ${String(c.dueno || "").split(" ")[0]}, te saluda *${NOMBRE_V}* 🌿\n\nHoy te esperábamos para tu sesión de ${c.servicio} a las ${c.hora} h y no pudimos vernos. ¿Todo bien?\n\nSi quieres, la reprogramamos. Puedes elegir otro horario aquí:\n${webBase()}citas${c.code ? "?codigo=" + encodeURIComponent(c.code) : ""}\n\nO respóndenos este mensaje y te ayudamos.`;
document.addEventListener("click", async e => {
  const t = e.target.closest("button"); if (!t || !$("#view").contains(t)) return;
  const box = t.closest("[data-cid]"); if (!box || !t.dataset.act) return;
  const c = CITAS[box.dataset.cid]; if (!c) return;
  if (t.dataset.act === "enlace") return ponerEnlace(c);
  if (t.dataset.act === "noasistio") return noAsistio(c);
  if (t.dataset.act === "reprog") return openWA(c.celular, msgReprog(c));
});

/* =========================================================
   NUEVA CITA: modalidad, enlace, paquete y citas que se repiten
   ========================================================= */
const _nuevaCitaS = nuevaCita;
nuevaCita = async function (pre = {}) {   // eslint-disable-line no-global-assign
  await _nuevaCitaS(pre);
  const F = $("#modalForm"), g = $(".grid2", F); if (!g) return;
  const aj = await cargarAjustes();
  $("[name=vetId]", F)?.closest(".field")?.insertAdjacentHTML("beforebegin", `${fld("modalidad", "Modalidad", "Presencial", { opts: MODS })}
    <div class="field" id="ncEnl" style="display:none"><label>Enlace de la videollamada</label><input name="enlace" type="url" value="${esc(aj.enlaceFijo || "")}" placeholder="https://meet.google.com/… (puedes ponerlo después)"></div>`);
  $("[name=enviar]", F)?.closest(".chk")?.insertAdjacentHTML("beforebegin", `<div class="field full ficha-sec"><label>${ico("cal")} Repetir esta cita</label><div class="grid2">
      ${fld("repetir", "Frecuencia", "no", { opts: [["no", "Solo esta vez"], ["7", "Cada semana"], ["14", "Cada 2 semanas"]] })}${fld("veces", "¿Cuántas citas en total?", 8, { type: "number", extra: 'min="2" max="24" step="1"' })}</div>
      <small class="sec-hint">Se crean todas a la misma hora con el mismo profesional. Si algún día está lleno, te avisamos cuál.</small></div>
    <div id="ncPaq"></div>`);
  const mod = $("[name=modalidad]", F), enl = $("#ncEnl"), veces = $("[name=veces]", F).closest(".field");
  const onMod = () => enl.style.display = mod.value === "Online" ? "" : "none";
  const onRep = () => veces.style.display = $("[name=repetir]", F).value === "no" ? "none" : "";
  mod.addEventListener("change", onMod); $("[name=repetir]", F).addEventListener("change", onRep); onRep();
  let paq = null;
  const onPac = async () => {
    const code = $("[name=cli]", F).value, mid = $("[name=mid]", F)?.value; paq = null; $("#ncPaq").innerHTML = "";
    if (!code || !mid || mid === "__nueva") return;
    const m = await DB.getMascota(code, mid); if (!m) return;
    if (m.modalidad && MODS.includes(m.modalidad)) { mod.value = m.modalidad; onMod(); }
    if (m.profId && $("[name=vetId]", F).querySelector(`option[value="${m.profId}"]:not([disabled])`)) $("[name=vetId]", F).value = m.profId;
    paq = paqActivo(m);
    if (paq) $("#ncPaq").innerHTML = fld("usarPaq", `Usar su paquete · quedan ${paqEstado(paq).quedan} sesión(es) (precio S/ 0)`, true, { type: "checkbox", full: true, ph: paq.t });
  };
  $("[name=cli]", F).addEventListener("change", () => setTimeout(onPac, 300)); F.addEventListener("change", e => { if (e.target.name === "mid") onPac(); });
  setTimeout(onPac, 350);
  const base = mSubmit;
  mSubmit = async d => {
    const usar = paq && d.usarPaq; if (usar) d.precio = 0;
    // la cita base se crea con modalidad y enlace (se guardan justo después de crearla)
    const _crear = DB.crearCita; let creada = null;
    DB.crearCita = async (b, cap) => { const id = await _crear.call(DB, { ...b, modalidad: d.modalidad || "Presencial", enlace: d.modalidad === "Online" ? d.enlace || "" : "", paqueteId: usar ? paq.id : "" }, cap); creada = id ? { ...b, id } : null; return id; };
    let r; try { r = await base(d); } finally { DB.crearCita = _crear; }
    if (r === false || !creada) return r;
    if (d.repetir !== "no") {
      const paso = +d.repetir, n = Math.min(24, Math.max(2, Math.round(+d.veces || 2))), ok = [], mal = [];
      for (let k = 1; k < n; k++) {
        const f = addDays(creada.fecha, paso * k), libre = DOCS.length && creada.vetId ? (docDe(creada.vetId) && trabaja(docDe(creada.vetId), f, creada.hora, aj)) : true;
        const ocup = (await DB.rango("citas", f, f)).some(x => x.hora === creada.hora && x.vetId && x.vetId === creada.vetId && x.estado !== "no-asistio");
        if (!libre || ocup) { mal.push(f); continue; }
        const { id: _id0, ...cb } = creada; void _id0;
        const id = await DB.crearCita({ ...cb, fecha: f, pagado: 0, pagos: [], estadoPago: "pendiente", modalidad: d.modalidad || "Presencial", enlace: d.modalidad === "Online" ? d.enlace || "" : "", paqueteId: usar ? paq.id : "", serie: creada.id }, Math.max(1, capSlot(f, creada.hora, aj)));
        id ? ok.push(f) : mal.push(f);
      }
      setTimeout(() => toast(`Se crearon ${ok.length + 1} citas${mal.length ? ` · ${mal.length} día(s) sin espacio: ${mal.map(fmtD).join(", ")}` : ""}`, !!mal.length), 600);
    }
    return r;
  };
};

/* =========================================================
   FICHA DE LA SESIÓN: nota privada, paquete y recomendaciones
   ========================================================= */
const _fichaS = fichaAtencion;
fichaAtencion = async function (c, modo = "atender") {   // eslint-disable-line no-global-assign
  await _fichaS(c, modo);
  const F = $("#modalForm"), g = $(".grid2", F); if (!g || !$("#medList")) return;
  $("#mTitle").textContent = modo === "editar" ? "Ficha de la sesión" : "Cerrar sesión";
  // 1) El diagnóstico NO va al historial que ve el paciente: se reemplaza por la nota privada
  const dF = $("[name=d]", F)?.closest(".field");
  if (dF) dF.outerHTML = `<input type="hidden" name="d" value="">` + (esClin() ? `<div class="field full ficha-sec nota-sec"><label>${ico("lock")} Nota de sesión privada <span class="tag-sec gris">solo tú la verás</span></label>
      <small class="sec-hint">Se guarda aparte. No la ve recepción, ni otros profesionales, ni el paciente.</small>
      <textarea name="npMotivo" rows="2" placeholder="Lo que trae / motivo de la sesión"></textarea><textarea name="npTrabajo" rows="2" placeholder="Lo trabajado (técnicas, observaciones)"></textarea><textarea name="npPlan" rows="2" placeholder="Plan y acuerdos para la próxima sesión"></textarea>
      <label class="chk"><input type="checkbox" name="npRiesgo"><span><b>Indicadores de riesgo</b><small>Marca para seguimiento (solo tú lo ves)</small></span></label></div>`
    : `<div class="field full"><div class="lock-box">${ico("lock")}<div><b>Notas clínicas</b><small>Las escribe el profesional desde su usuario. Aquí registras la asistencia y el pago.</small></div></div></div>`);
  // 2) Textos y campos para salud mental
  $$("[name=piezas], [name=temp]", F).forEach(x => x.closest(".field")?.remove());
  const cob = $(".ficha-sec.cobra", F); if (cob) { cob.querySelector("label").innerHTML = `${ic2("cash")} Cargos adicionales <span class="tag-sec">se cobra</span>`; cob.querySelector(".sec-hint").textContent = "Informe psicológico, pruebas, certificado… Se suman al precio de la sesión y salen en el recibo."; $$("[data-c=n]", cob).forEach(i => i.placeholder = "Ej. Informe psicológico"); }
  const rx = $(".ficha-sec.receta", F); if (rx) { rx.querySelector("label").innerHTML = `${ico("pill")} Receta (psiquiatría) <span class="tag-sec gris">no se cobra</span>`; rx.querySelector(".sec-hint").textContent = "Solo si atendió un psiquiatra. El paciente la descarga en PDF en Mi Espacio. Los controlados requieren la receta especial oficial."; }
  const ind = $("[name=ind]", F); if (ind) { ind.closest(".field").querySelector("label").textContent = "Recomendaciones para el paciente (las verá en Mi Espacio)"; ind.placeholder = "Ej. Practicar la respiración 2 veces al día. Evitar cafeína en la noche."; }
  const ctl = $("[name=control]", F); if (ctl) ctl.closest(".field").querySelector("label").textContent = "Próximo control (opcional)";
  const cm = $("[name=controlMotivo]", F); if (cm) cm.placeholder = "Ej. Control psiquiátrico";
  $("#hfUp")?.closest(".field")?.remove(); $$(".field", F).filter(x => /Vincula la cita a un cliente para poder guardar fotos/.test(x.textContent)).forEach(x => x.remove());
  const env = $("[name=enviar]", F)?.closest(".chk"); if (env) env.querySelector("b").textContent = modo === "editar" ? "Enviar recomendaciones al paciente por WhatsApp" : "Enviar resumen, recomendaciones y estado de pago por WhatsApp";
  const sel = $("[name=vetId]", F), lbl = sel?.closest(".field")?.querySelector("label"); if (lbl) lbl.textContent = "Profesional que atendió *";
  if (sel && esClin() && miProf() && !sel.value) sel.value = miProf();
  const toggleRx = () => { if (rx) rx.style.display = areaDoc(sel.value) === "psiquiatria" ? "" : "none"; };
  sel?.addEventListener("change", toggleRx); toggleRx();
  // 3) Paquete de sesiones
  let paq = null, m = null;
  if (c.code && c.mascotaId) { m = await DB.getMascota(c.code, c.mascotaId); paq = m && ((c.paqueteId && (m.paquetes || []).find(p => p.id === c.paqueteId)) || paqActivo(m)); }
  const yaUsado = modo === "editar" && c.paqueteId && m && (m.historial || []).some(h => h.citaId === c.id && h.paquete);
  if (paq && !yaUsado && modo !== "editar") {
    $("[name=base]", F)?.closest(".field")?.insertAdjacentHTML("beforebegin", `<div class="field full">${fld("usarPaq", `Descontar del paquete · sesión ${(+paq.usadas || 0) + 1} de ${paq.ses} (no se cobra)`, !!c.paqueteId || !totalDe(c), { type: "checkbox", ph: paq.t })}</div>`);
    const chk = $("[name=usarPaq]", F), b0 = $("[name=base]", F), v0 = b0.value;
    const onP = () => { b0.value = chk.checked ? 0 : (v0 && +v0 ? v0 : ""); b0.dispatchEvent(new Event("input", { bubbles: true })); };
    chk.addEventListener("change", onP); if (chk.checked) onP();
  }
  const base = mSubmit;
  mSubmit = async d => {
    const r = await base(d); if (r === false) return false;
    const np = { motivo: (d.npMotivo || "").trim(), trabajo: (d.npTrabajo || "").trim(), plan: (d.npPlan || "").trim(), riesgo: !!d.npRiesgo };
    if (esClin() && (np.motivo || np.trabajo || np.plan) && c.code && c.mascotaId) await safe(() => DB.saveNota(null, { code: c.code, mid: c.mascotaId, paciente: c.mascota, autorNombre: YO().nombre || YO().email || "", f: c.fecha, hora: c.hora, citaId: c.id, ...np }));
    if (paq && d.usarPaq && c.code && c.mascotaId) {
      const m2 = await DB.getMascota(c.code, c.mascotaId), l = (m2.paquetes || []).map(p => p.id === paq.id ? { ...p, usadas: Math.min((+p.usadas || 0) + 1, +p.ses) } : p), n = (+paq.usadas || 0) + 1;
      const his = (m2.historial || []).map(h => h.citaId === c.id ? { ...h, paquete: true, t: /sesión \d/.test(h.t) ? h.t : `${h.t} · sesión ${n}`, modalidad: c.modalidad || h.modalidad || "" } : h);
      await DB.saveMascota(c.code, c.mascotaId, { paquetes: l, historial: his });
      await DB.guardarCita(c.id, { paqueteId: paq.id });
      const q = paqEstado(l.find(p => p.id === paq.id)).quedan;
      setTimeout(() => toast(q <= 1 ? `Paquete: ${q ? "queda 1 sesión" : "se usaron todas las sesiones"} · ofrece renovar` : `Paquete: quedan ${q} sesiones`), 900);
    } else if (c.code && c.mascotaId) {
      const m2 = await DB.getMascota(c.code, c.mascotaId), his = (m2.historial || []).map(h => h.citaId === c.id ? { ...h, modalidad: c.modalidad || h.modalidad || "" } : h);
      await DB.saveMascota(c.code, c.mascotaId, { historial: his });
    }
  };
};
msgAtencionWA = function (c, x) {   // eslint-disable-line no-global-assign
  const n = String(c.dueno || "").split(" ")[0], p = pagoInfo(c);
  const L = [`Hola ${n}, te saluda *${NOMBRE_V}* 🌿`, "", `Gracias por tu sesión de hoy${c.mascota && c.mascota !== c.dueno ? " (" + c.mascota + ")" : ""}.`, `• ${c.servicio}${c.vet ? " con " + c.vet : ""}`];
  if (totalDe(c)) L.push(`• Total: ${S(totalDe(c))} · ${p.wa}`); else if (c.paqueteId) L.push("• Sesión incluida en tu paquete");
  if ((x.meds || []).length) { L.push("", "*Indicaciones de tu psiquiatra:*"); x.meds.forEach(m => L.push(`• ${m.n}${m.dosis ? " – " + m.dosis : ""}${m.cada ? ", cada " + m.cada : ""}${m.dias ? ", " + m.dias + (/^\d+$/.test(m.dias) ? " días" : "") : ""}`)); }
  if (x.ind) L.push("", `*Recomendaciones:* ${x.ind}`);
  if (x.control) L.push("", `*Próximo control:* ${largo(x.control)}${x.controlMotivo ? " – " + x.controlMotivo : ""}`);
  if (c.code) L.push("", `En Mi Espacio tienes tus tareas, tu avance y tus documentos en PDF (código *${c.code}*):`, portalLink(c.code));
  return L.join("\n");
};
recetaDe = function (h, m, cl) {   // eslint-disable-line no-global-assign
  const code = cl ? cl.codigo : "";
  return { fecha: h.f, mascota: { nombre: m.nombre, edad: edadTxt(m.nac), dni: m.dni, alergias: m.alergias }, paciente: m.nombre, dueno: cl ? cl.dueno : "", cel: cl ? cl.celular : "", code,
    firma: /^Dr/.test(h.vet || "") ? "Médico psiquiatra" : "Psicólogo(a)", aviso: "Medicamentos controlados: requieren la receta especial entregada en consulta. No suspendas ni cambies la dosis sin consultar.",
    campos: [["Paciente", m.nombre], ["Edad", edadTxt(m.nac)], ["DNI", m.dni], ["Alergias", m.alergias || "Ninguna"], ["Código", code], ["Atención", h.t], ["Profesional", h.vet]],
    vet: h.vet, servicio: h.t, diagnostico: "", meds: (h.meds || []).filter(x => x.n), ind: h.ind, control: h.control, controlMotivo: h.controlMotivo, rpTitulo: (h.meds || []).some(x => x.n) ? "Tratamiento indicado" : "Indicaciones" };
};

/* ---------- Agenda: "solo mis citas" para cada profesional ---------- */
const _agendaS = VIEWS.agenda;
VIEWS.agenda = async p => {
  await _agendaS(p);
  const mio = miProf(); if (!mio || !esClin()) return;
  const on = CUR.soloMiAgenda !== false;
  $(".ag-bar")?.insertAdjacentHTML("beforeend", `<label class="chk mini"><input type="checkbox" id="agMio" ${on ? "checked" : ""}><span><b>Solo mis citas</b></span></label>`);
  const apl = v => { $$("#view .cita[data-cid]").forEach(el => { const c = CITAS[el.dataset.cid]; el.style.display = !v || !c || c.vetId === mio ? "" : "none"; }); $$("#view .wc").forEach(() => {}); };
  $("#agMio").addEventListener("change", e => { CUR.soloMiAgenda = e.target.checked; apl(e.target.checked); }); apl(on);
};

/* ---------- Profesionales: área (psicología o psiquiatría) ---------- */
const _docFormS = docForm;
docForm = function (i) {   // eslint-disable-line no-global-assign
  _docFormS(i);
  const d = i == null ? {} : DOCS[i], g = $("#modalForm .grid2");
  g.insertAdjacentHTML("afterbegin", fld("area", "Área", d.area || "psicologia", { opts: [["psicologia", "Psicología"], ["psiquiatria", "Psiquiatría"]] }));
  $("#mTitle").textContent = i == null ? "Nuevo profesional" : "Editar profesional";
  const nm = $("#modalForm [name=n]"); if (nm) nm.placeholder = "Ej. Ps. Camila Ortega · Dra. Valeria Montes";
  const base = mSubmit;
  mSubmit = async v => { const nombre = v.n, area = v.area; const r = await base(v); if (r === false) return false;
    const x = DOCS.find(z => z.n === nombre); if (x && x.area !== area) { x.area = area; await guardarDocs(); } };
};
/* ---------- Servicios: área y si se ofrece online ---------- */
const _servFormS = servForm;
servForm = async function (x = {}) {   // eslint-disable-line no-global-assign
  await _servFormS(x);
  const g = $("#modalForm .grid2"); if (!g) return;
  g.insertAdjacentHTML("afterbegin", `${fld("area", "Lo atiende", x.area || "psicologia", { opts: [["psicologia", "Psicología"], ["psiquiatria", "Psiquiatría"]] })}${fld("online", "Se puede hacer online", x.online !== false, { type: "checkbox", ph: "Si no, en la web solo se reserva presencial" })}`);
  const nm = $("#modalForm [name=n]"); if (nm) nm.placeholder = "Ej. Terapia individual";
  const base = mSubmit; mSubmit = async d => base({ ...d, online: !!d.online });
};

/* ---------- Caja y reportes ---------- */
const _cajaS = VIEWS.caja;
VIEWS.caja = async () => {
  await _cajaS();
  $("[data-venta]")?.remove();
  const paq = (CUR.movs || []).filter(m => !m.anulado).reduce((a, m) => a + (m.items || []).filter(i => i.tipo === "paquete").reduce((s, i) => s + i.p * i.q, 0), 0);
  const st = $$("#view .stat"); if (st[1]) st[1].querySelector("span").textContent = "Sesiones y paquetes";
  if (st[2]) st[2].innerHTML = `<i>${ico("box")}</i><div><b>${S(paq)}</b><span>Paquetes vendidos</span></div>`;
};
const _repS = VIEWS.reportes;
VIEWS.reportes = async () => {
  await _repS();
  const hoy = todayISO(), d = toD(hoy), P = CUR.rep || "mes";
  const [a, b] = { hoy: [hoy, hoy], semana: [lunes(hoy), hoy], mes: [`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`, hoy],
    pasado: (() => { const x = new Date(d.getFullYear(), d.getMonth() - 1, 1), y = new Date(d.getFullYear(), d.getMonth(), 0); const iso = z => `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`; return [iso(x), iso(y)]; })(),
    rango: [CUR.repA || addDays(hoy, -30), CUR.repB || hoy] }[P];
  const [cs, movs] = await Promise.all([DB.rango("citas", a, b), DB.rango("movimientos", a, b)]); await cargarDocs();
  const ok = movs.filter(m => !m.anulado), paqV = ok.flatMap(m => (m.items || []).filter(i => i.tipo === "paquete")), paqT = paqV.reduce((s, i) => s + i.p * i.q, 0);
  const st = $$("#view .stat"); if (st[2]) st[2].innerHTML = `<i>${ico("box")}</i><div><b>${S(paqT)}</b><span>Paquetes (${paqV.length} pago${paqV.length === 1 ? "" : "s"})</span></div>`;
  if (st[3]) { const nv = cs.filter(c => c.estado === "no-asistio").length, tot = cs.filter(c => ["atendida", "no-asistio"].includes(c.estado)).length; st[3].innerHTML = `<i>${ico("x2")}</i><div><b>${tot ? Math.round(nv / tot * 100) : 0}%</b><span>Inasistencias (${nv})</span></div>`; }
  $$("#view .card").forEach(cd => { const h = cd.querySelector("h2"); if (h && /Productos más vendidos/.test(h.textContent)) cd.innerHTML = `<div class="card-h"><h2>${ico("box")} Paquetes vendidos</h2></div><div class="list">${Object.entries(paqV.reduce((o, i) => { (o[i.n] = o[i.n] || { q: 0, v: 0 }); o[i.n].q++; o[i.n].v += i.p * i.q; return o; }, {})).sort((x, y) => y[1].v - x[1].v).map(([n, t]) => `<div class="li"><div><b>${esc(n)}</b><small>${t.q} pago${t.q > 1 ? "s" : ""}</small></div><b>${S(t.v)}</b></div>`).join("") || `<p class="empty">Sin paquetes en este periodo.</p>`}</div>`; });
  const porP = {}; cs.forEach(c => { const k = c.vet || "Sin asignar", o = porP[k] = porP[k] || { at: 0, nv: 0, on: 0, ing: 0, vetId: c.vetId }; if (c.estado === "atendida") { o.at++; o.ing += +c.pagado || 0; if (esOnline(c)) o.on++; } if (c.estado === "no-asistio") o.nv++; });
  const filas = Object.entries(porP).filter(([, o]) => o.at || o.nv).sort((x, y) => y[1].ing - x[1].ing);
  const maxI = Math.max(1, ...filas.map(([, o]) => o.ing));
  const pacN = cs.filter(c => c.estado === "atendida").length, onN = cs.filter(c => c.estado === "atendida" && esOnline(c)).length;
  $("#view .stats")?.insertAdjacentHTML("afterend", `<div class="card"><div class="card-h"><h2>${ico("users")} Por profesional</h2><small class="sub">${pacN} sesiones atendidas · ${pacN ? Math.round(onN / pacN * 100) : 0}% online</small></div>
    <div class="table-wrap"><table class="ptable"><thead><tr><th>Profesional</th><th>Sesiones</th><th class="hide-m">Online</th><th>No asistió</th><th>Cobrado</th><th class="hide-m"></th></tr></thead><tbody>
    ${filas.map(([n, o]) => `<tr><td><div class="who">${docDe(o.vetId) ? avatarDoc(docDe(o.vetId)) : ""}<b>${esc(n)}</b></div></td><td>${o.at}</td><td class="hide-m">${o.on}</td><td>${o.nv ? `<span class="st warn">${o.nv}</span>` : "0"}</td><td><b>${S(o.ing)}</b></td><td class="hide-m" style="min-width:120px"><i class="bar"><i style="width:${Math.round(o.ing / maxI * 100)}%"></i></i></td></tr>`).join("") || `<tr><td colspan="6" class="empty">Sin sesiones en este periodo.</td></tr>`}</tbody></table></div></div>`);
};

/* ---------- Ajustes: enlace fijo y sesión en tiempo real ---------- */
const _ajS = VIEWS.ajustes;
VIEWS.ajustes = async () => {
  await _ajS();
  const a = await cargarAjustes(), F = $("#ajForm"); if (!F) return;
  $$(".card-h h2", F).forEach(h => { if (/Delivery/.test(h.textContent)) { const box = h.closest(".card-h"); let n = box.nextElementSibling; box.remove(); if (n && n.classList.contains("grid2")) n.remove(); } });
  const rt = $("[name=tiempoReal]", F)?.closest(".chk"); if (rt) { rt.querySelector("b").textContent = "Usar «Iniciar sesión» y «Terminar» en la agenda"; rt.querySelector("small").textContent = "Muestra quién está en sesión ahora, activa el modo silencioso de la radio para ese profesional y avisa a recepción y caja al terminar."; }
  F.lastElementChild.insertAdjacentHTML("beforebegin", `<div class="card-h" style="margin-top:10px"><h2>${ico("video")} Sesiones online</h2></div>
    <div class="grid2">${fld("enlaceFijo", "Enlace fijo de videollamada (opcional)", a.enlaceFijo || "", { full: true, ph: "https://meet.google.com/… · se propone en cada cita online" })}</div><div style="height:10px"></div>`);
  F.addEventListener("submit", async () => { if ($$("[required]", F).some(x => !x.value.trim())) return; await safe(() => DB.saveAjustes({ enlaceFijo: $("[name=enlaceFijo]", F).value.trim() })); });
};

/* ---------- Iniciar / terminar sesión → modo sesión de la radio ---------- */
const _iniS = iniciarAtencion, _finS = terminarAtencion;
iniciarAtencion = async function (c) {   // eslint-disable-line no-global-assign
  await _iniS(c);
  if (window.RADIO && RADIO.sesion && miProf() && c.vetId === miProf()) RADIO.sesion(true, true);
};
terminarAtencion = async function (c) {   // eslint-disable-line no-global-assign
  if (window.RADIO && RADIO.sesion && miProf() && c.vetId === miProf()) RADIO.sesion(false, true);
  return _finS(c);
};

/* ---------- Mensaje de bienvenida con el código ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-send-code]"); if (!t || !CUR.cliente) return;
  e.stopImmediatePropagation();
  const c = CUR.cliente;
  openWA(c.celular, `Hola ${c.dueno.split(" ")[0]}, bienvenido(a) a *${NOMBRE_V}* 🌿\n\nTu código de paciente es: *${c.codigo || CUR.code}*\n\nCon él entras a *Mi Espacio*: tus próximas sesiones, el enlace de la videollamada, tus paquetes, tareas y documentos (recibos, recetas y constancias):\n${portalLink(c.codigo || CUR.code)}\n\nGuárdalo y no lo compartas: es personal.`);
}, true);

