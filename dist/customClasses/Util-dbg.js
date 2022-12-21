sap.ui.define(["sap/m/BusyDialog", "plants/ui/Constants", "sap/m/MessageToast"], function (BusyDialog, __Constants, MessageToast) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const Constants = _interopRequireDefault(__Constants);
  /**
   * @namespace plants.ui.customClasses
   */
  function parse_resource_from_url(sUrl) {
    var aItems = sUrl.split('/');
    var iIndex = aItems.indexOf('backend');
    var aResource = aItems.slice(iIndex + 1);
    return aResource.join('/');
  }
  function getServiceUrl(sUrl) {
    return Constants.base_url + sUrl;
  }
  function getImageUrl(filename, size_type, width, height) {
    if (!filename) {
      console.log('Bad Filename');
      return undefined;
    }
    if (!size_type) {
      var path = 'photo?filename=' + filename;
    } else if (size_type !== 'rem' && size_type != 'px') {
      console.log('Bad size type: ' + size_type);
      return undefined;
    } else {
      var width_px = size_type === 'px' ? width : Math.round(width * 16);
      var height_px = size_type === 'px' ? height : Math.round(height * 16);
      path = 'photo?filename=' + filename + '&width=' + width_px + '&height=' + height_px;
    }
    return this.getServiceUrl(path);
  }
  function getClonedObject(oOriginal) {
    // create a clone, not a reference
    // there's no better way in js...
    return JSON.parse(JSON.stringify(oOriginal));
  }
  function startBusyDialog(title, text) {
    var oBusyDialog4 = sap.ui.getCore().byId("busy4") ? sap.ui.getCore().byId("busy4") : new BusyDialog('busy4', {
      text: text,
      title: title
      // busyIndicatorDelay: 500
    });
    // busyDialog4!.setTitle(title);
    // busyDialog4!.setText(text);
    //@ts-ignore
    oBusyDialog4.open();
  }
  function stopBusyDialog() {
    var oBusyDialog4 = sap.ui.getCore().byId("busy4");
    if (oBusyDialog4) {
      oBusyDialog4.close();
    }
  }
  function getToday() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    return today;
  }
  function assertCorrectDate(sdate) {
    // validate date via regex (must match "YYYY-MM-DD")
    if (!/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(sdate)) {
      MessageToast.show('Invalid date. Date must have Format "YYYY-MM-DD"');
      throw new Error('Invalid date. Date must have Format "YYYY-MM-DD"');
    }
  }
  function formatDate(date) {
    //var today = new Date();
    var dd = date.getDate().toString();
    var mm = (date.getMonth() + 1).toString(); //January is 0!

    var yyyy = date.getFullYear();
    if (Number(dd) < 10) {
      dd = '0' + dd;
    }
    if (Number(mm) < 10) {
      mm = '0' + mm;
    }
    var date_str = yyyy + '-' + mm + '-' + dd;
    return date_str;
  }
  function getDaysFromToday(sDate) {
    // input format: yyyy-mm-dd (as string)
    var dDate = Date.parse(sDate);
    var dToday = new Date();
    var iDay = 1000 * 60 * 60 * 24;
    var dDiff = dToday - dDate;
    return Math.round(dDiff / iDay);
  }
  function isObject(val) {
    if (val === null) {
      return false;
    }
    return typeof val === 'function' || typeof val === 'object';
  }
  function objectsEqualManually(dict1, dict2) {
    var dict1_copy = this.getClonedObject(dict1);
    var dict2_copy = this.getClonedObject(dict2);

    // array
    // loop at array objects and check if equal
    if (Array.isArray(dict1_copy) && Array.isArray(dict2_copy)) {
      dict1_copy.sort();
      dict2_copy.sort();
      if (dict1_copy.length !== dict2_copy.length) {
        return false;
      }
      for (var i = 0; i < dict1_copy.length; i++) {
        if (!this.objectsEqualManually.call(this, dict1_copy[i], dict2_copy[i])) {
          return false;
        }
      }
      return true;
    }

    // objects
    // easy case: differing properties
    var keys1 = Object.keys(dict1_copy);
    keys1.sort();
    var keys2 = Object.keys(dict2_copy);
    keys2.sort();
    if (JSON.stringify(keys1) !== JSON.stringify(keys2)) {
      return false;
    }

    // compare object property values
    for (var j = 0; j < keys1.length; j++) {
      var key = keys1[j];
      if (this.isObject(dict1_copy[key]) && this.isObject(dict2_copy[key])) {
        if (!this.objectsEqualManually.call(this, dict1_copy[key], dict2_copy[key])) {
          return false;
        }
      } else if (this.isObject(dict1_copy[key]) || this.isObject(dict2_copy[key])) {
        return false;
      } else {
        // primitives
        if (dict1_copy[key] !== dict2_copy[key]) {
          return false;
        }
      }
    }
    return true;
  }
  function dictsAreEqual(dict1, dict2) {
    return JSON.stringify(dict1) === JSON.stringify(dict2);
  }
  function isDictKeyInArray(dict, aDicts) {
    var oFound = aDicts.find(function (element) {
      return element.key === dict.key;
    });
    if (!!oFound) {
      return true;
    } else {
      return false;
    }
  }
  function arraysAreEqual(array1, array2) {
    return JSON.stringify(array1) === JSON.stringify(array2);
  }
  function romanize(num) {
    if (isNaN(num)) return NaN;
    var digits = String(+num).split(""),
      key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM", "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC", "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
      roman = "",
      i = 3;
    while (i--) roman = (key[+digits.pop() + i * 10] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
  }
  function arabize(romanNum) {
    const roman = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000
    };
    let num = 0;
    for (let i = 0; i < romanNum.length; i++) {
      const currArab = romanNum[i];
      const curr = roman[currArab];
      const next = roman[romanNum[i + 1]];
      curr < next ? num -= curr : num += curr;
    }
    return num;
  }
  var __exports = {
    __esModule: true
  };
  __exports.parse_resource_from_url = parse_resource_from_url;
  __exports.getServiceUrl = getServiceUrl;
  __exports.getImageUrl = getImageUrl;
  __exports.getClonedObject = getClonedObject;
  __exports.startBusyDialog = startBusyDialog;
  __exports.stopBusyDialog = stopBusyDialog;
  __exports.getToday = getToday;
  __exports.assertCorrectDate = assertCorrectDate;
  __exports.formatDate = formatDate;
  __exports.getDaysFromToday = getDaysFromToday;
  __exports.isObject = isObject;
  __exports.objectsEqualManually = objectsEqualManually;
  __exports.dictsAreEqual = dictsAreEqual;
  __exports.isDictKeyInArray = isDictKeyInArray;
  __exports.arraysAreEqual = arraysAreEqual;
  __exports.romanize = romanize;
  __exports.arabize = arabize;
  return __exports;
});
//# sourceMappingURL=Util.js.map