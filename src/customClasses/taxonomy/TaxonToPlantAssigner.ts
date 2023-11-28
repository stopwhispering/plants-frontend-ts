import { TaxonRead } from "plants/ui/definitions/Taxon";
import ManagedObject from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import { PlantRead } from "plants/ui/definitions/Plants";
import ChangeTracker from "../singleton/ChangeTracker";

/**
 * @namespace plants.ui.customClasses.taxonomy
 */
export default class TaxonToPlantAssigner extends ManagedObject {

	private _oTaxonModel: JSONModel;
	private _oPlantsModel: JSONModel;

	public constructor(oPlantsModel: JSONModel, oTaxonModel: JSONModel) {
		super();

        this._oPlantsModel = oPlantsModel;
		this._oTaxonModel = oTaxonModel;
	}

	public assignTaxonToPlant(oPlant: PlantRead, oTaxon: TaxonRead, sBotanicalName: string) {
		//we assign that taxon id to the plant; this is persisted only upon saving
		//the whole new taxon dictionary is added to the taxon model and it's clone
		oPlant.botanical_name = sBotanicalName;
		oPlant.taxon_id = oTaxon.id;
		this._oPlantsModel.updateBindings(false);

		// add taxon to model if new 
		var sPathTaxon = '/TaxaDict/' + oTaxon.id;
		if (this._oTaxonModel.getProperty(sPathTaxon) === undefined) {
			this._oTaxonModel.setProperty(sPathTaxon, oTaxon);
		}

		//add taxon to model's clone if new
		const oChangeTracker = ChangeTracker.getInstance();
		if (!oChangeTracker.hasOriginalTaxon(oTaxon.id))
			oChangeTracker.addOriginalTaxon(oTaxon);
	}
}