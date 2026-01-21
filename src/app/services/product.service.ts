
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Interface para tipar nuestros productos
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: 'COP' | 'USD';
  stock: number;
  icon: string; // Emoji (mantener para compatibilidad)
  image?: string; // ← NUEVO: URL de imagen en base64
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  
  // BehaviorSubject para lista de productos
  private products = new BehaviorSubject<Product[]>([]);
  products$ = this.products.asObservable();
  
  // ID auto-incremental
  private nextId = 1;

  constructor() {
    // Cargar productos del localStorage al iniciar
    this.loadProductsFromStorage();
  }

  // 📚 OBTENER todos los productos
  getProducts(): Product[] {
    return this.products.value;
  }

  // 🔍 OBTENER producto por ID
  getProductById(id: number): Product | undefined {
    return this.products.value.find(p => p.id === id);
  }

  // ➕ AGREGAR nuevo producto
  addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const currentProducts = this.products.value;
    // Calcular el próximo ID basado en el máximo ID existente + 1
    const maxId = currentProducts.length > 0 ? Math.max(...currentProducts.map(p => p.id)) : 0;
    const newId = maxId + 1;
    
    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    currentProducts.push(newProduct);
    
    this.products.next(currentProducts);
    this.saveProductsToStorage();
    
    return newProduct;
  }

  // ✏️ ACTUALIZAR producto existente
  updateProduct(id: number, productData: Partial<Product>): Product | null {
    const currentProducts = this.products.value;
    const index = currentProducts.findIndex(p => p.id === id);
    
    if (index === -1) {
      return null; // Producto no encontrado
    }
    
    // Actualizar producto manteniendo id y createdAt
    currentProducts[index] = {
      ...currentProducts[index],
      ...productData,
      id: currentProducts[index].id, // Mantener ID original
      createdAt: currentProducts[index].createdAt, // Mantener fecha de creación
      updatedAt: new Date() // Actualizar fecha de modificación
    };
    
    this.products.next(currentProducts);
    this.saveProductsToStorage();
    
    return currentProducts[index];
  }

  // 🗑️ ELIMINAR producto
  deleteProduct(id: number): boolean {
    const currentProducts = this.products.value;
    const filteredProducts = currentProducts.filter(p => p.id !== id);
    
    if (filteredProducts.length === currentProducts.length) {
      return false; // No se encontró el producto
    }
    
    // Reenumerar IDs secuencialmente después de eliminar
    filteredProducts.forEach((product, index) => {
      product.id = index + 1;
      product.updatedAt = new Date(); // Actualizar fecha de modificación
    });
    
    this.products.next(filteredProducts);
    this.updateNextId();
    this.saveProductsToStorage();
    
    return true;
  }

  // 💾 GUARDAR en localStorage
  private saveProductsToStorage(): void {
    localStorage.setItem('products', JSON.stringify(this.products.value));
    localStorage.setItem('nextProductId', this.nextId.toString());
  }

  // 🔄 ACTUALIZAR nextId basado en productos existentes
  private updateNextId(): void {
    const currentProducts = this.products.value;
    this.nextId = currentProducts.length > 0 ? Math.max(...currentProducts.map(p => p.id)) + 1 : 1;
  }

  // 📥 CARGAR desde localStorage
  private loadProductsFromStorage(): void {
    const savedProducts = localStorage.getItem('products');
    const savedNextId = localStorage.getItem('nextProductId');
    
    if (savedProducts) {
      try {
        const products = JSON.parse(savedProducts);
        // Convertir strings de fecha a objetos Date
        products.forEach((p: Product) => {
          p.createdAt = new Date(p.createdAt);
          p.updatedAt = new Date(p.updatedAt);
        });
        this.products.next(products);
        // Calcular nextId basado en los productos cargados
        this.updateNextId();
      } catch (error) {
        console.error('Error al cargar productos:', error);
        this.initializeDefaultProducts();
      }
    } else {
      // Si no hay productos guardados, inicializar con productos por defecto
      this.initializeDefaultProducts();
    }
  }

  // 🎯 INICIALIZAR productos por defecto (los 6 que ya tienes)
  private initializeDefaultProducts(): void {
    const defaultProducts = [
      {
        name: 'Proteína Whey Pro',
        description: '25g de proteína pura por porción. Ideal para recuperación muscular.',
        price: 49.99,
        currency: 'USD' as const,
        stock: 15,
        icon: '🥤',
        category: 'Proteínas'
      },
      {
        name: 'Pre-Workout Extreme',
        description: 'Energía explosiva para entrenamientos intensos.',
        price: 39.99,
        currency: 'USD' as const,
        stock: 20,
        icon: '⚡',
        category: 'Pre-Workout'
      },
      {
        name: 'Creatina Monohidrato',
        description: 'Aumenta tu fuerza y masa muscular. 100% pura.',
        price: 29.99,
        currency: 'USD' as const,
        stock: 30,
        icon: '💊',
        category: 'Creatina'
      },
      {
        name: 'Quemador Turbo',
        description: 'Acelera tu metabolismo y alcanza tus objetivos.',
        price: 44.99,
        currency: 'USD' as const,
        stock: 10,
        icon: '🔥',
        category: 'Quemadores'
      },
      {
        name: 'BCAA Recovery',
        description: 'Recuperación muscular óptima con aminoácidos.',
        price: 34.99,
        currency: 'USD' as const,
        stock: 25,
        icon: '🥛',
        category: 'Recuperación'
      },
      {
        name: 'Multivitamínico Premium',
        description: 'Complejo vitamínico completo para tu salud.',
        price: 24.99,
        currency: 'USD' as const,
        stock: 50,
        icon: '💎',
        category: 'Vitaminas'
      }
    ];

    defaultProducts.forEach(product => this.addProduct(product));
  }

  // 🔄 RESETEAR productos a los valores por defecto
  resetToDefaults(): void {
    this.products.next([]);
    this.nextId = 1;
    this.initializeDefaultProducts();
  }
}