sap.ui.define(["sap/m/MessageToast","plants/ui/customClasses/Util","plants/ui/customClasses/Navigation","sap/ui/base/ManagedObject"],function(e,t,n,a){function s(e){return e&&e.__esModule&&typeof e.default!=="undefined"?e.default:e}const i=s(n);const g=a.extend("plants.ui.customClasses.ImageEventHandlers",{constructor:function e(){a.prototype.constructor.apply(this,arguments);this.navigation=i.getInstance()},onInputImageNewPlantNameSubmit:function t(n){var a=n.getSource().data("sModel");if(n.getId()==="suggestionItemSelected"){var s=n.getParameter("selectedRow").getBindingContext("plants").getObject().plant_name}else{s=n.getParameter("value").trim()}if(!this.isPlantNameInPlantsModel(s)||!s){e.show("Plant Name does not exist.");return}var i=n.getSource().getParent().getBindingContext(a);var g=this.getPlantId(s);this.imageEventHandlers._addPlantNameToImage(s,g,i);n.getSource().setValue("")},onIconPressTagDetailsPlant:function e(t){var n=this.getPlantById(this._currentPlantId);var a=t.getSource().getParent().getBindingContext("untaggedImages");this.imageEventHandlers._addPlantNameToImage(n.plant_name,n.id,a);this.resetImagesCurrentPlant(this._currentPlantId)},_addPlantNameToImage:function n(a,s,i){var g=i.getObject().plants;var o={key:a,text:a,plant_id:s};if(t.isDictKeyInArray(o,g)){e.show("Plant Name already assigned. ");return false}else{g.push(o);console.log("Assigned plant to image: "+a+" ("+i.getPath()+")");i.getModel().updateBindings();return true}},onPressImagePlantToken:function e(t,n){var a=n.getSource().getBindingContext(t).getObject().plant_id;if(a>=0){this.navigation.navToPlantDetails.call(this,a)}else{this.handleErrorMessageBox("Can't find selected Plant")}},onIconPressAssignImageToEvent:function e(t){var n=t.getSource();var a=t.getSource().getBindingContext("images").getPath();this.applyToFragment("dialogAssignEventToImage",e=>{e.bindElement({path:a,model:"images"});e.openBy(n)})},onAssignEventToImage:function t(n){var a=n.getSource().getBindingContextPath("events");var s=n.getSource().getBindingContext("images").getObject();var i={filename:s.filename};var g=this.getView().getModel("events").getProperty(a);if(!!g.images&&g.images.length>0){var o=g.images.find(function(e){return e.filename===i.filename});if(o){e.show("Event already assigned to image.");this._getFragment("dialogAssignEventToImage").close();return}}if(!g.images){g.images=[i]}else{g.images.push(i)}e.show("Assigned.");this.getView().getModel("events").updateBindings();this._getFragment("dialogAssignEventToImage").close()},onIconPressUnassignImageFromEvent:function t(n){var a=n.getParameter("listItem").getBindingContextPath("events");var s=n.getSource().getModel("events").getProperty(a);var i=a.substring(0,a.lastIndexOf("/"));var g=this.getOwnerComponent().getModel("events").getProperty(i);var o=g.indexOf(s);if(o===-1){e.show("Can't find image.");return}g.splice(o,1);this.getOwnerComponent().getModel("events").refresh()}});g.getInstance=function e(){if(!g._instance){g._instance=new g}return g._instance};return g});