/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

/**
 * A service that provides the current app context, a string which may be e.g.
 * displayed as the HTML title of the web app. Changes to the app context are
 * emitted onto an observable which can be subscribed to by interesting
 * components.
 */
@Injectable({
    providedIn: "root"
})
export class AppContextService {

    constructor() { }

    private _context$ = new BehaviorSubject<string>("");

    /**
     * Gets an observable on which app context changes are emitted. 
     */
    public readonly context$ = this._context$.asObservable();

    /**
     * Sets the given context as the current app context.
     *
     * @param context the current app context
     */
    public setContext(context: string) {
        this._context$.next(context);
    }
}
