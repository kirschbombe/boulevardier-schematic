type MenuItemType = {
    id: string;
    title: string;
    routerLink: string;
};
interface ImagesSectionConfig {
    pathBase: string;
}
interface IconsSectionConfig {
    pathBase: string;
    files: string[];
}
interface ControlsSectionConfig {
    [id: string]: { enable: boolean };
}
declare interface SiteConfig {
    articles: MenuItemType[];
//    controls:   ControlsSectionConfig;
    pages: MenuItemType[];
}
