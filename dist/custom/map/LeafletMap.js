sap.ui.define(["jquery.sap.global","sap/ui/core/Control"],function(t,e){"use strict";var o=e.extend("custom.map.LeafletMap",{metadata:{library:"custom.map",properties:{width:{type:"sap.ui.core.CSSSize",defaultValue:"800px"},height:{type:"sap.ui.core.CSSSize",defaultValue:"500px"},geoJsonHighlights:{type:"string[]"},highlightColor:{type:"string",defaultValue:"#ff7800"},permanentTooltips:{type:"boolean",defaultValue:true},drawOpenStreetMap:{type:"boolean",defaultValue:true},drawGeoJsonMap:{type:"boolean",defaultValue:false},defaultZoomLevel:{type:"int",defaultVlaue:4},autoZoom:{type:"boolean",defaultValue:true},autoPanToSelectedAreas:{type:"boolean",defaultValue:true},geoJsonUrl:{type:"string",defaultValue:"./custom/map/level3.geojson"},geoJsonPropertyKey:{type:"string",defaultValue:"LEVEL3_COD"},templateUrl:{type:"string",defaultValue:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"},attribution:{type:"string",defaultValue:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}}}});o.prototype.init=function(){this._initTdwg()};o.prototype.onAfterRendering=function(){this.map=L.map("map").setView([51.505,-.09],this.getDefaultZoomLevel());if(this.getDrawOpenStreetMap()){this._drawGeoOpenStreetMaps()}};o.prototype._initTdwg=function(){$.ajax({url:this.getGeoJsonUrl(),dataType:"json",context:this,complete(t){this.geoJsonData=t.responseJSON;if(this.getDrawGeoJsonMap()){this.setDrawGeoJsonMap(this.getDrawGeoJsonMap())}if(this.getGeoJsonHighlights()){this.setGeoJsonHighlights(this.getGeoJsonHighlights())}}})};o.prototype.setDrawGeoJsonMap=function(t){this.setProperty("drawGeoJsonMap",t);if(this.geoJsonData){this._drawGeoJson(t)}};o.prototype.setGeoJsonHighlights=function(t){this.setProperty("geoJsonHighlights",t);if(this.geoJsonData){this._resetGeoJsonLayers();this.highlightAreas(t,this.getPermanentTooltips)}};o.prototype._drawGeoOpenStreetMaps=function(){L.tileLayer(this.getTemplateUrl(),{maxZoom:18,attribution:this.getAttribution()}).addTo(this.map)};o.prototype._drawGeoJson=function(){var t={color:"#925522",weight:1,opacity:.65,fill:true,fillColor:"#ffffef",fillOpacity:1};if(this.oGeoJson){this.oGeoJson.removeFrom(this.map)}this.oGeoJson=L.geoJSON(this.geoJsonData,{style:t}).addTo(this.map)};o.prototype.highlightAreas=function(t,e){if(!t||!t.length){return}var o={color:this.getHighlightColor(),weight:1,opacity:.65,fill:true,fillOpacity:.2};var r=this.getGeoJsonPropertyKey();var a=this.geoJsonData.features.filter(function(e){return t.includes(e.properties[r])});if(!a.length){return}a.forEach(function(t){L.geoJSON(t,{style:o}).bindTooltip(t.properties.LEVEL3_NAM+" ("+t.properties[this.getGeoJsonPropertyKey()]+")",{permanent:e,offset:[0,0]}).addTo(this.map)},this);this._panToCenterAndSetZoom()};o.prototype._getGeoJsonLayers=function(t){var e=Object.keys(this.map._layers);var o=[];e.forEach(function(e){if(this.map._layers[e].feature){o.push(this.map._layers[e])}else if(t&&this.map._layers[e]._tooltip){o.push(this.map._layers[e])}},this);return o};o.prototype._resetGeoJsonLayers=function(){var t=this._getGeoJsonLayers(true);for(var e=0;e<t.length;e++){t[e].remove()}};o.prototype._getMinOrMax=function(t,e,o){if(o==="min"){var r=t.reduce(function(t,o){return t[e]<o[e]?t:o});return r[e]}else if(o==="max"){var a=t.reduce(function(t,o){return t[e]>o[e]?t:o});return a[e]}};o.prototype._panToCenterAndSetZoom=function(){var t=this._getGeoJsonLayers(false);if(!t){return}if(this.getAutoPanToSelectedAreas()){var e=[];for(var o=0;o<t.length;o++){var r=t[o]._latlngs.flat(2);for(var a=0;a<r.length;a++){r[a]=[r[a].lng,r[a].lat]}var i=this._transpose(r);e.push(this._getMinMaxOfPolygon(i))}var s=this._getMinOrMax(e,"min_x","min");var n=this._getMinOrMax(e,"min_y","min");var p=this._getMinOrMax(e,"max_x","max");var l=this._getMinOrMax(e,"max_y","max");var u=(s+p)/2;var h=(n+l)/2;if(this.getAutoZoom()){var g=p-s;var f=l-n;var y=this.map.getBounds().getEast()-this.map.getBounds().getWest();var m=this.map.getBounds().getNorth()-this.map.getBounds().getSouth();if(g<=y&&f<=m){this.map.setView([h,u],this.getDefaultZoomLevel())}else{var c=[[n,s],[l,p]];this.map.fitBounds(c)}}else{this.map.panTo({lng:u,lat:h})}}};o.prototype._getMinMaxOfPolygon=function(t){var e=function(t){return t.reduce(function(t,e){return t<e?t:e})};var o=function(t){return t.reduce(function(t,e){return t>e?t:e})};var r={min_x:e(t[0]),max_x:o(t[0]),min_y:e(t[1]),max_y:o(t[1])};return r};o.prototype._transpose=function(t){var e=t.length,o=t[0].length;var r=[];for(var a=0;a<o;a++){r[a]=Array(e)}for(var i=0;i<e;i++){for(a=0;a<o;a++){r[a][i]=t[i][a]}}return r};return o},true);