// Importaciones
import { armarCiudades, armarGenero, armarListaUsuarios, armarListaTareas, armarCardTarea } from "./components/index.js";
import { validar } from "./helpers/validarFormulario.js";
import { ciudades, generos, getUsuarios, getUsuarioPorDocumento, crearUsuario, actualizarUsuario, eliminarUsuario, getTareas, crearTarea, actualizarTarea, eliminarTarea, getTareasById } from "./use-case/index.js";

// variables globales
let datosCiudades = [];
let datosGeneros = [];
let usuarioEditandoId = null;
let tareaEditandoId = null;

// referencias DOM
const formulario = document.querySelector("#formUsuario");
const documento = document.querySelector("#documento");
const nombre = document.querySelector("#nombre");
const correo = document.querySelector("#correo");
const divGeneros = document.getElementById("generos");
const ciudadId = document.querySelector("#ciudadId");
const btnEnviar = document.querySelector("#btnEnviar");
const listaUsuarios = document.querySelector("#listaUsuarios");

const buscarDocumento = document.querySelector("#buscarDocumento");
const btnBuscar = document.querySelector("#btnBuscar");
const resultadoBusqueda = document.querySelector("#resultadoBusqueda");

const formTarea = document.querySelector("#formTarea");
const docTarea = document.querySelector("#docTarea");
const tituloTarea = document.querySelector("#tituloTarea");
const descripcionTarea = document.querySelector("#descripcionTarea");
const btnCrearTarea = document.querySelector("#btnCrearTarea");
const listaTareas = document.querySelector("#listaTareas");

const vistaUsuarios = document.querySelector("#vistaUsuarios");
const vistaTareas = document.querySelector("#vistaTareas");
const btnIrTareas = document.querySelector("#btnIrTareas");
const btnIrUsuarios = document.querySelector("#btnIrUsuarios");

const reglas = {
    documento: { required: true, min: 8, max: 10, mensaje: "El campo es obligatorio" },
    nombre: { required: true, mensaje: "El campo es obligatorio" },
    genero: { required: true, mensaje: "Por favor, seleccione su genero" },
    ciudad: { required: true },
    correo: { required: true, mensaje: "El campo es obligatorio" }
};

// funciones auxiliares
const limpiarErrores = () => {
    documento.classList.remove("error");
    nombre.classList.remove("error");
    correo.classList.remove("error");
};

const mostrarErrores = (errores) => {
    if (errores.documento) documento.classList.add("error");
    if (errores.nombre) nombre.classList.add("error");
    if (errores.correo) correo.classList.add("error");
};

const limpiarFormularioUsuario = () => {
    formulario.reset();
    usuarioEditandoId = null;
    btnEnviar.textContent = "Enviar";
    limpiarErrores();
};

const cargarUsuariosEnLista = async () => {
    const usuarios = await getUsuarios();
    armarListaUsuarios(listaUsuarios, usuarios, datosCiudades, datosGeneros);
};

const cargarTareasEnLista = async () => {
    const tareas = await getTareas();
    armarListaTareas(listaTareas, tareas);
};

const cargarFormularioConUsuario = (usuario) => {
    documento.value = usuario.documento;
    nombre.value = usuario.nombre;
    correo.value = usuario.correo;
    ciudadId.value = usuario.ciudad_id;

    const radios = document.querySelectorAll("input[name='genero']");
    radios.forEach((radio) => {
        if (Number(radio.value) === usuario.genero_id) {
            radio.checked = true;
        }
    });

    usuarioEditandoId = usuario.id;
    btnEnviar.textContent = "Actualizar";
};

// Evento DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
    datosCiudades = await ciudades();
    datosGeneros = await generos();
    armarGenero(divGeneros, datosGeneros);
    armarCiudades(ciudadId, datosCiudades);
    await cargarUsuariosEnLista();
    await cargarTareasEnLista();
});

// Navegacion entre vistas
btnIrTareas.addEventListener("click", () => {
    vistaUsuarios.classList.add("oculto");
    vistaTareas.classList.remove("oculto");
});

btnIrUsuarios.addEventListener("click", () => {
    vistaTareas.classList.add("oculto");
    vistaUsuarios.classList.remove("oculto");
});

// Submit formulario usuario (crear o actualizar)
formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    limpiarErrores();
    const respuesta = validar(e.target, reglas);

    if (!respuesta.valido) {
        mostrarErrores(respuesta.errores);
        return;
    }

    const generoSeleccionado = document.querySelector("input[name='genero']:checked");
    if (!generoSeleccionado) {
        alert("Por favor seleccione un genero");
        return;
    }

    const datosUsuario = {
        documento: documento.value.trim(),
        nombre: nombre.value.trim(),
        genero_id: Number(generoSeleccionado.value),
        ciudad_id: Number(ciudadId.value),
        correo: correo.value.trim()
    };

    try {
        if (usuarioEditandoId !== null) {
            await actualizarUsuario(usuarioEditandoId, datosUsuario);

            // Actualizar card existente sin recargar ni crear nueva
            const cardExistente = listaUsuarios.querySelector(`[data-id='${usuarioEditandoId}']`);
            if (cardExistente) {
                const ciudad = datosCiudades.find(c => c.id == datosUsuario.ciudad_id);
                const genero = datosGeneros.find(g => g.id == datosUsuario.genero_id);

                const cardInfo = cardExistente.querySelector(".card-info");
                cardInfo.replaceChildren();

                const crearParrafo = (label, valor) => {
                    const p = document.createElement('p');
                    const strong = document.createElement('strong');
                    strong.textContent = `${label}:`;
                    p.append(strong, ` ${valor || ''}`);
                    return p;
                };

                cardInfo.append(
                    crearParrafo('Documento', datosUsuario.documento),
                    crearParrafo('Nombre', datosUsuario.nombre),
                    crearParrafo('Genero', genero ? genero.genero : ''),
                    crearParrafo('Ciudad', ciudad ? ciudad.ciudad : ''),
                    crearParrafo('Correo', datosUsuario.correo)
                );
            }
        } else {
            const nuevoUsuario = await crearUsuario(datosUsuario);
            // Agregar la nueva card dinamicamente
            const { armarCardUsuario } = await import("./components/usuarios.js");
            const card = armarCardUsuario(nuevoUsuario, datosCiudades, datosGeneros);
            listaUsuarios.append(card);
        }

        limpiarFormularioUsuario();
    } catch (error) {
        console.error("Error al guardar usuario:", error);
        alert("Hubo un error al guardar el usuario: " + error.message);
    }
});

// Delegacion de eventos en lista de usuarios
listaUsuarios.addEventListener("click", async (e) => {
    const btnEditar = e.target.closest(".btn-editar-usuario");
    if (btnEditar) {
        const id = btnEditar.getAttribute("data-id");
        const usuarios = await getUsuarios();
        const usuario = usuarios.find(u => String(u.id) === String(id));

        if (usuario) {
            cargarFormularioConUsuario(usuario);
            formulario.scrollIntoView({ behavior: "smooth" });
        }
    }

    const btnEliminar = e.target.closest(".btn-eliminar-usuario");

    if (btnEliminar) {

        const idEliminar = btnEliminar.getAttribute("data-id");

        if (confirm("¿Está seguro de eliminar este usuario?")) {
            try {
                await eliminarUsuario(idEliminar);
                const card = listaUsuarios.querySelector(`[data-id='${idEliminar}']`);

                if (card) card.remove();
            } catch (error) {
                console.error("Error al eliminar usuario:", error);
                alert(`No se pudo eliminar el usuario: ${error.message}`);
            }
        }
    }
});

// Buscar usuario
btnBuscar.addEventListener("click", async () => {
    const docValor = buscarDocumento.value.trim();
    resultadoBusqueda.replaceChildren();


    if (docValor === "") {
        const p = document.createElement('p');
        p.classList.add('msg-error');
        p.textContent = 'Por favor ingrese un documento';
        resultadoBusqueda.append(p);
        return;
    }

    const resultados = await getUsuarioPorDocumento(docValor);

    if (resultados.length > 0) {
        const u = resultados[0];
        const p = document.createElement('p');
        p.classList.add('msg-encontrado');
        const strong = document.createElement('strong');
        strong.textContent = u.nombre;
        p.append('Usuario encontrado: ', strong, ` - Documento: ${u.documento} - Correo: ${u.correo}`);
        resultadoBusqueda.append(p);
    } else {
        const p = document.createElement('p');
        p.classList.add('msg-no-encontrado');
        p.textContent = 'No se encontro ningun usuario con ese documento';
        resultadoBusqueda.append(p);
    }
});

// Submit formulario tareas
formTarea.addEventListener("submit", async (e) => {
    e.preventDefault();

    const docValor = docTarea.value.trim();
    const tituloValor = tituloTarea.value.trim();
    const descValor = descripcionTarea.value.trim();

    docTarea.classList.remove("error");
    tituloTarea.classList.remove("error");
    descripcionTarea.classList.remove("error");

    if (docValor === "") {
        docTarea.classList.add("error");
        return;
    }

    if (tituloValor === "") {
        tituloTarea.classList.add("error");
        return;
    }

    if (descValor === "") {
        descripcionTarea.classList.add("error");
        return;
    }

    const resultados = await getUsuarioPorDocumento(docValor);

    if (resultados.length === 0) {
        docTarea.classList.add("error");
        const msgExistente = formTarea.querySelector(".msg-doc-tarea");
        if (!msgExistente) {
            const msg = document.createElement("p");
            msg.classList.add("msg-no-encontrado", "msg-doc-tarea");
            msg.textContent = "No existe un usuario con ese documento";
            docTarea.parentElement.append(msg);
        }
        return;
    }

    const msgAnterior = formTarea.querySelector(".msg-doc-tarea");

    if (msgAnterior) msgAnterior.remove();

    try {
        if (tareaEditandoId !== null) {
            // Al editar no se cambia el usuario, solo titulo y descripcion
            const tareaActualizada = {
                titulo: tituloValor,
                descripcion: descValor,
                documento_usuario: docValor
            };

            await actualizarTarea(tareaEditandoId, tareaActualizada);

            const cardTarea = listaTareas.querySelector(`[data-id='${tareaEditandoId}']`);
            if (cardTarea) {
                const pDoc = cardTarea.querySelector(".tarea-info p:first-child");
                pDoc.replaceChildren();
                const strong = document.createElement('strong');
                strong.textContent = 'Documento:';
                pDoc.append(strong, ` ${docValor}`);

                cardTarea.querySelector(".tarea-titulo").textContent = tituloValor;
                cardTarea.querySelector(".tarea-descripcion").textContent = descValor;
            }

            tareaEditandoId = null;
            btnCrearTarea.textContent = "Crear Tarea";
        } else {
            const nuevaTarea = {
                documento_usuario: docValor,
                titulo: tituloValor,
                descripcion: descValor
            };

            const tareaCreada = await crearTarea(nuevaTarea);
            const { armarCardTarea: buildCard } = await import("./components/tareas.js");
            const cardNueva = buildCard(tareaCreada);
            listaTareas.append(cardNueva);
        }

        formTarea.reset();
        docTarea.disabled = false;

    } catch (error) {
        console.error("Error al guardar tarea:", error);
        alert(`Hubo un error al guardar la tarea: ${error.message}`);
    }
});

// Delegacion de eventos en lista de tareas
listaTareas.addEventListener("click", async (e) => {
    const btnEditar = e.target.closest(".btn-editar-tarea");
    if (btnEditar) {
        const id = btnEditar.getAttribute("data-id");
        const card = listaTareas.querySelector(`[data-id='${id}']`);

        if (card) {
            const tituloTexto = card.querySelector(".tarea-titulo").textContent;
            const descTexto = card.querySelector(".tarea-descripcion").textContent;
            const docElemento = card.querySelector(".tarea-info p:first-child");
            const docTexto = docElemento.textContent.replace("Documento:", "").trim();

            docTarea.value = docTexto;
            tituloTarea.value = tituloTexto;
            descripcionTarea.value = descTexto;
            docTarea.disabled = true;

            tareaEditandoId = id;
            btnCrearTarea.textContent = "Actualizar Tarea";
            formTarea.scrollIntoView({ behavior: "smooth" });
        }
    }

    const btnEliminar = e.target.closest(".btn-eliminar-tarea");
    if (btnEliminar) {
        const idEliminar = btnEliminar.getAttribute("data-id");
        if (confirm("¿Está seguro de eliminar esta tarea?")) {
            try {
                await eliminarTarea(idEliminar);
                const cardEliminar = listaTareas.querySelector(`[data-id='${idEliminar}']`);
                if (cardEliminar) cardEliminar.remove();
            } catch (error) {
                console.error("Error al eliminar tarea:", error);
                alert(`No se pudo eliminar la tarea: ${error.message}`);
            }
        }
    }
});
