
import { Component, OnInit } from '@angular/core';
import { ConfigService } from '../service/config.service';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SafeHtml } from '@angular/platform-browser';

import { UIEvents, UIEventService } from '../service/ui-event.service';

const contentPath = '../assets/title/title.html';

@Component({
  selector: 'app-title',
  templateUrl: './title.component.html',
  styleUrls: ['./title.component.less']
})
export class TitleComponent implements OnInit {

    private _content: string;

    constructor(
          private configService: ConfigService
        , private http: HttpClient
        , private sanitizer: DomSanitizer
        , private uiEventService: UIEventService
    ) { }

    ngOnInit() {
        console.log('TitleComponent ngOnInit');
        this.setContent();

        // have map restored to initial state
        const mapResetObservable: Observable<UIEvents.MapReset>
            = Observable.create(observer => observer.next());
        this.uiEventService.register(UIEvents.MapReset, mapResetObservable);
    }
    private setContent() {
        console.log('TitleComponent setContent');
        const contentOptions: any = { responseType: 'text' };
        const contentPromise: any = this.http.get<Observable<string>>(contentPath, contentOptions).toPromise();
        contentPromise.then(content => {
            this._content = content;
        });
    }
    public get content(): SafeHtml {
        let content;
        if (! this._content) {
            content = '';
        } else {
            content = this._content;
        }
        return this.sanitizer.bypassSecurityTrustHtml(content);
    }
}
