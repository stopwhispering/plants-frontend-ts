import UIComponent from "sap/ui/core/UIComponent"
import * as models from "plants/ui/model/models"
import JSONModel from "sap/ui/model/json/JSONModel"
import FlexibleColumnLayoutSemanticHelper from "sap/f/FlexibleColumnLayoutSemanticHelper"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import MessageHandler from "plants/ui/customClasses/MessageHandler"
import * as Util from "plants/ui/customClasses/Util";
import {
	LTaxonData, LTaxonMap } from "./definitions/TaxonLocal"
import Navigation from "./customClasses/Navigation"
import { FBImage, BResultsImageResource } from "./definitions/Images"
import { LImageMap } from "./definitions/ImageLocal"
import UriParameters from "sap/base/util/UriParameters"
import View from "sap/ui/core/mvc/View"
import { LayoutType } from "sap/f/library"
import FlexibleColumnLayout from "sap/f/FlexibleColumnLayout"
import ImageRegistryHandler from "./customClasses/ImageRegistryHandler"
import ChangeTracker from "./customClasses/ChangeTracker"

/**
 * @namespace plants.ui
 */
export default class Component extends UIComponent {

	public imagesRegistry: LImageMap;
	public imagesPlantsLoaded: Set<int>;

	public static metadata = {
		manifest: "json"
	}

	public init() : void {
		// call the base component's init function
		super.init();

		this.imagesRegistry = <LImageMap>{};
		this.imagesPlantsLoaded = <Set<int>>new Set();

		// set the device model
		this.setModel(models.createDeviceModel(), "device");
		
		// instantiate message utility class and supply this component as context
		MessageHandler.getInstance(this);
		
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

		// create plant images resetter instance class and supply image model
		ImageRegistryHandler.createInstance(oImagesModel, this.imagesRegistry);
		
		var oUntaggedImagesModel = new JSONModel();
		oUntaggedImagesModel.setSizeLimit(250);
		this.setModel(oUntaggedImagesModel, 'untaggedImages');

		var oTaxonModel = new JSONModel(<LTaxonData>{TaxaDict: <LTaxonMap>{}});
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
		
		const oPlantPropertiesModel = new JSONModel();
		oPlantPropertiesModel.setProperty('/propertiesPlants', {}); // plant ids will be keys of that dict
		this.setModel(oPlantPropertiesModel, 'properties');
		
		const oTaxonPropertiesModel = new JSONModel();
		oTaxonPropertiesModel.setProperty('/propertiesTaxon', {}); // taxon_id will be keys of that dict
		this.setModel(oTaxonPropertiesModel, 'propertiesTaxa');

		//use helper class to load data into json models
		//(helper class is used to reload data via button as well)
		var oModelsHelper = ModelsHelper.getInstance(this);
		oModelsHelper.reloadPlantsFromBackend();
		// oModelsHelper.reloadTaxaFromBackend();
		oModelsHelper.reloadKeywordProposalsFromBackend();
		oModelsHelper.reloadNurserySourceProposalsFromBackend();
		oModelsHelper.reloadPropertyNamesFromBackend();

		// settings model
		var oSettingsModel = new JSONModel({preview_image: 'favourite_image'});
		this.setModel(oSettingsModel, 'status');

		//initialize router
		this.setModel(new JSONModel());	 //contains the layout	
		this.getRouter().initialize();

		this._requestUntaggedImages();		

		// create instance of change handler class
		// todo move all change tracking code there
		ChangeTracker.createInstance(
			oPlantsModel, 
			oEventsModel, 
			oPlantPropertiesModel, 
			oTaxonPropertiesModel, 
			oTaxonModel, 
			this.imagesRegistry, 
			);
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
	private _onReceivingUntaggedImages(oData: BResultsImageResource, sStatus: any, oReturnData: any){
		this._addPhotosToRegistry(oData.ImagesCollection);
		this.resetUntaggedPhotos();
	}

	private _addPhotosToRegistry(aImages: FBImage[]){
		// add photos loaded for a plant to the registry if not already loaded with other plant
		// plus add a copy of the photo to a clone registry for getting changed photos when saving 
		aImages.forEach((image: FBImage) => {
			if (!(image.filename in this.imagesRegistry)){
				this.imagesRegistry[image.filename] = image;
				// this.imagesRegistryClone[image.filename] = Util.getClonedObject(image);
				ChangeTracker.getInstance().addOriginalImage(image);
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