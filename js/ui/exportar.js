// ============================================
// MÓDULO DE EXPORTACIÓN - RF04
// Exporta las tareas visibles en pantalla a JSON
// ============================================
export const exportarTareasJSON = (tareas) => {
    if (!tareas || tareas.length === 0) return false;

    const datos = procesarTareasParaExportar(tareas);
    const json = JSON.stringify(datos, null, 2);

    const enlace = document.createElement("a");
    enlace.href = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    enlace.download = "tareas.json";
    enlace.click();

    return true;
};