//todo file required? here?
import JSONModel from "sap/ui/model/json/JSONModel"
import Device from "sap/ui/Device"

/**
 * @namespace plants.ui.model
 */
export function createDeviceModel() {
	var oModel = new JSONModel(Device);
	oModel.setDefaultBindingMode("OneWay");
	return oModel;
}