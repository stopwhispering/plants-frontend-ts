import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import ListBinding from "sap/ui/model/ListBinding";
import * as Util from "plants/ui/customClasses/Util";
import { BPlant, FBPlantTag } from "../definitions/Plants";
import Dialog from "sap/m/Dialog";
import View from "sap/ui/core/mvc/View";
import SegmentedButton from "sap/m/SegmentedButton";
import { LFilterHiddenChoice } from "../definitions/PlantsLocal";
import StandardTreeItem from "sap/m/StandardTreeItem";
import { BTaxonTreeNode } from "../definitions/Selection";
import { LTaxonTreeNodeInFilterDialog } from "../definitions/SelectionLocal";

/**
 * @namespace plants.ui.customClasses
 */
export default class PlantFilterTaxonTree extends ManagedObject {
	private _oTaxonTreeModel: JSONModel

	public constructor(oTaxonTreeModel: JSONModel) {
		super();

		this._oTaxonTreeModel = oTaxonTreeModel;
	}

	public selectSubItemsInTaxonTree(aSelectedItems: StandardTreeItem[]) {
		let that = this;
		aSelectedItems.forEach(function (oItem: StandardTreeItem) {
			var oNode = <BTaxonTreeNode>oItem.getBindingContext('selection')!.getObject();
			var bSelected = oItem.getSelected();
			if (oNode.nodes) {
				that._addSelectedFlag(oNode.nodes, bSelected);
			}
		});
		this._oTaxonTreeModel.refresh();
	}

	private _addSelectedFlag(aNodes: BTaxonTreeNode[], bSelected: boolean) {
		const that = this;
		aNodes.forEach(function (oNode: BTaxonTreeNode) {
			let oNodeInFilterDialog: LTaxonTreeNodeInFilterDialog = <LTaxonTreeNodeInFilterDialog>oNode;
			oNodeInFilterDialog.selected = bSelected;
			if (!!oNodeInFilterDialog.nodes && oNodeInFilterDialog.nodes.length > 0) {
				that._addSelectedFlag(oNodeInFilterDialog.nodes, bSelected);
			}
		});
	}
}