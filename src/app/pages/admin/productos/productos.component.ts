import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService, Product } from '../../../services/product.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  
  products: Product[] = [];
  showModal = false;
  isEditMode = false;
  
  // NUEVO: Para manejar la imagen
  selectedImage: string | null = null;
  imagePreview: string | null = null;
  
  // Modelo del formulario
  productForm = {
    id: 0,
    name: '',
    description: '',
    price: 0,
    currency: 'USD' as 'COP' | 'USD',
    stock: 0,
    icon: '🛍️',
    image: '',
    category: ''

  };

  // Lista de emojis disponibles
  availableIcons = ['🥤', '⚡', '💊', '🔥', '🥛', '💎', '💪', '🏋️', '🎯', '⭐', '🌟', '✨'];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  // Cargar productos del servicio
  loadProducts() {
    this.productService.products$.subscribe(products => {
      this.products = products;
    });
  }

  // Abrir modal para agregar producto
  openAddModal() {
    this.isEditMode = false;
    this.resetForm();
    this.showModal = true;
  }

  // Abrir modal para editar producto
  openEditModal(product: Product) {
    this.isEditMode = true;
    this.productForm = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      stock: product.stock,
      icon: product.icon,
      image: product.image || '',
      category: product.category || ''
    };
    
    // Mostrar preview de imagen existente
    if (product.image) {
      this.imagePreview = product.image;
    }
    
    this.showModal = true;
  }

  // Cerrar modal
  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  // Resetear formulario
  resetForm() {
    this.productForm = {
      id: 0,
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      stock: 0,
      icon: '🛍️',
      image: '',
      category: ''
    };
    this.selectedImage = null;
    this.imagePreview = null;
  }

  // NUEVO: Manejar selección de imagen
  onImageSelected(event: any) {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('⚠️ Por favor selecciona una imagen válida (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB en bytes
    if (file.size > maxSize) {
      alert('⚠️ La imagen es muy grande. El tamaño máximo es 2MB');
      return;
    }

    // Convertir a base64 para preview y almacenamiento
    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
      this.productForm.image = e.target.result;
    };
    
    reader.onerror = () => {
      alert('❌ Error al cargar la imagen');
    };
    
    reader.readAsDataURL(file);
  }

  // NUEVO: Eliminar imagen seleccionada
  removeImage() {
    this.imagePreview = null;
    this.productForm.image = '';
    this.selectedImage = null;
    
    // Limpiar el input file
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Guardar producto (agregar o editar)
  saveProduct() {
    // Validaciones básicas
    if (!this.productForm.name || !this.productForm.description) {
      alert('⚠️ Por favor completa todos los campos obligatorios');
      return;
    }

    if (this.productForm.price <= 0) {
      alert('⚠️ El precio debe ser mayor a 0');
      return;
    }

    if (this.productForm.stock < 0) {
      alert('⚠️ El stock no puede ser negativo');
      return;
    }

    if (this.isEditMode) {
      // Actualizar producto existente
      const updated = this.productService.updateProduct(this.productForm.id, this.productForm);
      if (updated) {
        alert('✅ Producto actualizado exitosamente');
        this.closeModal();
      } else {
        alert('❌ Error al actualizar el producto');
      }
    } else {
      // Agregar nuevo producto
      const { id, ...productData } = this.productForm;
      this.productService.addProduct(productData);
      alert('✅ Producto agregado exitosamente');
      this.closeModal();
    }
  }

  // Eliminar producto
  deleteProduct(product: Product) {
    const confirmDelete = confirm(
      `¿Estás seguro de eliminar "${product.name}"?\n\nEsta acción no se puede deshacer.`
    );

    if (confirmDelete) {
      const deleted = this.productService.deleteProduct(product.id);
      if (deleted) {
        alert('✅ Producto eliminado');
      } else {
        alert('❌ Error al eliminar el producto');
      }
    }
  }

  // Formatear precio según moneda
  formatPrice(price: number, currency: string): string {
    if (currency === 'COP') {
      return `$${price.toLocaleString('es-CO')} COP`;
    } else {
      return `$${price.toFixed(2)} USD`;
    }
  }

  // Seleccionar icono
  selectIcon(icon: string) {
    this.productForm.icon = icon;
  }
}