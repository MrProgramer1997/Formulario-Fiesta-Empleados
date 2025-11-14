// js/admin.js

// Usa los mismos datos de Supabase que en app.js
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co"; // <-- MISMO QUE app.js
const SUPABASE_ANON_KEY = "TU-LLAVE-ANON";               // <-- MISMO QUE app.js

const supabaseAdmin = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Contraseña del panel admin
const ADMIN_PASSWORD = "Club2025*";

// Elementos de login
const adminLogin = document.getElementById("adminLogin");
const adminContent = document.getElementById("adminContent");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminLoginMsg = document.getElementById("adminLoginMsg");

// Elementos del panel
const searchInput = document.getElementById("search");
const tableBody = document.getElementById("adminTableBody");
const adminSummary = document.getElementById("adminSummary");
const adminEmpty = document.getElementById("adminEmpty");
const downloadBtn = document.getElementById("downloadBtn");

let allRecords = [];
let currentRecords = [];

/* --------------------------- UTILIDADES --------------------------- */

function formatDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderTable(records) {
  tableBody.innerHTML = "";

  if (!records.length) {
    adminEmpty.style.display = "block";
    return;
  }

  adminEmpty.style.display = "none";

  records.forEach((row) => {
    const tr = document.createElement("tr");

    const tdFecha = document.createElement("td");
    tdFecha.textContent = formatDate(row.created_at);

    const tdNom = document.createElement("td");
    tdNom.textContent = row.nombres || "";

    const tdApe = document.createElement("td");
    tdApe.textContent = row.apellidos || "";

    const tdOpt = document.createElement("td");
    tdOpt.textContent = row.opcion || "";
    tdOpt.classList.add("opt-cell");

    const optLower = (row.opcion || "").toLowerCase();
    if (optLower.includes("pasadia")) {
      tdOpt.classList.add("opt-day");
    } else if (optLower.includes("fiesta")) {
      tdOpt.classList.add("opt-night");
    }

    tr.appendChild(tdFecha);
    tr.appendChild(tdNom);
    tr.appendChild(tdApe);
    tr.appendChild(tdOpt);

    tableBody.appendChild(tr);
  });
}

function renderSummary(records) {
  const total = records.length;
  const pasadia = records.filter((r) =>
    (r.opcion || "").toLowerCase().includes("pasadia")
  ).length;
  const fiesta = records.filter((r) =>
    (r.opcion || "").toLowerCase().includes("fiesta")
  ).length;

  adminSummary.textContent = `Total registros: ${total} · Pasadía: ${pasadia} · Fiesta nocturna: ${fiesta}`;
}

function applyFilter() {
  if (!allRecords.length) {
    renderTable([]);
    renderSummary([]);
    return;
  }

  const term = (searchInput.value || "").trim().toLowerCase();

  if (!term) {
    currentRecords = allRecords.slice();
  } else {
    currentRecords = allRecords.filter((row) => {
      const nom = (row.nombres || "").toLowerCase();
      const ape = (row.apellidos || "").toLowerCase();
      return nom.includes(term) || ape.includes(term);
    });
  }

  renderTable(currentRecords);
  renderSummary(currentRecords);
}

async function loadData() {
  adminSummary.textContent = "Cargando registros...";

  const { data, error } = await supabaseAdmin
    .from("fin_anio_empleados")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando registros:", error);
    adminSummary.textContent =
      "Error cargando registros. Revisa consola o credenciales.";
    renderTable([]);
    return;
  }

  allRecords = data || [];
  currentRecords = allRecords.slice();
  renderTable(currentRecords);
  renderSummary(currentRecords);
}

// Exportar a CSV (Excel lo abre perfecto)
function exportToCsv() {
  const records = currentRecords.length ? currentRecords : allRecords;

  if (!records.length) {
    alert("No hay registros para exportar.");
    return;
  }

  const header = ["Fecha", "Nombres", "Apellidos", "Opción"];
  const rows = records.map((r) => [
    formatDate(r.created_at),
    (r.nombres || "").replace(/"/g, '""'),
    (r.apellidos || "").replace(/"/g, '""'),
    (r.opcion || "").replace(/"/g, '""'),
  ]);

  const csvLines = [
    header.join(";"),
    ...rows.map((cols) => cols.map((c) => `"${c}"`).join(";")),
  ];

  const csvContent = csvLines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "registros_fin_de_ano_empleados.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* --------------------------- LOGIN --------------------------- */

function doLogin() {
  const pass = (adminPasswordInput.value || "").trim();
  adminLoginMsg.textContent = "";

  if (!pass) {
    adminLoginMsg.textContent = "Por favor ingresa la contraseña.";
    adminLoginMsg.style.color = "#fecaca";
    return;
  }

  if (pass !== ADMIN_PASSWORD) {
    adminLoginMsg.textContent = "Contraseña incorrecta.";
    adminLoginMsg.style.color = "#fecaca";
    return;
  }

  // LOGIN CORRECTO: ocultar login, mostrar contenido y cargar datos
  adminLogin.style.display = "none";
  adminContent.style.display = "block";

  loadData();
}

/* --------------------------- INICIALIZACIÓN --------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  // Login
  adminLoginBtn.addEventListener("click", doLogin);

  adminPasswordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      doLogin();
    }
  });

  // Filtro
  searchInput.addEventListener("input", applyFilter);

  // Descargar CSV
  downloadBtn.addEventListener("click", exportToCsv);
});
