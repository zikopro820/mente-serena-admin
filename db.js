/* =========================================================
   BASE DE DATOS — Firebase (Firestore + Auth) o MODO DEMO
   Estructura en Firestore:
     clientes/{CODIGO}                 → titular del código
     clientes/{CODIGO}/mascotas/{id}   → cada paciente: datos, paquetes, tareas, cuestionarios e historial (SIN notas clínicas)
     notas/{id}                        → notas de sesión privadas: solo las lee quien las escribió
   ========================================================= */
(function () {
  const CFG = window.FIREBASE_CONFIG || {};
  const DEMO = !CFG.apiKey || CFG.apiKey.startsWith("PEGA");
  const V = "10.12.2";
  const KEY = "ms_db";
  const ALFA = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";   // sin 0, O, 1, I para no confundir
  const now = () => new Date().toISOString();
  const uid = () => Math.random().toString(36).slice(2, 10);
  const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

  /* ---------------- MODO DEMO (localStorage) ---------------- */
  const MEET = "https://meet.google.com/cam-ort-ega", ZOOM_AND = "https://zoom.us/j/5551234567";   // salas de ejemplo (Camila y Andrés)
  function seed() {
    const P = extra => ({ historial: [], rec: [], paquetes: [], tareas: [], escalas: [], ...extra, actualizado: now() });
    const ses = (dias, hora, t, vet, mod, extra = {}) => ({ id: uid(), f: iso(dias), hora, t, vet, modalidad: mod, monto: 0, pagado: 0, ...extra });
    return { clientes: {
      "MS-1024": { codigo: "MS-1024", dueno: "Lucía Fernández", celular: "987654321", email: "lucia@correo.com", direccion: "Miraflores", contacto: "Pedro Fernández (hermano) · 912 333 444", notas: "Prefiere sesiones online por la noche", creado: now(), mascotas: {
        lucia: P({ nombre: "Lucía Fernández", sexo: "Femenino", nac: iso(-31 * 365), dni: "47851236", alergias: "Ninguna", medicamentos: "Sertralina 50 mg",
          profesional: "Ps. Camila Ortega", profId: "camila", psiquiatra: "Dra. Valeria Montes", modalidad: "Online", consentimiento: iso(-44),
          paquetes: [{ id: "pq1", t: "Paquete de 8 sesiones · Terapia individual", ses: 8, usadas: 5, precio: 760, pagado: 760, desde: iso(-36), vence: iso(84), servicio: "terapia-individual" }],
          tareas: [{ id: "t1", t: "Registro de pensamientos", d: "Anota 3 situaciones de la semana: qué pasó, qué pensaste y qué sentiste (0 a 10).", f: iso(-5) },
                   { id: "t2", t: "Respiración diafragmática", d: "5 minutos, 2 veces al día. Usa el audio que te enviamos por WhatsApp.", f: iso(-5) },
                   { id: "t3", t: "Caminar 20 minutos", d: "3 veces por semana, de preferencia de día.", f: iso(-12) }],
          escalas: [{ id: "gad7", n: "Ansiedad (GAD-7)", max: 21, v: [{ f: iso(-42), p: 16 }, { f: iso(-28), p: 13 }, { f: iso(-14), p: 10 }, { f: iso(-5), p: 7 }] },
                    { id: "phq9", n: "Estado de ánimo (PHQ-9)", max: 27, v: [{ f: iso(-42), p: 12 }, { f: iso(-28), p: 10 }, { f: iso(-14), p: 8 }, { f: iso(-5), p: 6 }] }],
          historial: [ses(-5, "19:00", "Terapia individual · sesión 5", "Ps. Camila Ortega", "Online", { paquete: true }), ses(-12, "19:00", "Terapia individual · sesión 4", "Ps. Camila Ortega", "Online", { paquete: true }),
            ses(-19, "19:00", "Terapia individual · sesión 3", "Ps. Camila Ortega", "Presencial", { paquete: true }),
            { id: uid(), f: iso(-36), hora: "18:30", t: "Paquete de 8 sesiones · Terapia individual", vet: "", monto: 760, pagado: 760, pagos: [{ monto: 760, metodo: "Yape", fecha: iso(-36) }], compra: true },
            { id: uid(), f: iso(-42), hora: "17:00", t: "Consulta psiquiátrica", vet: "Dra. Valeria Montes", modalidad: "Presencial", monto: 180, pagado: 180, pagos: [{ monto: 180, metodo: "Tarjeta", fecha: iso(-42) }],
              meds: [{ n: "Sertralina 50 mg", dosis: "½ tableta la primera semana, luego 1 tableta", cada: "24 h (en la mañana), hasta el próximo control", dias: "" }],
              ind: "Tomar después del desayuno. Puede haber náuseas leves los primeros días. No suspender sin consultar. Continuar con la terapia semanal.", control: iso(16), controlMotivo: "Control psiquiátrico" },
            ses(-44, "19:00", "Primera consulta de orientación", "Ps. Camila Ortega", "Online", { monto: 60, pagado: 60, pagos: [{ monto: 60, metodo: "Plin", fecha: iso(-44) }] })],
          rec: [{ id: uid(), i: "pill", t: "Control psiquiátrico", f: iso(16) }, { id: uid(), i: "task", t: "Repetir cuestionario de ansiedad", f: iso(3) }, { id: uid(), i: "cal", t: "Revisión de objetivos de la terapia", f: iso(35) }] }) } },
      "MS-2048": { codigo: "MS-2048", dueno: "Carmen Ramos", celular: "945678123", email: "", direccion: "Surco", contacto: "", notas: "Familia: terapia infantil de Joaquín + orientación a padres", creado: now(), mascotas: {
        joaquin: P({ nombre: "Joaquín Ramos", sexo: "Masculino", nac: iso(-10 * 365 - 90), dni: "", alergias: "Ninguna", menor: true, apoderado: "Carmen Ramos (mamá)",
          profesional: "Ps. Mariana Ríos", profId: "mariana", psiquiatra: "", modalidad: "Presencial", consentimiento: iso(-14),
          paquetes: [{ id: "pq2", t: "Paquete de 4 sesiones · Terapia infantil", ses: 4, usadas: 2, precio: 400, pagado: 200, desde: iso(-14), vence: iso(46), servicio: "terapia-infantil" }],
          tareas: [{ id: "t4", t: "Termómetro de emociones", d: "Antes de dormir, Joaquín marca cómo se sintió en el día (para los padres: acompañen sin corregir).", f: iso(-3) }],
          historial: [ses(-3, "16:00", "Terapia infantil · sesión 2", "Ps. Mariana Ríos", "Presencial", { paquete: true }),
            ses(-10, "16:00", "Terapia infantil · sesión 1 (con los padres)", "Ps. Mariana Ríos", "Presencial", { paquete: true, ind: "Mantener horarios de sueño fijos. Elogiar el esfuerzo, no solo el resultado. Evitar pantallas una hora antes de dormir." }),
            { id: uid(), f: iso(-14), hora: "16:00", t: "Paquete de 4 sesiones · Terapia infantil", vet: "", monto: 400, pagado: 200, pagos: [{ monto: 200, metodo: "Efectivo", fecha: iso(-14) }], compra: true }] }),
        carmen: P({ nombre: "Carmen Ramos", sexo: "Femenino", nac: iso(-41 * 365), dni: "41236587", alergias: "Ninguna", profesional: "Ps. Andrés Villanueva", profId: "andres", modalidad: "Online",
          historial: [ses(-7, "20:00", "Orientación a padres", "Ps. Andrés Villanueva", "Online", { monto: 110, pagado: 110, pagos: [{ monto: 110, metodo: "Transferencia", fecha: iso(-7) }] }),
            ses(-21, "20:00", "Orientación a padres", "Ps. Andrés Villanueva", "Online", { monto: 110, pagado: 50, pagos: [{ monto: 50, metodo: "Yape", fecha: iso(-21) }] })],
          rec: [{ id: uid(), i: "kid", t: "Reunión con la tutora del colegio de Joaquín", f: iso(-2) }] }) } },
      "MS-3072": { codigo: "MS-3072", dueno: "Jorge Mendoza", celular: "956123789", email: "", direccion: "Arequipa", contacto: "", notas: "Atención 100% online", creado: now(), mascotas: {
        jorge: P({ nombre: "Jorge Mendoza", sexo: "Masculino", nac: iso(-38 * 365), dni: "29541236", alergias: "Ninguna", profesional: "Ps. Camila Ortega", profId: "camila", modalidad: "Online", consentimiento: iso(-70),
          paquetes: [{ id: "pq3", t: "Paquete de 8 sesiones · Terapia individual", ses: 8, usadas: 7, precio: 760, pagado: 760, desde: iso(-60), vence: iso(60), servicio: "terapia-individual" }],
          historial: [1, 2, 3, 4, 5, 6, 7].map(k => ses(-7 * (8 - k), "10:00", `Terapia individual · sesión ${k}`, "Ps. Camila Ortega", "Online", { paquete: true })),
          escalas: [{ id: "gad7", n: "Ansiedad (GAD-7)", max: 21, v: [{ f: iso(-49), p: 14 }, { f: iso(-21), p: 9 }, { f: iso(-7), p: 6 }] }] }) } },
      "MS-4096": { codigo: "MS-4096", dueno: "Rosa Huamán", celular: "934567812", email: "", direccion: "Lince", contacto: "", notas: "", creado: now(), mascotas: {
        rosa: P({ nombre: "Rosa Huamán", sexo: "Femenino", nac: iso(-52 * 365), dni: "10234567", alergias: "Ninguna", profesional: "Ps. Andrés Villanueva", profId: "andres", modalidad: "Presencial",
          historial: [ses(-41, "11:00", "Terapia individual", "Ps. Andrés Villanueva", "Presencial", { monto: 110, pagado: 110, pagos: [{ monto: 110, metodo: "Efectivo", fecha: iso(-41) }] })] }) } },
    },
    notas: {
      n1: { code: "MS-1024", mid: "lucia", autor: "camila@menteserena.pe", autorNombre: "Ps. Camila Ortega", f: iso(-5), hora: "19:00", motivo: "Ansiedad anticipatoria por presentación en el trabajo.", trabajo: "Reestructuración cognitiva del pensamiento «voy a quedar en ridículo». Ensayo conductual de la presentación.", plan: "Exposición gradual: presentar ante 2 compañeros. Revisar registro de pensamientos.", creado: now() },
      n2: { code: "MS-1024", mid: "lucia", autor: "camila@menteserena.pe", autorNombre: "Ps. Camila Ortega", f: iso(-12), hora: "19:00", motivo: "Mejor sueño esta semana. Dos episodios de ansiedad leve.", trabajo: "Psicoeducación del ciclo de la ansiedad. Respiración diafragmática.", plan: "Tareas: respiración y caminatas.", creado: now() },
      n3: { code: "MS-1024", mid: "lucia", autor: "valeria@menteserena.pe", autorNombre: "Dra. Valeria Montes", f: iso(-42), hora: "17:00", motivo: "Trastorno de ansiedad generalizada con síntomas depresivos leves.", trabajo: "Evaluación psiquiátrica completa. Sin riesgo actual.", plan: "Inicio de ISRS a dosis baja. Control en 8 semanas. Coordinar con su psicóloga.", creado: now() },
      n4: { code: "MS-2048", mid: "joaquin", autor: "mariana@menteserena.pe", autorNombre: "Ps. Mariana Ríos", f: iso(-3), hora: "16:00", motivo: "Ansiedad al ir al colegio los lunes.", trabajo: "Juego con títeres sobre el colegio. Identifica el miedo como «un nudo en la panza».", plan: "Coordinar con tutora. Cartilla de rutina matutina.", creado: now() },
    } };
  }
  // Retos y registro diario de ejemplo (Mi día)
  function seedBien(d) {
    const L = d.clientes["MS-1024"], J = d.clientes["MS-3072"];
    if (L && L.mascotas.lucia && !L.mascotas.lucia.retos) L.mascotas.lucia.retos = [
      { id: "r1", t: "Respiración 4-7-8 al despertar", d: "4 ciclos, sentada en la cama", ej: "respiracion478", activo: true, desde: iso(-20) },
      { id: "r2", t: "Escribe 3 cosas buenas del día", d: "", ej: "gratitud", activo: true, desde: iso(-20) },
      { id: "r3", t: "Caminar 20 minutos", d: "De preferencia con luz de día", ej: "", activo: true, desde: iso(-20) }];
    if (J && J.mascotas.jorge && !J.mascotas.jorge.retos) J.mascotas.jorge.retos = [{ id: "r4", t: "Registro de pensamientos cuando sientas ansiedad", d: "", ej: "pensamientos", activo: true, desde: iso(-10) }];
    if (L && !L.registro) { L.registro = {}; const an = [3, 2, 3, 3, 2, 3, 3, 4, 3, 3, 4, 4, 3, 4, 4, 4, 5, 4, 4, 4];
      an.forEach((a, i) => { const f = iso(i - an.length), done = (i * 7) % 3 !== 0;
        L.registro[`${f}_lucia`] = { mid: "lucia", fecha: f, animo: a, retos: done ? { r1: true, ...(i % 2 ? { r2: true } : {}), ...(i % 3 === 1 ? { r3: true } : {}) } : {}, ejercicios: done ? [{ k: "respiracion478", min: 2, hora: "08:10" }] : [],
          ...(i % 4 === 0 ? { gratitud: ["Un café tranquilo", "Hablé con mi hermano", "Terminé un pendiente"] } : {}), ...(i === 4 ? { nota: "Día difícil en el trabajo, me costó dormir." } : {}), ...(i === 16 ? { nota: "¡Hice la presentación y salió bien!" } : {}) }; }); }
    if (J && !J.registro) { J.registro = {};
      [[-6, 3], [-5, 3], [-4, 2], [-3, 3], [-2, 2], [-1, 1]].forEach(([n, a]) => { const f = iso(n); J.registro[`${f}_jorge`] = { mid: "jorge", fecha: f, animo: a, retos: {}, ejercicios: [], ...(n === -1 ? { nota: "Me siento muy agotado, sin ganas de nada.", pensamientos: [{ s: "Me llamaron la atención en el trabajo", p: "No sirvo para nada", e: "Tristeza", i: 8, a: "Fue un error puntual, el resto del año me fue bien", i2: 6, hora: "22:15" }] } : {}) }; }); }
  }
  // Captura de ejemplo (dibujada) para los pagos web del MODO DEMO
  function capturaDemo(monto, op, metodo) {
    try {
      const c = document.createElement("canvas"); c.width = 360; c.height = 640; const g = c.getContext("2d"), yape = metodo === "Yape";
      if (metodo === "BCP") {   // constancia de transferencia de ejemplo
        g.fillStyle = "#fff"; g.fillRect(0, 0, 360, 640); g.fillStyle = "#0033a0"; g.fillRect(0, 0, 360, 96);
        g.fillStyle = "#fff"; g.font = "bold 24px Arial"; g.textAlign = "center"; g.fillText("Constancia de transferencia", 180, 58);
        g.fillStyle = "#222"; g.font = "bold 46px Arial"; g.fillText("S/ " + monto, 180, 190);
        g.font = "17px Arial"; g.fillStyle = "#555"; [["Cuenta destino", "191-12345678-0-12"], ["Titular", "Mente Serena SAC"], ["Número de operación", op]].forEach(([a, b], i) => {
          g.fillText(a, 180, 270 + i * 80); g.font = "bold 20px Arial"; g.fillStyle = "#222"; g.fillText(b, 180, 298 + i * 80); g.font = "17px Arial"; g.fillStyle = "#555"; });
        const d = new Date(), M = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"]; g.fillText(`${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()} · 09:15`, 180, 540);
        return c.toDataURL("image/jpeg", .8);
      }
      g.fillStyle = yape ? "#742284" : "#0b6fae"; g.fillRect(0, 0, 360, 640);
      g.fillStyle = "#fff"; g.beginPath(); g.roundRect ? g.roundRect(24, 120, 312, 420, 22) : g.rect(24, 120, 312, 420); g.fill();
      g.fillStyle = "#fff"; g.font = "bold 26px Arial"; g.textAlign = "center"; g.fillText(yape ? "yape" : "plin", 180, 70);
      g.fillStyle = "#222"; g.font = "bold 24px Arial"; g.fillText(yape ? "¡Yapeaste!" : "¡Pago exitoso!", 180, 175);
      g.font = "bold 50px Arial"; g.fillText("S/ " + monto, 180, 250);
      g.font = "18px Arial"; g.fillStyle = "#555"; g.fillText("Mente Serena SAC", 180, 295);
      const d = new Date(), M = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
      g.fillText(`${String(d.getDate()).padStart(2, "0")} ${M[d.getMonth()]}. ${d.getFullYear()} - 10:42 a. m.`, 180, 330);
      g.font = "16px Arial"; g.fillText("Nro. de operación", 180, 400); g.font = "bold 22px Arial"; g.fillStyle = "#222"; g.fillText(op, 180, 430);
      return c.toDataURL("image/jpeg", .8);
    } catch (e) { return ""; }
  }
  function seedPagos(d) {
    d.pagos_web = d.pagos_web || {}; let tr = false;
    Object.entries(d.citas || {}).forEach(([id, c]) => {
      if (c.estado !== "confirmada" || c.fecha < iso(0)) return; const hoy = c.fecha === iso(0);
      if (hoy && c.mascota === "Andrea Torres") { Object.assign(c, { adelantoPend: 50, adelantoMetodo: "Yape", adelantoEstado: "por-validar" });
        d.pagos_web[id] = { citaId: id, code: "", mascota: c.mascota, dueno: c.dueno, celular: c.celular, servicio: c.servicio, fecha: c.fecha, hora: c.hora, precio: c.precio, monto: 50, metodo: "Yape", operacion: "48213977",
          captura: capturaDemo("30", "48213977", "Yape"), montoLeido: 30, montosLeidos: [30], coincide: false, fechaOk: true, estado: "por-validar", creado: now() }; }
      if (hoy && c.mascota === "Martín Salas") { Object.assign(c, { adelantoPend: 50, adelantoMetodo: "Plin", adelantoEstado: "por-validar" });
        d.pagos_web[id] = { citaId: id, code: "", mascota: c.mascota, dueno: c.dueno, celular: c.celular, servicio: c.servicio, fecha: c.fecha, hora: c.hora, precio: c.precio, monto: 50, metodo: "Plin", operacion: "90311452",
          captura: capturaDemo("50.00", "90311452", "Plin"), montoLeido: 50, montosLeidos: [50], coincide: true, fechaOk: true, estado: "por-validar", creado: now() }; }
      else if (!tr && c.mascota !== "Andrea Torres" && !c.adelantoEstado && (+c.precio || 0) >= 50 && !(+c.pagado)) { tr = true;
        Object.assign(c, { adelantoPend: 50, adelantoMetodo: "Transferencia BCP", adelantoEstado: "por-validar" });
        d.pagos_web[id] = { citaId: id, code: c.code || "", mascota: c.mascota, dueno: c.dueno, celular: c.celular || "987445566", servicio: c.servicio, fecha: c.fecha, hora: c.hora, precio: c.precio, monto: 50, metodo: "Transferencia", banco: "BCP", operacion: "00561239",
          captura: capturaDemo("50.00", "00561239", "BCP"), montoLeido: 50, montosLeidos: [50], coincide: true, fechaOk: true, estado: "por-validar", creado: now() }; }
    });
  }
  // Citas y caja de ejemplo para el MODO DEMO
  function seedAgenda(d) {
    d.citas = {}; d.turnos = {}; d.movimientos = d.movimientos || {};
    const k = {};
    const add = (dias, hora, o) => {
      const fecha = iso(dias), n = k[fecha + hora] = (k[fecha + hora] || 0) + 1, id = `${fecha}_${hora}_${n}`, precio = o.precio || 0, pagado = o.pagado || 0;
      d.turnos[id] = { fecha, hora, k: n, creado: now() };
      d.citas[id] = { fecha, hora, k: n, servicioId: o.sid || "", servicio: o.serv, precio, total: precio, pagado, estadoPago: pagado >= precio && precio ? "pagado" : pagado > 0 ? "adelanto" : "pendiente",
        pagos: pagado ? [{ monto: pagado, metodo: o.metodo || "Yape", fecha, hora }] : [], code: o.code || "", mascotaId: o.mid || "", mascota: o.pac, dueno: o.dueno || o.pac, celular: o.cel || "",
        motivo: o.motivo || "", origen: o.origen || "panel", estado: o.estado || "confirmada", vet: o.vet || "", vetId: o.vetId || "", modalidad: o.mod || "Presencial", enlace: o.enlace || "",
        paqueteId: o.paq || "", sede: "", creado: now() };
      if (pagado) d.movimientos[uid()] = { fecha, hora, tipo: "servicio", concepto: `Pago · ${o.serv} – ${o.pac}`, total: pagado, metodo: o.metodo || "Yape", items: [{ tipo: "servicio", n: o.serv, q: 1, p: pagado }], citaId: id, code: o.code || "", cliente: o.dueno || o.pac, anulado: false, creado: now() };
      return id;
    };
    const L = { code: "MS-1024", mid: "lucia", pac: "Lucía Fernández", cel: "987654321" }, J = { code: "MS-3072", mid: "jorge", pac: "Jorge Mendoza", cel: "956123789" };
    const Q = { code: "MS-2048", mid: "joaquin", pac: "Joaquín Ramos", dueno: "Carmen Ramos", cel: "945678123" }, C = { code: "MS-2048", mid: "carmen", pac: "Carmen Ramos", cel: "945678123" };
    const cam = { vet: "Ps. Camila Ortega", vetId: "camila" }, mar = { vet: "Ps. Mariana Ríos", vetId: "mariana" }, and = { vet: "Ps. Andrés Villanueva", vetId: "andres" }, val = { vet: "Dra. Valeria Montes", vetId: "valeria" };
    // hoy y próximos días
    add(0, "10:00", { ...J, ...cam, serv: "Terapia individual · sesión 8", sid: "terapia-individual", mod: "Online", enlace: MEET, paq: "pq3" });
    add(0, "16:00", { ...Q, ...mar, serv: "Terapia infantil · sesión 3", sid: "terapia-infantil", paq: "pq2" });
    add(0, "17:00", { pac: "Martín Salas", cel: "998877665", serv: "Consulta psiquiátrica", sid: "consulta-psiquiatrica", precio: 180, ...val, origen: "web", motivo: "Insomnio desde hace 3 meses" });
    add(0, "18:00", { pac: "Andrea Torres", cel: "987001122", serv: "Primera consulta de orientación", sid: "orientacion", precio: 60, mod: "Online", origen: "web" });
    add(1, "19:00", { ...L, ...cam, serv: "Terapia individual · sesión 6", sid: "terapia-individual", mod: "Online", enlace: MEET, paq: "pq1" });
    add(4, "16:00", { ...Q, ...mar, serv: "Terapia infantil · sesión 4", sid: "terapia-infantil", paq: "pq2" });
    add(9, "20:00", { ...C, ...and, serv: "Orientación a padres", sid: "terapia-individual", precio: 110, mod: "Online", enlace: ZOOM_AND });
    add(16, "17:00", { ...L, ...val, serv: "Control psiquiátrico", sid: "control-psiquiatrico", precio: 120 });
    // historial de las últimas semanas (para caja y reportes)
    const pacs = [["Diego Paredes", "terapia-individual", "Terapia individual", 110, cam], ["Sofía Quispe", "terapia-pareja", "Terapia de pareja", 160, and], ["Valentina Ríos", "terapia-adolescentes", "Terapia para adolescentes", 110, mar],
      ["Ricardo Gómez", "control-psiquiatrico", "Control psiquiátrico", 120, val], ["Elena Castro", "terapia-individual", "Terapia individual", 110, cam], ["Familia Torres", "terapia-familiar", "Terapia familiar", 170, and],
      ["Mateo Lara", "psiquiatria-infantil", "Psiquiatría infantil y del adolescente", 200, { vet: "Dr. Ricardo Salinas", vetId: "ricardo" }]];
    const met = ["Yape", "Efectivo", "Plin", "Tarjeta", "Transferencia"];
    for (let dd = -28; dd <= -1; dd++) {
      if (new Date(iso(dd) + "T12:00").getDay() === 0) continue;
      const n = 1 + ((dd * 7 + 40) % 3);
      for (let j = 0; j < n; j++) { const x = pacs[((dd + 30) * 3 + j) % pacs.length], noVino = (dd === -6 && j === 0) || (dd === -13 && j === 1) || (dd === -20 && j === 0);
        add(dd, ["10:00", "15:00", "18:00"][j], { pac: x[0], cel: "9" + String(10000000 + ((dd + 30) * 997 + j * 131) % 89999999).padStart(8, "0"), sid: x[1], serv: x[2], precio: x[3], pagado: noVino ? 0 : x[3], ...x[4], estado: noVino ? "no-asistio" : "atendida", metodo: met[(dd + j + 40) % 5], mod: j === 2 ? "Online" : "Presencial" }); }
    }
    // venta de paquetes
    d.movimientos[uid()] = { fecha: iso(-14), hora: "16:10", tipo: "servicio", concepto: "Paquete de 4 sesiones · Terapia infantil – Joaquín Ramos (adelanto)", total: 200, metodo: "Efectivo", items: [{ tipo: "paquete", n: "Paquete de 4 sesiones · Terapia infantil", q: 1, p: 200 }], code: "MS-2048", cliente: "Carmen Ramos", anulado: false, creado: now() };
    d.movimientos[uid()] = { fecha: iso(-2), hora: "11:20", tipo: "servicio", concepto: "Paquete de 8 sesiones · Terapia individual – Elena Castro", total: 760, metodo: "Transferencia", items: [{ tipo: "paquete", n: "Paquete de 8 sesiones · Terapia individual", q: 1, p: 760 }], cliente: "Elena Castro", anulado: false, creado: now() };
  }

  // Pet Shop, servicios y ajustes de ejemplo (datos.js)
  function ensure(d) {
    const X = window.DATOS; if (!X) return d; let ch = false;
    const toMap = l => { const m = {}; l.forEach(({ id, ...r }) => m[id] = r); return m; };
    if (!d.productos) { d.productos = toMap(X.productos); ch = true; }
    if (!d.servicios) { d.servicios = toMap(X.servicios); ch = true; }
    if (!d.ajustes) { d.ajustes = { ...X.ajustes }; ch = true; }
    if (!d.inventario && X.productos.length) { d.inventario = {}; X.productos.forEach((p, i) => d.inventario[p.id] = { cantidad: [12, 30, 8, 25, 2, 18, 14, 9, 6, 20, 5, 0, 3, 7, 15, 18][i % 16], costo: Math.round(p.p * .55 * 10) / 10, minimo: 3 }); ch = true;
      Object.entries(d.inventario).forEach(([id, v]) => { if (d.productos[id]) d.productos[id].stock = v.cantidad > 0 ? "disponible" : "agotado"; }); }
    if (!d.web && X.web) { d.web = JSON.parse(JSON.stringify(X.web)); ch = true; }
    if (!d.citas) { seedAgenda(d); ch = true; }
    if (!d.notas) { d.notas = {}; ch = true; }
    if (!d._bien) { seedBien(d); d._bien = 1; ch = true; }
    if (!d._pagos) { seedPagos(d); d._pagos = 1; ch = true; }
    if (ch) save(d); return d;
  }
  const load = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.clientes) return ensure(d); } catch (e) {} const d = seed(); save(d); return ensure(d); };
  const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { alert("No se pudo guardar (almacenamiento lleno). Usa fotos más pequeñas."); } };
  const clone = o => JSON.parse(JSON.stringify(o));

  const demo = {
    mode: "demo",
    async onUser(cb) { let u = null; try { u = JSON.parse(sessionStorage.getItem("ms_admin")); } catch (e) {} this._cb = cb;
      // espera a que carguen todos los módulos del panel antes de abrir la sesión guardada
      if (window.__panelListo) setTimeout(() => cb(u), 0); else window.addEventListener("panel-listo", () => cb(u), { once: true }); },
    async login(email, pass) {
      if (!email || pass.length < 4) throw new Error("Correo o contraseña incorrectos.");
      const sel = document.getElementById("lRol"), eq = (window.APP && window.APP.equipo) || [], q = sel && sel.value ? eq.find(x => x.email === sel.value) : eq.find(x => x.email === email);
      const u = q ? { email: q.email, nombre: q.nombre, rol: q.rol, profId: q.profId || "" } : { email, rol: "Administración" };
      try { sessionStorage.setItem("ms_admin", JSON.stringify(u)); } catch (e) {} this._cb && this._cb(u); return u;
    },
    async logout() { try { sessionStorage.removeItem("ms_admin"); } catch (e) {} this._cb && this._cb(null); },
    async listClientes() { const d = load(); return Object.values(d.clientes).map(c => { const { mascotas, ...r } = c; return { ...clone(r), nMascotas: Object.keys(mascotas || {}).length }; }); },
    async getCliente(code) { const c = load().clientes[code]; if (!c) return null; const { mascotas, ...r } = c; return clone(r); },
    async codeExists(code) { return !!load().clientes[code]; },
    async saveCliente(code, data) { const d = load(); const old = d.clientes[code] || { mascotas: {}, creado: now() }; d.clientes[code] = { ...old, ...data, codigo: code, mascotas: old.mascotas, actualizado: now() }; save(d); },
    async deleteCliente(code) { const d = load(); delete d.clientes[code]; save(d); },
    async listMascotas(code) { const c = load().clientes[code]; return c ? Object.entries(c.mascotas || {}).map(([id, m]) => ({ id, ...clone(m) })) : []; },
    async getMascota(code, id) { const m = load().clientes[code]?.mascotas?.[id]; return m ? { id, ...clone(m) } : null; },
    async saveMascota(code, id, data) { const d = load(); id = id || uid(); const c = d.clientes[code]; c.mascotas = c.mascotas || {}; c.mascotas[id] = { ...(c.mascotas[id] || {}), ...data, actualizado: now() }; save(d); return id; },
    async deleteMascota(code, id) { const d = load(); delete d.clientes[code].mascotas[id]; save(d); },
    async allMascotas() { const d = load(); const out = []; for (const [code, c] of Object.entries(d.clientes)) for (const [id, m] of Object.entries(c.mascotas || {})) out.push({ code, id, dueno: c.dueno, celular: c.celular, ...clone(m) }); return out; },
  };

  /* ---------------- FIREBASE ---------------- */
  let fb = null;
  async function F() {
    if (fb) return fb;
    const base = `https://www.gstatic.com/firebasejs/${V}/`;
    const [app, auth, fs] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]);
    const a = app.initializeApp(CFG);
    fb = { ...auth, ...fs, auth: auth.getAuth(a), db: fs.getFirestore(a) };
    return fb;
  }
  const firebase = {
    mode: "firebase",
    async onUser(cb) { const f = await F(); if (!window.__panelListo) await new Promise(r => window.addEventListener("panel-listo", r, { once: true })); f.onAuthStateChanged(f.auth, u => { if (!u) return cb(null);
      const q = ((window.APP && window.APP.equipo) || []).find(x => String(x.email).toLowerCase() === String(u.email).toLowerCase());
      const p = q ? { email: u.email, nombre: q.nombre, rol: q.rol, profId: q.profId || "" } : { email: u.email, rol: "Administración" };
      try { sessionStorage.setItem("ms_admin", JSON.stringify(p)); } catch (e) {} cb(p); }); },
    async login(email, pass) {
      const f = await F();
      try { await f.signInWithEmailAndPassword(f.auth, email, pass); }
      catch (e) {
        if (/api-key|configuration-not-found|unauthorized-domain|operation-not-allowed/.test(e.code || "")) throw new Error("Revisa la configuración de Firebase: " + e.code + " (ver COMO-CONFIGURAR.txt)");
        throw new Error(/invalid|wrong|not-found|credential/.test(e.code || "") ? "Correo o contraseña incorrectos." : "No se pudo ingresar: " + (e.code || e.message)); }
    },
    async logout() { const f = await F(); await f.signOut(f.auth); },
    // Datos públicos (clientes/) = solo el nombre. Celular, correo, dirección y notas van en privado/ (solo el panel).
    async listClientes() {
      const f = await F();
      const [s, p, all] = await Promise.all([f.getDocs(f.collection(f.db, "clientes")), f.getDocs(f.collection(f.db, "privado")), this.allMascotas()]);
      const pv = {}; p.docs.forEach(d => pv[d.id] = d.data());
      const n = {}; all.forEach(m => n[m.code] = (n[m.code] || 0) + 1);
      return s.docs.map(d => ({ ...d.data(), ...(pv[d.id] || {}), codigo: d.id, nMascotas: n[d.id] || 0 }));
    },
    async getCliente(code) {
      const f = await F();
      const [s, p] = await Promise.all([f.getDoc(f.doc(f.db, "clientes", code)), f.getDoc(f.doc(f.db, "privado", code))]);
      return s.exists() ? { ...s.data(), ...(p.exists() ? p.data() : {}), codigo: code } : null;
    },
    async codeExists(code) { const f = await F(); return (await f.getDoc(f.doc(f.db, "clientes", code))).exists(); },
    async saveCliente(code, data) {
      const f = await F(); const ref = f.doc(f.db, "clientes", code); const ex = await f.getDoc(ref);
      const { dueno, ...priv } = data;
      await f.setDoc(ref, { dueno, codigo: code, actualizado: now(), ...(ex.exists() ? {} : { creado: now() }) }, { merge: true });
      await f.setDoc(f.doc(f.db, "privado", code), priv, { merge: true });
    },
    async deleteCliente(code) {
      const f = await F();
      for (const m of await this.listMascotas(code)) await f.deleteDoc(f.doc(f.db, "clientes", code, "mascotas", m.id));
      for (const sub of ["fotos", "agenda"]) { const q = await f.getDocs(f.collection(f.db, "clientes", code, sub)); for (const d of q.docs) await f.deleteDoc(d.ref); }
      await f.deleteDoc(f.doc(f.db, "privado", code)); await f.deleteDoc(f.doc(f.db, "clientes", code));
    },
    async listMascotas(code) { const f = await F(); const s = await f.getDocs(f.collection(f.db, "clientes", code, "mascotas")); return s.docs.map(d => ({ id: d.id, ...d.data() })); },
    async getMascota(code, id) { const f = await F(); const s = await f.getDoc(f.doc(f.db, "clientes", code, "mascotas", id)); return s.exists() ? { id, ...s.data() } : null; },
    async saveMascota(code, id, data) { const f = await F();
      if (!id) { const r = await f.addDoc(f.collection(f.db, "clientes", code, "mascotas"), { ...data, actualizado: now() }); return r.id; }
      await f.setDoc(f.doc(f.db, "clientes", code, "mascotas", id), { ...data, actualizado: now() }, { merge: true }); return id; },
    async deleteMascota(code, id) { const f = await F(); await f.deleteDoc(f.doc(f.db, "clientes", code, "mascotas", id)); },
    async allMascotas() {
      const f = await F(); const [ms, cs, ps] = await Promise.all([f.getDocs(f.collectionGroup(f.db, "mascotas")), f.getDocs(f.collection(f.db, "clientes")), f.getDocs(f.collection(f.db, "privado"))]);
      const cl = {}; cs.docs.forEach(d => cl[d.id] = d.data()); ps.docs.forEach(d => cl[d.id] = { ...(cl[d.id] || {}), ...d.data() });
      return ms.docs.map(d => { const code = d.ref.parent.parent.id; return { code, id: d.id, dueno: cl[code]?.dueno || "", celular: cl[code]?.celular || "", ...d.data() }; });
    },
  };

  /* ---------- Pet Shop, servicios y ajustes ---------- */
  Object.assign(demo, {
    async listCol(col) { return Object.entries(load()[col] || {}).map(([id, x]) => ({ ...clone(x), id })); },
    async saveDocCol(col, id, data) { const d = load(); d[col] = d[col] || {}; id = id || uid(); d[col][id] = { ...(d[col][id] || {}), ...data, actualizado: now() }; save(d); return id; },
    async delDocCol(col, id) { const d = load(); delete d[col][id]; save(d); },
    async getAjustes() { return clone(load().ajustes || {}); },
    async saveAjustes(a) { const d = load(); d.ajustes = { ...(d.ajustes || {}), ...a }; save(d); },
    async importar(col) { const d = load(); d[col] = d[col] || {}; (window.DATOS[col] || []).forEach(({ id, ...r }) => d[col][id] = r);
      if (col === "productos") { d.inventario = d.inventario || {}; window.DATOS.productos.forEach(p => { if (!d.inventario[p.id]) d.inventario[p.id] = { cantidad: 10, costo: Math.round(p.p * .62 * 10) / 10, minimo: 3 }; d.productos[p.id].stock = "disponible"; }); }
      save(d); },
  });
  Object.assign(firebase, {
    async listCol(col) { const f = await F(); const s = await f.getDocs(f.collection(f.db, col)); return s.docs.map(d => ({ ...d.data(), id: d.id })); },
    async saveDocCol(col, id, data) { const f = await F();
      if (!id) { const r = await f.addDoc(f.collection(f.db, col), { ...data, actualizado: now() }); return r.id; }
      await f.setDoc(f.doc(f.db, col, id), { ...data, actualizado: now() }, { merge: true }); return id; },
    async delDocCol(col, id) { const f = await F(); await f.deleteDoc(f.doc(f.db, col, id)); },
    async getAjustes() { const f = await F(); const s = await f.getDoc(f.doc(f.db, "ajustes", "general")); return s.exists() ? s.data() : {}; },
    async saveAjustes(a) { const f = await F(); await f.setDoc(f.doc(f.db, "ajustes", "general"), a, { merge: true }); },
    async importar(col) { const f = await F();
      for (const { id, ...r } of (window.DATOS[col] || [])) {
        await f.setDoc(f.doc(f.db, col, id), { ...r, ...(col === "productos" ? { stock: "disponible" } : {}), actualizado: now() });
        if (col === "productos") await f.setDoc(f.doc(f.db, "inventario", id), { cantidad: 10, costo: Math.round(r.p * .62 * 10) / 10, minimo: 3 }, { merge: true });
      } },
  });

  /* ---------- Agenda, caja e inventario ---------- */
  const pubCita = c => ({ fecha: c.fecha, hora: c.hora, servicio: c.servicio, precio: +c.precio || 0, total: +(c.total ?? c.precio) || 0, pagado: +c.pagado || 0,
    estadoPago: c.estadoPago || "pendiente", mascota: c.mascota || "", mascotaId: c.mascotaId || "", estado: c.estado || "confirmada", vet: c.vet || "", sede: c.sede || "",
    modalidad: c.modalidad || "Presencial", enlace: c.enlace || "", paqueteId: c.paqueteId || "",
    adelantoPend: +c.adelantoPend || 0, adelantoEstado: c.adelantoEstado || "",
    cargos: (c.cargos || []).map(x => ({ n: x.n, q: +x.q || 1, p: +x.p || 0 })), ...(c.precioBase != null ? { precioBase: +c.precioBase } : {}),
    pagos: (c.pagos || []).map(p => ({ monto: +p.monto || 0, metodo: p.metodo || "", fecha: p.fecha || "", hora: p.hora || "" })) });
  Object.assign(demo, {
    async getDocX(col, id) { const d = load(); return d[col] && d[col][id] ? clone(d[col][id]) : null; },
    async setDocX(col, id, data) { const d = load(); d[col] = d[col] || {}; d[col][id] = { ...(d[col][id] || {}), ...data }; save(d); },
    async rango(col, a, b) { return Object.entries(load()[col] || {}).filter(([, x]) => x.fecha >= a && x.fecha <= b).map(([id, x]) => ({ ...clone(x), id })); },
    async turnosRango(a, b) { return this.rango("turnos", a, b); },
    async crearCita(base, cap) {
      const d = load(); d.turnos = d.turnos || {}; d.citas = d.citas || {};
      for (let k = 1; k <= cap; k++) { const id = `${base.fecha}_${base.hora}_${k}`; if (d.turnos[id]) continue;
        d.turnos[id] = { fecha: base.fecha, hora: base.hora, k, creado: now() }; d.citas[id] = { ...base, k, creado: now() }; save(d); return id; }
      return null;
    },
    async guardarCita(id, data) { const d = load(); d.citas[id] = { ...(d.citas[id] || {}), ...data, actualizado: now() }; save(d); },
    async borrarCita(c) { const d = load(); delete d.citas[c.id]; delete d.turnos[c.id]; save(d); },
    async bloquear(fecha, hora, cap, motivo) { const d = load(); d.turnos = d.turnos || {}; for (let k = 1; k <= cap; k++) { const id = `${fecha}_${hora}_${k}`; if (!d.turnos[id]) d.turnos[id] = { fecha, hora, k, bloqueo: true, motivo: motivo || "", creado: now() }; } save(d); },
    async desbloquear(fecha, hora) { const d = load(); Object.entries(d.turnos || {}).forEach(([id, t]) => { if (t.fecha === fecha && t.hora === hora && t.bloqueo) delete d.turnos[id]; }); save(d); },
    async stock(id, delta, extra = {}) {
      const d = load(); d.inventario = d.inventario || {}; const inv = d.inventario[id] || { cantidad: 0, costo: 0, minimo: 3 };
      inv.cantidad = (+inv.cantidad || 0) + delta; Object.assign(inv, extra); d.inventario[id] = inv;
      if (d.productos && d.productos[id]) d.productos[id].stock = inv.cantidad > 0 ? "disponible" : "agotado";
      save(d); return inv.cantidad;
    },
  });
  Object.assign(firebase, {
    async getDocX(col, id) { const f = await F(); const s = await f.getDoc(f.doc(f.db, col, id)); return s.exists() ? s.data() : null; },
    async setDocX(col, id, data) { const f = await F(); await f.setDoc(f.doc(f.db, col, id), data, { merge: true }); },
    async rango(col, a, b) { const f = await F(); const s = await f.getDocs(f.query(f.collection(f.db, col), f.where("fecha", ">=", a), f.where("fecha", "<=", b))); return s.docs.map(d => ({ ...d.data(), id: d.id })); },
    async turnosRango(a, b) { return this.rango("turnos", a, b); },
    async crearCita(base, cap) {
      const f = await F();
      for (let k = 1; k <= cap; k++) {
        const id = `${base.fecha}_${base.hora}_${k}`;
        try {
          await f.runTransaction(f.db, async tx => {
            const t = f.doc(f.db, "turnos", id); if ((await tx.get(t)).exists()) throw new Error("ocupado");
            tx.set(t, { fecha: base.fecha, hora: base.hora, k, creado: now() });
            tx.set(f.doc(f.db, "citas", id), { ...base, k, creado: now() });
            if (base.code) tx.set(f.doc(f.db, "clientes", base.code, "agenda", id), pubCita(base));
          });
          return id;
        } catch (e) { if (e.message !== "ocupado") throw e; }
      }
      return null;
    },
    async guardarCita(id, data) {
      const f = await F(); const ref = f.doc(f.db, "citas", id);
      await f.setDoc(ref, { ...data, actualizado: now() }, { merge: true });
      const c = (await f.getDoc(ref)).data();
      if (c && c.code) await f.setDoc(f.doc(f.db, "clientes", c.code, "agenda", id), pubCita(c));
    },
    async borrarCita(c) {
      const f = await F(); const b = f.writeBatch(f.db);
      b.delete(f.doc(f.db, "citas", c.id)); b.delete(f.doc(f.db, "turnos", c.id));
      if (c.code) b.delete(f.doc(f.db, "clientes", c.code, "agenda", c.id));
      await b.commit();
    },
    async bloquear(fecha, hora, cap, motivo) {
      const f = await F();
      for (let k = 1; k <= cap; k++) { const ref = f.doc(f.db, "turnos", `${fecha}_${hora}_${k}`);
        if (!(await f.getDoc(ref)).exists()) await f.setDoc(ref, { fecha, hora, k, bloqueo: true, motivo: motivo || "", creado: now() }); }
    },
    async desbloquear(fecha, hora) {
      const f = await F(); const s = await f.getDocs(f.query(f.collection(f.db, "turnos"), f.where("fecha", "==", fecha)));
      for (const d of s.docs) if (d.data().hora === hora && d.data().bloqueo) await f.deleteDoc(d.ref);
    },
    async stock(id, delta, extra = {}) {
      const f = await F(); const ref = f.doc(f.db, "inventario", id);
      await f.setDoc(ref, { ...extra, cantidad: f.increment(delta) }, { merge: true });
      const q = +((await f.getDoc(ref)).data().cantidad) || 0;
      await f.setDoc(f.doc(f.db, "productos", id), { stock: q > 0 ? "disponible" : "agotado" }, { merge: true });
      return q;
    },
  });
  Object.assign(demo, {
    async getWeb() { return clone(load().web || window.DATOS.web || {}); },
    async saveWeb(w) { const d = load(); d.web = w; save(d); },
    async citasDeCliente(code) { return Object.entries(load().citas || {}).filter(([, c]) => c.code === code).map(([id, c]) => ({ ...clone(c), id })); },
  });
  Object.assign(firebase, {
    async getWeb() { const w = await this.getDocX("ajustes", "web"); return w || JSON.parse(JSON.stringify(window.DATOS.web || {})); },
    async saveWeb(w) { const f = await F(); await f.setDoc(f.doc(f.db, "ajustes", "web"), w); },
    async citasDeCliente(code) { const f = await F(); const s = await f.getDocs(f.query(f.collection(f.db, "citas"), f.where("code", "==", code))); return s.docs.map(d => ({ ...d.data(), id: d.id })); },
  });
  /* ---------- Categorías, páginas e info extra de productos ---------- */
  Object.assign(demo, {
    async getConf(n) { const c = (load().conf || {})[n]; return c ? clone(c) : null; },
    async saveConf(n, data) { const d = load(); d.conf = d.conf || {}; d.conf[n] = data; save(d); },
    async getProdInfo(id) { const x = (load().productos_info || {})[id]; return x ? clone(x) : null; },
    async saveProdInfo(id, data) { const d = load(); d.productos_info = d.productos_info || {}; d.productos_info[id] = data; save(d); },
    async delProdInfo(id) { const d = load(); if (d.productos_info) delete d.productos_info[id]; save(d); },
  });
  Object.assign(firebase, {
    async getConf(n) { return this.getDocX("ajustes", n); },
    async saveConf(n, data) { const f = await F(); await f.setDoc(f.doc(f.db, "ajustes", n), data); },
    async getProdInfo(id) { return this.getDocX("productos_info", id); },
    async saveProdInfo(id, data) { const f = await F(); await f.setDoc(f.doc(f.db, "productos_info", id), data); },
    async delProdInfo(id) { const f = await F(); await f.deleteDoc(f.doc(f.db, "productos_info", id)); },
  });

  /* ---------- Imágenes de la web (medios) y fotos del historial ---------- */
  Object.assign(demo, {
    async saveMedio(data) { const d = load(); d.medios = d.medios || {}; const id = uid() + uid(); d.medios[id] = { data, creado: now() }; save(d); return id; },
    async getMedios(ids) { const m = load().medios || {}, o = {}; ids.forEach(id => { if (m[id]) o[id] = m[id].data; }); return o; },
    async saveFoto(code, data, meta = {}) { const d = load(); d.fotos = d.fotos || {}; d.fotos[code] = d.fotos[code] || {}; const id = uid() + uid(); d.fotos[code][id] = { ...meta, data, creado: now() }; save(d); return id; },
    async getFoto(code, id) { const x = ((load().fotos || {})[code] || {})[id]; return x ? x.data : null; },
    async delFoto(code, id) { const d = load(); if (d.fotos && d.fotos[code]) delete d.fotos[code][id]; save(d); },
  });
  Object.assign(firebase, {
    async saveMedio(data) { const f = await F(); const r = await f.addDoc(f.collection(f.db, "medios"), { data, creado: now() }); return r.id; },
    async getMedios(ids) { const f = await F(), o = {}; const r = await Promise.all(ids.map(id => f.getDoc(f.doc(f.db, "medios", id)).catch(() => null))); r.forEach((d, i) => { if (d && d.exists()) o[ids[i]] = d.data().data; }); return o; },
    async saveFoto(code, data, meta = {}) { const f = await F(); const r = await f.addDoc(f.collection(f.db, "clientes", code, "fotos"), { ...meta, data, creado: now() }); return r.id; },
    async getFoto(code, id) { const f = await F(); const d = await f.getDoc(f.doc(f.db, "clientes", code, "fotos", id)); return d.exists() ? d.data().data : null; },
    async delFoto(code, id) { const f = await F(); await f.deleteDoc(f.doc(f.db, "clientes", code, "fotos", id)); },
  });

  /* ---------- Radio del equipo (mensajes de voz y avisos en tiempo real) ---------- */
  const RK = "ms_radio", radioCbs = [];
  const radioLeer = () => { try { return JSON.parse(localStorage.getItem(RK)) || []; } catch (e) { return []; } };
  window.addEventListener("storage", e => {
    if (e.key === RK) { const l = radioLeer(), vistos = new Set((e.oldValue ? JSON.parse(e.oldValue) : []).map(x => x.id)); l.filter(x => !vistos.has(x.id)).forEach(m => radioCbs.forEach(cb => cb(m))); }
  });
  Object.assign(demo, {
    async radioEnviar(m) { const l = radioLeer().filter(x => x.ts > Date.now() - 864e5); const msg = { ...m, id: uid() + uid(), ts: Date.now(), creado: now() }; l.push(msg);
      try { localStorage.setItem(RK, JSON.stringify(l.slice(-60))); } catch (e) { localStorage.setItem(RK, JSON.stringify(l.filter(x => !x.audio).slice(-60))); }
      radioCbs.forEach(cb => cb(msg)); return msg.id; },
    radioEscuchar(desde, cb) { radioLeer().filter(x => x.ts >= desde).forEach(cb); radioCbs.push(cb); },
    async radioLimpiar() { localStorage.setItem(RK, JSON.stringify(radioLeer().filter(x => x.ts > Date.now() - 864e5))); },
    citasNuevas(desdeIso, cb) {   // reservas web que llegan mientras el panel está abierto
      const ids = () => Object.keys(load().citas || {}); let antes = new Set(ids());
      window.addEventListener("storage", e => { if (e.key !== KEY) return; const d = load(); Object.entries(d.citas || {}).forEach(([id, c]) => { if (!antes.has(id) && c.origen === "web") cb({ ...c, id }); }); antes = new Set(ids()); });
    },
  });
  Object.assign(firebase, {
    async radioEnviar(m) { const f = await F(); const r = await f.addDoc(f.collection(f.db, "radio"), { ...m, ts: Date.now(), creado: now() }); return r.id; },
    async radioEscuchar(desde, cb) { const f = await F(); f.onSnapshot(f.query(f.collection(f.db, "radio"), f.where("ts", ">=", desde)), s => s.docChanges().forEach(ch => { if (ch.type === "added") cb({ ...ch.doc.data(), id: ch.doc.id }); }), e => console.warn("Radio:", e.message)); },
    async radioLimpiar() { const f = await F(); const s = await f.getDocs(f.query(f.collection(f.db, "radio"), f.where("ts", "<", Date.now() - 864e5))); for (const d of s.docs.slice(0, 80)) await f.deleteDoc(d.ref); },
    async citasNuevas(desdeIso, cb) { const f = await F(); let primera = true;
      f.onSnapshot(f.query(f.collection(f.db, "citas"), f.where("creado", ">=", desdeIso)), s => { if (!primera) s.docChanges().forEach(ch => { const c = ch.doc.data(); if (ch.type === "added" && c.origen === "web") cb({ ...c, id: ch.doc.id }); }); primera = false; }, e => console.warn("Citas nuevas:", e.message)); },
  });


  /* ---------- Notas de sesión privadas y consentimientos ---------- */
  const yo = () => { try { return (JSON.parse(sessionStorage.getItem("ms_admin")) || {}).email || ""; } catch (e) { return ""; } };
  Object.assign(demo, {
    async listNotas(code, mid) { const me = yo(); return Object.entries(load().notas || {}).filter(([, n]) => n.code === code && n.mid === mid && n.autor === me).map(([id, n]) => ({ ...clone(n), id })); },
    async contarNotas(code, mid) { return Object.values(load().notas || {}).filter(n => n.code === code && n.mid === mid).length; },
    async saveNota(id, data) { const d = load(), me = yo(); d.notas = d.notas || {}; if (id && d.notas[id] && d.notas[id].autor !== me) throw new Error("Solo quien escribió la nota puede cambiarla");
      id = id || uid() + uid(); d.notas[id] = { ...(d.notas[id] || { creado: now() }), ...data, autor: me, actualizado: now() }; save(d); return id; },
    async delNota(id) { const d = load(); if (d.notas[id] && d.notas[id].autor === yo()) delete d.notas[id]; save(d); },
    async getConsent(code, mid) { const x = (load().consentimientos || {})[code + "_" + mid]; return x ? clone(x) : null; },
    async listPagosWeb() { return Object.entries(load().pagos_web || {}).map(([id, x]) => ({ ...clone(x), id })).sort((a, b) => (b.creado || "").localeCompare(a.creado || "")); },
    async savePagoWeb(id, patch) { const d = load(); d.pagos_web = d.pagos_web || {}; d.pagos_web[id] = { ...(d.pagos_web[id] || {}), ...patch }; save(d); },
    async listRegistro(code, mid) { const c = load().clientes[code]; return Object.values((c && c.registro) || {}).filter(r => r.mid === mid).map(clone).sort((a, b) => a.fecha.localeCompare(b.fecha)); },
    async registroDesde(desde) { const out = []; for (const [code, c] of Object.entries(load().clientes)) for (const r of Object.values(c.registro || {})) if (r.fecha >= desde) out.push({ ...clone(r), code }); return out; },
    async saveConsent(code, mid, data) { const d = load(); d.consentimientos = d.consentimientos || {}; d.consentimientos[code + "_" + mid] = { ...data, code, mid, creado: now() }; save(d); },
  });
  Object.assign(firebase, {
    async listNotas(code, mid) { const f = await F(), me = f.auth.currentUser ? f.auth.currentUser.email : "";
      const s = await f.getDocs(f.query(f.collection(f.db, "notas"), f.where("autor", "==", me), f.where("code", "==", code)));
      return s.docs.map(d => ({ ...d.data(), id: d.id })).filter(n => n.mid === mid); },
    async contarNotas() { return null; },
    async saveNota(id, data) { const f = await F(), me = f.auth.currentUser.email;
      if (!id) { const r = await f.addDoc(f.collection(f.db, "notas"), { ...data, autor: me, creado: now(), actualizado: now() }); return r.id; }
      await f.setDoc(f.doc(f.db, "notas", id), { ...data, autor: me, actualizado: now() }, { merge: true }); return id; },
    async delNota(id) { const f = await F(); await f.deleteDoc(f.doc(f.db, "notas", id)); },
    async getConsent(code, mid) { return this.getDocX("consentimientos", code + "_" + mid); },
    async listPagosWeb() { const f = await F(); const s = await f.getDocs(f.collection(f.db, "pagos_web"));
      return s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => (b.creado || "").localeCompare(a.creado || "")); },
    async savePagoWeb(id, patch) { const f = await F(); await f.setDoc(f.doc(f.db, "pagos_web", id), patch, { merge: true }); },
    async listRegistro(code, mid) { const f = await F(); const s = await f.getDocs(f.collection(f.db, "clientes", code, "registro"));
      return s.docs.map(d => d.data()).filter(r => r.mid === mid).sort((a, b) => a.fecha.localeCompare(b.fecha)); },
    async registroDesde(desde) { const f = await F(); let s;
      try { s = await f.getDocs(f.query(f.collectionGroup(f.db, "registro"), f.where("fecha", ">=", desde))); }
      catch (e) { console.warn("Índice de «registro» no creado aún; se leen todos.", e.message); s = await f.getDocs(f.collectionGroup(f.db, "registro")); }
      return s.docs.map(d => ({ ...d.data(), code: d.ref.parent.parent.id })).filter(r => r.fecha >= desde); },
    async saveConsent(code, mid, data) { const f = await F(); await f.setDoc(f.doc(f.db, "consentimientos", code + "_" + mid), { ...data, code, mid, creado: now() }); },
  });

  // Cuando una cita (o un cambio de pago) es del panel en modo demo también sincroniza la copia del cliente
  demo.pubCita = firebase.pubCita = pubCita;

  const api = DEMO ? demo : firebase;
  api.nuevoCodigo = async function () {
    const pre = (window.APP && window.APP.prefijoCodigo) || "MS";
    for (let i = 0; i < 20; i++) {
      let c = pre + "-"; for (let j = 0; j < 5; j++) c += ALFA[Math.floor(Math.random() * ALFA.length)];
      if (!(await api.codeExists(c))) return c;
    }
    throw new Error("No se pudo generar un código. Intenta de nuevo.");
  };
  window.DB = api;
})();
