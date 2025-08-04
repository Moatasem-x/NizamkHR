import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SystemSettingService } from '../../Services/system-setting-service';
import { ISystemSettings } from '../../Interfaces/isystem-settings';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './system-settings.html',
  styleUrl: './system-settings.css',
  animations: [
    trigger('modalAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('220ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('180ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class SystemSettings implements OnInit {
  @Output() close = new EventEmitter<void>();
  settingsForm!: FormGroup;
  weekendOptions = [
    'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ];
  currentSettings: ISystemSettings | null = null;

  constructor(
    private fb: FormBuilder,
    private systemSettingService: SystemSettingService
  ) {
    // Initialize form immediately to prevent template errors
    this.initForm();
  }

  ngOnInit(): void {
    this.systemSettingService.getCurrentSystemSettings().subscribe({
      next: (settings) => {
        console.log("next")
        this.currentSettings = settings;
        console.log(this.currentSettings);
        this.updateFormWithSettings(settings); // Update form with loaded data
      },
      error: (err) => {
        console.log("err");
        // Form is already initialized with defaults
      }
    });
  }

  initForm() {
    this.settingsForm = this.fb.group({
      bonusValue: ['', [Validators.required, Validators.min(0)]],
      deductionValue: ['', [Validators.required, Validators.min(0)]],
      hoursRate: ['Money', Validators.required],
      weekend1: ['', Validators.required],
      weekend2: [{ value: '', disabled: true }, []],
    });

    this.settingsForm.get('weekend1')?.valueChanges.subscribe(val => {
      if (val) {
        this.settingsForm.get('weekend2')?.enable();
      } else {
        this.settingsForm.get('weekend2')?.disable();
        this.settingsForm.get('weekend2')?.setValue('');
      }
    });
  }

  updateFormWithSettings(settings: ISystemSettings) {
    if (settings) {
      this.settingsForm.patchValue({
        bonusValue: settings.bonusValue ?? '',
        deductionValue: settings.deductionValue ?? '',
        hoursRate: settings.hoursRate ?? 'Money',
        weekend1: settings.weekend1 ?? '',
        weekend2: settings.weekend2 ?? ''
      });
      
      // Handle weekend2 disabled state
      if (settings.weekend1) {
        this.settingsForm.get('weekend2')?.enable();
      } else {
        this.settingsForm.get('weekend2')?.disable();
      }
    }
    console.log(settings);
  }

  saveSettings() {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }
    const formValue = this.settingsForm.getRawValue();
    console.log(formValue);
    // If weekend2 is empty string, set to null
    if (!formValue.weekend2) {
      formValue.weekend2 = null;
    }
    this.systemSettingService.updateSystemSettings(this.currentSettings!.id!, formValue).subscribe({
      next: () => {
        this.close.emit();
      },
      error: (err) => {
        console.log("error:", err);
      }
    });
  }

  setBonusType(type: string) {
    this.settingsForm.get('hoursRate')?.setValue(type);
  }

  closeModal() {
    this.close.emit();
  }
}
