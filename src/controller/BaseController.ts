//implements a set of functions that are reused by its subclasses (e.g. back button behaviour)
//abstract controller -> no ".controller." in the filename --> prevents usage in views, too
import Controller from "sap/ui/core/mvc/Controller"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import Component from "plants/ui/Component";
import Router from "sap/ui/core/routing/Router";
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
}