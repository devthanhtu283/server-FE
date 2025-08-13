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
  imageUrl: string | File | null = null;

  coverFile?: File;

  provinces: any[] = [];
  districts: any[] = [];
  wards: any[] = [];

  selectedProvince: number | null = null;
  selectedDistrict: number | null = null;
  selectedWard: number | null = null;
  coverImgPreview: string | null = null;
  coverImgUrl: string | null = null; 

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
onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files && input.files[0] ? input.files[0] : null;

  if (file) {
    this.coverFile = file;            // GIỮ FILE TẠI ĐÂY
    const reader = new FileReader();
    reader.onload = () => {
      this.coverImgPreview = reader.result as string;  // preview
      console.log('Cover image preview updated:', this.coverImgPreview);
    };
    reader.readAsDataURL(file);

    // KHÔNG gán file vào imageUrl nữa!
    // imageUrl = string (URL) sẽ được gán sau khi upload thành công
  } else {
    // không có file -> dùng ảnh hiện có (avatar) hoặc null
    this.coverImgPreview = null;
    this.imageUrl = this.seeker?.avatar
      ? `${this.baseUrl.getUserImageUrl()}${this.seeker.avatar}`
      : null;
  }
}


  // Hàm submit để cập nhật thông tin
  onSubmit() {
    const birthday = this.candidateForm.value.dob;
    const formattedBirthday = birthday
      ? moment(birthday, 'YYYY-MM-DD').format('DD/MM/YYYY')
      : null;

    // Lấy avatar hiện có từ LS để không ghi đè null
    const current = JSON.parse(localStorage.getItem('candidate') || 'null');

    this.seeker = {
      id: this.user.id,
      fullName: this.candidateForm.value.fullName,
      phone: this.candidateForm.value.phone,
      address: this.candidateForm.value.address,
      gender: this.candidateForm.value.gender,
      status: 1,
      dob: formattedBirthday,
      updatedAt: null,
      avatar: current?.avatar ?? null,
    };

    const formData = new FormData();
    if (this.coverFile) {
      formData.append('file', this.coverFile, this.coverFile.name);
    }
    formData.append('seekerDTO', JSON.stringify(this.seeker));

    this.userService.updateCandidate(formData).then(
      (res) => {
        const updated = res?.data;

        // cập nhật ảnh thật + clear preview
        this.avatarUrl = this.getImageUrl(updated?.avatar);
        this.coverImgPreview = null;

        // lưu LS
        localStorage.setItem('candidate', JSON.stringify(updated));

        this.messageService.add({
          severity: 'success',
          summary: 'Cập nhật thành công',
          detail: 'Bạn đã cập nhật thông tin thành công.',
        });

        this.router.navigate(['/seeker/profile']);
      },
      (err) => {
        console.log(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Cập nhật thất bại',
          detail: 'Quá trình cập nhật thông tin không thành công. Vui lòng kiểm tra lại.',
        });
        this.router.navigate(['/seeker-profile']);
      }
    );
  }

  getImageUrl(avatarPath?: string | null): string {
    // 1) Ưu tiên tham số truyền vào
    let p = avatarPath;
  
    // 2) Nếu không có, lấy từ localStorage (hỗ trợ cả 2 dạng: candidate.avatar hoặc candidate.data.avatar)
    if (!p) {
      const cached = JSON.parse(localStorage.getItem('candidate') || 'null');
      p = cached?.avatar ?? cached?.data?.avatar ?? null;
    }
  
    // 3) Không có gì -> ảnh mặc định
    if (!p) return 'assets/img/dashboard/no-avatar.jpg';
  
    // 4) Các trường hợp đã là URL/preview
    if (p.startsWith('data:') || p.startsWith('blob:')) return p; // preview
    if (p.startsWith('http://') || p.startsWith('https://')) return p; // URL tuyệt đối
    if (p.startsWith('assets/')) return p; // asset cục bộ
  
    // 5) Trường hợp backend trả relative path -> nối base
    return `${this.baseUrl.getUserImageUrl()}${p}`;
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
  onAvatarError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/img/dashboard/no-avatar.jpg';     
    this.avatarUrl = 'assets/img/dashboard/no-avatar.jpg'; 
  }
  
}
