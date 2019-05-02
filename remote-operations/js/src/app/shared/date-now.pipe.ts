/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts any input value except `undefined` and `null` into the date, the
 * input has been received.
 */
@Pipe({
    name: 'dateNow'
})
export class DateNowPipe implements PipeTransform {

    transform(value: any, args?: any): Date {
        if (value === null || value === undefined) {
            return undefined;
        }
        return new Date();
    }

}
