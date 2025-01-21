sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/PDFViewer",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
], function (
    Controller,
    PDFViewer,
    Filter,
    FilterOperator,
    JSONModel
) {
    "use strict";

    return Controller.extend("br.com.challenge.monitor.challengemonitor.controller.BaseController", {

        compressAndEncode: function (obj) {
            if (!obj || Object.keys(obj).length === 0) {
                // Handle empty object: return an empty string or a specific marker
                return '';
            }

            // Encode the object to a JSON string and then to a Uint8Array
            const encodedData = new TextEncoder().encode(JSON.stringify(obj));

            // Compress the data using pako
            const compressedData = pako.deflate(encodedData);

            // Convert the compressed data to Base64URL using modern Web APIs
            const base64Data = btoa(String.fromCharCode(...new Uint8Array(compressedData)));

            return base64Data;
        },

        decompressAndDecode: function (str) {
            if (!str || str.trim() === '') {
                // Handle empty or invalid string: return null or a specific marker
                return null;
            }

            const decodedData = atob(str);

            // Decompress the binary data using pako
            const decompressedData = pako.inflate(decodedData.split("").map(function (c) { return c.charCodeAt(0); }));

            // Decode the decompressed data back to a string
            const jsonData = new TextDecoder().decode(new Uint8Array(decompressedData));

            // Parse the JSON string back to an object
            return JSON.parse(jsonData);
        },

        getAppStateFromUrl: function () {
            var sUrl = window.location.href;

            // Check if the URL contains the 'appState=' parameter
            if (sUrl.includes('appState=')) {
                var sAppState = sUrl.split('appState=')[1];
                return sAppState;
            }

            // Return null or a default value if 'appState=' is not found
            return null;
        },
        onPrintPress: function (oView, shippingRequestId) {
            // Pad shippingRequestId with leading zeros to make it 10 characters long
            var formattedShippingRequestId = shippingRequestId.padStart(10, '0');

            // Debugger and call the preview function
            debugger;
            this._previewSmartform(oView, "ZRFSFBPSF0001", formattedShippingRequestId);
        },

        _previewSmartform: function (oView, FormName, shippingRequestId) {
            try {
                // Check if a PDFViewer instance already exists
                if (!this._pdfViewer) {
                    // Create the PDFViewer instance only when needed
                    this._pdfViewer = new PDFViewer({
                        isTrustedSource: true, // Trust the source
                        title: "PDF Viewer", // Set the title for the PDF viewer
                        showDownloadButton: false // Hide the download button
                    });

                    // Add the PDFViewer as a dependent to the view
                    this.getView().addDependent(this._pdfViewer);
                }

                // Get the model for the view
                let oModel = oView.getModel();

                // Create the OData path for the PDF source
                let sPath = oModel.createKey("/PrintOpSet", {
                    FileName: FormName,
                    Params: shippingRequestId,
                    FormId: "",
                    GetPdf: 'X'
                });

                // Generate the PDF source URL
                let sSource = oModel.sServiceUrl + sPath + "/$value";

                // Configure the PDFViewer with the source and open it
                this._pdfViewer.setSource(sSource);
                this._pdfViewer.open();
            } catch (error) {
                console.error("Error previewing Smartform:", error);
            }
        },

        _refreshPickingTaskView: function (oView) {
            return new Promise((resolve, reject) => {
                try {
                    const oModel = oView.getModel();
                    const oComponent = this.getOwnerComponent();
                    const oDetailsView = oComponent.getRouter().getView("br.com.challenge.monitor.challengemonitor.view.Details");
                    const oPickDetailsView = oComponent.getRouter().getView("br.com.challenge.monitor.challengemonitor.view.PickTaskDetail");

                    // Validate required views
                    if (!oDetailsView || !oPickDetailsView) {
                        reject(new Error("Details or PickTaskDetail view could not be found."));
                        return;
                    }

                    // Get selected item and binding context
                    const oTable = oDetailsView.byId("itemsTable");
                    const oSelectedItem = oTable?.getSelectedItem();

                    if (!oSelectedItem) {
                        reject(new Error("No item selected in the items table."));
                        return;
                    }

                    const oBindingContext = oSelectedItem.getBindingContext("Details");
                    const oItemData = oBindingContext?.getObject();

                    if (!oItemData) {
                        reject(new Error("No binding context or item data found."));
                        return;
                    }

                    // Build filters
                    const aFilters = [
                        new Filter("DELIVERY_NR", FilterOperator.EQ, oItemData.DELIVERY_NR),
                        new Filter("DELIVERY_ITEM_NR", FilterOperator.EQ, oItemData.DELIVERY_ITEM_NR),
                        new Filter("MATERIAL_NR", FilterOperator.EQ, oItemData.MATERIAL_NR)
                    ];

                    const oFilter = new Filter({
                        filters: aFilters,
                        and: true
                    });

                    // Define the OData entity set
                    const sEntitySet = "/ZRFSFBPCDS0002";

                    // Read data from the model
                    oModel.read(sEntitySet, {
                        filters: [oFilter],
                        success: (oData) => this._handleRefreshSuccess(oData, oView, oPickDetailsView, resolve),
                        error: (oError) => {
                            console.error("Error refreshing picking task view:", oError);
                            reject(oError);
                        }
                    });
                } catch (error) {
                    console.error("Unexpected error in _refreshPickingTaskView:", error);
                    reject(error);
                }
            });
        },

        _handleRefreshSuccess: function (oData, oView, oPickDetailsView, resolve) {
            if (!oData || !oData.results || oData.results.length === 0) {
                console.warn("No data returned from the OData service.");
                resolve(null);
                return;
            }

            // Set the data to the "PickTaskDetail" model
            const oJSONModel = new JSONModel(oData.results[0]);
            oView.setModel(oJSONModel, "PickTaskDetail");

            // Invalidate and re-render the ObjectPageLayout
            const oObjectPageLayout = oPickDetailsView.byId("ObjectPageLayout");
            if (oObjectPageLayout) {
                oObjectPageLayout.invalidate();
            }

            // Resolve the promise with the SHIPPING_REQUEST_ID
            resolve(oData.results[0].SHIPPING_REQUEST_ID);
        },

        getModel: function (sName) {
            return this.getOwnerComponent().getModel(sName) || this.getView().getModel(sName);
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

    });
});