import { BPlant } from "plants/ui/definitions/Plants";
import Menu from "sap/m/Menu";
import ManagedObject from "sap/ui/base/ManagedObject";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import Event
    from "sap/ui/base/Event";
import Control from "sap/ui/core/Control";
import ObjectStatus from "sap/m/ObjectStatus";
import JSONModel from "sap/ui/model/json/JSONModel";
/**
 * @namespace plants.ui.customClasses.plants
 */
export default class DeletePlantTagMenuHandler extends ManagedObject {
    private _oDeletePlantTagMenu: Menu;
    private _oPlant: BPlant;
    private _oPlantsModel: JSONModel;

    public constructor(oPlantsModel: JSONModel) {
        super();
        this._oPlantsModel = oPlantsModel;
    }

    public openDeletePlantTagMenu(oPlant: BPlant, sPathTag: string, oAttachTo: View, oOpenBy: Control): void {
        this._oPlant = oPlant;

        if (!this._oDeletePlantTagMenu) {
            Fragment.load({
                name: "plants.ui.view.fragments.detail.DetailTagDelete",
                id: oAttachTo.getId(),
                controller: this
            }).then((oControl: Control | Control[]) => {
                this._oDeletePlantTagMenu = <Menu>oControl;

                // bind clicked tag to the popup menu
                this._oDeletePlantTagMenu.bindElement({
                    path: sPathTag,
                    model: "plants"
                });

                oAttachTo.addDependent(this._oDeletePlantTagMenu);
                this._oDeletePlantTagMenu.openBy(oOpenBy, true);
            });
        } else {
            // bind clicked tag to the popup menu and open it
            this._oDeletePlantTagMenu.bindElement({
                path: sPathTag,
                model: "plants"
            });
            this._oDeletePlantTagMenu.openBy(oOpenBy, true);
        }
    }

    pressDeleteTag(oEvent: Event) {
        var oSource = <ObjectStatus>oEvent.getSource();
        var oContext = oSource.getBindingContext('plants');
        // get position in tags array
        var sPathItem = oContext!.getPath();
        var sIndex = sPathItem.substring(sPathItem.lastIndexOf('/') + 1);
        const iIndex = parseInt(sIndex);
        // remove item from array
        // todo not here but in crud class
        // this._oPlantsModel.getData().PlantsCollection[this.mCurrentPlant.plant_index!].tags.splice(iIndex, 1);
        this._oPlant.tags.splice(iIndex, 1);
        this._oPlantsModel.updateBindings(false);
    }

}