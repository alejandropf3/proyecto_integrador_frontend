// ============================================
// SCRIPT PARA FORMULARIO DE TAREAS
// ============================================

import { armarListaTareas, armarCardTarea, guardarTareasParaFiltro, inicializarFiltros, obtenerTodasLasTareas } from "./tareas.js";
import { notificarExito, notificarError, notificarInfo } from "./notificaciones.js";
import { exportarTareasJSON } from "./exportar.js";
import { getTareas, crearTarea, actualizarTarea, eliminarTarea, getUsuarioPorDocumento } from "../api/index.js";
import { procesarTareasParaExportar, inicializarOrdenamiento } from "../services/index.js";

// Variables globales
let tareaEditandoId = null;

// Referencias DOM
const formTarea = document.querySelector("#formTarea");
const docTarea = document.querySelector("#docTarea");
const tituloTarea = document.querySelector("#tituloTarea");
const descripcionTarea = document.querySelector("#descripcionTarea");
const selectEstadoTarea = document.querySelector("#estadoTarea");
const btnCrearTarea = document.querySelector("#btnCrearTarea");
const listaTareas = document.querySelector("#listaTareas");
const btnExportar = document.querySelector("#btnExportar");

// ============================================
// FUNCIONES AUXILIARES
// ============================================

const limpiarFormularioTarea = () => {
    formTarea.reset();
    docTarea.disabled = false;
    tareaEditandoId = null;
    btnCrearTarea.textContent = "Crear Tarea";
};

const actualizarTareasEnSistema = async () => {
    const tareas = await getTareas();
    guardarTareasParaFiltro(tareas);
};

const cargarTareasEnLista = async () => {
    try {
        const tareas = await getTareas();
        guardarTareasParaFiltro(tareas);
        armarListaTareas(listaTareas, tareas);
        inicializarFiltros(listaTareas);
        inicializarOrdenamiento(listaTareas, obtenerTodasLasTareas, armarListaTareas);
    } catch (error) {
        console.error("Error al cargar tareas:", error);
        notificarError("Error al cargar las tareas");
    }
};

// ============================================
// SUBMIT FORMULARIO - CREAR O EDITAR TAREA
// ============================================

formTarea.addEventListener("submit", async (e) => {
    e.preventDefault();

    const docValor = docTarea.value.trim();
    const tituloValor = tituloTarea.value.trim();
    const descValor = descripcionTarea.value.trim();
    const estadoValor = selectEstadoTarea ? selectEstadoTarea.value : "pendiente";

    // Limpiar errores visuales
    docTarea.classList.remove("error");
    tituloTarea.classList.remove("error");
    descripcionTarea.classList.remove("error");

    // Validaciones
    if (docValor === "") { docTarea.classList.add("error"); return; }
    if (tituloValor === "") { tituloTarea.classList.add("error"); return; }
    if (descValor === "") { descripcionTarea.classList.add("error"); return; }

    // Verificar que el usuario exista
    const resultados = await getUsuarioPorDocumento(docValor);
    if (resultados.length === 0) {
        docTarea.classList.add("error");
        const msgExistente = formTarea.querySelector(".msgDocTarea");
        if (!msgExistente) {
            const msg = document.createElement("p");
            msg.classList.add("msgNoEncontrado", "msgDocTarea");
            msg.textContent = "No existe un usuario con ese documento";
            docTarea.parentElement.append(msg);
        }
        notificarError("No existe un usuario con ese documento");
        return;
    }

    const msgAnterior = formTarea.querySelector(".msgDocTarea");
    if (msgAnterior) msgAnterior.remove();

    try {
        if (tareaEditandoId !== null) {
            // ---- EDITAR ----
            const tareaActualizada = {
                titulo: tituloValor,
                descripcion: descValor,
                documento_usuario: docValor,
                estado: estadoValor
            };

            await actualizarTarea(tareaEditandoId, tareaActualizada);

            const selector = "[data-id='" + tareaEditandoId + "']";
            const cardTarea = listaTareas.querySelector(selector);
            if (cardTarea) {
                const pDoc = cardTarea.querySelector(".tareaInfo p:first-child");
                pDoc.replaceChildren();
                const strong = document.createElement("strong");
                strong.textContent = "Documento:";
                pDoc.append(strong, " " + docValor);
                cardTarea.querySelector(".tareaTitulo").textContent = tituloValor;
                cardTarea.querySelector(".tareaDescripcion").textContent = descValor;
                const spanEstado = cardTarea.querySelector(".tareaEstado");
                if (spanEstado) {
                    spanEstado.className = "tareaEstado tareaEstado--" + estadoValor.replace(" ", "-");
                    spanEstado.textContent = estadoValor;
                }
            }

            await actualizarTareasEnSistema();
            tareaEditandoId = null;
            btnCrearTarea.textContent = "Crear Tarea";
            notificarExito("Tarea actualizada correctamente");

        } else {
            // ---- CREAR ----
            const nuevaTarea = {
                documento_usuario: docValor,
                titulo: tituloValor,
                descripcion: descValor,
                estado: estadoValor
            };

            const tareaCreada = await crearTarea(nuevaTarea);

            const msgVacio = listaTareas.querySelector(".msgNoTareas");
            if (msgVacio) msgVacio.remove();

            const cardNueva = armarCardTarea(tareaCreada);
            listaTareas.append(cardNueva);

            await actualizarTareasEnSistema();
            notificarExito("Tarea creada correctamente");
        }

        limpiarFormularioTarea();

    } catch (error) {
        console.error("Error al guardar tarea:", error);
        console.error("Detalles del error:", {
            message: error.message,
            stack: error.stack,
            tipoOperacion: tareaEditandoId !== null ? "EDITAR" : "CREAR",
            datos: {
                documento: docValor,
                titulo: tituloValor,
                descripcion: descValor,
                estado: estadoValor
            }
        });
        
        // Mostrar error más específico al usuario
        if (error.message.includes("CORS") || error.message.includes("fetch")) {
            notificarError("Error de conexión: Verifica que el servidor backend esté corriendo en http://localhost:3000");
        } else if (error.message.includes("404")) {
            notificarError("Error: El servidor no encontró el recurso. Verifica la configuración del backend.");
        } else if (error.message.includes("500")) {
            notificarError("Error interno del servidor. Intenta nuevamente.");
        } else {
            notificarError("Hubo un error al guardar la tarea: " + error.message);
        }
    }
});

// ============================================
// DELEGACION DE EVENTOS - EDITAR / ELIMINAR
// ============================================

listaTareas.addEventListener("click", async (e) => {

    // ---- EDITAR ----
    const btnEditar = e.target.closest(".btnEditarTarea");
    if (btnEditar) {
        const id = btnEditar.getAttribute("data-id");
        const card = listaTareas.querySelector("[data-id='" + id + "']");

        if (card) {
            docTarea.value = card.querySelector(".tareaInfo p:first-child").textContent.replace("Documento:", "").trim();
            tituloTarea.value = card.querySelector(".tareaTitulo").textContent;
            descripcionTarea.value = card.querySelector(".tareaDescripcion").textContent;
            const spanEstado = card.querySelector(".tareaEstado");
            if (selectEstadoTarea && spanEstado) selectEstadoTarea.value = spanEstado.textContent;
            docTarea.disabled = true;
            tareaEditandoId = id;
            btnCrearTarea.textContent = "Actualizar Tarea";
            formTarea.scrollIntoView({ behavior: "smooth" });
        }
    }

    // ---- ELIMINAR ----
    const btnEliminar = e.target.closest(".btnEliminarTarea");
    if (btnEliminar) {
        const idEliminar = btnEliminar.getAttribute("data-id");
        if (confirm("¿Está seguro de eliminar esta tarea?")) {
            try {
                await eliminarTarea(idEliminar);
                const cardEliminar = listaTareas.querySelector("[data-id='" + idEliminar + "']");
                if (cardEliminar) cardEliminar.remove();

                const cardsRestantes = listaTareas.querySelectorAll(".cardTarea");
                if (cardsRestantes.length === 0) {
                    const msg = document.createElement("p");
                    msg.classList.add("msgNoTareas");
                    msg.textContent = "No hay tareas para mostrar.";
                    listaTareas.append(msg);
                }

                await actualizarTareasEnSistema();
                notificarExito("Tarea eliminada correctamente");

            } catch (error) {
                console.error("Error al eliminar tarea:", error);
                notificarError("No se pudo eliminar la tarea: " + error.message);
            }
        }
    }
});

// ============================================
// EXPORTAR - RF04
// ============================================

if (btnExportar) {
    btnExportar.addEventListener("click", () => {
        const tareas = obtenerTodasLasTareas();
        const procesado = procesarTareasParaExportar(tareas);
        const exportado = exportarTareasJSON(procesado);
        if (exportado) {
            notificarExito("Tareas exportadas correctamente");
        } else {
            notificarInfo("No hay tareas para exportar");
        }
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
    await cargarTareasEnLista();
});