export const armarCardUsuario = (usuario, ciudadesData, generosData) => {
  const card = document.createElement('div');
  card.classList.add('cardUsuario');
  card.setAttribute('data-id', usuario.id);

  const ciudad = ciudadesData.find(function (c) { return c.id == usuario.ciudad_id; });
  const genero = generosData.find(function (g) { return g.id == usuario.genero_id; });

  const cardInfo = document.createElement('div');
  cardInfo.classList.add('cardInfo');

  const crearParrafo = (label, valor) => {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = label + ':';
    p.append(strong, ' ' + (valor || ''));
    return p;
  };

  cardInfo.append(
    crearParrafo('Documento', usuario.documento),
    crearParrafo('Nombre', usuario.nombre),
    crearParrafo('Genero', genero ? genero.genero : ''),
    crearParrafo('Ciudad', ciudad ? ciudad.ciudad : ''),
    crearParrafo('Correo', usuario.correo)
  );

  const cardAcciones = document.createElement('div');
  cardAcciones.classList.add('cardAcciones');

  const btnEditar = document.createElement('button');
  btnEditar.classList.add('btn', 'btnEditarUsuario');
  btnEditar.setAttribute('data-id', usuario.id);
  btnEditar.textContent = 'Editar';

  const btnEliminar = document.createElement('button');
  btnEliminar.classList.add('btn', 'btnEliminarUsuario');
  btnEliminar.setAttribute('data-id', usuario.id);
  btnEliminar.textContent = 'Eliminar';

  cardAcciones.append(btnEditar, btnEliminar);
  card.append(cardInfo, cardAcciones);

  return card;
};

export const armarListaUsuarios = (contenedor, usuarios, ciudadesData, generosData) => {
  contenedor.replaceChildren();
  const fragmento = document.createDocumentFragment();
  usuarios.forEach(usuario => {
    const card = armarCardUsuario(usuario, ciudadesData, generosData);
    fragmento.append(card);
  });
  contenedor.append(fragmento);
};

export const armarSelectorUsuarios = (contenedor, usuarios) => {
    contenedor.replaceChildren(); // Limpia el contenedor (p.ej. el mensaje de "Cargando...")
    
    if (usuarios.length === 0) {
        contenedor.innerHTML = '<p class="formLabel">No hay usuarios registrados</p>';
        return;
    }

    const fragmento = document.createDocumentFragment();

    usuarios.forEach(usuario => {
        const div = document.createElement('div');
        div.classList.add('userOption');
        
        // Estructura interna: checkbox + label
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'usuariosAsignados';
        checkbox.id = `user_${usuario.documento}`;
        checkbox.value = usuario.documento;
        checkbox.classList.add('userCheckbox');

        const label = document.createElement('label');
        label.setAttribute('for', `user_${usuario.documento}`);
        label.textContent = `${usuario.nombre} (${usuario.documento})`;
        label.classList.add('userLabel');

        div.append(checkbox, label);
        fragmento.append(div);
    });

    contenedor.append(fragmento);
};

