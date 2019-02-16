
// See
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/11b48a05a8c7f2fb931ae89886006b7e1ab420e7/types/leaflet/index.d.ts

declare interface MapConfig {
    map: L.MapOptions;
    tileLayer: L.TileLayerOptions;
    scale: L.Control.ScaleOptions;
    control: { layers: L.Control.LayersOptions };
    features: L.MarkerOptions;
    urlTemplate: string;
    view?: { latLng: L.LatLngLiteral; zoom: number; };
}
