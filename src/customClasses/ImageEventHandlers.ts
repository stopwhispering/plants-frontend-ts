import MessageToast from "sap/m/MessageToast"
import * as Util from "plants/ui/customClasses/Util";
import ManagedObject from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import { FBImage, FBImagePlantTag, FBKeyword } from "../definitions/Images";
import { FBEvent, FBImageAssignedToEvent } from "../definitions/Events";
import Popover from "sap/m/Popover";
import Icon from "sap/ui/core/Icon";
import FileUploader from "sap/ui/unified/FileUploader";
import { BPlant } from "../definitions/Plants";


/**
 * @namespace plants.ui.customClasses
 */
export default class ImageEventHandlers extends ManagedObject{
		private applyToFragment: Function;
		       

		public constructor(applyToFragment: Function) {
			super();
			this.applyToFragment = applyToFragment;
		}

		public assignPlantToImage(oPlant: BPlant, oImage: FBImage, oImagesModel: JSONModel){
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
				oImagesModel.updateBindings(false);
				return true;
			}			
		}
		
		public assignImageToEvent(oSource: Icon){
			// triggered by icon beside image; assign that image to one of the plant's events
			// generate dialog from fragment if not already instantiated
			var sPathCurrentImage = oSource.getBindingContext("images")!.getPath();
			this.applyToFragment('dialogAssignEventToImage',(oPopover: Popover)=>{
				// bind the selected image's path in images model to the popover dialog
				oPopover.bindElement({ path: sPathCurrentImage,
					   		  		   model: "images" });	
				oPopover.openBy(oSource, true);	
			});	
		}
		
		assignEventToImage(oImage: FBImage, oSelectedEvent: FBEvent, oEventsModel: JSONModel){
			// check if already assigned
			const aSelectedEventImages = <FBImageAssignedToEvent[]>oSelectedEvent.images;
			if(!!aSelectedEventImages && aSelectedEventImages.length > 0){
				var oImageAssignmentFound = aSelectedEventImages.find(function(oCurrentImageAssignment) {
				  return oCurrentImageAssignment.id === oImage.id;
				});
				if(oImageAssignmentFound){
					// already assigned --> move to end of list
					var iIndex = aSelectedEventImages.indexOf(oImageAssignmentFound)
					aSelectedEventImages.splice(iIndex, 1);
					aSelectedEventImages.push(oImageAssignmentFound);
					MessageToast.show('Event already assigned to image. Moved to end of list.');
					oEventsModel.updateBindings(false);  // true not required here
					return;
				}
			}
			
			// assign and add assignment to end of list
			const oNewImageAssignedToEvent: FBImageAssignedToEvent = {
				id: oImage.id,
				filename: oImage.filename
			};
			if(!oSelectedEvent.images){
				oSelectedEvent.images = <FBImageAssignedToEvent[]>[oNewImageAssignedToEvent];
			} else {
				oSelectedEvent.images.push(oNewImageAssignedToEvent);
			}
			MessageToast.show('Assigned.');
			oEventsModel.updateBindings(true);  // true required here
		}
		
		public unassignImageFromEvent(sEventsBindingPath: string, oEventsModel: JSONModel){
            // triggered by unassign control next to an image in the events list
			var oEventsImage = oEventsModel.getProperty(sEventsBindingPath);
			
			var sEventImages = sEventsBindingPath.substring(0,sEventsBindingPath.lastIndexOf('/'));
			var aEventImages = oEventsModel.getProperty(sEventImages);
			
			var iPosition = aEventImages.indexOf(oEventsImage);
			if(iPosition===-1){
				MessageToast.show("Can't find image.");
				return;
			}
			
			aEventImages.splice(iPosition, 1);
			oEventsModel.refresh();  //same like updateBindings(false)			
		}

		handleTypeMissmatch(oFileUpload: FileUploader, sFileType: string){
			var aFileTypes = oFileUpload.getFileType().map(ele => "*." + ele)
			var sSupportedFileTypes = aFileTypes.join(", ");
			MessageToast.show("The file type *." + sFileType +
									" is not supported. Choose one of the following types: " +
									sSupportedFileTypes);
		}

		public removePlantImageTokenFromModel(sPlantTokenKey: string, oImage: FBImage, oModel: JSONModel){
			// triggered upon changes of image's plant assignments
			// either in untagged view or in detail view
			//   ==> oModel can be either images or untagged_images model
			// note: the token itself has already been deleted; here, we only delete the 
			// 		 corresponding entry from the model
			
			// find plant in the image's corresponding array and delete
			const aPlantTags = <FBImagePlantTag[]>oImage.plants;
			const iIndex: int = aPlantTags.findIndex(ele=>ele.key === sPlantTokenKey);
			if (iIndex < 0) throw new Error("Plant not found in image's plants tags array.");
			aPlantTags.splice(iIndex, 1);
			oModel.updateBindings(false);
		}

		public removeKeywordImageTokenFromModel(sKeywordTokenKey: string, oImage: FBImage, oModel: JSONModel){
			// triggered upon changes of image's keywords assignments
			// either in untagged view or in detail view
			//   ==> oModel can be either images or untagged_images model
			// note: the token itself has already been deleted; here, we only delete the 
			// 		 corresponding entry from the model
			
			// find keyword in the image's corresponding array and delete
			const aKeywordTags = <FBKeyword[]>oImage.keywords;
			const iIndex: int = aKeywordTags.findIndex(ele=>ele.keyword === sKeywordTokenKey);
			if (iIndex < 0) throw new Error("Keyword not found in image's keywords tags array.");
			aKeywordTags.splice(iIndex, 1);
			oModel.updateBindings(false);
		}
}