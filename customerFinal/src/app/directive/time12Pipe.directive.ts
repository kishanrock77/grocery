import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'time12'
})
export class Time12Pipe implements PipeTransform {

  transform(time: string): string {

    if (!time) return '';

    const [hours, minutes] = time.split(':');

    let h = +hours;

    const ampm = h >= 12 ? 'PM' : 'AM';

    h = h % 12 || 12;

    return `${h}:${minutes} ${ampm}`;
  }

}