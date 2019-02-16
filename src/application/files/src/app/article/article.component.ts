
import { Component, Input, OnInit } from '@angular/core';

import { Article } from './article';
import { BodyComponentBase } from './article-body.component';

import { MarkerSelectionData, UIEvents, UIEventService } from '../service/ui-event.service';
import { Observable, PartialObserver } from 'rxjs';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.less']
})
export class ArticleComponent implements OnInit {

    @Input()
    article: Article;

    private clickObservers: PartialObserver<MarkerSelectionData>[] = [];

    constructor(
        private uiEventService: UIEventService
    ) { }

    ngOnInit() {
        console.log('ArticleComponent ngOnInit');
        const markerClickObservable: Observable<MarkerSelectionData> =
            new Observable(observer => this.updateObservers(observer));
        this.uiEventService.register(UIEvents.MarkerSelect, markerClickObservable);
    }

    updateObservers(obs) {
        this.clickObservers.push(obs);
    }

    // onClick event bubbles up from body components
    public onArticleMarkerClick(body: BodyComponentBase): void {
        console.log('ArticleComponent onArticleMarkerClick: ' + body.getId());
        this.clickObservers.forEach(o => o.next({
              id: body.getId()
            , source: this
        }));
    }

    getArticleId() {
        if (this.article !== undefined) {
            return this.article.getId();
        }
    }
}
