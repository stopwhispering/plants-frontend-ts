import Control from "sap/ui/core/Control";
import RenderManager from "sap/ui/core/RenderManager";

/**
 * @namespace plants.ui.custom.map
 */
export default class LeafletMap extends Control {


	private map: any;

	// metadata section defines the API of the control (properties, events, aggregations; automatically
	// creates convenience functions)
	static readonly metadata: object = {
		// library: 'custom.map',
		properties: {
			"width": {
				type: 'sap.ui.core.CSSSize',
				defaultValue: '800px'
			},
			"height": {
				type: 'sap.ui.core.CSSSize',
				defaultValue: '500px'
			},
			"geoJsonHighlights": {
				type: 'string[]'
			},
			"highlightColor": {
				type: 'string',
				defaultValue: '#ff7800'
			},
			"permanentTooltips": {
				type: 'boolean',
				defaultValue: true
			},
			"drawOpenStreetMap": {
				type: 'boolean',
				defaultValue: true
			},
			"drawGeoJsonMap": {
				type: 'boolean',
				defaultValue: false
			},
			"defaultZoomLevel": {
				type: 'int',
				defaultVlaue: 4
			},
			"autoZoom": {
				type: 'boolean',
				defaultValue: true
			},
			"autoPanToSelectedAreas": {
				type: 'boolean',
				defaultValue: true
			},
			"geoJsonUrl": {
				type: 'string',
				defaultValue: "./custom/map/level3.geojson"  // n.a. in init()
			},
			"geoJsonPropertyKey": { //properties key in geojson file to identify highlighting areas
				type: 'string',
				defaultValue: "LEVEL3_COD"
			},
			"templateUrl": {
				type: 'string',
				defaultValue: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			},
			"attribution": {
				type: 'string',
				defaultValue: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}
		}
	};


	// public constructor(id: string, settings: object) {
	// 	console.log('running constructor...')
	// 	super(id, settings);
	// 	// Control.prototype.constructor.call(this, id, settings);
	// }

	public onAfterRendering(): void {
		// initialize blank map
		this.map = L.map('map').setView([51.505, -0.09], this.getDefaultZoomLevel()); //pos, zoom-level;  store globally (there is probably a better way...)


		
		// optionally draw openstreetmap map of the world, 
		// optionally enhanced with mapbox (requiring token)
		if (this.getDrawOpenStreetMap()) {
			this._drawGeoOpenStreetMaps();
		}

		console.log('running onAfterRendering...')

		this._initTdwg();
	}

	public init() {
        // note: xml attributes not yet available, incl. geoJsonUrl
		// load geojson data, optionally draw full map
		// this._initTdwg();
	}

	private _initTdwg() {
		console.log('running _initTdwg...')
		// get Biodiversity Information Standards borders (level 3)
		// see https://en.wikipedia.org/wiki/List_of_codes_used_in_the_World_Geographical_Scheme_for_Recording_Plant_Distributions
		const sUrl = this.getGeoJsonUrl();
		$.ajax({
			url: sUrl,
			dataType: 'json',
			context: this,
			complete(data) {
				if (!data.responseJSON)
					throw new Error('Could not load geojson data from ' + sUrl);
				this.geoJsonData = data.responseJSON;
				if (this.getDrawGeoJsonMap()) {
					this.setDrawGeoJsonMap(this.getDrawGeoJsonMap());
				}
				if (this.getGeoJsonHighlights()) {
					//first binding
					this.setGeoJsonHighlights(this.getGeoJsonHighlights());
				}
			}
		});
	}

	public setDrawGeoJsonMap(bDrawGeoJsonMap) {
		console.log('running setDrawGeoJsonMap...')
		this.setProperty('drawGeoJsonMap', bDrawGeoJsonMap);
		if (this.geoJsonData) {
			this._drawGeoJson(bDrawGeoJsonMap);
		}
	}

	public setGeoJsonHighlights(aGeoJsonHighlights) {
		console.log('running setGeoJsonHighlights...')
		//we need this setter method as otherwise upon upbdate bindings nothing happens

		//we need to set this manually as we are overwriting the default setter method
		this.setProperty('geoJsonHighlights', aGeoJsonHighlights);

		//used as event handler when updating binding after initialization
		//called directly at first call
		if (this.geoJsonData) {
			this._resetGeoJsonLayers();
			this.highlightAreas(aGeoJsonHighlights, this.getPermanentTooltips);
		}
	}


	private _drawGeoOpenStreetMaps() {
		console.log('running _drawGeoOpenStreetMaps...')
		L.tileLayer(this.getTemplateUrl(), {
			maxZoom: 18,
			attribution: this.getAttribution()
		}).addTo(this.map);

	}

	private _drawGeoJson() {
		console.log('running _drawGeoJson...')
		var myStyle = {
			"color": "#925522", //color of border
			"weight": 1, //thickness of border
			"opacity": 0.65, //opacity of border
			"fill": true, //fill area 
			"fillColor": "#ffffef", //default: border color
			"fillOpacity": 1.0
		};

		if (this.oGeoJson) {
			this.oGeoJson.removeFrom(this.map);
		}
		this.oGeoJson = L.geoJSON(this.geoJsonData, {
			style: myStyle
		}).addTo(this.map);
	}

	highlightAreas(aAreas, bPermanentTooltips) {
		console.log('running highlightAreas...')
		if (!aAreas || !aAreas.length) {
			return;
		}
		var myStyle = {
			"color": this.getHighlightColor(), //color of border
			"weight": 1, //thickness of border
			"opacity": 0.65, //opacity of border
			"fill": true, //fill area 
			// "fillColor": //default: border color
			"fillOpacity": 0.2
		};

		var sPropertyKey = this.getGeoJsonPropertyKey();
		var aAreaGeoJson = this.geoJsonData.features.filter(function (element) {
			return aAreas.includes(element.properties[sPropertyKey]);
		});
		if (!aAreaGeoJson.length) {
			return;
		}

		aAreaGeoJson.forEach(function (oAreaGeoJson) {
			L.geoJSON(oAreaGeoJson, {
				style: myStyle
			})
				.bindTooltip(oAreaGeoJson.properties.LEVEL3_NAM + ' (' + oAreaGeoJson.properties[this.getGeoJsonPropertyKey()] + ')', {
					permanent: bPermanentTooltips,
					offset: [0, 0]
				})
				.addTo(this.map);
		}, this);

		this._panToCenterAndSetZoom();
	}

	private _getGeoJsonLayers(bIncludeTooltips: boolean) {
		console.log('rnuning getGeoJsonLayers');
		var aLayerIds = Object.keys(this.map._layers);
		var aGeoJsonLayers = [];
		aLayerIds.forEach(function (iLayerId) {
			if (this.map._layers[iLayerId].feature) {
				aGeoJsonLayers.push(this.map._layers[iLayerId]);
			} else if (bIncludeTooltips && this.map._layers[iLayerId]._tooltip) {
				aGeoJsonLayers.push(this.map._layers[iLayerId]);
			}
		}, this);
		return aGeoJsonLayers;
	}

	private _resetGeoJsonLayers() {
		console.log('running _resetGeoJsonLayers');
		var aGeoJsonLayers = this._getGeoJsonLayers(true);
		for (var i = 0; i < aGeoJsonLayers.length; i++) {
			aGeoJsonLayers[i].remove();
		}
	}

	private _getMinOrMax(aMinMax, key, sign) {
		console.log('running _getMinOrMax');
		if (sign === 'min') {
			var oMin = aMinMax.reduce(function (p, v) {
				return (p[key] < v[key] ? p : v);
			});
			return oMin[key];
		} else if (sign === 'max') {
			var oMax = aMinMax.reduce(function (p, v) {
				return (p[key] > v[key] ? p : v);
			});
			return oMax[key];
		}
	}

	private _panToCenterAndSetZoom() {
		console.log('running _panToCenterAndSetZoom');

		var aGeoJsonLayers = this._getGeoJsonLayers(false);
		if (!aGeoJsonLayers) {
			return;
		}

		if (this.getAutoPanToSelectedAreas()) {
			// get min/max among all polygons
			var aMinMax = [];
			for (var i = 0; i < aGeoJsonLayers.length; i++) {
				//convert
				var aFlattened = aGeoJsonLayers[i]._latlngs.flat(2);
				for (var j = 0; j < aFlattened.length; j++) {
					aFlattened[j] = [aFlattened[j].lng, aFlattened[j].lat];
				}
				var aTransposed = this._transpose(aFlattened);
				aMinMax.push(this._getMinMaxOfPolygon(aTransposed));
			}
			// total min/max on x and y axis
			var min_x = this._getMinOrMax(aMinMax, 'min_x', 'min');
			var min_y = this._getMinOrMax(aMinMax, 'min_y', 'min');
			var max_x = this._getMinOrMax(aMinMax, 'max_x', 'max');
			var max_y = this._getMinOrMax(aMinMax, 'max_y', 'max');

			// pan to the center
			// to do in some spare time: consider that the earth is round
			var x_avg = (min_x + max_x) / 2;
			var y_avg = (min_y + max_y) / 2;

			if (this.getAutoZoom()) {
				// make sure zoom level hase everything in visible area
				var iSpanX = max_x - min_x;
				var iSpanY = max_y - min_y;
				var iCurrentSpanX = this.map.getBounds().getEast() - this.map.getBounds().getWest();
				var iCurrentSpanY = this.map.getBounds().getNorth() - this.map.getBounds().getSouth();

				if (iSpanX <= iCurrentSpanX && iSpanY <= iCurrentSpanY) {
					// default zoom level if that fits
					this.map.setView([y_avg, x_avg], this.getDefaultZoomLevel());
				} else {
					// zoom up if required
					var mLatLngCoveringAll = [
						[min_y, min_x],
						[max_y, max_x]
					];
					this.map.fitBounds(mLatLngCoveringAll);
				}
			} else {
				this.map.panTo({
					lng: x_avg,
					lat: y_avg
				});
			}
		}
	}

	// LeafletMap.prototype._getCenterOfPolygon = function(oFeature) {
	// 	var aFlattened = oFeature.geometry.coordinates.flat(2);
	// 	var aTransposed = this._transpose(aFlattened);
	// 	var mMinMax = this._getMinMaxOfPolygon(aTransposed);
	// 	return {
	// 		x_center: (mMinMax.min_x + mMinMax.max_x) / 2,
	// 		y_center: (mMinMax.min_y + mMinMax.max_y) / 2
	// 	};
	// };

	private _getMinMaxOfPolygon(aLatLng) {
		console.log('running _getMinMaxOfPolygon');

		var arrayMin = function (arr) {
			return arr.reduce(function (p, v) {
				return (p < v ? p : v);
			});
		};

		var arrayMax = function (arr) {
			return arr.reduce(function (p, v) {
				return (p > v ? p : v);
			});
		};

		var mMinMax = {
			min_x: arrayMin(aLatLng[0]),
			max_x: arrayMax(aLatLng[0]),
			min_y: arrayMin(aLatLng[1]),
			max_y: arrayMax(aLatLng[1])
		};

		// console.log('X: '+min_x+' to '+max_x+' y: '+min_y+' to '+max_y);
		return mMinMax;
	}

	private _transpose(matrix) {
		console.log('running _transpose');
		// transpose 2-d array
		// no map functions in web ide
		var rows = matrix.length,
			cols = matrix[0].length;
		var grid = [];
		for (var j = 0; j < cols; j++) {
			grid[j] = Array(rows);
		}
		for (var i = 0; i < rows; i++) {
			for (j = 0; j < cols; j++) {
				grid[j][i] = matrix[i][j];
			}
		}
		return grid;
	}

	static renderer = function (oRm: RenderManager, oControl: LeafletMap) {
		// oRm is the Ui5 Render Manager
		oRm.write('<div ');
		oRm.write('id="map"'); // set it hardcoded
		oRm.writeControlData(oControl);
		oRm.addStyle('height', oControl.getHeight());
		oRm.addStyle('width', oControl.getWidth());
		oRm.writeStyles();
		oRm.write('>');
		oRm.write('</div>');
	};

}
	// 	);

	// 	return LeafletMap;
	// });

