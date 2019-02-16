
import { Component, OnInit, Input } from '@angular/core';

import * as L from 'leaflet';
import { Observable, PartialObserver, fromEvent } from 'rxjs';
import { map, throttleTime } from 'rxjs/operators';

import { ConfigService } from '../service/config.service';

import { Marker } from './marker';
import { ArticleSelectionData, UIEvents, UIEventService, MarkerSelectionData } from '../service/ui-event.service';

@Component({
     selector: 'app-marker',
  templateUrl: './marker.component.html',
    styleUrls: ['./marker.component.less']
})
export class MarkerComponent implements OnInit {

    @Input()
    marker: Marker;

    @Input()
    map: L.Map;

    private popup: L.Popup;

    constructor(
          private configService: ConfigService
        , private uiEventService: UIEventService
    ) { }

    ngOnInit() {
        console.log('MarkerComponent: ngOnInit');

        const mapConfigPromise = this.configService.getMapConfig().toPromise();
        mapConfigPromise
            .then((mapConfig) => this.initMarker(mapConfig))
            .catch(e => console.log('Failed to initialize marker: ' + e.message));
    }

    private initMarker(mapConfig): void {

        const iconOptions = mapConfig.features.icon;
        iconOptions.iconUrl = this.marker.getIconUrl();

        const geoJson = this.marker.getGeoJson();
        const lat = geoJson.geometry.coordinates[1];
        const lng = geoJson.geometry.coordinates[0];
        const latLng = new L.LatLng(lat, lng);

        const options: L.MarkerOptions = {
              icon        : L.icon(iconOptions)
            , clickable   : !!this.marker.getText()
            , title       : (this.marker.getMarkerName() || '')
            , opacity     : mapConfig.features.opacity
            , riseOnHover : mapConfig.features.riseOnHover
            , interactive : true
        };
        const markerLayer = L.marker(latLng, options);

        // the marker's observers need to be re-initialized any time
        // TODO: review the performance impact of this listener
        // TODO: review the 'includes' match on layer.name, which is imprecise
        this.map.on('overlayadd', (layer) => {
            if ((<any>layer).name && (<any>layer).name.includes(geoJson.properties.layer)) {
                this.handleMarkerObservers(markerLayer);
                this.handleMarkerSubscriptions(markerLayer);
            }
        });
        markerLayer.addTo(this.map);

        const markerAddObserver: Observable<MarkerSelectionData> = new Observable(
            observer => observer.next({ source: this, id: this.marker.getId() })
        );
        this.uiEventService.register(UIEvents.MarkerAdd, markerAddObserver);

        // add the popup to this marker
        this.popup = new L.Popup(mapConfig.features.popup);
        const eltId = `marker-popup-${ this.marker.getId() }`;
        const elt = document.getElementById(eltId);
        this.popup.setContent(elt);
        markerLayer.bindPopup(this.popup);
    }

    /**
     * Register marker-click and popup-open event handlers for markers.
     */
    private handleMarkerObservers(markerLayer: L.Marker) {

        const currId: string = this.marker.getId();

        // override default event handlers (e.g., open popup on marker click) so
        // that the UIEventService can control all event flow explicitly
        markerLayer.clearAllEventListeners();

        // suppress the default event for a mouse click, and propogate the click event
        // through the UIEventService mechanism
        const markerSelectionObserver: Observable<MarkerSelectionData> =
            fromEvent(markerLayer.getElement(), 'click')
            .pipe(throttleTime(UIEventService.eventThrottleLength))
            .pipe(map((_) => ({ id: currId, source: this })));
        this.uiEventService.register(UIEvents.MarkerSelect, markerSelectionObserver);

        // when a popup opens
        const popupOnOpenObserver: Observable<any> = new Observable(
            observer => {
                markerLayer.on('popupopen', (evt: MouseEvent) => {
                    observer.next(evt);
                });
            }
        );
        this.uiEventService.register(UIEvents.PopupOpen, popupOnOpenObserver);
    }

    /**
     * Register subscriptions for the UIEvent service.
     */
    private handleMarkerSubscriptions(markerLayer: L.Marker) {

        const currId: string = this.marker.getId();

        // listen for events occurring from marker click observer and from article
        const handleClickEvent = (data: MarkerSelectionData) => {
            if (data.id === currId) {
                markerLayer.togglePopup();
            }
        };
        const clickListener: PartialObserver<MarkerSelectionData> = {
            next: data => handleClickEvent(data)
        };
        this.uiEventService.subscribe(UIEvents.MarkerSelect, clickListener);

        // listen to events occurring from routing the issue to a new article
        const handleArticleSelection = (data: ArticleSelectionData) => {
            if (data.id === currId) {
                markerLayer.openPopup();
            }
        };
        const articleListener: PartialObserver<ArticleSelectionData> = {
            next: data => handleArticleSelection(data)
        };
        this.uiEventService.subscribe(UIEvents.ArticleSelect, articleListener);

        // on MapReset event, close popups
        const mapResetListener: PartialObserver<any> = {
            next: () => {
                if (markerLayer.isPopupOpen()) {
                    markerLayer.closePopup();
                }
            }
        };
        this.uiEventService.subscribe(UIEvents.MapReset, mapResetListener);
    }

    public getMarker() {
        return this.marker;
    }
    public getPopup() {
        return this.popup;
    }
}
