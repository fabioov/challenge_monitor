sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "br/com/challenge/monitor/challengemonitor/model/models",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, Device, models, JSONModel) {
    "use strict";

    return UIComponent.extend("br.com.challenge.monitor.challengemonitor.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // Enable routing
            this.getRouter().initialize();

            // Set the device model
            this.setModel(models.createDeviceModel(), "device");

            // Initialize other models
            let popMsgModel = new JSONModel({
                "messageLength": 0,
                "type": "Default",
                "visible": false,
            });
            this.setModel(popMsgModel, "popoverModel");

            let buttonActionModel = new JSONModel({
                "action": ""
            });
            this.setModel(buttonActionModel, "buttonActionModel");

            let detailModel = new JSONModel({
                "showListFooter": true,
                "showDetailFooter": false,
                "appState": "",
            });
            this.setModel(detailModel, "detailModel");

        }
    });
});