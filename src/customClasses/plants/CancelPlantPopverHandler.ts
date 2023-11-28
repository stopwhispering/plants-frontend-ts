import { PlantRead, FBCancellationReason } from "plants/ui/definitions/Plants";
import { LCancellationReasonChoice, LCancelPlantInputData } from "plants/ui/definitions/PlantsLocal";
import Popover, { Popover$AfterCloseEvent } from "sap/m/Popover";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import Util from "../shared/Util";
import { Button$PressEvent } from "sap/m/Button";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class CancelPlantPopverHandler extends ManagedObject {
	private _oSuggestionsModel: JSONModel;
	private _oPlantsModel: JSONModel;

    private _oCancelPlantPopover: Popover;  // "dialogCancellation"

	private _oPlant: PlantRead;

    constructor(oSuggestionsModel: JSONModel, oPlantsModel: JSONModel) {
        super();
		this._oSuggestionsModel = oSuggestionsModel;
		this._oPlantsModel = oPlantsModel;
    }

    public openCancelPlantPopover(oViewAttachTo: View, oPlant: PlantRead, oOpenBy: Control): void {
		this._oPlant = oPlant;

		Fragment.load({
			name: "plants.ui.view.fragments.detail.DetailCancellation",
			id: oViewAttachTo.getId(),
			controller: this
		}).then((oControl: Control | Control[]) => {
			this._oCancelPlantPopover = <Popover>oControl;

			const oCancelPlantInputData: LCancelPlantInputData = {
				cancellationDate: new Date()
			};
			const oCancelPlantInputModel = new JSONModel(oCancelPlantInputData);
			this._oCancelPlantPopover.setModel(oCancelPlantInputModel, 'cancelPlant');

			// (<DatePicker>oView.byId("cancellationDate")).setDateValue(new Date());
			
			oViewAttachTo.addDependent(this._oCancelPlantPopover);
			this._oCancelPlantPopover.openBy(oOpenBy, true);
		});

    }

	onAfterCloseCancelPlantPopover(oEvent: Popover$AfterCloseEvent) {
        const oModelDescendantPlantInputModel = <JSONModel>this._oCancelPlantPopover.getModel('cancelPlant');
        oModelDescendantPlantInputModel.destroy(); 
		this._oCancelPlantPopover.destroy();
	}
	onCancelCancelPlantPopover(oEvent: Button$PressEvent) {
		this._oCancelPlantPopover.close();
	}

	onSetPlantInactive(oEvent: Button$PressEvent) {
		//set plant inactive after choosing a reason (e.g. freezing, drought, etc.)
		//we don't use radiobuttongroup helper, so we must get selected element manually
		
        const oModelDescendantPlantInputModel = <JSONModel>this._oCancelPlantPopover.getModel('cancelPlant')
		const oCancelPlantInputData: LCancelPlantInputData = oModelDescendantPlantInputModel.getData();
		// todo use only one model, don't use suggestions model for input

		var aReasons = <LCancellationReasonChoice[]>this._oSuggestionsModel.getProperty('/cancellationReasonCollection');
		var oReasonSelected = aReasons.find(ele => ele.selected);

		// todo move to crud class!!!!!!!!!!

		//set current plant's cancellation reason and date
		// var oCurrentPlant = <PlantRead>this.getView().getBindingContext('plants')!.getObject();
		this._oPlant.cancellation_reason = oReasonSelected!.text as FBCancellationReason;
		// var oDatePicker = <DatePicker>this.byId("cancellationDate");
		// let oDate: Date = oDatePicker.getDateValue() as unknown as Date;
		var sDateFormatted = Util.formatDate(oCancelPlantInputData.cancellationDate);
		// this.getView().getBindingContext('plants').getObject().cancellation_date = sDateFormatted;
		this._oPlant.cancellation_date = sDateFormatted;
		this._oPlant.active = false;
		this._oPlantsModel.updateBindings(false);

		this._oCancelPlantPopover.close();
	}

}