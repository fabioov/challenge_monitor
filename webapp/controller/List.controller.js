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
    BusyDialog,
    ODataModel,
    MessagePopoverHook,
    PrintForms,
    Device
  ) {
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

        if (oSelectedItems.length > 0) {
          oShippingRequestId = oSelectedItems[0].getBindingContext().getProperty("ShippingRequestId");
        }
        let oAppStateData = {
          shippingRequestId: oShippingRequestId,
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

      onChangeStatus: function (oEvent) {
        let oModel = this.getView().getModel();
        let oTable = this.getView().byId("shippingsTable");
        let oSelectedItem = oTable.getSelectedItem();
        let that = this
        this._oBundle = this.getView().getModel("i18n").getResourceBundle();

        if (!oSelectedItem) {
          MessageBox.warning(that._oBundle.getText("lvSelectAtLeastOneShippingRequest"));
          return;
        }


        let oContext = oSelectedItem.getBindingContext();
        let sPath = oContext.getPath();
        let shippingRequest = oContext.getObject();
        delete shippingRequest.__metadata;
        var sStatus = shippingRequest.Status === "K" ? that._oBundle.getText("statusK") :
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
                      let oBinding = oTable.getBinding("items");
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

      onError: function () {
        MessagePopoverHook.onErrorMessage(this.getView());
        MessagePopoverHook.onSuccessMessage(this.getView());
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

      onDeleteShippingRequest: function () {
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
        let sPath = oContext.getPath();
        let shippingRequest = oContext.getObject();

        if (shippingRequest.Status === "X") {
          MessageBox.warning(that._oBundle.getText("lvShippingRequestAlreadyCancelled", [shippingRequest.ShippingRequestId]));
          return;
        }
        delete shippingRequest.__metadata;

        MessageBox.confirm(this._oBundle.getText("lvConfirmCancelShippingRequest", [shippingRequest.ShippingRequestId]),
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
                oModelSend.remove(sPath, {
                  success: function (data, response) {
                    if (response.statusCode === '204') {
                      let oParams = {
                        type: "Success",
                        title: that._oBundle.getText("lvStatusCancelledSuccessfully", [shippingRequest.ShippingRequestId])
                      };
                      MessagePopoverHook.onSetMessage(that.getView(), oParams);
                      MessageBox.success(oParams.title);
                      that._oBusyDialog.close();
                      let oBinding = oTable.getBinding("items");
                      oBinding.refresh();
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
                })
              }, 3000);
            }
          }
        );

      },


    });

  });
