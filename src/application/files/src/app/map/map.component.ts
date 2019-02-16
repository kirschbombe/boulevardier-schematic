
declare var console;
declare var document;

import { AfterViewInit, Component, OnInit,  QueryList, ViewChildren } from '@angular/core';

import * as L from 'leaflet';

import { PartialObserver } from 'rxjs';

import { ConfigService } from '../service/config.service';
import { ArticleService } from '../service/article.service';
import { MarkerSelectionData, UIEvents, UIEventService, ArticleSelectionData } from '../service/ui-event.service';

import { Marker } from '../marker/marker';
import { MarkerComponent } from '../marker/marker.component';

const NO_MARKER = -1;

interface MarkerLayerMap {
    string: {
        layer: L.Layer[];
        iconUrl: string;
    };
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements AfterViewInit, OnInit {

    private static id = 'map';

    private mapConfig: MapConfig;

    private layerControl: L.Control.Layers;

    boundsSet = false;

    private map: L.Map;
    markers: Marker[];

    currentMarkerId = NO_MARKER;

    @ViewChildren(MarkerComponent)
    markerComponents: QueryList<MarkerComponent>;

    constructor(
          private configService: ConfigService
        , private articleService: ArticleService
        , private uiEventService: UIEventService
    ) {
        this.initServices();
    }

    ngOnInit() {
        console.log('MapComponent: ngOnInit');

        this.configService.getMapConfig().toPromise()
        .then((mapConfig) => {
            this.mapConfig = mapConfig;
            this.initMap();
        })
        .catch(e => {
            console.log('Failed to load config:' + e.message);
        });
    }
    ngAfterViewInit() {
        this.markerComponents.changes.subscribe(c => {
            if (this.boundsSet) {
                this.handlePopupPosition();
            }
        });
    }

    public getBoundsSet(): boolean {
        return this.boundsSet;
    }

    private resetMap() {
        console.log('MapComponent::resetMap');
        this.boundsSet = false;
        this.fitMarkerBounds();
        this.handlePopupPosition();
        this.layerControl = null;
    }

    private initMap() {
        console.log('MapComponent: initMap');

        this.map = new L.Map(MapComponent.id, this.mapConfig.map);

        // optional initial view
        if (this.mapConfig.view) {
            const latLng: L.LatLngLiteral = this.mapConfig.view.latLng;
            const zoom: number = this.mapConfig.view.zoom;
            this.map.setView(latLng, zoom);
        }

        new L.TileLayer(this.mapConfig.urlTemplate, this.mapConfig.tileLayer.opts).addTo(this.map);
        new L.Control.Scale(this.mapConfig.scale).addTo(this.map);

        this.map.on('zoomend', () => this.handlePopupPosition());

        this.articleService.getContents()
            .then(articles => {
                this.markers = articles.map(a => a.getMarker());
            })
            .catch(e => {
                const msg = 'Failed to get article contents: ' + e.message;
                console.log(msg);
            });
    }

    /**
     * Construct the layer control (place types) and add to the map.
     */
    private initLayerControl() {
        console.log('MapComponent: initLayerControl');
        if (! (this.mapConfig && this.mapConfig.control && this.mapConfig.control.layers)) {
            return;
        }
        if (this.layerControl) {
            this.layerControl.remove();
        }

        // place type name -> (icon, markers)
        const markersByLayerName: MarkerLayerMap = this.getMarkerLayersByName();

        // TODO: handle control label template
        const overlays = Object.keys(markersByLayerName).reduce((acc, layerName) => {
            const iconUrl = markersByLayerName[layerName].iconUrl;
            const cls = layerName.replace(/\s+/g, '-');
            const layerHtml =
                `<img class="legend" src="${ iconUrl }"></img>
                <span class="noselect ${ cls }">${ layerName }</span>`;
            acc[layerHtml] = new L.LayerGroup(markersByLayerName[layerName].layer);
            return acc;
        }, {});

        this.layerControl = new L.Control.Layers(null, overlays, this.mapConfig.control.layers)
            .addTo(this.map);

        // have the input box checked; TODO: handle otherwise?
        document.querySelectorAll('input.leaflet-control-layers-selector').forEach((elt) => {
            elt.click();
            elt.checked = true;
        });
        // TODO: disable mouseover/mouseout events for the layer control
    }

    /**
     * Return a mapping of marker layer name -> icon url and list of markers in the layer
     */
    private getMarkerLayersByName(): MarkerLayerMap {
        return this.markers.reduce((acc: MarkerLayerMap, marker) => {
            const layerName = marker.getGeoJson().properties.layer;

            let markerLayer, iconUrl;
            this.map.eachLayer((layer) => {
                if (! layer.getPopup()) {
                    return acc;
                }
                const id = layer.getPopup().getContent() ? (<any>layer.getPopup().getContent()).id : '';
                if (id === `marker-popup-${marker.getId()}`) {
                    markerLayer = layer;
                    iconUrl = marker.getIconUrl();
                }
            });
            if (markerLayer === undefined) {
                return acc;
            }

            if (acc[layerName]) {
                acc[layerName].layer.push(markerLayer);
                acc[layerName].iconUrl = iconUrl;
            } else {
                acc[layerName] = {
                      layer: [markerLayer]
                    , iconUrl: iconUrl
                };
            }
            return acc;
        }, <MarkerLayerMap>{});
    }

    /**
     * Subscribe to UI events from the application.
     */
    private initServices() {

        // have the layer control (placetypes) initialized when markers are added
        const markerAddObs: PartialObserver<MarkerSelectionData> = {
            next: _ => this.initLayerControl()
        };

        this.uiEventService.subscribe(UIEvents.MarkerAdd, markerAddObs);

        // update active marker when a marker is selected
        const obs1: PartialObserver<MarkerSelectionData> = {
            next: (m: MarkerSelectionData) => {
                this.setActiveMarker(m.id);
            }
        };
        this.uiEventService.subscribe(UIEvents.MarkerSelect, obs1);

        // reset map
        const obs2: PartialObserver<any> = {
            next: () => this.resetMap()
        };
        this.uiEventService.subscribe(UIEvents.MapReset, obs2);

        // update active marker when an article is selected
        const obs3: PartialObserver<ArticleSelectionData> = {
            next: (m: ArticleSelectionData) => {
                this.setActiveMarker(m.id);
            }
        };
        this.uiEventService.subscribe(UIEvents.ArticleSelect, obs3);

        // handle map pan operation for an opened marker
        const obs4: PartialObserver<any> = {
            next: () => this.handlePopupPosition()
        };
        this.uiEventService.subscribe(UIEvents.PopupOpen, obs4);
    }

    /**
     * Have the map zoom/pan adjusted for the coordinates corresponding to
     * the set of map markers.
     */
    public fitMarkerBounds(): boolean {
        if (this.boundsSet) { return true; }
        if (this.markers === undefined) { return false; }
        const coords = this.markers.map(
            m => new L.LatLng(m.getLat(), m.getLng())
        );
        const bounds = L.latLngBounds(coords);
        const elt = document.getElementById('article');
        if (! elt) { return false; }
        const edgePtX = elt.getBoundingClientRect().left;
        if (edgePtX === 0) {
            this.map.fitBounds(bounds);

        // map underneath article
        } else if (edgePtX !== this.map.getSize().x) {
            this.map.fitBounds(bounds, {
                'paddingBottomRight' : [document.body.clientWidth - edgePtX, 0]
            });
        // map beside article
        } else {
            this.map.fitBounds(bounds);
        }
        this.map.invalidateSize();
        this.boundsSet = true;
        return true;
    }

    public setActiveMarker(id) {
        console.log('MapComponent setActiveMarker: ' + id);
        this.currentMarkerId = id;
    }

    /**
     * Pan the map by the amount required to have the popup not
     * be obscured by the article.
     *
     * @param markerComponent
     */
    private handlePopupPosition() {
        try {
            console.log('MapComponent.handlePopupPosition: ' + this.currentMarkerId);
            if (this.currentMarkerId === NO_MARKER) { return; }
            if (! this.markerComponents) { return; }

            const q = (c) => c.getMarker().getId() === this.currentMarkerId;
            const markerComponent = this.markerComponents.find(q);
            if (! markerComponent) { return; }

            const popup = markerComponent.getPopup();
            if (! popup) { return; }
            const articleElt = document.getElementById('article');
            const popupWrap = popup.getElement();
            if (! (articleElt && popupWrap)) {
                return;
            } else {
                this.panMapForPopup(popup, popupWrap, articleElt);
            }
        } catch (e) {
            console.log(e);
        }
    }

    private panMapForPopup(popup: L.Popup, popupWrap, articleElt) {
        console.log('MapComponent.panMapForPopup');
        // map should pan right/east if the popup balloon is covered by the article;
        // pad is a slight relief between the popup and the article
        const pad = L.point(popup.options.autoPanPaddingBottomRight || popup.options.autoPanPadding);
        const padX = pad ? pad.x : 0;

        const rect: DOMRect | ClientRect = popupWrap.getBoundingClientRect();
        const popupRightX = rect.left + rect.width + padX;
        const edgePtX = articleElt.getBoundingClientRect().left;

        if (popupRightX > edgePtX) {
            const dist = popupRightX - edgePtX;
            if (popup.isOpen()) {
                this.map.panBy([dist, 0]);
            }
        }
    }
}
