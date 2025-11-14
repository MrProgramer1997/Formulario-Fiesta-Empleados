// js/admin.js

// Usa los mismos datos de Supabase que en app.js
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co"; // <-- MISMO QUE app.js
const SUPABASE_ANON_KEY = "TU-LLAVE-ANON";               // <-- MISMO QUE app.js

const supabaseAdmin = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const searchInput = document.getElementById("search");
const tableBody = document.getElementById("adminTableBody");
const adminSummary = document.getElementById("adminSummary");
const adminEmpty = document.getElementById("adminEmpty");

let allRecords = [];

// Formato fecha
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
    if ((row.opcion || "").toLowerCase().includes("pasadia")) {
      tdOpt.classList.add("opt-day");
    } else if ((row.opcion || "").toLowerCase().includes("fiesta")) {
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
  const term = (searchInput.value || "").trim().toLowerCase();

  if (!term) {
    renderTable(allRecords);
    renderSummary(allRecords);
    return;
  }

  const filtered = allRecords.filter((row) => {
    const nom = (row.nombres || "").toLowerCase();
    const ape = (row.apellidos || "").toLowerCase();
    return nom.includes(term) || ape.includes(term);
  });

  renderTable(filtered);
  renderSummary(filtered);
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
      "Error cargando registros. Ver consola o revisar credenciales.";
    return;
  }

  allRecords = data || [];
  renderTable(allRecords);
  renderSummary(allRecords);
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();

  searchInput.addEventListener("input", () => {
    applyFilter();
  });
});
