import { DatePipe, ViewportScroller } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Seeker, User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import * as moment from 'moment';
import { LocationService } from 'src/app/services/location.service';
import { BaseUrl } from 'src/app/services/baseUrl.service';

@Component({
  templateUrl: './seeker-profile.component.html',
})
export class SeekerProfileComponent implements OnInit {
  candidateForm: FormGroup;
  user: User;
  seeker: Seeker;
  fullName: string;
  phone: string;
  address: string;
  gender: string;
  avatar: string;
  photo: File;
  avatarUrl: string = 'assets/img/dashboard/no-avatar.jpg';
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  imageUrl: File | null = null;

  provinces: any[] = [];
  districts: any[] = [];
  wards: any[] = [];

  selectedProvince: number | null = null;
  selectedDistrict: number | null = null;
  selectedWard: number | null = null;
  coverImgPreview: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private locationService: LocationService,
    private router: Router,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
    private datePipe: DatePipe,
    private baseUrl: BaseUrl
  ) {}

  ngOnInit(): void {
    this.loadProvinces();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const fragment = this.route.snapshot.fragment;
        if (fragment) {
          this.viewportScroller.scrollToAnchor(fragment);
        }
      }
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const candidate = JSON.parse(localStorage.getItem('candidate'));

    if (!user) {
      this.router.navigate(['/']); // Điều hướng lại nếu không tìm thấy user
    } else {
      this.user = user; // Gán dữ liệu người dùng
      this.avatarUrl = this.getImageUrl(candidate?.avatar); // Lấy URL hình ảnh
      // Khởi tạo form với dữ liệu từ candidate nếu có
      this.candidateForm = this.formBuilder.group({
        fullName: [candidate?.fullName || ''],
        phone: [
          candidate?.phone || '',
          [Validators.pattern('^\\+?\\d{10,15}$')],
        ],
        address: [candidate?.address || ''],
        province: [null, Validators.required], // Định nghĩa field cho tỉnh
        district: [null, Validators.required], // Định nghĩa field cho quận
        ward: [null, Validators.required], // Định nghĩa field cho phường
        gender: [candidate?.gender || ''],
        dob: [candidate?.dob || ''],
      });
    }

    // Lấy thông tin từ localStorage nếu có
    if (candidate) {
      this.candidateForm.patchValue(candidate['data']);
      const formattedDob = this.convertDateFormat(candidate.dob); // Chuyển đổi định dạng
      this.candidateForm.patchValue({ dob: formattedDob });

    }

    this.userService.findByIdSeeker(this.user.id).then(
      (res) => {
        console.log("API Response:", res); // Kiểm tra dữ liệu nhận được

        if (res.data) {
          let seekerData = res.data;

          // Chuyển đổi `dob` từ `dd/MM/yyyy` → `yyyy-MM-dd`
          let formattedDob = seekerData.dob
        ? moment(seekerData.dob, 'DD/MM/YYYY').utcOffset(0, true).format('YYYY-MM-DD')
        : '';

          // Gán lại dữ liệu vào form
          this.candidateForm.patchValue({
            fullName: seekerData.fullName,
            phone: seekerData.phone,
            address: seekerData.address,
            gender: seekerData.gender,
            dob: formattedDob,  // Đảm bảo `dob` hiển thị đúng trong <input type="date">
          });

          // Cập nhật hình ảnh nếu có
          // if (seekerData.avatar) {
          //   this.imageUrl = `http://103.153.68.231:8081/assets/images/${seekerData.avatar}`;
          // }
          this.coverImgPreview = seekerData.avatar ? `${this.baseUrl.getUserImageUrl()}${seekerData.avatar}` : null;
          console.log(this.coverImgPreview);
        }
      },
      (err) => {
        console.error("Error fetching seeker data:", err);
      }
    );

    this.seeker = JSON.parse(localStorage.getItem('candidate'));
    const savedProvince = localStorage.getItem('selectedProvince');
    const savedDistrict = localStorage.getItem('selectedDistrict');
    const savedWard = localStorage.getItem('selectedWard');

    if (savedProvince) {
      this.candidateForm.patchValue({ province: JSON.parse(savedProvince) });
      this.selectedProvince = JSON.parse(savedProvince);
    }

    if (savedDistrict) {
      this.candidateForm.patchValue({ district: JSON.parse(savedDistrict) });
      this.selectedDistrict = JSON.parse(savedDistrict);

      // Gọi API lấy danh sách quận/huyện nếu có tỉnh
      this.locationService.getAllDistricts().then((data: any) => {
        if (Array.isArray(data)) {
          this.districts = data.filter((district: any) => district.province_code === Number(this.selectedProvince));
        }
      });

      // Gọi API lấy danh sách phường/xã nếu có quận/huyện
      this.locationService.getAllWards().then((data: any) => {
        if (Array.isArray(data)) {
          this.wards = data.filter((ward: any) => ward.district_code === Number(this.selectedDistrict));

          if (savedWard) {
            this.selectedWard = JSON.parse(savedWard); // ✅ Gán giá trị vào selectedWard
            this.candidateForm.patchValue({ ward: this.selectedWard });
          }
        }
      });
    }

  }

  loadProvinces() {
      this.locationService.getProvinces().then(
        (res) => {
          this.provinces = res;
        }
      )
  }

  onProvinceChange(): void {
    this.districts = [];
    this.wards = [];
    this.selectedDistrict = null;
    this.candidateForm.patchValue({ district: null, ward: null });
    const selectedProvince = this.candidateForm.get('province')?.value;
    if (selectedProvince) {
      this.locationService.getAllDistricts().then((data: any) => {
        if (Array.isArray(data)) {
          this.districts = data.filter((district: any) => district.province_code === Number(selectedProvince));
          localStorage.setItem('selectedProvince', JSON.stringify(selectedProvince));
          localStorage.setItem('districts', JSON.stringify(this.districts));
        } else {
          console.error("Dữ liệu API không phải là một mảng:", data);
        }
      });
    }
  }


  onDistrictChange(): void {
    this.wards = [];
    this.candidateForm.patchValue({ ward: null });

    const selectedDistrict = this.candidateForm.get('district')?.value;

    if (selectedDistrict) {
      this.locationService.getAllWards().then((data: any) => {
        if (Array.isArray(data)) {
          this.wards = data.filter((ward: any) => ward.district_code === Number(selectedDistrict));
          localStorage.setItem('selectedDistrict', JSON.stringify(selectedDistrict));
          localStorage.setItem('wards', JSON.stringify(this.wards));
        } else {
          this.wards = [];
        }

      });
    }
  }

  onWardChange(): void {
    const selectedWard = this.candidateForm.get('ward')?.value;
    console.log("Phường/Xã đã chọn:", selectedWard);

    if (selectedWard) {
      console.log("cc", selectedWard);
      localStorage.setItem('selectedWard', JSON.stringify(selectedWard));
      this.updateAddress();
    }
  }


  updateAddress(): void {
    const provinceCode = this.candidateForm.get('province')?.value;
    const districtCode = this.candidateForm.get('district')?.value;
    const wardCode = this.candidateForm.get('ward')?.value;


    const province = this.provinces.find(p => p.code == provinceCode)?.name || "";
    const district = this.districts.find(d => d.code == districtCode)?.name || "";
    const ward = this.wards.find(w => w.code == wardCode)?.name || "";


    const fullAddress = `${ward}, ${district}, ${province}`.trim();

    this.candidateForm.patchValue({ address: fullAddress });

  }



  // onCoverImgFileChange(evt: any) {
  //   const file = evt.target.files[0];
  //   if (file) {
  //     this.selectedFile = file;

  //     // Hiển thị preview hình ảnh
  //     const reader = new FileReader();
  //     reader.onload = () => {
  //       this.imageUrl = reader.result as string;
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // }
  onFileChange(event: any): void {
    this.imageUrl = event.target.files[0] || null;
    if (this.imageUrl) {
      const reader = new FileReader();
      reader.onload = () => {
        this.coverImgPreview = reader.result as string;
        console.log('Cover image preview updated:', this.coverImgPreview);
      };
      reader.readAsDataURL(this.imageUrl);
    } else {
      this.coverImgPreview = this.seeker?.avatar ? `${this.baseUrl.getUserImageUrl()}${this.seeker.avatar}` : null;
    }
  }


  // Hàm submit để cập nhật thông tin
  onSubmit() {
    const birthday = this.candidateForm.value.dob;
    const formattedBirthday = moment(birthday, 'YYYY-MM-DD').format('DD/MM/YYYY');

    this.seeker = {
      id: this.user.id,
      fullName: this.candidateForm.value.fullName,
      phone: this.candidateForm.value.phone,
      address: this.candidateForm.value.address,
      gender: this.candidateForm.value.gender,
      status: 1,
      dob: formattedBirthday,
      updatedAt: null,
      avatar: null,
    };
    console.log(this.seeker);

    var formData = new FormData();
    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }

    formData.append('seekerDTO', JSON.stringify(this.seeker));
    this.userService.updateCandidate(formData).then(
      (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cập nhật thành công',
          detail: 'Bạn đã cập nhật thông tin thành công.',
        });
        localStorage.removeItem('candidate');
        // this.avatarUrl = this.getImageUrl(res.data.avatar);
        // if(res.avatarUrl) {
        //   this.imageUrl = `http://103.153.68.231:8081/assets/images/${res.avatarUrl}`;
        // }
        this.coverImgPreview = null;
        localStorage.setItem('candidate', JSON.stringify(res.data));
        this.coverImgPreview = res.data.avatar ? `${this.baseUrl.getUserImageUrl()}${res.data.avatar}` : null;
        setTimeout(() => {
            this.router.navigate(['/seeker/profile']);
        }, 500);
      },
      (err) => {
        console.log(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Cập nhật thất bại',
          detail:
            'Quá trình cập nhật thông tin không thành công. Vui lòng kiểm tra lại.',
        });
        this.router.navigate(['/seeker-profile']);
      }
    );
    if (this.seeker.dob) {
      const parts = this.seeker.dob.split('/');
      // Giả sử dob có định dạng "dd/MM/yyyy"
      this.seeker.dob = `${parts[2]}-${parts[1]}-${parts[0]}`; // yyyy-MM-dd
    }


  }

  getImageUrl(avatarPath: string): string {
    const candidate = JSON.parse(localStorage.getItem('candidate'));

    // Nếu avatarPath không có giá trị, sử dụng avatar từ candidate hoặc ảnh mặc định
    if (!avatarPath) {
      return candidate?.data?.avatar || 'assets/img/dashboard/no-avatar.jpg';
    }

    // Nếu avatarPath là một URL tạm thời (data:image hoặc blob:)
    if (avatarPath.startsWith('data:image') || avatarPath.startsWith('blob:')) {
      return avatarPath;
    }

    // Nếu avatarPath đã có tiền tố http://103.153.68.231:8081/uploads/, trả về trực tiếp
    if (avatarPath.startsWith('http://103.153.68.231:8081/uploads/')) {
      return avatarPath;
    }

    // Nếu avatarPath là một đường dẫn tương đối (bắt đầu bằng assets/)
    if (avatarPath.startsWith('assets/')) {
      return avatarPath;
    }

    // Nếu avatarPath là một đường dẫn tương đối khác, thêm tiền tố
    return `http://103.153.68.231:8081/uploads/${avatarPath}`;
  }

  convertDateFormat(dateString: string): string {
    if (!dateString) return '';

    // Chuyển đổi ngày tháng từ định dạng dd/MM/yyyy sang Date object
    const [day, month, year] = dateString.split('/');
    const date = new Date(+year, +month - 1, +day); // Lưu ý: Tháng trong JavaScript bắt đầu từ 0 (0 = tháng 1)

    // Cộng thêm 1 ngày
    date.setDate(date.getDate() + 1);

    // Định dạng lại ngày tháng theo yyyy-MM-dd
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return formattedDate;
  }
}
