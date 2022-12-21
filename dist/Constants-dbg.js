sap.ui.define(["sap/ui/base/ManagedObject"], function (ManagedObject) {
  /**
   * @namespace plants.ui
   */
  const Constants = ManagedObject.extend("plants.ui.Constants", {});
  Constants.base_url = (() => {
    // we want to make this work both in dev environment and in production
    if (window.location.hostname === "localhost" && window.location.port === "8080") {
      // in dev environment (serving via ui5 cli as localhost:8080), we usually run the backend on localhost:5000 via pycharm
      return 'http://localhost:5000/api/';
    } else if (window.location.hostname.endsWith('localhost') && window.location.port !== "8080") {
      // in dev environment (testing dockerized backend as pollination.localhost:80), we usually run the backend on plants.localhost:80/api via traefik
      return 'http://plants.localhost/api/';
    } else {
      // in prod environment, we usually run the backend on any-nonlocal-host:80/443
      return 'https://plants.astroloba.net/api/';
    }
  })();
  return Constants;
});
//# sourceMappingURL=Constants.js.map