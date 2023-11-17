import Input from "sap/m/Input";
import type { MetadataOptions } from "sap/ui/core/Element";
import IconPool from "sap/ui/core/IconPool";

/**
 * @namespace plants.ui.control
 */
export default class InputWithIcon extends Input {
  // The following three lines were generated and should remain as-is to make TypeScript aware of the constructor signatures
  constructor(idOrSettings?: string | $InputWithIconSettings);
  constructor(id?: string, settings?: $InputWithIconSettings);
  constructor(id?: string, settings?: $InputWithIconSettings) { super(id, settings); }


    static readonly metadata: MetadataOptions = {        
      events: {
        endButtonPress: {},  // onmouseover, onmouseout; existing events are not overwritten
      }                      
    }

    // overriding super class method
    init(){
        // Input.prototype.init.apply(this, arguments);
        super.init();
        const icon = this.addEndIcon({
          id: this.getId() + "-IconBtn",
          src: IconPool.getIconURI('cancel'),
          noTabStop: true,
          tooltip: "Set unknown",
          press: [
            this.onEndButtonPress, 
            this],
        }, -1); // See sap.ui.core.Icon/properties for more settings
        const a = 1;
        // icon.addStyleClass(...); if even more customization required..
    }

      onBeforeRendering(oEvent: JQuery.Event){
        super.onBeforeRendering(oEvent);
        var endIcons = this.getAggregation("_endIcon");
        var isEditable = this.getEditable();
        if (Array.isArray(endIcons)) {
          endIcons.map(icon => icon.setProperty("visible", isEditable, true));
        }
      }
  
    private onEndButtonPress(){
        if (this.getEnabled() && this.getEditable()) {
          //@ts-ignore
          this.fireEndButtonPress({});
          this.setValue('-');
        }
      }
  
      renderer = {}

}