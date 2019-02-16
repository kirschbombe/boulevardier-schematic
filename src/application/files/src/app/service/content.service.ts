
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})

@Injectable()
export abstract class ContentService<T> {

    protected promiseOfAllContent: Promise<T[]>;
    protected contentPromises: Promise<T>[] = [];

    constructor(protected http: HttpClient, protected configService: ConfigService) {
        console.log('ContentService constructor');
        const exec = (resolve, reject) => {
            configService.getSiteConfig().toPromise()
                .then(siteConfig => this.initService(siteConfig, resolve, reject))
                .catch(e => {
                    const msg = 'Failed to fetch site config in ContentService: ' + e.message;
                    console.log(msg);
                    reject(e);
                });
        };
        this.promiseOfAllContent = new Promise(exec);
    }

    protected abstract initService(siteConfig: SiteConfig, resolve: any, reject: any): void;

    public getContents(): Promise<T[]> {
        return this.promiseOfAllContent;
    }

    public getContent(i: number): Promise<T> {
        const exec = (resolve, reject) => {
            this.promiseOfAllContent.then(_ => {
                resolve(this.contentPromises[i]);
            }).catch(e => {
                reject(e);
            });
        };
        return new Promise(exec);
    }
}

