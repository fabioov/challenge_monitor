sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel"
    ],
    function(BaseController, JSONModel) {
      "use strict";
  
      return BaseController.extend("br.com.challenge.monitor.challengemonitor.controller.App", {
        onInit() {
          let oViewModel = new JSONModel({
            busy: true,
            delay: 0,
            app: "OneColumn",
            layout: "OneColumn",
            previousApp: "",
            actionButtonsInfo: {
              midColumn: {
                fullScreen: false,
              },
            },
          });
          this.getView().setModel(oViewModel, "appView");
        }
      });
    }
  );
  