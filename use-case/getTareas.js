export const getTareas = async () => {
  const solicitud = await fetch('http://localhost:3000/tareas');
  const datos = await solicitud.json();
  return datos;
};

export const getTareasById = async (id) => {
  const solicitud = await fetch(`http://localhost:3000/tareas/${id}`);
  if (!solicitud.ok) throw new Error("Status " + solicitud.status + ": No se pudo obtener la tarea (ID: " + id + ")");
  const datos = await solicitud.json();
  return datos;
};

export const crearTarea = async (tarea) => {
  // Obtenemos todas las tareas para calcular el siguiente ID numerico
  const todas = await getTareas();
  const maxId = todas.reduce((max, t) => {
    const idNum = parseInt(t.id);
    return isNaN(idNum) ? max : Math.max(max, idNum);
  }, 0);

  tarea.id = maxId + 1;

  const solicitud = await fetch('http://localhost:3000/tareas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tarea)
  });
  if (!solicitud.ok) throw new Error("Status " + solicitud.status + ": No se pudo crear la tarea");
  const datos = await solicitud.json();
  return datos;
};

export const actualizarTarea = async (id, tarea) => {
  const idNum = Number(id);
  const solicitud = await fetch('http://localhost:3000/tareas/' + idNum, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...tarea, id: idNum })
  });
  if (!solicitud.ok) throw new Error("Status " + solicitud.status + ": No se pudo actualizar la tarea (ID: " + idNum + ")");
  const datos = await solicitud.json();
  return datos;
};

export const eliminarTarea = async (id) => {
  const idNum = Number(id);
  const solicitud = await fetch('http://localhost:3000/tareas/' + idNum, {
    method: 'DELETE'
  });
  if (!solicitud.ok) throw new Error("Status " + solicitud.status + ": No se pudo eliminar la tarea (ID: " + id + ")");

  // Dependiendo de si la API devuelve contenido o no en DELETE:
  if (solicitud.status === 204) return { success: true };
  const datos = await solicitud.json();
  return datos;
};
