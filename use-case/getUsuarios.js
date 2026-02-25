export const getUsuarios = async () => {
  const solicitud = await fetch('http://localhost:3000/usuarios');
  const datos = await solicitud.json();
  return datos;
};

export const getUsuarioPorDocumento = async (documento) => {
  const docLimpio = documento.trim();
  const todos = await getUsuarios();
  return todos.filter(u => String(u.documento).trim() === docLimpio);
};

export const crearUsuario = async (usuario) => {
  // Obtenemos todos los usuarios para calcular el siguiente ID numerico
  const todos = await getUsuarios();
  const maxId = todos.reduce((max, u) => {
    const idNum = parseInt(u.id);
    return isNaN(idNum) ? max : Math.max(max, idNum);
  }, 0);

  usuario.id = (maxId + 1).toString();

  const solicitud = await fetch('http://localhost:3000/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario)
  });
  const datos = await solicitud.json();
  return datos;
};

export const actualizarUsuario = async (id, usuario) => {
  const idNum = Number(id);
  const solicitud = await fetch('http://localhost:3000/usuarios/' + idNum, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...usuario, id: idNum })
  });
  if (!solicitud.ok) throw new Error("Status " + solicitud.status + ": No se pudo actualizar el usuario (ID: " + idNum + ")");
  const datos = await solicitud.json();
  return datos;
};

export const eliminarUsuario = async (id) => {
  const idNum = Number(id);
  
  const solicitud = await fetch('http://localhost:3000/usuarios/' + idNum, {
    method: 'DELETE'
  });

  if (!solicitud.ok) throw new Error("Status " + solicitud.status + ": No se pudo eliminar el usuario (ID: " + idNum + ")");
  const datos = await solicitud.json();
  return datos;
};
