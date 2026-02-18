import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'vnd', standalone: true })
export class VndCurrencyPipe implements PipeTransform {
    transform(value: number | null | undefined): string {
        if (value == null) return '0₫';
        return value.toLocaleString('vi-VN') + '₫';
    }
}
