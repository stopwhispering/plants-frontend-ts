import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker";
import { LTaxonMap } from "plants/ui/definitions/TaxonLocal";
import TaxonLoader from "./TaxonLoader";
import { PlantRead } from "plants/ui/definitions/Plants";

/**
 * @namespace plants.ui.customClasses.taxonomy
 */
export default class TaxonRegistryHandler extends ManagedObject {

	private _oPlantsModel: JSONModel;
	private _oTaxonModel: JSONModel;

	public constructor(oPlantsModel: JSONModel, oTaxonModel: JSONModel) {
		super();

		this._oPlantsModel = oPlantsModel;
		this._oTaxonModel = oTaxonModel;
	}

	public resetTaxonRegistry(): void {
		// reset the taxa registry including it's clone and trigger reload of current plant's taxon details
		this._oTaxonModel.setProperty('/', {TaxaDict: <LTaxonMap>{}});
		ChangeTracker.getInstance().resetOriginalTaxa();
		this._oTaxonModel.updateBindings(false);

		// trigger reload of taxon details for current plant
		const iPlantId = this._parse_plant_id_from_hash();
		if (!iPlantId)
			return;
		const aPlants = <PlantRead[]>this._oPlantsModel.getProperty('/PlantsCollection/');
		const oCurrentPlant = aPlants.find(p => p.id === iPlantId);
		if (!oCurrentPlant)
			throw new Error('Plant with id ' + iPlantId + ' not found in plants collection');
		if (!oCurrentPlant.taxon_id)
			return;

		new TaxonLoader(this._oTaxonModel).loadTaxonIfRequired(oCurrentPlant.taxon_id);		
		// this.loadTaxon(oCurrentPlant.taxon_id);
	}	

	private _parse_plant_id_from_hash(): int|undefined {
		// todo move to Util
		// parse plant id from hash, e.g. '#/detail/870/TwoColumnsMidExpanded' -> 870
		const sHash: string = window.location.hash;
		if (sHash.startsWith('#/detail/')) {
			const aParts = sHash.split('/');
			return parseInt(aParts[2]);
		}
	}	
}