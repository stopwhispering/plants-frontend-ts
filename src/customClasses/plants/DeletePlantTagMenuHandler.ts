import { BPlant } from "plants/ui/definitions/Plants";
import Menu from "sap/m/Menu";
import ManagedObject from "sap/ui/base/ManagedObject";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import Control from "sap/ui/core/Control";
import JSONModel from "sap/ui/model/json/JSONModel";
import MenuItem, { MenuItem$PressEvent } from "sap/m/MenuItem";
import { LTagInput, LTagType } from "plants/ui/definitions/entities";
import PlantTagger from "./PlantTagger";
/**
 * @namespace plants.ui.customClasses.plants
 */
export default class DeletePlantTagMenuHandler extends ManagedObject {
    private _oDeletePlantTagMenu: Menu;
    private _oPlant: BPlant;
    private _oPlantsModel: JSONModel;
    private _eTagType: LTagType
    private _sTagValue: string;
	private _oPlantTagger: PlantTagger;

    public constructor(oPlantsModel: JSONModel) {
        super();
        this._oPlantsModel = oPlantsModel;
		this._oPlantTagger = new PlantTagger(oPlantsModel);
    }

    public openDeletePlantTagMenu(oPlant: BPlant, sTagValue: string, oAttachTo: View, oOpenBy: Control, eTagType: LTagType): void {
        this._oPlant = oPlant;
        this._eTagType = eTagType;
        this._sTagValue = sTagValue;

        if (!this._oDeletePlantTagMenu) {
            Fragment.load({
                name: "plants.ui.view.fragments.detail.DetailTagDelete",
                id: oAttachTo.getId(),
                controller: this
            }).then((oControl: Control | Control[]) => {
                this._oDeletePlantTagMenu = <Menu>oControl;
                oAttachTo.addDependent(this._oDeletePlantTagMenu);
                this._oDeletePlantTagMenu.openBy(oOpenBy, true);
            });
        } else {
            this._oDeletePlantTagMenu.openBy(oOpenBy, true);
        }
    }

    pressDeleteTag(oEvent: MenuItem$PressEvent) {
        if (this._eTagType === 'Plant') {
            const iIndex  = this._oPlant.tags.findIndex(oTag=>oTag.text === this._sTagValue);
            if (iIndex === -1) {
                throw new Error('Tag not found');
            }

            // remove item from array
            // todo not here but in crud class
            this._oPlant.tags.splice(iIndex, 1);
            this._oPlantsModel.updateBindings(true);  // have it updated in master view, too
        } else {
            // delete in all the taxon's plants
            if(!this._oPlant.taxon_id)
            throw new Error('Taxon ID is missing');
            this._oPlantTagger.deleteTaxonTagFromPlants(this._sTagValue, this._oPlant.taxon_id);
        }
    }

}