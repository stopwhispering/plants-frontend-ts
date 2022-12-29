import Util from "plants/ui/customClasses/shared/Util";
import ModelsHelper from "plants/ui/model/ModelsHelper"
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler"
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker";
import { BResultsGetTaxon, BTaxon } from "plants/ui/definitions/Taxon";

/**
 * @namespace plants.ui.customClasses.taxonomy
 */
export default class TaxonLoader extends ManagedObject {

	private _oTaxonModel: JSONModel;

	public constructor(oTaxonModel: JSONModel) {
		super();

		this._oTaxonModel = oTaxonModel;
	}

	public loadTaxonIfRequired(taxon_id: int): void{
		// in case we loaded a plant from same taxon earlier, we may not overwrite it in case of changes
		// we can just leave then as the correct taxon has already been bound to the view
		const oTaxon = this._oTaxonModel.getProperty('/TaxaDict/' + taxon_id);
		if (oTaxon) {
			return;
		}

		// request taxon details from backend
		const uri = 'taxa/' + taxon_id;
		$.ajax({
			url: Util.getServiceUrl(uri),
			context: this,
			async: true
		})
			.done(this._onReceivingTaxonDetailsForPlant.bind(this, taxon_id!))
			.fail(ModelsHelper.onReceiveErrorGeneric.bind(this, 'Event (GET)'))
	}

	private _onReceivingTaxonDetailsForPlant(taxonId: int, oData: BResultsGetTaxon): void {
		//insert (overwrite!) events data for current plant with data received from backend
		const oTaxon = <BTaxon>oData.taxon;
		this._oTaxonModel.setProperty('/TaxaDict/' + taxonId + '/', oTaxon);
		ChangeTracker.getInstance().addOriginalTaxon(oTaxon);
		MessageHandler.getInstance().addMessageFromBackend(oData.message);
	}
}