
import * as L from 'leaflet';
import { Marker } from '../marker/marker';

export class Article {

    private latLng: L.LatLng;
    private layerType;

    constructor(
          private         id:        string
        , private citedRange:        Object
        , private    iconUrl:        string
        , private     marker:        Marker
        ,            geojson: MarkerGeoJson
    ) {
        const lat = geojson.geometry.coordinates[1];
        const lng = geojson.geometry.coordinates[0];
        this.latLng = new L.LatLng(lat, lng);
        this.layerType = geojson.type;
    }
    public getId():         string { return this.id;         }
    public getCitedRange(): Object { return this.citedRange; }
    public getIconUrl():    string { return this.iconUrl;    }
    public getMarker():     Marker { return this.marker;     }
    public getLayer():      string { return this.layerType;  }
    public getLatLng():   L.LatLng { return this.latLng;     }
}
