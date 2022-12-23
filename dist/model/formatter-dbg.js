sap.ui.define(["plants/ui/customClasses/Util"], function (Util) {
  /**
   * @namespace plants.ui.model
   */
  // export default class formatter extends ManagedObject{
  class formatter {
    // export default {	

    activeInactive(active) {
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
    countPlants(plants) {
      if (plants !== undefined) {
        return plants.length.toString();
      }
    }
    addDummyIfEmpty(s) {
      if (s.length === 0) {
        return '_';
      } else {
        return s;
      }
    }
    propertyStateByType(propertyType) {
      // returns an objecte status state (e.g. success for green) based on 
      // the supplied trait status; used for traits display
      if (propertyType === 'plant') {
        return 'Success'; // green
      } else if (propertyType === 'taxon') {
        return 'None';
      } else {
        return 'Warning'; //orange
      }
    }

    // todo repair
    colorByPreviewOrNot(sImage, sPlantPreviewImage) {
      if (!!sImage && !!sPlantPreviewImage) {
        // uri may be split via forward or backward slashes
        var sSplit = sPlantPreviewImage.indexOf('/') === -1 ? '\\' : '/';
        var sImageFilename = sImage.split(sSplit)[sImage.split(sSplit).length - 1];
        var sPlantPreviewImageFilename = sPlantPreviewImage.split(sSplit)[sPlantPreviewImage.split(sSplit).length - 1];
        // # sPlantPreviewImage has a suffix before the file type (e.g. 300_300), except temporily set
        // # just get the base filenames without suffix and file type
        var aImage = sImageFilename.split('.');
        aImage.pop();
        var aPreview = sPlantPreviewImageFilename.split('.');
        aPreview.pop();
        if (aPreview.length >= 2) {
          aPreview.pop();
        }
        //if image is current preview image, then return blue, otherwise yellow
        if (aPreview.join('.') === aImage.join('.')) {
          return 'blue';
        }
      }
      return '#E69A17'; // orange
    }

    timestampToDateShort(ts) {
      if (ts === '1900-01-01') {
        // dummy date if no image at all; required for correct sorting
        return '';
      } else if (ts !== undefined && ts !== null && ts.length > 15) {
        return ts.substr(2, 8); // "2018-11-10"
      } else {
        return ts;
      }
    }
    tokenFormat(key, plant_name) {
      if (key === plant_name) {
        return true;
      } else {
        return false;
      }
    }
    messageCount(aMessages) {
      if (aMessages) {
        return aMessages.length;
      } else {
        return 0;
      }
    }
    btnEnabledUntagged(midColumnVisible, endColumnVisible) {
      return midColumnVisible && !endColumnVisible;
    }
    ipniOrCustomName(fqId, is_custom) {
      if (is_custom) {
        return 'Custom Entry';
      } else {
        return fqId;
      }
    }
    sourceAndCount(sSource, iCount, iCountInactive) {
      if (!iCount && !iCountInactive) {
        return sSource;
      } else if (!!iCount && !!iCountInactive) {
        return sSource + ' (' + iCount + ' +' + iCountInactive + ' inactive )';
      } else if (!!iCount) {
        return sSource + ' (' + iCount + ')';
      } else if (!!iCountInactive) {
        return sSource + ' (' + iCountInactive + ' inactive )';
      }
    }
    existsAndNotEmpty(obj) {
      switch (typeof obj) {
        case 'string':
          return obj.length === 0 ? false : true;

        // object might be an array, dict or null object
        case 'object':
          if (Array.isArray(obj)) {
            return obj.length === 0 ? false : true;
          } else if (obj === null) {
            return false;
          } else {
            // probably dict
            return Object.keys(obj).length === 0 ? false : true;
          }
          break;
        case 'undefined':
          return false;
        case 'number':
          return obj === 0 ? false : true;
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

    last_image_warning(sLastImageDate) {
      //we always get a day; if we don't have one, backend supplies "1900-01-01"
      if (sLastImageDate === "1900-01-01") {
        return true;
      }
      var iDaysSince = Util.getDaysFromToday(sLastImageDate);
      return iDaysSince > 380 ? true : false;
    }

    // // todo redo this functionality or remove it
    // avatarSrc(oPlant, sPreviewImage){
    // 	// updated when filter/settings confirmed, sets chosen preview image in plants table
    // 	// default: favourite image; set in component
    // 	switch (sPreviewImage){
    // 		case 'favourite_image':
    // 			return oPlant.url_preview;
    // 		case 'latest_image':
    // 			try{
    // 				return oPlant.latest_image.path_thumb;
    // 			} catch(e) {
    // 				return undefined;	
    // 			}
    // 	}
    // },

    visibleByPropagationType(sPropagationType) {
      switch (sPropagationType) {
        case 'seed (purchased)':
          return true;
        case 'seed (collected)':
          return true;
        default:
          return false;
      }
    }

    // todo replace
    show_parent_plant_pollen_by_propagation_type(sPropagationType) {
      switch (sPropagationType) {
        case 'seed (collected)':
          return true;
        default:
          return false;
      }
    }

    // todo replace
    show_parent_plant_by_propagation_type(sPropagationType) {
      switch (sPropagationType) {
        case 'acquired as plant':
          return false;
        case 'seed (purchased)':
          return false;
        default:
          return true;
      }
    }
    visibleByGeographicOrigin(sGeographicOrigin) {
      if (!!sGeographicOrigin && sGeographicOrigin.length >= 3) {
        return true;
      } else {
        return false;
      }
    }
    createDescendantParentPollenVisibleByPropagationType(propagationType) {
      if (!propagationType) {
        // undefined or empty string
        return false;
      }
      const that = this;
      var propagationType = that.getSuggestionItem('propagationTypeCollection', propagationType);
      return propagationType['hasParentPlantPollen'] === true;
    }
    getSrcAvatarImageS(filename_previewimage) {
      // get url for image in avatar size s (default), i.e. 3 rem
      if (filename_previewimage) return Util.getImageUrl(filename_previewimage, 'rem', 3, 3);
    }
    getSrcAvatarImageL(filename_previewimage) {
      // get url for image in avatar size l, i.e. 5 rem{
      if (filename_previewimage) return Util.getImageUrl(filename_previewimage, 'rem', 5, 5);
    }
    getSrcImageThumbnail(filename) {
      // get url for image in thumbnail size for details images list
      return Util.getImageUrl(filename, 'px', 288, 288);
    }
    getSrcImage(filename) {
      // get url for image in full size
      if (filename) return Util.getImageUrl(filename);
    }
    getSrcImage120px(filename) {
      // get url for thumbnail image in taxon images list
      return Util.getImageUrl(filename, 'px', 120, 120);
    }
    getSrcImageOccurrenceThumbnail(gbif_id, occurrence_id, img_no) {
      // get url for thumbnail image in taxon images list for occurrences
      var path = 'occurrence_thumbnail?gbif_id=' + gbif_id + '&occurrence_id=' + occurrence_id + '&img_no=' + img_no;
      return Util.getServiceUrl(path);
    }
    getSrcMasterHoverImage(filename) {
      // get url for image in preview popup openened when hovering in master list
      return Util.getImageUrl(filename, 'px', 1200, 800);
    }
  }
  return formatter;
});
//# sourceMappingURL=formatter.js.map