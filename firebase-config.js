/* =========================================================
   CONFIGURACIÓN — Panel Mente Serena
   1) Crea tu proyecto en https://console.firebase.google.com
   2) Agrega una app web (</>) y copia aquí los datos de "firebaseConfig"
   3) Mientras apiKey diga "PEGA_AQUI", el panel funciona en MODO DEMO
      (los datos se guardan solo en este navegador).
   ========================================================= */
window.FIREBASE_CONFIG = {
  apiKey: "PEGA_AQUI",
  authDomain: "PEGA_AQUI",
  projectId: "PEGA_AQUI",
  storageBucket: "PEGA_AQUI",
  messagingSenderId: "PEGA_AQUI",
  appId: "PEGA_AQUI"
};

/* Datos del centro que usa el panel */
window.APP = {
  nombre: "Mente Serena",
  prefijoCodigo: "MS",   // los códigos saldrán como MS-7K3P9
  portal: "https://zikopro820.github.io/mente-serena/mi-espacio",   // página pública Mi Espacio
  veterinarios: ["Dra. Valeria Montes", "Dr. Ricardo Salinas", "Ps. Camila Ortega", "Ps. Andrés Villanueva", "Ps. Mariana Ríos"],
  sedes: ["Consultorio 1", "Consultorio 2", "Online"],
  servicios: ["Primera consulta de orientación", "Terapia individual", "Consulta psiquiátrica", "Control psiquiátrico", "Terapia de pareja", "Terapia familiar", "Terapia infantil", "Terapia para adolescentes", "Evaluación psicológica"],
  vacunas: [],

  /* EQUIPO Y PERMISOS
     Cada persona entra con su correo. El rol decide qué ve en el panel:
       "Administración" → todo (ajustes, editor de la web, reportes)
       "Psicólogo(a)" / "Psiquiatra" → su agenda, sus pacientes y SUS notas privadas
       "Recepción" / "Caja" → citas, pacientes, pagos y paquetes (nunca notas clínicas)
     profId = el id del profesional en la sección Profesionales (para ver "mis citas").
     Usa los MISMOS correos en firestore.rules. */
  equipo: [
    { email: "direccion@menteserena.pe", nombre: "Dirección", rol: "Administración" },
    { email: "camila@menteserena.pe", nombre: "Ps. Camila Ortega", rol: "Psicólogo(a)", profId: "camila" },
    { email: "andres@menteserena.pe", nombre: "Ps. Andrés Villanueva", rol: "Psicólogo(a)", profId: "andres" },
    { email: "mariana@menteserena.pe", nombre: "Ps. Mariana Ríos", rol: "Psicólogo(a)", profId: "mariana" },
    { email: "valeria@menteserena.pe", nombre: "Dra. Valeria Montes", rol: "Psiquiatra", profId: "valeria" },
    { email: "ricardo@menteserena.pe", nombre: "Dr. Ricardo Salinas", rol: "Psiquiatra", profId: "ricardo" },
    { email: "recepcion@menteserena.pe", nombre: "Recepción", rol: "Recepción" },
  ]
};
