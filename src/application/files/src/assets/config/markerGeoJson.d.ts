
/// <reference types="GeoJSON" />

interface propetiesSection {
    markername: string;
    text: string;
    layer: string;
    iconUrl: string;
}

declare interface MarkerGeoJson {
    type: GeoJSON.GeoJsonTypes;
    geometry: GeoJSON.Point;
    properties: propetiesSection;
}
