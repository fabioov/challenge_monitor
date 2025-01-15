sap.ui.define([
  "./BaseController",
  "br/com/challenge/monitor/challengemonitor/utils/formatter",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "br/com/challenge/monitor/challengemonitor/utils/SearchHelp",
  "sap/m/MessageBox",
  "br/com/challenge/monitor/challengemonitor/utils/MessagePopover",
  "br/com/challenge/monitor/challengemonitor/utils/PrintForms",
  "sap/ui/Device"
], function (
  BaseController,
  formatter,
  Filter,
  FilterOperator,
  SearchHelp,
  MessageBox,
  MessagePopoverHook,
  PrintForms
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

    // Modular functions for specific tasks
    _applyFilters: function (filters, isRestoring) {
      const { shippingRequestId, status, customerId, plantOrigin, createdBy } = filters;
      this.getView().byId("idShippingRequestItemFilter").setValue(shippingRequestId || "");
      this.getView().byId("statusFilter").setSelectedKeys(status || []);
      this.getView().byId("customerIdFilter").setValue(customerId || "");
      this.getView().byId("plantOriginFilter").setValue(plantOrigin || "");
      this.getView().byId("createdByFilter").setValue(createdBy || "");
      this.filterTable(filters, isRestoring);
    },

    filterTable: function (filters, isRestoring) {
      const oTable = this.getView().byId("shippingsTable");
      const oBinding = oTable.getBinding("items");

      if (!oBinding) {
        console.warn("No binding found for table items. Ensure the table has a valid binding context.");
        return;
      }

      const aFilters = [];

      // Extract filter values
      // const shippingRequestId = this.getView().byId("idShippingRequestItemFilter").getValue();
      const status = this.getView().byId("statusFilter").getSelectedKeys();
      const customerId = this.getView().byId("customerIdFilter").getValue();
      const plantOrigin = this.getView().byId("plantOriginFilter").getValue();
      const createdBy = this.getView().byId("createdByFilter").getValue();

      // Extract tokens from MultiInput
      const oMultiInput = this.getView().byId("idShippingRequestItemFilter");
      if (oMultiInput && oMultiInput.getTokens().length > 0) {
        const aTokenFilters = oMultiInput.getTokens().map(token => {
          return new Filter("ShippingRequestId", FilterOperator.EQ, token.getKey() || token.getText());
        });
        aFilters.push(new Filter({ filters: aTokenFilters, and: false })); // Combine tokens with OR
      }

      // Add filters based on values
      if (status && status.length) {
        const aStatusFilters = status.map(statusKey => new Filter("Status", FilterOperator.Contains, statusKey));
        aFilters.push(new Filter({ filters: aStatusFilters, and: false }));
      }

      if (customerId) {
        aFilters.push(new Filter("CustomerId", FilterOperator.Contains, customerId));
      }

      if (plantOrigin) {
        aFilters.push(new Filter("PlantOrigin", FilterOperator.Contains, plantOrigin));
      }

      if (createdBy) {
        aFilters.push(new Filter("CreatedBy", FilterOperator.Contains, createdBy));
      }

      // Apply the filters to the binding
      oBinding.filter(aFilters);

      // Save the application state after applying filters
      if (!isRestoring) {
        this._updateAppState();
      }
    },

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
      return {
        shippingRequestId: this.getView().byId("idShippingRequestItemFilter").getValue(),
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

    onPrintForms: function () {
      const oModel = this.getView().getModel();
      const oTable = this.getView().byId("shippingsTable");
      const oSelectedItem = oTable.getSelectedItem();

      if (!oSelectedItem) {
        MessageBox.warning(this.getView().getModel("i18n").getResourceBundle().getText("lvSelectAtLeastOneShippingRequest"));
        return;
      }

      const oContext = oSelectedItem.getBindingContext();
      PrintForms.onPrintPress(this.getView(), oContext);
    },


  });
});