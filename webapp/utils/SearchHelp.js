sap.ui.define([
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/Fragment",
  'sap/m/Label',
  'sap/m/SearchField',
  'sap/m/Token',
  'sap/ui/table/Column',
  'sap/m/Column',
  'sap/m/Text'
], function (
  Filter,
  FilterOperator,
  Fragment,
  Label,
  SearchField,
  Token,
  UIColumn,
  MColumn,
  Text
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


    // On Value Help Request //
    onValueHelpRequest: function (event) {
      var oTextTemplate = new Text({ text: { path: 'ShippingRequestId' }, renderWhitespace: true });

      // Load the Value Help Dialog fragment
      if (!this._oValueHelpDialog) {
        Fragment.load({
          name: "br.com.challenge.monitor.challengemonitor.fragments.ShippingIdWithSuggestions",
          controller: this,
        }).then(function (oDialog) {
          var oFilterBar = oDialog.getFilterBar();
          var oShippingRequestId, oStatusDescription, oStatus;

          this._oValueHelpDialog = oDialog;

          this.getView().addDependent(oDialog);

          this._oBasicSearchField = new SearchField({
            search: function () {
              this._oValueHelpDialog.getFilterBar().search();
            }.bind(this)
          });

          // // Set Range Key Fields
          this._oValueHelpDialog.setRangeKeyFields([
            {
              label: "Shipping Request ID",
              key: "ShippingRequestId",
              type: "string",
              visibleInFilterBar: true
            },
          //   {
          //     label: "Status",
          //     key: "Status",
          //     type: "string",
          //     visibleInFilterBar: true
          //   }
          ]);

          // Configure the FilterBar
          oFilterBar.setFilterBarExpanded(false);
          oFilterBar.setBasicSearch(this._oBasicSearchField);

          var oFilterItem = oFilterBar.determineFilterItemByName("ShippingRequestId");
          if (oFilterItem) {
            oFilterItem.getControl().setTextFormatter(this._inputTextFormatter);
          }

          // Configure Table Columns and Bindings
          this._oValueHelpDialog.getTableAsync().then(function (oTable) {
            oTable.setModel(this.oModel);

            // For Desktop/Table devices
            if (oTable.bindRows) {
              oShippingRequestId = new UIColumn({
                label: new Label({ text: "Shipping Request ID" }),
                template: oTextTemplate
              });
              oShippingRequestId.data({ fieldName: "ShippingRequestId" });
              oTable.addColumn(oShippingRequestId);

              oStatus = new UIColumn({
                label: new Label({ text: "Status" }),
                template: new Text({ text: "{Status}" })
              });
              oStatus.data({ fieldName: "Status" });
              oTable.addColumn(oStatus);

              oStatusDescription = new UIColumn({
                label: new Label({ text: "Status Description" }),
                template: new Text({ text: "{StatusDescription}" })
              });
              oStatusDescription.data({ fieldName: "StatusDescription" });
              oTable.addColumn(oStatusDescription);

              oTable.bindAggregation("rows", {
                path: "/ZRFSFBP_SH_SHIPPING_ID",
                events: {
                  dataReceived: function () {
                    this._oValueHelpDialog.update();
                  }.bind(this)
                }
              });
            }

            // For Mobile devices (sap.m.Table)
            if (oTable.bindItems) {
              oTable.addColumn(new MColumn({ header: new Label({ text: "Shipping RequestId" }) }));
              oTable.addColumn(new MColumn({ header: new Label({ text: "Status" }) }));
              oTable.addColumn(new MColumn({ header: new Label({ text: "Status Description" }) }));
              oTable.bindItems({
                path: "/ZRFSFBP_SH_SHIPPING_ID",
                template: new ColumnListItem({
                  cells: [
                    new Text({ text: "{ShippingRequestId}" }),
                    new Text({ text: "{Status}" }),
                    new Text({ text: "{StatusDescription}" })
                  ]
                }),
                events: {
                  dataReceived: function () {
                    this._oValueHelpDialog.update();
                  }.bind(this)
                }
              });
            }

            this._oValueHelpDialog.update();
          }.bind(this));

          this._oValueHelpDialog.open();
        }.bind(this));
      } else {
        this._oValueHelpDialog.open();
      }
    },


    _inputTextFormatter: function (oItem) {
      var sOriginalText = oItem.getText();
      var sWhitespace = " ";
      var sUnicodeWhitespaceCharacter = "\u00A0"; // Non-breaking whitespace

      if (typeof sOriginalText !== "string") {
        return sOriginalText;
      }

      return sOriginalText.replaceAll((sWhitespace + sUnicodeWhitespaceCharacter), (sWhitespace + sWhitespace));
    },

    // End of Value Help Request //

    // Value Help Functions //
    onValueHelpWithSuggestionsOkPress: function (event) {
      debugger;
      var aTokens = event.getParameter("tokens");

      // Set tokens back to the input field
      var oInput = this.getView().byId("idShippingRequestItemFilter");
      oInput.setTokens(aTokens);

      // Close the dialog
      this._oValueHelpDialog.close();
    },
    onValueHelpWithSuggestionsCancelPress: function () {
      this._oValueHelpDialog.close();
    },
    onValueHelpWithSuggestionsAfterClose: function (event) {
      if (this._oValueHelpDialog) {
        this._oValueHelpDialog.destroy();
        this._oValueHelpDialog = null; // Ensure the reference is reset
      }
    },

    onFilterBarWithSuggestionsSearch: function (oEvent) {
      var sSearchQuery = this._oBasicSearchField.getValue(); // Basic Search Query
      var aSelectionSet = oEvent.getParameter("selectionSet"); // Filters in FilterBar

      // Reduce the selection set to create filters for controls with values
      var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
        if (oControl.getValue()) {
          var sFilterPath = oControl.getName(); // 'ShippingRequestId' or 'Status'

          // For other fields, use the visible value
          aResult.push(new Filter({
            path: sFilterPath,
            operator: FilterOperator.Contains,
            value1: oControl.getValue()
          }));
        }
        return aResult;
      }, []);

      // Add additional filters for the basic search query
      if (sSearchQuery) {
        aFilters.push(new Filter({
          filters: [
            new Filter({ path: "ShippingRequestId", operator: FilterOperator.Contains, value1: sSearchQuery }),
            new Filter({ path: "StatusDescription", operator: FilterOperator.Contains, value1: sSearchQuery }),
            new Filter({ path: "Status", operator: FilterOperator.Contains, value1: sSearchQuery })
          ],
          and: false
        }));
      }


      // try something different

      var oValueHelpDialog = this._oValueHelpDialog; // Access the dialog
      if (!oValueHelpDialog) {
        console.warn("ValueHelpDialog is not initialized.");
        return;
      }

      // Get the table from the dialog
      oValueHelpDialog.getTableAsync().then(function (oTable) {
        if (!oTable) {
          console.error("Table is not available in the ValueHelpDialog.");
          return;
        }

        if (oTable.bindRows) {
          // For sap.ui.table.Table (Desktop)
          var oBinding = oTable.getBinding("rows");
          if (oBinding) {
            oBinding.filter(aFilters);
          }
        }

        if (oTable.bindItems) {
          // For sap.m.Table (Mobile)
          var oBinding = oTable.getBinding("items");
          if (oBinding) {
            oBinding.filter(aFilters);
          }
        }

      // Log the table items
      if (oTable.getItems) {
        console.log(oTable.getItems());
      } else if (oTable.getRows) {
        console.log(oTable.getRows());
      }

        // Update the dialog
        oValueHelpDialog.update();
      });

    },

    _filterTableWhitespace: function (oFilter) {
      var oValueHelpDialog = this._oValueHelpDialog; // Access the dialog
      if (!oValueHelpDialog) {
        console.warn("ValueHelpDialog is not initialized.");
        return;
      }

      // Get the table from the dialog
      oValueHelpDialog.getTableAsync().then(function (oTable) {
        if (!oTable) {
          console.error("Table is not available in the ValueHelpDialog.");
          return;
        }

        if (oTable.bindRows) {
          // For sap.ui.table.Table (Desktop)
          var oBinding = oTable.getBinding("rows");
          if (oBinding) {
            oBinding.filter(oFilter);
          }
        }

        if (oTable.bindItems) {
          // For sap.m.Table (Mobile)
          var oBinding = oTable.getBinding("items");
          if (oBinding) {
            oBinding.filter(oFilter);
          }
        }

        // Update the dialog
        oValueHelpDialog.update();
      });
    },

  }

  return SearchHelp;
}, true);