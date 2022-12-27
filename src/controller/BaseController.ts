//implements a set of functions that are reused by its subclasses (e.g. back button behaviour)
//abstract controller -> no ".controller." in the filename --> prevents usage in views, too
import Controller from "sap/ui/core/mvc/Controller"
import MessageHandler from "plants/ui/customClasses/MessageHandler"
import * as Util from "plants/ui/customClasses/Util";
import MessageToast from "sap/m/MessageToast"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import Fragment from "sap/ui/core/Fragment"
import Dialog from "sap/m/Dialog";
import Component from "../Component";
import Router from "sap/ui/core/routing/Router";
import { FBImage } from "../definitions/Images";
import Control from "sap/ui/core/Control";
import { LCategoryToPropertiesInCategoryMap, LPlantIdToPropertyCollectionMap, LPropertiesTaxonModelData, LTaxonToPropertyCategoryMap} from "../definitions/PropertiesLocal";
import { IdToFragmentMap } from "../definitions/SharedLocal";
import { PlantIdToEventsMap, EventsModelData } from "../definitions/EventsLocal";
import { BConfirmation, BMessage, BSaveConfirmation, FBMajorResource } from "../definitions/Messages";
import Event from "sap/ui/base/Event";
import Popover from "sap/m/Popover";
import ViewSettingsDialog from "sap/m/ViewSettingsDialog";
import { BTaxon, FTaxon } from "../definitions/Taxon";
import ChangeTracker from "../customClasses/ChangeTracker";
import { BPlant, FPlantsUpdateRequest } from "../definitions/Plants";
import { LTaxonData } from "../definitions/TaxonLocal";
import { LImageMap } from "../definitions/ImageLocal";
/**
 * @namespace plants.ui.controller
 */
export default class BaseController extends Controller {

	ModelsHelper: ModelsHelper

	protected oComponent: Component;
	protected oRouter: Router;
	private savingPlants = false;
	private savingImages = false;
	private savingTaxa = false;
	private savingEvents = false;
	private savingProperties = false;
	private savingPropertiesTaxa = false;

	public onInit() {
		this.oComponent = <Component>this.getOwnerComponent();
		this.oRouter = this.oComponent.getRouter();
	}

	protected applyToFragment(sId: string, fn: Function, fnInit?: Function, mIdToFragment?: IdToFragmentMap) {
		//create fragment singleton and apply supplied function to it (e.g. open, close)
		// if stuff needs to be done only once, supply fnInit wher^^e first usage happens

		//example usages:
		// this.applyToFragment('dialogDoSomething', _onOpenAddTagDialog.bind(this));
		// this.applyToFragment('dialogDoSomething', (o)=>o.close());
		// this.applyToFragment('dialogDoSomething', (o)=>{doA; doB; doC;}, fnMyInit);

		//fragment id to fragment file path
		if (!mIdToFragment) {
			mIdToFragment = <IdToFragmentMap>{
			}
		}

		var oView = this.getView();
		if (oView.byId(sId)) {
			fn(oView.byId(sId));
		} else {
			Fragment.load({
				name: mIdToFragment[sId],
				id: oView.getId(),
				controller: this
			}).then(function (oFragment: Control | Control[]) {
				oView.addDependent(<Control>oFragment);
				if (fnInit) {
					fnInit(oFragment);
				}
				fn(oFragment);
			});
		}
	}

	savePlantsAndImages() {
		//todo Save Class
		// saving images, plants, taxa, and events model
		Util.startBusyDialog('Saving...', 'Plants and Images');
		this.savingPlants = false;
		this.savingImages = false;
		this.savingTaxa = false;
		this.savingEvents = false;
		this.savingProperties = false;

		const oChangeTracker = ChangeTracker.getInstance();
		const aModifiedPlants: BPlant[] = oChangeTracker.getModifiedPlants();
		const aModifiedImages: FBImage[] = oChangeTracker.getModifiedImages();
		const aModifiedTaxa: BTaxon[] = oChangeTracker.getModifiedTaxa();
		const dModifiedEvents: PlantIdToEventsMap = oChangeTracker.getModifiedEvents();
		const dModifiedPropertiesPlants: LPlantIdToPropertyCollectionMap = oChangeTracker.getModifiedPlantProperties();
		const dModifiedPropertiesTaxa: LCategoryToPropertiesInCategoryMap = oChangeTracker.getModifiedTaxonProperties();

		// cancel busydialog if nothing was modified (callbacks not triggered)
		if ((aModifiedPlants.length === 0) && (aModifiedImages.length === 0) && (aModifiedTaxa.length === 0)
			&& (Object.keys(dModifiedEvents).length === 0) && (Object.keys(dModifiedPropertiesPlants).length === 0) && (Object.keys(dModifiedPropertiesTaxa).length === 0)) {
			MessageToast.show('Nothing to save.');
			Util.stopBusyDialog();
			return;
		}

		// save plants
		if (aModifiedPlants.length > 0) {
			this.savingPlants = true;  // required in callback function  to find out if both savings are finished
			var dPayloadPlants = { 'PlantsCollection': aModifiedPlants };
			$.ajax({
				url: Util.getServiceUrl('plants/'),
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(dPayloadPlants),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Plant (POST)'));
		}

		// save images
		if (aModifiedImages.length > 0) {
			this.savingImages = true;
			var dPayloadImages = { 'ImagesCollection': aModifiedImages };
			$.ajax({
				url: Util.getServiceUrl('images/'),
				type: 'PUT',
				contentType: "application/json",
				data: JSON.stringify(dPayloadImages),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Image (PUT)'));
		}

		// save taxa
		if (aModifiedTaxa.length > 0) {
			this.savingTaxa = true;


			// cutting occurrence images (read-only)
			const aModifiedTaxaUnattached: BTaxon[] = Util.getClonedObject(aModifiedTaxa);
			const aModifiedTaxaSave = <FTaxon[]>aModifiedTaxaUnattached.map(m => {
				// @ts-ignore
				delete m.occurrence_images;
				return m;
			});

			var dPayloadTaxa = { 'ModifiedTaxaCollection': aModifiedTaxaSave };
			$.ajax({
				url: Util.getServiceUrl('taxa/'),
				type: 'PUT',
				contentType: "application/json",
				data: JSON.stringify(dPayloadTaxa),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Taxon (POST)'));
		}

		// save events
		if (Object.keys(dModifiedEvents).length > 0) {
			this.savingEvents = true;
			var dPayloadEvents = { 'plants_to_events': dModifiedEvents };
			$.ajax({
				url: Util.getServiceUrl('events/'),
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(dPayloadEvents),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Event (POST)'));
		}

		// save properties
		if (Object.keys(dModifiedPropertiesPlants).length > 0) {
			this.savingProperties = true;
			var dPayloadProperties = { 'modifiedPropertiesPlants': dModifiedPropertiesPlants };
			$.ajax({
				url: Util.getServiceUrl('plant_properties/'),
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(dPayloadProperties),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'plant_properties (POST)'));
		}

		// save properties taxa
		if (Object.keys(dModifiedPropertiesTaxa).length > 0 || Object.keys(dModifiedPropertiesTaxa).length > 0) {
			this.savingPropertiesTaxa = true;
			var dPayloadPropertiesTaxa = { 'modifiedPropertiesTaxa': dModifiedPropertiesTaxa };
			$.ajax({
				url: Util.getServiceUrl('taxon_properties/'),
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(dPayloadPropertiesTaxa),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'taxon_properties (POST)'));
		}
	}

	onAjaxSimpleSuccess(oConfirmation: BConfirmation, sStatus: string, oReturnData: object) {
		//toast and create message
		//requires pre-defined message from backend
		//todo move to some utility class
		MessageToast.show(oConfirmation.message.message);
		MessageHandler.getInstance().addMessageFromBackend(oConfirmation.message);
	}

	private _onAjaxSuccessSave(oMsg: BSaveConfirmation, sStatus: string, oReturnData: object) {
		// cancel busydialog only if neither saving plants nor images or taxa is still running
		const sResource: FBMajorResource = oMsg.resource;
		if (sResource === 'PlantResource') {
			this.savingPlants = false;
			var oModelPlants = this.oComponent.getModel('plants');
			var dDataPlants: FPlantsUpdateRequest = oModelPlants.getData();
			ChangeTracker.getInstance().setOriginalPlants(dDataPlants);
		} else if (sResource === 'ImageResource') {
			this.savingImages = false;
			// var oImageMap: LImageMap = this.oComponent.imagesRegistry;
			// ChangeTracker.getInstance().setOriginalImages(oImageMap);
			ChangeTracker.getInstance().setOriginalImagesFromImageRegistry();
		} else if (sResource === 'TaxonResource') {
			this.savingTaxa = false;
			var oModelTaxon = this.oComponent.getModel('taxon');
			var dDataTaxon: LTaxonData = oModelTaxon.getData();
			ChangeTracker.getInstance().setOriginalTaxa(dDataTaxon);
		} else if (sResource === 'EventResource') {
			this.savingEvents = false;
			var oModelEvents = this.oComponent.getModel('events');
			var dDataEvents: EventsModelData = oModelEvents.getData();
			ChangeTracker.getInstance().setOriginalEvents(dDataEvents.PlantsEventsDict);
			MessageHandler.getInstance().addMessageFromBackend(oMsg.message);
		} else if (sResource === 'PlantPropertyResource') {
			this.savingProperties = false;
			var oModelProperties = this.oComponent.getModel('properties');
			var dDataProperties = oModelProperties.getData();
			const propertiesPlantsWithoutTaxa: LPlantIdToPropertyCollectionMap = ChangeTracker.getInstance().getPropertiesSansTaxa(dDataProperties.propertiesPlants);
			ChangeTracker.getInstance().setPlantPropertyCollections(propertiesPlantsWithoutTaxa)
			MessageHandler.getInstance().addMessageFromBackend(oMsg.message);
		} else if (sResource === 'TaxonPropertyResource') {
			this.savingPropertiesTaxa = false;
			var oModelPropertiesTaxa = this.oComponent.getModel('propertiesTaxa');
			var dDataPropertiesTaxa: LPropertiesTaxonModelData = oModelPropertiesTaxa.getData();
			const oTaxonToPropertyCategoryMap: LTaxonToPropertyCategoryMap = dDataPropertiesTaxa.propertiesTaxon;
			ChangeTracker.getInstance().setTaxonProperties(oTaxonToPropertyCategoryMap);
			MessageHandler.getInstance().addMessageFromBackend(oMsg.message);
		}

		if (!this.savingPlants && !this.savingImages && !this.savingTaxa && !this.savingEvents && !this.savingProperties && !this.savingPropertiesTaxa) {
			Util.stopBusyDialog();
		}
	}

	public onCancelDialog(oEvent: Event) {
		// generic handler for fragments to be closed
		let oControl = <Control>oEvent.getSource();
		// navigate through the control tree until we have a sap.m.Dialog or a sap.m.Popover
		do {
			oControl = <Control>oControl.getParent();
		} while (oControl.getParent() !== undefined && !(oControl instanceof Dialog) && !(oControl instanceof Popover) && !(oControl instanceof ViewSettingsDialog));
		if (!oControl) {
			MessageToast.show("Error: Could not find Dialog or Popover to close");
			return
		}
		(<Dialog | Popover>oControl).close();
	}

	protected onReceiveSuccessGeneric(oMsg: BMessage) {
		Util.stopBusyDialog();
		MessageToast.show(oMsg.message);
		MessageHandler.getInstance().addMessageFromBackend(oMsg);
	}
}