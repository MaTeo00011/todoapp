import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

  constructor() {
    // Opcional: Cargar carrito del localStorage al iniciar
    this.loadCartFromStorage();
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

  // 📊 OBTENER cantidad total de items
  getTotalItems(): number {
    return this.cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
  }
}