/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";

/**
 * A bottom sheet that display the JavaScript objects representing the currently
 * selected context filter and operation parameters.
 */
@Component({
    selector: "app-code-viewer-bottom-sheet",
    templateUrl: "code-viewer-bottom-sheet.component.html",
    styleUrls: ["code-viewer-bottom-sheet.component.scss"],
})
export class CodeViewerBottomSheetComponent {

    constructor(
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
        private bottomSheetRef: MatBottomSheetRef<CodeViewerBottomSheetComponent>) { }

    close(event: MouseEvent) {
        this.bottomSheetRef.dismiss();
        event.preventDefault();
    }
}
