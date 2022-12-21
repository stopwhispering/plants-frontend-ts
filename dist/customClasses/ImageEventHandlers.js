sap.ui.define(["sap/m/MessageToast","plants/ui/customClasses/Util","sap/ui/base/ManagedObject"],function(e,n,t){const s=t.extend("plants.ui.customClasses.ImageEventHandlers",{constructor:function e(n){t.prototype.constructor.call(this);this.applyToFragment=n},assignPlantToImage:function t(s,a,i){var o=a.plants;var g={plant_id:s.id,key:s.plant_name,text:s.plant_name};if(n.isDictKeyInArray(g,o)){e.show("Plant Name already assigned. ");return false}else{o.push(g);console.log("Assigned plant to image: "+s.plant_name+" ("+s.id+")");i.updateBindings(false);return true}},assignImageToEvent:function e(n){var t=n.getBindingContext("images").getPath();this.applyToFragment("dialogAssignEventToImage",e=>{e.bindElement({path:t,model:"images"});e.openBy(n,true)})},assignEventToImage:function n(t,s,a){const i=t.getBindingContext("images").getObject();var o={filename:i.filename};const g=t.getBindingContext("events").getObject();if(!!g.images&&g.images.length>0){var r=g.images.find(function(e){return e.filename===o.filename});if(r){e.show("Event already assigned to image.");a.close();return}}if(!g.images){g.images=[o]}else{g.images.push(o)}e.show("Assigned.");s.updateBindings(false);a.close()},unassignImageFromEvent:function n(t,s){var a=s.getProperty(t);var i=t.substring(0,t.lastIndexOf("/"));var o=s.getProperty(i);var g=o.indexOf(a);if(g===-1){e.show("Can't find image.");return}o.splice(g,1);s.refresh()},handleTypeMissmatch:function n(t,s){var a=t.getFileType().map(e=>"*."+e);var i=a.join(", ");e.show("The file type *."+s+" is not supported. Choose one of the following types: "+i)},removeTokenFromModel:function e(n,t,s,a){if(a==="plant"){const e=t.plants;const s=e.findIndex(e=>e.key===n);e.splice(s,1)}else{const e=t.keywords;const s=e.findIndex(e=>e.keyword===n);e.splice(s,1)}s.updateBindings(false)}});s.getInstance=function e(n){if(!s._instance&&n){s._instance=new s(n)}return s._instance};return s});