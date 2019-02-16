
import { AfterViewChecked, Output, Component, OnChanges,
    OnInit, SimpleChanges, ViewChild
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Observable } from 'rxjs';

import { ArticleService } from '../service/article.service';
import { ArticleSelectionData, UIEventService, UIEvents } from '../service/ui-event.service';

import { MapComponent } from '../map/map.component';

import { Article } from '../article/article';

const SHOW = { };
const   NO = { 'display' : 'none' };

@Component({
selector: 'app-issue',
templateUrl: './issue.component.html',
styleUrls: ['./issue.component.less']
})
export class IssueComponent implements AfterViewChecked, OnChanges, OnInit {

    @ViewChild(MapComponent)
    mapComponent: MapComponent;

    activePage = null;

    articles: { [key: string]: Article } = {};

    @Output()
    activeArticle: Article = null;

    articleObservers = [];

    mapStyle: any = SHOW;
    pageStyle: any = NO;
    titleStyle: any = NO;

    mapResetObserver;

    constructor(
        private articleService: ArticleService
    , private route: ActivatedRoute
    , private uiEventService: UIEventService
    ) { }

    ngOnInit() {
        console.log('IssueComponent: ngOnInit');

        const articleSelectionObserver: Observable<ArticleSelectionData> =
            Observable.create(observer => this.handleArticleObserver(observer));
        this.uiEventService.register(UIEvents.ArticleSelect, articleSelectionObserver);

        const mapResetObservable = Observable.create(observer => {
            this.mapResetObserver = observer;
        });
        this.uiEventService.register(UIEvents.MapReset, mapResetObservable);

        this.route.params.subscribe(params => {
            this.onRouteParams(params);
        });

        this.articleService.getContents()
            .then(as => {
                as.map((a) => {
                    this.articles[a.getId()] = a;
                });
            })
            .catch(e => {
                console.log('IssueComponent: fail in getArticles()');
            });
    }
    ngAfterViewChecked(): void {
        if (this.mapComponent) {
            if (! this.mapComponent.getBoundsSet()) {
                this.mapComponent.fitMarkerBounds();
            }
        }
    }
    ngOnChanges(changes: SimpleChanges) {
        console.log('IssueComponent ngOnChanges: ' + JSON.stringify(changes));
    }
    private onRouteParams(params) {
        console.log('IssueComponent onRouteParams: ' + JSON.stringify(params));
        if (params.hasOwnProperty('articleId')) {
            this.titleStyle = NO;
            this.mapStyle = SHOW;
            this.pageStyle = NO;
            this.activePage = null;

            const oldId = this.activeArticle ? this.activeArticle.getId() : -1;
            const newId = params.articleId;
            if (oldId !== newId) {
                console.log('IssueComponent onRouteParams: old:' + oldId + ' new:' + newId);
                this.setActiveArticle(newId);
                const id = { id: newId };
                // TODO: fix: due to initialization timing, this needs to be delayed/replayed
                const fn = () => this.articleObservers.forEach(o => o.next(id));
                fn();
                // setTimeout(fn, 500);
            }
        } else if (params.hasOwnProperty('pageName')) {
            this.titleStyle = SHOW;
            this.mapStyle = NO;
            this.pageStyle = SHOW;
            this.activeArticle = null;
            this.activePage = params.pageName;
        } else {
            console.log('IssueComponent onRouteParams: /');
            this.titleStyle = SHOW;
            this.mapStyle = SHOW;
            this.pageStyle = NO;
            this.activeArticle = null;
            this.activePage = null;
            this.mapResetObserver.next();
        }
    }
    private handleArticleObserver(observer) {
        this.articleObservers.push(observer);
    }
    private setActiveArticle(id: string): void {
        if (Object.keys(this.articles).length !== 0) {
            this.activeArticle = this.articles[id];
        } else {
            const that = this;
            window.setTimeout(() => {
                that.setActiveArticle(id);
            }, 10);
        }
    }
    getActivePage() {
        // console.log('IssueComponent::getActivePage: ' + this.activePage);
        return this.activePage;
    }
}
