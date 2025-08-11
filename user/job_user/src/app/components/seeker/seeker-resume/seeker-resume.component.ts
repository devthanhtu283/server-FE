import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { BaseUrl } from 'src/app/services/baseUrl.service';
import { JobService } from 'src/app/services/job.service';
import { RecommendationService } from 'src/app/services/recommendation.service';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router'; // Import Router để chuyển hướng

declare const pdfjsLib: any;

@Component({
  templateUrl: './seeker-resume.component.html',
  styleUrls: ['./seeker-resume.component.css'],
})
export class SeekerResumeComponent implements OnInit {
  skillInput: string = '';
  allSkills: string[] = [];
  filteredSkills: string[] = [];
  selectedSkills: string[] = [];
  mySkills: string[] = [];
  mySkillsModified: boolean = false;
  uploadedCV: { name: string; size: string; file?: File; thumbnail?: string } | null = null;
  checkPlan: boolean = false;
  availableSkills: string[] = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'TypeScript', 'Go', 'Swift', 'Kotlin',
    'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Ruby on Rails',
    'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Oracle', 'Redis',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Ansible', 'CI/CD',
    'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind CSS', 'Webpack', 'Vite',
    'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Machine Learning', 'Deep Learning',
    'Git', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'Microservices', 'Unit Testing', 'TDD', 'UI/UX Design'
  ];

  savedCVs: { name: string; size: string; thumbnail?: string }[] = [];

  educationData: string[] = [];

  educations: {
    university: string;
    startDate: string;
    endDate: string;
    description: string;
  }[] = [];

  educationsModified: boolean = false;

  editingEducationIndex: number | null = null;
  editedEducation: { university: string; startDate: string; endDate: string; description: string } | null = null;

  newEducation: { university: string; startDate: string; endDate: string; description: string } = {
    university: '',
    startDate: '',
    endDate: '',
    description: ''
  };

  experiences: {
    company: string;
    position: string;
    desc: string;
    time: string;
  }[] = [];

  experiencesModified: boolean = false;

  editingIndex: number | null = null;
  editedExperience: { company: string; position: string; desc: string; time: string } | null = null;

  newExperience: { company: string; position: string; desc: string; time: string } = {
    company: '',
    position: '',
    desc: '',
    time: ''
  };

  constructor(
    private jobService: JobService,
    private recommendationService: RecommendationService,
    private userService: UserService,
    private messageService: MessageService,
    private baseUrl: BaseUrl,
    private router: Router // Inject Router để chuyển hướng
  ) {
    this.parseEducationData();
  }

  async ngOnInit(): Promise<void> {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !user.id) {
      // Nếu không có user hoặc user.id, chuyển hướng về trang đăng nhập
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng đăng nhập để truy cập trang này.'
      });
      this.router.navigate(['/login']);
      return;
    }

    // Kiểm tra xem người dùng đã có gói cước hay chưa
    try {
      const membership = await this.userService.findEmployerMembershipByUserId(user.id);
      if (!membership || !membership.status) {
        // Nếu không có gói cước hoặc gói cước không hoạt động, chuyển hướng về /seeker/plan
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Bạn cần phải đăng ký gói cước để sử dụng chức năng này.'
        });
        this.checkPlan = true;
        return;
      }
    } catch (error) {
      console.error('Error checking membership:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể kiểm tra gói cước của bạn. Vui lòng thử lại sau.'
      });
      this.router.navigate(['/seeker/plan']);
      return;
    }

    // Nếu đã có gói cước, tiếp tục tải dữ liệu
    this.jobService.skillFindAll().then((res) => {
      this.allSkills = res.map((skill) => skill.name);
      this.filteredSkills = [...this.availableSkills];
    });

    this.userService.findCVBySeekerId(user.id).then(async (cv) => {
      if (cv && cv.name) {
        const fileUrl = this.baseUrl.getUserFileUrl() + cv.name;
        console.log("fileUrl ", fileUrl);
        const thumbnail = await this.generatePDFThumbnailFromURL(fileUrl);

        this.savedCVs = [{
          name: cv.name,
          size: 'Đã lưu',
          thumbnail: thumbnail
        }];
      }

      if (cv.skills) {
        this.mySkills = cv.skills.split(',').map((s: string) => s.trim());
      }

      if (cv.experience) {
        try {
          const parsedExperience = JSON.parse(cv.experience);
          this.experiences = parsedExperience.map((exp: any) => ({
            company: exp.company || '',
            position: exp.position || '',
            desc: exp.desc || '',
            time: exp.time || ''
          }));
        } catch (e) {
          console.error('Lỗi khi parse kinh nghiệm:', e);
        }
      }

      if (cv.education) {
        try {
          const parsedEducation = JSON.parse(cv.education);
          this.educations = parsedEducation.map((edu: any) => ({
            university: edu.university || '',
            startDate: edu.startDate || '',
            endDate: edu.endDate || '',
            description: edu.description || ''
          }));
        } catch (e) {
          console.error('Lỗi khi parse học vấn:', e);
        }
      }
    }).catch(err => {
      console.error('Không tìm thấy CV:', err);
    });
  }

  filterSkills(): void {
    if (this.skillInput.trim() === '') {
      this.filteredSkills = [...this.availableSkills];
    } else {
      this.filteredSkills = this.availableSkills.filter((skill) =>
        skill.toLowerCase().includes(this.skillInput.toLowerCase())
      );
    }
  }

  addSkill(skill: string): void {
    if (skill && !this.selectedSkills.includes(skill)) {
      this.selectedSkills.push(skill);
    }
    this.skillInput = '';
    this.filterSkills();
  }

  removeSkill(skill: string): void {
    this.selectedSkills = this.selectedSkills.filter((s) => s !== skill);
  }

  removeMySkill(skill: string): void {
    this.mySkills = this.mySkills.filter((s) => s !== skill);
    this.mySkillsModified = true;
  }

  async uploadCV(event: any) {
    const file = event.target.files[0];
    if (file) {
      const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      const thumbnail = await this.generatePDFThumbnail(file);
      this.uploadedCV = {
        name: file.name,
        size: fileSize,
        file: file,
        thumbnail: thumbnail
      };
    }
  }

  async saveCV() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (this.uploadedCV && this.uploadedCV.file) {
      const formData = new FormData();
      formData.append('file', this.uploadedCV.file);
      formData.append('seeker_id', user.id);

      try {
        const res = await this.userService.uploadCV(formData);
        const cv = {
          name: res.url,
          seekerId: user.id
        };

        await this.userService.saveCV(cv);

        const response = await this.recommendationService.extractCV(formData);
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Bạn đã cập nhật CV thành công!',
        });
        const extractedSkills = response.skills_required || [];
        this.selectedSkills = [...new Set([...this.selectedSkills, ...extractedSkills])];

        const extractedExperiences = response.experience || [];
        this.experiences = extractedExperiences.map((exp: any) => ({
          company: exp.company || '',
          position: exp.position || '',
          desc: exp.desc || '',
          time: exp.time || ''
        }));
        this.experiencesModified = true;

        this.savedCVs = [{
          name: this.uploadedCV.name,
          size: this.uploadedCV.size,
          thumbnail: this.uploadedCV.thumbnail
        }];

        this.uploadedCV = null;

      } catch (error) {
        console.error('Error uploading CV:', error);
      }
    }
  }

  saveSkills(): void {
    this.mySkills = [...new Set([...this.mySkills, ...this.selectedSkills])];
    this.selectedSkills = [];
    this.mySkillsModified = true;
  }

  saveMySkills(): void {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      const formattedSkills = this.mySkills.join(', ');

      this.userService.findCVBySeekerId(user.id).then(
        res => {
          console.log(res);
          var cv = res;
          cv.skills = formattedSkills;
          console.log(cv);
          this.mySkillsModified = false;
          this.userService.saveCV(cv).then(
            r => {
              console.log(r);
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Kỹ năng của bạn đã được cập nhật!',
              });
              this.recommendationService.recommendationJobs(cv.id).then(
                (res) => {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Thông báo',
                    detail: 'Hệ thống đã gợi ý các việc làm phù hợp dựa trên kĩ năng của bạn!!',
                  });
                },
                (error: any) => {
                  console.error('Error fetching recommended jobs:', error);
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Không thể lấy danh sách việc làm được gợi ý. Vui lòng thử lại sau.',
                  });
                }
              )
            }
          );
        }
      );
    }
  }

  saveMyExperiences(): void {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      const formattedExperiences = JSON.stringify(this.experiences);

      this.userService.findCVBySeekerId(user.id).then(
        res => {
          console.log(res);
          var cv = res;
          cv.experience = formattedExperiences;
          console.log(cv);
          this.experiencesModified = false;
          this.userService.saveCV(cv).then(
            r => {
              console.log(r);
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Kinh nghiệm của bạn đã được cập nhật!',
              });
            }
          );
        }
      );
    }
  }

  saveMyEducations(): void {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      const formattedEducations = JSON.stringify(this.educations);

      this.userService.findCVBySeekerId(user.id).then(
        res => {
          console.log(res);
          var cv = res;
          cv.education = formattedEducations;
          console.log(cv);
          this.educationsModified = false;
          this.userService.saveCV(cv).then(
            r => {
              console.log(r);
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Học vấn của bạn đã được cập nhật!',
              });
            }
          );
        }
      );
    }
  }

  removeSavedCV(cv: any) {
    this.savedCVs = this.savedCVs.filter((item) => item !== cv);
  }

  parseEducationData() {
    this.educations = this.educationData.map((edu) => {
      const parts = edu.split(' - ');
      return {
        university: parts[0],
        startDate: parts[1],
        endDate: parts[2],
        description: parts[3],
      };
    });
  }

  deleteExperience(index: number): void {
    if (confirm('Are you sure you want to delete this experience?')) {
      this.experiences = this.experiences.filter((_, i) => i !== index);
      this.experiencesModified = true;
    }
  }

  editExperience(index: number): void {
    this.editingIndex = index;
    this.editedExperience = { ...this.experiences[index] };
  }

  saveEditedExperience(): void {
    if (this.editingIndex !== null && this.editedExperience) {
      this.experiences[this.editingIndex] = { ...this.editedExperience };
      this.experiencesModified = true;
      this.cancelEdit();
    }
  }

  cancelEdit(): void {
    this.editingIndex = null;
    this.editedExperience = null;
  }

  addExperience(): void {
    if (this.newExperience.company && this.newExperience.position && this.newExperience.time) {
      this.experiences.push({ ...this.newExperience });
      this.experiencesModified = true;
      this.resetNewExperience();
    } else {
      alert('Please fill in all required fields (Company, Position, Time).');
    }
  }

  resetNewExperience(): void {
    this.newExperience = {
      company: '',
      position: '',
      desc: '',
      time: ''
    };
  }

  deleteEducation(index: number): void {
    if (confirm('Are you sure you want to delete this education entry?')) {
      this.educations = this.educations.filter((_, i) => i !== index);
      this.educationsModified = true;
    }
  }

  editEducation(index: number): void {
    this.editingEducationIndex = index;
    this.editedEducation = { ...this.educations[index] };
  }

  saveEditedEducation(): void {
    if (this.editingEducationIndex !== null && this.editedEducation) {
      this.educations[this.editingEducationIndex] = { ...this.editedEducation };
      this.educationsModified = true;
      this.cancelEditEducation();
    }
  }

  cancelEditEducation(): void {
    this.editingEducationIndex = null;
    this.editedEducation = null;
  }

  addEducation(): void {
    if (this.newEducation.university && this.newEducation.startDate && this.newEducation.endDate && this.newEducation.description) {
      this.educations.push({ ...this.newEducation });
      this.educationsModified = true;
      this.resetNewEducation();
    } else {
      alert('Please fill in all required fields (University, Start Date, End Date, Description).');
    }
  }

  resetNewEducation(): void {
    this.newEducation = {
      university: '',
      startDate: '',
      endDate: '',
      description: ''
    };
  }

  async generatePDFThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.3 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context!,
          viewport: viewport
        }).promise;

        resolve(canvas.toDataURL('image/png'));
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  async generatePDFThumbnailFromURL(pdfUrl: string): Promise<string> {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 0.3 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context!,
      viewport: viewport
    }).promise;

    return canvas.toDataURL('image/png');
  }

  showSuggestedSkills: boolean = false;

  toggleSuggestedSkills(): void {
    this.showSuggestedSkills = !this.showSuggestedSkills;
  }
}