sap.ui.define(["sap/m/InputBase","sap/m/Input","sap/ui/core/IconPool","sap/m/InputBaseRenderer"],function(t,e,n){"use strict";return e.extend("plants.ui.control.InputWithIcon",{metadata:{},init(){e.prototype.init.apply(this,arguments);var t=this.addEndIcon({id:this.getId()+"-IconBtn",src:n.getIconURI("cancel"),noTabStop:true,tooltip:"Set unknown",press:[this.onEndButtonPress,this]})},onBeforeRendering(){e.prototype.onBeforeRendering.apply(this,arguments);var t=this.getAggregation("_endIcon");var n=this.getEditable();if(Array.isArray(t)){t.map(t=>t.setProperty("visible",n,true))}},onEndButtonPress(){if(this.getEnabled()&&this.getEditable()){this.setValue("-")}},renderer:"sap.m.InputRenderer"})});