import ManagedObject from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import * as Util from "plants/ui/customClasses/shared/Util";
import ModelsHelper from "plants/ui/model/ModelsHelper";
import ChangeTracker from "../singleton/ChangeTracker";
import MessageHandler from "../singleton/MessageHandler";
import { FPlantsUpdateRequest } from "plants/ui/definitions/Plants";
import Event from "sap/ui/base/Event";
import { MessageType } from "sap/ui/core/library";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantsLoader extends ManagedObject {
    private _oPlantsModel: JSONModel;

    public constructor(oPlantsModel: JSONModel) {
		super();
		this._oPlantsModel = oPlantsModel;

		//we need to add the event handlers to the jsonmodel here as this is executed only
		//once; if we attach them before calling, they're adding up to one more each time
		this._oPlantsModel.attachRequestCompleted(this._onReceivingPlantsFromBackend.bind(this));
		// this._oPlantsModel.attachRequestFailed(ModelsHelper.onReceiveErrorGeneric.bind(this, 'Plants Model'));
		this._oPlantsModel.attachRequestFailed(ModelsHelper.onReceiveErrorGeneric.bind(this, 'Plants Model'));
	}

    loadPlants() {
		var sUrl = Util.getServiceUrl('plants/');
		this._oPlantsModel.loadData(sUrl);
		Util.stopBusyDialog();  // todo: should be stopped only when everything has been reloaded, not only plants
	}

	private _onReceivingPlantsFromBackend(oRequestInfo: Event) {
		// create new clone objects to track changes
		const oPlantsModel = <JSONModel>oRequestInfo.getSource();
		ChangeTracker.getInstance().setOriginalPlants(<FPlantsUpdateRequest>oPlantsModel.getData());

		//create message
		var sresource = Util.parse_resource_from_url(oRequestInfo.getParameter('url'));
		MessageHandler.getInstance().addMessage(MessageType.Information, 'Loaded Plants from backend', undefined,
			'Resource: ' + sresource);
	}

}