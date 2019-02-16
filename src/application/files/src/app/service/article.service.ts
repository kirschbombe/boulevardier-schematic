
// TODO: make a logging class
declare var console;

import { Injectable } from '@angular/core';

import { Article       } from '../article/article';
import { ContentService } from './content.service';
import { Marker        } from '../marker/marker';

const articleBasePath = '../assets/articles/';

@Injectable()
export class ArticleService extends ContentService<Article> {

    protected initService(siteConfig: SiteConfig, resolve: any, reject: any): void {
        const ids: string[] = siteConfig.articles.map((a) => a.id);
        this.contentPromises = ids.map((id) => this.makeArticlePromise(id));
        Promise.all(this.contentPromises)
            .then(as => resolve(as))
            .catch(e => reject(e));
    }

    private makeArticlePromise(id: string): Promise<Article> {
        const path = `${articleBasePath}/${id}`;

        const citedRangePath = `${path}/cited-range.json`;
        const geoJsonPath    = `${path}/geojson.json`;

        const jsonOptions: any = { observe: 'body', responseType: 'json' };
        const citedRangePromise: any = this.http.get(citedRangePath, jsonOptions).toPromise();
        const geoJsonPromise:    any = this.http.get(geoJsonPath,    jsonOptions).toPromise();

        const exec = (resolve, reject) => {
            Promise.all([citedRangePromise, geoJsonPromise])
            .then(function([citedRange, geoJson]) {
                const iconUrl = geoJson.properties.iconUrl;
                const marker  = new Marker(id, geoJson, iconUrl);
                const article = new Article(id, citedRange, iconUrl, marker, geoJson);
                resolve(article);
            })
            .catch(e => reject(e));
        };
        return new Promise(exec);
    }
}
