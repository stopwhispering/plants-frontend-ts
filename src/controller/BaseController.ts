//implements a set of functions that are reused by its subclasses (e.g. back button behaviour)
//abstract controller -> no ".controller." in the filename --> prevents usage in views, too
import Controller from "sap/ui/core/mvc/Controller"
import MessageBox from "sap/m/MessageBox"
import MessageUtil from "plants/ui/customClasses/MessageUtil"
import * as Util from "plants/ui/customClasses/Util";
import MessageToast from "sap/m/MessageToast"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import Fragment from "sap/ui/core/Fragment"
import Dialog from "sap/m/Dialog";
import Component from "../Component";
import Router from "sap/ui/core/routing/Router";
import { LTaxonMap } from "../definitions/TaxonLocal";
import { FBImage } from "../definitions/Images";
import { LImageMap } from "../definitions/ImageLocal";
import Control from "sap/ui/core/Control";
import { FBPropertyCollectionPlant } from "../definitions/Properties";
import { LCategoryToPropertiesInCategoryMap, LPlantIdToPropertyCollectionMap, LPropertiesTaxonModelData } from "../definitions/PropertiesLocal";
import { BPlant } from "../definitions/Plants";
import ListBinding from "sap/ui/model/ListBinding";
import Label from "sap/ui/webc/main/Label";
import { IdToFragmentMap } from "../definitions/SharedLocal";
import { PlantIdToEventsMap } from "../definitions/EventsLocal";
import { BConfirmation, BMessage, BSaveConfirmation, FBMajorResource } from "../definitions/Messages";
import Event from "sap/ui/base/Event";
import Popover from "sap/m/Popover";
import ViewSettingsDialog from "sap/m/ViewSettingsDialog";
import { FBTaxon } from "../definitions/Taxon";
import { LPropagationTypeData } from "../definitions/PlantsLocal";
import { FImageDelete, FImagesToDelete } from "../definitions/Events";

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

	_getFragment(sId: string) {
		//returns already-instantiated fragment by sId
		//if not sure wether instantiated, use applyToFragment
		return this.getView().byId(sId);
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

	getModifiedPlants() {
		// get plants model and identify modified items
		var oModelPlants = this.oComponent.getModel('plants');
		var dDataPlants = oModelPlants.getData();
		var aModifiedPlants = [];
		var aOriginalPlants = this.oComponent.oPlantsDataClone['PlantsCollection'];
		for (var i = 0; i < dDataPlants['PlantsCollection'].length; i++) {
			if (!Util.dictsAreEqual(dDataPlants['PlantsCollection'][i],
				aOriginalPlants[i])) {
				// we need to check if our modified object differs only in structure of parent plant but still
				// has same parent pland id or none
				var oModified = Util.getClonedObject(dDataPlants['PlantsCollection'][i]);
				if (!!oModified.parent_plant && !oModified.parent_plant.id) {
					oModified.parent_plant = null;
				}
				if (!!oModified.parent_plant_pollen && !oModified.parent_plant_pollen.id) {
					oModified.parent_plant_pollen = null;
				}
				if (!Util.dictsAreEqual(oModified, aOriginalPlants[i])) {

					aModifiedPlants.push(dDataPlants['PlantsCollection'][i]);

				}
			}
		}
		return aModifiedPlants;
	}

	public getModifiedTaxa(): FBTaxon[] {
		// get taxon model and identify modified items
		// difference to plants and images: data is stored with key in a dictionary, not in an array
		// we identify the modified sub-dictionaries and return a list of these
		// note: we don't check whether there's a new taxon as after adding a taxon, it is added
		//	     to the clone as well
		// we don't check for deleted taxa as there's no function for doing this in frontend
		var oModelTaxon = this.oComponent.getModel('taxon');
		var dDataTaxon: LTaxonMap = oModelTaxon.getData().TaxaDict;
		var dDataTaxonOriginal: LTaxonMap = this.oComponent.oTaxonDataClone['TaxaDict'];

		//get taxon id's, i.e. keys of the taxa dict
		var keys_s = <string[]>Object.keys(dDataTaxonOriginal);
		var keys = <int[]>keys_s.map(k => parseInt(k));

		//for each key, check if it's value is different from the clone
		var aModifiedTaxonList: FBTaxon[] = [];

		keys.forEach(function (key) {
			if (!Util.dictsAreEqual(dDataTaxonOriginal[key],
				dDataTaxon[key])) {
				aModifiedTaxonList.push(dDataTaxon[key]);
			}
		}, this);

		return aModifiedTaxonList;
	}

	private _getModifiedEvents(): PlantIdToEventsMap {
		// returns a dict with events for those plants where at least one event has been modified, added, or deleted
		const oModelEvents = this.oComponent.getModel('events');
		const oDataEvents: PlantIdToEventsMap = oModelEvents.getData().PlantsEventsDict;
		const oDataEventsClone: PlantIdToEventsMap = this.oComponent.oEventsDataClone;

		//get plants for which we have events in the original dataset
		//then, for each of them, check whether events have been changed
		let oModifiedEventsDict: PlantIdToEventsMap = {};
		const keys_clones = Object.keys(oDataEventsClone);
		const keys_clone = <int[]>keys_clones.map(k => parseInt(k));
		keys_clone.forEach(function (key) {
			// if(!Util.arraysAreEqual(dDataEventsClone[key],
			if (!Util.objectsEqualManually(oDataEventsClone[key],
				oDataEvents[key])) {
				oModifiedEventsDict[key] = oDataEvents[key];
			}
		}, this);

		//added plants
		const keys_s = Object.keys(oDataEvents);
		const keys = <int[]>keys_s.map(k => parseInt(k));
		keys.forEach(function (key) {
			if (!oDataEventsClone[key]) {
				oModifiedEventsDict[key] = oDataEvents[key];
			}
		}, this);

		return oModifiedEventsDict;
	}

	private _getPropertiesSansTaxa(dProperties_: LPlantIdToPropertyCollectionMap): LPlantIdToPropertyCollectionMap {
		var dProperties: LPlantIdToPropertyCollectionMap = Util.getClonedObject(dProperties_);
		for (var i = 0; i < Object.keys(dProperties).length; i++) {
			const iPlantId: int = parseInt(Object.keys(dProperties)[i]);
			var oTaxonPropertiesInCategories: FBPropertyCollectionPlant = dProperties[iPlantId] as unknown as FBPropertyCollectionPlant;

			for (var j = 0; j < oTaxonPropertiesInCategories.categories.length; j++) {
				var oCategory = oTaxonPropertiesInCategories.categories[j];

				// reverse-loop as we might need to delete a property (name) node within the loop
				for (var k = oCategory.properties.length - 1; k >= 0; k--) {
					var oProperty = oCategory.properties[k];

					// remove taxon property value
					var foundTaxonProperty = oProperty.property_values.find(element => element["type"] === "taxon");
					if (foundTaxonProperty) {
						var iIndex = oProperty.property_values.indexOf(foundTaxonProperty);
						oProperty.property_values.splice(iIndex, 1);
					}

					// if there's no plant property value, just remove the whole property name noe
					var foundPlantProperty = oProperty.property_values.find(element => element["type"] === "plant");
					if (!foundPlantProperty)
						oCategory.properties.splice(k, 1);
				}
			}
		}
		return dProperties;
	}

	private _getModifiedPropertiesPlants() {
		// returns a dict with properties for those plants where at least one property has been modified, added, or deleted
		// for these plants, properties are supplied completely; modifications are then identified in backend
		const oModelProperties = this.oComponent.getModel('properties');
		const dDataProperties: LPlantIdToPropertyCollectionMap = oModelProperties.getData().propertiesPlants;
		// clean up the properties model data (returns a clone, not the original object!)
		const dDataPropertiesCleaned: LPlantIdToPropertyCollectionMap = this._getPropertiesSansTaxa(dDataProperties);
		const dDataPropertiesOriginal: LPlantIdToPropertyCollectionMap = this.oComponent.oPropertiesDataClone;

		// get plants for which we have properties in the original dataset
		// then, for each of them, check whether properties have been changed
		let dModifiedPropertiesDict: LPlantIdToPropertyCollectionMap = {};
		const keys_clone_s = Object.keys(dDataPropertiesOriginal);
		const keys_clone = <int[]>keys_clone_s.map(k => parseInt(k));
		keys_clone.forEach(function (key) {
			// loop at plants
			if (!Util.objectsEqualManually(dDataPropertiesOriginal[key],
				dDataPropertiesCleaned[key])) {
				dModifiedPropertiesDict[key] = dDataPropertiesCleaned[key];
			}
		}, this);

		return dModifiedPropertiesDict;
	}

	private _getModifiedPropertiesTaxa(): LCategoryToPropertiesInCategoryMap {
		const oModelProperties = this.oComponent.getModel('propertiesTaxa');
		const oDataPropertiesTaxon: LPropertiesTaxonModelData = oModelProperties.getData();
		const oPropertiesTaxon: LCategoryToPropertiesInCategoryMap = oDataPropertiesTaxon.propertiesTaxon;
		const oPropertiesTaxonOriginal: LCategoryToPropertiesInCategoryMap = this.oComponent.oPropertiesTaxonDataClone;

		if (!oPropertiesTaxonOriginal) {
			return {};
		}

		// get taxa for which we have properties in the original dataset
		// then, for each of them, check whether properties have been changed
		var oModifiedPropertiesDict: LCategoryToPropertiesInCategoryMap = {};
		const keys_clone_s = Object.keys(oPropertiesTaxonOriginal);
		const keys_clone = keys_clone_s.map(key => parseInt(key));
		keys_clone.forEach(function (key) {
			// loop at plants
			if (!Util.objectsEqualManually(oPropertiesTaxonOriginal[key],
				oPropertiesTaxon[key])) {
				oModifiedPropertiesDict[key] = oPropertiesTaxon[key];
			}
		}, this);

		return oModifiedPropertiesDict;
	}

	getModifiedImages(): FBImage[] {
		// identify modified images by comparing images with their clones (created after loading)
		var oImages: LImageMap = this.oComponent.imagesRegistry;
		var oImagesClone: LImageMap = this.oComponent.imagesRegistryClone;

		var aModifiedImages: FBImage[] = [];
		Object.keys(oImages).forEach(path => {
			if (!(path in oImagesClone) || !Util.dictsAreEqual(oImages[path], oImagesClone[path])) {
				aModifiedImages.push(oImages[path]);
			}
		});

		return aModifiedImages;
	}

	savePlantsAndImages() {
		// saving images, plants, taxa, and events model
		Util.startBusyDialog('Saving...', 'Plants and Images');
		this.savingPlants = false;
		this.savingImages = false;
		this.savingTaxa = false;
		this.savingEvents = false;
		this.savingProperties = false;

		var aModifiedPlants = this.getModifiedPlants();
		var aModifiedImages = this.getModifiedImages();
		var aModifiedTaxa = this.getModifiedTaxa();
		var dModifiedEvents = this._getModifiedEvents();
		var dModifiedPropertiesPlants = this._getModifiedPropertiesPlants();
		var dModifiedPropertiesTaxa = this._getModifiedPropertiesTaxa();

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
			var aModifiedTaxaSave: FBTaxon[] = Util.getClonedObject(aModifiedTaxa);
			aModifiedTaxaSave = aModifiedTaxaSave.map(m => {
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
		MessageToast.show(oConfirmation.message.message);
		MessageUtil.getInstance().addMessageFromBackend(oConfirmation.message);
	}

	private _onAjaxSuccessSave(oMsg: BSaveConfirmation, sStatus: string, oReturnData: object) {
		// cancel busydialog only if neither saving plants nor images or taxa is still running
		const sResource: FBMajorResource = oMsg.resource;
		if (sResource === 'PlantResource') {
			this.savingPlants = false;
			var oModelPlants = this.oComponent.getModel('plants');
			var dDataPlants = oModelPlants.getData();
			this.oComponent.oPlantsDataClone = Util.getClonedObject(dDataPlants);
		} else if (sResource === 'ImageResource') {
			this.savingImages = false;
			var oImages = this.oComponent.imagesRegistry;
			this.oComponent.imagesRegistryClone = Util.getClonedObject(oImages);
			// var oModelImages = this.oComponent.getModel('images');
			// var dDataImages = oModelImages.getData();
			// this.oComponent.oImagesDataClone = Util.getClonedObject(dDataImages);
		} else if (sResource === 'TaxonResource') {
			this.savingTaxa = false;
			var oModelTaxon = this.oComponent.getModel('taxon');
			var dDataTaxon = oModelTaxon.getData();
			this.oComponent.oTaxonDataClone = Util.getClonedObject(dDataTaxon);
		} else if (sResource === 'EventResource') {
			this.savingEvents = false;
			var oModelEvents = this.oComponent.getModel('events');
			var dDataEvents = oModelEvents.getData();
			this.oComponent.oEventsDataClone = Util.getClonedObject(dDataEvents.PlantsEventsDict);
			MessageUtil.getInstance().addMessageFromBackend(oMsg.message);
		} else if (sResource === 'PlantPropertyResource') {
			this.savingProperties = false;
			var oModelProperties = this.oComponent.getModel('properties');
			var dDataProperties = oModelProperties.getData();
			var propertiesPlantsWithoutTaxa = this._getPropertiesSansTaxa(dDataProperties.propertiesPlants);
			this.oComponent.oPropertiesDataClone = Util.getClonedObject(propertiesPlantsWithoutTaxa);
			MessageUtil.getInstance().addMessageFromBackend(oMsg.message);
		} else if (sResource === 'TaxonPropertyResource') {
			this.savingPropertiesTaxa = false;
			var oModelPropertiesTaxa = this.oComponent.getModel('propertiesTaxa');
			var dDataPropertiesTaxa = oModelPropertiesTaxa.getData();
			this.oComponent.oPropertiesTaxonDataClone = Util.getClonedObject(dDataPropertiesTaxa.propertiesTaxon);
			MessageUtil.getInstance().addMessageFromBackend(oMsg.message);
		}

		if (!this.savingPlants && !this.savingImages && !this.savingTaxa && !this.savingEvents && !this.savingProperties && !this.savingPropertiesTaxa) {
			Util.stopBusyDialog();
		}
	}

	updateTableHeaderPlantsCount() {
		// update count in table header
		var iPlants = (<ListBinding>this.getView().byId("plantsTable").getBinding("items")).getLength();
		var sTitle = "Plants (" + iPlants + ")";
		(<Label>this.getView().byId("pageHeadingTitle")).setText(sTitle);
	}

	handleErrorMessageBox(sText: string) {
		var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
		MessageBox.error(sText, {
			styleClass: bCompact ? "sapUiSizeCompact" : ""
		});
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

		// this.applyToFragment(dialogId, (oDialog: Dialog) => oDialog.close());
	}

	protected confirmDeleteImage(oImage: FBImage, sAction: string) {
		// triggered by onIconPressDeleteImage's confirmation dialogue from both Untagged and Detail View
		if (sAction !== 'Delete') {
			return;
		}

		const oPayload = <FImagesToDelete>{
			images: [<FImageDelete>{
				id: oImage.id,
				filename: oImage.filename
			}]
		};

		$.ajax({
			url: Util.getServiceUrl('images/'),
			type: 'DELETE',
			contentType: "application/json",
			data: JSON.stringify(oPayload),
			context: this
		})
			.done(this.onAjaxDeletedImagesSuccess.bind(this, [oImage], undefined))
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Image (DELETE)'));
	}

	// use a closure to pass an element to the callback function
	protected onAjaxDeletedImagesSuccess(aDeletedImages: FBImage[], cbCallback: Function | undefined, data: BConfirmation, textStats: any, jqXHR: any) {
		//show default success message after successfully deleting image in backend (either from untagged or detail view)
		this.onAjaxSimpleSuccess(data, textStats, jqXHR);

		// delete image in models...
		const oImagesModel = this.oComponent.getModel('images');
		const oUntaggedImagesModel = this.oComponent.getModel('untaggedImages');
		var aDataImages = <FBImage[]>oImagesModel.getData().ImagesCollection;
		var aDataUntagged = <FBImage[]>oUntaggedImagesModel.getData().ImagesCollection;

		var context = this;  // for the closure
		aDeletedImages.forEach(function (image: FBImage) {

			var iPosImages = aDataImages.indexOf(image);
			if (iPosImages >= 0) {
				aDataImages.splice(iPosImages, 1);
			}

			var iPosImages = aDataUntagged.indexOf(image);
			if (iPosImages >= 0) {
				aDataUntagged.splice(iPosImages, 1);
			}

			//... and deleted image in images registry
			delete context.oComponent.imagesRegistry[image.filename]
			delete context.oComponent.imagesRegistry[image.filename]
			delete context.oComponent.imagesRegistryClone[image.filename]

		});
		this.oComponent.getModel('images').refresh();
		this.oComponent.getModel('untaggedImages').refresh();

		if (!!cbCallback) {
			cbCallback();
		}
	}

	protected onReceiveSuccessGeneric(oMsg: BMessage) {
		Util.stopBusyDialog();
		MessageToast.show(oMsg.message);
		MessageUtil.getInstance().addMessageFromBackend(oMsg);
	}

	addPhotosToRegistry(aPhotos: FBImage[]) {
		///////////////TODOOOOOOOOo why is there a method with same name in the component????///////////7
		// add photos loaded for a plant to the registry if not already loaded with other plant
		// plus add a copy of the photo to a clone registry for getting changed photos when saving 
		aPhotos.forEach((photo: FBImage) => {
			if (!(photo.filename in this.oComponent.imagesRegistry)) {
				this.oComponent.imagesRegistry[photo.filename] = photo;
				this.oComponent.imagesRegistryClone[photo.filename] = Util.getClonedObject(photo);
			}
		});
	}

	resetImagesCurrentPlant(plant_id: int) {
		// @ts-ignore // typescript doesn't like Object.entries
		const aPhotosArr = <[string, FBImage][]>Object.entries(this.oComponent.imagesRegistry).filter(t => (t[1].plants.filter(p => p.plant_id === plant_id)).length == 1);
		var aPhotos = <FBImage[]>aPhotosArr.map(p => p[1]);
		this.oComponent.getModel('images').setProperty('/ImagesCollection', aPhotos);
		Util.stopBusyDialog(); // had been started in details onPatternMatched
	}

}