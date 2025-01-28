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

    return BaseController.extend("br.com.challenge.monitor.challengemonitor.controller.Details", {
        Formatter: formatter,

        onInit: function () {

            this._appStateModel = this.getOwnerComponent().getModel("appStateModel");
            // Attach route pattern matched event
            this.getOwnerComponent().getRouter().getRoute("Details")
                .attachPatternMatched(this._onBindingDetails, this);

        },

        _saveState: function (currentAppState, keys, viewsNr) {
            let appStateDecompressed = this.decompressAndDecode(currentAppState);

            // Construct the new URL by keeping the base part and appending the updated app state
            const baseUrl = this._baseUrl();

            appStateDecompressed.viewsNr = viewsNr;

            let newUrl;

            if (keys && Object.keys(keys).length > 0) {
                appStateDecompressed.selectedDetailKeys = keys;
                const appStateCompressed = this.compressAndEncode(appStateDecompressed);
                this._appStateModel.setProperty("/appState", appStateCompressed);
            } else {

                newUrl = `${baseUrl}&/details/ShippingRequestId=${appStateDecompressed.selectedItem}/?appState=${currentAppState}`;
                this._appStateModel.setProperty("/appState", currentAppState);

                // Replace the current URL in the browser without adding to the history stack
                const currentUrl = window.location.href;
                if (currentUrl !== newUrl) {
                    window.history.replaceState({ path: newUrl }, "", newUrl);
                }
            }

        },

        _baseUrl: function () {
            const currentUrl = window.location.href;

            // Split by hash "#" to isolate the part of the URL after it
            const [urlBeforeHash, hashFragment] = currentUrl.split("#");

            if (!hashFragment) return urlBeforeHash; // Return the full URL if no hash fragment exists

            // Extract the base part before "&/details/"
            const baseHash = hashFragment.split("&/details/")[0];

            // Ensure the base ends with "-display"
            const [cleanBaseHash] = baseHash.includes("?") ? baseHash.split("?") : [baseHash];

            // Construct the final base URL
            const finalBaseUrl = `${urlBeforeHash}#${cleanBaseHash}`;

            return finalBaseUrl;
        },

        onMessagesButtonPress: function (oEvent) {
            MessagePopoverHook.onMessagesPopoverOpen(oEvent, this.getView());
        },

        _restoreState: function (url) {
            let appState = this.decompressAndDecode(url);
            if (appState.selectedDetailKeys && Object.keys(appState.selectedDetailKeys).length > 0) {
                this._restoreSelectedItem(appState);
            }
        },

        _restoreSelectedItem: function (appState) {
            if (!appState) return;
            const oTable = this.getView().byId("itemsTable");
            const aItems = oTable.getItems();
            if (!aItems || aItems.length === 0) return;
            aItems.forEach((item) => {
                const context = item.getBindingContext("Details");
                const itemData = context.getObject();

                if (itemData.DELIVERY_NR === appState.selectedDetailKeys.DELIVERY_NR &&
                    itemData.DELIVERY_ITEM_NR === appState.selectedDetailKeys.DELIVERY_ITEM_NR &&
                    itemData.MATERIAL_NR === appState.selectedDetailKeys.MATERIAL_NR) {
                    oTable.setSelectedItem(item);
                    oTable.scrollToIndex(oTable.indexOfItem(item));

                    // Clear existing views to avoid duplicates
                    const oFlexibleColumnLayout = this.byId("layout");
                    if (oFlexibleColumnLayout) {
                        oFlexibleColumnLayout.removeAllMidColumnPages(); // Clear midColumnPages
                        oFlexibleColumnLayout.removeAllEndColumnPages(); // Clear endColumnPages
                    }
                    this.getModel("appView").setProperty("/layout", "ThreeColumnsMidExpanded");
                    this.getRouter().navTo(
                        "PickTaskDetail",
                        {
                            SHIPPING_REQUEST_ID: appState.selectedDetailKeys.SHIPPING_REQUEST_ID,
                            DELIVERY_NR: appState.selectedDetailKeys.DELIVERY_NR,
                            DELIVERY_ITEM_NR: itemData.DELIVERY_ITEM_NR,
                            MATERIAL_NR: appState.selectedDetailKeys.MATERIAL_NR,
                            STATUS: appState.selectedDetailKeys.STATUS
                        },
                        { replace: true }
                    );

                    let appStateCompressed = this.compressAndEncode(appState)
                    let appStateModel = this.getOwnerComponent().getModel("appStateModel");
                    appStateModel.setProperty("/appState", appStateCompressed);
                    appStateModel.setProperty("/views", 3);
                }
            });

        },

        _onBindingDetails: function (oEvent) {
            let shippingRequestId = "0000000" + oEvent.getParameter("arguments").SHIPPING_REQUEST_ID;

            // Get the view and the OData model
            let oView = this.getView();
            let oModel = oView.getModel();

            // Define the filter for the SHIPPING_REQUEST_ID
            let aFilters = [new Filter("SHIPPING_REQUEST_ID", FilterOperator.EQ, shippingRequestId)];

            //TODO: Implement expand so we call backend only once for header and details
            // Create promises for asynchronous operations
            let bindDetailsPromise = new Promise((resolve, reject) => {
                let sElement = "/ZRFSFBPCDS0002"; // Items data
                oModel.read(sElement, {
                    filters: aFilters,
                    success: function (oData) {
                        if (oData.results.length > 0) {
                            // Loop through the results and update PICKING_TASK_ID if it's empty
                            oData.results.forEach((item) => {
                                if (!item.PICKING_TASK_ID || item.PICKING_TASK_ID.trim() === "") {
                                    item.PICKING_TASK_ID = "N/A";
                                }
                            });

                            // Sort the results by PICKING_TASK_ID
                            oData.results.sort((a, b) => {
                                const idA = a.PICKING_TASK_ID.toUpperCase(); // Handle case-insensitive sorting
                                const idB = b.PICKING_TASK_ID.toUpperCase();
                                if (idA < idB) return -1;
                                if (idA > idB) return 1;
                                return 0;
                            });

                            // Create a new JSON model and set it to the view
                            let oItemsModel = new JSONModel(oData);
                            oView.setModel(oItemsModel, "Details");

                        }
                        resolve(); // Resolve the promise when details binding is complete
                    },
                    error: function (oError) {
                        reject(oError); // Reject the promise in case of an error
                    }
                });
            });

            let bindHeaderPromise = new Promise((resolve, reject) => {
                let sPath = "/ZRFSFBPCDS0001('" + shippingRequestId + "')"; // Header data
                oModel.read(sPath, {
                    success: function (oData) {
                        let oJSONModel = new JSONModel(oData);
                        oView.setModel(oJSONModel, "Header");
                        resolve(); // Resolve the promise when header binding is complete
                    },
                    error: function (oError) {
                        reject(oError); // Reject the promise in case of an error
                    }
                });
            });

            // Wait for the "Details" binding to complete before restoring the state
            bindDetailsPromise
                .then(() => {
                    // }
                    const appStateModel = this.getOwnerComponent().getModel("appStateModel");
                    const modelAppState = appStateModel.oData.appState;
                    const isClicked = appStateModel.oData.clicked;
                    const modelAppStateDecompressed = modelAppState
                        ? this.decompressAndDecode(modelAppState)
                        : {};

                    if (this._shouldRestoreState(isClicked)) {
                        this._handleRestoreState();
                    } else {
                        this._handleSaveState(appStateModel, modelAppState, modelAppStateDecompressed);
                    }
                })
                .catch((error) => {
                    console.error("Error in binding Details:", error);
                });

            // Handle header binding errors independently if needed
            bindHeaderPromise.catch((error) => {
                console.error("Error in binding Header:", error);
            });
        },

        _shouldRestoreState: function (isClicked) {
            return isClicked === false || isClicked === undefined;
        },

        _handleRestoreState: function () {
            const appStateFromUrl = this.getAppStateFromUrl();
            if (appStateFromUrl) {
                const appStateFromUrlDecompressed = this.decompressAndDecode(appStateFromUrl);
                this._restoreState(appStateFromUrl);
            }
        },

        _handleSaveState: function (appStateModel, modelAppState, modelAppStateDecompressed) {
            appStateModel.setProperty("/clicked", false);
            this._saveState(modelAppState, modelAppStateDecompressed.selectedDetailKeys, modelAppState.viewsNr);
        },

        _updateUrlOnCloseView: function (currentAppState) {
            let appStateDecompressed = this.decompressAndDecode(currentAppState);
            appStateDecompressed.selectedItem = null;
            let appStateCompressed = this.compressAndEncode(appStateDecompressed);
            this._appStateModel.setProperty("/appState", appStateCompressed);
            this._appStateModel.setProperty("/views", 1);

            // Construct the new URL by keeping the base part and appending the updated app state
            const baseUrl = window.location.href.split("&/details")[0];

            const newUrl = `${baseUrl}?appState=${appStateCompressed}`;

            // Replace the current URL in the browser without adding to the history stack
            window.history.replaceState({ path: newUrl }, "", newUrl);

        },

        onCloseDetailView: function () {
            var oDetailModel = this.getOwnerComponent().getModel("detailModel");
            var oPopoverModel = this.getOwnerComponent().getModel("popoverModel");
            oDetailModel.setProperty("/showDetailFooter", false);

            if (oPopoverModel.getProperty("/messageLength") > 0) {
                oDetailModel.setProperty("/showListFooter", true);
            }

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

            let currentAppState = this.getAppStateFromUrl();
            // Set layout to OneColumn
            this.getModel("appView").setProperty("/layout", "OneColumn");
            // this._getRouter().navTo("List", {}, {});

            // Update the hash
            this._updateUrlOnCloseView(currentAppState);
        },

        onUpdateFinished: function () {
            const oTable = this.byId("itemsTable");
            const selectedKeys = this.getView().getModel("appStateModel").getProperty("/selectedKeys");

            if (selectedKeys) {
                const items = oTable.getItems();
                items.forEach((item) => {
                    const context = item.getBindingContext("Details");
                    const itemData = context.getObject();

                    if (
                        itemData.SHIPPING_REQUEST_ID === selectedKeys.SHIPPING_REQUEST_ID &&
                        itemData.DELIVERY_NR === selectedKeys.DELIVERY_NR &&
                        itemData.DELIVERY_ITEM_NR === selectedKeys.DELIVERY_ITEM_NR &&
                        itemData.MATERIAL_NR === selectedKeys.MATERIAL_NR
                    ) {
                        oTable.setSelectedItem(item);
                    }
                });
            }
        },

        // Select an item from table section //

        onSelectedItem: function (oEvent) {
            const bReplace = !Device.system.phone;
            const oSelectedItem = oEvent.getParameter("listItem");
            const oContext = oSelectedItem.getBindingContext("Details");

            // Extract unique identifier keys for the selected item
            const selectedKeys = this._getSelectedItemKeys(oContext);

            // Save the unique keys to maintain selection after updates
            this._setSelectedItemKeys(selectedKeys);

            // Save the application state
            const sAppState = this.getAppStateFromUrl();
            this._saveState(sAppState, selectedKeys, 3);

            // Update appStateModel and appView layout
            this._updateAppStateModel();

            // Navigate to the detailed view
            this._navigateToDetailView(selectedKeys, bReplace);
        },


        _setSelectedItemKeys: function (selectedKeys) {
            const oView = this.getView();
            oView.getModel("appStateModel").setProperty("/selectedKeys", selectedKeys);
        },


        _getSelectedItemKeys: function (oContext) {
            const oHeaderModel = this.getModel("Header");
            return {
                SHIPPING_REQUEST_ID: oContext.getProperty("SHIPPING_REQUEST_ID"),
                DELIVERY_NR: oContext.getProperty("DELIVERY_NR"),
                DELIVERY_ITEM_NR: oContext.getProperty("DELIVERY_ITEM_NR"),
                MATERIAL_NR: oContext.getProperty("MATERIAL_NR"),
                STATUS: oHeaderModel.getData().Status
            };
        },

        _updateAppStateModel: function () {
            const appStateModel = this.getOwnerComponent().getModel("appStateModel");
            appStateModel.setProperty("/clicked", true);

            const appViewModel = this.getModel("appView");
            appViewModel.setProperty("/layout", "ThreeColumnsMidExpanded");
        },

        _navigateToDetailView: function (keys, bReplace) {
            this.getRouter().navTo(
                "PickTaskDetail",
                {
                    SHIPPING_REQUEST_ID: keys.SHIPPING_REQUEST_ID,
                    DELIVERY_NR: keys.DELIVERY_NR,
                    DELIVERY_ITEM_NR: keys.DELIVERY_ITEM_NR,
                    MATERIAL_NR: keys.MATERIAL_NR,
                    STATUS: keys.STATUS
                },
                { replace: bReplace }
            );
        },

        // end of select an item from table section

        onChangeStatus: function () {
            var oModel = this.getView().getModel();
            var that = this;
            this._oBundle = this.getView().getModel("i18n").getResourceBundle();
            var detailModel = this.getView().getModel("Header");
            var shippingRequest = detailModel.getData();
            delete shippingRequest.__metadata; // Remove OData metadata
            var sPath = "/ZRFSFBPCDS0001('" + shippingRequest.ShippingRequestId + "')";

            // Check if status is valid for change
            var sStatus = shippingRequest.Status === "K"
                ? that._oBundle.getText("statusK")
                : shippingRequest.Status === "C"
                    ? that._oBundle.getText("statusC")
                    : that._oBundle.getText("statusX");

            if (shippingRequest.Status === "K" || shippingRequest.Status === "C" || shippingRequest.Status === "X") {
                MessageBox.warning(that._oBundle.getText("lvStatusNotAllowedTochange", [sStatus]));
                return;
            }

            MessageBox.confirm(
                that._oBundle.getText("lvConfirmChangeStatus", [shippingRequest.ShippingRequestId]),
                function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._oBusyDialog = new BusyDialog({
                            Text: that._oBundle.getText("lvWaiting")
                        });
                        that._oBusyDialog.open();

                        setTimeout(function () {
                            var oModelSend = new ODataModel(oModel.sServiceUrl, true);
                            oModelSend.update(sPath, shippingRequest, {
                                success: function (data, response) {
                                    if (response.statusCode === "204") {
                                        var oParams = {
                                            type: "Success",
                                            title: that._oBundle.getText("lvStatusChangedSuccessfully", [shippingRequest.ShippingRequestId])
                                        };
                                        MessagePopoverHook.onSetMessage(that.getView(), oParams, "changeStatus");
                                        MessageBox.success(oParams.title);
                                        that._oBusyDialog.close();

                                        that._refreshHeaderAndDetails();
                                    }
                                },
                                error: function (error) {
                                    var errorResponse = JSON.parse(error.responseText);
                                    var oParams = {
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
                                    MessagePopoverHook.onSetMessage(that.getView(), oParams, "changeStatus");
                                    that._oBusyDialog.close();
                                }
                            });
                        }, 3000);
                    }
                }
            );
        },

        onCancelShippingRequest: function () {
            var oModel = this.getView().getModel();
            this._oBundle = this.getView().getModel("i18n").getResourceBundle();

            var detailModel = this.getView().getModel("Header");
            var shippingRequest = detailModel.getData();
            delete shippingRequest.__metadata; // Remove OData metadata
            var sPath = "/ZRFSFBPCDS0001('" + shippingRequest.ShippingRequestId + "')";

            var that = this;

            if (shippingRequest.Status === "X") {
                MessageBox.warning(that._oBundle.getText("lvShippingRequestAlreadyCancelled", [shippingRequest.ShippingRequestId]));
                return;
            }

            MessageBox.confirm(
                this._oBundle.getText("lvConfirmCancelShippingRequest", [shippingRequest.ShippingRequestId]),
                function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._oBusyDialog = new BusyDialog({
                            text: that._oBundle.getText("lvWaiting")
                        });
                        that._oBusyDialog.open();

                        setTimeout(function () {
                            var oModelSend = new ODataModel(oModel.sServiceUrl, true);
                            oModelSend.remove(sPath, {
                                success: function (data, response) {
                                    if (response.statusCode === "204") {
                                        var oParams = {
                                            type: "Success",
                                            title: that._oBundle.getText("lvStatusCancelledSuccessfully", [shippingRequest.ShippingRequestId])
                                        };
                                        MessagePopoverHook.onSetMessage(that.getView(), oParams, "cancelShippingRequest");
                                        MessageBox.success(oParams.title);
                                        that._oBusyDialog.close();
                                        that._refreshHeaderAndDetails();
                                    }
                                },
                                error: function (error) {
                                    var errorResponse = JSON.parse(error.responseText);
                                    var oParams = {
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
                                    MessagePopoverHook.onSetMessage(that.getView(), oParams, "cancelShippingRequest");
                                    that._oBusyDialog.close();
                                }
                            });
                        }, 3000);
                    }
                }
            );
        },

        _saveStateOnChangeStatus: function (appState) {
            const appStateDecompressed = this._prepareDecompressedState(appState);
            const appStateCompressed = this.compressAndEncode(appStateDecompressed);

            const newUrl = this._generateNewUrl(appStateDecompressed.selectedItem, appStateCompressed);
            this._updateHistoryAndModel(newUrl, appStateCompressed);
        },

        _prepareDecompressedState: function (appState) {
            const appStateDecompressed = this.decompressAndDecode(appState);
            appStateDecompressed.selectedDetailKeys = {};
            appStateDecompressed.viewsNr = 2;
            return appStateDecompressed;
        },

        _generateNewUrl: function (shippingRequestId, appStateCompressed) {
            const baseUrl = this._baseUrl();
            return `${baseUrl}&/details/ShippingRequestId=${shippingRequestId}/?appState=${appStateCompressed}`;
        },

        _updateHistoryAndModel: function (newUrl, appStateCompressed) {
            // Update browser history
            window.history.replaceState({ path: newUrl }, "", newUrl);

            // Update appStateModel
            const appStateModel = this.getOwnerComponent().getModel("appStateModel");
            appStateModel.setProperty("/appState", appStateCompressed);
            appStateModel.setProperty("/views", 2);
        },

        _refreshHeaderAndDetails: function () {
            // Get the current ShippingRequestId from the Header model
            var oHeaderModel = this.getView().getModel("Header");
            var shippingRequestId = "0000000" + oHeaderModel.getData().ShippingRequestId;

            const currentAppState = this.getAppStateFromUrl();
            this.getModel("appView").setProperty("/layout", "TwoColumnsBeginExpanded");
            this._saveStateOnChangeStatus(currentAppState);

            const oComponent = this.getOwnerComponent();
            const oDetailsView = oComponent.getRouter().getView("br.com.challenge.monitor.challengemonitor.view.Details");
            if (!oDetailsView) {
                console.error("Details view not found.");
                return;
            }

            // Define the filter
            var aFilters = [new Filter("SHIPPING_REQUEST_ID", FilterOperator.EQ, shippingRequestId)];
            var oFilter = new Filter({ filters: aFilters, and: true });

            // OData Model
            var oModel = this.getView().getModel();

            // Refresh items (ZRFSFBPCDS0002)
            var sElement = "/ZRFSFBPCDS0002";
            oModel.read(sElement, {
                filters: [oFilter],
                success: function (oData) {
                    if (oData.results.length > 0) {
                        var oDetailsModel = oDetailsView.getModel("Details");
                        if (oDetailsModel) {
                            oData.results.forEach((item) => {
                                if (!item.PICKING_TASK_ID || item.PICKING_TASK_ID.trim() === "") {
                                    item.PICKING_TASK_ID = "N/A";
                                }
                            });
                            oDetailsModel = new JSONModel({});
                            oDetailsView.setModel(oDetailsModel, "Details");
                        }

                        oDetailsModel.setData(oData);
                        oDetailsModel.refresh(true); // Ensure UI updates
                    }
                },
                error: function (oError) {
                    console.error("Error refreshing Details data:", oError);
                }
            });

            // Refresh header (ZRFSFBPCDS0001)
            var sPath = "/ZRFSFBPCDS0001('" + shippingRequestId + "')";
            oModel.read(sPath, {
                success: function (oData) {
                    var oHeaderModel = oDetailsView.getModel("Header");
                    if (!oHeaderModel) {
                        oHeaderModel = new JSONModel({});
                        oDetailsView.setModel(oHeaderModel, "Header");
                    }

                    oHeaderModel.setData(oData);
                    oHeaderModel.refresh(true); // Ensure UI updates
                },
                error: function (oError) {
                    console.error("Error refreshing Header data:", oError);
                }
            });
        },

        onPrintForms: function () {
            const oModel = this.getView().getModel("Details");
            this.onPrintPress(this.getView(), oModel.getData().results[0].SHIPPING_REQUEST_ID);
        },

    });
});