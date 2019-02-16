
import { NgModule } from '@angular/core';
import { RouterModule, Router, RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

import { PartialObserver } from 'rxjs';

import { IssueComponent } from './issue/issue.component';
import { MarkerSelectionData, UIEvents, UIEventService } from './service/ui-event.service';

const routes: any = [
      { path: '',                   component: IssueComponent }
    , { path: 'article/:articleId', component: IssueComponent }
    , { path: 'page/:pageName',     component: IssueComponent }
    , { path: '**',                 component: IssueComponent }
];
@NgModule({
      imports: [ RouterModule.forRoot(routes) ]
    , exports: [ RouterModule ]
})
export class AppRoutingModule {

    constructor(private router: Router, private uiEventService: UIEventService) {
        const markerSelect: PartialObserver<MarkerSelectionData> = {
            next: data => this.onMarkerSelect(data)
        };
        this.uiEventService.subscribe(UIEvents.MarkerSelect, markerSelect);
     }

    public onMarkerSelect(m: MarkerSelectionData): void {
        const url = `/article/${ m.id }`;
        console.log(`AppRoutingModule::onMarkerSelect ${ url }`);
        this.router.navigateByUrl(url);
    }

}
export class CustomReuseStrategy extends RouteReuseStrategy {

    routeHandles = new Map<string, DetachedRouteHandle>();

    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        // console.log('CustomReuseStrategy::shouldDetach');
        return true;
    }
    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
        // console.log('CustomReuseStrategy::store');
        if (route.routeConfig) {
            this.routeHandles.set(route.routeConfig.path, handle);
        }
    }
    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        // console.log('CustomReuseStrategy::shouldAttach');
        return route.routeConfig
            ? this.routeHandles.has(route.routeConfig.path)
            : false;
    }
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
        // console.log('CustomReuseStrategy::retrieve');
        return route.routeConfig
            ? this.routeHandles.get(route.routeConfig.path)
            : null;
    }
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        // console.log('CustomReuseStrategy::shouldReuseRoute');
        // do not reuse on transition to a page from a non-page or the reverse
        const currPage = curr.params.hasOwnProperty('pageName');
        const futurePage = future.params.hasOwnProperty('pageName');
        return (currPage && futurePage) || (! (currPage || futurePage));
    }
}
