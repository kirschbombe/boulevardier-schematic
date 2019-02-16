import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Article } from '../article/article';
import { ConfigService } from '../service/config.service';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.less'],
  providers: []
})
export class CarouselComponent implements OnChanges, OnInit {

    @Input()
    article: Article;

    images: any = [];
    imageConfigs: { [key: string]: Observable<Object>} = {};
    imageId = 0;

    constructor(
          private http: HttpClient
        , private configService: ConfigService
        , private modalService: NgbModal
    ) { }

    ngOnInit() {
        console.log('CarouselComponent ngOnInit');
        this.configService.getSiteConfig().toPromise()
            .then(c => this.handleImageConfigs(c))
            .catch(e => {
                console.log('CarouselComponent ngOnInit: ' + e.message);
            });
    }
    private handleImageConfigs(config: SiteConfig) {
        const jsonOptions: any = { observe: 'body', responseType: 'json' };
        config.articles.forEach((a) => {
            const configFile = `assets/articles/${a.id}/images.json`;
            this.imageConfigs[a.id] = this.http.get<Object>(configFile, jsonOptions);
        });
    }
    ngOnChanges(changes: SimpleChanges) {
        // console.log('onChanges');
        const id = this.article.getId();
        if (this.imageConfigs[id]) {
            this.imageId = 0;
            this.imageConfigs[id]
            .subscribe(c => {
                this.images = c;
                // make id an integer from 0
                for (let i = 0; i < this.images.length; ++i) {
                    this.images[i].id = i;
                }
            });
        } else {
            setTimeout(() => this.ngOnChanges(changes), 250);
        }
    }
    getImages() {
        // console.log('getImages');
        return this.images;
    }
    onClickNext(): void {
        this.imageId = (++this.imageId) % this.images.length;
    }
    onClickPrevious(): void {
        let id = this.imageId - 1;
        if (id < 0) {
            id = this.images.length + id;
        }
        this.imageId = id;
    }
    onPaginationClick(image): void {
        this.imageId = image.id;
    }
    open(content) {
        this.modalService.open(content, {'centered': true});
    }
}
