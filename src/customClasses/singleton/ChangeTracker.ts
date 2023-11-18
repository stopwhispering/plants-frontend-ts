import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import Util from "plants/ui/customClasses/shared/Util";
import { LTaxonData, LTaxonMap } from "plants/ui/definitions/TaxonLocal";
import { FBImage } from "plants/ui/definitions/Images";
import { LImageIdMap } from "plants/ui/definitions/ImageLocal";
import { LPlantIdToEventsMap } from "plants/ui/definitions/EventsLocal";
import { BTaxon } from "plants/ui/definitions/Taxon";
import { BPlant, PlantUpdate, PlantsUpdateRequest } from "plants/ui/definitions/Plants"
import { BEvents } from "plants/ui/definitions/Events";
import ImageRegistryHandler from "./ImageRegistryHandler";

/**
 * @namespace plants.ui.customClasses.singleton
 */
export default class ChangeTracker extends ManagedObject {

	private static _instance: ChangeTracker;
	private _oPlantsModel: JSONModel;
	private _oPlantsDataClone: PlantsUpdateRequest;  // todo find other entity
	private _oEventsModel: JSONModel;
	private _oEventsDataClone: LPlantIdToEventsMap;
	private _oTaxonModel: JSONModel;
	private _oTaxonDataClone: LTaxonData;  // todo create clone handler
	private _oImageIdRegistryClone: LImageIdMap;  // todo use registry handler instead


	public static createInstance(
		oPlantsModel: JSONModel, 
		oEventsModel: JSONModel, 
		oTaxonModel: JSONModel, 
		): void {
		if (ChangeTracker._instance)
			throw new Error('ChangeTracker instance already created');
		ChangeTracker._instance = new ChangeTracker(
			oPlantsModel, 
			oEventsModel, 
			oTaxonModel, 
			);
	}

	public static getInstance(): ChangeTracker {
		if (!ChangeTracker._instance) {
			throw new Error('ChangeTracker instance not created yet');
		}
		return ChangeTracker._instance;
	}

	private constructor(
		oPlantsModel: JSONModel, 
		oEventsModel: JSONModel, 
		oTaxonModel: JSONModel, 
		) {

		super();
		this._oPlantsModel = oPlantsModel;
		this._oEventsModel = oEventsModel;;
		this._oTaxonModel = oTaxonModel;
		
		this._oPlantsDataClone = <PlantsUpdateRequest>{};
		this._oEventsDataClone = <LPlantIdToEventsMap>{};
		this._oTaxonDataClone = <LTaxonData>{TaxaDict: <LTaxonMap>{}};
		this._oImageIdRegistryClone = <LImageIdMap>{};
	}

	public hasUnsavedChanges(): boolean {
		return this._hasUnsavedPlants() || this._hasUnsavedTaxa() || this._hasUnsavedImages() || this._hasUnsavedEvents();
	}

	private _hasUnsavedPlants(): boolean {
		return !!this.getModifiedPlants().length;
	}

	private _hasUnsavedTaxa(): boolean {
		return !!this.getModifiedTaxa().length;
	}

	private _hasUnsavedImages(): boolean {
		return !!this.getModifiedImages().length;
	}

	private _hasUnsavedEvents(): boolean {
		return !!Object.keys(this.getModifiedEvents()).length;
	}


	public getModifiedPlants(): BPlant[] {
		// get plants model and identify modified items
		var dDataPlants = this._oPlantsModel.getData();
		var aModifiedPlants = [];
		var aOriginalPlants: PlantUpdate[] = this._oPlantsDataClone['PlantsCollection'];
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

	public getModifiedTaxa(): BTaxon[] {
		// get taxon model and identify modified items
		// difference to plants and images: data is stored with key in a dictionary, not in an array
		// we identify the modified sub-dictionaries and return a list of these
		// note: we don't check whether there's a new taxon as after adding a taxon, it is added
		//	     to the clone as well
		// we don't check for deleted taxa as there's no function for doing this in frontend
		var dDataTaxon: LTaxonMap = this._oTaxonModel.getData().TaxaDict;
		var dDataTaxonOriginal: LTaxonMap = this._oTaxonDataClone['TaxaDict'];

		//get taxon id's, i.e. keys of the taxa dict
		var keys_s = <string[]>Object.keys(dDataTaxonOriginal);
		var keys = <int[]>keys_s.map(k => parseInt(k));

		//for each key, check if it's value is different from the clone
		var aModifiedTaxonList: BTaxon[] = [];

		keys.forEach(function (key) {
			if (!Util.dictsAreEqual(dDataTaxonOriginal[key],
				dDataTaxon[key])) {
				aModifiedTaxonList.push(dDataTaxon[key]);
			}
		}, this);

		return aModifiedTaxonList;
	}

	public getModifiedEvents(): LPlantIdToEventsMap {
		// returns a dict with events for those plants where at least one event has been modified, added, or deleted
		const oDataEvents: LPlantIdToEventsMap = this._oEventsModel.getData().PlantsEventsDict;

		//get plants for which we have events in the original dataset
		//then, for each of them, check whether events have been changed
		let oModifiedEventsDict: LPlantIdToEventsMap = {};
		const keys_clones = Object.keys(this._oEventsDataClone);
		const keys_clone = <int[]>keys_clones.map(k => parseInt(k));
		const that = this;
		keys_clone.forEach(function (key) {
			if (!Util.objectsEqualManually(that._oEventsDataClone[key],
				oDataEvents[key])) {
				oModifiedEventsDict[key] = oDataEvents[key];
			}
		}, this);

		//added plants
		const keys_s = Object.keys(oDataEvents);
		const keys = <int[]>keys_s.map(k => parseInt(k));
		keys.forEach(function (key) {
			if (!that._oEventsDataClone[key]) {
				oModifiedEventsDict[key] = oDataEvents[key];
			}
		}, this);

		return oModifiedEventsDict;
	}
	
	public getModifiedImages(): FBImage[] {
		// identify modified images by comparing images with their clones (created after loading)
		var aModifiedImages: FBImage[] = [];
		const oImageRegistryHandler = ImageRegistryHandler.getInstance();
		const aImageIds = oImageRegistryHandler.getIdsInImageRegistry();
		aImageIds.forEach(iImageId => {
			const oImage: FBImage = oImageRegistryHandler.getImageInRegistryById(iImageId);
			const oImageOriginal: FBImage = this._oImageIdRegistryClone[iImageId];
			if (!oImageOriginal || !Util.dictsAreEqual(oImage, oImageOriginal)) {
				aModifiedImages.push(oImage);
			}
		});

		return aModifiedImages;
	}

	public setOriginalPlants(oPlantsData: PlantsUpdateRequest): void{
		// reset plants clone completely to supplied plants data
		this._oPlantsDataClone = <PlantsUpdateRequest>Util.getClonedObject(oPlantsData);
	}

	public addOriginalPlant(oPlant: PlantUpdate): void{
		const oPlantClone = Util.getClonedObject(oPlant);
		this._oPlantsDataClone.PlantsCollection.push(oPlantClone);		
	}

	public removeOriginalPlant(oPlant: PlantUpdate): void{
		//delete from model clone
		const aPlantsDataClone: PlantUpdate[] = this._oPlantsDataClone.PlantsCollection;

		//can't find position with object from above, so we use the unique id
		const oPlantClone: PlantUpdate|undefined = aPlantsDataClone.find(function (element) {
			return element.id === oPlant.id;
		});
		if (oPlantClone) {
			aPlantsDataClone.splice(aPlantsDataClone.indexOf(oPlantClone), 1);
		} else {
			throw new Error("Plant " + oPlant.plant_name + " not found in clone");
		}
	}

	public setOriginalEventsForPlant(aEvents: BEvents, iPlantId: int): void {
		//reset all events data for supplied plant ID
		this._oEventsDataClone[iPlantId] = Util.getClonedObject(aEvents);
	}

	public setOriginalEvents(oPlantIdToEventsMap: LPlantIdToEventsMap): void {
	// reset events clone completely to supplied events data
		this._oEventsDataClone = Util.getClonedObject(oPlantIdToEventsMap);
	}

	public removeOriginalImage(iImageId: int): void {
		// delete image from images model clone
		delete this._oImageIdRegistryClone[iImageId];
	}

	public setOriginalImagesFromImageRegistry(): void {
		const oImageIdMap: LImageIdMap = ImageRegistryHandler.getInstance().getImageIdRegistry()
		this._oImageIdRegistryClone = Util.getClonedObject(oImageIdMap);
	}

	public addOriginalImage(oImage: FBImage): void {
		this._oImageIdRegistryClone[oImage.id] = Util.getClonedObject(oImage);
	}

	public addOriginalImages(aImages: FBImage[]): void {
		aImages.forEach((oImage: FBImage) => {
			this._oImageIdRegistryClone[oImage.id] = Util.getClonedObject(oImage);
		});
	}

	public resetOriginalImages(): void {
		this._oImageIdRegistryClone = <LImageIdMap>{};
	}

	public resetOriginalTaxa(): void {
		this._oTaxonDataClone = <LTaxonData>{
			TaxaDict: <LTaxonMap>{}
		};
	}

	public addOriginalTaxon(oTaxon: BTaxon): void {
		this._oTaxonDataClone.TaxaDict[oTaxon.id] = Util.getClonedObject(oTaxon);
	}

	public setOriginalTaxa(oTaxonData: LTaxonData): void {
		// todo remove , probably not used
		this._oTaxonDataClone = Util.getClonedObject(oTaxonData);
	}

	public hasOriginalTaxon(iTaxonId: int): boolean {
		return iTaxonId in this._oTaxonDataClone.TaxaDict;
	}

}