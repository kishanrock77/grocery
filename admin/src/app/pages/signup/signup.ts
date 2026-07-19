// signup.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { Common } from '../../services/common';

@Component({
  selector: 'signup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})

export class Signup {
  signupForm;
  states = ['Uttar Pradesh'];
  cities = ['Budhana', 'Shahpur'];
  constructor(private fb: FormBuilder, private common: Common,


    private auth: AuthService, private router: Router) {
    if (this.auth.isloggedIn()) {
      let session = this.auth.getSession();
      if (session.userType === 'admin') this.router.navigate(['/admin-dashboard']);
      else if (session.userType === 'deliveryboy') this.router.navigate(['/deliveryboy-dashboard']);
    }
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      state: ['Uttar Pradesh', Validators.required],
      city: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }
  onStateChange(event: any) {
    const state = event.target.value;
    if (state === 'Delhi') this.cities = ['New Delhi'];
    else if (state === 'Maharashtra') this.cities = ['Mumbai', 'Pune', 'Nagpur'];
    else if (state === 'Karnataka') this.cities = ['Bengaluru', 'Mysore'];
    else if (state === 'Uttar Pradesh') this.cities = ['Budhana', 'Shahpur'];
    else this.cities = [];
  }
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }
  signup() {
    if (this.signupForm.invalid) {
      this.common.alertmessage('Please fill all fields correctly', 'Alert', 'warning');
      return;
    }
    if (this.signupForm.value.password !== this.signupForm.value.confirmPassword) {
      this.common.alertmessage('Passwords do not match', 'Alert', 'warning');
      return;
    }

    this.auth.signup(this.signupForm.value).subscribe({

      next: (res: any) => {
console.log(res.success);
        // ✅ API returned success false
        if (res.success === false) {

          this.common.alertmessage(
            res.msg || 'Signup failed',
            'Alert',
            'error'
          );

          return;
        }

        // ✅ Success
        this.common.alertmessage(
          'Signup successful, please login',
          'success',
          'success'
        );

        this.router.navigate(['/login']);

      },

      // ✅ Server error
      error: (err) => {

        this.common.alertmessage(
          err?.error?.msg || 'Signup failed',
          'Alert',
          'error'
        );

      }

    });
  }
}