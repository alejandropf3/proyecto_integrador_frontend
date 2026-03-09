// Importaciones específicas para usuarios
import { armarCiudades, armarGenero, armarListaUsuarios } from "../js/ui/index.js";
import { validar } from "../js/utils/validarFormulario.js";
import { ciudades, generos, getUsuarios, getUsuarioPorDocumento, crearUsuario, actualizarUsuario, eliminarUsuario } from "../js/api/index.js";

// variables globales (solo para usuarios)
let datosCiudades = [];
let datosGeneros = [];
let usuarioEditandoId = null;

// referencias DOM (solo para usuarios)
const formulario = document.querySelector("#formUsuario");
const documento = document.querySelector("#documento");
const nombre = document.querySelector("#nombre");
const correo = document.querySelector("#correo");
const divGeneros = document.getElementById("generos");
const ciudadId = document.querySelector("#ciudadId");
const btnEnviar = document.querySelector("#btnEnviar");
const listaUsuarios = document.querySelector("#listaUsuarios");
const btnBuscar = document.querySelector("#btnBuscar");
const buscarDocumento = document.querySelector("#buscarDocumento");
const resultadoBusqueda = document.querySelector("#resultadoBusqueda");

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

            const selectorCard = "[data-id='" + usuarioEditandoId + "']";
            const cardExistente = listaUsuarios.querySelector(selectorCard);
            if (cardExistente) {
                const ciudad = datosCiudades.find(c => c.id == datosUsuario.ciudad_id);
                const genero = datosGeneros.find(g => g.id == datosUsuario.genero_id);

                const cardInfo = cardExistente.querySelector(".cardInfo");
                cardInfo.replaceChildren();

                const crearParrafo = (label, valor) => {
                    const p = document.createElement("p");
                    const strong = document.createElement("strong");
                    strong.textContent = label + ":";
                    p.append(strong, " " + (valor || ""));
                    return p;
                };

                cardInfo.append(
                    crearParrafo("Documento", datosUsuario.documento),
                    crearParrafo("Nombre", datosUsuario.nombre),
                    crearParrafo("Genero", genero ? genero.genero : ""),
                    crearParrafo("Ciudad", ciudad ? ciudad.ciudad : ""),
                    crearParrafo("Correo", datosUsuario.correo)
                );
            }
        } else {
            const nuevoUsuario = await crearUsuario(datosUsuario);
            const { armarCardUsuario } = await import("../js/ui/usuarios.js");
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
    const btnEditar = e.target.closest(".btnEditarUsuario");
    if (btnEditar) {
        const id = btnEditar.getAttribute("data-id");
        const usuarios = await getUsuarios();
        const usuario = usuarios.find(u => String(u.id) === String(id));

        if (usuario) {
            cargarFormularioConUsuario(usuario);
            formulario.scrollIntoView({ behavior: "smooth" });
        }
    }

    const btnEliminar = e.target.closest(".btnEliminarUsuario");
    if (btnEliminar) {
        const idEliminar = btnEliminar.getAttribute("data-id");

        if (confirm("¿Está seguro de eliminar este usuario?")) {
            try {
                await eliminarUsuario(idEliminar);
                const selectorEliminar = "[data-id='" + idEliminar + "']";
                const card = listaUsuarios.querySelector(selectorEliminar);
                if (card) card.remove();
            } catch (error) {
                console.error("Error al eliminar usuario:", error);
                alert("No se pudo eliminar el usuario: " + error.message);
            }
        }
    }
});

// Buscar usuario
btnBuscar.addEventListener("click", async () => {
    const docValor = buscarDocumento.value.trim();
    resultadoBusqueda.replaceChildren();

    if (docValor === "") {
        const p = document.createElement("p");
        p.classList.add("msgError");
        p.textContent = "Por favor ingrese un documento";
        resultadoBusqueda.append(p);
        return;
    }

    const resultados = await getUsuarioPorDocumento(docValor);

    if (resultados.length > 0) {
        const u = resultados[0];
        const p = document.createElement("p");
        p.classList.add("msgEncontrado");
        const strong = document.createElement("strong");
        strong.textContent = u.nombre;
        p.append("Usuario encontrado: ", strong, " - Documento: " + u.documento + " - Correo: " + u.correo);
        resultadoBusqueda.append(p);
    } else {
        const p = document.createElement("p");
        p.classList.add("msgNoEncontrado");
        p.textContent = "No se encontro ningun usuario con ese documento";
        resultadoBusqueda.append(p);
    }
});