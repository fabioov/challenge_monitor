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

    _saveAppState: function (viewsNr) {
      const appState = this._getCurrentAppState();
      const currentUrl = window.location.href;
      // Extract the base URL considering 'display'
      let baseUrl;
      if (
        currentUrl.includes("display") &&
        (currentUrl.includes("?", currentUrl.indexOf("display")) || currentUrl.includes("&", currentUrl.indexOf("display")))
      ) {
        // Determine the position of the first `?` or `&` after "display"
        const questionMarkIndex = currentUrl.indexOf("?", currentUrl.indexOf("display"));
        const ampersandIndex = currentUrl.indexOf("&", currentUrl.indexOf("display"));

        // Find the earliest occurrence of `?` or `&` after "display"
        const cutoffIndex = questionMarkIndex !== -1 && ampersandIndex !== -1
          ? Math.min(questionMarkIndex, ampersandIndex)
          : questionMarkIndex !== -1
            ? questionMarkIndex
            : ampersandIndex;

        baseUrl = cutoffIndex !== -1 ? currentUrl.substring(0, cutoffIndex) : currentUrl;
      } else {
        baseUrl = currentUrl;
      }
      let appStateModel = this.getOwnerComponent().getModel("appStateModel");
      let appStateModelState = appStateModel ? appStateModel.getProperty("/appState") : null;
      // let isClicked = appStateModel ? appStateModel.getProperty("/clickedList") : null;

      let appStateModelStateDecoded = appStateModelState ? this.decompressAndDecode(appStateModelState) : null;

      let newUrl;
      let appStateEncoded;

      appState.viewsNr = viewsNr;
      // Check if appStateModelStateDecoded exists before accessing properties
      if (this._isListClicked) {
        // Handle the case where isClicked takes precedence
        this._isListClicked = false; // Reset the flag
        appStateEncoded = this.compressAndEncode(appState);
        // newUrl = `${baseUrl}&/details/ShippingRequestId=${appState.selectedItem}?appState=${appStateEncoded}`;
        // } else if (appStateModelStateDecoded && appStateModelStateDecoded.selectedDetailKeys && Object.keys(appStateModelStateDecoded.selectedDetailKeys).length > 0) {
        //   // If selectedDetailKeys exist and have data
        //   appState.selectedDetailKeys = appStateModelStateDecoded.selectedDetailKeys;
        //   // Encode the appState object
        //   appStateEncoded = this.compressAndEncode(appState);
        //   newUrl = `${baseUrl}&/details/ShippingRequestId=${appState.selectedItem}/picktaskdetail/${appState.selectedDetailKeys.DELIVERY_NR}/${appState.selectedDetailKeys.DELIVERY_ITEM_NR}/${appState.selectedDetailKeys.MATERIAL_NR}/${appState.selectedDetailKeys.STATUS}/?appState=${appStateEncoded}`;
      } else if (appState && appState.selectedItem) {
        // Encode the appState object
        appStateEncoded = this.compressAndEncode(appState);
        // If only selectedItem exists
        newUrl = `${baseUrl}&/details/ShippingRequestId=${appState.selectedItem}/?appState=${appStateEncoded}`;
      } else if (appState) {
        // Encode the appState object
        appStateEncoded = this.compressAndEncode(appState);
        // Default case, no selectedDetailKeys or selectedItem
        newUrl = `${baseUrl}?appState=${appStateEncoded}`;
      } else {
        newUrl = baseUrl; // No appState, so keep the base URL
      }


      appStateModel.setProperty("/appState", appStateEncoded);

      // Update the browser's URL without reloading the page
      window.history.replaceState({ path: newUrl }, "", newUrl);
    },

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

    _restoreAppState: function (appState) {
      this._isRestoringState = true; // Flag to indicate restoration is in progress

      if (appState.filters) {
        this._applyFilters(appState.filters, true); // Pass isRestoring = true
      }
      if (appState.selectedItem) {
        this._restoreSelectedItem(appState);
      }
      if (appState.filterVisibility) {
        this._restoreFilterVisibility(appState.filterVisibility);
      }

      this._isRestoringState = false; // Reset the flag
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
      const shippingRequestId = this.getView().byId("idShippingRequestItemFilter").getValue();
      const status = this.getView().byId("statusFilter").getSelectedKeys();
      const customerId = this.getView().byId("customerIdFilter").getValue();
      const plantOrigin = this.getView().byId("plantOriginFilter").getValue();
      const createdBy = this.getView().byId("createdByFilter").getValue();

      // Add filters based on values
      if (shippingRequestId) {
        aFilters.push(new Filter("ShippingRequestId", FilterOperator.EQ, shippingRequestId));
      }

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
      const oContext = oSelectedItem.getBindingContext();
      const selectedItemId = oContext ? oContext.getProperty("ShippingRequestId") : null;

      if (!selectedItemId) {
        return;
      }

      // Update the app view layout and navigate
      this.getModel("appView").setProperty("/layout", "TwoColumnsBeginExpanded");

      this.getRouter().navTo("Details", {
        SHIPPING_REQUEST_ID: selectedItemId
      }, { replace: true });

      this._isListClicked = true;

      this._saveAppState(2);

      let appStateModel = this.getOwnerComponent().getModel("appStateModel");
      appStateModel.setProperty("/clicked", true);
      appStateModel.setProperty("/viewsNr", 2);
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
          }
        });

        // Optionally trigger the search to update the results
        this.filterTable({}, false);
        // this._saveAppState();
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

    // _loadDefaultView: function () {
    //   this.filterTable({});
    // },
  });
});