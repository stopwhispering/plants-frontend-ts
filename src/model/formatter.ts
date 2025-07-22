import Util from "plants/ui/customClasses/shared/Util";
import Constants from "../Constants";
import NewDescendantPlantDialogHandler from "../customClasses/plants/NewDescendantPlantDialogHandler";
import SuggestionService from "../customClasses/shared/SuggestionService";
import { EventRead, ImageAssignedToEvent, PlantFlowerMonth } from "../definitions/Events";
import { FBPropagationType } from "../definitions/Plants";
import { LPropagationTypeData } from "../definitions/PlantsLocal";

/**
 * @namespace plants.ui.model
 */
// export default class formatter extends ManagedObject{
export default class formatter{
// export default {	

	public activeInactive(active: boolean): string {
		switch (active) {
			case true:
				return '';
			case false:
				return 'Status: inactive';
			case null:
				return 'Status: unknown';
			default:
				return active;
		}
	}
	
	public countPlants(plants: []): string|undefined{
		if(plants!==undefined){
			return plants.length.toString();
		}
	}
	
	//todo repair this once we have id everywhere instead of tlienmae
	public colorByPreviewOrNot(iImageId: int, iPlantPreviewImageId: int){
		//return blue or orange, depending on whether supplied image is the preview image of the plant 
		return (iImageId && iPlantPreviewImageId && iImageId === iPlantPreviewImageId) ? 'blue' : '#E69A17';
	}

	public colorByAssigedToEventOrNot(iImageId: int, aEvents: EventRead[]){	
		// flatten array of events' images 
		if (!iImageId || !aEvents || !aEvents.length) return '#000000';
		let aEventsWithImages = aEvents.filter(event => event.images && event.images.length);
		let aImages = <ImageAssignedToEvent[]>aEventsWithImages.flatMap(event => event.images);
		let oImageFound = aImages.find(image => image.id === iImageId); 
		return !oImageFound ? '#000000' : 'blue';
	}

	public timestampToDateShort(ts: string){
		if (ts === '1900-01-01'){
			// dummy date if no image at all; required for correct sorting
			return '';
		} else if (ts !== undefined && ts !== null && ts.length > 15){
			return ts.substr(2,8);  // "2018-11-10"
		} else {
			return ts;
		}
	}
	
	// public tokenFormat(key: string, plant_name: string){
	// 	// returns whether token is to be displayed in bold depending on whether it contains
	// 	// the current plant's id
	// 	if(key===plant_name){
	// 		return true;
	// 	} else {
	// 		return false;
	// 	}
	// }

	public shortenKeywordForTokenDisplay(sName: string): string {
		if (!sName) {
			return '';
		} else if (sName.length <= Constants.LENGTH_SHORTENED_KEYWORD_FOR_TOKEN_DISPLAY) {
			return sName;
		} else {
			return sName.slice(0, Constants.LENGTH_SHORTENED_KEYWORD_FOR_TOKEN_DISPLAY - 3) + '...';
		}
	}
	
	public btnEnabledUntagged(midColumnVisible: boolean, endColumnVisible: boolean){
		return (midColumnVisible && !endColumnVisible);
	}

	public customAndCount(iCount: boolean, iCountInactive: boolean){
		// const sResult = (is_custom) ? 'Custom' : 'IPNI';
		let sCount
		if (!iCount && !iCountInactive){
			sCount = '';
		} else if (!!iCount && !!iCountInactive){
			sCount = iCount + ' plant(s) +' + iCountInactive + ' inactive';
		} else if (!!iCount){
			sCount = iCount + ' plant(s)';
		} else if (!!iCountInactive){
			sCount = iCountInactive + ' inactive';
		}
		return sCount;
	}
	
	public existsAndNotEmpty(obj: any){
		switch (typeof(obj)){
			case 'string':
				return (obj.length === 0) ? false : true;

			// object might be an array, dict or null object
			case 'object':
				if(Array.isArray(obj)){
					return (obj.length === 0) ? false : true;
				} else if (obj === null){
					return false;	
				} else {
					// probably dict
					return (Object.keys(obj).length === 0) ? false : true;
				}
				break;
				
			case 'undefined':
				return false;

			case 'number':
				return (obj === 0) ? false : true;
				
				default:
				var a = 1;
		}
		return true;
	}
	
	// ArrayLength(aArray){
	// 	if(aArray === null || aArray === undefined){
	// 		return 0;
	// 	}
	// 	return aArray.length;
	// },
	
	public last_image_warning(sLastImageDate: string){
		//we always get a day; if we don't have one, backend supplies "1900-01-01"
		if(sLastImageDate==="1900-01-01"){
			return true;
		}
		var iDaysSince = Util.getDaysFromToday(sLastImageDate);
		//@ts-ignore
		const oSettings = <JSONModel>this.getView().getModel('settings').getData();
		if (!oSettings) {
			// if settings model is not available, assume no warning
			return false;
		}
		const max_days = oSettings.settings.last_image_warning_after_n_days; 
		return (iDaysSince > max_days) ? true : false;
	}
	
	public visibleByPropagationType(sPropagationType: string){
		switch (sPropagationType){
			case 'seed (purchased)':
				return true;
			case 'seed (collected)':
				return true;
			default:
				return false;
		}		
	}

	// todo replace
	public show_parent_plant_pollen_by_propagation_type(sPropagationType: string){
		switch (sPropagationType){
			case 'seed (collected)':
				return true;
			default:
				return false;
		}
	}

	// todo replace
	public show_parent_plant_by_propagation_type(sPropagationType: string){
		switch (sPropagationType){
			case 'acquired as plant':
				return false;
			case 'seed (purchased)':
				return false;
			default:
				return true;
		}
	}
	
	public visibleByGeographicOrigin(sGeographicOrigin: string){
		if (!!sGeographicOrigin && sGeographicOrigin.length >= 3){
			return true;
		} else {
			return false;
		}
	}
	
	public createDescendantParentPollenVisibleByPropagationType(ePropagationType: FBPropagationType): boolean{
		if (!ePropagationType){
			// undefined or empty string
			return false;
		}

		const that = <NewDescendantPlantDialogHandler><unknown>this;
		const suggestionService: SuggestionService = that.suggestionService;

		const propagationType = <LPropagationTypeData>suggestionService.getSuggestionItem('propagationTypeCollection', ePropagationType);
		// var propagationType = that.getSuggestionItem('propagationTypeCollection', propagationType);
		return propagationType['hasParentPlantPollen'] === true;
	}

	public getSrcAvatarImageS(image_id: int): string|undefined{
		// get url for image in avatar size s (default), i.e. 3 rem
		if (image_id)
			return Util.getImageIdUrl(image_id, 'rem', 3, 3);
	}

	public getSrcAvatarImageL(image_id: int): string|undefined{
		// get url for image in avatar size l, i.e. 5 rem{
		if (image_id)
			return Util.getImageIdUrl(image_id, 'rem', 5, 5);
	}

	public getSrcImageThumbnail(image_id: int){
		// get url for image in thumbnail size for details images list
		if(image_id)
			return Util.getImageIdUrl(image_id, 'px', 288, 288);
	}

	public getSrcImage(image_id: int): string|undefined{
		// get url for image in full size
		if (image_id)
			return Util.getImageIdUrl(image_id);
	}

	public getSrcImage120px(image_id: int){
		// get url for thumbnail image in taxon images list
		if (image_id)
			return Util.getImageIdUrl(image_id, 'px', 120, 120);
	}

	public getSrcImageOccurrenceThumbnail(gbif_id: int, occurrence_id: int, img_no: int){
		// get url for thumbnail image in taxon images list for occurrences
		var path = 'occurrence_thumbnail?gbif_id=' + gbif_id + '&occurrence_id=' + occurrence_id + '&img_no=' + img_no;
		return Util.getServiceUrl(path);
	}

	public getSrcMasterHoverImage(preview_image_id: int){
		// get url for image in preview popup openened when hovering in master list
		if (!!preview_image_id){
			return Util.getImageIdUrl(preview_image_id, 'px', 1200, 800);
		}
	}

	getFlowerText(flower: PlantFlowerMonth) {
		// if flowering_probability is null or undefined, return empty string
		if (flower.flowering_probability === undefined || flower.flowering_probability === null) {
			return '';
		}

		return flower.flowering_probability * 100 + '%';
	}

}