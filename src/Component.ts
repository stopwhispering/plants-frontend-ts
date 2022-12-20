import UIComponent from "sap/ui/core/UIComponent"
import * as models from "plants/ui/model/models"
import JSONModel from "sap/ui/model/json/JSONModel"
import FlexibleColumnLayoutSemanticHelper from "sap/f/FlexibleColumnLayoutSemanticHelper"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import MessageUtil from "plants/ui/customClasses/MessageUtil"
import * as Util from "plants/ui/customClasses/Util";
import {PlantIdToEventsMap, PlantsCollection, TaxonData } from "./definitions/entities"
import Navigation from "./customClasses/Navigation"
import { ImageMap, PImage, PResultsImageResource } from "./definitions/image_entities"
import UriParameters from "sap/base/util/UriParameters"
import View from "sap/ui/core/mvc/View"
import { LayoutType } from "sap/f/library"
import FlexibleColumnLayout from "sap/f/FlexibleColumnLayout"
import { CategoryToPropertiesInCategoryMap, PlantIdToPropertyCollectionMap } from "./definitions/property_entities"
import VariantItem from "sap/m/VariantItem"

/**
 * @namespace plants.ui
 */
export default class Component extends UIComponent {

	public imagesRegistry: ImageMap = {};
	public imagesRegistryClone: ImageMap = {};
	public imagesPlantsLoaded = new Set();
	public oEventsDataClone = <PlantIdToEventsMap>{};  // avoid exceptions when saving before any event has been loaded
	public oPropertiesDataClone: PlantIdToPropertyCollectionMap = {};
	public oPlantsDataClone = <PlantsCollection>{};
	public oTaxonDataClone = <TaxonData>{};
	public oPropertiesTaxonDataClone = <CategoryToPropertiesInCategoryMap>{};

	public static metadata = {
		manifest: "json"
	}

	public init() : void {
		// call the base component's init function
		super.init();
		// set the device model
		this.setModel(models.createDeviceModel(), "device");
		
		// instantiate message utility class and supply this component as context
		MessageUtil.getInstance(this);
		
		// instantiate navigation class and supply this component as context
		Navigation.getInstance(this);

		// instantiate empty models and name them
		//they are filled in the helper class
		var oPlantsModel = new JSONModel();
		oPlantsModel.setSizeLimit(2000);
		this.setModel(oPlantsModel, 'plants');
		
		var oImagesModel = new JSONModel();
		oImagesModel.setSizeLimit(50000);
		this.setModel(oImagesModel, 'images');
		
		var oUntaggedImagesModel = new JSONModel();
		oUntaggedImagesModel.setSizeLimit(250);
		this.setModel(oUntaggedImagesModel, 'untaggedImages');

		var oTaxonModel = new JSONModel();
		oTaxonModel.setSizeLimit(2000);
		this.setModel(oTaxonModel, 'taxon');
		
		var oProposalKeywordsModel = new JSONModel();
		oTaxonModel.setSizeLimit(2000);
		this.setModel(oProposalKeywordsModel, 'keywords');

		// empty model for filter values (filled upon opening filter dialog)
		this.setModel(new JSONModel(), 'filterValues');
		
		// the events model is a special one insofar as we don't load
		// it initially but only in part as we enter a plant's details site
		var oEventsModel = new JSONModel(); 
		oEventsModel.setProperty('/PlantsEventsDict', {}); // plant ids will be keys of that dict
		this.setModel(oEventsModel, 'events');
		
		var oPropertiesModel = new JSONModel();
		oPropertiesModel.setProperty('/propertiesPlants', {}); // plant ids will be keys of that dict
		this.setModel(oPropertiesModel, 'properties');
		
		const oPropertiesTaxonModel = new JSONModel();
		oPropertiesTaxonModel.setProperty('/propertiesTaxon', {}); // taxon_id will be keys of that dict
		this.setModel(oPropertiesTaxonModel, 'propertiesTaxa');

		//use helper class to load data into json models
		//(helper class is used to reload data via button as well)
		var oModelsHelper = ModelsHelper.getInstance(this);
		oModelsHelper.reloadPlantsFromBackend();
		// oModelsHelper.reloadImagesFromBackend();
		oModelsHelper.reloadTaxaFromBackend();
		oModelsHelper.reloadKeywordProposalsFromBackend();
		oModelsHelper.reloadTraitCategoryProposalsFromBackend();
		oModelsHelper.reloadNurserySourceProposalsFromBackend();
		oModelsHelper.reloadPropertyNamesFromBackend();
		// this.oEventsDataClone = {};  // avoid exceptions when saving before any event has been loaded
		// this.oPropertiesDataClone = {};

		// settings model
		var oSettingsModel = new JSONModel({preview_image: 'favourite_image'});
		this.setModel(oSettingsModel, 'status');

		//initialize router
		this.setModel(new JSONModel());	 //contains the layout	
		this.getRouter().initialize();

		this._requestUntaggedImages();		
	}

	private _requestUntaggedImages(){
		// request data from backend
		$.ajax({
			url: Util.getServiceUrl('images/untagged/'),
			// data: {untagged: true},
			context: this,
			async: true
		})
		// .done(this._onReceivingUntaggedImages.bind(this))
		.done(this._onReceivingUntaggedImages)
		.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this,'Plant Untagged Images (GET)'));	
	}

	// load untagged images to display number as badge in top row
	private _onReceivingUntaggedImages(oData: PResultsImageResource, sStatus: any, oReturnData: any){
		this._addPhotosToRegistry(oData.ImagesCollection);
		this.resetUntaggedPhotos();
	}

	private _addPhotosToRegistry(aImages: PImage[]){
		// add photos loaded for a plant to the registry if not already loaded with other plant
		// plus add a copy of the photo to a clone registry for getting changed photos when saving 
		aImages.forEach((image: PImage) => {
			if (!(image.filename in this.imagesRegistry)){
				this.imagesRegistry[image.filename] = image;
				this.imagesRegistryClone[image.filename] = Util.getClonedObject(image);
			}
		});
	}

	public resetUntaggedPhotos(){
		//(re-)set untagged photos in untagged model
		// @ts-ignore // works, but typescript doesn't like it
		const aPhotoValues = <any[][]> Object.entries(this.imagesRegistry).filter(t => (!t[1].plants.length));
		var aPhotos = aPhotoValues.map(p => p[1]);
		this.getModel('untaggedImages').setProperty('/ImagesCollection',aPhotos);
	}
	
	// although root view is defined in manifest, somehow the 
	// BeforeRouteMatched event handler is not triggered without redefining
	// createContent (no idea, why...; probably because default is async)
	// public createContent () {
	// 	// return sap.ui.view({
	// 	return sap.ui.view({
	// 		viewName: "plants.ui.view.FlexibleColumnLayout",
	// 		type: "XML",
	// 		// async: true  //=> no direct entry into plant page possible
	// 	});
	// }
	
	/**
	 * Returns an instance of the semantic helper
	 * @returns {sap.f.FlexibleColumnLayoutSemanticHelper} An instance of the semantic helper
	 */
	public getHelper() {
		const oRootControl = <View>this.getRootControl();
		const oFlexibleColumnLayout = <FlexibleColumnLayout> oRootControl.byId("idFlexibleColumnLayout");
		const oParams = UriParameters.fromQuery();
		// const oParams = jQuery.sap.getUriParameters();
		const oSettings = {
				defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
				// defaultTwoColumnLayoutType: sap.f.LayoutType.TwoColumnsMidExpanded,
				defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
				// defaultThreeColumnLayoutType: sap.f.LayoutType.ThreeColumnsMidExpanded,
				mode: oParams.get("mode"),
				initialColumnsCount: oParams.get("initial"),
				maxColumnsCount: oParams.get("max")
			};

		return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFlexibleColumnLayout, oSettings);
	}

	public getModel(sModelName?: string): JSONModel{
		// override Component's getModel for type hint JSONModel instead of abstract model
		return <JSONModel> super.getModel(sModelName);
	  }

}