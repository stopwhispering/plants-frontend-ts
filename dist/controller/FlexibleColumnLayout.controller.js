sap.ui.define(["plants/ui/controller/BaseController","plants/ui/model/ModelsHelper","plants/ui/customClasses/MessageUtil","plants/ui/model/formatter","sap/m/MessageToast","sap/m/MessageBox","plants/ui/customClasses/Util","sap/m/Token","sap/ui/model/Filter","sap/ui/model/FilterOperator","plants/ui/customClasses/Navigation","sap/ui/core/library","../customClasses/ImageEventHandlers"],function(e,t,n,a,o,s,i,r,l,u,d,g,p){function h(e){return e&&e.__esModule&&typeof e.default!=="undefined"?e.default:e}const c=h(e);const m=h(t);const f=h(n);const y=h(a);const v=s["Action"];const I=h(d);const M=g["MessageType"];const P=h(p);const C=c.extend("plants.ui.controller.FlexibleColumnLayout",{constructor:function e(){c.prototype.constructor.apply(this,arguments);this.formatter=new y;this.mIdToFragment={MessagePopover:"plants.ui.view.fragments.menu.MessagePopover",dialogUploadPhotos:"plants.ui.view.fragments.menu.UploadPhotos",menuShellBarMenu:"plants.ui.view.fragments.menu.ShellBarMenu"}},onInit:function e(){c.prototype.onInit.call(this);this._oRouter=this.oComponent.getRouter();this._oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched,this);this._oRouter.attachRouteMatched(this._onRouteMatched,this);this.imageEventHandlers=new P(this.applyToFragment.bind(this))},_onBeforeRouteMatched:function e(t){var n=this.oComponent.getModel();var a=t.getParameter("arguments").layout;if(!a){var o=this.oComponent.getHelper().getNextUIState(0);a=o.layout}if(a){n.setProperty("/layout",a)}},_onRouteMatched:function e(t){var n=t.getParameter("name"),a=t.getParameter("arguments");this._updateUIElements();this._currentRouteName=n;this._currentPlantId=a.plant_id},applyToFragment:function e(t,n,a){c.prototype.applyToFragment.call(this,t,n,a,this.mIdToFragment)},onStateChanged:function e(t){this._updateUIElements();const n=t.getParameter("isNavigationArrow");if(n){const e=t.getParameter("layout");this._oRouter.navTo(this._currentRouteName,{layout:e,plant_id:this._currentPlantId})}},_updateUIElements:function e(){var t=this.oComponent.getHelper().getCurrentUIState();if(window.location.hash.includes("TwoColumnsMidExpanded")){t.layout="TwoColumnsMidExpanded";t.columnsVisibility.midColumn=true}else if(window.location.hash.includes("ThreeColumnsMidExpanded")){t.layout="ThreeColumnsMidExpanded";t.columnsVisibility.midColumn=true;t.columnsVisibility.endColumn=true}var n=this.oComponent.getModel();if(n)n.setData(t)},onExit:function e(){this._oRouter.detachRouteMatched(this._onRouteMatched,this);this._oRouter.detachBeforeRouteMatched(this._onBeforeRouteMatched,this)},onShellBarMenuButtonPressed:function e(t){var n=t.getSource();this.applyToFragment("menuShellBarMenu",e=>{e.openBy(n,true)})},generateMissingThumbnails:function e(){$.ajax({url:i.getServiceUrl("generate_missing_thumbnails"),type:"POST",contentType:"application/json",context:this}).done(this.onReceiveSuccessGeneric).fail(m.getInstance(undefined).onReceiveErrorGeneric.bind(this,"Generate Missing Thumbnails (POST)"))},onPressButtonSave:function e(){this.savePlantsAndImages()},onPressButtonRefreshData:function e(){var t=this.getModifiedPlants();var n=this.getModifiedImages();var a=this.getModifiedTaxa();if(t.length!==0||n.length!==0||a.length!==0){var o=!!this.getView().$().closest(".sapUiSizeCompact").length;s.confirm("Revert all changes?",{onClose:this._onCloseRefreshConfirmationMessageBox.bind(this),styleClass:o?"sapUiSizeCompact":""})}else{this._onCloseRefreshConfirmationMessageBox(v.OK)}},_onCloseRefreshConfirmationMessageBox:function e(t){if(t===v.OK){i.startBusyDialog("Loading...","Loading plants, taxa, and images");var n=m.getInstance();n.reloadPlantsFromBackend();n.resetImagesRegistry();n.reloadTaxaFromBackend()}},onOpenFragmentUploadPhotos:function e(t){this.applyToFragment("dialogUploadPhotos",e=>e.open(),e=>{var t=this.byId("multiInputUploadImageKeywords");t.addValidator(this._keywordValidator)})},_keywordValidator:function e(t){var n=t.text;return new r({key:n,text:n})},uploadPhotosToServer:function e(t){var n=this.byId("idPhotoUpload");if(!n.getValue()){o.show("Choose a file first");return}i.startBusyDialog("Uploading...","Image File(s)");var a=i.getServiceUrl("images/");n.setUploadUrl(a);var s=this.byId("multiInputUploadImagePlants").getTokens();var r=[];if(s.length>0){for(var l=0;l<s.length;l++){r.push(s[l].getProperty("key"))}}var u=this.byId("multiInputUploadImageKeywords").getTokens();var d=[];if(u.length>0){for(l=0;l<u.length;l++){d.push(u[l].getProperty("key"))}}else{}var g={plants:r,keywords:d};n.setAdditionalData(JSON.stringify(g));n.upload()},handleUploadComplete:function e(t){var n=t.getParameter("responseRaw");if(!n){var a="Upload complete, but can't determine status. No response received.";f.getInstance().addMessage(M.Warning,a,undefined,undefined);i.stopBusyDialog();return}var s=JSON.parse(n);if(!s){a="Upload complete, but can't determine status. Can't parse Response.";f.getInstance().addMessage(M.Warning,a,undefined,undefined);i.stopBusyDialog();return}f.getInstance().addMessageFromBackend(s.message);if(s.images.length>0){m.getInstance().addToImagesRegistry(s.images);this.resetImagesCurrentPlant(this._currentPlantId);this.oComponent.getModel("images").updateBindings(false);this.oComponent.resetUntaggedPhotos();this.oComponent.getModel("untaggedImages").updateBindings(false)}i.stopBusyDialog();o.show(s.message.message);this.applyToFragment("dialogUploadPhotos",e=>e.close())},onIconPressAssignDetailsPlant:function e(t){var n=this.getPlantById(this._currentPlantId);if(!n){return}var a=this.byId("multiInputUploadImagePlants");if(!a.getTokens().find(e=>e.getProperty("key")==n.plant_name)){var o=new r({key:n.id.toString(),text:n.plant_name});a.addToken(o)}},onShowUntagged:function e(t){var n=this.oComponent.getHelper().getNextUIState(2);this._oRouter.navTo("untagged",{layout:n.layout,plant_id:this._currentPlantId})},onShellBarSearch:function e(t){var n=t.getParameter("suggestionItem").getBindingContext("plants").getObject().id;I.getInstance().navToPlantDetails(n)},onShellBarSuggest:function e(t){var n=t.getParameter("suggestValue"),a=[];var o=new l("active",u.EQ,true);if(n){a=[new l([new l("plant_name",function(e){return(e||"").toUpperCase().indexOf(n.toUpperCase())>-1}),new l("botanical_name",function(e){return(e||"").toUpperCase().indexOf(n.toUpperCase())>-1}),new l("id",u.EQ,n)])];var s=new l({filters:a,and:false});o=new l({filters:[o,s],and:true})}const i=this.byId("searchField");const r=i.getBinding("suggestionItems");r.filter(o);i.suggest()},onShellBarNotificationsPressed:function e(t){var n=t.getSource();this.applyToFragment("MessagePopover",e=>{e.isOpen()?e.close():e.openBy(n,true)})},onClearMessages:function e(t){f.getInstance().removeAllMessages()},onHomeIconPressed:function e(t){var n=this.oComponent.getHelper();var a=n.getDefaultLayouts().defaultLayoutType;this._oRouter.navTo("master",{layout:a})},onHandleTypeMissmatch:function e(t){const n=t.getSource();const a=t.getParameter("fileType");this.imageEventHandlers.handleTypeMissmatch(n,a)}});return C});