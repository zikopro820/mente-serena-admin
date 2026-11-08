/* =========================================================
   MENTE SERENA — pacientes, notas privadas, paquetes, tareas,
   cuestionarios, consentimiento informado y seguimiento.
   (se carga después de app.js y reemplaza las vistas de la plantilla)
   IMPORTANTE: las notas de sesión NO se guardan en la ficha del
   paciente (que el paciente puede leer con su código), sino aparte,
   y solo las puede leer el profesional que las escribió.
   ========================================================= */
Object.assign(SVG, {
  paw: '<path d="M12 21c-4.5-2.5-8-6.4-8-10.5A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 8 2.5c0 4.1-3.5 8-8 10.5z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>',
  task: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3z"/>',
  pill: '<path d="M10.5 20.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7z"/><path d="M8.5 8.5l7 7"/>',
  sign: '<path d="M3 17c3-3 4-9 7-9s-1 9 2 9 3-4 5-4 2 3 4 3M3 21h18"/>',
  note: '<path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h5M16 4v4h4"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 6-10 16-10 0 10-4 16-10 16"/><path d="M4 21c3-6 7-9 12-11"/>',
  kid: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  x2: '<path d="M18 6L6 18M6 6l12 12"/>',
});
const edadP = s => { if (!s) return "—"; const m = Math.floor((Date.now() - toD(s)) / (30.44 * 864e5)); return m >= 24 ? `${Math.floor(m / 12)} años` : `${Math.max(m, 0)} meses`; };
const ini2 = n => String(n || "").replace(/^(Dra?\.|Ps\.)\s*/i, "").split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
const avatarP = (m, cls = "av") => `<span class="${cls} pav">${m.foto ? `<img src="${esc(foto(m.foto, 200))}" alt="" onerror="this.remove()">` : esc(ini2(m.nombre))}</span>`;
const S2 = n => "S/ " + (Math.round((+n || 0) * 100) / 100).toFixed(2);
const tieneAlergia = m => m.alergias && !/^ningun/i.test(m.alergias.trim());

/* ---------- Roles: quién ve qué ---------- */
const YO = () => (typeof USER !== "undefined" && USER) || {};
const esClin = () => /psic|psiq/i.test(YO().rol || "");
const esAdm = () => !YO().rol || YO().rol === "Administración";
const miProf = () => YO().profId || "";
const PROFS = () => ((typeof DOCS !== "undefined" && DOCS.length) ? DOCS : (window.DATOS.doctores || []));

/* ---------- Paquetes de sesiones ---------- */
const paqEstado = p => { const ses = +p.ses || 0, us = Math.min(+p.usadas || 0, ses); return { ses, us, quedan: Math.max(ses - us, 0), saldo: Math.max((+p.precio || 0) - (+p.pagado || 0), 0), dv: p.vence ? diff(p.vence) : null }; };
const paqActivo = m => (m.paquetes || []).find(p => { const e = paqEstado(p); return e.quedan > 0 && (e.dv == null || e.dv >= 0); }) || null;
const PAQ_TIPOS = () => (window.DATOS.paquetes || []).map(p => ({ ...p, sv: (window.DATOS.servicios || []).find(s => s.id === p.servicio) }));

/* ---------- Cuestionarios (puntaje: menos = mejor) ---------- */
const OPC4 = ["Nunca", "Varios días", "Más de la mitad de los días", "Casi todos los días"];
const ESCALAS = {
  gad7: { n: "Ansiedad (GAD-7)", max: 21, preg: "En las últimas 2 semanas, ¿con qué frecuencia le han molestado estos problemas?",
    items: ["Sentirse nervioso(a), ansioso(a) o con los nervios de punta", "No poder dejar de preocuparse o no poder controlar la preocupación", "Preocuparse demasiado por diferentes cosas",
      "Dificultad para relajarse", "Estar tan inquieto(a) que es difícil quedarse sentado(a)", "Molestarse o irritarse fácilmente", "Sentir miedo, como si algo terrible fuera a pasar"],
    nivel: p => p <= 4 ? ["ok", "Mínima"] : p <= 9 ? ["ok", "Leve"] : p <= 14 ? ["warn", "Moderada"] : ["bad", "Severa"] },
  phq9: { n: "Estado de ánimo (PHQ-9)", max: 27, preg: "En las últimas 2 semanas, ¿con qué frecuencia le han molestado estos problemas?",
    items: ["Poco interés o placer en hacer las cosas", "Sentirse decaído(a), deprimido(a) o sin esperanza", "Dificultad para dormir o dormir demasiado", "Sentirse cansado(a) o con poca energía",
      "Poco apetito o comer en exceso", "Sentirse mal consigo mismo(a), o sentir que es un fracaso", "Dificultad para concentrarse", "Moverse o hablar muy lento, o estar muy inquieto(a)",
      "Pensamientos de que estaría mejor muerto(a) o de hacerse daño de alguna forma"],
    nivel: p => p <= 4 ? ["ok", "Mínima"] : p <= 9 ? ["ok", "Leve"] : p <= 14 ? ["warn", "Moderada"] : p <= 19 ? ["bad", "Moderada a severa"] : ["bad", "Severa"] },
};
function sparkSVG(v, max) {
  const l = (v || []).slice().sort((a, b) => a.f.localeCompare(b.f)); if (!l.length) return "";
  const W = 240, H = 56, p = 6, X = i => l.length < 2 ? W / 2 : p + i * (W - 2 * p) / (l.length - 1), Y = n => p + (1 - n / max) * (H - 2 * p);
  return `<svg class="esc-sp" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución del puntaje"><polyline points="${l.map((x, i) => `${X(i).toFixed(1)},${Y(+x.p).toFixed(1)}`).join(" ")}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${l.map((x, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(+x.p).toFixed(1)}" r="3.5"><title>${fmt(x.f)}: ${x.p}</title></circle>`).join("")}</svg>`;
}

/* =========================================================
   VISTAS: PACIENTES
   ========================================================= */
Object.assign(VIEWS, {
  async clientes() {
    const [cl, ms] = await Promise.all([DB.listClientes(), DB.allMascotas()]);
    const porCode = {}; ms.forEach(m => (porCode[m.code] = porCode[m.code] || []).push(m));
    const mio = miProf(); let soloMios = !!mio && CUR.soloMios !== false;
    cl.sort((a, b) => (b.creado || "").localeCompare(a.creado || ""));
    $("#view").innerHTML = topBar("Pacientes", `${cl.length} código${cl.length === 1 ? "" : "s"} de paciente`, `<button class="btn btn-pri" data-new-client>${ico("plus")} Nuevo paciente</button>`) + `
      <div class="card">
        <div class="card-h"><label class="search">${ico("search")}<input id="cSearch" type="search" placeholder="Buscar por código, nombre o celular"></label>
          ${mio ? `<label class="chk mini"><input type="checkbox" id="soloMios" ${soloMios ? "checked" : ""}><span><b>Solo mis pacientes</b></span></label>` : ""}</div>
        <div class="table-wrap"><table><thead><tr><th>Código</th><th>Paciente</th><th class="hide-m">Celular</th><th class="hide-m">Profesional</th><th>Estado</th><th></th></tr></thead><tbody id="cBody"></tbody></table></div>
      </div>`;
    const draw = () => {
      const q = $("#cSearch").value.trim().toLowerCase();
      const l = cl.filter(c => (c.codigo + " " + c.dueno + " " + c.celular + " " + (porCode[c.codigo] || []).map(m => m.nombre).join(" ")).toLowerCase().includes(q) && (!soloMios || (porCode[c.codigo] || []).some(m => m.profId === mio)));
      $("#cBody").innerHTML = l.length ? l.map(c => { const ps = porCode[c.codigo] || [], pq = ps.map(paqActivo).find(Boolean), pros = [...new Set(ps.map(m => m.profesional).filter(Boolean))];
        return `<tr class="click" data-client="${esc(c.codigo)}"><td><span class="code">${esc(c.codigo)}</span></td><td><b>${esc(c.dueno)}</b>${ps.length > 1 ? `<small class="sub">${ps.map(m => esc(m.nombre.split(" ")[0])).join(", ")}</small>` : ""}</td><td class="hide-m">${esc(c.celular)}</td>
          <td class="hide-m">${esc(pros.join(", ") || "—")}</td><td>${pq ? `<span class="st info">Paquete · quedan ${paqEstado(pq).quedan}</span>` : `<span class="st">Por sesión</span>`}</td><td style="text-align:right">${ico("eye")}</td></tr>`; }).join("")
        : `<tr><td colspan="6" class="empty">${cl.length ? "No hay resultados." : "Aún no hay pacientes. Crea el primero con «Nuevo paciente»."}</td></tr>`;
    };
    $("#cSearch").addEventListener("input", draw);
    $("#soloMios")?.addEventListener("change", e => { soloMios = e.target.checked; CUR.soloMios = soloMios; draw(); });
    draw();
  },
  async cliente({ code }) {
    const [c, ms] = await Promise.all([DB.getCliente(code), DB.listMascotas(code)]);
    if (!c) { go("clientes"); return toast("Paciente no encontrado", true); }
    $("#view").innerHTML = topBar(esc(c.dueno), "Titular del código · puede incluir a su familia (hijos, pareja)", `<button class="btn btn-light" data-edit-client>${ico("edit")} Editar</button>${esAdm() ? `<button class="btn btn-danger" data-del-client>${ico("trash")}<span class="hide-m">Eliminar</span></button>` : ""}`,
      `<div class="crumb"><button data-goto="clientes">Pacientes</button> / ${esc(code)}</div>`) + `
      <div class="card client-head">
        <div>
          <div class="info-row"><span>${ico("phone")} ${esc(c.celular)}</span>${c.email ? `<span>${ico("mail")} ${esc(c.email)}</span>` : ""}${c.direccion ? `<span>${ico("pin")} ${esc(c.direccion)}</span>` : ""}</div>
          ${c.contacto ? `<p style="margin-top:10px"><b>Contacto de emergencia:</b> ${esc(c.contacto)}</p>` : ""}
          ${c.notas ? `<p style="margin-top:6px;color:var(--muted)"><b>Notas administrativas:</b> ${esc(c.notas)}</p>` : ""}
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
            <button class="btn btn-wa btn-sm" data-send-code>${ico("wa")} Enviar código por WhatsApp</button>
            <button class="btn btn-light btn-sm" data-act="nueva" data-pre-code="${esc(code)}">${ico("plus")} Agendar cita</button>
            <a class="btn btn-light btn-sm" href="${esc(portalLink(code))}" target="_blank" rel="noopener">${ico("eye")} Ver Mi Espacio</a>
          </div>
        </div>
        <div class="code-big"><small>CÓDIGO DE PACIENTE</small><b>${esc(code)}</b><div class="row"><button class="btn btn-sm" data-copy="${esc(code)}">${ico("copy")} Copiar</button></div></div>
      </div>
      <div class="card"><div class="card-h"><h2>${ico("users")} Pacientes de este código</h2><small class="sub">El titular y sus familiares</small></div>
        <div class="pets">
          ${ms.map(m => { const pq = paqActivo(m), ult = (m.historial || []).filter(h => !h.compra).sort((a, b) => b.f.localeCompare(a.f))[0];
            return `<button class="pet pac" data-pet="${esc(m.id)}"><div class="pet-img">${avatarP(m, "pac-big")}</div>
            <div class="pet-b"><b>${esc(m.nombre)}</b><small>${edadP(m.nac)}${m.profesional ? " · " + esc(m.profesional) : ""}</small><br>
            ${m.menor ? `<span class="st info">Menor de edad</span>` : ""}${pq ? `<span class="st ok">Paquete · quedan ${paqEstado(pq).quedan}</span>` : ""}${ult ? `<span class="st">Última sesión ${fmtD(ult.f)}</span>` : `<span class="st warn">Sin sesiones aún</span>`}${!m.consentimiento ? `<span class="st warn">Falta consentimiento</span>` : ""}</div></button>`; }).join("")}
          <button class="pet add" data-new-pet><div>${ico("plus")}Agregar paciente</div></button>
        </div>
      </div>`;
    CUR.cliente = c; CUR.mascotas = ms;
  },
  async mascota({ code, id }) {
    const [c, m] = await Promise.all([DB.getCliente(code), DB.getMascota(code, id)]);
    if (!m) { go("cliente", { code }); return; }
    CUR.cliente = c; CUR.m = m;
    const his = (m.historial || []).slice().sort((a, b) => b.f.localeCompare(a.f) || String(b.hora || "").localeCompare(a.hora || ""));
    const rec = (m.rec || []).slice().sort((a, b) => a.f.localeCompare(b.f));
    const citasP = (await DB.citasDeCliente(code)).filter(x => x.mascotaId === id);
    const faltas = citasP.filter(x => x.estado === "no-asistio").length;
    const clin = esClin();
    $("#view").innerHTML = topBar(esc(m.nombre), `${edadP(m.nac)}${m.sexo ? " · " + esc(m.sexo) : ""} · Código ${esc(code)}${m.profesional ? " · Terapeuta: " + esc(m.profesional) : ""}`,
      `<button class="btn btn-light" data-edit-pet>${ico("edit")} Editar datos</button>${esAdm() ? `<button class="btn btn-danger" data-del-pet>${ico("trash")}</button>` : ""}`,
      `<div class="crumb"><button data-goto="clientes">Pacientes</button> / <button data-client="${esc(code)}">${esc(code)}</button> / ${esc(m.nombre)}</div>`) + `
      ${tieneAlergia(m) ? `<div class="alergia-bar">${ico("alert")} <b>ALERGIA:</b> ${esc(m.alergias)} — revisar antes de indicar medicación.</div>` : ""}
      ${!m.consentimiento ? `<div class="alergia-bar warn-bar">${ico("sign")} <b>Falta el consentimiento informado.</b> Fírmalo antes de la primera sesión. <button class="btn btn-sm" data-consent>Firmar ahora</button></div>` : ""}
      <div class="ficha">
        <div>
          <div class="card">
            <div class="pac-head">${avatarP(m, "pac-xl")}<div><b>${esc(m.nombre)}</b><small>${esc(code)}${m.menor ? " · menor de edad" : ""}</small></div></div>
            <div class="facts">
              <div><small>Edad</small><b>${edadP(m.nac)}</b></div><div><small>DNI</small><b>${esc(m.dni || "—")}</b></div>
              <div class="full"><small>Terapeuta</small><b>${esc(m.profesional || "Por asignar")}</b></div>
              <div class="full"><small>Psiquiatra</small><b>${esc(m.psiquiatra || "—")}</b></div>
              <div><small>Modalidad</small><b>${esc(m.modalidad || "Presencial")}</b></div><div><small>Inasistencias</small><b class="${faltas >= 2 ? "c-red" : ""}">${faltas}</b></div>
              ${m.menor ? `<div class="full"><small>Apoderado</small><b>${esc(m.apoderado || "—")}</b></div>` : ""}
              ${c.contacto ? `<div class="full"><small>Contacto de emergencia</small><b>${esc(c.contacto)}</b></div>` : ""}
              <div class="full"><small>Medicación actual</small><b>${esc(m.medicamentos || "Ninguna")}</b></div>
            </div>
            <div class="consent-row">${m.consentimiento ? `<span class="st ok">${ico("sign")} Consentimiento firmado · ${fmt(m.consentimiento)}</span><button class="btn btn-light btn-sm" data-consent-pdf>${ico("file")} PDF</button>` : `<button class="btn btn-pri btn-sm" data-consent>${ico("sign")} Firmar consentimiento</button>`}</div>
            <a class="btn btn-light btn-sm" style="width:100%;margin-top:10px" href="${esc(portalLink(code))}" target="_blank" rel="noopener">${ico("eye")} Ver como lo ve el paciente</a>
          </div>
          <div class="card"><div class="card-h"><h2>${ico("box")} Paquetes de sesiones</h2><button class="btn btn-light btn-sm" data-paq-new>${ico("plus")} Vender paquete</button></div>
            ${(m.paquetes || []).map((p, i) => { const e = paqEstado(p);
              return `<div class="fin paq" data-pqi="${i}"><div class="fin-h"><b>${esc(p.t)}</b><span>${S2(p.precio)}</span></div>
                <div class="paq-dots">${Array.from({ length: e.ses }, (_, k) => `<i class="${k < e.us ? "on" : ""}"></i>`).join("")}</div>
                <div class="fin-g"><div><small>Usadas</small><b>${e.us} de ${e.ses}</b></div><div><small>Quedan</small><b class="${e.quedan <= 1 ? "c-red" : ""}">${e.quedan}</b></div><div><small>Saldo</small><b class="${e.saldo ? "c-red" : ""}">${e.saldo ? S2(e.saldo) : "Pagado"}</b></div></div>
                ${p.vence ? `<p class="fin-next ${e.dv < 0 ? "late" : e.dv <= 14 ? "soon" : ""}">${e.dv < 0 ? "Venció el " : "Vence el "}${fmt(p.vence)}${p.avisado ? ` · avisado ${fmtD(p.avisado)}` : ""}</p>` : ""}
                <div class="acts">${e.saldo > 0 ? `<button class="btn btn-pri btn-sm" data-paq-pay>${ic2("cash")} Registrar pago</button>` : ""}${e.quedan > 0 ? `<button class="btn btn-light btn-sm" data-paq-use title="Descontar una sesión a mano">−1 sesión</button>` : ""}${e.quedan <= 2 ? `<button class="btn btn-wa btn-sm" data-paq-wa>${ico("wa")} Ofrecer renovar</button>` : ""}<button class="icon-btn" data-paq-del title="Eliminar">${ico("trash")}</button></div></div>`; }).join("") || `<p class="empty">Paga por sesión. Ofrécele un paquete: ahorra y asegura la constancia de la terapia.</p>`}
          </div>
          <div class="card"><div class="card-h"><h2>${ico("task")} Tareas entre sesiones</h2>${clin || esAdm() ? `<button class="btn btn-light btn-sm" data-tarea-new>${ico("plus")} Tarea</button>` : ""}</div>
            <p class="sub" style="margin:-4px 0 10px">El paciente las ve en Mi Espacio y las va marcando.</p>
            <div class="list">${(m.tareas || []).map(t => `<div class="li"><div><b>${esc(t.t)}</b><small>${esc(t.d || "")}${t.f ? " · desde " + fmtD(t.f) : ""}</small></div>${clin || esAdm() ? `<button class="icon-btn" data-tarea-del="${esc(t.id)}" aria-label="Quitar">${ico("trash")}</button>` : ""}</div>`).join("") || `<p class="empty">Sin tareas por ahora.</p>`}</div>
          </div>
        </div>
        <div>
          <div class="card"><div class="card-h"><h2>${ico("cal")} Citas</h2><button class="btn btn-pri btn-sm" data-cita>${ico("plus")} Agendar cita</button></div><p class="empty">Cargando…</p></div>
          <div class="card notas-card" id="notasCard"><div class="card-h"><h2>${ico("lock")} Notas de sesión privadas</h2>${clin ? `<button class="btn btn-pri btn-sm" data-nota-new>${ico("plus")} Nueva nota</button>` : ""}</div>
            ${clin ? `<p class="sub notas-priv">${ico("lock")} Solo tú puedes leer tus notas. Ni recepción, ni otros profesionales, ni el paciente las ven.</p><div id="notasList"><p class="empty">Cargando…</p></div>`
              : `<div class="lock-box">${ico("lock")}<div><b>Información clínica protegida</b><small>Las notas de sesión solo las ve el profesional que las escribe. Tu rol (${esc(YO().rol || "")}) gestiona citas, pagos y paquetes.</small></div></div>`}
          </div>
          <div class="card"><div class="card-h"><h2>${ico("chart")} Cuestionarios de seguimiento</h2>${clin ? `<div class="acts"><button class="btn btn-light btn-sm" data-esc="gad7">+ GAD-7</button><button class="btn btn-light btn-sm" data-esc="phq9">+ PHQ-9</button></div>` : ""}</div>
            ${(m.escalas || []).filter(e => (e.v || []).length).map(e => { const D = ESCALAS[e.id] || { max: e.max, nivel: () => ["", ""] }, l = e.v.slice().sort((a, b) => a.f.localeCompare(b.f)), u = l[l.length - 1], pr = l[0], [cl2, nv] = D.nivel(+u.p);
              return `<div class="esc-row"><div class="esc-i"><b>${esc(e.n)}</b><small>${l.length} medición${l.length > 1 ? "es" : ""} · última ${fmtD(u.f)}</small><span class="st ${cl2}">${nv} · ${u.p}/${e.max}</span>${l.length > 1 ? `<small class="${+u.p < +pr.p ? "c-ok" : +u.p > +pr.p ? "c-red" : ""}">${+u.p < +pr.p ? "▼ " + (pr.p - u.p) + " puntos desde el inicio" : +u.p > +pr.p ? "▲ subió " + (u.p - pr.p) + " puntos" : "Sin cambios"}</small>` : ""}</div>${sparkSVG(e.v, e.max)}</div>`; }).join("") || `<p class="empty">${clin ? "Aplica el GAD-7 (ansiedad) o el PHQ-9 (ánimo) para medir el avance. El paciente verá su gráfico en Mi Espacio." : "Sin mediciones registradas."}</p>`}
          </div>
          <div class="card"><div class="card-h"><h2>${ico("history")} Historial de sesiones</h2><button class="btn btn-light btn-sm" data-add-his>${ico("plus")} Registrar sesión</button></div>
            <p class="sub" style="margin:-4px 0 10px">Lo que se ve aquí también lo ve el paciente (sin notas clínicas).</p>
            ${his.length ? `<ul class="tl">${his.map(x => `<li><div><span class="d">${fmt(x.f)}${x.hora ? " · " + esc(x.hora) + " h" : ""}${x.modalidad ? " · " + esc(x.modalidad) : ""}${x.paquete ? ` · <span class="st info">Paquete</span>` : +x.monto ? ` · <b class="money">${S2(x.monto)}</b>${+x.pagado < +x.monto ? ` <span class="st warn">Saldo ${S2(+x.monto - (+x.pagado || 0))}</span>` : ` <span class="st ok">Pagado</span>`}` : ""}</span><b>${esc(x.t)}</b>${(x.meds || []).length ? `<ul class="rx">${x.meds.map(r => `<li>${esc(r.n)}${r.dosis ? " – " + esc(r.dosis) : ""}${r.cada ? ", cada " + esc(r.cada) : ""}${r.dias ? ", " + esc(r.dias) + (/^\d+$/.test(r.dias) ? " días" : "") : ""}</li>`).join("")}</ul>` : ""}${x.ind ? `<p><b>Recomendaciones:</b> ${esc(x.ind)}</p>` : ""}<span class="v">${esc(x.vet || "")}</span>${!x.compra ? `<div class="h-docs"><button type="button" class="btn btn-light btn-sm" data-hct="${esc(x.id)}">${ico("file")} Constancia</button></div>` : ""}</div><button class="icon-btn" data-del-item="historial" data-id="${esc(x.id)}" aria-label="Eliminar">${ico("trash")}</button></li>`).join("")}</ul>` : `<p class="empty">Sin sesiones registradas.</p>`}</div>
          <div class="card"><div class="card-h"><h2>${ico("bell")} Recordatorios para el paciente</h2><button class="btn btn-light btn-sm" data-add-rec>${ico("plus")} Recordatorio</button></div>
            <div class="list">${rec.length ? rec.map(r => `<div class="li"><div><b>${esc(r.t)}</b><small>${fmt(r.f)} · ${enDias(diff(r.f))}</small></div><button class="icon-btn" data-del-item="rec" data-id="${esc(r.id)}" aria-label="Eliminar">${ico("trash")}</button></div>`).join("") : `<p class="empty">Sin recordatorios.</p>`}</div></div>
        </div>
      </div>`;
    if (clin) pintarNotas();
  },
});

/* ---------- Notas privadas ---------- */
async function pintarNotas() {
  const box = $("#notasList"); if (!box) return;
  const l = (await DB.listNotas(CUR.code, CUR.id)).sort((a, b) => (b.f + (b.hora || "")).localeCompare(a.f + (a.hora || "")));
  CUR.notas = l;
  box.innerHTML = l.map(n => `<div class="nota" data-nid="${esc(n.id)}"><div class="nota-h"><b>${fmt(n.f)}${n.hora ? " · " + esc(n.hora) + " h" : ""}</b>${n.riesgo ? `<span class="st bad">${ico("alert")} Riesgo</span>` : ""}<span class="acts"><button class="icon-btn edit" data-nota-edit title="Editar">${ico("edit")}</button><button class="icon-btn" data-nota-del title="Eliminar">${ico("trash")}</button></span></div>
    ${n.motivo ? `<p><b>Lo que trae / motivo:</b> ${esc(n.motivo)}</p>` : ""}${n.trabajo ? `<p><b>Lo trabajado:</b> ${esc(n.trabajo)}</p>` : ""}${n.plan ? `<p><b>Plan y acuerdos:</b> ${esc(n.plan)}</p>` : ""}${n.texto ? `<p>${esc(n.texto)}</p>` : ""}</div>`).join("")
    || `<p class="empty">Aún no escribiste notas de este paciente.</p>`;
}
function notaForm(n = {}) {
  modal(n.id ? "Editar nota de sesión" : "Nueva nota de sesión", `<p class="sub notas-priv" style="margin-bottom:12px">${ico("lock")} Nota privada de <b>${esc(YO().nombre || YO().email || "")}</b> · solo tú podrás leerla.</p><div class="grid2">
    ${fld("f", "Fecha", n.f || todayISO(), { req: true, type: "date" })}${fld("hora", "Hora", n.hora || nowHM(), { type: "time" })}
    ${fld("motivo", "Lo que trae / motivo de la sesión", n.motivo || "", { type: "textarea", full: true })}
    ${fld("trabajo", "Lo trabajado (técnicas, observaciones)", n.trabajo || "", { type: "textarea", full: true })}
    ${fld("plan", "Plan y acuerdos para la próxima sesión", n.plan || "", { type: "textarea", full: true })}
    ${fld("riesgo", "Hay indicadores de riesgo (marcar para seguimiento)", !!n.riesgo, { type: "checkbox", full: true, ph: "Solo visible para ti. Sigue el protocolo del centro." })}
  </div>`, async d => {
    if (!d.motivo && !d.trabajo && !d.plan) { toast("Escribe algo en la nota", true); return false; }
    await DB.saveNota(n.id || null, { code: CUR.code, mid: CUR.id, paciente: CUR.m.nombre, autorNombre: YO().nombre || YO().email || "", f: d.f, hora: d.hora, motivo: d.motivo, trabajo: d.trabajo, plan: d.plan, riesgo: !!d.riesgo });
    toast("Nota guardada · solo tú la puedes ver"); pintarNotas();
  }, "Guardar nota");
}

/* ---------- Paquetes ---------- */
async function venderPaquete() {
  const tipos = PAQ_TIPOS(), m = CUR.m;
  modal("Vender paquete de sesiones", `<p class="sub" style="margin-bottom:12px">${esc(m.nombre)} · cada sesión atendida descuenta una automáticamente.</p><div class="grid2">
    ${fld("tipo", "Paquete", tipos[1] ? tipos[1].id : "", { full: true, opts: [...tipos.map(p => [p.id, `${p.n} · ${p.sv ? p.sv.n : ""} · ${S2(p.p)}`]), ["__otro", "Otro (escribir)"]] })}
    ${fld("t", "Nombre del paquete", "", { req: true, full: true })}
    ${fld("ses", "Número de sesiones", 8, { req: true, type: "number", extra: 'min="1" max="60" step="1"' })}
    ${fld("precio", "Precio total (S/)", 760, { req: true, type: "number", extra: 'min="0" step="1"' })}
    ${fld("meses", "Vence en (meses)", 4, { type: "number", extra: 'min="1" max="24" step="1"' })}
    ${fld("pago", "Paga ahora (S/)", 760, { type: "number", ph: "0 si paga después", extra: 'min="0" step="1"' })}
    ${fld("metodo", "Forma de pago", "Yape", { opts: MET })}
    ${fld("enviar", "Enviar confirmación por WhatsApp", true, { type: "checkbox", full: true })}
  </div>`, async d => {
    const precio = r2(d.precio), pago = Math.min(r2(d.pago || 0), precio), ses = Math.max(1, Math.round(+d.ses || 1));
    const p = { id: uid(), t: d.t, ses, usadas: 0, precio, pagado: pago, desde: todayISO(), vence: addDays(todayISO(), Math.round((+d.meses || 4) * 30.4)) };
    const pagos = pago ? [{ monto: pago, metodo: d.metodo, fecha: todayISO(), hora: nowHM() }] : [];
    const his = [...(m.historial || []), { id: uid(), paqId: p.id, f: todayISO(), hora: nowHM(), t: d.t, vet: "", monto: precio, pagado: pago, pagos, compra: true }];
    if (pago) await DB.saveDocCol("movimientos", null, { fecha: todayISO(), hora: nowHM(), tipo: "servicio", concepto: `${d.t} – ${m.nombre}${pago < precio ? " (adelanto)" : ""}`, total: pago, metodo: d.metodo, items: [{ tipo: "paquete", n: d.t, q: 1, p: pago }], code: CUR.code, cliente: CUR.cliente.dueno, anulado: false });
    await DB.saveMascota(CUR.code, CUR.id, { paquetes: [...(m.paquetes || []), p], historial: his });
    toast(`Paquete de ${ses} sesiones registrado`);
    if (d.enviar) openWA(CUR.cliente.celular, `Hola ${String(CUR.cliente.dueno).split(" ")[0]}, te saluda *${NOMBRE_V}* 🌿\n\n✅ Tu *${d.t}* quedó registrado${m.nombre !== CUR.cliente.dueno ? " para " + m.nombre : ""}.\n\n• Sesiones: ${ses}\n• Total: ${S2(precio)}\n• Pagado: ${S2(pago)}${precio - pago > 0 ? `\n• Saldo: *${S2(precio - pago)}*` : ""}\n• Válido hasta: ${fmt(p.vence)}\n\nEn Mi Espacio verás cuántas sesiones te quedan: ${portalLink(CUR.code)}`);
    refresh();
  }, "Registrar paquete");
  const F = $("#modalForm"), set = () => { const v = $("[name=tipo]", F).value, p = tipos.find(x => x.id === v);
    if (p) { $("[name=t]", F).value = `Paquete de ${p.ses} sesiones · ${p.sv ? p.sv.n.replace(/ para adultos$/, "") : "Terapia"}`; $("[name=ses]", F).value = p.ses; $("[name=precio]", F).value = p.p; $("[name=pago]", F).value = p.p; $("[name=meses]", F).value = p.ses <= 4 ? 2 : p.ses <= 8 ? 4 : 6; } };
  $("[name=tipo]", F).addEventListener("change", set); set();
}
function pagoPaquete(i) {
  const m = CUR.m, l = m.paquetes, p = l[i], e = paqEstado(p);
  modal("Pago del paquete", `<p class="sub" style="margin-bottom:12px">${esc(p.t)} · saldo ${S2(e.saldo)}</p><div class="grid2">
    ${fld("monto", "Monto (S/)", e.saldo, { req: true, type: "number", extra: 'min="0.1" step="0.1"' })}${fld("metodo", "Forma de pago", "Yape", { opts: MET })}</div>`, async d => {
    const monto = Math.min(r2(d.monto), e.saldo); if (!(monto > 0)) { toast("Monto no válido", true); return false; }
    p.pagado = r2((+p.pagado || 0) + monto);
    const his = m.historial || [], h = his.find(x => x.compra && (x.paqId === p.id || x.t === p.t));
    if (h) { h.pagado = p.pagado; h.pagos = [...(h.pagos || []), { monto, metodo: d.metodo, fecha: todayISO(), hora: nowHM() }]; }
    await DB.saveDocCol("movimientos", null, { fecha: todayISO(), hora: nowHM(), tipo: "servicio", concepto: `Saldo · ${p.t} – ${m.nombre}`, total: monto, metodo: d.metodo, items: [{ tipo: "paquete", n: p.t, q: 1, p: monto }], code: CUR.code, cliente: CUR.cliente.dueno, anulado: false });
    await DB.saveMascota(CUR.code, CUR.id, { paquetes: l, historial: his }); toast("Pago registrado en caja"); refresh();
  }, "Registrar pago");
}
const msgRenovar = (p, m, c, code) => { const e = paqEstado(p);
  return `Hola ${String(c.dueno || "").split(" ")[0]}, te saluda *${NOMBRE_V}* 🌿\n\n${e.quedan ? `A tu *${p.t}* le ${e.quedan === 1 ? "queda *1 sesión*" : `quedan *${e.quedan} sesiones*`}` : `Ya usaste todas las sesiones de tu *${p.t}*`}${m && m.nombre !== c.dueno ? " (" + m.nombre + ")" : ""}.\n\nPara no cortar tu proceso puedes renovarlo y seguir ahorrando por sesión. ¿Te lo dejamos listo para tu próxima cita?\n\nTu avance en Mi Espacio: ${portalLink(code)}`; };

/* ---------- Tareas ---------- */
function tareaForm() {
  modal("Nueva tarea para el paciente", `<div class="grid2">
    ${fld("t", "Tarea", "", { req: true, full: true, list: "tareasL", ph: "Ej. Registro de pensamientos" })}
    ${fld("d", "Indicaciones (las verá el paciente)", "", { type: "textarea", full: true, ph: "Ej. Anota 3 situaciones: qué pasó, qué pensaste y qué sentiste." })}
  </div>${datalist("tareasL", ["Registro de pensamientos", "Respiración diafragmática", "Diario de emociones", "Caminata de 20 minutos", "Higiene del sueño", "Exposición gradual", "Lista de actividades agradables", "Carta (no enviar)", "Termómetro de emociones"])}`,
    d => petUpdate({ tareas: [...(CUR.m.tareas || []), { id: uid(), t: d.t, d: d.d, f: todayISO() }] }, "Tarea agregada · el paciente ya la ve"));
}

/* ---------- Cuestionarios ---------- */
function escalaForm(id) {
  const D = ESCALAS[id];
  modal(`Cuestionario ${D.n}`, `<p class="sub" style="margin-bottom:10px">${esc(D.preg)} Marca la respuesta del paciente.</p>
    <div class="esc-form">${D.items.map((t, i) => `<div class="esc-q"><b>${i + 1}. ${esc(t)}</b><div class="esc-opts">${OPC4.map((o, k) => `<label><input type="radio" name="q${i}" value="${k}" ${k === 0 ? "checked" : ""}><span>${k} · ${o}</span></label>`).join("")}</div></div>`).join("")}</div>
    ${fld("f", "Fecha", todayISO(), { type: "date" })}<div class="cargo-sum" id="escSum"></div>`, async d => {
    const p = D.items.reduce((a, _, i) => a + (+d["q" + i] || 0), 0), m = CUR.m, l = (m.escalas || []).slice();
    let e = l.find(x => x.id === id); if (!e) { e = { id, n: D.n, max: D.max, v: [] }; l.push(e); }
    e.v = [...(e.v || []), { f: d.f || todayISO(), p }];
    await DB.saveMascota(CUR.code, CUR.id, { escalas: l });   // solo se guarda el puntaje total (el paciente lo ve en su gráfico)
    toast(`${D.n}: ${p} puntos · ${D.nivel(p)[1]}`);
    if (id === "phq9" && +d.q8 > 0) setTimeout(() => modal("Atención: pregunta 9", `<div class="alergia-bar">${ico("alert")} El paciente marcó pensamientos de muerte o de hacerse daño.</div><p style="margin-top:10px">Explora el riesgo en sesión y sigue el protocolo del centro. Recuerda los recursos de ayuda inmediata: <b>Línea 113, opción 5</b> (Minsa, 24 h) y emergencias.</p>`, async () => {}, "Entendido"), 400);
    refresh();
  }, "Guardar puntaje");
  const F = $("#modalForm"), calc = () => { const p = D.items.reduce((a, _, i) => a + (+(F.querySelector(`[name=q${i}]:checked`) || {}).value || 0), 0), [c, n] = D.nivel(p); const box = $("#escSum"); if (box) box.innerHTML = `<div class="tot"><span>Puntaje</span><b>${p} / ${D.max}</b></div><div><span>Nivel</span><b><span class="st ${c}">${n}</span></b></div>`; };
  F.addEventListener("change", function h() { if (!$("#escSum")) return F.removeEventListener("change", h); calc(); }); calc();
  $(".modal-box").classList.add("wide");
}

/* ---------- Consentimiento informado con firma ---------- */
const TEXTO_CONSENT = (m, aj) => `Yo, ${m.menor ? (m.apoderado || "[nombre del apoderado]") + ", en calidad de apoderado(a) de " + m.nombre : m.nombre}, declaro que he sido informado(a) por ${NOMBRE_V} sobre el tipo de atención psicológica y/o psiquiátrica que recibiré, sus objetivos, duración aproximada, beneficios esperados y posibles molestias.
Entiendo que la información que comparta es confidencial y está protegida por el secreto profesional. Solo podrá romperse cuando exista un riesgo grave para mi vida o la de otras personas, o por mandato legal.
Sé que las notas clínicas solo las ve el profesional que me atiende, y que en Mi Espacio puedo ver mis citas, pagos, tareas y documentos, pero no las notas de sesión.
Si la atención es online, me comprometo a conectarme desde un lugar privado. Acepto que puedo hacer preguntas, pedir información sobre mi proceso y dejar la terapia en cualquier momento.
Autorizo el tratamiento de mis datos personales y de salud para fines de atención, conforme a la Ley N.° 29733 de Protección de Datos Personales.${aj && aj.direccion ? `\nLugar: ${aj.direccion}.` : ""}`;
async function consentForm() {
  const m = CUR.m, aj = await cargarAjustes();
  modal(`Consentimiento informado · ${m.nombre}`, `<div class="consent-txt">${TEXTO_CONSENT(m, aj).split("\n").map(p => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="grid2">${fld("firmante", m.menor ? "Nombre del apoderado(a)" : "Nombre del paciente", m.menor ? m.apoderado || "" : m.nombre, { req: true })}${fld("doc", "DNI", m.menor ? "" : m.dni || "", { ph: "opcional" })}</div>
    <div class="field"><label>Firma (con el dedo o el mouse) *</label><canvas id="firma" class="firma" width="600" height="200"></canvas><button type="button" class="btn btn-sm ghost" data-firma-clear>Borrar firma</button></div>`, async d => {
    const cv = $("#firma"); if (!cv._firmado) { toast("Falta la firma", true); return false; }
    const firma = cv.toDataURL("image/png"), hoy = todayISO();
    await DB.saveConsent(CUR.code, CUR.id, { firma, firmante: d.firmante, doc: d.doc, fecha: hoy, hora: nowHM(), texto: TEXTO_CONSENT({ ...m, apoderado: m.menor ? d.firmante : m.apoderado }, aj), paciente: m.nombre });
    await DB.saveMascota(CUR.code, CUR.id, { consentimiento: hoy, ...(m.menor ? { apoderado: d.firmante } : {}) });
    toast("Consentimiento firmado y guardado"); refresh();
  }, "Guardar consentimiento");
  $(".modal-box").classList.add("wide");
  const cv = $("#firma"), g = cv.getContext("2d"); g.lineWidth = 3; g.lineCap = "round"; g.strokeStyle = "#1f3833"; let dib = false, last = null;
  const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
  cv.addEventListener("pointerdown", e => { e.preventDefault(); dib = true; last = pt(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", e => { if (!dib) return; const p = pt(e); g.beginPath(); g.moveTo(...last); g.lineTo(...p); g.stroke(); last = p; cv._firmado = true; });
  ["pointerup", "pointercancel"].forEach(ev => cv.addEventListener(ev, () => dib = false));
  $("[data-firma-clear]").addEventListener("click", () => { g.clearRect(0, 0, cv.width, cv.height); cv._firmado = false; });
}
async function consentPDF() {
  const aj = await cargarAjustes(), m = CUR.m;
  // si se firmó en papel (o es un registro antiguo) se genera el documento sin la firma digital
  const x = await DB.getConsent(CUR.code, CUR.id) || { fecha: m.consentimiento, hora: "", paciente: m.nombre, firma: "", firmante: m.menor ? m.apoderado : m.nombre, doc: m.menor ? "" : m.dni, texto: TEXTO_CONSENT(m, aj) + "\nConsentimiento registrado en el panel (firma en físico)." }; if (typeof MARCA !== "undefined" && !MARCA.nombre1) await cargarMarca();
  await safe(() => PDFV.consentimiento({ neg: negocio(aj), fecha: x.fecha, hora: x.hora, paciente: x.paciente, firma: x.firma, firmante: x.firmante, firmanteDoc: x.doc, texto: x.texto,
    campos: [["Paciente", CUR.m.nombre], ["Código", CUR.code], ["DNI", CUR.m.dni], ["Edad", edadP(CUR.m.nac)], ["Terapeuta", CUR.m.profesional], ["Modalidad", CUR.m.modalidad]] }));
}

/* ---------- Constancia de atención ---------- */
async function constanciaPDF(h) {
  const m = CUR.m, aj = await cargarAjustes(); if (typeof MARCA !== "undefined" && !MARCA.nombre1) await cargarMarca();
  await safe(() => PDFV.constancia({ neg: negocio(aj), fecha: h.f, paciente: m.nombre, vet: h.vet, firma: /^Dr/.test(h.vet || "") ? "Médico psiquiatra" : "Psicólogo(a)",
    campos: [["Paciente", m.nombre], ["DNI", m.dni], ["Edad", edadP(m.nac)], ["Código", CUR.code], ["Fecha", fmt(h.f)], ["Hora", h.hora ? h.hora + " h" : ""], ["Modalidad", h.modalidad], ["Profesional", h.vet]],
    texto: `Se deja constancia de que ${m.nombre}${m.dni ? ", identificado(a) con DNI " + m.dni + "," : ""} asistió a una atención de ${String(h.t).replace(/ · sesión.*$/i, "").toLowerCase()} en ${NOMBRE_V} el día ${fmt(h.f)}${h.hora ? " a las " + h.hora + " h" : ""}${h.modalidad ? ", en modalidad " + String(h.modalidad).toLowerCase() : ""}.\n\nSe expide la presente a solicitud del interesado(a) para los fines que estime conveniente. Por confidencialidad, no se incluye información clínica.` }));
}

/* =========================================================
   FORMULARIOS DE PACIENTE
   ========================================================= */
const optsProf = (area, val) => [["", "— Por asignar —"], ...PROFS().filter(d => d.activo !== false && (!area || (d.area || "psicologia") === area)).map(d => [d.n, d.n])];
clientForm = function (c = {}, isNew) {   // eslint-disable-line no-global-assign
  modal(isNew ? "Nuevo paciente" : "Editar titular", `
    ${isNew ? `<p style="color:var(--muted);margin-bottom:16px;font-size:.9rem">Se generará un <b>código único</b> para entrar a Mi Espacio. Después podrás agregar a su familia en el mismo código (por ejemplo, un hijo en terapia infantil).</p>` : ""}
    <div class="grid2">
      ${fld("dueno", isNew ? "Nombre y apellido del paciente" : "Nombre del titular", c.dueno, { req: true, full: true, ph: "Ej. Lucía Fernández" })}
      ${fld("celular", "Celular (WhatsApp)", c.celular, { req: true, type: "tel", ph: "987654321" })}
      ${fld("email", "Correo", c.email, { type: "email", ph: "opcional" })}
      ${isNew ? `${fld("dni", "DNI", "", { ph: "opcional" })}${fld("nac", "Fecha de nacimiento", "", { type: "date" })}
        ${fld("profesional", "Terapeuta asignado", "", { opts: optsProf("psicologia") })}${fld("psiquiatra", "Psiquiatra (si tiene)", "", { opts: optsProf("psiquiatria") })}
        ${fld("modalidad", "Modalidad", "Presencial", { opts: ["Presencial", "Online", "Mixta"] })}${fld("medicamentos", "Medicación actual", "", { ph: "Opcional" })}` : ""}
      ${fld("contacto", "Contacto de emergencia", c.contacto, { full: true, ph: "Nombre, parentesco y celular" })}
      ${fld("direccion", "Distrito / ciudad", c.direccion, { ph: "opcional" })}
      ${fld("notas", "Notas administrativas", c.notas, { type: "textarea", full: true, ph: "Horarios preferidos, forma de pago… (NO escribas información clínica aquí)" })}
    </div>`, async d => {
      if (d.celular.replace(/\D/g, "").length < 9) { toast("El celular debe tener al menos 9 dígitos", true); return false; }
      if (isNew) {
        const { dni, nac, profesional, psiquiatra, modalidad, medicamentos, ...cl } = d;
        const code = await DB.nuevoCodigo(); await DB.saveCliente(code, cl);
        const pd = PROFS().find(x => x.n === profesional);
        const id = await DB.saveMascota(code, null, { nombre: d.dueno, dni, nac, sexo: "", alergias: "Ninguna", medicamentos, profesional, profId: pd ? pd.id : "", psiquiatra, modalidad, historial: [], rec: [], paquetes: [], tareas: [], escalas: [] });
        toast("Paciente creado · Código " + code); go("mascota", { code, id });
      } else { await DB.saveCliente(CUR.code, d); toast("Titular actualizado"); refresh(); }
    }, isNew ? "Crear y generar código" : "Guardar");
};
petForm = function (m = {}) {   // eslint-disable-line no-global-assign
  const isNew = !m.id;
  modal(isNew ? "Agregar paciente al código" : "Datos del paciente", `
    <div class="photo-up"><span class="prev" id="pPrev">${m.foto ? `<img src="${esc(foto(m.foto, 200))}" alt="">` : ico("camera")}</span>
      <div><label class="btn btn-light btn-sm" for="pFile">${ico("camera")} ${m.foto ? "Cambiar foto" : "Foto (opcional)"}</label><input type="file" id="pFile" accept="image/*"><small>Se reduce automáticamente.</small></div>
      <input type="hidden" name="foto" value="${esc(m.foto || "")}"></div>
    <div class="grid2">
      ${fld("nombre", "Nombre y apellido", m.nombre, { req: true, ph: "Ej. Joaquín Ramos" })}
      ${fld("dni", "DNI", m.dni, { ph: "opcional" })}
      ${fld("nac", "Fecha de nacimiento", m.nac, { type: "date" })}
      ${fld("sexo", "Sexo", m.sexo || "", { opts: [["", "—"], "Femenino", "Masculino", "Otro"] })}
      ${fld("profesional", "Terapeuta asignado", m.profesional || "", { opts: optsProf("psicologia") })}
      ${fld("psiquiatra", "Psiquiatra", m.psiquiatra || "", { opts: optsProf("psiquiatria") })}
      ${fld("modalidad", "Modalidad", m.modalidad || "Presencial", { opts: ["Presencial", "Online", "Mixta"] })}
      ${fld("alergias", "Alergias a medicamentos", m.alergias, { ph: "Ninguna" })}
      ${fld("medicamentos", "Medicación actual", m.medicamentos, { full: true, ph: "Ej. Sertralina 50 mg" })}
      ${fld("menor", "Es menor de edad", !!m.menor, { type: "checkbox", ph: "Pide los datos del apoderado y su firma en el consentimiento" })}
      ${fld("apoderado", "Apoderado(a)", m.apoderado || "", { ph: "Nombre y parentesco" })}
    </div>`, async d => {
      const code = CUR.code, base = isNew ? { historial: [], rec: [], paquetes: [], tareas: [], escalas: [] } : {};
      const pd = PROFS().find(x => x.n === d.profesional);
      const id = await DB.saveMascota(code, m.id || null, { ...base, ...d, menor: !!d.menor, profId: pd ? pd.id : "" });
      toast(isNew ? "Paciente agregado" : "Datos actualizados"); go("mascota", { code, id });
    }, isNew ? "Agregar paciente" : "Guardar");
  $("#pFile").addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return; const data = await resizeImage(f, 300, .8); $("[name=foto]").value = data; $("#pPrev").innerHTML = `<img src="${data}" alt="">`; });
};
hisForm = function () {   // eslint-disable-line no-global-assign
  const svs = (window.DATOS.servicios || []).map(s => s.n), pq = paqActivo(CUR.m);
  modal("Registrar sesión", `${datalist("svcL", svs)}<p class="sub" style="margin-bottom:10px">Para sesiones que no pasaron por la agenda. Las notas clínicas van en <b>Notas de sesión privadas</b>.</p><div class="grid2">
    ${fld("f", "Fecha", todayISO(), { req: true, type: "date" })}${fld("hora", "Hora", nowHM(), { type: "time" })}
    ${fld("vet", "Profesional", YO().nombre && PROFS().some(x => x.n === YO().nombre) ? YO().nombre : CUR.m.profesional || "", { opts: PROFS().map(x => x.n) })}
    ${fld("modalidad", "Modalidad", CUR.m.modalidad || "Presencial", { opts: ["Presencial", "Online"] })}
    ${fld("t", "Servicio", "", { req: true, full: true, list: "svcL", ph: "Ej. Terapia individual" })}
    ${fld("ind", "Recomendaciones para el paciente (las verá en Mi Espacio)", "", { type: "textarea", full: true })}
    ${pq ? fld("paq", `Descontar del paquete (quedan ${paqEstado(pq).quedan})`, true, { type: "checkbox", full: true }) : ""}
  </div>`, async d => {
    const patch = {}, it = { id: uid(), f: d.f, hora: d.hora, t: d.t, vet: d.vet, modalidad: d.modalidad, ind: d.ind, monto: 0, pagado: 0 };
    if (pq && d.paq) { const l = CUR.m.paquetes.map(p => p.id === pq.id ? { ...p, usadas: (+p.usadas || 0) + 1 } : p); patch.paquetes = l; it.paquete = true; it.t = `${d.t} · sesión ${(+pq.usadas || 0) + 1}`; }
    patch.historial = [...(CUR.m.historial || []), it];
    await petUpdate(patch, "Sesión registrada");
  });
};
recForm = function () {   // eslint-disable-line no-global-assign
  modal("Nuevo recordatorio", `<div class="grid2">
    ${fld("t", "Recordatorio", "", { req: true, full: true, ph: "Ej. Control psiquiátrico, retomar terapia" })}
    ${fld("f", "Fecha", addDays(todayISO(), 30), { req: true, type: "date" })}
    ${fld("i", "Ícono", "cal", { opts: [["cal", "Cita"], ["pill", "Psiquiatría"], ["video", "Sesión online"], ["box", "Paquete"], ["task", "Tarea"], ["kid", "Niños"]] })}
  </div>`, d => petUpdate({ rec: [...(CUR.m.rec || []), { id: uid(), ...d }] }, "Recordatorio agregado"));
};

/* =========================================================
   SEGUIMIENTO (reemplaza Vacunas): recordatorios por WhatsApp
   ========================================================= */
const avisadoR = f => f && diff(f) >= -10;
async function recordatoriosData() {
  const hoy = todayISO(), man = addDays(hoy, 1);
  const [ms, cs] = await Promise.all([DB.allMascotas(), DB.rango("citas", addDays(hoy, -60), addDays(hoy, 60))]);
  const out = { manana: [], paquetes: [], saldos: [], inactivos: [], controles: [], cuotas: [], limpieza: [] };
  cs.filter(c => c.fecha === man && c.estado === "confirmada").sort((a, b) => a.hora.localeCompare(b.hora)).forEach(c => out.manana.push({ c }));
  ms.forEach(m => {
    (m.paquetes || []).forEach((p, pi) => { const e = paqEstado(p); if ((e.quedan <= 1 && e.us > 0) || (e.dv != null && e.dv <= 14 && e.quedan > 0)) out.paquetes.push({ m, p, pi, e }); if (e.saldo > 0) out.saldos.push({ m, p, pi, e }); });
    (m.rec || []).forEach(r => { const d = diff(r.f); if (d >= -14 && d <= 7) out.controles.push({ m, r }); });
    const ult = (m.historial || []).filter(h => !h.compra).sort((a, b) => b.f.localeCompare(a.f))[0];
    const futura = cs.some(c => c.code === m.code && c.mascotaId === m.id && c.fecha >= hoy && c.estado === "confirmada");
    if (ult && diff(ult.f) <= -30 && !futura && !m.alta) out.inactivos.push({ m, ult });
  });
  out.porAvisar = out.manana.filter(x => !x.c.recordado).length + out.paquetes.filter(x => !avisadoR(x.p.avisado)).length + out.inactivos.filter(x => !avisadoR(x.m.avisoRetomar)).length + out.controles.filter(x => !avisadoR(x.r.avisado)).length;
  return out;
}
const msgSesion = c => `Hola ${String(c.dueno || "").split(" ")[0]}, te saluda *${NOMBRE_V}* 🌿\n\nTe recordamos tu sesión de *mañana*:\n• ${c.servicio}${c.mascota && c.mascota !== c.dueno ? " (" + c.mascota + ")" : ""}\n• ${largo(c.fecha)} a las ${c.hora} h\n• ${c.vet ? "Con " + c.vet + " · " : ""}${c.modalidad || "Presencial"}${/online/i.test(c.modalidad || "") ? (c.enlace ? `\n\n🎥 Enlace de la videollamada:\n${c.enlace}\nConéctate desde un lugar privado y tranquilo.` : "\n\nTe enviaremos el enlace de la videollamada antes de la sesión.") : ""}\n\nPor favor confírmanos tu asistencia respondiendo este mensaje.${c.code ? `\n\nMi Espacio: ${portalLink(c.code)}` : ""}`;
VIEWS.vacunas = async () => {
  const R = await recordatoriosData(); CUR.R = R;
  const fila = (m, txt, sub, btn, av) => `<div class="li" data-pet="${esc(m.id)}" data-code="${esc(m.code)}" style="cursor:pointer">${avatarP(m)}<div><b>${esc(m.nombre)} · ${txt}</b><small>${esc(m.dueno)}${m.celular ? " · " + esc(m.celular) : ""} · ${sub}</small></div>
    ${avisadoR(av) ? `<span class="st ok">Avisado ✓ ${fmtD(av)}</span>` : ""}<button class="btn ${avisadoR(av) ? "btn-light" : "btn-wa"} btn-sm" ${btn}>${ico("wa")}<span class="hide-m">${avisadoR(av) ? "Otra vez" : "Avisar"}</span></button></div>`;
  $("#view").innerHTML = topBar("Seguimiento", "Recordatorios por WhatsApp con un clic: sesiones de mañana, paquetes por terminar, saldos y pacientes que dejaron de venir.") + `
    <div class="stats">
      <div class="stat"><i>${ico("cal")}</i><div><b>${R.manana.length}</b><span>Sesiones de mañana</span></div></div>
      <div class="stat"><i>${ico("box")}</i><div><b>${R.paquetes.length}</b><span>Paquetes por terminar</span></div></div>
      <div class="stat"><i>${ico("history")}</i><div><b>${R.inactivos.length}</b><span>Sin venir +30 días</span></div></div>
      <div class="stat hl"><i>${ico("wa")}</i><div><b>${R.porAvisar}</b><span>Por avisar</span></div></div>
    </div>
    <div class="card"><div class="card-h"><h2>${ico("cal")} Recordar sesiones de mañana</h2></div><div class="list">${R.manana.map((x, i) => `<div class="li">${avatarP({ nombre: x.c.mascota })}<div><b>${esc(x.c.hora)} h · ${esc(x.c.mascota)}</b><small>${esc(x.c.servicio)} · ${esc(x.c.vet || "Sin profesional")} · ${esc(x.c.modalidad || "Presencial")}${/online/i.test(x.c.modalidad || "") && !x.c.enlace ? ` · <b class="c-red">falta enlace</b>` : ""}</small></div>${x.c.recordado ? `<span class="st ok">Avisado ✓</span>` : ""}<button class="btn ${x.c.recordado ? "btn-light" : "btn-wa"} btn-sm" data-rc-man="${i}">${ico("wa")}<span class="hide-m">${x.c.recordado ? "Otra vez" : "Recordar"}</span></button></div>`).join("") || `<p class="empty">No hay sesiones mañana.</p>`}</div></div>
    <div class="card"><div class="card-h"><h2>${ico("box")} Paquetes por terminar o vencer</h2></div><div class="list">${R.paquetes.map(x => fila(x.m, esc(x.p.t), `${x.e.quedan ? `quedan ${x.e.quedan}` : "sin sesiones"}${x.p.vence ? " · vence " + fmtD(x.p.vence) : ""}`, `data-rc-paq="${x.pi}"`, x.p.avisado)).join("") || `<p class="empty">Ningún paquete por terminar.</p>`}</div></div>
    <div class="card"><div class="card-h"><h2>${ic2("cash")} Saldos de paquetes</h2></div><div class="list">${R.saldos.map(x => `<div class="li" data-pet="${esc(x.m.id)}" data-code="${esc(x.m.code)}" style="cursor:pointer">${avatarP(x.m)}<div><b>${esc(x.m.nombre)} · ${esc(x.p.t)}</b><small>${esc(x.m.dueno)} · pagado ${S2(x.p.pagado)} de ${S2(x.p.precio)}</small></div><span class="st warn">Saldo ${S2(x.e.saldo)}</span></div>`).join("") || `<p class="empty">Sin saldos pendientes.</p>`}</div></div>
    <div class="card"><div class="card-h"><h2>${ico("history")} Dejaron de venir (+30 días sin sesión ni cita)</h2></div><div class="list">${R.inactivos.map(x => fila(x.m, "retomar terapia", `última sesión ${fmt(x.ult.f)} (${enDias(diff(x.ult.f))})`, `data-rc-ret="1"`, x.m.avisoRetomar)).join("") || `<p class="empty">Todos tienen continuidad. 🎉</p>`}</div></div>
    <div class="card"><div class="card-h"><h2>${ico("bell")} Controles y recordatorios</h2></div><div class="list">${R.controles.map(x => fila(x.m, esc(x.r.t), `${fmtD(x.r.f)} · ${enDias(diff(x.r.f))}`, `data-rc-rec="${esc(x.r.id)}"`, x.r.avisado)).join("") || `<p class="empty">Nada para esta semana.</p>`}</div></div>`;
};

/* ---------- Clics ---------- */
document.addEventListener("click", async e => {
  const t = e.target.closest("button"); if (!t || !$("#view").contains(t)) return;
  if (t.dataset.rcMan != null) { const c = CUR.R.manana[+t.dataset.rcMan].c; openWA(c.celular, msgSesion(c)); await DB.guardarCita(c.id, { recordado: todayISO() }); toast("Recordatorio enviado"); return refresh(); }
  if (t.matches("[data-rc-paq], [data-rc-rec], [data-rc-ret]")) {
    e.stopPropagation();
    const row = t.closest("[data-pet]"), code = row.dataset.code, id = row.dataset.pet, [c, m] = await Promise.all([DB.getCliente(code), DB.getMascota(code, id)]);
    if (t.dataset.rcPaq != null) { const p = m.paquetes[+t.dataset.rcPaq]; openWA(c.celular, msgRenovar(p, m, c, code)); p.avisado = todayISO(); await DB.saveMascota(code, id, { paquetes: m.paquetes }); }
    if (t.dataset.rcRec) { const r = (m.rec || []).find(x => x.id === t.dataset.rcRec); openWA(c.celular, `Hola ${String(c.dueno).split(" ")[0]}, te saluda *${NOMBRE_V}* 🌿\n\nTe recordamos: *${r.t}*${m.nombre !== c.dueno ? " de " + m.nombre : ""} el ${largo(r.f)}.\n\n¿Te separamos una cita? Reserva aquí:\n${webBase()}citas?codigo=${encodeURIComponent(code)}`); r.avisado = todayISO(); await DB.saveMascota(code, id, { rec: m.rec }); }
    if (t.dataset.rcRet) { openWA(c.celular, `Hola ${String(c.dueno).split(" ")[0]}, te saluda *${NOMBRE_V}* 🌿\n\nHace unas semanas que no nos vemos${m.nombre !== c.dueno ? " con " + m.nombre : ""} y queríamos saber cómo estás.\n\nSi quieres retomar tus sesiones, presenciales u online, aquí puedes elegir día y hora:\n${webBase()}citas?codigo=${encodeURIComponent(code)}\n\nSi prefieres conversar primero, responde este mensaje. Estamos para acompañarte.`); await DB.saveMascota(code, id, { avisoRetomar: todayISO() }); }
    toast("Marcado como avisado"); return refresh();
  }
  if (CUR.v !== "mascota") return;
  if (t.matches("[data-consent]")) return consentForm();
  if (t.matches("[data-consent-pdf]")) return consentPDF();
  if (t.matches("[data-nota-new]")) return notaForm();
  if (t.matches("[data-tarea-new]")) return tareaForm();
  if (t.dataset.tareaDel) return confirmDel("Se quitará esta tarea (el paciente ya no la verá).", () => petUpdate({ tareas: (CUR.m.tareas || []).filter(x => x.id !== t.dataset.tareaDel) }, "Tarea quitada"));
  if (t.dataset.esc) return escalaForm(t.dataset.esc);
  if (t.dataset.hct) { const h = (CUR.m.historial || []).find(x => x.id === t.dataset.hct); if (h) return constanciaPDF(h); }
  if (t.matches("[data-paq-new]")) return venderPaquete();
  const nb = t.closest("[data-nid]");
  if (nb) { const n = (CUR.notas || []).find(x => x.id === nb.dataset.nid); if (!n) return;
    if (t.matches("[data-nota-edit]")) return notaForm(n);
    if (t.matches("[data-nota-del]")) return confirmDel("Se eliminará esta nota de sesión.", async () => { await DB.delNota(n.id); toast("Nota eliminada"); pintarNotas(); }); }
  const pb = t.closest("[data-pqi]");
  if (pb) { const i = +pb.dataset.pqi, l = CUR.m.paquetes || [], p = l[i];
    if (t.matches("[data-paq-pay]")) return pagoPaquete(i);
    if (t.matches("[data-paq-use]")) { p.usadas = Math.min((+p.usadas || 0) + 1, +p.ses); await DB.saveMascota(CUR.code, CUR.id, { paquetes: l }); toast(`Sesión descontada · quedan ${paqEstado(p).quedan}`); return refresh(); }
    if (t.matches("[data-paq-wa]")) { openWA(CUR.cliente.celular, msgRenovar(p, CUR.m, CUR.cliente, CUR.code)); p.avisado = todayISO(); await DB.saveMascota(CUR.code, CUR.id, { paquetes: l }); return refresh(); }
    if (t.matches("[data-paq-del]")) return confirmDel(`Se eliminará el paquete <b>${esc(p.t)}</b>. Los pagos ya registrados en Caja se mantienen.`, async () => { l.splice(i, 1); await DB.saveMascota(CUR.code, CUR.id, { paquetes: l }); toast("Paquete eliminado"); refresh(); });
  }
});
