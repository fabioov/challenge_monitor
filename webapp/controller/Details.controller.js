sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "br/com/challenge/monitor/challengemonitor/utils/formatter",
    "sap/ui/Device",
    "sap/ushell/services/CrossApplicationNavigation"
], function (
    Controller,
    Filter,
    FilterOperator,
    JSONModel,
    formatter,
    Device
) {
    "use strict";

    return Controller.extend("br.com.challenge.monitor.challengemonitor.controller.Details",
        {
            Formatter: formatter,
            onInit: function () {
                this.getOwnerComponent().getRouter().getRoute("Details").attachPatternMatched(this._onBindingDetails, this);
                this.getView().byId("itemsTable").attachEventOnce("updateFinished", this._restoreAppState, this);


            },

            _storeAppState: function (keys) {
                let oDetailsStateData = {
                    shippingRequestId: keys.SHIPPING_REQUEST_ID,
                    sDeliveryNr: keys.DELIVERY_NR,
                    sDeliveryItemNr: keys.DELIVERY_ITEM_NR,
                    sMaterialNr: keys.MATERIAL_NR,
                    sStatus: keys.STATUS
                };
                jQuery.sap.storage(jQuery.sap.storage.Type.session).put("detailsState", oDetailsStateData);
            },

            _restoreAppState: function () {
                let oDetailsStateData = jQuery.sap.storage(jQuery.sap.storage.Type.session).get("detailsState");
                if (oDetailsStateData) {
                    this._applyAppState(oDetailsStateData);
                }
            },

            _applyAppState: function (oData) {
                if (!oData || Object.keys(oData).length === 0) {
                    return;
                }

                let oList = this.getView().byId("itemsTable");
                let aItems = oList.getItems();
                aItems.forEach((oItem) => {
                    let oBindingContext = oItem.getBindingContext("Details");
                    let oItemData = oBindingContext.getObject();
                    if (oItemData.SHIPPING_REQUEST_ID === oData.shippingRequestId &&
                        oItemData.DELIVERY_NR === oData.sDeliveryNr &&
                        oItemData.DELIVERY_ITEM_NR === oData.sDeliveryItemNr &&
                        oItemData.MATERIAL_NR === oData.sMaterialNr
                    ) {
                        oList.setSelectedItem(oItem);
                        oList.scrollToIndex(oList.indexOfItem(oItem));
                        let bReplace = !Device.system.phone;
                        this.getModel("appView").setProperty("/layout", "ThreeColumnsMidExpanded");
                        this.getRouter().navTo(
                            "PickTaskDetail",
                            {
                                SHIPPING_REQUEST_ID: oData.shippingRequestId,
                                DELIVERY_NR: oData.sDeliveryNr,
                                DELIVERY_ITEM_NR: oData.sDeliveryItemNr,
                                MATERIAL_NR: oData.sMaterialNr,
                                STATUS: oData.sStatus
                            },
                            bReplace
                        );

                    }

                })

            },

            // onExit: function () {
            //     let oDetailsStateData = jQuery.sap.storage(jQuery.sap.storage.Type.session).get("detailsState");
            //     this._storeAppState(oDetailsStateData);
            // },

            _onBindingDetails: function (oEvent) {

                // Get the SHIPPING_REQUEST_ID from the event parameters
                let shippingRequestId = `0000000${oEvent.getParameter("arguments").SHIPPING_REQUEST_ID}`;

                // Get the view and the OData model
                let oView = this.getView();
                let oModel = oView.getModel();

                // Define the filter for the SHIPPING_REQUEST_ID
                let aFilters = [new Filter("SHIPPING_REQUEST_ID", FilterOperator.EQ, shippingRequestId)];

                // Read data from the first entity set (ZRFSFBPCDS0002)
                let sElement = "/ZRFSFBPCDS0002";
                oModel.read(sElement, {
                    filters: aFilters,
                    success: function (oData) {
                        if (oData.results.length > 0) {
                            let oItemsModel = new JSONModel();
                            oItemsModel.setData(oData);
                            oView.setModel(oItemsModel, "Details");
                        } else {
                        }
                    },
                    error: function (oError) {
                    }
                });

                // Read data from the second entity set (ZRFSFBPCDS0001)
                let sPath = `/ZRFSFBPCDS0001('${shippingRequestId}')`;
                oModel.read(sPath, {
                    success: function (oData) {
                        console.log("Data Header Read:", oData);
                        let oJSONModel = new JSONModel(oData);
                        oView.setModel(oJSONModel, "Header");
                    },
                    error: function (oError) {
                    }
                });

            },

            onCloseDetailView: function () {
                // Get the owner component
                var oComponent = this.getOwnerComponent();

                // Get the List view by its ID
                var oListView = oComponent.byId("list");

                if (oListView) {
                    // Find the table in the other view by its ID
                    var oTable = oListView.byId("shippingsTable");

                    if (oTable) {
                        // Deselect any selected rows in the table
                        oTable.removeSelections();
                    }
                }
                this.getModel("appView").setProperty("/layout", "OneColumn");
                this.getRouter().navTo("List");
                this._storeAppState({});
            },

            getModel: function (sName) {
                return this.getView().getModel(sName);
            },

            getRouter: function () {
                return this.getOwnerComponent().getRouter();
            },

            onSelectedItem: function (oEvent) {
                let bReplace = !Device.system.phone;
                let oSelectedItem = oEvent.getParameter("listItem");
                let oContext = oSelectedItem.getBindingContext("Details");
                let sShippingRequestId = oContext.getProperty("SHIPPING_REQUEST_ID");
                let sDeliveryNr = oContext.getProperty("DELIVERY_NR");
                let sDeliveryItemNr = oContext.getProperty("DELIVERY_ITEM_NR");
                let sMaterialNr = oContext.getProperty("MATERIAL_NR");
                let oModel = this.getModel("Header");
                let sStatus = oModel.getData().Status;

                let keys = {
                    SHIPPING_REQUEST_ID: sShippingRequestId,
                    DELIVERY_NR: sDeliveryNr,
                    DELIVERY_ITEM_NR: sDeliveryItemNr,
                    MATERIAL_NR: sMaterialNr,
                    STATUS: sStatus
                }

                this._storeAppState(keys);

                this.getModel("appView").setProperty("/layout", "ThreeColumnsMidExpanded");
                this.getRouter().navTo(
                    "PickTaskDetail",
                    {
                        SHIPPING_REQUEST_ID: sShippingRequestId,
                        DELIVERY_NR: sDeliveryNr,
                        DELIVERY_ITEM_NR: sDeliveryItemNr,
                        MATERIAL_NR: sMaterialNr,
                        STATUS: sStatus
                    },
                    bReplace
                );
            }
        });
});