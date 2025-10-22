import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PackageIcon, AlertCircleIcon, CheckIcon, PlusIcon, EditIcon } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
// Tipo para inventario
type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
  lastUpdated: string;
  warehouse: string;
};
// Datos de ejemplo para inventario
const mockInventory: InventoryItem[] = [{
  id: 'inv-1',
  name: 'Carne para hamburguesa',
  stock: 25,
  unit: 'unidades',
  minStock: 10,
  lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  warehouse: 'Principal'
}, {
  id: 'inv-2',
  name: 'Queso cheddar',
  stock: 8,
  unit: 'kg',
  minStock: 5,
  lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  warehouse: 'Principal'
}, {
  id: 'inv-3',
  name: 'Cerveza artesanal',
  stock: 30,
  unit: 'botellas',
  minStock: 15,
  lastUpdated: new Date().toISOString(),
  warehouse: 'Bodega bebidas'
}, {
  id: 'inv-4',
  name: 'Papas congeladas',
  stock: 4,
  unit: 'bolsas',
  minStock: 5,
  lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  warehouse: 'Congelador'
}, {
  id: 'inv-5',
  name: 'Vino tinto',
  stock: 12,
  unit: 'botellas',
  minStock: 6,
  lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  warehouse: 'Cava'
}];
const InventoryPage = () => {
  const {
    showToast
  } = useToast();
  const {
    softBtn,
    ctaGrad
  } = useOutletContext<any>();
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'normal'>('all');
  // Filtrar inventario
  const filteredInventory = inventory.filter(item => {
    if (inventoryFilter === 'all') return true;
    if (inventoryFilter === 'low') return item.stock <= item.minStock;
    return item.stock > item.minStock;
  });
  return <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 via-violet-50 to-pink-50 p-4 rounded-3xl shadow-sm border border-white/60">
        <div className="bg-white/60 p-3 rounded-2xl">
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
          <p className="text-sm text-gray-600">Control de stock y productos</p>
        </div>
      </div>
      {/* Filtros y acciones */}
      <div className="flex justify-between mb-4">
        <div className="flex space-x-2">
          <button className={softBtn(inventoryFilter === 'all' ? 'blue' : 'gray')} onClick={() => setInventoryFilter('all')}>
            Todos
          </button>
          <button className={softBtn(inventoryFilter === 'low' ? 'amber' : 'gray')} onClick={() => setInventoryFilter('low')}>
            <AlertCircleIcon size={14} className="mr-1" /> Stock bajo
          </button>
          <button className={softBtn(inventoryFilter === 'normal' ? 'green' : 'gray')} onClick={() => setInventoryFilter('normal')}>
            <CheckIcon size={14} className="mr-1" /> Stock normal
          </button>
        </div>
        <button className={ctaGrad()} onClick={() => showToast('info', 'Función en desarrollo')}>
          <PlusIcon size={16} className="mr-1" />
          Nuevo producto
        </button>
      </div>
      {/* Tabla de inventario */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bodega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última actualización
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map(item => <tr key={item.id} className={item.stock <= item.minStock ? 'bg-amber-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${item.stock <= item.minStock ? 'text-amber-700' : 'text-gray-900'}`}>
                      {item.stock}
                      {item.stock <= item.minStock && <span className="ml-2 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                          Stock bajo
                        </span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.warehouse}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.lastUpdated).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className={softBtn('blue')} onClick={() => showToast('info', 'Función en desarrollo')}>
                      <EditIcon size={14} className="mr-1" />
                      Editar
                    </button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        {filteredInventory.length === 0 && <div className="text-center py-8">
            <PackageIcon size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">
              No hay productos de inventario que coincidan con el filtro
            </p>
          </div>}
      </div>
    </div>;
};
export default InventoryPage;