import { CSSSize } from "sap/ui/core/library";
import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./LeafletMap" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $LeafletMapSettings extends $ControlSettings {
        width?: CSSSize | PropertyBindingInfo | `{${string}}`;
        height?: CSSSize | PropertyBindingInfo | `{${string}}`;
        geoJsonHighlights?: string[] | PropertyBindingInfo | `{${string}}`;
        highlightColor?: string | PropertyBindingInfo;
        permanentTooltips?: boolean | PropertyBindingInfo | `{${string}}`;
        drawOpenStreetMap?: boolean | PropertyBindingInfo | `{${string}}`;
        drawGeoJsonMap?: boolean | PropertyBindingInfo | `{${string}}`;
        defaultZoomLevel?: number | PropertyBindingInfo | `{${string}}`;
        autoZoom?: boolean | PropertyBindingInfo | `{${string}}`;
        autoPanToSelectedAreas?: boolean | PropertyBindingInfo | `{${string}}`;
        geoJsonUrl?: string | PropertyBindingInfo;
        geoJsonPropertyKey?: string | PropertyBindingInfo;
        templateUrl?: string | PropertyBindingInfo;
        attribution?: string | PropertyBindingInfo;
    }

    export default interface LeafletMap {

        // property: width
        getWidth(): CSSSize;
        setWidth(width: CSSSize): this;

        // property: height
        getHeight(): CSSSize;
        setHeight(height: CSSSize): this;

        // property: geoJsonHighlights
        getGeoJsonHighlights(): string[];
        setGeoJsonHighlights(geoJsonHighlights: string[]): this;

        // property: highlightColor
        getHighlightColor(): string;
        setHighlightColor(highlightColor: string): this;

        // property: permanentTooltips
        getPermanentTooltips(): boolean;
        setPermanentTooltips(permanentTooltips: boolean): this;

        // property: drawOpenStreetMap
        getDrawOpenStreetMap(): boolean;
        setDrawOpenStreetMap(drawOpenStreetMap: boolean): this;

        // property: drawGeoJsonMap
        getDrawGeoJsonMap(): boolean;
        setDrawGeoJsonMap(drawGeoJsonMap: boolean): this;

        // property: defaultZoomLevel
        getDefaultZoomLevel(): number;
        setDefaultZoomLevel(defaultZoomLevel: number): this;

        // property: autoZoom
        getAutoZoom(): boolean;
        setAutoZoom(autoZoom: boolean): this;

        // property: autoPanToSelectedAreas
        getAutoPanToSelectedAreas(): boolean;
        setAutoPanToSelectedAreas(autoPanToSelectedAreas: boolean): this;

        // property: geoJsonUrl
        getGeoJsonUrl(): string;
        setGeoJsonUrl(geoJsonUrl: string): this;

        // property: geoJsonPropertyKey
        getGeoJsonPropertyKey(): string;
        setGeoJsonPropertyKey(geoJsonPropertyKey: string): this;

        // property: templateUrl
        getTemplateUrl(): string;
        setTemplateUrl(templateUrl: string): this;

        // property: attribution
        getAttribution(): string;
        setAttribution(attribution: string): this;
    }
}
