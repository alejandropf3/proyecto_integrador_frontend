export const generos = async () => {
  const solicitud = await fetch('http://localhost:3000/generos');
  const datos = await solicitud.json();
  return datos;
}