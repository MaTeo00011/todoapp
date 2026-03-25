import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProductService } from './product.service';

// Interface para tipar nuestros productos en el carrito
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  icon: string;
  image?: string;
  currency?: 'COP' | 'USD';
  maxStock: number; // Máximo disponible
}

export interface Sale {
  id: number;
  date: Date;
  items: CartItem[];
  total: number;
  currency: 'COP' | 'USD';
}

@Injectable({
  providedIn: 'root' // Hace que el servicio esté disponible en toda la app
})
export class CartService {
  
  // BehaviorSubject = Observable que guarda el último valor
  // Permite que múltiples componentes se "suscriban" a los cambios
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  
  // Observable público que los componentes pueden escuchar
  cartItems$ = this.cartItems.asObservable();
  
  // Total del carrito
  private cartTotal = new BehaviorSubject<number>(0);
  cartTotal$ = this.cartTotal.asObservable();
  
  // Estado del sidebar (abierto/cerrado)
  private sidebarOpen = new BehaviorSubject<boolean>(false);
  sidebarOpen$ = this.sidebarOpen.asObservable();

  // Ventas guardadas
  private sales = new BehaviorSubject<Sale[]>([]);
  sales$ = this.sales.asObservable();
  private nextSaleId = 1;

  constructor(private productService: ProductService) {
    // Opcional: Cargar carrito y ventas desde localStorage al iniciar
    this.loadCartFromStorage();
    this.loadSalesFromStorage();
  }

  // 🛒 AGREGAR producto al carrito
  addToCart(product: any) {
    const currentCart = this.cartItems.value;
    
    // Verificar si el producto ya existe en el carrito
    const existingItem = currentCart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Si existe, aumentar cantidad (respetando límite)
      if (existingItem.quantity < existingItem.maxStock) {
        existingItem.quantity++;
      } else {
        alert(`⚠️ Stock máximo alcanzado para ${product.name}`);
        return;
      }
    } else {
      // Si no existe, agregarlo como nuevo item
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        icon: product.icon,
        image: product.image,
        currency: product.currency,
        maxStock: product.stock || 10 // Default: 10 unidades
      };
      currentCart.push(newItem);
    }
    
    // Actualizar el carrito y el total
    this.cartItems.next(currentCart);
    this.calculateTotal();
    this.saveCartToStorage();
    
    // Abrir el sidebar automáticamente
    this.openSidebar();
  }

  // ➕ AUMENTAR cantidad
  increaseQuantity(productId: number) {
    const currentCart = this.cartItems.value;
    const item = currentCart.find(i => i.id === productId);
    
    if (item && item.quantity < item.maxStock) {
      item.quantity++;
      this.cartItems.next(currentCart);
      this.calculateTotal();
      this.saveCartToStorage();
    }
  }

  // ➖ DISMINUIR cantidad (mínimo 1)
  decreaseQuantity(productId: number) {
    const currentCart = this.cartItems.value;
    const item = currentCart.find(i => i.id === productId);
    
    if (item && item.quantity > 1) {
      item.quantity--;
      this.cartItems.next(currentCart);
      this.calculateTotal();
      this.saveCartToStorage();
    }
  }

  // 🗑️ ELIMINAR producto del carrito
  removeFromCart(productId: number) {
    const currentCart = this.cartItems.value.filter(item => item.id !== productId);
    this.cartItems.next(currentCart);
    this.calculateTotal();
    this.saveCartToStorage();
  }

  // 🧹 VACIAR carrito completo
  clearCart() {
    this.cartItems.next([]);
    this.cartTotal.next(0);
    localStorage.removeItem('cart');
  }

  // 💰 CALCULAR total
  private calculateTotal() {
    const total = this.cartItems.value.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    this.cartTotal.next(total);
  }

  // 📂 ABRIR sidebar
  openSidebar() {
    this.sidebarOpen.next(true);
  }

  // ❌ CERRAR sidebar
  closeSidebar() {
    this.sidebarOpen.next(false);
  }

  // 💾 GUARDAR en localStorage (persistencia)
  private saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(this.cartItems.value));
  }

  // 📥 CARGAR desde localStorage
  private loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      this.cartItems.next(cart);
      this.calculateTotal();
    }
  }
  // 📂 CARGAR ventas desde localStorage
  private loadSalesFromStorage() {
    const savedSales = localStorage.getItem('sales');
    if (savedSales) {
      try {
        const sales: Sale[] = JSON.parse(savedSales).map((s: any) => ({
          ...s,
          date: new Date(s.date)
        }));
        this.sales.next(sales);
        this.nextSaleId = sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1;
      } catch (error) {
        console.error('Error al cargar ventas:', error);
      }
    }
  }

  // 💾 GUARDAR ventas en localStorage
  private saveSalesToStorage() {
    localStorage.setItem('sales', JSON.stringify(this.sales.value));
  }

  // ↩️ OBTENER ventas
  getSales(): Sale[] {
    return this.sales.value;
  }

  // 📅 Filtrar ventas de hoy
  getSalesToday(): Sale[] {
    const today = new Date().toDateString();
    return this.sales.value.filter(sale => new Date(sale.date).toDateString() === today);
  }

  // 💳 Procesar checkout y crear registro de venta
  checkout() {
    const currentCart = this.cartItems.value;
    const total = this.cartTotal.value;

    if (currentCart.length === 0) {
      alert('El carrito está vacío. Agrega productos antes de finalizar compra.');
      return;
    }

    // Validar stock y decrementar en producto
    for (const item of currentCart) {
      const product = this.productService.getProductById(item.id);
      if (!product) {
        alert(`⚠️ El producto ${item.name} ya no está disponible.`);
        return;
      }

      if (item.quantity > product.stock) {
        alert(`⚠️ No hay suficiente stock de ${product.name} (disponible: ${product.stock}).`);
        return;
      }
    }

    for (const item of currentCart) {
      const product = this.productService.getProductById(item.id);
      if (product) {
        this.productService.updateProduct(item.id, { stock: product.stock - item.quantity });
      }
    }

    const newSale: Sale = {
      id: this.nextSaleId++,
      date: new Date(),
      items: JSON.parse(JSON.stringify(currentCart)),
      total,
      currency: this.getCurrency()
    };

    this.sales.next([...this.sales.value, newSale]);
    this.saveSalesToStorage();

    this.clearCart();
    alert(`🎉 Compra registrada. Total de venta: ${this.formatPrice(total, newSale.currency)}`);
  }

  // 💱 Obtener moneda del carrito (o USD por defecto)
  getCurrency(): 'COP' | 'USD' {
    const firstItem = this.cartItems.value[0];
    return firstItem?.currency ?? 'USD';
  }

  // Formatear precio en string para alertas
  formatPrice(price: number, currency: 'COP' | 'USD'): string {
    if (currency === 'COP') {
      return `$${Math.round(price).toLocaleString('es-CO')} COP`;
    }
    return `$${price.toFixed(2)} USD`;
  }

  // 📊 OBTENER cantidad total de items
  getTotalItems(): number {
    return this.cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
  }
}