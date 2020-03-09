/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { Pipe, PipeTransform } from "@angular/core";

/**
 * Pipe to truncate a string at a given length
 */
@Pipe({ name: "truncate" })
export class TruncatePipe implements PipeTransform {
    transform(value: string, max: number): string {
        return value.length > max ? value.substring(0, max) : value;
    }
}
