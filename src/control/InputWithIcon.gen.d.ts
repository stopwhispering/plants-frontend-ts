import Event from "sap/ui/base/Event";
import { $InputSettings } from "sap/m/Input";

declare module "./InputWithIcon" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $InputWithIconSettings extends $InputSettings {
        endButtonPress?: (event: Event) => void;
    }

    export default interface InputWithIcon {

        // event: endButtonPress
        attachEndButtonPress(fn: (event: Event) => void, listener?: object): this;
        attachEndButtonPress<CustomDataType extends object>(data: CustomDataType, fn: (event: Event, data: CustomDataType) => void, listener?: object): this;
        detachEndButtonPress(fn: (event: Event) => void, listener?: object): this;
        fireEndButtonPress(parameters?: object): this;
    }
    
    export type InputWithIcon$EndButtonPressEvent = Event<InputWithIcon$EndButtonPressEventParameters, InputWithIcon>; 
}
