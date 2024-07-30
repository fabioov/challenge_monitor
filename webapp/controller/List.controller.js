sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "br/com/challenge/monitor/challengemonitor/utils/formatter",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "br/com/challenge/monitor/challengemonitor/utils/SearchHelp",
  "sap/m/MessageBox",
  "sap/m/BusyDialog",
  "sap/ui/model/odata/v2/ODataModel",
  "br/com/challenge/monitor/challengemonitor/utils/MessagePopover",
  "br/com/challenge/monitor/challengemonitor/utils/PrintForms",
  "sap/ui/Device"
],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller,
    formatter,
    Filter,
    FilterOperator,
    SearchHelp,
    MessageBox,
    MessagePopoverHook,
    PrintForms,
    Device) {
    "use strict";

    return Controller.extend("br.com.challenge.monitor.challengemonitor.controller.List", {
      Formatter: formatter,
      SearchHelp: SearchHelp,
      onInit: function () {

        let popMsgModel = this.getOwnerComponent().getModel("popoverModel");

        this.getView().byId("shippingsTable").attachEventOnce("updateFinished", this._restoreAppState, this);

      },

      _restoreAppState: function () {

        // Retrieve from session storage
        let oAppStateData = jQuery.sap.storage(jQuery.sap.storage.Type.session).get("myAppState");

        if (oAppStateData) {
          // Apply application state
          this._applyAppState(oAppStateData);
          console.log("Restored Application State Data:", oAppStateData);

          // Optionally, restore filters if they are stored together
          this._applyFilters(oAppStateData.filters);
        } else {
          console.warn("No application state data found in session storage.");
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
              this.getModel("appView").setProperty("/layout", "TwoColumnsBeginExpanded");
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
        jQuery.sap.storage(jQuery.sap.storage.Type.session).put("myAppState", oAppStateData);
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

        this._storeAppState();

        this.getModel("appView").setProperty("/layout", "TwoColumnsBeginExpanded");
        this.getRouter().navTo(
          "Details",
          {
            SHIPPING_REQUEST_ID: oShippingRequestId,
          },
          bReplace
        );
      },

      getRouter: function () {
        return this.getOwnerComponent().getRouter();
      },

      getModel: function (sName) {
        return this.getView().getModel(sName);
      },

      onFilterBarSearch: function (event) {

        this._storeAppState();

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

        console.log(oBinding);

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
