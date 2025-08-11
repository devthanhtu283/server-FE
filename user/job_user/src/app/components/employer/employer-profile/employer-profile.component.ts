// src/app/employer-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployerDTO } from 'src/app/models/employer.model';
import { BaseUrl } from 'src/app/services/baseUrl.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-employer-profile',
  templateUrl: './employer-profile.component.html',
  styleUrls: ['./employer-profile.component.css']
})
export class EmployerProfileComponent implements OnInit {
  employerForm: FormGroup;
  employer: EmployerDTO | null = null;
  logoFile: File | null = null;
  coverImgFile: File | null = null;
  logoPreview: string | null = null;
  coverImgPreview: string | null = null;
  user: any;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router,
    private baseUrl: BaseUrl
  ) {
    // Initialize form in constructor
    this.employerForm = this.fb.group({
      companyName: ['', Validators.required],
      companyProfile: [''],
      contactInfo: ['', [Validators.required, Validators.email]],
      address: [''],
      mapLink: [''],
      amount: [0, Validators.min(0)],
      description: [''],
      foundedIn: ['', Validators.pattern(/^\d{4}$/)],
      teamMember: [''],
      companyField: [''],
      companyLink: ['', Validators.pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)]
    });
  }

  ngOnInit(): void {
    // Check localStorage for user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) {
      console.error('No user or user ID found in localStorage:', user);
      alert('Please log in to access this page');
      this.router.navigate(['/']);
      return;
    }
    this.user = user;
    console.log('User ID:', this.user.id);

    // Fetch employer data
    console.log('Fetching employer data for ID:', this.user.id);
    this.userService.findByIdEmployer(this.user.id)
      .then((response: any) => {
        console.log('findByIdEmployer response:', response);
        let employerData: EmployerDTO;
        if (response && response.data) {
          employerData = response.data;
        } else if (response) {
          employerData = response; // Handle direct EmployerDTO response
        } else {
          throw new Error('No employer data found in response');
        }

        this.employer = employerData;
        console.log('Employer data:', this.employer);
        this.employerForm.patchValue({
          companyName: employerData.companyName || '',
          companyProfile: employerData.companyProfile || '',
          contactInfo: employerData.contactInfo || '',
          address: employerData.address || '',
          mapLink: employerData.mapLink || '',
          amount: employerData.amount || 0,
          description: employerData.description || '',
          foundedIn: employerData.foundedIn || '',
          teamMember: employerData.teamMember || '',
          companyField: employerData.companyField || '',
          companyLink: employerData.companyLink || ''
        });
        console.log('Form values after patch:', this.employerForm.value);
        // Set image previews
        this.logoPreview = employerData.logo ? `${this.baseUrl.getUserImageUrl()}${employerData.logo}` : null;
        this.coverImgPreview = employerData.coverImg ? `${this.baseUrl.getUserImageUrl()}${employerData.coverImg}` : null;
      })
      .catch((err) => {
        console.error('Error fetching employer:', err);
        alert('Failed to load employer data: ' + (err.message || 'Unknown error'));
      });
  }

  // Handle logo file selection
  onLogoFileChange(event: any): void {
    this.logoFile = event.target.files[0] || null;
    if (this.logoFile) {
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
        console.log('Logo preview updated:', this.logoPreview);
      };
      reader.readAsDataURL(this.logoFile);
    } else {
      this.logoPreview = this.employer?.logo ? `${this.baseUrl.getUserImageUrl()}${this.employer.logo}` : null;
    }
  }

  // Handle cover image file selection
  onCoverImgFileChange(event: any): void {
    this.coverImgFile = event.target.files[0] || null;
    if (this.coverImgFile) {
      const reader = new FileReader();
      reader.onload = () => {
        this.coverImgPreview = reader.result as string;
        console.log('Cover image preview updated:', this.coverImgPreview);
      };
      reader.readAsDataURL(this.coverImgFile);
    } else {
      this.coverImgPreview = this.employer?.coverImg ? `${this.baseUrl.getUserImageUrl()}${this.employer.coverImg}` : null;
    }
  }

  // Handle form submission
  onSubmit(): void {
    if (this.employerForm.valid && this.employer) {
      const employerDTO: EmployerDTO = {
        ...this.employerForm.value,
        id: this.user.id,
        logo: this.employer.logo || null, // Preserve existing logo if not updated
        coverImg: this.employer.coverImg || null // Preserve existing coverImg if not updated
      };
      console.log('Submitting employerDTO:', employerDTO);
      console.log('Logo file:', this.logoFile);
      console.log('Cover image file:', this.coverImgFile);

      this.userService.updateEmployerProfile(employerDTO, this.logoFile, this.coverImgFile)
        .then((response: any) => {
          console.log('updateEmployerProfile response:', response);
          if (response && response.data) {
            alert('Profile updated successfully');
            this.employer = response.data;
            this.employerForm.patchValue(response.data);
            this.logoFile = null;
            this.coverImgFile = null;
            // Update previews
            this.logoPreview = response.data.logo ? `${this.baseUrl.getUserImageUrl()}${response.data.logo}` : null;
            this.coverImgPreview = response.data.coverImg ? `${this.baseUrl.getUserImageUrl()}${response.data.coverImg}` : null;
            // Reset file input fields
            const logoInput = document.getElementById('logo') as HTMLInputElement;
            const coverImgInput = document.getElementById('coverImg') as HTMLInputElement;
            if (logoInput) logoInput.value = '';
            if (coverImgInput) coverImgInput.value = '';
          } else {
            throw new Error('Invalid response from server');
          }
        })
        .catch((err) => {
          console.error('Error updating employer:', err);
          alert('Failed to update profile: ' + (err.message || 'Unknown error'));
        });
    } else {
      alert('Hãy điền đầy đủ và đúng chuẩn thông tin!');
    }
  }
}