import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
    transform(value: Date | string | number | null | undefined): string {
        if (!value) return '';
        const now = Date.now();
        const d = new Date(value).getTime();
        const diff = Math.floor((now - d) / 1000);
        if (diff < 60) return 'vừa xong';
        if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
        if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
        if (diff < 604800) return Math.floor(diff / 86400) + ' ngày trước';
        return new Date(value).toLocaleDateString('vi-VN');
    }
}
