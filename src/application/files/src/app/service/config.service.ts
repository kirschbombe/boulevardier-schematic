
declare var console;

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const  mapConfigFile = '../assets/config/map.json';
const siteConfigFile = '../assets/config/site.json';

@Injectable()
export class ConfigService {

    private  mapConfig: Observable<MapConfig>;
    private siteConfig: Observable<SiteConfig>;

    constructor(private http: HttpClient) { }

    public getMapConfig(): Observable<MapConfig> {
    if (this.mapConfig === undefined) {
        this.mapConfig = this.fetchConfigFile<MapConfig>(mapConfigFile);
    }
        return this.mapConfig;
    }

    public getSiteConfig(): Observable<SiteConfig> {
        if (this.siteConfig === undefined) {
            this.siteConfig = this.fetchConfigFile<SiteConfig>(siteConfigFile);
        }
        return this.siteConfig;
    }

    private fetchConfigFile<T>(path: string): Observable<T> {
        console.log('Fetching config file: ' + path);
        return this.http.get<T>(path);
    }
}
