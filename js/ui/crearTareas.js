// ============================================
// SCRIPT PARA FORMULARIO DE TAREAS
// ============================================

import { armarListaTareas, armarCardTarea, guardarTareasParaFiltro, inicializarFiltros, obtenerTodasLasTareas } from "./tareas.js";
import { notificarExito, notificarError, notificarInfo } from "./notificaciones.js";
import { exportarTareasJSON } from "./exportar.js";
import { getTareas, crearTarea, actualizarTarea, eliminarTarea, getUsuarioPorDocumento, getUsuarios, getTareasById } from "../api/index.js";
import { procesarTareasParaExportar, inicializarOrdenamiento } from "../services/index.js";
import { armarSelectorUsuarios } from "./index.js";

// Variables globales
let tareaEditandoId = null;

// Referencias DOM
const formTarea = document.querySelector("#formTarea");
const tituloTarea = document.querySelector("#tituloTarea");
const descripcionTarea = document.querySelector("#descripcionTarea");
const selectEstadoTarea = document.querySelector("#estadoTarea");
const btnCrearTarea = document.querySelector("#btnCrearTarea");
const listaTareas = document.querySelector("#listaTareas");
const btnExportar = document.querySelector("#btnExportar");
const userSelector = document.querySelector("#userSelector");

// ============================================
// FUNCIONES AUXILIARES
// ============================================

const limpiarFormularioTarea = () => {
    formTarea.reset();
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
        await armarListaTareas(listaTareas, tareas);
        inicializarFiltros(listaTareas);
        await inicializarOrdenamiento(listaTareas, obtenerTodasLasTareas, armarListaTareas);
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

    // Obtener usuarios seleccionados
    const checkboxes = document.querySelectorAll('input[name="usuariosAsignados"]:checked');
    const usuariosAsignados = Array.from(checkboxes).map(cb => cb.value);
    
    const tituloValor = tituloTarea.value.trim();
    const descValor = descripcionTarea.value.trim();
    const estadoValor = selectEstadoTarea ? selectEstadoTarea.value : "pendiente";

    // Limpiar errores visuales
    tituloTarea.classList.remove("error");
    descripcionTarea.classList.remove("error");
    userSelector.classList.remove("error");

    // Validaciones
    if (tituloValor === "") { tituloTarea.classList.add("error"); return; }
    if (descValor === "") { descripcionTarea.classList.add("error"); return; }
    if (usuariosAsignados.length === 0) { 
        userSelector.classList.add("error");
        const msgExistente = formTarea.querySelector(".msgUsuariosTarea");
        if (!msgExistente) {
            const msg = document.createElement("p");
            msg.classList.add("msgNoEncontrado", "msgUsuariosTarea");
            msg.textContent = "Por favor, asigna al menos un usuario a la tarea.";
            userSelector.parentElement.append(msg);
        }
        notificarError("Por favor, asigna al menos un usuario a la tarea.");
        return; 
    }

    const msgAnterior = formTarea.querySelector(".msgUsuariosTarea");
    if (msgAnterior) msgAnterior.remove();

    try {
        if (tareaEditandoId !== null) {
            // ---- EDITAR ----
            const tareaActualizada = {
                titulo: tituloValor,
                descripcion: descValor,
                usuarios_asignados: usuariosAsignados,
                estado: estadoValor
            };

            await actualizarTarea(tareaEditandoId, tareaActualizada);

            const selector = "[data-id='" + tareaEditandoId + "']";
            const cardTarea = listaTareas.querySelector(selector);
            if (cardTarea) {
                // Actualizar título y descripción
                cardTarea.querySelector(".tareaTitulo").textContent = tituloValor;
                cardTarea.querySelector(".tareaDescripcion").textContent = descValor;
                
                // Actualizar estado
                const spanEstado = cardTarea.querySelector(".tareaEstado");
                if (spanEstado) {
                    spanEstado.className = "tareaEstado tareaEstado--" + estadoValor.replace(" ", "-");
                    spanEstado.textContent = estadoValor;
                }
                
                // Actualizar usuarios asignados
                const usuariosInfo = cardTarea.querySelector(".tareaUsuarios");
                if (usuariosInfo) {
                    const usuarios = await getUsuarios();
                    const usuariosSeleccionados = usuarios.filter(u => usuariosAsignados.includes(u.documento));
                    const nombresUsuarios = usuariosSeleccionados.map(u => `${u.nombre} (${u.documento})`).join(", ");
                    usuariosInfo.innerHTML = `<strong>Usuarios:</strong> ${nombresUsuarios}`;
                }
            }

            await actualizarTareasEnSistema();
            tareaEditandoId = null;
            btnCrearTarea.textContent = "Crear Tarea";
            notificarExito("Tarea actualizada correctamente");

        } else {
            // ---- CREAR ----
            const nuevaTarea = {
                usuarios_asignados: usuariosAsignados,
                titulo: tituloValor,
                descripcion: descValor,
                estado: estadoValor
            };

            const tareaCreada = await crearTarea(nuevaTarea);

            const msgVacio = listaTareas.querySelector(".msgNoTareas");
            if (msgVacio) msgVacio.remove();

            const cardNueva = await armarCardTarea(tareaCreada);
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
                usuarios_asignados: usuariosAsignados,
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
            // Obtener la tarea actual para saber qué usuarios están asignados
            try {
                const tareaActual = await getTareasById(id);
                
                // Cargar datos básicos
                tituloTarea.value = card.querySelector(".tareaTitulo").textContent;
                descripcionTarea.value = card.querySelector(".tareaDescripcion").textContent;
                const spanEstado = card.querySelector(".tareaEstado");
                if (selectEstadoTarea && spanEstado) selectEstadoTarea.value = spanEstado.textContent;
                
                // Marcar los checkboxes de los usuarios asignados
                const checkboxes = document.querySelectorAll('input[name="usuariosAsignados"]');
                checkboxes.forEach(cb => {
                    cb.checked = tareaActual.usuarios_asignados && tareaActual.usuarios_asignados.includes(cb.value);
                });
                
                tareaEditandoId = id;
                btnCrearTarea.textContent = "Actualizar Tarea";
                formTarea.scrollIntoView({ behavior: "smooth" });
                
            } catch (error) {
                console.error("Error al cargar datos de la tarea para editar:", error);
                notificarError("Error al cargar los datos de la tarea");
            }
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
    try {
        // 1. Obtener usuarios desde el API
        const usuarios = await getUsuarios();
        // 2. Armar el selector dinámico
        armarSelectorUsuarios(userSelector, usuarios);
        
    } catch (error) {
        console.error("Error al cargar usuarios para el selector:", error);
        userSelector.innerHTML = '<p class="error">Error al cargar usuarios</p>';
    }
});