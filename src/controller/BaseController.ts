//implements a set of functions that are reused by its subclasses (e.g. back button behaviour)
//abstract controller -> no ".controller." in the filename --> prevents usage in views, too
import Controller from "sap/ui/core/mvc/Controller"
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler"
import * as Util from "plants/ui/customClasses/shared/Util";
import MessageToast from "sap/m/MessageToast"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import Fragment from "sap/ui/core/Fragment"
import Dialog from "sap/m/Dialog";
import Component from "plants/ui/Component";
import Router from "sap/ui/core/routing/Router";
import Control from "sap/ui/core/Control";
import { IdToFragmentMap } from "plants/ui/definitions/SharedLocal";
import { BConfirmation, BMessage} from "plants/ui/definitions/Messages";
import Event from "sap/ui/base/Event";
import Popover from "sap/m/Popover";
import ViewSettingsDialog from "sap/m/ViewSettingsDialog";
/**
 * @namespace plants.ui.controller
 */
export default class BaseController extends Controller {

	ModelsHelper: ModelsHelper

	protected oComponent: Component;
	protected oRouter: Router;

	public onInit() {
		this.oComponent = <Component>this.getOwnerComponent();
		this.oRouter = this.oComponent.getRouter();
	}

	protected applyToFragment(sId: string, fn: Function, fnInit?: Function, mIdToFragment?: IdToFragmentMap) {
		//create fragment singleton and apply supplied function to it (e.g. open, close)
		// if stuff needs to be done only once, supply fnInit wher^^e first usage happens

		//example usages:
		// this.applyToFragment('dialogDoSomething', _onOpenAddTagDialog.bind(this));
		// this.applyToFragment('dialogDoSomething', (o)=>o.close());
		// this.applyToFragment('dialogDoSomething', (o)=>{doA; doB; doC;}, fnMyInit);

		//fragment id to fragment file path
		if (!mIdToFragment) {
			mIdToFragment = <IdToFragmentMap>{
			}
		}

		var oView = this.getView();
		if (oView.byId(sId)) {
			fn(oView.byId(sId));
		} else {
			Fragment.load({
				name: mIdToFragment[sId],
				id: oView.getId(),
				controller: this
			}).then(function (oFragment: Control | Control[]) {
				oView.addDependent(<Control>oFragment);
				if (fnInit) {
					fnInit(oFragment);
				}
				fn(oFragment);
			});
		}
	}

	onAjaxSimpleSuccess(oConfirmation: BConfirmation, sStatus: string, oReturnData: object) {
		//toast and create message
		//requires pre-defined message from backend
		//todo move to some utility class, e.g. MessageHandler
		MessageToast.show(oConfirmation.message.message);
		MessageHandler.getInstance().addMessageFromBackend(oConfirmation.message);
	}

	public onCancelDialog(oEvent: Event) {
		// generic handler for fragments to be closed
		let oControl = <Control>oEvent.getSource();
		// navigate through the control tree until we have a sap.m.Dialog or a sap.m.Popover
		do {
			oControl = <Control>oControl.getParent();
		} while (oControl.getParent() !== undefined && !(oControl instanceof Dialog) && !(oControl instanceof Popover) && !(oControl instanceof ViewSettingsDialog));
		if (!oControl) {
			MessageToast.show("Error: Could not find Dialog or Popover to close");
			return
		}
		(<Dialog | Popover>oControl).close();
	}

	protected onReceiveSuccessGeneric(oMsg: BMessage) {
		Util.stopBusyDialog();
		MessageToast.show(oMsg.message);
		MessageHandler.getInstance().addMessageFromBackend(oMsg);
	}
}