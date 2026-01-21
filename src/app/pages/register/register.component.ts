import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GymUserService, GymUser } from '../../services/gym-user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  registerForm: FormGroup;
  showPersonalizedModal = false;
  personalizedTypes = [
    { value: 'fuerza', label: 'Fuerza' },
    { value: 'bajar_peso', label: 'Bajar de Peso' },
    { value: 'definicion', label: 'Definición' },
    { value: 'resistencia', label: 'Resistencia' },
    { value: 'tonificacion', label: 'Tonificación' }
  ];

  paymentTypes = [
    { value: 'dia', label: 'Día' },
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' },
    { value: 'trimestre', label: 'Trimestre' },
    { value: 'semestre', label: 'Semestre' },
    { value: 'ano', label: 'Año' }
  ];

  constructor(
    private fb: FormBuilder,
    private gymUserService: GymUserService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      age: ['', [Validators.required, Validators.min(10), Validators.max(100)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      trainingType: ['general', Validators.required],
      paymentType: ['mes', Validators.required],
      paymentStart: [new Date().toISOString().split('T')[0], Validators.required]  // Fecha actual por defecto
    });
  }

  onTrainingTypeChange() {
    const trainingType = this.registerForm.get('trainingType')?.value;
    if (trainingType === 'personalized') {
      this.showPersonalizedModal = true;
    }
  }

  closeModal() {
    this.showPersonalizedModal = false;
    // Resetear a general si no confirma
    this.registerForm.patchValue({ trainingType: 'general' });
  }

  confirmPersonalized(type: string) {
    // Aquí podrías agregar lógica para guardar el tipo personalizado
    // Por ahora, solo cerramos el modal
    this.showPersonalizedModal = false;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.value;
      const userData: Omit<GymUser, 'id' | 'createdAt' | 'updatedAt' | 'paymentEnd' | 'status'> = {
        ...formValue,
        paymentStart: new Date(formValue.paymentStart)
      };

      // Si es personalizado, agregar detalles (simulado)
      if (formValue.trainingType === 'personalized') {
        userData.personalizedDetails = { type: 'fuerza' };  // Por defecto, puedes expandir
      }

      this.gymUserService.addUser(userData);
      alert('Usuario registrado exitosamente!');
      this.registerForm.reset({
        trainingType: 'general',
        paymentType: 'mes',
        paymentStart: new Date().toISOString().split('T')[0]
      });
    } else {
      alert('Por favor, completa todos los campos correctamente.');
    }
  }
}