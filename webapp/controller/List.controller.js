sap.ui.define([
  "./BaseController",
  "br/com/challenge/monitor/challengemonitor/utils/formatter",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "br/com/challenge/monitor/challengemonitor/utils/SearchHelp",
  "sap/m/MessageBox",
  "br/com/challenge/monitor/challengemonitor/utils/MessagePopover",
  "sap/ui/Device"
], function (
  BaseController,
  formatter,
  Filter,
  FilterOperator,
  SearchHelp,
  MessageBox,
  MessagePopoverHook
) {
  "use strict";

  return BaseController.extend("br.com.challenge.monitor.challengemonitor.controller.List", {
    Formatter: formatter,
    SearchHelp: SearchHelp,

    onInit: function () {

      let popMsgModel = this.getOwnerComponent().getModel("popoverModel");

      this.getView().byId("shippingsTable").attachEventOnce("updateFinished", this._initializeAppState.bind(this));

    },

    _initializeAppState: function () {
      if (this._appStateInitialized) return;
      this._appStateInitialized = true;

      let appStateModel = this.getOwnerComponent().getModel("appStateModel");
      let appStateData = appStateModel.getProperty("/appState");
      this._appStateEncoded = this.getAppStateFromUrl();

      let appStatePicked = this._appStateEncoded || appStateData

      if (appStatePicked) {
        const appState = this.decompressAndDecode(appStatePicked);
        this._restoreAppState(appState);
        this._saveToAppStateModel(appStatePicked);
      }
    },

    _saveToAppStateModel: function (appState) {
      let appStateModel = this.getOwnerComponent().getModel("appStateModel");
      appStateModel.setProperty("/appState", appState);
    },

    // Saving app state

    _saveAppState: function (viewsNr) {
      const appState = this._getCurrentAppState();
      const currentUrl = window.location.href;

      // Extract the base URL
      const baseUrl = this._extractBaseUrl(currentUrl);

      // Update the appState with the viewsNr
      appState.viewsNr = viewsNr;

      // Handle appState encoding and URL construction
      const appStateEncoded = this.compressAndEncode(appState);
      const newUrl = this._constructNewUrl(baseUrl, appState, appStateEncoded);

      // Update the model and browser URL
      this._updateAppStateModelAndUrl(appStateEncoded, newUrl);
    },

    _extractBaseUrl: function (currentUrl) {
      if (
        currentUrl.includes("display") &&
        (currentUrl.includes("?", currentUrl.indexOf("display")) || currentUrl.includes("&", currentUrl.indexOf("display")))
      ) {
        const questionMarkIndex = currentUrl.indexOf("?", currentUrl.indexOf("display"));
        const ampersandIndex = currentUrl.indexOf("&", currentUrl.indexOf("display"));

        const cutoffIndex =
          questionMarkIndex !== -1 && ampersandIndex !== -1
            ? Math.min(questionMarkIndex, ampersandIndex)
            : questionMarkIndex !== -1
              ? questionMarkIndex
              : ampersandIndex;

        return cutoffIndex !== -1 ? currentUrl.substring(0, cutoffIndex) : currentUrl;
      }
      return currentUrl;
    },

    _constructNewUrl: function (baseUrl, appState, appStateEncoded) {
      if (this._isListClicked) {
        // Reset the flag and encode appState
        this._isListClicked = false;
        return baseUrl; // No URL update needed, return baseUrl
      } else if (appState && appState.selectedItem) {
        // Construct URL for selectedItem
        return `${baseUrl}&/details/ShippingRequestId=${appState.selectedItem}/?appState=${appStateEncoded}`;
      } else if (appState) {
        // Default case
        return `${baseUrl}?appState=${appStateEncoded}`;
      }
      return baseUrl; // No appState, return baseUrl
    },

    _updateAppStateModelAndUrl: function (appStateEncoded, newUrl) {
      const appStateModel = this.getOwnerComponent().getModel("appStateModel");
      appStateModel.setProperty("/appState", appStateEncoded);

      if (newUrl) {
        // Update the browser's URL without reloading the page
        window.history.replaceState({ path: newUrl }, "", newUrl);
      }
    },



    //End of saving app state

    // Update app state
    _updateAppState: function () {
      const currentHash = window.location.hash;

      // Check if "appState" exists in the query parameters
      if (!this._isAppStateInUrl(currentHash)) {
        this._saveAppState(1);
        return;
      }

      const baseUrl = this._getBaseUrl();
      const currentAppState = this.getAppStateFromUrl();
      const currentAppStateDecoded = this.decompressAndDecode(currentAppState);

      // Update the app state with filters and visibility
      this._updateAppStateFilters(currentAppStateDecoded);

      const appStateEncoded = this.compressAndEncode(currentAppStateDecoded);
      const appStateModel = this._getAppStateModel();

      this._updateUrlAndModel(baseUrl, appStateEncoded, appStateModel);
    },

    _isAppStateInUrl: function (currentHash) {
      return currentHash.includes("appState");
    },

    _getBaseUrl: function () {
      return window.location.href.split("?appState=")[0];
    },

    _updateAppStateFilters: function (currentAppStateDecoded) {
      const appState = this._getCurrentAppState();
      currentAppStateDecoded.filters = appState.filters;
      currentAppStateDecoded.filterVisibility = appState.filterVisibility;
    },

    _getAppStateModel: function () {
      return this.getOwnerComponent().getModel("appStateModel");
    },

    _updateUrlAndModel: function (baseUrl, appStateEncoded, appStateModel) {
      const newUrl = `${baseUrl}?appState=${appStateEncoded}`;
      appStateModel.setProperty("/appState", appStateEncoded);
      window.history.replaceState({ path: newUrl }, "", newUrl);
    },

    // End of updating app state

    _restoreAppState: function (appState) {
      if (appState.filters) {
        this._applyFilters(appState.filters, true); // Pass isRestoring = true
      }
      if (appState.selectedItem) {
        this._restoreSelectedItem(appState);
      }
      if (appState.filterVisibility) {
        this._restoreFilterVisibility(appState.filterVisibility);
      }
    },

    _getCurrentAppState: function () {
      const filters = this._getCurrentFilters();
      const selectedItem = this._getSelectedItem();
      const filterVisibility = this._getFilterVisibility();

      return {
        filters,
        selectedItem,
        filterVisibility
      };
    },

    _applyFilters: function (filters, isRestoring) {
      const { shippingRequestId, status, customerId, plantOrigin, createdBy } = filters;

      // Handle MultiInput tokens
      const oMultiInput = this.getView().byId("idShippingRequestItemFilter");
      if (oMultiInput) {
        oMultiInput.removeAllTokens(); // Clear existing tokens

        if (shippingRequestId && Array.isArray(shippingRequestId)) {
          shippingRequestId.forEach(filter => {
            if (filter && filter.text && filter.data) {
              try {
                // Create a token
                const token = new sap.m.Token({
                  key: filter.key || filter.data.row.ShippingRequestId,
                  text: filter.text || `${filter.data.row.ShippingRequestId} (${filter.data.row.Status})`
                });

                // Attach the original data to the token
                token.data(filter.data); // Save the data as is
                oMultiInput.addToken(token); // Add token to MultiInput
              } catch (error) {
                console.error("Error creating token:", error, filter);
              }
            } else {
              console.warn("Invalid filter data:", filter);
            }
          });
        }
      }

      // Apply other filters
      try {
        this.getView().byId("statusFilter").setSelectedKeys(status || []);
        this.getView().byId("customerIdFilter").setValue(customerId || "");
        this.getView().byId("plantOriginFilter").setValue(plantOrigin || "");
        this.getView().byId("createdByFilter").setValue(createdBy || "");
      } catch (error) {
        console.error("Error applying filters to inputs:", error);
      }

      // Apply filters to the table
      try {
        this.filterTable(filters, isRestoring);
      } catch (error) {
        console.error("Error applying filters to the table:", error);
      }
    },

    //-------FILTER TABLE---------//
    filterTable: function (filters, isRestoring) {
      const oTable = this.getView().byId("shippingsTable");
      const oBinding = oTable.getBinding("items");
    
      if (!oBinding) {
        console.warn("No binding found for table items. Ensure the table has a valid binding context.");
        return;
      }
    
      const aFilters = [];
    
      // Extract and add filters for the table
      this._addTokenFilters(aFilters);
      this._addFilterForField(aFilters, "Status", "statusFilter", FilterOperator.Contains, true);
      this._addFilterForField(aFilters, "CustomerId", "customerIdFilter", FilterOperator.Contains, false);
      this._addFilterForField(aFilters, "PlantOrigin", "plantOriginFilter", FilterOperator.Contains, false);
      this._addFilterForField(aFilters, "CreatedBy", "createdByFilter", FilterOperator.Contains, false);
    
      // Apply the combined filters
      oBinding.filter(new sap.ui.model.Filter({ filters: aFilters, and: true })); // Combine all filters with AND logic
    
      // Save the application state
      if (!isRestoring) {
        this._updateAppState();
      }
    },

    _addTokenFilters: function (aFilters) {
      const oMultiInput = this.getView().byId("idShippingRequestItemFilter");
    
      if (oMultiInput) {
        const aTokenFilters = oMultiInput.getTokens().map(token => {
          const tokenData = token.data();
    
          if (tokenData?.range) {
            const filterOperator = tokenData.range.operation || "EQ";
            const value1 = tokenData.range.value1; // Use the raw value
            const value2 = tokenData.range.value2 || null;
            return new sap.ui.model.Filter("ShippingRequestId", filterOperator, value1, value2);
          }
    
          if (tokenData?.row) {
            const value = tokenData.row.ShippingRequestId; // Use the raw value
            return new sap.ui.model.Filter("ShippingRequestId", sap.ui.model.FilterOperator.EQ, value);
          }
    
          console.warn("Unknown token structure:", token);
          return null;
        }).filter(filter => filter !== null);
    
        if (aTokenFilters.length > 0) {
          aFilters.push(new sap.ui.model.Filter({ filters: aTokenFilters, and: false })); // OR logic for tokens
        }
      }
    },

    _addFilterForField: function (aFilters, path, fieldId, operator, isMultiSelect = false) {
      const oField = this.getView().byId(fieldId);
    
      if (!oField) {
        console.warn(`Field with ID ${fieldId} not found.`);
        return;
      }
    
      if (isMultiSelect) {
        const selectedKeys = oField.getSelectedKeys();
        if (selectedKeys && selectedKeys.length > 0) {
          const aFieldFilters = selectedKeys.map(key => new sap.ui.model.Filter(path, operator, key));
          aFilters.push(new sap.ui.model.Filter({ filters: aFieldFilters, and: false })); // OR logic for multiple selections
        }
      } else {
        const value = oField.getValue();
        if (value) {
          aFilters.push(new sap.ui.model.Filter(path, operator, value));
        }
      }
    },

    //--------END OF FILTER TABLE---------//
    
    _restoreSelectedItem: function (appState) {
      const oTable = this.getView().byId("shippingsTable");
      const aItems = oTable.getItems();

      aItems.forEach((item) => {
        const context = item.getBindingContext();
        const itemData = context.getObject();
        if (itemData.ShippingRequestId === appState.selectedItem) {
          // Select the item and scroll to it
          oTable.setSelectedItem(item);
          oTable.scrollToIndex(oTable.indexOfItem(item));

          if (appState.viewsNr === 2) {
            this.getModel("appView").setProperty("/layout", "TwoColumnsBeginExpanded");
          }
        }
      });
    },

    _restoreFilterVisibility: function (visibility) {
      const oFilterBar = this.getView().byId("idFilterBar");
      const aFilterItems = oFilterBar.getFilterGroupItems();
      visibility.forEach(visibleItem => {
        const oFilterGroupItem = aFilterItems.find(item => item.getName() === visibleItem.name);
        if (oFilterGroupItem) {
          oFilterGroupItem.setVisibleInFilterBar(visibleItem.visible);
        }
      });
    },
    
    _getCurrentFilters: function () {
      const oMultiInput = this.getView().byId("idShippingRequestItemFilter");
      let shippingRequestIdFilters = [];

      if (oMultiInput) {
        // Extract tokens and save the entire token object
        shippingRequestIdFilters = oMultiInput.getTokens().map(token => {
          return {
            key: token.getKey(),
            text: token.getText(),
            data: token.data(), // Save any associated data
            bindingContext: token.getBindingContext() // Save the binding context if applicable
          };
        });
      }

      return {
        shippingRequestId: shippingRequestIdFilters, // Save the entire object for each token
        status: this.getView().byId("statusFilter").getSelectedKeys(),
        customerId: this.getView().byId("customerIdFilter").getValue(),
        plantOrigin: this.getView().byId("plantOriginFilter").getValue(),
        createdBy: this.getView().byId("createdByFilter").getValue()
      };
    },

    _getSelectedItem: function () {
      const oTable = this.getView().byId("shippingsTable");
      const oSelectedItem = oTable.getSelectedItem();
      return oSelectedItem ? oSelectedItem.getBindingContext().getProperty("ShippingRequestId") : null;
    },

    _getFilterVisibility: function () {
      const oFilterBar = this.getView().byId("idFilterBar");
      return oFilterBar.getFilterGroupItems().map(item => ({
        name: item.getName(),
        visible: item.getVisibleInFilterBar()
      }));
    },

    // Event Handlers
    onFilterBarSearch: function () {
      this._updateAppState();
    },

    onSelectedItem: function (oEvent) {
      const oSelectedItem = oEvent.getParameter("listItem");
      if (!oSelectedItem) {
        console.error("No list item selected.");
        return;
      }
      var oDetailModel = this.getOwnerComponent().getModel("detailModel");
      oDetailModel.setProperty("/showListFooter", false);
      oDetailModel.setProperty("/showDetailFooter", true);
      const oContext = oSelectedItem.getBindingContext();
      const selectedItemId = oContext ? oContext.getProperty("ShippingRequestId") : null;

      if (!selectedItemId) {
        return;
      }

      this._isListClicked = true;

      this._saveAppState(2);

      let appStateModel = this.getOwnerComponent().getModel("appStateModel");
      appStateModel.setProperty("/clicked", true);
      appStateModel.setProperty("/viewsNr", 2);

      // Update the app view layout and navigate
      this.getModel("appView").setProperty("/layout", "TwoColumnsBeginExpanded");

      this.getRouter().navTo("Details", {
        SHIPPING_REQUEST_ID: selectedItemId
      }, { replace: true });


    },

    onClearFilters: function () {
      const oFilterBar = this.getView().byId("idFilterBar"); // Replace with your FilterBar's ID
      if (oFilterBar) {
        const aFilterGroupItems = oFilterBar.getFilterGroupItems();

        // Clear each filter control
        aFilterGroupItems.forEach((oFilterGroupItem) => {
          const oControl = oFilterGroupItem.getControl();
          if (oControl) {
            // Reset different control types appropriately
            if (typeof oControl.setValue === "function") {
              oControl.setValue(""); // Clear Input fields
            }
            if (typeof oControl.setSelectedKeys === "function") {
              oControl.setSelectedKeys([]); // Clear MultiComboBox or similar controls
            }
            if (typeof oControl.setSelected === "function") {
              oControl.setSelected(false); // Clear CheckBox or RadioButton controls
            }
            if (typeof oControl.removeAllTokens === "function") {
              oControl.removeAllTokens(); // Clear MultiInput tokens
            }
          }
        });

        // Optionally trigger the search to update the results
        this.filterTable({}, false);
        this._updateAppState();
      } else {
        console.error("FilterBar not found.");
      }
    },

    onMessagesButtonPress: function (oEvent) {
      MessagePopoverHook.onMessagesPopoverOpen(oEvent);
    },

    onFilterBarReset: function () {
      debugger;
      const oFilterBar = this.getView().byId("idFilterBar");
      if (oFilterBar) {
        const aFilterGroupItems = oFilterBar.getFilterGroupItems();
        console.log("FilterGroupItems:", aFilterGroupItems);

        aFilterGroupItems.forEach((oFilterGroupItem) => {
          const sFilterName = oFilterGroupItem.getName();
          console.log("Processing Filter:", sFilterName);

          // Make all fields visible
          if (sFilterName === "PlantOrigin") {
            oFilterGroupItem.setVisibleInFilterBar(false);
          } else {
            oFilterGroupItem.setVisibleInFilterBar(true);
          }

          // Clear only the PlantOrigin field
          if (sFilterName === "PlantOrigin") {
            const oControl = oFilterGroupItem.getControl();
            console.log("PlantOrigin Control:", oControl);
            if (oControl && typeof oControl.setValue === "function") {
              oControl.setValue(""); // Clear the value of PlantOrigin
              console.log("Cleared PlantOrigin field");
            }
          }
        });

        // Trigger a change event
        // oFilterBar.fireFilterChange();
        this._updateAppState();
        this.filterTable({}, false);
      } else {
        console.error("FilterBar not found.");
      }
    },


  });
});