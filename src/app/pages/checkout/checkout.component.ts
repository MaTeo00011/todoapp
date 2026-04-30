import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart.service';

interface CustomerInfo {
  email: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  paymentMethod: 'nequi' | 'card' | 'transfer';
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  cartTotal = 0;
  currency: 'COP' | 'USD' = 'USD';
  currentStep: 'review' | 'shipping' | 'payment' | 'confirm' = 'review';
  isProcessing = false;
  readonly freeShippingThresholdCOP = 100000;
  readonly copToUsdRate = 5000;

  customerInfo: CustomerInfo = {
    email: '',
    fullName: '',
    phone: '',
    city: '',
    address: '',
    paymentMethod: 'nequi'
  };

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit() {
    if (this.cartItems.length === 0) {
        this.cartService.cartItems$.subscribe(items => {
        this.cartItems = items;
        this.currency = this.cartService.getCurrency();
      });

      this.cartService.cartTotal$.subscribe(total => {
        this.cartTotal = total;
      });
    }
  }

  nextStep() {
    if (this.currentStep === 'review') {
      this.currentStep = 'shipping';
    } else if (this.currentStep === 'shipping') {
      if (this.validateShipping()) {
        this.currentStep = 'payment';
      }
    } else if (this.currentStep === 'payment') {
      this.currentStep = 'confirm';
    }
  }

  previousStep() {
    if (this.currentStep === 'shipping') {
      this.currentStep = 'review';
    } else if (this.currentStep === 'payment') {
      this.currentStep = 'shipping';
    } else if (this.currentStep === 'confirm') {
      this.currentStep = 'payment';
    }
  }

  validateShipping(): boolean {
    const { email, fullName, phone, city, address } = this.customerInfo;
    if (!email || !fullName || !phone || !city || !address) {
      alert('Por favor, completa todos los campos de envío.');
      return false;
    }
    if (!this.isValidEmail(email)) {
      alert('Por favor, ingresa un email válido.');
      return false;
    }
    if (!this.isValidPhone(phone)) {
      alert('Por favor, ingresa un número de teléfono válido.');
      return false;
    }
    return true;
  }

  isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  isValidPhone(phone: string): boolean {
    // Acepta números con 7-15 dígitos, permitiendo guiones y espacios
    const regex = /^[\d\s\-\+\(\)]{7,15}$/;
    return regex.test(phone);
  }

  confirmPurchase() {
    if (this.cartItems.length === 0) {
      alert('Tu carrito está vacío. Agrega productos antes de continuar.');
      this.router.navigate(['/home']);
      return;
    }

    this.isProcessing = true;
    // Simular procesamiento de pago
    setTimeout(() => {
      this.cartService.checkout();
      this.isProcessing = false;
      alert(`✅ Compra exitosa!\n\nPedido confirmado para ${this.customerInfo.fullName}\nSe enviará a: ${this.customerInfo.address}, ${this.customerInfo.city}`);
      this.router.navigate(['/home']);
    }, 1500);
  }

  goBack() {
    if (this.currentStep === 'review') {
      this.router.navigate(['/home']);
    } else {
      this.previousStep();
    }
  }

  getShippingThreshold(currency: 'COP' | 'USD'): number {
    return currency === 'COP'
      ? this.freeShippingThresholdCOP
      : Math.round(this.freeShippingThresholdCOP / this.copToUsdRate);
  }

  isShippingFree(amount: number, currency: 'COP' | 'USD'): boolean {
    return amount >= this.getShippingThreshold(currency);
  }

  getShippingCost(amount: number, currency: 'COP' | 'USD'): number {
    return this.isShippingFree(amount, currency) ? 0 : (currency === 'COP' ? 12000 : 2.5);
  }

  getShippingLabel(amount: number, currency: 'COP' | 'USD'): string {
    if (this.isShippingFree(amount, currency)) {
      return 'Gratis';
    }
    const cost = this.getShippingCost(amount, currency);
    return currency === 'COP'
      ? `$${Math.round(cost).toLocaleString('es-CO')} COP`
      : `$${cost.toFixed(2)} USD`;
  }

  getOrderTotal(amount: number, currency: 'COP' | 'USD'): number {
    return amount + this.getShippingCost(amount, currency);
  }

  formatPrice(price: number): string {
    if (this.currency === 'COP') {
      return `$${Math.round(price).toLocaleString('es-CO')} COP`;
    }
    return `$${price.toFixed(2)} USD`;
  }

  getItemSubtotal(item: CartItem): string {
    const subtotal = item.price * item.quantity;
    const itemCurrency = item.currency ?? 'USD';
    if (itemCurrency === 'COP') {
      return `$${Math.round(subtotal).toLocaleString('es-CO')} COP`;
    }
    return `$${subtotal.toFixed(2)} USD`;
  }

  getPaymentMethodLabel(): string {
    const labels: { [key: string]: string } = {
      nequi: '📱 Nequi',
      card: '💳 Tarjeta de Crédito',
      transfer: '🏦 Transferencia Bancaria'
    };
    return labels[this.customerInfo.paymentMethod] || 'Nequi';
  }
}
