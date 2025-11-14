// js/app.js

// 1. Configuración de Supabase (TU PROYECTO)
const SUPABASE_URL = "https://fuscxqlmxehwwozxlirz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c2N4cWxteGVod3dvenhsaXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzY0MzAsImV4cCI6MjA3ODcxMjQzMH0.TwN3JSYh96ItCbjk8fcPOoktUnfBonNmK0xxgVYCIio";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 2. Selectores
const form = document.getElementById("finAnioForm");
const optionsGrid = document.getElementById("optionsGrid");
const messagesBox = document.getElementById("messages");
const submitBtn = document.getElementById("submitBtn");

// Modal
const successModal = document.getElementById("successModal");
const modalNameEl = document.getElementById("modalName");
const modalOptionEl = document.getElementById("modalOption");
const modalCloseBtn = document.getElementById("modalCloseBtn");

const STORAGE_KEY = "finAnioEmpleadoRegistrado_v1";

// 3. Utilidades de UI
function showMessage(type, text) {
  messagesBox.innerHTML = "";
  if (!text) return;

  const div = document.createElement("div");
  div.classList.add("message");
  if (type === "success") div.classList.add("message-success");
  if (type === "error") div.classList.add("message-error");

  const iconSpan = document.createElement("span");
  iconSpan.classList.add("icon");
  iconSpan.textContent = type === "success" ? "✅" : "⚠️";

  const textSpan = document.createElement("span");
  textSpan.textContent = text;

  div.appendChild(iconSpan);
  div.appendChild(textSpan);
  messagesBox.appendChild(div);
}

function setFormDisabled(disabled) {
  if (disabled) {
    form.classList.add("disabled");
    submitBtn.classList.add("loading");
  } else {
    form.classList.remove("disabled");
    submitBtn.classList.remove("loading");
  }
}

// Modal
function openSuccessModal(nombreCompleto, opcion) {
  if (!successModal) return;
  modalNameEl.textContent = nombreCompleto;
  modalOptionEl.textContent = opcion;
  successModal.classList.add("open");
  successModal.setAttribute("aria-hidden", "false");
}

function closeSuccessModal() {
  if (!successModal) return;
  successModal.classList.remove("open");
  successModal.setAttribute("aria-hidden", "true");
}

// 4. Manejar selección visual de tarjetas
optionsGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".option-card");
  if (!card) return;

  const radio = card.querySelector('input[type="radio"]');
  if (!radio) return;

  radio.checked = true;

  document
    .querySelectorAll(".option-card.selected")
    .forEach((c) => c.classList.remove("selected"));

  card.classList.add("selected");
});

// 5. Registro local (para evitar doble registro en el mismo navegador)
function checkAlreadyRegisteredLocal() {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

function markRegisteredLocal() {
  localStorage.setItem(STORAGE_KEY, "1");
}

// 6. Envío del formulario
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nombres = form.nombres.value.trim();
  const apellidos = form.apellidos.value.trim();
  const documento = form.documento.value.trim();
  const opcionRadio = form.querySelector('input[name="opcion"]:checked');

  if (!nombres || !apellidos) {
    showMessage("error", "Por favor completa tus nombres y apellidos.");
    return;
  }

  if (!documento) {
    showMessage("error", "Por favor ingresa tu número de documento.");
    return;
  }

  if (!opcionRadio) {
    showMessage("error", "Por favor selecciona una de las opciones de evento.");
    return;
  }

  const opcion = opcionRadio.value;

  // Validación local
  if (checkAlreadyRegisteredLocal()) {
    showMessage(
      "error",
      "Ya realizaste tu registro desde este dispositivo. Si crees que es un error, comunícate con sistemas."
    );
    return;
  }

  setFormDisabled(true);
  showMessage("success", "Enviando tu registro...");

  try {
    const { error } = await supabaseClient
      .from("fin_anio_empleados")
      .insert([
        {
          nombres,
          apellidos,
          documento,
          opcion,
        },
      ]);

    if (error) {
      console.error("Error Supabase:", error);

      // Error por registro duplicado (índice único)
      if (error.code === "23505") {
        showMessage(
          "error",
          "Ya te encuentras registrado para este evento. No es necesario realizar otro registro."
        );
      } else {
        showMessage(
          "error",
          "Ocurrió un error al registrar tu elección. Intenta nuevamente o comunícate con sistemas."
        );
      }

      setFormDisabled(false);
      return;
    }

    // Éxito
    markRegisteredLocal();
    const nombreCompleto = `${nombres} ${apellidos}`;

    showMessage(
      "success",
      "🎉 ¡Registro exitoso! Tu elección ha quedado guardada correctamente."
    );

    // Refrescar visualmente el formulario
    form.reset();
    document
      .querySelectorAll(".option-card.selected")
      .forEach((c) => c.classList.remove("selected"));

    setFormDisabled(true);
    openSuccessModal(nombreCompleto, opcion);
  } catch (err) {
    console.error(err);
    showMessage(
      "error",
      "Ocurrió un error inesperado. Intenta nuevamente o comunícate con sistemas."
    );
    setFormDisabled(false);
  }
});

// 7. Listeners del modal y carga inicial
document.addEventListener("DOMContentLoaded", () => {
  // Ya registrado en este navegador
  if (checkAlreadyRegisteredLocal()) {
    showMessage(
      "success",
      "Ya realizaste tu registro desde este dispositivo."
    );
    setFormDisabled(true);
  }

  // Cierre del modal
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeSuccessModal);
  }

  if (successModal) {
    successModal.addEventListener("click", (e) => {
      if (e.target === successModal) {
        closeSuccessModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSuccessModal();
    }
  });
});
