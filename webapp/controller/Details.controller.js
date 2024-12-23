sap.ui.define([
    "./BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "br/com/challenge/monitor/challengemonitor/utils/formatter",
    "sap/ui/Device",
    "br/com/challenge/monitor/challengemonitor/utils/MessagePopover",
    "sap/m/MessageBox",
    "sap/m/BusyDialog",
    "sap/ui/model/odata/v2/ODataModel"
], function (
    BaseController,
    Filter,
    FilterOperator,
    JSONModel,
    formatter,
    Device,
    MessagePopoverHook,
    MessageBox,
    BusyDialog,
    ODataModel
) {
    "use strict";

    return BaseController.extend("br.com.challenge.monitor.challengemonitor.controller.Details",
        {
            Formatter: formatter,
            onInit: function () {
                this.getOwnerComponent().getRouter().getRoute("Details").attachPatternMatched(this._onBindingDetails, this);
                debugger;
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
                this._onUpdateUrl(oDetailsStateData)
            },

            _restoreAppState: function () {
                // Retrieve the encoded app state string from the URL
                var oDetailModel = this.getOwnerComponent().getModel("detailModel");
                var appStateEncoded = oDetailModel.getProperty("/appState");
                debugger;

                if (appStateEncoded) {
                    var oAppStateData = this.decompressAndDecode(appStateEncoded);
                    try {

                        // Apply the application state
                        this._applyAppState(oAppStateData);

                    } catch (e) {
                        console.error("Error parsing application state data:", e);
                    }
                } else {
                    console.warn("No application state data found in the URL.");
                }
            },

            _onUpdateUrl: function (oAppStateData) {
                debugger;
                var currentUrl = window.location.href;
                var firstPartUrl = currentUrl.split('&/details/')[0];
                var oUrl = this.getAppStateFromUrl();
                const appStateEncoded = this.compressAndEncode(oAppStateData);

                var updatedUrl = '';

                if (oUrl) {
                    updatedUrl = firstPartUrl + '?appState=' + appStateEncoded;
                } else {
                    updatedUrl = window.location.href + '?appState=' + appStateEncoded;
                }

                // Replace the URL in the browser history without reloading
                window.history.replaceState({}, '', updatedUrl);
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
                        this.getModel("appView").setProperty("/layout", oData.appView.layout);
                        this.getRouter().navTo(
                            "PickTaskDetail",
                            {
                                SHIPPING_REQUEST_ID: oData.shippingRequestId,
                                DELIVERY_NR: oData.sDeliveryNr,
                                DELIVERY_ITEM_NR: oData.sDeliveryItemNr,
                                MATERIAL_NR: oData.sMaterialNr,
                                STATUS: oData.sStatus
                            },

                            { replace: bReplace }
                        );

                    }

                })

            },

            onMessagesButtonPress: function (oEvent) {
                MessagePopoverHook.onMessagesPopoverOpen(oEvent);
            },

            _onBindingDetails: function (oEvent) {
                debugger;
                // Get the SHIPPING_REQUEST_ID from the event parameters
                let shippingRequestId = `0000000${oEvent.getParameter("arguments").SHIPPING_REQUEST_ID}`;

                var oDetailModel = this.getOwnerComponent().getModel("detailModel");
                var oAppState = oDetailModel.getProperty("/appState");

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

                if (oAppState) {
                    var currentUrl = window.location.href;
                    var firstPartUrl = currentUrl.split('?appState')[0];
                    var newUrl = `${firstPartUrl}?appState=${oAppState}`;

                    window.history.replaceState({}, '', newUrl);
                }



            },

            onCloseDetailView: function () {
                let oDetailModel = this.getOwnerComponent().getModel("detailModel");
                oDetailModel.setProperty("/showListFooter", true);
                oDetailModel.setProperty("/showDetailFooter", false);
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
                var newUrl = this.getAppStateFromUrl();
                if (newUrl) {
                    var urlDecoded = this.decompressAndDecode(newUrl);
                    urlDecoded.shippingRequestId = "";
                    urlDecoded.appView.layout = "OneColumn";
                    this._onUpdateUrl(urlDecoded);

                }
                this.getModel("appView").setProperty("/layout", "OneColumn");

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

                    { replace: bReplace }
                );
            },
            onChangeStatus: function (oEvent) {
                let oModel = this.getView().getModel();
                let that = this;
                this._oBundle = this.getView().getModel("i18n").getResourceBundle();
                let detailModel = this.getView().getModel("Header");
                let shippingRequest = detailModel.getData();
                delete shippingRequest.__metadata;
                let sPath = `/ZRFSFBPCDS0001('${shippingRequest.ShippingRequestId}')`;

                let sStatus = shippingRequest.Status === "K" ? that._oBundle.getText("statusK") :
                    shippingRequest.Status === "C" ? that._oBundle.getText("statusC") :
                        that._oBundle.getText("statusX");
                if (shippingRequest.Status === "K" || shippingRequest.Status === "C" || shippingRequest.Status === "X") {
                    MessageBox.warning(that._oBundle.getText("lvStatusNotAllowedTochange", [sStatus]));
                    return;
                }

                MessageBox.confirm(that._oBundle.getText("lvConfirmChangeStatus", [shippingRequest.ShippingRequestId]),
                    function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that._oBusyDialog = new BusyDialog({
                                Text: that._oBundle.getText("lvWaiting")
                            });
                            that._oBusyDialog.open();

                            setTimeout(function () {
                                let oModelSend = new ODataModel(
                                    oModel.sServiceUrl,
                                    true
                                );
                                oModelSend.update(sPath, shippingRequest, {
                                    success: function (data, response) {
                                        if (response.statusCode === '204') {
                                            let oParams = {
                                                type: "Success",
                                                title: that._oBundle.getText("lvStatusChangedSuccessfully", [shippingRequest.ShippingRequestId])
                                            };

                                            MessagePopoverHook.onSetMessage(that.getView(), oParams);
                                            MessageBox.success(that._oBundle.getText("lvStatusChangedSuccessfully", [shippingRequest.ShippingRequestId]));
                                            that._oBusyDialog.close();

                                            that.refreshHeaderAndDetails();
                                            oBinding.refresh();
                                        }
                                    },
                                    error: function (error) {


                                        let errorResponse = JSON.parse(error.responseText);
                                        let oParams = {
                                            type: "Error",
                                            title: errorResponse.error.message.value
                                        };
                                        // Change this to a messageBox
                                        MessageBox.error(errorResponse.error.message.value, {
                                            duration: 4000,
                                            closeOnBrowserNavigation: false,
                                            animationDuration: 1000,
                                            width: "20em",
                                            my: "center bottom",
                                            at: "center bottom",
                                            of: window,
                                            autoClose: true,
                                            closeIcon: false
                                        });
                                        MessagePopoverHook.onSetMessage(that.getView(), oParams);
                                        that._oBusyDialog.close();
                                    },
                                })
                            }, 3000);
                        }
                    }
                );
            },

            onCancelShippingRequest: function () {
                let oModel = this.getView().getModel();
                this._oBundle = this.getView().getModel("i18n").getResourceBundle();

                let detailModel = this.getView().getModel("Header");
                let shippingRequest = detailModel.getData();
                delete shippingRequest.__metadata;
                let sPath = `/ZRFSFBPCDS0001('${shippingRequest.ShippingRequestId}')`;

                let that = this;

                if (shippingRequest.Status === "X") {
                    MessageBox.warning(that._oBundle.getText("lvShippingRequestAlreadyCancelled", [shippingRequest.ShippingRequestId]));
                    return;
                }

                MessageBox.confirm(this._oBundle.getText("lvConfirmCancelShippingRequest", [shippingRequest.ShippingRequestId]),
                    function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that._oBusyDialog = new BusyDialog({
                                text: that._oBundle.getText("lvWaiting")
                            });
                            that._oBusyDialog.open();

                            setTimeout(function () {
                                let oModelSend = new ODataModel(
                                    oModel.sServiceUrl,
                                    true
                                );
                                oModelSend.remove(sPath, {
                                    success: function (data, response) {
                                        if (response.statusCode === "204") {
                                            let oParams = {
                                                type: "Success",
                                                title: that._oBundle.getText("lvStatusCancelledSuccessfully", [shippingRequest.ShippingRequestId])
                                            };
                                            MessagePopoverHook.onSetMessage(that.getView(), oParams);
                                            MessageBox.success(oParams.title);

                                            that.refreshHeaderAndDetails();

                                            that._oBusyDialog.close();
                                        }
                                    },
                                    error: function (error) {
                                        let errorResponse = JSON.parse(error.responseText);
                                        let oParams = {
                                            type: "Error",
                                            title: errorResponse.error.message.value
                                        };
                                        MessageBox.error(errorResponse.error.message.value, {
                                            duration: 4000,
                                            closeOnBrowserNavigation: false,
                                            animationDuration: 1000,
                                            width: "20em",
                                            my: "center bottom",
                                            at: "center bottom",
                                            of: window,
                                            autoClose: true,
                                            closeIcon: false
                                        });
                                        MessagePopoverHook.onSetMessage(that.getView(), oParams);
                                        that._oBusyDialog.close();
                                    },
                                });
                            }, 3000);
                        }
                    }
                );
            },

            refreshHeaderAndDetails: function () {
                // Get the SHIPPING_REQUEST_ID from the event parameters
                let oHeaderModel = this.getView().getModel("Header");
                let shippingRequestId = `0000000${oHeaderModel.getData().ShippingRequestId}`;

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


        });
});