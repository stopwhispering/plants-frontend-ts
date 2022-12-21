sap.ui.define([], function () {
  /**
   * @namespace plants.ui.model
   */
  function addMouseOverDelegate(_) {
    // with javascript ui5, one can get the control itself as <<this>> by simply doing "...formatter=myFunction..." in XML
    // instead of "...formatter=.formatter.myFunction..."
    // with typescript, it does not work like this as that "special" formatter function seems not to be recognized

    // we therefore have to do this workaround, which is not very elegant

    // this still is a disgusting piece of code; todo find some elegang solution
    // @ts-ignore
    let oAvatar = this;
    let oListItem = oAvatar.getParent();
    let oTable = oListItem.getParent();
    let oDynamicPage = oTable.getParent();
    let oView = oDynamicPage.getParent();
    let oMasterController = oView.getController();
    var fn_open = oMasterController.onHoverImage;
    var fn_close = oMasterController.onHoverAwayFromImage;
    oAvatar.addEventDelegate({
      onmouseover: fn_open.bind(oMasterController, oAvatar),
      onmouseout: fn_close.bind(oMasterController, oAvatar)
    });
  }
  return addMouseOverDelegate;
});
//# sourceMappingURL=addMouseOverDelegate.js.map