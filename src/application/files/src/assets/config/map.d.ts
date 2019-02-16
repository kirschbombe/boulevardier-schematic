
/// <reference types="leaflet" />

declare interface MapConfig {
    map: L.MapOptions;
    tileLayer: L.TileLayerOptions;
    scale: L.Control.ScaleOptions;
    control: { layers: L.Control.LayersOptions };
    features: L.MarkerOptions;
    urlTemplate: string;
    view?: { latLng: L.LatLngLiteral; zoom: number; };
}
