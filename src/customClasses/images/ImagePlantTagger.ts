
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject"
import Util from "plants/ui/customClasses/shared/Util";
import JSONModel from "sap/ui/model/json/JSONModel";
import { FBImage, FBImagePlantTag } from "plants/ui/definitions/Images";
import { BPlant } from "plants/ui/definitions/Plants";

/**
 * @namespace plants.ui.customClasses.images
 */
export default class ImagePlantTagger extends ManagedObject {
	private _oAnyImageModel: JSONModel;

	public constructor(oAnyImageModel: JSONModel) {
		// supply either images model or untaggedImages model
		super();
		this._oAnyImageModel = oAnyImageModel;
	}

	public addPlantToImage(oPlant: BPlant, oImage: FBImage){
		//add a plant to image in images model
		//currently triggered when ...
			// assigning an image in untagged view to the plant in details view
			// assigning an image in untagged view to a plant chosen via  input suggestions
			// assigning an image in detail view to a plant chosen via input suggestions
		var aCurrentlyAssignedPlants = <FBImagePlantTag[]>oImage.plants;
		var oNewlyAssignedPlant = <FBImagePlantTag>{
			plant_id: oPlant.id,
			key: oPlant.plant_name,
			text: oPlant.plant_name,
		};
		
		// check if already in list
		if (Util.isDictKeyInArray(oNewlyAssignedPlant, aCurrentlyAssignedPlants)){
			MessageToast.show('Plant Name already assigned. ');
			return false;
		} else {
			aCurrentlyAssignedPlants.push(oNewlyAssignedPlant);
			console.log('Assigned plant to image: '+ oPlant.plant_name + ' (' + oPlant.id + ')');
			this._oAnyImageModel.updateBindings(false);
			return true;
		}			
	}

	public removePlantFromImage(sPlantName: string, oImage: FBImage){
		// triggered upon changes of image's plant assignments
		// either in untagged view or in detail view ==> oModel can be either images or untagged_images model
		// find plant in the image's corresponding array and delete
		const aPlantTags = <FBImagePlantTag[]>oImage.plants;
		const iIndex: int = aPlantTags.findIndex(ele=>ele.key === sPlantName);
		if (iIndex < 0) throw new Error("Plant not found in image's plants tags array.");
		aPlantTags.splice(iIndex, 1);
		this._oAnyImageModel.updateBindings(false);
	}	
}