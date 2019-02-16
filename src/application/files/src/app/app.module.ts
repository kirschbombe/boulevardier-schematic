
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { RouteReuseStrategy } from '@angular/router';
import { CustomReuseStrategy } from './app-routing.module';

import { NgbModule, NgbPopover, NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MapComponent } from './map/map.component';
import { ArticleComponent } from './article/article.component';
import { IssueComponent } from './issue/issue.component';
import { MenuComponent } from './menu/menu.component';
import { MarkerComponent } from './marker/marker.component';
import { CarouselComponent } from './carousel/carousel.component';
// import { LayerComponent } from './map-layer/layer.component';
// import { PlacetypeComponent } from './map-layer-placetype/placetype.component';
// import { ItemComponent } from './map-control-timeline-item/item.component';
import { PageComponent } from './page/page.component';
import {
<%= pageComponentList %>
} from './page/page.component';

import { ConfigService } from './service/config.service';
import { ArticleService  } from './service/article.service';
import { UIEventService } from './service/ui-event.service';

import { TitleComponent  } from './article-title/title.component';

import {
<%= bodyComponentList %>
} from './article/article-body.component';

@NgModule({
  declarations: [
          AppComponent,
      ArticleComponent,
        IssueComponent,
       MarkerComponent,
         MenuComponent,
     CarouselComponent,
//        LayerComponent,
//    PlacetypeComponent,
//         ItemComponent,
          MapComponent,
         PageComponent,
        <%= pageComponentList %>,
        TitleComponent,
        <%= bodyComponentList %>
  ],
  imports: [
      BrowserModule
    , AppRoutingModule
    , FontAwesomeModule
    , HttpClientModule
    , NgbModule.forRoot()
  ],
  providers: [ConfigService, ArticleService, NgbCarouselConfig, NgbPopover, UIEventService,
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy }
],
  bootstrap: [AppComponent],
})
export class AppModule { }
