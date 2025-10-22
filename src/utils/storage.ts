// Utilidades para almacenamiento local
// Almacenar usuario en localStorage
export const storeUser = (user: any) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};
// Obtener usuario almacenado
export const getStoredUser = async () => {
  const userJson = localStorage.getItem('user');
  if (userJson) {
    return JSON.parse(userJson);
  }
  return null;
};
// Función para inicializar IndexedDB
export const initializeDB = async () => {
  // Aquí se implementaría la inicialización de IndexedDB
  // para almacenamiento offline-first
  console.log('Inicializando base de datos local');
};
// Funciones para almacenamiento offline-first
// (se implementarían con idb o localforage)