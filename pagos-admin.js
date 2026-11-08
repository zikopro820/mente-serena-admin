/* =========================================================
   MENTE SERENA — Adelantos con Yape y Plin
   · Pagos por validar: el paciente subió su captura en la web; el
     sistema ya la leyó (monto, número de operación, fecha) y aquí
     recepción la confirma con un clic después de revisar su app.
   · Ajustes → Pagos: QR de Yape y Plin, monto del adelanto, etc.
   ========================================================= */
let PW = [];
async function cargarPagosWeb() { PW = await DB.listPagosWeb(); actualizarBadgePagos(); return PW; }
function actualizarBadgePagos() {
  const n = PW.filter(p => p.estado === "por-validar").length, b = $('#nav [data-view="pagosweb"]'); if (!b) return;
  let s = b.querySelector(".nav-n"); if (!s) { s = document.createElement("b"); s.className = "nav-n"; b.appendChild(s); }
  s.textContent = n; s.hidden = !n;
}
const alertasPago = p => {
  const a = [];
  if (p.montoLeido == null) a.push(["warn", "No se pudo leer el monto de la captura: revísala a mano."]);
  else if (p.coincide === false) a.push(["bad", `La captura dice ${(p.montosLeidos || [p.montoLeido]).map(S2).join(" / ")} y el paciente escribió ${S2(p.monto)}.`]);
  if (p.fechaOk === false) a.push(["bad", "La fecha de la captura no es de hoy ni de ayer."]);
  const dup = p.operacion && PW.filter(x => x.id !== p.id && x.operacion === p.operacion && x.estado !== "rechazado");
  if (dup && dup.length) a.push(["bad", `Número de operación repetido: ya se usó en el pago de ${dup.map(x => esc(x.mascota || x.dueno)).join(", ")}.`]);
  if (!p.operacion) a.push(["warn", "Sin número de operación."]);
  return a;
};
async function citaDePago(p) {
  if (CITAS[p.citaId]) return CITAS[p.citaId];
  const l = await DB.rango("citas", p.fecha, p.fecha); l.forEach(c => CITAS[c.id] = c); return CITAS[p.citaId] || null;
}

VIEWS.pagosweb = async () => {
  await cargarPagosWeb();
  const F = CUR.pwF || "por-validar", l = PW.filter(p => p.estado === F);
  const n = k => PW.filter(p => p.estado === k).length;
  $("#view").innerHTML = topBar("Pagos web", "Adelantos que los pacientes pagaron con Yape o Plin al reservar. Revisa tu app y confirma con un clic.") + `
    <div class="alergia-bar warn-bar">${ico("alert")} <span><b>Importante:</b> la lectura automática ayuda, pero una captura se puede editar. Antes de validar, <b>confirma en tu app de Yape o Plin</b> que el dinero llegó (mira el monto y el número de operación).</span></div>
    <div class="chips" style="margin-bottom:14px">${[["por-validar", "Por validar"], ["validado", "Validados"], ["rechazado", "Rechazados"]].map(([k, t]) => `<button class="chip ${F === k ? "on" : ""}" data-pwf="${k}">${t} (${n(k)})</button>`).join("")}</div>
    <div class="pw-list">${l.map(p => { const al = F === "por-validar" ? alertasPago(p) : [];
      return `<div class="card pw" data-pw="${esc(p.id)}">
        <button class="pw-img" data-pwimg title="Ver captura completa">${p.captura ? `<img src="${esc(p.captura)}" alt="Captura del pago de ${esc(p.mascota || "")}">` : `<span>Sin captura</span>`}</button>
        <div class="pw-b">
          <div class="pw-h"><span class="pw-met ${String(p.metodo).toLowerCase()}">${esc(p.metodo)}</span><b class="pw-monto">${S2(p.monto)}</b>${p.montoLeido != null ? `<span class="st ${p.coincide ? "ok" : "bad"}">Leído: ${S2(p.montoLeido)} ${p.coincide ? "✓" : "✕"}</span>` : `<span class="st warn">No leído</span>`}</div>
          <p><b>${esc(p.mascota || "")}</b>${p.dueno && p.dueno !== p.mascota ? ` · ${esc(p.dueno)}` : ""}${p.celular ? ` · ${esc(p.celular)}` : ""}${p.code ? ` · <span class="code">${esc(p.code)}</span>` : ""}</p>
          <p class="sub">${esc(p.servicio || "")} · ${fmtD(p.fecha)} ${esc(p.hora || "")} h · precio ${S2(p.precio)} · saldo después ${S2(Math.max((+p.precio || 0) - (+p.monto || 0), 0))}</p>
          <p class="sub">Operación: <b>${esc(p.operacion || "—")}</b> · enviado ${p.creado ? new Date(p.creado).toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</p>
          ${al.map(([c, t]) => `<div class="pw-al ${c}">${ico("alert")} ${t}</div>`).join("")}
          ${F === "validado" ? `<p class="pw-res ok">Validado${p.validadoPor ? " por " + esc(p.validadoPor) : ""} · ${p.validado ? fmtD(p.validado.slice(0, 10)) : ""} · ${S2(p.montoValidado ?? p.monto)}</p>` : ""}
          ${F === "rechazado" ? `<p class="pw-res bad">Rechazado: ${esc(p.motivo || "")}</p>` : ""}
          ${F === "por-validar" ? `<div class="acts"><button class="btn btn-pri btn-sm" data-pwok>${ico("check")} Validar pago</button><button class="btn btn-light btn-sm" data-pwno>${ic2("x")} Rechazar</button>${p.celular ? `<button class="btn btn-wa btn-sm" data-pwwa>${ico("wa")}</button>` : ""}</div>` : ""}
        </div></div>`; }).join("") || `<p class="empty card">${F === "por-validar" ? "No hay adelantos por validar. 🎉" : "Nada por aquí."}</p>`}</div>`;
};
async function validarPago(p) {
  const c = await citaDePago(p);
  modal("Validar adelanto", `${p.captura ? `<img class="pw-zoom" src="${esc(p.captura)}" alt="Captura">` : ""}
    <p style="margin:10px 0">Confirma que en tu app de <b>${esc(p.metodo)}</b> llegó el pago${p.operacion ? ` con operación <b>${esc(p.operacion)}</b>` : ""}.</p>
    ${!c ? `<div class="alergia-bar">${ico("alert")} La cita ya no existe (pudo ser eliminada). Puedes marcar el pago como revisado.</div>` : ""}
    <div class="grid2">${fld("monto", "Monto recibido (S/)", p.montoLeido && p.coincide === false ? p.montoLeido : p.monto, { req: true, type: "number", extra: 'min="0.1" step="0.1"' })}${fld("metodo", "Forma de pago", p.metodo, { opts: ["Yape", "Plin"] })}
    ${fld("enviar", "Avisar al paciente por WhatsApp", true, { type: "checkbox", full: true })}</div>`, async d => {
    const monto = r2(d.monto); if (!(monto > 0)) { toast("Monto no válido", true); return false; }
    if (c) { const nc = await registrarPago(c, monto, d.metodo, "Adelanto web"); await DB.guardarCita(c.id, { adelantoEstado: "validado", adelantoPend: 0 }); CITAS[c.id] = { ...nc, adelantoEstado: "validado", adelantoPend: 0 }; }
    await DB.savePagoWeb(p.id, { estado: "validado", montoValidado: monto, metodoValidado: d.metodo, validado: new Date().toISOString(), validadoPor: YO().nombre || YO().email || "" });
    toast(`Adelanto de ${S2(monto)} validado y registrado en Caja`);
    if (d.enviar && p.celular) openWA(p.celular, `Hola ${String(p.dueno || "").split(" ")[0]}, te saluda *${NOMBRE_V}* 🌿\n\n✅ Recibimos tu adelanto de *${S2(monto)}* por ${d.metodo}.\n\n• ${p.servicio}\n• ${largo(p.fecha)} a las ${p.hora} h${(+p.precio || 0) - monto > 0 ? `\n• Saldo a pagar: *${S2((+p.precio || 0) - monto)}*` : "\n• Tu sesión está pagada"}\n\n¡Te esperamos!${p.code ? `\n\nMi Espacio: ${portalLink(p.code)}` : ""}`);
    refresh();
  }, "Validar pago");
}
function rechazarPago(p) {
  modal("Rechazar adelanto", `<div class="grid2">${fld("motivo", "Motivo", "No llegó el pago a nuestra cuenta", { full: true, opts: ["No llegó el pago a nuestra cuenta", "El monto no coincide", "La captura no se lee bien", "La captura es de otro pago", "Otro"] })}
    ${fld("det", "Detalle (opcional)", "", { full: true, ph: "Ej. Recibimos S/ 30 en lugar de S/ 50" })}${fld("enviar", "Avisar al paciente por WhatsApp", true, { type: "checkbox", full: true })}</div>
    <p class="sub">La cita se mantiene reservada; el paciente pagará en el consultorio o volverá a enviar el adelanto.</p>`, async d => {
    const c = await citaDePago(p), motivo = d.motivo + (d.det ? ": " + d.det : "");
    if (c) await DB.guardarCita(c.id, { adelantoEstado: "rechazado", adelantoPend: 0 });
    await DB.savePagoWeb(p.id, { estado: "rechazado", motivo, rechazado: new Date().toISOString(), validadoPor: YO().nombre || YO().email || "" });
    toast("Adelanto rechazado");
    if (d.enviar && p.celular) openWA(p.celular, `Hola ${String(p.dueno || "").split(" ")[0]}, te saluda *${NOMBRE_V}* 🌿\n\nRevisamos tu adelanto de ${S2(p.monto)} por ${p.metodo} para tu cita del ${largo(p.fecha)} a las ${p.hora} h, pero no pudimos validarlo:\n• ${motivo}\n\nTu cita sigue reservada. Puedes enviarnos la captura correcta por aquí o pagar en el consultorio. ¡Gracias!`);
    refresh();
  }, "Rechazar");
}
document.addEventListener("click", async e => {
  const t = e.target.closest("button"); if (!t || !$("#view").contains(t)) return;
  if (t.dataset.pwf) { CUR.pwF = t.dataset.pwf; return VIEWS.pagosweb(); }
  const box = t.closest("[data-pw]"); if (!box) return;
  const p = PW.find(x => x.id === box.dataset.pw); if (!p) return;
  if (t.matches("[data-pwimg]") && p.captura) return modal(`Captura · ${esc(p.mascota || "")}`, `<img class="pw-zoom full" src="${esc(p.captura)}" alt="Captura del pago">`, async () => {}, "Cerrar");
  if (t.matches("[data-pwok]")) return validarPago(p);
  if (t.matches("[data-pwno]")) return rechazarPago(p);
  if (t.matches("[data-pwwa]")) return openWA(p.celular, `Hola ${String(p.dueno || "").split(" ")[0]}, te saluda *${NOMBRE_V}* 🌿\n\nEstamos revisando tu adelanto de ${S2(p.monto)} por ${p.metodo}.`);
});

/* ---------- Tarjeta de cita: estado del adelanto ---------- */
const _citaCardPW = citaCard;
citaCard = function (c, opt = {}) {   // eslint-disable-line no-global-assign
  let h = _citaCardPW(c, opt);
  if (c.adelantoEstado === "por-validar") h = h.replace('<div class="badges">', `<div class="badges"><button type="button" class="st warn st-btn" data-goto="pagosweb">${ic2("cash")} Adelanto ${S(c.adelantoPend)} por validar</button>`);
  else if (c.adelantoEstado === "rechazado") h = h.replace('<div class="badges">', `<div class="badges"><span class="st bad">Adelanto rechazado</span>`);
  return h;
};

/* ---------- Inicio y Caja: aviso de pagos por validar ---------- */
const _inicioPW = VIEWS.inicio;
VIEWS.inicio = async () => {
  await _inicioPW(); await cargarPagosWeb();
  const l = PW.filter(p => p.estado === "por-validar"); if (!l.length || (esClin() && !esAdm())) return;
  $("#view .two-col > div:last-child")?.insertAdjacentHTML("afterbegin", `<div class="card pw-card"><div class="card-h"><h2>${ic2("cash")} Adelantos por validar</h2><button class="btn btn-pri btn-sm" data-goto="pagosweb">Revisar (${l.length})</button></div>
    <div class="list">${l.slice(0, 4).map(p => `<div class="li"><span class="pw-met ${String(p.metodo).toLowerCase()}">${esc(p.metodo)}</span><div><b>${esc(p.mascota)} · ${S2(p.monto)}</b><small>${esc(p.servicio)} · ${fmtD(p.fecha)} ${esc(p.hora)} h</small></div>${alertasPago(p).some(a => a[0] === "bad") ? `<span class="st bad">Revisar</span>` : `<span class="st ok">Coincide</span>`}</div>`).join("")}</div></div>`);
};
const _cajaPW = VIEWS.caja;
VIEWS.caja = async () => {
  await _cajaPW(); await cargarPagosWeb();
  const n = PW.filter(p => p.estado === "por-validar").length;
  if (n) $("#view .stats")?.insertAdjacentHTML("beforebegin", `<div class="alergia-bar warn-bar">${ic2("cash")} <span>Tienes <b>${n} adelanto${n > 1 ? "s" : ""}</b> de la web por validar.</span><button class="btn btn-sm" data-goto="pagosweb">Revisar</button></div>`);
};
const _goPW = go;
go = async function (v, p) {   // eslint-disable-line no-global-assign
  const r = await _goPW(v, p); if (USER && v !== "pagosweb" && !PW.length) safe(cargarPagosWeb); else actualizarBadgePagos(); return r;
};

/* ---------- Ajustes → Pagos y adelantos ---------- */
const _ajPW = VIEWS.ajustes;
VIEWS.ajustes = async () => {
  await _ajPW();
  const a = await cargarAjustes();
  const met = (k, n) => `<div class="pg-met ${k}"><div class="pg-qr"><span class="prev" id="${k}Prev">${a[k + "QR"] ? `<img src="${esc(a[k + "QR"])}" alt="QR de ${n}">` : ico("camera")}</span>
      <label class="btn btn-light btn-sm" for="${k}File">${ico("camera")} ${a[k + "QR"] ? "Cambiar QR" : "Subir QR"}</label><input type="file" id="${k}File" accept="image/*" hidden><input type="hidden" name="${k}QR" value="${esc(a[k + "QR"] || "")}"></div>
    <div class="grid2">${fld("pago" + n, `Aceptar ${n}`, a["pago" + n] !== false, { type: "checkbox", full: true })}${fld(k + "Num", `Número de ${n}`, a[k + "Num"] || "", { ph: "987 654 321" })}${fld(k + "Titular", "A nombre de", a[k + "Titular"] || "", { ph: "Nombre que aparece al pagar" })}</div></div>`;
  $("#view").insertAdjacentHTML("beforeend", `<form class="card" id="pagosForm" novalidate>
    <div class="card-h"><h2>${ic2("cash")} Pagos y adelantos (web)</h2></div>
    <p class="sub" style="margin:-4px 0 14px">Al reservar, el paciente puede dejar un adelanto escaneando tu QR. Sube la imagen del QR que te da la app de Yape o Plin (captura de pantalla de «Mi QR»).</p>
    ${met("yape", "Yape")}${met("plin", "Plin")}
    <div class="grid2" style="margin-top:12px">
      ${fld("adelantoTipo", "Tipo de adelanto", a.adelantoTipo || "fijo", { opts: [["fijo", "Monto fijo (S/)"], ["porcentaje", "Porcentaje del precio (%)"]] })}
      ${fld("adelantoValor", "Valor del adelanto", a.adelantoValor ?? 50, { type: "number", extra: 'min="1" step="1"', ph: "50" })}
      ${fld("adelantoObligatorio", "Adelanto obligatorio para reservar", !!a.adelantoObligatorio, { type: "checkbox", full: true, ph: "Si está apagado, el paciente elige entre adelantar o pagar en el consultorio" })}
      ${fld("adelantoOCR", "Leer la captura automáticamente", a.adelantoOCR !== false, { type: "checkbox", full: true, ph: "Compara el monto, el número de operación y la fecha de la captura" })}
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn btn-pri" type="submit">${ico("check")} Guardar pagos</button></div>
  </form>`);
  const F = $("#pagosForm");
  ["yape", "plin"].forEach(k => $(`#${k}File`).addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return;
    const data = await resizeImage(f, 700, .92, "image/png"); $(`[name=${k}QR]`, F).value = data; $(`#${k}Prev`).innerHTML = `<img src="${data}" alt="">`; toast("QR listo · no olvides Guardar"); }));
  F.addEventListener("submit", async e => { e.preventDefault();
    const v = n => $(`[name=${n}]`, F), x = { adelantoTipo: v("adelantoTipo").value, adelantoValor: +v("adelantoValor").value || 50, adelantoObligatorio: v("adelantoObligatorio").checked, adelantoOCR: v("adelantoOCR").checked };
    ["Yape", "Plin"].forEach(n => { const k = n.toLowerCase(); x["pago" + n] = v("pago" + n).checked; x[k + "QR"] = v(k + "QR").value; x[k + "Num"] = v(k + "Num").value.trim(); x[k + "Titular"] = v(k + "Titular").value.trim(); });
    await safe(() => DB.saveAjustes(x)); AJ_CACHE_RESET(); toast("Pagos guardados · ya se ven en la web"); });
};
function AJ_CACHE_RESET() { try { if (typeof AJ !== "undefined" && AJ) Object.keys(AJ).forEach(k => delete AJ[k]); } catch (e) {} }
