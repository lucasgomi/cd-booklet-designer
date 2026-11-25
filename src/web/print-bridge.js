// Versión web: la página de impresión se abre dentro de un marco y recibe
// los datos de la ventana principal (en escritorio los da Electron).
if (!window.api && window.parent && window.parent !== window && window.parent.__cdbPrintApi) {
  window.api = window.parent.__cdbPrintApi;
}
