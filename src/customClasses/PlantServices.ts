
import MessageToast from "sap/m/MessageToast";
import * as Util from "plants/ui/customClasses/Util";
import Popover from "sap/m/Popover";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { ObjectStatusData } from "../definitions/entities";
import { BPlant, BResultsPlantCloned, BResultsPlantsUpdate, FBAssociatedPlantExtractForPlant, FBPlantTag, FPlant, FPlantsUpdateRequest } from "../definitions/Plants";
import ModelsHelper from "../model/ModelsHelper";
import MessageUtil from "./MessageUtil";
import Dialog from "sap/m/Dialog";
import Navigation from "./Navigation";
import Input from "sap/m/Input";
import { BConfirmation } from "../definitions/Messages";
import { LDescendantPlantInput, LPropagationTypeData } from "../definitions/PlantsLocal";
import SuggestionService from "./SuggestionService";

/**
 * @namespace plants.ui.customClasses
 */
export default class PlantServices extends ManagedObject {
	private applyToFragment: Function;
	private _oPlantsModel: JSONModel;
	private _oPlantsDataClone: FPlantsUpdateRequest
	private modelsHelper = ModelsHelper.getInstance();
	private suggestionService: SuggestionService;

	public constructor(applyToFragment: Function, oPlantsModel: JSONModel, oPlantsDataClone: FPlantsUpdateRequest, suggestionService: SuggestionService) {
		super();
		this.applyToFragment = applyToFragment;
		this.suggestionService = suggestionService;
		this._oPlantsModel = oPlantsModel;
		this._oPlantsDataClone = oPlantsDataClone;
	}

	public plantNameExists(sPlantName: string) {
		// returns true if a plant with supplied name already exists in the plants model
		var aPlants = <BPlant[]>this._oPlantsModel.getProperty('/PlantsCollection');
		return (aPlants.find(ele => ele.plant_name === sPlantName) !== undefined);
	}

	getPlantById(plantId: int): BPlant {
		// todo replace other implementation of function with this here
		// todo maybe move to PlantServices
		var aPlants: BPlant[] = this._oPlantsModel.getProperty('/PlantsCollection');
		var oPlant = aPlants.find(ele => ele.id === plantId);
		if (oPlant === undefined) {
			throw "Plant not found";
		} else {
			return oPlant;
		}
	}

	getPlantByName(plantName: string): BPlant {
		// todo replace other implementation of function with this here
		// todo maybe move to PlantServices
		var plants: BPlant[] = this._oPlantsModel.getProperty('/PlantsCollection');
		var plant = plants.find(ele => ele.plant_name === plantName);
		if (plant === undefined) {
			throw "Plant not found: " + plantName;
		} else {
			return plant;
		}
	}

	public addTagToPlant(oPopover: Popover, oPlant: BPlant): void{
		// create a new tag inside the plant's object in the plants model
		// it will be saved in backend when saving the plant
		// new/deleted tags are within scope of the plants model modification tracking
		var oModelTagTypes = <JSONModel>oPopover.getModel('tagTypes');
		var dDialogData = oModelTagTypes.getData();
		dDialogData.Value = dDialogData.Value.trim();

		// check if empty 
		if (dDialogData.Value.length === 0) {
			MessageToast.show('Enter text first.');
			return;
		}

		// get selected ObjectStatus template
		var oSelectedElement = dDialogData.ObjectStatusCollection.find(function (element: ObjectStatusData) {
			return element.selected;
		});

		// check if same-text tag already exists for plant
		if (oPlant.tags) {
			var bFound = oPlant.tags.find(function (oTag: FBPlantTag) {
				return oTag.text === dDialogData.Value;
			});
			if (bFound) {
				MessageToast.show('Tag already exists.');
				return;
			}
		}

		// create new token object in plants model
		var dNewTag = <FBPlantTag>{
			// id is determined upon saving to db
			text: dDialogData.Value,
			// icon: oSelectedElement.icon,
			state: oSelectedElement.state,
			// last_update is determined upon saving to db
			// plant_name: oPlant.plant_name,
			plant_id: oPlant.id
		};
		if (oPlant.tags) {
			oPlant.tags.push(dNewTag);
		} else {
			oPlant.tags = [dNewTag];
		}

		this._oPlantsModel.updateBindings(false);
	}

	public clonePlant(oPlant: BPlant, sClonedPlantName: string): void {
		// use ajax to clone plant in backend, then add clone to plants model and open in details view, also add
		// cloned plant to the plants model clone to track changes

		// check if duplicate
		if (sClonedPlantName === '') {
			MessageToast.show('Empty not allowed.');
			return;
		}

		//check if new
		if (this.plantNameExists(sClonedPlantName)) {
			MessageToast.show('Plant Name already exists.');
			return;
		}

		// ajax call
		Util.startBusyDialog("Cloning...", '"' + oPlant.plant_name + '" to "' + sClonedPlantName + '"');
		$.ajax({
			url: Util.getServiceUrl('plants/' + oPlant.id + '/clone?plant_name_clone=' + sClonedPlantName),
			type: 'POST',
			contentType: "application/json",
			context: this
		})
			.done(this._onReceivingPlantCloned.bind)
			.fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Clone Plant (POST)'));
	}

	private _onReceivingPlantCloned(oBackendResultPlantCloned: BResultsPlantCloned): void {
		// Cloning plant was successful; add clone to model and open in details view
		this.applyToFragment('dialogClonePlant', (oDialog: Dialog) => oDialog.close());
		MessageUtil.getInstance().addMessageFromBackend(oBackendResultPlantCloned.message);

		var oPlantSaved = <BPlant>oBackendResultPlantCloned.plant;
		var aPlants = this._oPlantsModel.getProperty('/PlantsCollection');
		aPlants.push(oPlantSaved);  // append at end to preserve change tracking with clone 
		this._oPlantsModel.updateBindings(false);

		// ...and add to cloned plants to allow change tracking
		var oPlantClone = Util.getClonedObject(oPlantSaved);
		this._oPlantsDataClone.PlantsCollection.push(oPlantClone);
		MessageToast.show(oBackendResultPlantCloned.message.message);

		// finally navigate to the newly created plant in details view
		Navigation.getInstance().navToPlantDetails(oPlantSaved.id!);
		Util.stopBusyDialog();
	}	

	public renamePlant(oPlant: BPlant, sNewPlantName: string, _fnRequestImagesForPlant: Function): void {
		// use ajax to rename plant in backend

		// check if duplicate
		if (sNewPlantName === '') {
			MessageToast.show('Empty not allowed.');
			return;
		}

		//check if new
		if (this.plantNameExists(sNewPlantName)) {
			MessageToast.show('Plant Name already exists.');
			return;
		}

		// ajax call
		Util.startBusyDialog("Renaming...", '"' + oPlant.plant_name + '" to "' + sNewPlantName + '"');
		var dPayload = {
			'OldPlantName': oPlant.plant_name,
			'NewPlantName': sNewPlantName
		};
		$.ajax({
			url: Util.getServiceUrl('plants/'),
			type: 'PUT',
			contentType: "application/json",
			data: JSON.stringify(dPayload),
			context: this
		})
			.done(this._onReceivingPlantNameRenamed.bind(this, oPlant, _fnRequestImagesForPlant))
			.fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Plant (PUT)'));
	}

	private _onReceivingPlantNameRenamed(oPlant: BPlant, _fnRequestImagesForPlant: Function, oMsg: BConfirmation): void {
		//plant was renamed in backend
		Util.stopBusyDialog();
		MessageToast.show(oMsg.message.message);
		MessageUtil.getInstance().addMessageFromBackend(oMsg.message);

		Util.startBusyDialog('Loading...', 'Loading plants and images data');

		this.modelsHelper.reloadPlantsFromBackend();
		this.modelsHelper.resetImagesRegistry();

		_fnRequestImagesForPlant(oPlant.id!);  // todo do this in a better way

		this.applyToFragment('dialogRenamePlant', (o: Dialog) => o.close());
	}

	public saveNewPlant(oPlant: FPlant): void {
		// save plant to backend to receive plant id
		var dPayloadPlants = { 'PlantsCollection': [oPlant] };
		Util.startBusyDialog('Creating...', 'new plant ' + oPlant.plant_name);
		var that = this;
		$.ajax({
			url: Util.getServiceUrl('plants/'),
			type: 'POST',
			contentType: "application/json",
			data: JSON.stringify(dPayloadPlants),
			context: this
		})
			.done(function (oData: BResultsPlantsUpdate, sStatus: string, oReturnData: any) {
				// add new plant to model
				var oPlantSaved = oData.plants[0];
				var aPlants = that._oPlantsModel.getProperty('/PlantsCollection');
				var iPlantsCount = aPlants.push(oPlantSaved);  // append at end to preserve change tracking with clone 
				that._oPlantsModel.updateBindings(false);

				// ...and add to cloned plants to allow change tracking
				var oPlantClone = Util.getClonedObject(oPlantSaved);
				that._oPlantsDataClone.PlantsCollection.push(oPlantClone);
				MessageToast.show('Created plant ID ' + oPlantSaved.id + ' (' + oPlantSaved.plant_name + ')');

				// finally navigate to the newly created plant in details view
				// Navigation.navToPlantDetails.call(this, iPlantsCount-1);
				Navigation.getInstance().navToPlantDetails(oPlantSaved.id!);

			})
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Plant (POST)'))
			.always(function () {
				Util.stopBusyDialog();
			});
	}	

	public createDescendantPlant(descendantPlantInput: LDescendantPlantInput): void {
		// triggered from create-descendant-dialog to create the descendant plant
		//todo validate if existing
		if (!descendantPlantInput.propagationType || !descendantPlantInput.propagationType.length) {
			MessageToast.show('Choose propagation type.');
			return;
		}

		// validate parent plant (obligatory and valid) and parent plant pollen (valid if supplied)
		if (!descendantPlantInput.parentPlant || !this.plantNameExists(descendantPlantInput.parentPlant)) {
			MessageToast.show('Check parent plant.');
			return;
		}

		var propagationType = <LPropagationTypeData>this.suggestionService.getSuggestionItem('propagationTypeCollection', descendantPlantInput.propagationType);  // todo find a better way to implement this
		if (propagationType.hasParentPlantPollen === true &&
			!!descendantPlantInput.parentPlantPollen &&
			!this.plantNameExists(descendantPlantInput.parentPlantPollen)) {
			MessageToast.show('Check parent plant pollen.');
			return;
		};

		// validate new plant name
		if (!descendantPlantInput.descendantPlantName || !descendantPlantInput.descendantPlantName.trim().length) {
			MessageToast.show('Enter new plant name.');
			return;
		};

		if (this.plantNameExists(descendantPlantInput.descendantPlantName)) {
			MessageToast.show('Plant with that name already exists.');
			return;
		};

		const aPlants: BPlant[] = this._oPlantsModel.getProperty('/PlantsCollection');
		const oParentPlant = aPlants.find(ele => ele.plant_name === descendantPlantInput.parentPlant);
		if (!oParentPlant) {
			throw new Error('Parent plant not found.');
		}
		
		// assemble new plant and save it
		var newPlant = <FPlant>{
			id: undefined,  // created in backend
			plant_name: descendantPlantInput.descendantPlantName,
			field_number: propagationType.hasParentPlantPollen ? '-' : oParentPlant.field_number,
			geographic_origin: propagationType.hasParentPlantPollen ? '-' : oParentPlant.geographic_origin,
			nursery_source: '-',
			propagation_type: descendantPlantInput.propagationType,
			active: true,
			taxon_id: propagationType.hasParentPlantPollen ? undefined : oParentPlant.taxon_id,
			parent_plant: {
				id: oParentPlant.id,
				plant_name: oParentPlant.plant_name,
				active: oParentPlant.active
			},
			last_update: undefined,  //auto-derived in backend
			descendant_plants_all: [],  //auto-derived in backend
			sibling_plants: [],  //auto-derived in backend
			same_taxon_plants: [],  //auto-derived in backend
			tags: [],
		};

		if (!!descendantPlantInput.parentPlantPollen && descendantPlantInput.parentPlantPollen.length) {

			const oParentPlantPollen = aPlants.find(ele => ele.plant_name === descendantPlantInput.parentPlantPollen);
			if (!oParentPlantPollen) {
				throw new Error('Parent plant pollen not found.');
			}

			newPlant.parent_plant_pollen = <FBAssociatedPlantExtractForPlant>{
				id: oParentPlantPollen.id,
				plant_name: descendantPlantInput.parentPlantPollen,
				active: oParentPlantPollen.active
			}
		}
		this.saveNewPlant(newPlant);
	}


}