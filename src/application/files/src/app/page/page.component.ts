import { Component, Input, OnInit } from '@angular/core';


@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.less']
})
export class PageComponent implements OnInit {

    @Input()
    public pageName;

    constructor() { }
    ngOnInit() { }

    getPageName(): string {
        // console.log('PageComponent::getPageName: ' + this.pageName);
        return this.pageName;
    }
}

<%= pageComponents %>
