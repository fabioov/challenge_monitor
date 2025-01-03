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

      this._appStateEncoded = this.getAppStateFromUrl();
      if (this._appStateEncoded) {
        const appState = this.decompressAndDecode(this._appStateEncoded);
        this._restoreAppState(appState);
        this._saveToAppStateModel(this._appStateEncoded);
      }
    },

    _saveToAppStateModel: function (appState) {
      let appStateModel = this.getOwnerComponent().getModel("appStateModel");
      appStateModel.setProperty("/appState", appState);
    },

    _saveAppState: function () {
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

      // Encode the appState object
      const appStateEncoded = this.compressAndEncode(appState);

      // Construct the new URL based on whether appState.selectedItem exists
      let newUrl;
      if (appState.selectedItem) {
        newUrl = `${baseUrl}&/details/ShippingRequestId=${appState.selectedItem}/?appState=${appStateEncoded}`;
      } else {
        newUrl = `${baseUrl}?appState=${appStateEncoded}`;
      }

      // Update the browser's URL without reloading the page
      window.history.replaceState({ path: newUrl }, "", newUrl);
    },

    _restoreAppState: function (appState) {
      this._isRestoringState = true; // Flag to indicate restoration is in progress

      if (appState.filters) {
        this._applyFilters(appState.filters, true); // Pass isRestoring = true
      }
      if (appState.selectedItem) {
        this._restoreSelectedItem(appState.selectedItem);
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
        this._saveAppState();
      }
    },

    _restoreSelectedItem: function (selectedItemId) {
      const oTable = this.getView().byId("shippingsTable");
      const aItems = oTable.getItems();

      aItems.forEach((item) => {
        const context = item.getBindingContext();
        const itemData = context.getObject();

        if (itemData.ShippingRequestId === selectedItemId) {
          // Select the item and scroll to it
          oTable.setSelectedItem(item);
          oTable.scrollToIndex(oTable.indexOfItem(item));

          // Clear existing views to avoid duplicates
          const oFlexibleColumnLayout = this.byId("layout");
          if (oFlexibleColumnLayout) {
            oFlexibleColumnLayout.removeAllMidColumnPages(); // Clear midColumnPages
            oFlexibleColumnLayout.removeAllEndColumnPages(); // Clear endColumnPages
          }

          // Set layout and navigate to Details
          this._getModel("appView").setProperty("/layout", "TwoColumnsBeginExpanded");
          this._getRouter().navTo("Details", {
            SHIPPING_REQUEST_ID: selectedItemId
          });

          // Do not save the appState during restoration
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

    // Utility functions
    _getModel: function (sName) {
      return this.getOwnerComponent().getModel(sName) || this.getView().getModel(sName);
    },

    _getRouter: function () {
      return this.getOwnerComponent().getRouter();
    },

    // Event Handlers
    onFilterBarSearch: function () {
      this._saveAppState();
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
      this._getModel("appView").setProperty("/layout", "TwoColumnsBeginExpanded");

      this._getRouter().navTo("Details", {
        SHIPPING_REQUEST_ID: selectedItemId
      }, { replace: true });

      this._saveAppState(); // Save the updated app state
      debugger;
      let sAppState = this.getAppStateFromUrl();
      this._saveToAppStateModel(sAppState);
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
        this._saveAppState();
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