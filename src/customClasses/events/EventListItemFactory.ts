import Grid from "sap/ui/layout/Grid"
import GridData from "sap/ui/layout/GridData"
import CustomListItem from "sap/m/CustomListItem"
import { FBEvent } from "plants/ui/definitions/Events";
import Context from "sap/ui/model/Context";
import VBox from "sap/m/VBox";
import GridListItem from "sap/f/GridListItem";
import GridList from "sap/f/GridList";
import View from "sap/ui/core/mvc/View";

/**
 * @namespace plants.ui.customClasses.events
 */
export default function eventsListFactory(oView: View, sId: string, oBindingContext: Context) {
	var sContextPath = oBindingContext.getPath();
	var oEvent = <FBEvent>oBindingContext.getObject();
	var oListItem = new CustomListItem({});
	oListItem.addStyleClass('sapUiTinyMarginBottom');
	var oGrid = new Grid({
		defaultSpan: "XL3 L3 M6 S12"
	});
	oListItem.addContent(oGrid);

	var oFragmentHeader = <VBox>oView.byId("eventHeader").clone(sId);
	oGrid.addContent(oFragmentHeader);

	if (!!oEvent.observation) {
		var oContainerObservation = <VBox>oView.byId("eventObservation").clone(sId);
		oGrid.addContent(oContainerObservation);
	}

	if (!!oEvent.pot) {
		var oContainerPot = <VBox>oView.byId("eventPot").clone(sId);
		oGrid.addContent(oContainerPot);
	}

	if (!!oEvent.soil) {
		var oContainerSoil = oView.byId("eventSoil").clone(sId);
		oGrid.addContent(<VBox>oContainerSoil);
	}

	// we want the images item to get the rest of the row or the whole next row if current row is almost full 
	// calculate number of cols in grid layout for images container in screen sizes xl/l
	// todo: switch from grid layout to the new (with 1.60) gridlist, where the following is probably
	// not required
	var iCols = (oGrid.getContent().length * 3) - 1;
	if ((12 - iCols) < 3) {
		var sColsImageContainerL = "XL12 L12";
	} else {
		sColsImageContainerL = "XL" + (12 - iCols) + " L" + (12 - iCols);
	}
	var sColsContainer = sColsImageContainerL + " M6 S12";

	var oContainerOneImage = <GridListItem>oView.byId("eventImageListItem").clone(sId);

	// add items aggregation binding
	var oContainerImages = <GridList>oView.byId("eventImageContainer").clone(sId);
	oContainerImages.bindAggregation('items',
		{
			path: "events>" + sContextPath + "/images",
			template: oContainerOneImage,
			templateShareable: false
		});

	// add layoutData aggregation binding to set number of columns in outer grid
	oContainerImages.setLayoutData(new GridData({ span: sColsContainer }));
	oGrid.addContent(oContainerImages);

	return oListItem;
}
// }