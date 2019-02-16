
import { Injectable } from '@angular/core';

import { PartialObserver, merge, interval, Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { throttle } from 'rxjs/operators';

export enum UIEvents {
      MarkerAdd
    , MarkerSelect
    , ArticleSelect
    , MapReset
    , PopupOpen
}
interface UIEventSource {
    source: any;
}
export interface MarkerSelectionData extends UIEventSource {
    id: string;
}
export interface ArticleSelectionData {
    id: string;
}

@Injectable({
    providedIn: 'root'
})
export class UIEventService {

    public static eventThrottleLength = 250;

    private observables:   Map<UIEvents, Observable<any>>           = new Map();
    private subscriptions: Map<UIEvents, Subscription>              = new Map();
    private observers:     Map<UIEvents, Set<PartialObserver<any>>> = new Map();

    constructor() {
        [UIEvents.MarkerAdd, UIEvents.MarkerSelect, UIEvents.ArticleSelect, UIEvents.MapReset, UIEvents.PopupOpen]
        .forEach(evt => {
            this.observables.  set(evt, new Observable());
            this.subscriptions.set(evt, new Subscription());
            this.observers.    set(evt, new Set());
        });
    }

    public register(evt: UIEvents.MarkerAdd | UIEvents.MarkerSelect, obs: Observable<MarkerSelectionData>): void;
    public register(evt: UIEvents.ArticleSelect, obs: Observable<ArticleSelectionData>): void;
    public register(evt: UIEvents.MapReset | UIEvents.PopupOpen, obs: Observable<any>): void;
    public register(evt, obs: Observable<any>): void {
        // console.log('UIEventService register: ' + UIEvents[evt]);

        // make a merged observable on a per-event basis, so that the event stream can be throttled
        const mergedObservable: Observable<any> = merge(obs, this.observables.get(evt));
        this.observables.set(evt, mergedObservable);

        // unsubscribe from previous subscription and make a new observer for this event
        const po: PartialObserver<any> = {
            next: data => this.observers.get(evt).forEach(o => o.next(data))
        };
        const newSubscription = mergedObservable.pipe(throttle(val => interval(UIEventService.eventThrottleLength))).subscribe(po);
        this.subscriptions.get(evt).unsubscribe();
        this.subscriptions.set(evt, newSubscription);
    }

    public subscribe(evt: UIEvents.MarkerAdd,  obs: PartialObserver<MarkerSelectionData>): void;
    public subscribe(evt: UIEvents.MarkerSelect,  obs: PartialObserver<MarkerSelectionData>): void;
    public subscribe(evt: UIEvents.ArticleSelect, obs: PartialObserver<ArticleSelectionData>): void;
    public subscribe(evt: UIEvents.MapReset | UIEvents.PopupOpen, obs: PartialObserver<any>): void;
    public subscribe(evt, po: PartialObserver<any>): void {
        // console.log('UIEventService subscribe: ' + UIEvents[evt]);
        this.observers.get(evt).add(po);
    }
}
