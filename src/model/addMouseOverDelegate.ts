import DynamicPage from "sap/f/DynamicPage";
import Avatar from "sap/m/Avatar";
import Table from "sap/m/Table";
import ListItem from "sap/ui/core/ListItem";
import View from "sap/ui/core/mvc/View";
import Master from "../controller/Master.controller";

/**
 * @namespace plants.ui.model
 */
export default function addMouseOverDelegate(_: string) {
        // with javascript ui5, one can get the control itself as <<this>> by simply doing "...formatter=myFunction..." in XML
        // instead of "...formatter=.formatter.myFunction..."
        // with typescript, it does not work like this as that "special" formatter function seems not to be recognized

        // we therefore have to do this workaround, which is not very elegant

		// this still is a disgusting piece of code; todo find some elegang solution
        // @ts-ignore
        let oAvatar = this as Avatar;
        let oListItem = oAvatar.getParent() as ListItem;
        let oTable = oListItem.getParent() as Table;
        let oDynamicPage = oTable.getParent() as DynamicPage;
        let oView = oDynamicPage.getParent() as View;
        let oMasterController = oView.getController() as Master;
		var fn_open = oMasterController.onHoverImage;
		var fn_close = oMasterController.onHoverAwayFromImage;
		oAvatar.addEventDelegate({
			onmouseover: fn_open.bind(oMasterController, oAvatar),
			onmouseout: fn_close.bind(oMasterController, oAvatar)
		});
}