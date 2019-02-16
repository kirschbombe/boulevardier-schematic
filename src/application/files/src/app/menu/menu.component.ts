
import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfigService } from '../service/config.service';

import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { faBars } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less']
})
export class MenuComponent implements OnInit {

    pages = [];
    articles = [];
    faBars = faBars;

    @ViewChild(NgbPopover)
    public popover: NgbPopover;

    constructor(
          configService: ConfigService
    ) {
        configService.getSiteConfig().toPromise()
        .then((siteConfig: SiteConfig) => {
            this.articles = siteConfig.articles;
            this.pages = siteConfig.pages;
        });
    }

    ngOnInit() { }
    private closePopover() {
        if (this.popover) {
            this.popover.close();
         }
    }
    onClick(evt) {
         this.closePopover();
    }
    onMouseEnter() {
        this.closePopover();
    }
}
