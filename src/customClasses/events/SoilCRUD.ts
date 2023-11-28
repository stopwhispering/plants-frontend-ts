import Util from "plants/ui/customClasses/shared/Util";
import Dialog from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { CreateOrUpdateSoilResponse, GetSoilsResponse, SoilRead, SoilUpdate, SoilCreate } from "plants/ui/definitions/Events";
import { LSoilEditData } from "plants/ui/definitions/EventsLocal";
import ModelsHelper from "plants/ui/model/ModelsHelper";
import Control from "sap/ui/core/Control";
import ErrorHandling from "../shared/ErrorHandling";

/**
 * @namespace plants.ui.customClasses.events
 */
export default class SoilCRUD extends ManagedObject {

	private _oSoilsModel: JSONModel;  // "soils"

	public constructor() {
		super();

		this._oSoilsModel = new JSONModel(<GetSoilsResponse>{});  // will be loaded from backend
	}

	public updateOrCreateSoil(oEditedSoil: LSoilEditData, oDialogToCloseAfter: Dialog): void {
		//make sure soil has a name and a mix
		if (oEditedSoil.soil_name === "" || oEditedSoil.mix === "") {
			MessageToast.show('Enter soil mix name and mix ingredients.');
			return;
		}

		// new soil
		if (oEditedSoil.new) {
			if (oEditedSoil.id) {
				MessageToast.show("Unexpected ID found.")
				return;
			}
			this._saveNewSoil(oEditedSoil, oDialogToCloseAfter);
		} else
			this._updateExistingSoil(oEditedSoil, oDialogToCloseAfter);
	}	

	private _saveNewSoil(oNewSoil: LSoilEditData, oDialogToCloseAfter: Dialog): void {

		// check if there's already a same-named soil
		var aSoils = <SoilRead[]>this._oSoilsModel.getData().SoilsCollection;
		var existing_soil_found = aSoils.find(function (element) {
			return element.soil_name === oNewSoil.soil_name;
		});
		if (existing_soil_found) {
			MessageToast.show("Soil name already exists.")
			return;
		}

		var newSoil = <SoilCreate>{
			id: undefined,
			soil_name: oNewSoil.soil_name,
			description: oNewSoil.description,
			mix: oNewSoil.mix
		}

		Util.startBusyDialog('Saving new soil...');
		$.ajax({
			url: Util.getServiceUrl('events/soils'),
			type: 'POST',
			contentType: "application/json",
			data: JSON.stringify(newSoil),
			context: this
		})
			.done(this._cbSavedNewSoil.bind(this, oDialogToCloseAfter))
			.fail(ErrorHandling.onFail.bind(this, 'Save New Soil'));
	}

	private _cbSavedNewSoil(oDialogToCloseAfter: Dialog, data: CreateOrUpdateSoilResponse): void {
		// callback for request saving new soil 
		if (!data.soil.id) {
			MessageToast.show("Unexpected backend error - No Soil ID")
			return;
		}

		var aSoils = this._oSoilsModel.getData().SoilsCollection;
		var oNewSoil = {
			id: data.soil.id,
			soil_name: data.soil.soil_name,
			description: data.soil.description,
			mix: data.soil.mix
		}
		aSoils.push(oNewSoil);
		this._oSoilsModel.updateBindings(false);

		// busy dialog was started before ajax call
		Util.stopBusyDialog();
		oDialogToCloseAfter.close();
	}

	private _updateExistingSoil(oSoilData: LSoilEditData, oDialogToCloseAfter: Dialog): void {
		var updatedSoil = <SoilUpdate>{
			id: oSoilData.id,
			soil_name: oSoilData.soil_name,
			description: oSoilData.description,
			mix: oSoilData.mix
		}

		Util.startBusyDialog('Saving updated soil...');
		$.ajax({
			url: Util.getServiceUrl('events/soils'),
			type: 'PUT',
			contentType: "application/json",
			data: JSON.stringify(updatedSoil),
			context: this
		})
			.done(this._cbUpdatedExistingSoil.bind(this, oDialogToCloseAfter))
			.fail(ErrorHandling.onFail.bind(this, 'Save New Soil'));
	}

	private _cbUpdatedExistingSoil(oDialogToCloseAfter: Dialog, data: CreateOrUpdateSoilResponse): void {
		// callback for request updating existing soil 
		if (!data.soil.id) {
			MessageToast.show("Unexpected backend error - No Soil ID")
			return;
		}

		// todo use SoilUpdate
		var aSoils = <SoilRead[]>this._oSoilsModel.getData().SoilsCollection;
		var oSOil = aSoils.find(function (element) {
			return element.id === data.soil.id;
		});
		if (!oSOil) {
			MessageToast.show("Updated soil not found in Model")
			return;
		}

		oSOil.soil_name = data.soil.soil_name
		oSOil.description = data.soil.description
		oSOil.mix = data.soil.mix

		this._oSoilsModel.updateBindings(false);

		// busy dialog was started before ajax call
		Util.stopBusyDialog();
		oDialogToCloseAfter.close();

		// todo also update in current plant events list (currently requires a reload)
	}

	public loadSoils(oSetModelFor: Control) {
		// load soils collection from backend
		$.ajax({
			url: Util.getServiceUrl('events/soils'),
			type: 'GET',
			contentType: "application/json",
			context: this
		})
			.done(this._cbSoilLoaded.bind(this, oSetModelFor))
			.fail(ErrorHandling.onFail.bind(this, 'Get Soils'));
	}	

	private _cbSoilLoaded(oSetModelFor: Control, results: GetSoilsResponse): void{
		// callback for request to get soils collection
		this._oSoilsModel.setData(results);
		oSetModelFor.setModel(this._oSoilsModel, 'soils');
	}
}