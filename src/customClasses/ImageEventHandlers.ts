import MessageToast from "sap/m/MessageToast"
import * as Util from "plants/ui/customClasses/Util";
import ManagedObject from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import GridListItem from "sap/f/GridListItem";
import { PImage, PImagePlantTag, PKeyword } from "../definitions/image_entities";
import { PEvent} from "../definitions/entities";
import Popover from "sap/m/Popover";
import Icon from "sap/ui/core/Icon";
import FileUploader from "sap/ui/unified/FileUploader";
import { PPlant } from "../definitions/plant_entities";


/**
 * @namespace plants.ui.customClasses
 */
export default class ImageEventHandlers extends ManagedObject{
		private static _instance: ImageEventHandlers;
		private applyToFragment: Function;
		       
        // generate or return singleton
        public static getInstance(applyToFragment?: Function): ImageEventHandlers {
            if (!ImageEventHandlers._instance && applyToFragment) {
                ImageEventHandlers._instance = new ImageEventHandlers(applyToFragment);
            }
            return ImageEventHandlers._instance;
        }

		private constructor(applyToFragment: Function) {
			super();
			this.applyToFragment = applyToFragment;
		}

		// todo make public
		public assignPlantToImage(oPlant: PPlant, oImage: PImage, oImagesModel: JSONModel){
			//add a plant to image in images model
			//currently triggered when ...
				// assigning an image in untagged view to the plant in details view
				// assigning an image in untagged view to a plant chosen via  input suggestions
				// assigning an image in detail view to a plant chosen via input suggestions
			var aCurrentlyAssignedPlants = <PImagePlantTag[]>oImage.plants;
			var oNewlyAssignedPlant = <PImagePlantTag>{
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
		
		assignEventToImage(oSource: GridListItem, oEventsModel: JSONModel, oPopoverAssignEventToImage: Popover){
			

			const oImage = <PImage>oSource.getBindingContext('images')!.getObject();

			// get image
			var oImageAssignment = {
				filename:      oImage.filename
			};
			
			// check if already assigned
			const oSelectedEvent = <PEvent>oSource.getBindingContext('events')!.getObject();
			if(!!oSelectedEvent.images && oSelectedEvent.images.length > 0){
				var found = oSelectedEvent.images.find(function(image) {
				  return image.filename === oImageAssignment.filename;
				});
				if(found){
					MessageToast.show('Event already assigned to image.');
					oPopoverAssignEventToImage.close();
					return;					
				}
			}
			
			// assign
			if(!oSelectedEvent.images){
				oSelectedEvent.images = [oImageAssignment];
			} else {
				oSelectedEvent.images.push(oImageAssignment);
			}
			
			MessageToast.show('Assigned.');
			oEventsModel.updateBindings(false);
			oPopoverAssignEventToImage.close();
			
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

		public removeTokenFromModel(sKey: string, oImage: PImage, oModel: JSONModel, sType: 'plant'|'keyword'){
			// triggered upon changes of image's plant assignments and image's keywords
			// either in untagged view or in detail view
			// sKey is either a keyword or a plant name
			// note: the token itself has already been deleted; here, we only delete the 
			// 		 corresponding entry from the model
			
			// find plant/keyword in the image's corresponding array and delete
			if (sType === 'plant'){
				const aPlantTags = <PImagePlantTag[]>oImage.plants;
				const iIndex: int = aPlantTags.findIndex(ele=>ele.key === sKey);
				aPlantTags.splice(iIndex, 1);
			} else { //'keyword'
				const aKeywordTags = <PKeyword[]>oImage.keywords;
				const iIndex: int = aKeywordTags.findIndex(ele=>ele.keyword === sKey);
				aKeywordTags.splice(iIndex, 1);
			}
			oModel.updateBindings(false);
		}
}