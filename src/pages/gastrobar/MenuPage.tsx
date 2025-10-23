import React, { useState } from 'react';
import {
  UtensilsIcon,
  GlassWaterIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ClockIcon,
  PackageIcon,
  SearchIcon,
  XIcon,
  SaveIcon,
  ListIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TagIcon,
  LayersIcon,
  MoreHorizontalIcon,
  FilterIcon
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

// Tipo para producto
type ProductType = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

// Tipo para ítems del menú
type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  type: string;
  available: boolean;
  image?: string;
  preparationTime?: number;
  stock?: number;
  stockAlert?: number;
  isCombo?: boolean;
  comboItems?: string[];
};

// Tipo para categorías del menú
type MenuCategory = {
  id: string;
  name: string;
  type: string;
  order: number;
};

// Datos de ejemplo para tipos de productos
const mockProductTypes: ProductType[] = [
  { id: 'food', name: 'Comidas', icon: 'UtensilsIcon', color: 'amber' },
  { id: 'drink', name: 'Bebidas', icon: 'GlassWaterIcon', color: 'blue' },
  { id: 'dessert', name: 'Postres', icon: 'CakeIcon', color: 'pink' }
];

// Datos de ejemplo para categorías del menú
const mockMenuCategories: MenuCategory[] = [
  { id: 'cat-1', name: 'Entradas', type: 'food', order: 1 },
  { id: 'cat-2', name: 'Platos Fuertes', type: 'food', order: 2 },
  { id: 'cat-3', name: 'Postres', type: 'food', order: 3 },
  { id: 'cat-4', name: 'Bebidas Frías', type: 'drink', order: 1 },
  { id: 'cat-5', name: 'Bebidas Calientes', type: 'drink', order: 2 },
  { id: 'cat-6', name: 'Cervezas', type: 'drink', order: 3 },
  { id: 'cat-7', name: 'Vinos', type: 'drink', order: 4 }
];

// Datos de ejemplo para ítems del menú
const mockMenuItems: MenuItem[] = [
  {
    id: 'item-1',
    name: 'Nachos con Guacamole',
    description: 'Nachos crujientes con guacamole fresco',
    price: 18000,
    category: 'cat-1',
    type: 'food',
    available: true,
    preparationTime: 10,
    stock: 15,
    stockAlert: 5
  },
  {
    id: 'item-2',
    name: 'Alitas BBQ',
    description: 'Alitas de pollo bañadas en salsa BBQ',
    price: 22000,
    category: 'cat-1',
    type: 'food',
    available: true,
    preparationTime: 15,
    stock: 20,
    stockAlert: 7
  },
  {
    id: 'item-3',
    name: 'Hamburguesa Clásica',
    description: 'Carne de res, queso, lechuga, tomate y cebolla',
    price: 25000,
    category: 'cat-2',
    type: 'food',
    available: true,
    preparationTime: 20,
    stock: 18,
    stockAlert: 5
  },
  {
    id: 'item-4',
    name: 'Pizza Familiar',
    description: 'Pizza grande con queso y pepperoni',
    price: 45000,
    category: 'cat-2',
    type: 'food',
    available: true,
    preparationTime: 25,
    stock: 8,
    stockAlert: 3
  },
  {
    id: 'item-5',
    name: 'Ensalada César',
    description: 'Lechuga romana, crutones, pollo y aderezo césar',
    price: 18000,
    category: 'cat-2',
    type: 'food',
    available: true,
    preparationTime: 10,
    stock: 12,
    stockAlert: 4
  },
  {
    id: 'item-6',
    name: 'Cheesecake',
    description: 'Tarta de queso con salsa de frutos rojos',
    price: 12000,
    category: 'cat-3',
    type: 'food',
    available: true,
    preparationTime: 5,
    stock: 6,
    stockAlert: 3
  },
  {
    id: 'item-7',
    name: 'Limonada',
    description: 'Limonada natural con menta',
    price: 8000,
    category: 'cat-4',
    type: 'drink',
    available: true,
    preparationTime: 5,
    stock: 25,
    stockAlert: 8
  },
  {
    id: 'item-8',
    name: 'Cerveza Artesanal',
    description: 'Cerveza artesanal local',
    price: 12000,
    category: 'cat-6',
    type: 'drink',
    available: true,
    stock: 30,
    stockAlert: 10
  },
  {
    id: 'item-9',
    name: 'Café Americano',
    description: 'Café americano recién preparado',
    price: 5000,
    category: 'cat-5',
    type: 'drink',
    available: true,
    stock: 50,
    stockAlert: 15
  },
  {
    id: 'item-10',
    name: 'Botella Vino Tinto',
    description: 'Vino tinto reserva',
    price: 65000,
    category: 'cat-7',
    type: 'drink',
    available: true,
    stock: 8,
    stockAlert: 2
  },
  {
    id: 'item-11',
    name: 'Papas Fritas',
    description: 'Papas fritas con sal',
    price: 8000,
    category: 'cat-1',
    type: 'food',
    available: true,
    preparationTime: 10,
    stock: 22,
    stockAlert: 8
  },
  {
    id: 'item-12',
    name: 'Combo Hamburguesa Especial',
    description: 'Hamburguesa + Papas + Bebida',
    price: 32000,
    category: 'cat-2',
    type: 'food',
    available: true,
    preparationTime: 20,
    stock: 15,
    stockAlert: 5,
    isCombo: true,
    comboItems: ['item-3', 'item-11', 'item-7']
  }
];

const MenuPage = () => {
  const { showToast } = useToast();

  // ----------------- Botones (estilos) -----------------
  const softBtn = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      gray: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
      amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
      red: 'bg-red-50 text-red-700 hover:bg-red-100',
      green: 'bg-green-50 text-green-700 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      pink: 'bg-pink-50 text-pink-700 hover:bg-pink-100'
    };
    return [
      'px-3 py-2 rounded-lg',
      'text-[12px] sm:text-sm font-medium',
      'transition-colors',
      'flex items-center justify-center',
      'whitespace-nowrap',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
      colorMap[color] || colorMap.gray
    ].join(' ');
  };

  const ctaGrad = () =>
    [
      'px-4 py-2',
      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
      'rounded-lg',
      'text-[12px] sm:text-sm font-medium',
      'hover:from-blue-700 hover:to-indigo-700',
      'transition-colors',
      'flex items-center justify-center',
      'whitespace-nowrap',
      'shadow-sm',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
    ].join(' ');

  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(mockMenuCategories);
  const [productTypes, setProductTypes] = useState<ProductType[]>(mockProductTypes);

  const [menuFilter, setMenuFilter] = useState<string>('all');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('all');

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);

  const [showProductTypeModal, setShowProductTypeModal] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);

  const [showAllProductTypes, setShowAllProductTypes] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [expandedCombos, setExpandedCombos] = useState<Record<string, boolean>>({});

  const toggleComboDetails = (itemId: string) => {
    setExpandedCombos((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const getIconByName = (iconName: string, size = 16, className = '') => {
    switch (iconName) {
      case 'UtensilsIcon':
        return <UtensilsIcon size={size} className={className} />;
      case 'GlassWaterIcon':
        return <GlassWaterIcon size={size} className={className} />;
      case 'CakeIcon':
        return <LayersIcon size={size} className={className} />;
      default:
        return <TagIcon size={size} className={className} />;
    }
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...item, id: `item-${menuItems.length + 1}` };
    setMenuItems([...menuItems, newItem]);
    setSelectedMenuItem(null);
    setShowMenuItemModal(false);
    showToast('success', `Producto "${item.name}" agregado al menú`);
  };

  const updateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems((prev) => prev.map((it) => (it.id === updatedItem.id ? updatedItem : it)));
    setSelectedMenuItem(null);
    setShowMenuItemModal(false);
    showToast('success', `Producto "${updatedItem.name}" actualizado`);
  };

  const deleteMenuItem = (itemId: string) => {
    setMenuItems((prev) => prev.filter((it) => it.id !== itemId));
    showToast('success', 'Producto eliminado del menú');
  };

  const addCategory = (category: Omit<MenuCategory, 'id'>) => {
    const newCategory: MenuCategory = { ...category, id: `cat-${menuCategories.length + 1}` };
    setMenuCategories([...menuCategories, newCategory]);
    setSelectedCategory(null);
    setShowCategoryModal(false);
    showToast('success', `Categoría "${category.name}" agregada al menú`);
  };

  const updateCategory = (updatedCategory: MenuCategory) => {
    setMenuCategories((prev) => prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c)));
    setSelectedCategory(null);
    setShowCategoryModal(false);
    showToast('success', `Categoría "${updatedCategory.name}" actualizada`);
  };

  const deleteCategory = (categoryId: string) => {
    const productsUsingCategory = menuItems.filter((item) => item.category === categoryId);
    if (productsUsingCategory.length > 0) {
      showToast('error', 'No se puede eliminar una categoría que tiene productos asociados');
      return;
    }
    setMenuCategories((prev) => prev.filter((c) => c.id !== categoryId));
    showToast('success', 'Categoría eliminada del menú');
  };

  const addProductType = (type: Omit<ProductType, 'id'>) => {
    const newType: ProductType = { ...type, id: `type-${Date.now()}` };
    setProductTypes([...productTypes, newType]);
    setSelectedProductType(null);
    setShowProductTypeModal(false);
    showToast('success', `Tipo de producto "${type.name}" agregado`);
  };

  const updateProductType = (updatedType: ProductType) => {
    setProductTypes((prev) => prev.map((t) => (t.id === updatedType.id ? updatedType : t)));
    setSelectedProductType(null);
    setShowProductTypeModal(false);
    showToast('success', `Tipo de producto "${updatedType.name}" actualizado`);
  };

  const deleteProductType = (typeId: string) => {
    const productsUsingType = menuItems.filter((item) => item.type === typeId);
    const categoriesUsingType = menuCategories.filter((c) => c.type === typeId);
    if (productsUsingType.length > 0 || categoriesUsingType.length > 0) {
      showToast('error', 'No se puede eliminar un tipo que está en uso por productos o categorías');
      return;
    }
    if (typeId === 'food' || typeId === 'drink') {
      showToast('error', 'No se pueden eliminar los tipos de producto predeterminados');
      return;
    }
    setProductTypes((prev) => prev.filter((t) => t.id !== typeId));
    showToast('success', 'Tipo de producto eliminado');
  };

  const getComboItemNames = (comboItemIds: string[] = []) =>
    comboItemIds.map((id) => menuItems.find((i) => i.id === id)?.name ?? 'Producto no encontrado');

  const filteredMenuItems = menuItems.filter((item) => {
    const typeMatch = menuFilter === 'all' || item.type === menuFilter;
    const categoryMatch = menuCategoryFilter === 'all' || item.category === menuCategoryFilter;
    const searchMatch =
      menuSearchTerm === '' ||
      item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(menuSearchTerm.toLowerCase());
    return typeMatch && categoryMatch && searchMatch;
  });

  const sortedCategories = [...menuCategories].sort((a, b) => a.order - b.order);
  const filteredCategories = sortedCategories.filter((cat) => menuFilter === 'all' || cat.type === menuFilter);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 via-violet-50 to-pink-50 p-4 rounded-3xl shadow-sm border border-white/60">
        <div className="bg-white/60 p-3 rounded-2xl">
          <h1 className="text-2xl font-bold text-gray-800">Menú</h1>
          <p className="text-sm text-gray-600">Gestión de productos, categorías y tipos</p>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div className="mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between mb-3">
          {/* Chips de tipo */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button className={softBtn(menuFilter === 'all' ? 'blue' : 'gray')} onClick={() => setMenuFilter('all')}>
              Todos
            </button>
            {productTypes.slice(0, 5).map((type) => (
              <button
                key={type.id}
                className={softBtn(menuFilter === type.id ? type.color : 'gray')}
                onClick={() => {
                  setMenuFilter(type.id);
                  setMenuCategoryFilter('all');
                }}
              >
                {getIconByName(type.icon, 14, 'mr-1')} {type.name}
              </button>
            ))}
            {productTypes.length > 5 && (
              <button className={softBtn('gray')} onClick={() => setShowAllProductTypes(true)}>
                <MoreHorizontalIcon size={14} className="mr-1" /> Más tipos
              </button>
            )}
          </div>

          {/* Acciones (en desktop queda también "Nuevo producto") */}
          <div className="flex gap-2 flex-nowrap w-full sm:w-auto">
            <button
              className={`${softBtn('green')} flex-1 basis-1/2 min-w-0`}
              onClick={() => {
                setSelectedProductType(null);
                setShowProductTypeModal(true);
              }}
              aria-label="Crear nuevo tipo de producto"
            >
              <TagIcon size={14} className="mr-1" />
              Nuevo tipo
            </button>
            <button
              className={`${softBtn('purple')} flex-1 basis-1/2 min-w-0`}
              onClick={() => {
                setSelectedCategory(null);
                setShowCategoryModal(true);
              }}
              aria-label="Crear nueva categoría"
            >
              <ListIcon size={14} className="mr-1" />
              Nueva categoría
            </button>
            <button
              className={`${ctaGrad()} hidden md:inline-flex items-center whitespace-nowrap`}
              onClick={() => {
                setSelectedMenuItem(null);
                setShowMenuItemModal(true);
              }}
              aria-label="Crear nuevo producto"
            >
              <PlusIcon size={14} className="mr-1" />
              Nuevo producto
            </button>
          </div>
        </div>

        {/* Filtros de categoría */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            className={`px-2 py-1 rounded text-xs font-medium ${
              menuCategoryFilter === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setMenuCategoryFilter('all')}
          >
            Todas las categorías
          </button>
          {filteredCategories.slice(0, 5).map((category) => (
            <div key={category.id} className="flex items-center">
              <button
                className={`px-2 py-1 rounded-l text-xs font-medium ${
                  menuCategoryFilter === category.id ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => setMenuCategoryFilter(category.id)}
              >
                {category.name}
              </button>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-r h-[22px] px-1 text-xs"
                onClick={() => {
                  setSelectedCategory(category);
                  setShowCategoryModal(true);
                }}
                aria-label={`Editar categoría ${category.name}`}
              >
                <EditIcon size={10} />
              </button>
            </div>
          ))}
          {filteredCategories.length > 5 && (
            <button
              className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center"
              onClick={() => setShowAllCategories(true)}
            >
              <MoreHorizontalIcon size={12} className="mr-1" />
              Ver todas ({filteredCategories.length})
            </button>
          )}
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar en el menú..."
            value={menuSearchTerm}
            onChange={(e) => setMenuSearchTerm(e.target.value)}
            aria-label="Buscar en el menú"
          />
        </div>
      </div>

      {/* Lista de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMenuItems.map((item) => (
          <div key={item.id} className="border border-gray-100 rounded-2xl p-4 hover:border-blue-300 transition-colors bg-white shadow-sm">
            <div className="flex justify-between">
              <div>
                <div className="flex items-center">
                  <h3 className="font-medium text-lg">{item.name}</h3>
                  {item.isCombo && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full ml-2 flex items-center">
                      <PackageIcon size={12} className="mr-1" /> Combo
                    </span>
                  )}
                  {item.stock !== undefined &&
                    item.stockAlert !== undefined &&
                    item.stock <= item.stockAlert && (
                      <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full ml-2">
                        Stock bajo
                      </span>
                    )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>

                {item.isCombo && item.comboItems && item.comboItems.length > 0 && (
                  <div className="mt-1">
                    <button
                      onClick={() => toggleComboDetails(item.id)}
                      className="text-blue-600 text-xs font-medium flex items-center hover:text-blue-800"
                    >
                      {expandedCombos[item.id] ? (
                        <>
                          <ChevronUpIcon size={14} className="mr-1" /> Ocultar detalles
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon size={14} className="mr-1" /> Ver productos incluidos
                        </>
                      )}
                    </button>
                    {expandedCombos[item.id] && (
                      <ul className="mt-1 ml-4 text-xs text-gray-600 space-y-1 border-l-2 border-blue-100 pl-2">
                        {getComboItemNames(item.comboItems).map((name, idx) => (
                          <li key={idx} className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></div>
                            {name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex items-center mt-2">
                  {productTypes.find((type) => type.id === item.type) ? (
                    <span className="flex items-center">
                      {getIconByName(
                        productTypes.find((type) => type.id === item.type)?.icon || 'TagIcon',
                        16,
                        `text-${productTypes.find((type) => type.id === item.type)?.color}-500 mr-1.5`
                      )}
                    </span>
                  ) : (
                    <TagIcon size={16} className="text-gray-500 mr-1.5" />
                  )}
                  <span className="text-sm text-gray-500">
                    {menuCategories.find((c) => c.id === item.category)?.name}
                  </span>
                  {item.preparationTime && (
                    <>
                      <span className="mx-1.5 text-gray-300">•</span>
                      <ClockIcon size={14} className="text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">{item.preparationTime} min</span>
                    </>
                  )}
                  {item.stock !== undefined && (
                    <>
                      <span className="mx-1.5 text-gray-300">•</span>
                      <PackageIcon size={14} className="text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">{item.stock} en stock</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-lg">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.price)}
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.available ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-end space-x-2">
              <button
                className={softBtn('blue')}
                onClick={() => {
                  setSelectedMenuItem(item);
                  setShowMenuItemModal(true);
                }}
              >
                <EditIcon size={16} className="mr-1" />
                Editar
              </button>
              <button
                className={softBtn('red')}
                onClick={() => {
                  if (confirm(`¿Está seguro de eliminar "${item.name}" del menú?`)) {
                    deleteMenuItem(item.id);
                  }
                }}
              >
                <TrashIcon size={16} className="mr-1" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {filteredMenuItems.length === 0 && (
          <div className="text-center py-8 col-span-1 md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
            <GlassWaterIcon size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No hay productos que coincidan con los filtros seleccionados</p>
          </div>
        )}
      </div>

      {/* Modales de tipos/categorías */}
      {showAllProductTypes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Todos los tipos de producto</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowAllProductTypes(false)} aria-label="Cerrar">
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                <button
                  className={`px-3 py-2 rounded-lg text-sm text-left ${
                    menuFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => {
                    setMenuFilter('all');
                    setShowAllProductTypes(false);
                  }}
                >
                  Todos los productos
                </button>
                {productTypes.map((type) => (
                  <button
                    key={type.id}
                    className={`px-3 py-2 rounded-lg text-sm text-left flex items-center justify-between ${
                      menuFilter === type.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => {
                      setMenuFilter(type.id);
                      setMenuCategoryFilter('all');
                      setShowAllProductTypes(false);
                    }}
                  >
                    <div className="flex items-center">
                      {getIconByName(type.icon, 16, 'mr-2')} {type.name}
                    </div>
                    <button
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductType(type);
                        setShowProductTypeModal(true);
                        setShowAllProductTypes(false);
                      }}
                      aria-label={`Editar tipo ${type.name}`}
                    >
                      <EditIcon size={14} />
                    </button>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <button
                className={softBtn('green')}
                onClick={() => {
                  setSelectedProductType(null);
                  setShowProductTypeModal(true);
                  setShowAllProductTypes(false);
                }}
              >
                <TagIcon size={16} className="mr-1" />
                Nuevo tipo
              </button>
              <button className={softBtn('gray')} onClick={() => setShowAllProductTypes(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAllCategories && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Todas las categorías</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowAllCategories(false)} aria-label="Cerrar">
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="mb-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FilterIcon size={14} className="text-gray-400" />
                  </div>
                  <select
                    className="pl-10 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={menuFilter === 'all' ? 'all' : menuFilter}
                    onChange={(e) => (e.target.value === 'all' ? setMenuFilter('all') : setMenuFilter(e.target.value))}
                    aria-label="Filtrar por tipo"
                  >
                    <option value="all">Todos los tipos</option>
                    {productTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  className={`px-3 py-2 rounded-lg text-sm text-left ${
                    menuCategoryFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => {
                    setMenuCategoryFilter('all');
                    setShowAllCategories(false);
                  }}
                >
                  Todas las categorías
                </button>
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                      menuCategoryFilter === category.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <button
                      className="text-left flex-1"
                      onClick={() => {
                        setMenuCategoryFilter(category.id);
                        setShowAllCategories(false);
                      }}
                    >
                      {category.name}
                    </button>
                    <button
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryModal(true);
                        setShowAllCategories(false);
                      }}
                      aria-label={`Editar categoría ${category.name}`}
                    >
                      <EditIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <button
                className={softBtn('purple')}
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoryModal(true);
                  setShowAllCategories(false);
                }}
              >
                <ListIcon size={16} className="mr-1" />
                Nueva categoría
              </button>
              <button className={softBtn('gray')} onClick={() => setShowAllCategories(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de item de menú */}
      {showMenuItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{selectedMenuItem ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowMenuItemModal(false)} aria-label="Cerrar">
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
                  <input
                    type="text"
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre del producto"
                    defaultValue={selectedMenuItem?.name}
                    id="menuItemName"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción breve del producto"
                    rows={2}
                    defaultValue={selectedMenuItem?.description}
                    id="menuItemDescription"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Precio en COP"
                      defaultValue={selectedMenuItem?.price}
                      id="menuItemPrice"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de preparación (min)</label>
                    <input
                      type="number"
                      min="0"
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Minutos"
                      defaultValue={selectedMenuItem?.preparationTime}
                      id="menuItemPrepTime"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de producto</label>
                    <select
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={selectedMenuItem?.type || 'food'}
                      id="menuItemType"
                    >
                      {productTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={selectedMenuItem?.category}
                      id="menuItemCategory"
                    >
                      {menuCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
                    <input
                      type="number"
                      min="0"
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cantidad en stock"
                      defaultValue={selectedMenuItem?.stock}
                      id="menuItemStock"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alerta stock mínimo</label>
                    <input
                      type="number"
                      min="0"
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Stock mínimo"
                      defaultValue={selectedMenuItem?.stockAlert}
                      id="menuItemStockAlert"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="available" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked={selectedMenuItem?.available !== false} />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-900">Disponible para la venta</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isCombo"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    defaultChecked={selectedMenuItem?.isCombo === true}
                    onChange={(e) => {
                      const comboSection = document.getElementById('comboItemsSection');
                      if (comboSection) comboSection.style.display = e.target.checked ? 'block' : 'none';
                    }}
                  />
                  <label htmlFor="isCombo" className="ml-2 block text-sm text-gray-900">Es un combo o promoción</label>
                </div>

                {/* Selector de productos para combos */}
                <div id="comboItemsSection" className={selectedMenuItem?.isCombo ? 'block' : 'hidden'}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Productos incluidos en el combo</label>
                  <div className="border border-gray-200 rounded-lg p-2 max-h-32 overflow-y-auto">
                    {menuItems
                      .filter((it) => !it.isCombo)
                      .map((it) => (
                        <div key={it.id} className="flex items-center py-1">
                          <input type="checkbox" id={`combo-item-${it.id}`} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked={selectedMenuItem?.comboItems?.includes(it.id)} />
                          <label htmlFor={`combo-item-${it.id}`} className="ml-2 block text-sm text-gray-900">
                            {it.name}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button className={softBtn('gray')} onClick={() => setShowMenuItemModal(false)}>
                Cancelar
              </button>
              <button
                className={ctaGrad()}
                onClick={() => {
                  const nameInput = document.getElementById('menuItemName') as HTMLInputElement;
                  const descriptionInput = document.getElementById('menuItemDescription') as HTMLTextAreaElement;
                  const priceInput = document.getElementById('menuItemPrice') as HTMLInputElement;
                  const prepTimeInput = document.getElementById('menuItemPrepTime') as HTMLInputElement;
                  const typeInput = document.getElementById('menuItemType') as HTMLSelectElement;
                  const categoryInput = document.getElementById('menuItemCategory') as HTMLSelectElement;
                  const stockInput = document.getElementById('menuItemStock') as HTMLInputElement;
                  const stockAlertInput = document.getElementById('menuItemStockAlert') as HTMLInputElement;
                  const availableInput = document.getElementById('available') as HTMLInputElement;
                  const isComboInput = document.getElementById('isCombo') as HTMLInputElement;

                  const name = nameInput.value.trim();
                  const description = descriptionInput.value.trim();
                  const price = parseInt(priceInput.value) || 0;
                  const preparationTime = parseInt(prepTimeInput.value) || undefined;
                  const type = typeInput.value;
                  const category = categoryInput.value;
                  const stock = stockInput.value ? parseInt(stockInput.value) : undefined;
                  const stockAlert = stockAlertInput.value ? parseInt(stockAlertInput.value) : undefined;
                  const available = availableInput.checked;
                  const isCombo = isComboInput.checked;

                  const comboItems: string[] = [];
                  if (isCombo) {
                    menuItems
                      .filter((it) => !it.isCombo)
                      .forEach((it) => {
                        const checkbox = document.getElementById(`combo-item-${it.id}`) as HTMLInputElement;
                        if (checkbox?.checked) comboItems.push(it.id);
                      });
                  }

                  if (!name) return showToast('error', 'El nombre del producto es obligatorio');
                  if (price <= 0) return showToast('error', 'El precio debe ser mayor que cero');

                  if (selectedMenuItem) {
                    updateMenuItem({
                      ...selectedMenuItem,
                      name,
                      description,
                      price,
                      preparationTime,
                      type,
                      category,
                      stock,
                      stockAlert,
                      available,
                      isCombo,
                      comboItems: isCombo ? comboItems : undefined
                    });
                  } else {
                    addMenuItem({
                      name,
                      description,
                      price,
                      preparationTime,
                      type,
                      category,
                      stock,
                      stockAlert,
                      available,
                      isCombo,
                      comboItems: isCombo ? comboItems : undefined
                    });
                  }
                }}
              >
                <SaveIcon size={16} className="mr-1" />
                {selectedMenuItem ? 'Actualizar producto' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Espaciador para que la sticky no tape el contenido */}
      <div className="h-24 md:hidden" aria-hidden />

      {/* ===== BARRA STICKY EN MOBILE — MISMA ALTURA QUE "NUEVA RESERVACIÓN" ===== */}
      <div
        className="fixed md:hidden left-0 right-0 z-[1] bg-white/90 backdrop-blur border-t border-gray-200 px-4 pointer-events-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
        role="region"
        aria-label="Acciones de menú"
      >
        <div className="py-2">
          <button
            className={`w-full inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pointer-events-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700`}
            onClick={() => {
              setSelectedMenuItem(null);
              setShowMenuItemModal(true);
            }}
            aria-label="Crear nuevo producto"
          >
            <PlusIcon size={18} className="mr-2" />
            Nuevo producto
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
