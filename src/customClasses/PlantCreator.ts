import MessageToast from "sap/m/MessageToast";
import * as Util from "plants/ui/customClasses/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { BResultsPlantsUpdate, FPlant, FPlantsUpdateRequest } from "../definitions/Plants";
import PlantLookup from "./PlantLookup"
import { BPlant, FBAssociatedPlantExtractForPlant } from "../definitions/Plants";
import { LDescendantPlantInput, LPropagationTypeData } from "../definitions/PlantsLocal";
import SuggestionService from "./SuggestionService";
import Navigation from "./Navigation";
import ModelsHelper from "../model/ModelsHelper";

/**
 * @namespace plants.ui.customClasses
 */
export default class PlantCreator extends ManagedObject {

	private _oPlantsModel: JSONModel;
	private _oPlantsDataClone: FPlantsUpdateRequest;
    private _oPlantLookup: PlantLookup;

	public constructor(oPlantsModel: JSONModel, oPlantsDataClone: FPlantsUpdateRequest, oPlantLookup: PlantLookup) {
		super();
		this._oPlantsModel = oPlantsModel;
		this._oPlantsDataClone = oPlantsDataClone;
        this._oPlantLookup = oPlantLookup;
	}	

    public addNewPlantAndSave(sPlantName: string): void {
        // add plant to model
        // save plant to backend

		//check and not empty
		if (sPlantName === '') {
			MessageToast.show('Empty not allowed.');
			return;
		}

		if (sPlantName.includes('/')) {
			MessageToast.show('Forward slash not allowed.');
			return;
		}

		//check if new
		if (this._oPlantLookup.plantNameExists(sPlantName)) {
			MessageToast.show('Plant Name already exists.');
			return;
		}

		const oNewPlant = <FPlant>{
			plant_name: sPlantName,
			active: true,
			descendant_plants_all: [],  //auto-derived in backend
			sibling_plants: [],  //auto-derived in backend
			same_taxon_plants: [],  //auto-derived in backend
			tags: [],
		};

		this._saveNewPlant(oNewPlant);
    }

	public createDescendantPlant(descendantPlantInput: LDescendantPlantInput): void {
		// triggered from create-descendant-dialog to create the descendant plant
		//todo validate if existing
		if (!descendantPlantInput.propagationType || !descendantPlantInput.propagationType.length) {
			MessageToast.show('Choose propagation type.');
			return;
		}

		// validate parent plant (obligatory and valid) and parent plant pollen (valid if supplied)
		if (!descendantPlantInput.parentPlant || !this._oPlantLookup.plantNameExists(descendantPlantInput.parentPlant)) {
			MessageToast.show('Check parent plant.');
			return;
		}

		const oSuggestionService = SuggestionService.getInstance();
		var propagationType = <LPropagationTypeData>oSuggestionService.getSuggestionItem('propagationTypeCollection', descendantPlantInput.propagationType);  // todo find a better way to implement this
		if (propagationType.hasParentPlantPollen === true &&
			!!descendantPlantInput.parentPlantPollen &&
			!this._oPlantLookup.plantNameExists(descendantPlantInput.parentPlantPollen)) {
			MessageToast.show('Check parent plant pollen.');
			return;
		};

		// validate new plant name
		if (!descendantPlantInput.descendantPlantName || !descendantPlantInput.descendantPlantName.trim().length) {
			MessageToast.show('Enter new plant name.');
			return;
		};

		if (this._oPlantLookup.plantNameExists(descendantPlantInput.descendantPlantName)) {
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
		this._saveNewPlant(newPlant);
	}    

	private _saveNewPlant(oPlant: FPlant): void {
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
				aPlants.push(oPlantSaved);  // append at end to preserve change tracking with clone 
				that._oPlantsModel.updateBindings(false);

				// ...and add to cloned plants to allow change tracking
				var oPlantClone = Util.getClonedObject(oPlantSaved);
				that._oPlantsDataClone.PlantsCollection.push(oPlantClone);
				MessageToast.show('Created plant ID ' + oPlantSaved.id + ' (' + oPlantSaved.plant_name + ')');

				// finally navigate to the newly created plant in details view
				Navigation.getInstance().navToPlantDetails(oPlantSaved.id!);

			})
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Plant (POST)'))
			.always(function () {
				Util.stopBusyDialog();
			});
	}	    



}