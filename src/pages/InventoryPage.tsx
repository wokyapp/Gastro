import React, { useEffect, useState, useRef, createElement } from 'react';
import { useToast } from '../contexts/ToastContext';
import { PackageIcon, SearchIcon, FilterIcon, PlusIcon, MinusIcon, ScanIcon, DownloadIcon, ArrowUpIcon, ArrowDownIcon, UploadIcon, EditIcon, PenIcon, CheckIcon, XIcon, AlertTriangleIcon, ClipboardIcon, FileTextIcon, TabletIcon, TagIcon, FolderIcon, ArchiveIcon, PlusCircleIcon, ListIcon, LayoutGridIcon, MoreHorizontalIcon, Trash2Icon } from 'lucide-react';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { mockProducts, mockInventoryMovements, mockCategories } from '../utils/mockData';
// Tipos
interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}
interface Product {
  id: string;
  barcode?: string;
  sku?: string;
  name: string;
  price: number;
  taxRate: number;
  taxRequired?: boolean;
  stock: number;
  unit: string;
  category?: string;
  categoryId?: string;
  active?: boolean;
  lastUpdated?: string;
  image?: string;
}
// Productos con stock bajo para mostrar cuando se aplica el filtro
const lowStockProducts: Product[] = [{
  id: 'low-1',
  name: 'Café Molido Premium',
  barcode: '7701234567890',
  sku: 'CAF-001',
  price: 12500,
  taxRate: 0.19,
  stock: 3,
  unit: 'un',
  category: 'Bebidas',
  categoryId: '1',
  active: true,
  lastUpdated: new Date().toISOString()
}, {
  id: 'low-2',
  name: 'Azúcar Refinada',
  barcode: '7701234567891',
  sku: 'AZU-002',
  price: 4800,
  taxRate: 0.19,
  stock: 4,
  unit: 'kg',
  category: 'Abarrotes',
  categoryId: '2',
  active: true,
  lastUpdated: new Date().toISOString()
}, {
  id: 'low-3',
  name: 'Leche Deslactosada',
  barcode: '7701234567892',
  sku: 'LEC-003',
  price: 3900,
  taxRate: 0.05,
  stock: 2,
  unit: 'l',
  category: 'Lácteos',
  categoryId: '3',
  active: true,
  lastUpdated: new Date().toISOString()
}, {
  id: 'low-4',
  name: 'Pan Integral',
  barcode: '7701234567893',
  sku: 'PAN-004',
  price: 5600,
  taxRate: 0.19,
  stock: 1,
  unit: 'un',
  category: 'Panadería',
  categoryId: '4',
  active: true,
  lastUpdated: new Date().toISOString()
}, {
  id: 'low-5',
  name: 'Detergente Líquido',
  barcode: '7701234567894',
  sku: 'DET-005',
  price: 18900,
  taxRate: 0.19,
  stock: 3,
  unit: 'un',
  category: 'Limpieza',
  categoryId: '5',
  active: true,
  lastUpdated: new Date().toISOString()
}, {
  id: 'low-6',
  name: 'Papel Higiénico',
  barcode: '7701234567895',
  sku: 'PAP-006',
  price: 12400,
  taxRate: 0.19,
  stock: 4,
  unit: 'pq',
  category: 'Hogar',
  categoryId: '6',
  active: true,
  lastUpdated: new Date().toISOString()
}, {
  id: 'low-7',
  name: 'Galletas Saladas',
  barcode: '7701234567896',
  sku: 'GAL-007',
  price: 3200,
  taxRate: 0.19,
  stock: 2,
  unit: 'pq',
  category: 'Snacks',
  categoryId: '7',
  active: true,
  lastUpdated: new Date().toISOString()
}];
const InventoryPage: React.FC = () => {
  const {
    showToast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    lowStock: false,
    noBarcode: false,
    inactive: false,
    categoryIds: [] as string[]
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [movementType, setMovementType] = useState<'entrada' | 'salida' | 'ajuste' | 'merma' | 'conteo' | 'editar'>('entrada');
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showCategoriesSelectionModal, setShowCategoriesSelectionModal] = useState(false);
  // Cargar productos y categorías
  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      // Aplicar filtros de URL si existen
      const params = new URLSearchParams(window.location.search);
      const urlFilter = params.get('filter');
      // Combinar productos regulares con los de stock bajo
      const allProducts = [...mockProducts, ...lowStockProducts];
      if (urlFilter === 'lowStock') {
        setFilters(prev => ({
          ...prev,
          lowStock: true
        }));
        // Si viene con el filtro de stock bajo, mostrar solo esos productos
        setProducts(allProducts);
        setFilteredProducts(lowStockProducts);
      } else {
        setProducts(allProducts);
        setFilteredProducts(allProducts);
      }
      setCategories(mockCategories);
      setLoading(false);
    };
    loadData();
  }, []);
  // Filtrar productos
  useEffect(() => {
    let result = [...products];
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product => product.name.toLowerCase().includes(term) || product.barcode && product.barcode.includes(term) || product.sku && product.sku.toLowerCase().includes(term) || product.id.includes(term));
    }
    // Aplicar filtro de categoría
    if (filters.categoryIds.length > 0) {
      result = result.filter(product => filters.categoryIds.includes(product.categoryId || ''));
    }
    // Aplicar otros filtros
    if (filters.lowStock) {
      result = result.filter(product => product.stock < 5);
    }
    if (filters.noBarcode) {
      result = result.filter(product => !product.barcode);
    }
    if (filters.inactive) {
      result = result.filter(product => product.active === false);
    } else {
      result = result.filter(product => product.active !== false);
    }
    setFilteredProducts(result);
  }, [searchTerm, filters, products]);
  // Agregar nueva categoría
  const handleAddCategory = (categoryData: Partial<Category>) => {
    setLoading(true);
    // Simular petición a API
    setTimeout(() => {
      const newCategory = {
        id: `${categories.length + 1}`,
        name: categoryData.name || '',
        description: categoryData.description || '',
        active: true
      };
      setCategories([...categories, newCategory]);
      setLoading(false);
      showToast('success', 'Categoría agregada correctamente');
    }, 1000);
  };
  // Editar categoría existente
  const handleEditCategory = (categoryId: string, updatedData: Partial<Category>) => {
    setLoading(true);
    // Simular petición a API
    setTimeout(() => {
      const updatedCategories = categories.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            ...updatedData
          };
        }
        return category;
      });
      setCategories(updatedCategories);
      // Si se está cambiando el estado activo, actualizar los productos de esa categoría
      if (updatedData.active !== undefined) {
        const categoryToUpdate = categories.find(cat => cat.id === categoryId);
        if (categoryToUpdate) {
          const updatedProducts = products.map(product => {
            if (product.categoryId === categoryId) {
              // Si la categoría se desactiva, los productos de esa categoría también se desactivan
              // Si la categoría se activa, los productos mantienen su estado actual
              return {
                ...product,
                active: updatedData.active === false ? false : product.active
              };
            }
            return product;
          });
          setProducts(updatedProducts);
          showToast('info', updatedData.active ? 'Categoría activada. Los productos asociados están disponibles.' : 'Categoría desactivada. Los productos asociados han sido ocultados.');
        }
      }
      setLoading(false);
      showToast('success', 'Categoría actualizada correctamente');
    }, 1000);
  };
  // Agregar nuevo producto
  const handleAddProduct = (productData: Partial<Product>) => {
    setLoading(true);
    // Simular petición a API
    setTimeout(() => {
      const newProduct = {
        id: `${products.length + 1}`,
        ...productData,
        lastUpdated: new Date().toISOString()
      } as Product;
      // Buscar el nombre de la categoría si tenemos el ID
      if (newProduct.categoryId && !newProduct.category) {
        const category = categories.find(c => c.id === newProduct.categoryId);
        if (category) {
          newProduct.category = category.name;
        }
      }
      setProducts([...products, newProduct]);
      setLoading(false);
      setShowAddModal(false);
      showToast('success', 'Producto agregado correctamente');
    }, 1000);
  };
  // Editar producto existente
  const handleEditProduct = (productId: string, updatedData: Partial<Product>) => {
    setLoading(true);
    // Simular petición a API
    setTimeout(() => {
      const updatedProducts = products.map(product => {
        if (product.id === productId) {
          // Buscar el nombre de la categoría si tenemos el ID
          let categoryName = updatedData.category;
          if (updatedData.categoryId && !updatedData.category) {
            const category = categories.find(c => c.id === updatedData.categoryId);
            if (category) {
              categoryName = category.name;
            }
          }
          return {
            ...product,
            ...updatedData,
            category: categoryName,
            lastUpdated: new Date().toISOString()
          };
        }
        return product;
      });
      setProducts(updatedProducts);
      setLoading(false);
      setShowMovementModal(false);
      showToast('success', 'Producto actualizado correctamente');
    }, 1000);
  };
  // Registrar movimiento de inventario
  const handleInventoryMovement = (productId: string, type: string, quantity: number, reason: string) => {
    setLoading(true);
    // Simular petición a API
    setTimeout(() => {
      const updatedProducts = products.map(product => {
        if (product.id === productId) {
          let newStock = product.stock;
          switch (type) {
            case 'entrada':
              newStock += quantity;
              break;
            case 'salida':
              newStock -= quantity;
              break;
            case 'ajuste':
              newStock += quantity; // Puede ser positivo o negativo
              break;
            case 'merma':
              newStock -= quantity;
              break;
            case 'conteo':
              newStock = quantity; // Reemplaza el valor actual
              break;
          }
          return {
            ...product,
            stock: Math.max(0, newStock),
            lastUpdated: new Date().toISOString()
          };
        }
        return product;
      });
      setProducts(updatedProducts);
      setLoading(false);
      setShowMovementModal(false);
      showToast('success', 'Movimiento registrado correctamente');
    }, 1000);
  };
  // Escanear producto
  const handleScan = (barcode: string) => {
    // Buscar producto por código de barras
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      setSelectedProduct(product);
      setMovementType('conteo');
      setShowMovementModal(true);
    } else {
      // Si no existe, mostrar modal para agregar
      setShowAddModal(true);
    }
    setShowScanModal(false);
  };
  // Importar productos masivamente
  const handleImportProducts = (file: File, format: string) => {
    setLoading(true);
    // Simular procesamiento del archivo
    setTimeout(() => {
      // Simular productos importados
      const importedCount = Math.floor(Math.random() * 20) + 5;
      // En una implementación real, aquí se procesaría el archivo CSV/Excel
      // y se cargarían los productos en la base de datos
      setLoading(false);
      setShowImportModal(false);
      showToast('success', `${importedCount} productos importados correctamente`);
    }, 2000);
  };
  // Exportar productos
  const handleExportProducts = () => {
    setLoading(true);
    // Simular exportación
    setTimeout(() => {
      setLoading(false);
      showToast('success', 'Inventario exportado correctamente');
      // En una implementación real, aquí se generaría un archivo CSV/Excel
      // y se iniciaría su descarga
      const dummyLink = document.createElement('a');
      dummyLink.href = 'data:text/csv;charset=utf-8,ID,SKU,Nombre,Precio,IVA,Stock,Categoría\n';
      dummyLink.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
      dummyLink.click();
    }, 1500);
  };
  // Renderizar sección de categorías
  const renderCategoriesSection = () => {
    if (loading) return null;
    // Determinar si hay muchas categorías
    const hasManyCategories = categories.length > 10;
    // By default, keep the category selector collapsed
    if (hasManyCategories && !showCategorySelector) {
      return <div className="bg-white rounded-2xl shadow-md p-3 mb-3">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-medium text-gray-800 flex items-center">
              <FolderIcon size={16} className="mr-2 text-blue-600" />
              Categorías
            </h2>
            <div className="flex space-x-2">
              <button onClick={() => setShowCategoriesSelectionModal(true)} className="text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded-md text-xs flex items-center">
                <FilterIcon size={12} className="mr-1" />
                Seleccionar
              </button>
              <button onClick={() => setShowCategoriesModal(true)} className="text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded-md text-xs flex items-center">
                <PlusCircleIcon size={12} className="mr-1" />
                Gestionar
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <button onClick={() => setFilters({
            ...filters,
            categoryIds: []
          })} className={`px-2 py-1 rounded-lg text-xs ${filters.categoryIds.length === 0 ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}`}>
              Todas
            </button>
            {/* Show selected categories or top categories if none selected */}
            {filters.categoryIds.length > 0 ? <>
                {filters.categoryIds.slice(0, 3).map(categoryId => {
              const category = categories.find(c => c.id === categoryId);
              return category ? <div key={category.id} className="px-2 py-1 rounded-lg text-xs bg-blue-100 text-blue-700 flex items-center gap-1">
                      <span>{category.name}</span>
                      <button className="text-blue-500 hover:text-blue-700" onClick={e => {
                  e.stopPropagation();
                  setFilters({
                    ...filters,
                    categoryIds: filters.categoryIds.filter(id => id !== category.id)
                  });
                }}>
                        <XIcon size={12} />
                      </button>
                    </div> : null;
            })}
                {filters.categoryIds.length > 3 && <div className="px-2 py-1 rounded-lg text-xs bg-blue-100 text-blue-700">
                    +{filters.categoryIds.length - 3} más
                  </div>}
              </> : categories.filter(c => c.active).slice(0, 4).map(category => <button key={category.id} onClick={() => setFilters({
            ...filters,
            categoryIds: [category.id]
          })} className="px-2 py-1 rounded-lg text-xs hover:bg-gray-100 text-gray-700">
                    {category.name}
                  </button>)}
            {(filters.categoryIds.length > 0 || categories.filter(c => c.active).length > 4) && <button onClick={() => setShowCategoriesSelectionModal(true)} className="text-xs text-blue-600 hover:text-blue-800">
                {filters.categoryIds.length > 0 ? 'Editar' : `+${categories.filter(c => c.active).length - 4} más`}
              </button>}
          </div>
        </div>;
    }
    return <div className="bg-white rounded-2xl shadow-md p-3 mb-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-medium text-gray-800 flex items-center">
            <FolderIcon size={16} className="mr-2 text-blue-600" />
            Categorías
          </h2>
          <div className="flex space-x-2">
            {hasManyCategories && <button onClick={() => setShowCategorySelector(false)} className="text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded-md text-xs flex items-center">
                <MinusIcon size={14} className="mr-1" />
                Colapsar
              </button>}
            <button onClick={() => setShowCategoriesModal(true)} className="text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded-md text-xs flex items-center">
              <PlusCircleIcon size={14} className="mr-1" />
              Gestionar
            </button>
          </div>
        </div>
        {/* Mantener los 4 chips de categorías más relevantes */}
        <div className="flex flex-wrap gap-1 mb-2">
          <button onClick={() => setFilters({
          ...filters,
          categoryIds: []
        })} className={`px-2 py-1 rounded-lg text-xs ${filters.categoryIds.length === 0 ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}`}>
            Todas
          </button>
          {filters.categoryIds.length > 0 ? <>
              {filters.categoryIds.slice(0, 3).map(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            return category ? <div key={category.id} className="px-2 py-1 rounded-lg text-xs bg-blue-100 text-blue-700 flex items-center gap-1">
                    <span>{category.name}</span>
                    <button className="text-blue-500 hover:text-blue-700" onClick={e => {
                e.stopPropagation();
                setFilters({
                  ...filters,
                  categoryIds: filters.categoryIds.filter(id => id !== category.id)
                });
              }}>
                      <XIcon size={12} />
                    </button>
                  </div> : null;
          })}
              {filters.categoryIds.length > 3 && <div className="px-2 py-1 rounded-lg text-xs bg-blue-100 text-blue-700">
                  +{filters.categoryIds.length - 3} más
                </div>}
            </> : categories.filter(category => category.active).slice(0, 4).map(category => <button key={category.id} onClick={() => setFilters({
          ...filters,
          categoryIds: [category.id]
        })} className="px-2 py-1 rounded-lg text-xs hover:bg-gray-100 text-gray-700">
                  {category.name}
                </button>)}
        </div>
        {/* Lista compacta de categorías */}
        <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 p-2">
            {categories.filter(category => category.active).map(category => <button key={category.id} onClick={() => {
            // Toggle category selection
            const isSelected = filters.categoryIds.includes(category.id);
            setFilters({
              ...filters,
              categoryIds: isSelected ? filters.categoryIds.filter(id => id !== category.id) : [...filters.categoryIds, category.id]
            });
          }} className={`px-2 py-1.5 rounded-lg text-xs text-left truncate flex items-center justify-between ${filters.categoryIds.includes(category.id) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}>
                  <span>{category.name}</span>
                  {filters.categoryIds.includes(category.id) && <CheckIcon size={12} className="ml-1 flex-shrink-0" />}
                </button>)}
          </div>
        </div>
      </div>;
  };
  // Renderizar contenido
  const renderContent = () => {
    if (loading) {
      return <div className="space-y-4">
          <Skeleton height={60} className="rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Skeleton count={12} height={80} className="rounded-xl" />
          </div>
        </div>;
    }
    if (products.length === 0) {
      return <EmptyState icon={<PackageIcon size={48} />} title="No hay productos en el inventario" description="Comienza agregando tu primer producto al inventario." action={<div className="flex gap-2">
              <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center">
                <PlusIcon size={16} className="mr-1" />
                Agregar producto
              </button>
              <button onClick={() => setShowImportModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center">
                <UploadIcon size={16} className="mr-1" />
                Importar productos
              </button>
            </div>} />;
    }
    if (filteredProducts.length === 0) {
      return <EmptyState icon={<SearchIcon size={48} />} title="No se encontraron productos" description="Intenta cambiar los filtros o términos de búsqueda." action={<button onClick={() => {
        setSearchTerm('');
        setFilters({
          lowStock: false,
          noBarcode: false,
          inactive: false,
          categoryIds: []
        });
      }} className="text-blue-600 hover:text-blue-800 font-medium">
              Limpiar filtros
            </button>} />;
    }
    if (viewMode === 'list') {
      return <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map(product => <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.barcode ? `Código: ${product.barcode}` : 'Sin código'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {product.sku || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.category || 'Sin categoría'}`}>
                        {product.category || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    }).format(product.price)}
                      </div>
                      <div className="text-xs text-gray-500">
                        IVA: {product.taxRate * 100}%
                        {product.taxRate > 0 && product.taxRequired && <span className="ml-1 text-red-600">*</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.stock === 0 ? 'bg-red-100 text-red-800' : product.stock < 5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {product.stock} {product.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => {
                    setSelectedProduct(product);
                    setMovementType('editar');
                    setShowMovementModal(true);
                  }} className="text-blue-600 hover:text-blue-900 mr-2 text-xs">
                        Editar
                      </button>
                      <button onClick={() => {
                    setSelectedProduct(product);
                    setMovementType('entrada');
                    setShowMovementModal(true);
                  }} className="text-green-600 hover:text-green-900 text-xs">
                        Movimiento
                      </button>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>;
    } else {
      return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredProducts.map(product => <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="h-24 bg-gray-100 flex items-center justify-center">
                {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <PackageIcon size={32} className="text-gray-300" />}
              </div>
              <div className="p-2">
                <div className="mb-1">
                  <h3 className="text-xs font-medium text-gray-900 line-clamp-1" title={product.name}>
                    {product.name}
                  </h3>
                  <span className="inline-block px-1.5 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-sm">
                    {product.category || 'Sin categoría'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">
                    {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  maximumFractionDigits: 0
                }).format(product.price)}
                  </span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium ${product.stock === 0 ? 'bg-red-100 text-red-800' : product.stock < 5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                    {product.stock} {product.unit}
                  </span>
                </div>
                <div className="flex justify-between mt-2 border-t pt-1 border-gray-100">
                  <button onClick={() => {
                setSelectedProduct(product);
                setMovementType('editar');
                setShowMovementModal(true);
              }} className="text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded-md text-xs flex items-center">
                    <EditIcon size={10} className="mr-0.5" />
                    Editar
                  </button>
                  <button onClick={() => {
                setSelectedProduct(product);
                setMovementType('entrada');
                setShowMovementModal(true);
              }} className="text-green-600 hover:bg-green-50 px-1 py-0.5 rounded-md text-xs flex items-center">
                    <ArrowUpIcon size={10} className="mr-0.5" />
                    Mov.
                  </button>
                </div>
              </div>
            </div>)}
        </div>;
    }
  };
  return <div className="h-full">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
        <div className="flex space-x-2">
          <button onClick={() => setShowScanModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg flex items-center justify-center text-sm">
            <ScanIcon size={16} className="mr-1" />
            <span className="hidden sm:inline">Escanear</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg flex items-center justify-center text-sm">
            <PlusIcon size={16} className="mr-1" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
          <button onClick={() => setShowImportModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg flex items-center justify-center text-sm">
            <UploadIcon size={16} className="mr-1" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <button onClick={handleExportProducts} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg flex items-center justify-center text-sm">
            <DownloadIcon size={16} className="mr-1" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>
      {/* Sección de categorías */}
      {renderCategoriesSection()}
      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-2xl shadow-md p-3 mb-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={16} className="text-gray-400" />
            </div>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 block w-full rounded-lg border border-gray-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Buscar por nombre, código o SKU" />
          </div>
          <div className="flex space-x-1">
            <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} className="px-1.5 py-1 rounded-lg border border-gray-300 text-gray-700 text-xs flex items-center">
              {viewMode === 'list' ? <>
                  <LayoutGridIcon size={12} className="mr-1" />
                  <span className="hidden sm:inline">Ver cuadrícula</span>
                </> : <>
                  <ListIcon size={12} className="mr-1" />
                  <span className="hidden sm:inline">Ver lista</span>
                </>}
            </button>
            <button onClick={() => setFilters({
            ...filters,
            lowStock: !filters.lowStock
          })} className={`px-1.5 py-1 rounded-lg border ${filters.lowStock ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'} text-xs flex items-center`}>
              <span className="hidden sm:inline">Sin Stock</span>
              <span className="sm:hidden">Sin Stock</span>
            </button>
            <button onClick={() => setFilters({
            ...filters,
            noBarcode: !filters.noBarcode
          })} className={`px-1.5 py-1 rounded-lg border ${filters.noBarcode ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'} text-xs flex items-center`}>
              <span className="hidden sm:inline">Sin Código</span>
              <span className="sm:hidden">Sin Código</span>
            </button>
            <button onClick={() => setFilters({
            ...filters,
            inactive: !filters.inactive
          })} className={`px-1.5 py-1 rounded-lg border ${filters.inactive ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'} text-xs flex items-center`}>
              <span className="hidden sm:inline">Inactivos</span>
              <span className="sm:hidden">Inact.</span>
            </button>
          </div>
        </div>
      </div>
      {renderContent()}
      {/* Modal para agregar producto */}
      <AddProductModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddProduct} categories={categories} />
      {/* Modal para movimientos de inventario */}
      <InventoryMovementModal isOpen={showMovementModal} onClose={() => setShowMovementModal(false)} product={selectedProduct} initialType={movementType} onSubmit={handleInventoryMovement} onEdit={handleEditProduct} categories={categories} />
      {/* Modal para escanear */}
      <ScanModal isOpen={showScanModal} onClose={() => setShowScanModal(false)} onScan={handleScan} />
      {/* Modal para importar productos */}
      <ImportProductsModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleImportProducts} />
      {/* Modal para gestionar categorías */}
      <CategoriesModal isOpen={showCategoriesModal} onClose={() => setShowCategoriesModal(false)} categories={categories} onAddCategory={handleAddCategory} onEditCategory={handleEditCategory} />
      {/* Modal para seleccionar categorías */}
      <CategorySelectionModal isOpen={showCategoriesSelectionModal} onClose={() => setShowCategoriesSelectionModal(false)} categories={categories.filter(c => c.active)} selectedCategoryIds={filters.categoryIds} onSelectCategories={categoryIds => {
      setFilters({
        ...filters,
        categoryIds
      });
      setShowCategoriesSelectionModal(false);
    }} />
    </div>;
};
// Modal para gestionar categorías
const CategoriesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (categoryData: Partial<Category>) => void;
  onEditCategory: (categoryId: string, updatedData: Partial<Category>) => void;
}> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onEditCategory
}) => {
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'add') {
      onAddCategory(newCategory);
      setNewCategory({
        name: '',
        description: ''
      });
      setMode('list');
    } else if (mode === 'edit' && selectedCategory) {
      onEditCategory(selectedCategory.id, newCategory);
      setNewCategory({
        name: '',
        description: ''
      });
      setSelectedCategory(null);
      setMode('list');
    }
  };
  const startEdit = (category: Category) => {
    setSelectedCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || ''
    });
    setMode('edit');
  };
  const handleClose = () => {
    setMode('list');
    setSelectedCategory(null);
    setNewCategory({
      name: '',
      description: ''
    });
    onClose();
  };
  return <Modal isOpen={isOpen} onClose={handleClose} title={mode === 'list' ? 'Gestionar Categorías' : mode === 'add' ? 'Agregar Categoría' : 'Editar Categoría'} footer={mode !== 'list' ? <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setMode('list')} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" disabled={!newCategory.name}>
              {mode === 'add' ? 'Agregar' : 'Guardar cambios'}
            </button>
          </div> : <div className="flex justify-end">
            <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cerrar
            </button>
          </div>}>
      {mode === 'list' ? <div>
          <div className="mb-4 flex justify-between">
            <p className="text-sm text-gray-600">
              Administra las categorías para organizar tus productos
            </p>
            <button onClick={() => {
          setNewCategory({
            name: '',
            description: ''
          });
          setMode('add');
        }} className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-lg text-sm flex items-center">
              <PlusIcon size={14} className="mr-1" />
              Nueva categoría
            </button>
          </div>
          <div className="overflow-y-auto max-h-96">
            {categories.length === 0 ? <div className="text-center py-8">
                <FolderIcon size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay categorías creadas</p>
              </div> : <ul className="divide-y divide-gray-200">
                {categories.map(category => <li key={category.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {category.name}
                          {!category.active && <span className="ml-2 text-xs text-gray-500">
                              (Inactiva)
                            </span>}
                        </h3>
                        {category.description && <p className="text-sm text-gray-500">
                            {category.description}
                          </p>}
                      </div>
                      <div className="flex space-x-1">
                        <button onClick={() => startEdit(category)} className="p-1.5 rounded-md hover:bg-gray-100 text-blue-600">
                          <PenIcon size={16} />
                        </button>
                        <button onClick={() => onEditCategory(category.id, {
                  active: !category.active
                })} className={`p-1.5 rounded-md hover:bg-gray-100 ${category.active ? 'text-amber-600' : 'text-green-600'}`} title={category.active ? 'Desactivar categoría' : 'Activar categoría'}>
                          {category.active ? <ArchiveIcon size={16} /> : <CheckIcon size={16} />}
                        </button>
                      </div>
                    </div>
                  </li>)}
              </ul>}
          </div>
        </div> : <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la categoría <span className="text-red-500">*</span>
              </label>
              <input type="text" id="categoryName" value={newCategory.name} onChange={e => setNewCategory({
            ...newCategory,
            name: e.target.value
          })} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea id="categoryDescription" value={newCategory.description} onChange={e => setNewCategory({
            ...newCategory,
            description: e.target.value
          })} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Descripción opcional" />
            </div>
          </div>
        </form>}
    </Modal>;
};
// Modal para agregar producto
const AddProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Partial<Product>) => void;
  categories: Category[];
}> = ({
  isOpen,
  onClose,
  onSubmit,
  categories
}) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(0.19);
  const [taxRequired, setTaxRequired] = useState(false);
  const [stock, setStock] = useState(0);
  const [unit, setUnit] = useState('un');
  const [categoryId, setCategoryId] = useState('');
  // Función para formatear precio con separadores de miles
  const formatPrice = (value: string) => {
    // Eliminar todo excepto números
    const numericValue = value.replace(/\D/g, '');
    // Convertir a número y formatear
    if (numericValue) {
      const numberValue = parseInt(numericValue);
      setPrice(numberValue);
      return new Intl.NumberFormat('es-CO').format(numberValue);
    }
    setPrice(0);
    return '';
  };
  const [displayPrice, setDisplayPrice] = useState('');
  // Resetear el formulario cuando se abre
  useEffect(() => {
    if (isOpen) {
      setName('');
      setBarcode('');
      setSku('');
      setPrice(0);
      setDisplayPrice('');
      setTaxRate(0.19);
      setTaxRequired(false);
      setStock(0);
      setUnit('un');
      setCategoryId('');
    }
  }, [isOpen]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Encontrar el nombre de la categoría
    let categoryName = '';
    if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        categoryName = category.name;
      }
    }
    onSubmit({
      name,
      barcode,
      sku,
      price,
      taxRate,
      taxRequired,
      stock,
      unit,
      categoryId,
      category: categoryName,
      active: true
    });
  };
  return <Modal isOpen={isOpen} onClose={onClose} title="Agregar producto" footer={<div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Guardar
          </button>
        </div>}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                Código de barras
              </label>
              <input type="text" id="barcode" value={barcode} onChange={e => setBarcode(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Opcional" />
            </div>
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input type="text" id="sku" value={sku} onChange={e => setSku(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Opcional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Precio <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input type="text" id="price" value={displayPrice} onChange={e => {
                const formatted = formatPrice(e.target.value);
                setDisplayPrice(formatted);
              }} className="pl-7 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required placeholder="0" />
              </div>
            </div>
            <div>
              <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">
                IVA
              </label>
              <select id="taxRate" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value={0}>0% (Exento)</option>
                <option value={0.05}>5%</option>
                <option value={0.19}>19%</option>
              </select>
            </div>
          </div>
          {taxRate > 0 && <div className="flex items-center">
              <input type="checkbox" id="taxRequired" checked={taxRequired} onChange={e => setTaxRequired(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="taxRequired" className="ml-2 text-sm text-gray-700">
                IVA obligatorio (no se puede omitir en venta)
              </label>
            </div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                Stock inicial
              </label>
              <input type="number" id="stock" value={stock} onChange={e => setStock(Number(e.target.value))} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unidad
              </label>
              <select id="unit" value={unit} onChange={e => setUnit(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="un">Unidad</option>
                <option value="kg">Kilogramo</option>
                <option value="g">Gramo</option>
                <option value="l">Litro</option>
                <option value="ml">Mililitro</option>
                <option value="pq">Paquete</option>
                <option value="cj">Caja</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Seleccionar categoría</option>
              {categories.filter(c => c.active).map(category => <option key={category.id} value={category.id}>
                    {category.name}
                  </option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foto (opcional)
            </label>
            <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-xs text-gray-500">
                  Tomar foto o subir imagen
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>;
};
// Modal para movimientos de inventario
const InventoryMovementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  initialType: 'entrada' | 'salida' | 'ajuste' | 'merma' | 'conteo' | 'editar';
  onSubmit: (productId: string, type: string, quantity: number, reason: string) => void;
  onEdit: (productId: string, updatedData: Partial<Product>) => void;
  categories: Category[];
}> = ({
  isOpen,
  onClose,
  product,
  initialType,
  onSubmit,
  onEdit,
  categories
}) => {
  const [type, setType] = useState(initialType);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');
  // Para edición de producto
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxRequired, setTaxRequired] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('un');
  const [active, setActive] = useState(true);
  // Función para formatear precio con separadores de miles
  const formatPrice = (value: string) => {
    // Eliminar todo excepto números
    const numericValue = value.replace(/\D/g, '');
    // Convertir a número y formatear
    if (numericValue) {
      const numberValue = parseInt(numericValue);
      setPrice(numberValue);
      return new Intl.NumberFormat('es-CO').format(numberValue);
    }
    setPrice(0);
    return '';
  };
  const [displayPrice, setDisplayPrice] = useState('');
  // Reiniciar valores cuando cambia el producto o el tipo
  useEffect(() => {
    setType(initialType);
    setQuantity(1);
    setReason('');
    setLocation('');
    if (product) {
      setName(product.name || '');
      setBarcode(product.barcode || '');
      setSku(product.sku || '');
      setPrice(product.price || 0);
      setDisplayPrice(product.price ? new Intl.NumberFormat('es-CO').format(product.price) : '');
      setTaxRate(product.taxRate || 0);
      setTaxRequired(product.taxRequired || false);
      setCategoryId(product.categoryId || '');
      setUnit(product.unit || 'un');
      setActive(product.active !== false);
    }
  }, [product, initialType]);
  if (!product) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'editar') {
      // Encontrar el nombre de la categoría
      let categoryName = '';
      if (categoryId) {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          categoryName = category.name;
        }
      }
      onEdit(product.id, {
        name,
        barcode,
        sku,
        price,
        taxRate,
        taxRequired,
        categoryId,
        category: categoryName,
        unit,
        active
      });
    } else {
      onSubmit(product.id, type, type === 'ajuste' ? parseInt(quantity.toString()) : Math.abs(quantity), reason);
    }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={type === 'editar' ? `Editar producto: ${product?.name}` : `Movimiento de inventario: ${product?.name}`} footer={<div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {type === 'editar' ? 'Guardar cambios' : 'Registrar movimiento'}
          </button>
        </div>}>
      <form onSubmit={handleSubmit}>
        <div className="bg-gray-50 rounded-lg p-3 mb-4 flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Stock actual</p>
            <p className="text-lg font-medium text-gray-800">
              {product?.stock} {product?.unit}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Último movimiento</p>
            <p className="text-sm text-gray-800">
              {product?.lastUpdated ? new Date(product.lastUpdated).toLocaleDateString('es-CO') : 'N/A'}
            </p>
          </div>
        </div>
        {/* Pestañas para cambiar entre modos */}
        <div className="flex border-b border-gray-200 mb-4">
          <button type="button" onClick={() => setType('editar')} className={`py-2 px-4 border-b-2 font-medium text-sm ${type === 'editar' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Editar datos
          </button>
          <button type="button" onClick={() => setType('entrada')} className={`py-2 px-4 border-b-2 font-medium text-sm ${type !== 'editar' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Movimiento
          </button>
        </div>
        {type === 'editar' ? <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Código de barras
                </label>
                <input type="text" id="barcode" value={barcode} onChange={e => setBarcode(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Opcional" />
              </div>
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input type="text" id="sku" value={sku} onChange={e => setSku(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Opcional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Precio <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input type="text" id="price" value={displayPrice} onChange={e => {
                const formatted = formatPrice(e.target.value);
                setDisplayPrice(formatted);
              }} className="pl-7 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required placeholder="0" />
                </div>
              </div>
              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">
                  IVA
                </label>
                <select id="taxRate" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value={0}>0% (Exento)</option>
                  <option value={0.05}>5%</option>
                  <option value={0.19}>19%</option>
                </select>
              </div>
            </div>
            {taxRate > 0 && <div className="flex items-center">
                <input type="checkbox" id="taxRequired" checked={taxRequired} onChange={e => setTaxRequired(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="taxRequired" className="ml-2 text-sm text-gray-700">
                  IVA obligatorio (no se puede omitir en venta)
                </label>
              </div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Sin categoría</option>
                  {categories.filter(c => c.active).map(category => <option key={category.id} value={category.id}>
                        {category.name}
                      </option>)}
                </select>
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad
                </label>
                <select id="unit" value={unit} onChange={e => setUnit(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="un">Unidad</option>
                  <option value="kg">Kilogramo</option>
                  <option value="g">Gramo</option>
                  <option value="l">Litro</option>
                  <option value="ml">Mililitro</option>
                  <option value="pq">Paquete</option>
                  <option value="cj">Caja</option>
                </select>
              </div>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="active" checked={active} onChange={e => setActive(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                Producto activo
              </label>
            </div>
          </div> : <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de movimiento
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <button type="button" onClick={() => setType('entrada')} className={`flex flex-col items-center justify-center p-2 rounded-lg border ${type === 'entrada' ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-300'}`}>
                  <ArrowUpIcon size={20} className={type === 'entrada' ? 'text-green-600' : 'text-gray-500'} />
                  <span className="text-xs mt-1">Entrada</span>
                </button>
                <button type="button" onClick={() => setType('salida')} className={`flex flex-col items-center justify-center p-2 rounded-lg border ${type === 'salida' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-300'}`}>
                  <ArrowDownIcon size={20} className={type === 'salida' ? 'text-amber-600' : 'text-gray-500'} />
                  <span className="text-xs mt-1">Salida</span>
                </button>
                <button type="button" onClick={() => setType('ajuste')} className={`flex flex-col items-center justify-center p-2 rounded-lg border ${type === 'ajuste' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300'}`}>
                  <FilterIcon size={20} className={type === 'ajuste' ? 'text-blue-600' : 'text-gray-500'} />
                  <span className="text-xs mt-1">Ajuste</span>
                </button>
                <button type="button" onClick={() => setType('merma')} className={`flex flex-col items-center justify-center p-2 rounded-lg border ${type === 'merma' ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300'}`}>
                  <MinusIcon size={20} className={type === 'merma' ? 'text-red-600' : 'text-gray-500'} />
                  <span className="text-xs mt-1">Merma</span>
                </button>
                <button type="button" onClick={() => setType('conteo')} className={`flex flex-col items-center justify-center p-2 rounded-lg border ${type === 'conteo' ? 'bg-purple-50 border-purple-300 text-purple-700' : 'border-gray-300'}`}>
                  <PackageIcon size={20} className={type === 'conteo' ? 'text-purple-600' : 'text-gray-500'} />
                  <span className="text-xs mt-1">Conteo</span>
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'conteo' ? 'Cantidad real' : 'Cantidad'}
              </label>
              <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" min={type === 'conteo' ? 0 : type === 'ajuste' ? undefined : 1} required />
              {type === 'conteo' && <p className="mt-1 text-xs text-gray-500">
                  El stock será actualizado a este valor exacto.
                </p>}
              {type === 'ajuste' && <p className="mt-1 text-xs text-gray-500">
                  Puede ser positivo (entrada) o negativo (salida).
                </p>}
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <input type="text" id="reason" value={reason} onChange={e => setReason(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={type === 'entrada' ? 'Ej. Compra a proveedor' : type === 'salida' ? 'Ej. Venta sin registrar' : type === 'ajuste' ? 'Ej. Corrección de inventario' : type === 'merma' ? 'Ej. Producto vencido' : 'Ej. Inventario físico'} required />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación (opcional)
              </label>
              <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Bodega principal, Estante A3" />
            </div>
          </div>}
      </form>
    </Modal>;
};
// Modal para escanear
const ScanModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  // Simular escaneo
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        const mockBarcodes = ['7701234567890', '7702345678901', '7703456789012', '7704567890123', '7705678901234'];
        const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
        setBarcode(randomBarcode);
        setIsScanning(false);
        // Enviar el código escaneado
        onScan(randomBarcode);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isScanning, onScan]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode) {
      onScan(barcode);
    }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title="Escanear producto">
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg aspect-video flex flex-col items-center justify-center">
          {isScanning ? <div className="text-center">
              <div className="animate-pulse mb-2">
                <ScanIcon size={48} className="text-white mx-auto" />
              </div>
              <p className="text-white text-sm">Escaneando...</p>
            </div> : <button onClick={() => setIsScanning(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
              Iniciar escaneo
            </button>}
        </div>
        <p className="text-sm text-gray-500 text-center">
          Apunte la cámara al código de barras del producto
        </p>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex space-x-2">
            <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)} className="flex-1 rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ingrese código manualmente" />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
              Buscar
            </button>
          </div>
        </form>
      </div>
    </Modal>;
};
// Modal para importar productos
const ImportProductsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, format: string) => void;
}> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('csv');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFile(e.target.files[0]);
    }
  };
  const validateFile = (file: File) => {
    setError('');
    // Validar extensión
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (format === 'csv' && extension !== 'csv') {
      setError('El archivo debe ser de tipo CSV');
      return;
    }
    if (format === 'excel' && !['xlsx', 'xls'].includes(extension || '')) {
      setError('El archivo debe ser de tipo Excel (XLSX/XLS)');
      return;
    }
    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no debe superar los 5MB');
      return;
    }
    setFile(file);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFile(e.dataTransfer.files[0]);
    }
  };
  const handleSubmit = () => {
    if (file) {
      onImport(file, format);
    } else {
      setError('Debe seleccionar un archivo');
    }
  };
  const handleDownloadTemplate = () => {
    // En una implementación real, aquí se generaría y descargaría la plantilla
    // Simular descarga
    const dummyLink = document.createElement('a');
    const templateType = format === 'csv' ? 'csv' : 'xlsx';
    dummyLink.href = `data:text/${templateType};charset=utf-8,ID,SKU,Nombre,Precio,IVA,Stock,Unidad,Categoría\n`;
    dummyLink.setAttribute('download', `plantilla_productos.${templateType}`);
    dummyLink.click();
  };
  return <Modal isOpen={isOpen} onClose={onClose} title="Importar productos" footer={<div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={!file} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            Importar
          </button>
        </div>}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Formato de archivo
          </label>
          <div className="flex space-x-2">
            <button type="button" onClick={() => setFormat('csv')} className={`flex-1 py-2 px-3 rounded-lg border ${format === 'csv' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'}`}>
              CSV
            </button>
            <button type="button" onClick={() => setFormat('excel')} className={`flex-1 py-2 px-3 rounded-lg border ${format === 'excel' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'}`}>
              Excel
            </button>
          </div>
        </div>
        <div className={`border-2 ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-dashed border-gray-300'} rounded-lg p-6 cursor-pointer hover:bg-gray-50`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
          <div className="space-y-2 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-sm text-gray-600">
              <p className="font-medium">
                {file ? file.name : 'Haga clic para seleccionar o arrastre un archivo'}
              </p>
              <p className="text-xs text-gray-500">
                {format === 'csv' ? 'Archivo CSV (valores separados por comas)' : 'Archivo Excel (XLSX, XLS)'}
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept={format === 'csv' ? '.csv' : '.xlsx,.xls'} className="hidden" onChange={handleFileChange} />
          </div>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertTriangleIcon size={16} className="mr-2" />
            {error}
          </div>}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 flex items-center mb-2">
            <FileTextIcon size={16} className="mr-2" />
            Información importante
          </h3>
          <ul className="text-xs text-blue-700 space-y-1 ml-5 list-disc">
            <li>Cada producto debe tener un nombre y precio</li>
            <li>El código de barras debe ser único para cada producto</li>
            <li>El SKU es opcional pero recomendado para gestión interna</li>
            <li>Las columnas obligatorias son: Nombre, Precio, IVA</li>
            <li>El stock inicial es opcional y por defecto será 0</li>
            <li>La categoría debe coincidir con una existente o se creará</li>
          </ul>
          <button onClick={handleDownloadTemplate} className="mt-3 text-xs font-medium text-blue-700 flex items-center">
            <DownloadIcon size={14} className="mr-1" />
            Descargar plantilla
          </button>
        </div>
      </div>
    </Modal>;
};
// Modal para seleccionar categorías
const CategorySelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryIds: string[];
  onSelectCategories: (categoryIds: string[]) => void;
}> = ({
  isOpen,
  onClose,
  categories,
  selectedCategoryIds,
  onSelectCategories
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  // Initialize temporary selection with current selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds([...selectedCategoryIds]);
    }
  }, [isOpen, selectedCategoryIds]);
  const filteredCategories = categories.filter(category => category.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const toggleCategory = (categoryId: string) => {
    setTempSelectedIds(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
  };
  const handleSelectAll = () => {
    if (tempSelectedIds.length === filteredCategories.length) {
      // If all are selected, deselect all
      setTempSelectedIds([]);
    } else {
      // Otherwise select all filtered categories
      setTempSelectedIds(filteredCategories.map(c => c.id));
    }
  };
  const handleApply = () => {
    onSelectCategories(tempSelectedIds);
  };
  return <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Categorías" footer={<div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="button" onClick={handleApply} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Aplicar
          </button>
        </div>}>
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon size={16} className="text-gray-400" />
          </div>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Buscar categoría" />
        </div>
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center">
            <input type="checkbox" id="select-all" checked={tempSelectedIds.length > 0 && tempSelectedIds.length === filteredCategories.length} onChange={handleSelectAll} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700">
              Seleccionar todas
            </label>
          </div>
          {tempSelectedIds.length > 0 && <span className="text-xs text-blue-600 font-medium">
              {tempSelectedIds.length} seleccionadas
            </span>}
        </div>
        <div className="overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 gap-1">
            <button onClick={() => onSelectCategories([])} className={`px-3 py-2 rounded-lg text-sm text-left ${selectedCategoryIds.length === 0 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}>
              Todas las categorías
            </button>
            {filteredCategories.length > 0 ? filteredCategories.map(category => <div key={category.id} className={`px-3 py-2 rounded-lg text-sm flex items-center ${tempSelectedIds.includes(category.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <input type="checkbox" id={`category-${category.id}`} checked={tempSelectedIds.includes(category.id)} onChange={() => toggleCategory(category.id)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <label htmlFor={`category-${category.id}`} className="ml-2 flex-1 cursor-pointer" onClick={() => toggleCategory(category.id)}>
                    {category.name}
                  </label>
                </div>) : <div className="text-center py-6 text-gray-500">
                No se encontraron categorías
              </div>}
          </div>
        </div>
      </div>
    </Modal>;
};
export default InventoryPage;