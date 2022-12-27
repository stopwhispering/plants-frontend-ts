import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import * as Util from "plants/ui/customClasses/Util";
import { LTaxonData, LTaxonMap } from "../definitions/TaxonLocal";
import { FBImage } from "../definitions/Images";
import { LImageMap } from "../definitions/ImageLocal";
import { FBPropertyCollectionPlant, LTaxonToPropertiesInCategoryMap } from "../definitions/Properties";
import { LTaxonToPropertyCategoryMap, LCategoryToPropertiesInCategoryMap, LPlantIdToPropertyCollectionMap, LPropertiesTaxonModelData } from "../definitions/PropertiesLocal";
import { PlantIdToEventsMap } from "../definitions/EventsLocal";
import { BTaxon } from "../definitions/Taxon";
import { BPlant, FPlant, FPlantsUpdateRequest } from "../definitions/Plants"
import { BEvents } from "../definitions/Events";

/**
 * @namespace plants.ui.customClasses
 */
export default class ChangeTracker extends ManagedObject {

	private static _instance: ChangeTracker;
	private _oPlantsModel: JSONModel;
	private _oPlantsDataClone: FPlantsUpdateRequest;  // todo find other entity
	private _oEventsModel: JSONModel;
	private _oEventsDataClone: PlantIdToEventsMap;
	private _oPlantPropertiesModel: JSONModel;
	private _oPlantPropertiesDataClone: LPlantIdToPropertyCollectionMap;
	private _oTaxonPropertiesModel: JSONModel;
	private _oTaxonPropertiesDataClone: LCategoryToPropertiesInCategoryMap;
	private _oTaxonModel: JSONModel;
	private _oTaxonDataClone: LTaxonData;  // todo create clone handler
	private _oImageRegistry: LImageMap;  // todo use registry handler instead
	private _oImageRegistryClone: LImageMap;  // todo use registry handler instead


	public static createInstance(
		oPlantsModel: JSONModel, 
		oEventsModel: JSONModel, 
		oPlantPropertiesModel: JSONModel, 
		oTaxonPropertiesModel: JSONModel, 
		oTaxonModel: JSONModel, 
		oImageRegistry: LImageMap, 
		): void {
		if (ChangeTracker._instance)
			throw new Error('ChangeTracker instance already created');
		ChangeTracker._instance = new ChangeTracker(
			oPlantsModel, 
			oEventsModel, 
			oPlantPropertiesModel, 
			oTaxonPropertiesModel, 
			oTaxonModel, 
			oImageRegistry, 
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
		oPlantPropertiesModel: JSONModel, 
		oTaxonPropertiesModel: JSONModel, 
		oTaxonModel: JSONModel, 
		oImageRegistry: LImageMap, 
		) {

		super();
		this._oImageRegistry = oImageRegistry;
		this._oPlantsModel = oPlantsModel;
		this._oEventsModel = oEventsModel;;
		this._oPlantPropertiesModel = oPlantPropertiesModel;
		this._oTaxonPropertiesModel = oTaxonPropertiesModel;
		this._oTaxonModel = oTaxonModel;
		
		this._oPlantsDataClone = <FPlantsUpdateRequest>{};
		this._oEventsDataClone = <PlantIdToEventsMap>{};
		this._oTaxonDataClone = <LTaxonData>{TaxaDict: <LTaxonMap>{}};
		this._oImageRegistryClone = <LImageMap>{};
		this._oPlantPropertiesDataClone = <LPlantIdToPropertyCollectionMap>{};
		this._oTaxonPropertiesDataClone = <LCategoryToPropertiesInCategoryMap>{};
	}

	public getModifiedPlants(): BPlant[] {
		// get plants model and identify modified items
		var dDataPlants = this._oPlantsModel.getData();
		var aModifiedPlants = [];
		var aOriginalPlants = this._oPlantsDataClone['PlantsCollection'];
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

	public getModifiedEvents(): PlantIdToEventsMap {
		// returns a dict with events for those plants where at least one event has been modified, added, or deleted
		const oDataEvents: PlantIdToEventsMap = this._oEventsModel.getData().PlantsEventsDict;

		//get plants for which we have events in the original dataset
		//then, for each of them, check whether events have been changed
		let oModifiedEventsDict: PlantIdToEventsMap = {};
		const keys_clones = Object.keys(this._oEventsDataClone);
		const keys_clone = <int[]>keys_clones.map(k => parseInt(k));
		const that = this;
		keys_clone.forEach(function (key) {
			// if(!Util.arraysAreEqual(dDataEventsClone[key],
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

	public getModifiedPlantProperties(): LPlantIdToPropertyCollectionMap {
		// returns a dict with properties for those plants where at least one property has been modified, added, or deleted
		// for these plants, properties are supplied completely; modifications are then identified in backend
		const dDataProperties: LPlantIdToPropertyCollectionMap = this._oPlantPropertiesModel.getData().propertiesPlants;
		// clean up the properties model data (returns a clone, not the original object!)
		const dDataPropertiesCleaned: LPlantIdToPropertyCollectionMap = this.getPropertiesSansTaxa(dDataProperties);
		// const dDataPropertiesOriginal: LPlantIdToPropertyCollectionMap = this.oComponent.oPropertiesDataClone;

		// get plants for which we have properties in the original dataset
		// then, for each of them, check whether properties have been changed
		let dModifiedPropertiesDict: LPlantIdToPropertyCollectionMap = {};
		const keys_clone_s = Object.keys(this._oPlantPropertiesDataClone);
		const keys_clone = <int[]>keys_clone_s.map(k => parseInt(k));
		const that = this;
		keys_clone.forEach(function (key) {
			// loop at plants
			if (!Util.objectsEqualManually(that._oPlantPropertiesDataClone[key],
				dDataPropertiesCleaned[key])) {
				dModifiedPropertiesDict[key] = dDataPropertiesCleaned[key];
			}
		}, this);

		return dModifiedPropertiesDict;
	}

	public getModifiedTaxonProperties(): LCategoryToPropertiesInCategoryMap {
		const oDataPropertiesTaxon: LPropertiesTaxonModelData = this._oTaxonPropertiesModel.getData();
		const oPropertiesTaxon: LCategoryToPropertiesInCategoryMap = oDataPropertiesTaxon.propertiesTaxon;
		// const oPropertiesTaxonOriginal: LCategoryToPropertiesInCategoryMap = this.oComponent.oPropertiesTaxonDataClone;

		if (!this._oTaxonPropertiesDataClone) {
			return {};
		}

		// get taxa for which we have properties in the original dataset
		// then, for each of them, check whether properties have been changed
		var oModifiedPropertiesDict: LCategoryToPropertiesInCategoryMap = {};
		const keys_clone_s = Object.keys(this._oTaxonPropertiesDataClone);
		const keys_clone = keys_clone_s.map(key => parseInt(key));
		const that = this;
		keys_clone.forEach(function (key) {
			// loop at plants
			if (!Util.objectsEqualManually(that._oTaxonPropertiesDataClone[key],
				oPropertiesTaxon[key])) {
				oModifiedPropertiesDict[key] = oPropertiesTaxon[key];
			}
		}, this);

		return oModifiedPropertiesDict;
	}

	public getModifiedImages(): FBImage[] {
		// identify modified images by comparing images with their clones (created after loading)
		// var oImages: LImageMap = this.oComponent.imagesRegistry;
		// var oImagesClone: LImageMap = this.oComponent.imagesRegistryClone;

		var aModifiedImages: FBImage[] = [];
		Object.keys(this._oImageRegistry).forEach(path => {
			if (!(path in this._oImageRegistryClone) || !Util.dictsAreEqual(this._oImageRegistry[path], this._oImageRegistryClone[path])) {
				aModifiedImages.push(this._oImageRegistry[path]);
			}
		});

		return aModifiedImages;
	}

	public getPropertiesSansTaxa(dProperties_: LPlantIdToPropertyCollectionMap): LPlantIdToPropertyCollectionMap {
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

	public setOriginalPlants(oPlantsData: FPlantsUpdateRequest): void{
		// reset plants clone completely to supplied plants data
		this._oPlantsDataClone = Util.getClonedObject(oPlantsData);
	}

	public addOriginalPlant(oPlant: FPlant): void{
		const oPlantClone = Util.getClonedObject(oPlant);
		this._oPlantsDataClone.PlantsCollection.push(oPlantClone);		
	}

	public removeOriginalPlant(oPlant: FPlant): void{
		//delete from model clone
		const aPlantsDataClone: FPlant[] = this._oPlantsDataClone.PlantsCollection;

		//can't find position with object from above, so we use the unique id
		const oPlantClone: FPlant|undefined = aPlantsDataClone.find(function (element) {
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

	public setOriginalEvents(oPlantIdToEventsMap: PlantIdToEventsMap): void {
	// reset events clone completely to supplied events data
		this._oEventsDataClone = Util.getClonedObject(oPlantIdToEventsMap);
	}

	public removeOriginalImage(filename: string): void {
		// delete image from images model clone
		delete this._oImageRegistryClone[filename];
	}

	public setOriginalImages(oImageMap: LImageMap): void {
		this._oImageRegistryClone = Util.getClonedObject(oImageMap);
	}

	public addOriginalImage(oImage: FBImage): void {
		this._oImageRegistryClone[oImage.filename] = Util.getClonedObject(oImage);
	}

	public resetOriginalImages(): void {
		this._oImageRegistryClone = <LImageMap>{};
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

	public addPlantPropertyCollection(oPropertyCollectionForPlant: FBPropertyCollectionPlant, oPlant: BPlant): void {
		// add/overwrite properties for a single plant
		this._oPlantPropertiesDataClone[oPlant.id!] = Util.getClonedObject(oPropertyCollectionForPlant);
	}

	public setPlantPropertyCollections(oPlantIdToPropertyCollectionMap: LPlantIdToPropertyCollectionMap): void {
		// set properties for all plants 
		this._oPlantPropertiesDataClone = Util.getClonedObject(oPlantIdToPropertyCollectionMap);
	}

	public addTaxonPropertiesInCategory(oPropertiesInCategory: LTaxonToPropertiesInCategoryMap, iTaxonId: int): void  {
		// add/overwrite properties for a single taxon
		this._oTaxonPropertiesDataClone[iTaxonId] = Util.getClonedObject(oPropertiesInCategory);

	}

	public setTaxonProperties(oTaxonToPropertyCategoryMap: LTaxonToPropertyCategoryMap): void {
		// set properties for all taxa
		this._oTaxonPropertiesDataClone = Util.getClonedObject(oTaxonToPropertyCategoryMap);
	}

}