
export class Marker {
    public static LNG = 0;
    public static LAT = 1;
    constructor(
          private      id: string
        , private geoJson: MarkerGeoJson
        , private iconUrl: string
    ) { }
    public getId():         string { return this.id;                            }
    public getText():       string { return this.geoJson.properties.text;       }
    public getMarkerName(): string { return this.geoJson.properties.markername; }
    public getIconUrl():    string { return this.iconUrl;                       }
    public getType(): GeoJSON.GeoJsonTypes {
        return this.geoJson.type;
    }
    public getGeoJson(): MarkerGeoJson {
        return this.geoJson;
    }
    public getLat(): number {
        return this.geoJson.geometry.coordinates[Marker.LAT];
    }
    public getLng(): number {
        return this.geoJson.geometry.coordinates[Marker.LNG];
    }
}
