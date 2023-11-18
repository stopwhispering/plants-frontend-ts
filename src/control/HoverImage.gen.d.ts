import Event from "sap/ui/base/Event";
import { $ImageSettings } from "sap/m/Image";

declare module "./HoverImage" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $HoverImageSettings extends $ImageSettings {
        hover?: (event: Event) => void;
    }

    export default interface HoverImage {

        // event: hover
        attachHover(fn: (event: Event) => void, listener?: object): this;
        attachHover<CustomDataType extends object>(data: CustomDataType, fn: (event: Event, data: CustomDataType) => void, listener?: object): this;
        detachHover(fn: (event: Event) => void, listener?: object): this;
        fireHover(parameters?: object): this;
    }
    
    export type HoverImage$HoverEvent = Event<HoverImage$HoverEventParameters, HoverImage>; 
    export type LHoverAction = "on" | "out";
    export interface HoverImage$HoverEventParameters {
        action: LHoverAction;
    }

    export type HoverImage$PressEvent = Event<PressEventParameters, HoverImage>; 
}
