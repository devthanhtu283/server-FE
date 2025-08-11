import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow, parse } from 'date-fns';

@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return ''; // Nếu giá trị rỗng, trả về chuỗi rỗng

    let date: Date;
    if (typeof value === 'string') {
      // Sử dụng parse để chuyển đổi chuỗi thành đối tượng Date với định dạng cụ thể
      date = parse(value, 'dd/MM/yyyy HH:mm:ss', new Date());
    } else {
      date = value;
    }

    if (isNaN(date.getTime())) { // Kiểm tra xem giá trị có hợp lệ không
      return 'Invalid date';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  }
}