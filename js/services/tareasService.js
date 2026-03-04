export const procesarTareasParaExportar = (tareas) => {
    return tareas.map(tarea => ({
        id: tarea.id,
        documento_usuario: tarea.documento_usuario,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        estado: tarea.estado || "pendiente"
    }));
};