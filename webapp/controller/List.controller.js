sap.ui.define([
  "./BaseController",
  "br/com/challenge/monitor/challengemonitor/utils/formatter",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "br/com/challenge/monitor/challengemonitor/utils/SearchHelp",
  "sap/m/MessageBox",
  "sap/m/BusyDialog",
  "br/com/challenge/monitor/challengemonitor/utils/MessagePopover",
  "br/com/challenge/monitor/challengemonitor/utils/PrintForms",
  "sap/ui/Device"
],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (BaseController,
    formatter,
    Filter,
    FilterOperator,
    SearchHelp,
    MessageBox,
    BusyDialog,
    MessagePopoverHook,
    PrintForms,
    Device
  ) {
    "use strict";

    return BaseController.extend("br.com.challenge.monitor.challengemonitor.controller.List", {
      Formatter: formatter,
      SearchHelp: SearchHelp,
      onInit: function () {

        let popMsgModel = this.getOwnerComponent().getModel("popoverModel");

        this.getView().byId("shippingsTable").attachEventOnce("updateFinished", this._restoreAppState, this);

      },

      _restoreAppState: function () {
        // Retrieve the encoded app state string from the URL
        let appStateEncoded = this.getAppStateFromUrl();
        debugger;
        var oAppStateData = this.decompressAndDecode(appStateEncoded);

        if (oAppStateData) {
            // Apply the application state
            this._applyAppState(oAppStateData);

            // Optionally, restore filters if they are stored together
            this._applyFilters(oAppStateData.filters);
        } else {
          console.warn("No application state data found in the URL.");
        }
      },

      _applyFilters: function (filters) {
        // Apply filters to respective filter fields
        if (filters) {
          this.getView().byId("idShippingRequestItemFilter").setValue(filters.shippingRequestId);
          this.getView().byId("statusFilter").setSelectedKeys(filters.status);
          this.getView().byId("customerIdFilter").setValue(filters.customerId);
          this.getView().byId("plantOriginFilter").setValue(filters.plantOrigin);
          this.getView().byId("createdByFilter").setValue(filters.createdBy);

          // Trigger search or update view as per your application flow
          this.onFilterBarSearch(filters);
        }
      },

      _applyAppState: function (oData) {

        if (oData) {
          let oList = this.getView().byId("shippingsTable");
          let aItems = oList.getItems();
          aItems.forEach((oItem) => {
            let oBindingContext = oItem.getBindingContext();
            let oItemData = oBindingContext.getObject();
            if (oItemData.ShippingRequestId === oData.shippingRequestId) {
              oList.setSelectedItem(oItem);
              oList.scrollToIndex(oList.indexOfItem(oItem));
              let oDetailModel = this.getOwnerComponent().getModel("detailModel");
              oDetailModel.setProperty("/showListFooter", oData.showListFooter);
              oDetailModel.setProperty("/showDetailFooter", oData.showDetailFooter);
              // Navigate to Details view with selected ShippingRequestId
              let bReplace = !sap.ui.Device.system.phone;
              this.getModel("appView").setProperty("/layout", oData.appView.layout);
              this.getRouter().navTo(
                "Details",
                {
                  SHIPPING_REQUEST_ID: oData.shippingRequestId
                },
                bReplace
              );

            }
          });

        } else {
          // Handle case where no item was selected or oData.listSelected is not valid
          // Adjust UI or show appropriate message
        }
      },

      _storeAppState: function () {
        let oSelectedItems = this.getView().byId("shippingsTable").getSelectedItems();

        let shippingRequestIdFilterValue = this.getView().byId("idShippingRequestItemFilter").getValue();
        let statusFilter = this.getView().byId("statusFilter").getSelectedKeys();
        let customerIdFilterValue = this.getView().byId("customerIdFilter").getValue();
        let plantOriginFilterValue = this.getView().byId("plantOriginFilter").getValue();
        let createdByFilterValue = this.getView().byId("createdByFilter").getValue();
        let oShippingRequestId = "";
        //get the detailModel values for footers
        let oDetailModel = this.getOwnerComponent().getModel("detailModel");
        let showListFooter = oDetailModel.getProperty("/showListFooter");
        let showDetailFooter = oDetailModel.getProperty("/showDetailFooter");

        if (oSelectedItems.length > 0) {
          oShippingRequestId = oSelectedItems[0].getBindingContext().getProperty("ShippingRequestId");
        }
        let oAppStateData = {
          shippingRequestId: oShippingRequestId,
          showListFooter: showListFooter,
          showDetailFooter: showDetailFooter,
          filters: {
            shippingRequestId: shippingRequestIdFilterValue,
            status: statusFilter,
            customerId: customerIdFilterValue,
            plantOrigin: plantOriginFilterValue,
            createdBy: createdByFilterValue
          }
        };

        this._onUpdateUrl(oAppStateData)

      },

      _onUpdateUrl: function (oAppStateData) {
        debugger;
        var oUrl = this.getAppStateFromUrl();
        const appStateEncoded = this.compressAndEncode(oAppStateData);

        // var hasParams = window.location.href.indexOf('?') > -1;
        var updatedUrl = '';

        if (oUrl) {
          updatedUrl = window.location.href.replace(/appState=([^&]*)/, 'appState=' + appStateEncoded);
        } else {
          updatedUrl = window.location.href + '?appState=' + appStateEncoded;
        }

        // Replace the URL in the browser history without reloading
        window.history.replaceState({}, '', updatedUrl);
      },

      onExit: function () {
        this._storeAppState();
      },

      onSelectedItem: function (oEvent) {
        let bReplace = !Device.system.phone;
        let oSelectedItem = oEvent.getParameter("listItem");
        let oContext = oSelectedItem.getBindingContext();
        let oShippingRequestId = oContext.getProperty("ShippingRequestId");
        let oDetailModel = this.getOwnerComponent().getModel("detailModel");
        oDetailModel.setProperty("/showListFooter", false);
        oDetailModel.setProperty("/showDetailFooter", true);
        debugger;
        var oUrl = this.getAppStateFromUrl();
        var oAppStateData = {};
        if (oUrl) {
          oAppStateData = this.decompressAndDecode(oUrl);
        }
        oAppStateData.shippingRequestId = oShippingRequestId;
        oAppStateData.showListFooter = false;
        oAppStateData.showDetailFooter = true;
        oAppStateData.appView = {
          layout: "TwoColumnsBeginExpanded"
        }

        this.getModel("appView").setProperty("/layout", "TwoColumnsBeginExpanded");
        this.getRouter().navTo(
          "Details",
          {
            SHIPPING_REQUEST_ID: oShippingRequestId,
          },
          bReplace
        );

        // Update the URL after navTo completes
        setTimeout(() => {
          this._onUpdateUrl(oAppStateData);
        }, 0);
      },

      getRouter: function () {
        return this.getOwnerComponent().getRouter();
      },

      getModel: function (sName) {
        return this.getView().getModel(sName);
      },

      onFilterBarSearch: function (event) {

        if (event && event.getSource && event.getSource().getMetadata().getName() === "sap.ui.comp.filterbar.FilterBar") {
          // Store the application state only for a button event
          this._storeAppState();
        }

        let shippingRequestIdFilter = this.getView().byId("idShippingRequestItemFilter");
        let statusFilter = this.getView().byId("statusFilter");
        let customerIdFilter = this.getView().byId("customerIdFilter");
        let plantOriginFilter = this.getView().byId("plantOriginFilter");
        let createdByFilter = this.getView().byId("createdByFilter");

        let aFilters = [];

        if (shippingRequestIdFilter.getValue()) {
          aFilters.push(
            new Filter({
              path: "ShippingRequestId",
              operator: FilterOperator.EQ,
              value1: shippingRequestIdFilter.getValue()
            })
          );
        }
        if (statusFilter) {
          let aStatusFilters = [];
          let aSelectedKeys = statusFilter.getSelectedKeys();
          if (aSelectedKeys.length > 0) {
            aSelectedKeys.forEach(function (sKey) {
              aStatusFilters.push(new Filter({
                path: "Status",
                operator: FilterOperator.Contains,
                value1: sKey
              }));
            });
            aFilters.push(new Filter({
              filters: aStatusFilters,
              and: false
            }))

          }

        }
        if (customerIdFilter.getValue()) {
          aFilters.push(
            new Filter({
              path: "CustomerId",
              operator: FilterOperator.Contains,
              value1: customerIdFilter.getValue()
            })
          )
        }
        if (plantOriginFilter.getValue()) {
          aFilters.push(
            new Filter({
              path: "PlantOrigin",
              operator: FilterOperator.Contains,
              value1: plantOriginFilter.getValue()
            })
          );
        }
        if (createdByFilter.getValue()) {
          aFilters.push(
            new Filter({
              path: "CreatedBy",
              operator: FilterOperator.Contains,
              value1: createdByFilter.getValue()
            })
          );
        }
        let oFinalFilter = new Filter({
          filters: aFilters,
          and: true
        });

        var oTable = this.getView().byId("shippingsTable");
        let oBinding = oTable.getBinding("items");
        oBinding.filter(oFinalFilter);

      },

      onMessagesButtonPress: function (oEvent) {
        MessagePopoverHook.onMessagesPopoverOpen(oEvent);
      },

      onPrintForms: function () {
        let oModel = this.getView().getModel();
        let oTable = this.getView().byId("shippingsTable");
        let oSelectedItem = oTable.getSelectedItem();
        this._oBundle = this.getView().getModel("i18n").getResourceBundle();


        if (!oSelectedItem) {
          MessageBox.warning(that._oBundle.getText("lvSelectAtLeastOneShippingRequest"));
          return;
        }

        let that = this
        let oContext = oSelectedItem.getBindingContext();
        PrintForms.onPrintPress(this.getView(), oContext);
      },

    });

  });
