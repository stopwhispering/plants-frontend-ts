sap.ui.define(["plants/ui/customClasses/Util"],function(e){class r{activeInactive(e){switch(e){case true:return"";case false:return"Status: inactive";case null:return"Status: unknown";default:return e}}countPlants(e){if(e!==undefined){return e.length.toString()}}addDummyIfEmpty(e){if(e.length===0){return"_"}else{return e}}propertyStateByType(e){if(e==="plant"){return"Success"}else if(e==="taxon"){return"None"}else{return"Warning"}}colorByPreviewOrNot(e,r){if(!!e&&!!r){var t=r.indexOf("/")===-1?"\\":"/";var n=e.split(t)[e.split(t).length-1];var a=r.split(t)[r.split(t).length-1];var u=n.split(".");u.pop();var s=a.split(".");s.pop();if(s.length>=2){s.pop()}if(s.join(".")===u.join(".")){return"blue"}}return"#E69A17"}timestampToDateShort(e){if(e==="1900-01-01"){return""}else if(e!==undefined&&e!==null&&e.length>15){return e.substr(2,8)}else{return e}}tokenFormat(e,r){if(e===r){return true}else{return false}}messageCount(e){if(e){return e.length}else{return 0}}btnEnabledUntagged(e,r){return e&&!r}ipniOrCustomName(e,r){if(r){return"Custom Entry"}else{return e}}sourceAndCount(e,r,t){if(!r&&!t){return e}else if(!!r&&!!t){return e+" ("+r+" +"+t+" inactive )"}else if(!!r){return e+" ("+r+")"}else if(!!t){return e+" ("+t+" inactive )"}}existsAndNotEmpty(e){switch(typeof e){case"string":return e.length===0?false:true;case"object":if(Array.isArray(e)){return e.length===0?false:true}else if(e===null){return false}else{return Object.keys(e).length===0?false:true}break;case"undefined":return false;case"number":return e===0?false:true;default:var r=1}return true}last_image_warning(r){if(r==="1900-01-01"){return true}var t=e.getDaysFromToday(r);return t>380?true:false}visibleByPropagationType(e){switch(e){case"seed (purchased)":return true;case"seed (collected)":return true;default:return false}}show_parent_plant_pollen_by_propagation_type(e){switch(e){case"seed (collected)":return true;default:return false}}show_parent_plant_by_propagation_type(e){switch(e){case"acquired as plant":return false;case"seed (purchased)":return false;default:return true}}visibleByGeographicOrigin(e){if(!!e&&e.length>=3){return true}else{return false}}createDescendantParentPollenVisibleByPropagationType(e){if(!e){return false}const r=this;var e=r.getSuggestionItem("propagationTypeCollection",e);return e["hasParentPlantPollen"]===true}getSrcAvatarImageS(r){if(r)return e.getImageUrl(r,"rem",3,3)}getSrcAvatarImageL(r){if(r)return e.getImageUrl(r,"rem",5,5)}getSrcImageThumbnail(r){return e.getImageUrl(r,"px",288,288)}getSrcImage(r){if(r)return e.getImageUrl(r)}getSrcImage120px(r){return e.getImageUrl(r,"px",120,120)}getSrcImageOccurrenceThumbnail(r,t,n){var a="occurrence_thumbnail?gbif_id="+r+"&occurrence_id="+t+"&img_no="+n;return e.getServiceUrl(a)}getSrcMasterHoverImage(r){return e.getImageUrl(r,"px",1200,800)}}return r});