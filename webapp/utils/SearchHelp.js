sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
], function(
	Filter,
    FilterOperator,
    Fragment
) {
	"use strict";

	let SearchHelp = {

        onShippingId: function (oEvent) {
            this._oInput = oEvent.getSource().getId();
            let oView = this.getView();

            if (!this._ShippingIdSearchHelp) {
                this._ShippingIdSearchHelp = Fragment.load({
                    id: oView.getId(),
                    name: "br.com.challenge.monitor.challengemonitor/fragments/ShippingId",
                    controller: this,
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                })
            }
            
            this._ShippingIdSearchHelp.then(function (oDialog) {
                oDialog.getBinding("items").filter([]);
                oDialog.open();
            })
        },

        onCustomerId: function (oEvent) {
            this._oInput = oEvent.getSource().getId();
            let oView = this.getView();

            if (!this._CustomerIdSearchHelp) {
                this._CustomerIdSearchHelp = Fragment.load({
                    id: oView.getId(),
                    name: "br.com.challenge.monitor.challengemonitor/fragments/CustomerId",
                    controller: this,
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                })
            }
            
            this._CustomerIdSearchHelp.then(function (oDialog) {
                oDialog.getBinding("items").filter([]);
                oDialog.open();
            })
        },
        onPlant: function (oEvent) {
            this._oInput = oEvent.getSource().getId();
            let oView = this.getView();

            if (!this._PlantSearchHelp) {
                this._PlantSearchHelp = Fragment.load({
                    id: oView.getId(),
                    name: "br.com.challenge.monitor.challengemonitor/fragments/Plant",
                    controller: this,
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                })
            }
            
            this._PlantSearchHelp.then(function (oDialog) {
                oDialog.getBinding("items").filter([]);
                oDialog.open();
            })
        },
        onUser: function (oEvent) {
            this._oInput = oEvent.getSource().getId();
            let oView = this.getView();

            if (!this._UserSearchHelp) {
                this._UserSearchHelp = Fragment.load({
                    id: oView.getId(),
                    name: "br.com.challenge.monitor.challengemonitor/fragments/User",
                    controller: this,
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                })
            }
            
            this._UserSearchHelp.then(function (oDialog) {
                oDialog.getBinding("items").filter([]);
                oDialog.open();
            })
        },
        onShippingHelpSearch: function (event) {
            let sValue = event.getParameter("value");
  
            let oFilter2 = { filters: [], and: false };
  
            oFilter2.filters.push(
              new Filter({
                path: "ShippingRequestId",
                operator: FilterOperator.Contains,
                value1: sValue,
              })
            );
            oFilter2.filters.push(
              new Filter({
                path: "StatusDescription",
                operator: FilterOperator.Contains,
                value1: sValue,
              })
            );
            oFilter2.filters.push(
                new Filter({
                  path: "CreatedBy",
                  operator: FilterOperator.Contains,
                  value1: sValue,
                })
              );
  
            let oFilter3 = new Filter(oFilter2);
            event.getSource().getBinding("items").filter([oFilter3]);
          },

          onCustomerHelpSearch: function (event) {
            let sValue = event.getParameter("value");

            let oFilter2 = { filters: [], and: false };
  
            oFilter2.filters.push(
              new Filter({
                path: "Kunnr",
                operator: FilterOperator.Contains,
                value1: sValue,
              })
            );
            oFilter2.filters.push(
              new Filter({
                path: "Name",
                operator: FilterOperator.Contains,
                value1: sValue,
              })
            );
            oFilter2.filters.push(
                new Filter({
                  path: "Country",
                  operator: FilterOperator.Contains,
                  value1: sValue,
                })
              );
  
            let oFilter3 = new Filter(oFilter2);
            event.getSource().getBinding("items").filter([oFilter3]);
          },

          onPlantHelpSearch: function (event) {
            let sValue = event.getParameter("value");

  
            let oFilter2 = { filters: [], and: false };
  
            oFilter2.filters.push(
              new Filter({
                path: "Plant",
                operator: FilterOperator.Contains,
                value1: sValue,
              })
            );
            oFilter2.filters.push(
              new Filter({
                path: "Name",
                operator: FilterOperator.Contains,
                value1: sValue,
              })
            );
            oFilter2.filters.push(
                new Filter({
                  path: "Country",
                  operator: FilterOperator.Contains,
                  value1: sValue,
                })
              );
  
            let oFilter3 = new Filter(oFilter2);
            event.getSource().getBinding("items").filter([oFilter3]);
          },

          onUserHelpSearch: function (event) {
            let sValue = event.getParameter("value");
   
  
            let oFilter2 = { filters: [], and: false };
  
            oFilter2.filters.push(
              new Filter({
                path: "UserName",
                operator: FilterOperator.Contains,
                value1: sValue,
              })
            );
            oFilter2.filters.push(
              new Filter({
                path: "FirstName",
                operator: FilterOperator.Contains,
                value1: sValue,
              })
            );
            oFilter2.filters.push(
                new Filter({
                  path: "LastName",
                  operator: FilterOperator.Contains,
                  value1: sValue,
                })
              );
  
            let oFilter3 = new Filter(oFilter2);
            event.getSource().getBinding("items").filter([oFilter3]);
          },
  
          onValueHelpClose: function (event) {
            let oSelectedItem = event.getParameter("selectedItem");
            let oInput = null;
  
            if (this.byId(this._oInput)) {
              oInput = this.byId(this._oInput);
            } else {
              oInput = sap.ui.getCore().byId(this._oInput);
            }
  
            if (!oSelectedItem) {
              oInput.resetProperty("value");
              return;
            }
  
            oInput.setValue(oSelectedItem.getTitle());
          },


    }

    return SearchHelp;
}, true);