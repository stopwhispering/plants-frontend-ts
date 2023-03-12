import ManagedObject from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import Util from "plants/ui/customClasses/shared/Util";
import ChangeTracker from "./ChangeTracker";
import MessageHandler from "./MessageHandler";
import { FPlantsUpdateRequest } from "plants/ui/definitions/Plants";
import Event from "sap/ui/base/Event";
import { MessageType } from "sap/ui/core/library";
import Navigation from "./Navigation";
import ErrorHandling from "../shared/ErrorHandling";

/**
 * @namespace plants.ui.customClasses.singleton
 */
export default class PlantsLoader extends ManagedObject {
	private static _instance: PlantsLoader;
    private _oPlantsModel: JSONModel;
	private _iNavToPlantId: int | undefined;

	public static createInstance(oPlantsModel: JSONModel): void {
		if (PlantsLoader._instance)
			throw new Error("PlantsLoader already initialized");
		PlantsLoader._instance = new PlantsLoader(oPlantsModel);
	}	

	public static getInstance(): PlantsLoader {
		if (!PlantsLoader._instance) 
			throw new Error("PlantsLoader not initialized.");
		return PlantsLoader._instance;
	}	

    private constructor(oPlantsModel: JSONModel) {
		super();
		this._oPlantsModel = oPlantsModel;

		//we need to add the event handlers to the jsonmodel here as this is executed only
		//once; if we attach them before calling, they're adding up to one more each time
		this._oPlantsModel.attachRequestCompleted(this._onReceivingPlantsFromBackend.bind(this));
		this._oPlantsModel.attachRequestFailed(ErrorHandling.onFail.bind(this, 'Plants Model'));
	}

    public loadPlants(iNavToPlantId: int = undefined): void {
		var sUrl = Util.getServiceUrl('plants/');
		this._iNavToPlantId = iNavToPlantId;
		this._oPlantsModel.loadData(sUrl);
		Util.stopBusyDialog();  // todo: should be stopped only when everything has been reloaded, not only plants
	}

	private _onReceivingPlantsFromBackend(oRequestInfo: Event) {
		// create new clone objects to track changes
		const oPlantsModel = <JSONModel>oRequestInfo.getSource();
		ChangeTracker.getInstance().setOriginalPlants(<FPlantsUpdateRequest>oPlantsModel.getData());

		//create message
		var sresource = Util.parse_resource_from_url(oRequestInfo.getParameter('url'));
		MessageHandler.getInstance().addMessage(MessageType.Information, 'Loaded Plants from backend',
			'Resource: ' + sresource);
		console.log('Received plants from backend.')
		if (this._iNavToPlantId) {
			console.log('Navigating to ' + this._iNavToPlantId);
			Navigation.getInstance().navToPlantDetails(this._iNavToPlantId);
		}
	}
}