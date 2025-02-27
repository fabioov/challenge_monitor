sap.ui.define(
  [
    "./BaseController",
    "br/com/challenge/monitor/challengemonitor/utils/formatter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "br/com/challenge/monitor/challengemonitor/utils/MessagePopover",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
  ],
  function (
    BaseController,
    formatter,
    JSONModel,
    Filter,
    FilterOperator,
    Fragment,
    MessagePopoverHook,
    BusyDialog,
    MessageBox
  ) {
    "use strict";

    return BaseController.extend(
      "br.com.challenge.monitor.challengemonitor.controller.PickTaskDetail",
      {
        Formatter: formatter,

        onInit: function () {
          this.getOwnerComponent()
            .getRouter()
            .getRoute("PickTaskDetail")
            .attachPatternMatched(this._onPickTaskDetailsMatched, this);

          let popMsgModel = sap.ui.getCore().getModel("popoverModel");
        },

        _saveState: function (appState, keys) {
          let appStateCompressed = this.compressAndEncode(appState);
          let baseUrl = this._baseUrl();

          const newUrl = `${baseUrl}&/details/ShippingRequestId=${appState.selectedItem}/picktaskdetail/${appState.selectedDetailKeys.DELIVERY_NR}/${appState.selectedDetailKeys.DELIVERY_ITEM_NR}/${appState.selectedDetailKeys.MATERIAL_NR}/?appState=${appStateCompressed}`;

          const currentUrl = window.location.href;
          if (currentUrl !== newUrl) {
            window.history.replaceState({ path: newUrl }, "", newUrl);
          }

          let oAppStateModel =
            this.getOwnerComponent().getModel("appStateModel");
          oAppStateModel.setProperty("/appState", appStateCompressed);
        },

        _baseUrl: function () {
          const currentUrl = window.location.href;

          // Split by hash "#" to isolate the part of the URL after it
          const [urlBeforeHash, hashFragment] = currentUrl.split("#");

          if (!hashFragment) return urlBeforeHash; // Return the full URL if no hash fragment exists

          // Extract the base part before "&/details/"
          const baseHash = hashFragment.split("&/details/")[0];

          // Ensure the base ends with "-display"
          const [cleanBaseHash] = baseHash.includes("?")
            ? baseHash.split("?")
            : [baseHash];

          // Construct the final base URL
          const finalBaseUrl = `${urlBeforeHash}#${cleanBaseHash}`;

          return finalBaseUrl;
        },

        _getCurrentState: function () {
          const oAppState = this.getOwnerComponent().getModel("appStateModel");
          const currentAppState = oAppState.getData();
          return this.decompressAndDecode(currentAppState.appState);
        },

        _onPickTaskDetailsMatched: function (oEvent) {
          let oView = this.getView();
          let oModel = oView.getModel();
          let appState = this._getCurrentState();
          let oBundle = this.getView().getModel("i18n").getResourceBundle();
          let shippingRequestId =
            "0000000" + oEvent.getParameter("arguments").SHIPPING_REQUEST_ID;
          let deliveryNr = oEvent.getParameter("arguments").DELIVERY_NR;
          let deliveryItemNr =
            oEvent.getParameter("arguments").DELIVERY_ITEM_NR;
          let materialNr = oEvent.getParameter("arguments").MATERIAL_NR;

          let keys = {
            SHIPPING_REQUEST_ID: shippingRequestId,
            DELIVERY_NR: deliveryNr,
            DELIVERY_ITEM_NR: deliveryItemNr,
            MATERIAL_NR: materialNr,
          };

          this._saveState(appState, keys);

          let that = this;

          var sPath = oModel.createKey("/ZRFSFBPCDS0002", {
            SHIPPING_REQUEST_ID: shippingRequestId,
            DELIVERY_NR: deliveryNr,
            DELIVERY_ITEM_NR: deliveryItemNr,
            MATERIAL_NR: materialNr,
          });

          oView.bindElement({
            path: sPath,
            events: {
              change: this._onBindingChange.bind(this),
              dataRequested: function () {
                oView.setBusy(true);
              },
              dataReceived: function (oData) {
                let data = oData.mParameters.data;

                let quantityProgressValue =
                  data.QUANTITY_PICKED > 0
                    ? (data.QUANTITY_PICKED / data.QUANTITY) * 100
                    : 0;

                that._getShippingStatus(
                  shippingRequestId,
                  function (shippingStatus) {
                    let oPickDetailsModel = new JSONModel();
                    oPickDetailsModel.setProperty(
                      "/SHIPPING_REQUEST_STATUS",
                      shippingStatus
                    );
                    oPickDetailsModel.setProperty(
                      "/quantityProgress",
                      quantityProgressValue.toFixed(2) + " %"
                    );

                    oView.setModel(oPickDetailsModel, "PickTaskDetail");
                    oView.setBusy(false);
                  }
                );
              },
              error: function (oError) {
                oView.setBusy(false);
                console.error(oBundle.getText("pdtErrorFetchingData"), oError);
              },
            },
          });
        },

        _getShippingStatus: function (shippingRequestId, callback) {
          let oView = this.getView();
          let oModel = oView.getModel();

          oModel.callFunction("/GetShippingStatus", {
            method: "GET",
            urlParameters: { ShippingRequestId: shippingRequestId },
            success: function (oData) {
              debugger;
              if (callback) callback(oData.Status);
            },
            error: function (oError) {
              console.error("Error fetching shipping status:", oError);
              if (callback) callback(null);
            },
          });
        },

        _onBindingChange: function (oEvent) {
          var oView = this.getView();
          var oElementBinding = oEvent.getSource();
          // // No data for the binding
          // if (!oElementBinding.getBoundContext()) {
          //     this.getRouter().getTargets().display("notFound");
          //     return;
          // }
        },

        _saveStateOnCloseView: function (appState) {
          const appStateDecompressed = this._prepareDecompressedState(appState);
          const appStateCompressed =
            this.compressAndEncode(appStateDecompressed);

          const newUrl = this._generateNewUrl(
            appStateDecompressed.selectedItem,
            appStateCompressed
          );
          this._updateHistoryAndModel(newUrl, appStateCompressed);
        },

        _prepareDecompressedState: function (appState) {
          const appStateDecompressed = this.decompressAndDecode(appState);
          appStateDecompressed.selectedDetailKeys = {};
          appStateDecompressed.viewsNr = 2;
          return appStateDecompressed;
        },

        _generateNewUrl: function (shippingRequestId, appStateCompressed) {
          const baseUrl = this._baseUrl();
          return `${baseUrl}&/details/ShippingRequestId=${shippingRequestId}/?appState=${appStateCompressed}`;
        },

        _updateHistoryAndModel: function (newUrl, appStateCompressed) {
          // Update browser history
          window.history.replaceState({ path: newUrl }, "", newUrl);

          // Update appStateModel
          const appStateModel =
            this.getOwnerComponent().getModel("appStateModel");
          appStateModel.setProperty("/appState", appStateCompressed);
          appStateModel.setProperty("/views", 2);
        },

        onClosePickTaskDetailView: function () {
          // Get the owner component
          let oComponent = this.getOwnerComponent();

          // Get the List view by its ID
          let oListView = oComponent.byId("details");
          let oView = this.getView();
          let sShippingRequestId = oView.getElementBinding().getBoundContext().getObject().SHIPPING_REQUEST_ID;

          if (oListView) {
            // Find the table in the other view by its ID
            var oTable = oListView.byId("itemsTable");

            if (oTable) {
              // Deselect any selected rows in the table
              oTable.removeSelections();
            }
          }
          const currentAppState = this.getAppStateFromUrl();

          this.getModel("appView").setProperty(
            "/layout",
            "TwoColumnsBeginExpanded"
          );
          this.getRouter().navTo("Details", {
            SHIPPING_REQUEST_ID: sShippingRequestId,
          });

          this._saveStateOnCloseView(currentAppState);
        },

        openItemHistory: function (oEvent) {
          this._oInput = oEvent.getSource().getId();
          let oView = this.getView();
          let oModel = oView.getModel();
          debugger;

          let selectedKeys = oView
            .getElementBinding()
            .getBoundContext()
            .getObject();
          let pickingTaskId = selectedKeys.PICKING_TASK_ID;
          let deliveryNr = selectedKeys.DELIVERY_NR;
          let deliveryItemNr = selectedKeys.DELIVERY_ITEM_NR;
          let materialNr = selectedKeys.MATERIAL_NR;

          let pickTaskId = `00000${pickingTaskId}`;

          let aFilters = [];
          aFilters.push(
            new Filter("DeliveryNr", FilterOperator.EQ, deliveryNr)
          );
          aFilters.push(
            new Filter("DeliveryItemNr", FilterOperator.EQ, deliveryItemNr)
          );
          aFilters.push(
            new Filter("MaterialNr", FilterOperator.EQ, materialNr)
          );
          aFilters.push(
            new Filter("PickingTaskId", FilterOperator.EQ, pickTaskId)
          );

          // Read data from the second entity set (ZRFSFBPCDS0006)
          let sPath = `/ZRFSFBPCDS0006`;
          oModel.read(sPath, {
            filters: aFilters,
            success: function (oData) {
              oData.results.sort(
                (a, b) => b.PickingTaskVersion - a.PickingTaskVersion
              );
              let latestVersion = oData.results.length
                ? oData.results[0].PickingTaskVersion
                : null;
              oData.LatestVersion = latestVersion;
              let oJSONModel = new JSONModel(oData);
              oView.setModel(oJSONModel, "History");

              // Load the fragment only after data is successfully fetched
              if (!this._ItemHistory) {
                Fragment.load({
                  id: oView.getId(),
                  name: "br.com.challenge.monitor.challengemonitor.fragments.ItemHistory",
                  controller: this,
                }).then(
                  function (oDialog) {
                    this._ItemHistory = oDialog;
                    oView.addDependent(this._ItemHistory);
                    this._ItemHistory.open();
                  }.bind(this)
                );
              } else {
                this._ItemHistory.open();
              }
            }.bind(this),
            error: function (oError) {
              console.error(oBundle.getText("pdtErrorFetchingData"), oError);
            },
          });
        },

        onCloseDialog: function () {
          if (this._ItemHistory && this._ItemHistory.isOpen()) {
            this._ItemHistory.close();
            console.log("ItemHistory closed");
          } else if (
            this._oPickingTaskListDialog &&
            this._oPickingTaskListDialog.isOpen()
          ) {
            this._oPickingTaskListDialog.close();
            console.log("PickingTaskListDialog closed");
          }
        },

        // Start Process to Open PickTaskDialog
        onOpenPickingTaskDialog: function (oEvent) {
          let oView = this.getView();
          let oModel = oView.getModel();
          let oButtonActionModel = oView.getModel("buttonActionModel");
          var oBundle = this.getView().getModel("i18n").getResourceBundle();
          this._oButton = oEvent.getSource().getText();
          let sButtonAction =
            this._oButton === oBundle.getText("ptBtnCreate")
              ? oBundle.getText("ptBtnCreate")
              : this._oButton === oBundle.getText("ptBtnRestart")
              ? oBundle.getText("ptBtnRestart")
              : oBundle.getText("ptBtnDelete");
          oButtonActionModel.setProperty("/action", sButtonAction);

          let shippingRequestId = oView
            .getElementBinding()
            .getBoundContext()
            .getObject().SHIPPING_REQUEST_ID;
          shippingRequestId = shippingRequestId.padStart(10, "0");

          let aFilters = [
            new Filter(
              "SHIPPING_REQUEST_ID",
              FilterOperator.EQ,
              shippingRequestId
            ),
          ];

          // Read data from the entity set asynchronously
          this._readPickingTaskData(oModel, aFilters)
            .then(
              function (oData) {
                console.log("Data Items Read:", oData);
                let oJSONModel = new JSONModel(oData);
                oView.setModel(oJSONModel, "PickingTaskList");

                // Open the dialog after data is loaded
                this._openPickingTaskListDialog();
              }.bind(this)
            )
            .catch(function (oError) {
              console.error(oBundle.getText("pdtErrorFetchingData"), oError);
              // Handle error appropriately, e.g., show error message
            });
        },

        // Reading Data for PickTaskDialog
        _readPickingTaskData: function (oModel, aFilters) {
          return new Promise(function (resolve, reject) {
            let sPath = "/ZRFSFBPCDS0002";
            oModel.read(sPath, {
              filters: aFilters,
              success: function (oData) {
                resolve(oData);
              },
              error: function (oError) {
                reject(oError);
              },
            });
          });
        },

        // Opening PickingTaskDialog
        _openPickingTaskListDialog: function () {
          let oView = this.getView();
          if (!this._oPickingTaskListDialog) {
            Fragment.load({
              id: oView.getId(),
              name: "br.com.challenge.monitor.challengemonitor.fragments.PickingTaskList",
              controller: this,
            }).then(
              function (oDialog) {
                this._oPickingTaskListDialog = oDialog;
                oView.addDependent(this._oPickingTaskListDialog);
                this._oPickingTaskListDialog.open();
              }.bind(this)
            );
          } else {
            this._oPickingTaskListDialog.open();
          }
        },

        // When selecting a checkbox, check all that have the same PickingTaskId
        onCheckBoxSelect: function (oEvent) {
          let oView = this.getView();
          let oTable = oView.byId("pickTaskTableDialog");
          var oBundle = this.getView().getModel("i18n").getResourceBundle();

          let sButtonActionModel = oView.getModel("buttonActionModel");

          if (
            sButtonActionModel.getProperty("/action") !==
            oBundle.getText("ptBtnCreate")
          ) {
            let oCheckBox = oEvent.getSource();

            // Get the parent row (ColumnListItem) of the checkbox
            let oRow = oCheckBox.getParent();

            // Get the binding context of the row
            let oBindingContext = oRow.getBindingContext("PickingTaskList");
            if (!oBindingContext) {
              return;
            }

            // Get the data object bound to the row
            let oItemData = oBindingContext.getObject();

            // Get the value of the field you want to compare (e.g., DELIVERY_NR)
            let sFieldValueToCompare = oItemData.PICKING_TASK_ID;

            // Iterate through items to check/uncheck checkboxes based on the field value
            oTable.getItems().forEach((oItem) => {
              // Skip the current row
              if (oItem === oRow) {
                return;
              }

              // Get the binding context for the current item
              let oCurrentBindingContext =
                oItem.getBindingContext("PickingTaskList");
              if (!oCurrentBindingContext) {
                return;
              }

              // Get the data object bound to the current item
              let oCurrentItemData = oCurrentBindingContext.getObject();

              // Compare the field value with the checked item
              if (oCurrentItemData.PICKING_TASK_ID === sFieldValueToCompare) {
                // Get the checkbox in the current row
                let oCurrentCheckBox = oItem.getCells()[0]; // Assuming the checkbox is the first cell

                // Set the checkbox state based on your logic
                oCurrentCheckBox.setSelected(oCheckBox.getSelected()); // Set to the state of the clicked checkbox
              }
            });
          }
        },

        onPickingTaskAction: function () {
          var oBundle = this.getView().getModel("i18n").getResourceBundle();
          let oView = this.getView();
          let oTable = oView.byId("pickTaskTableDialog");
          let sButtonActionModel = oView.getModel("buttonActionModel");

          if (oTable.getItems().length === 0) {
          }
          this._oBusyDialog = new BusyDialog({
            Text: "Aguarde...",
          });

          this._oBusyDialog.open();

          // Call getSelectedItemsForRestart which returns a promise
          this._getSelectedItems(oTable)
            .then((aItems) => {
              // Proceed to restart items (excluding those with PICKING_TASK_ID)
              if (
                sButtonActionModel.getProperty("/action") ===
                oBundle.getText("ptBtnRestart")
              ) {
                this._restartMultipleItems(aItems);
              } else if (
                sButtonActionModel.getProperty("/action") ===
                oBundle.getText("ptBtnDelete")
              ) {
                this._deleteMultipleItems(aItems);
              } else if (
                sButtonActionModel.getProperty("/action") ===
                oBundle.getText("ptBtnCreate")
              ) {
                this._createMultipleItems(aItems);
              }
            })
            .catch((error) => {
              console.error(
                oBundle.getText("pdtErroGettingSelectedItems"),
                error
              );
            });
        },

        _getSelectedItems: function (oTable) {
          var oBundle = this.getView().getModel("i18n").getResourceBundle();
          return new Promise((resolve, reject) => {
            let aItems = [];
            let oView = this.getView();
            let sButtonActionModel = oView.getModel("buttonActionModel");
            let bItemSelected = false;
            let that = this;

            // Function to fetch the next PickingTaskId if needed
            const fetchPickingTaskId = () => {
              return this._functionGetNextId("01", "ZRFSRG0002");
            };

            // Loop through each item in the table
            oTable.getItems().forEach((oItem) => {
              let oItemData = this._getSelectedItemData(oItem);

              if (oItemData) {
                bItemSelected = true;
                let oSelectedItem = {
                  SHIPPING_REQUEST_ID: oItemData.SHIPPING_REQUEST_ID.padStart(
                    10,
                    "0"
                  ),
                  DELIVERY_NR: oItemData.DELIVERY_NR,
                  DELIVERY_ITEM_NR: oItemData.DELIVERY_ITEM_NR,
                  MATERIAL_NR: oItemData.MATERIAL_NR,
                  PICKING_TASK_ID: oItemData.PICKING_TASK_ID,
                  MATERIAL_DESCRIPTION: oItemData.MATERIAL_DESCRIPTION,
                  PICKING_TASK_VERSION: oItemData.PICKING_TASK_VERSION,
                };

                aItems.push(oSelectedItem);
              }
            });

            if (!bItemSelected) {
              that._oBusyDialog.close();
              // No items selected, show an error message
              MessageBox.error(oBundle.getText("pdtErroGettingSelectedItems"));
              reject(oBundle.getText("pdtNoItemsSelected"));
              return;
            }

            // Resolve the promise with the items to restart
            if (
              sButtonActionModel.getProperty("/action") ===
                oBundle.getText("ptBtnRestart") ||
              sButtonActionModel.getProperty("/action") ===
                oBundle.getText("ptBtnDelete")
            ) {
              resolve(aItems);
            } else {
              fetchPickingTaskId()
                .then((sPickingTaskId) => {
                  aItems.forEach((oItem) => {
                    oItem.PICKING_TASK_ID = sPickingTaskId;
                  });
                  resolve(aItems);
                })
                .catch((error) => {
                  console.error(
                    oBundle.getText("pdtErrorFetchingPickingTaskId"),
                    error
                  );
                  reject(error);
                });
            }
          });
        },

        _getSelectedItemData: function (oItem) {
          let oItemData = null;
          let aCells = oItem.getCells();

          // Check each cell in the row for checkboxes
          aCells.forEach((oCell) => {
            if (oCell instanceof sap.m.CheckBox && oCell.getSelected()) {
              let oBindingContext = oItem.getBindingContext("PickingTaskList");
              oItemData = oBindingContext.getObject();

              // Remove metadata before pushing to the selected items array
              delete oItemData.__metadata;
            }
          });

          return oItemData;
        },

        _deleteMultipleItems: function (items) {
          let oView = this.getView();
          let oModel = oView.getModel();
          let sGroupId = "batchDeleteGroup";
          let that = this;
          this._oBundle = oView.getModel("i18n").getResourceBundle();

          oModel
            .metadataLoaded()
            .then(function () {
              oModel.setDeferredGroups([sGroupId]);

              // Deduplicate items by PICKING_TASK_ID
              let uniquePickingTasks = items.filter(
                (oItem, index, self) =>
                  index ===
                  self.findIndex(
                    (t) => t.PICKING_TASK_ID === oItem.PICKING_TASK_ID
                  )
              );

              // Create batch remove operations for unique Picking Task IDs
              uniquePickingTasks.forEach((uniqueTask) => {
                let sPath = oModel.createKey("/ZRFSFBPCDS0002", {
                  SHIPPING_REQUEST_ID: uniqueTask.SHIPPING_REQUEST_ID,
                  DELIVERY_NR: uniqueTask.DELIVERY_NR,
                  DELIVERY_ITEM_NR: uniqueTask.DELIVERY_ITEM_NR,
                  MATERIAL_NR: uniqueTask.MATERIAL_NR,
                  MATERIAL_DESCRIPTION: uniqueTask.MATERIAL_DESCRIPTION,
                });
                let sChangeSetId =
                  uniqueTask.SHIPPING_REQUEST_ID +
                  uniqueTask.DELIVERY_NR +
                  uniqueTask.DELIVERY_ITEM_NR +
                  uniqueTask.MATERIAL_NR;

                // Create batch remove operation
                oModel.remove(sPath, {
                  groupId: sGroupId,
                  changeSetId: sChangeSetId, // Unique changeset for each Picking Task ID
                  success: () => {
                    // Generate success messages for all items with the same Picking Task ID
                    let relatedItems = items.filter(
                      (oItem) =>
                        oItem.PICKING_TASK_ID === uniqueTask.PICKING_TASK_ID
                    );
                    relatedItems.forEach((relatedItem) => {
                      let oMessageParams = {
                        type: "Success",
                        title: that._oBundle.getText("pdtPickTaskIdDeleted", [
                          relatedItem.PICKING_TASK_ID,
                        ]),
                        subtitle: that._oBundle.getText("pdtInformMaterial", [
                          relatedItem.MATERIAL_NR,
                        ]),
                        description: that._oBundle.getText(
                          "pdtInformDeliveryItemMaterial",
                          [
                            relatedItem.DELIVERY_NR,
                            relatedItem.DELIVERY_ITEM_NR,
                            relatedItem.MATERIAL_NR,
                          ]
                        ),
                      };
                      MessagePopoverHook.onSetMessage(oView, oMessageParams);
                    });

                    // Update the view after successful deletion
                    that._bindTable(uniqueTask.SHIPPING_REQUEST_ID);
                    that
                      ._refreshPickingTaskView(oView)
                      .then((shippingRequestId) => {
                        that._updateDetailsView(shippingRequestId);
                      })
                      .catch((error) => {
                        console.error("Error:", error);
                      });
                    that._oBusyDialog.close();
                  },
                  error: (oError) => {
                    // Generate error message for the specific Picking Task ID
                    let oMessageParams = {
                      type: "Error",
                      title: that._oBundle.getText(
                        "pdtErrorDeletingPickingTask",
                        [uniqueTask.PICKING_TASK_ID]
                      ),
                      subtitle: that._oBundle.getText(
                        "pdtInformShippingRequest",
                        [uniqueTask.SHIPPING_REQUEST_ID]
                      ),
                      description:
                        typeof oError === "string"
                          ? oError
                          : JSON.stringify(oError),
                    };
                    MessagePopoverHook.onSetMessage(
                      oView,
                      oMessageParams,
                      "delete"
                    );

                    console.error("Error deleting task:", oError);
                    that._oBusyDialog.close();
                  },
                });
              });

              // Submit batch changes
              oModel.submitChanges({
                groupId: sGroupId,
                success: () => {
                  console.log("Batch delete operation completed successfully.");
                },
                error: (oError) => {
                  console.error("Batch delete operation failed:", oError);
                  that._oBusyDialog.close();
                },
              });
            })
            .catch((error) => {
              console.error("Metadata load error:", error);
              that._oBusyDialog.close();
            });
        },

        _restartMultipleItems: function (items) {
          let oView = this.getView();
          let oModel = oView.getModel();
          let sGroupId = "batchRestartGroup";
          let that = this;
          this._oBundle = oView.getModel("i18n").getResourceBundle();

          oModel
            .metadataLoaded()
            .then(function () {
              oModel.setDeferredGroups([sGroupId]);

              // Deduplicate items by PICKING_TASK_ID
              let uniquePickingTasks = items.filter(
                (oItem, index, self) =>
                  index ===
                  self.findIndex(
                    (t) => t.PICKING_TASK_ID === oItem.PICKING_TASK_ID
                  )
              );

              // Process each unique Picking Task ID for restart
              uniquePickingTasks.forEach((uniqueTask) => {
                let sPath = oModel.createKey("/ZRFSFBPCDS0002", {
                  SHIPPING_REQUEST_ID: uniqueTask.SHIPPING_REQUEST_ID,
                  DELIVERY_NR: uniqueTask.DELIVERY_NR,
                  DELIVERY_ITEM_NR: uniqueTask.DELIVERY_ITEM_NR,
                  MATERIAL_NR: uniqueTask.MATERIAL_NR,
                  MATERIAL_DESCRIPTION: uniqueTask.MATERIAL_DESCRIPTION,
                });
                let sChangeSetId = uniqueTask.PICKING_TASK_ID;

                // Create batch operation
                oModel.update(sPath, uniqueTask, {
                  groupId: sGroupId,
                  changeSetId: sChangeSetId, // Unique changeset for each Picking Task ID
                  success: (oData) => {
                    // Generate success messages for all items with the same Picking Task ID
                    let relatedItems = items.filter(
                      (oItem) =>
                        oItem.PICKING_TASK_ID === uniqueTask.PICKING_TASK_ID
                    );
                    relatedItems.forEach((relatedItem) => {
                      let oMessageParams = {
                        type: "Success",
                        title: that._oBundle.getText(
                          "pdtPickingTaskRestarted",
                          [
                            relatedItem.PICKING_TASK_ID,
                            parseInt(relatedItem.PICKING_TASK_VERSION) + 1,
                          ]
                        ),
                        subtitle: that._oBundle.getText("pdtInformMaterial", [
                          relatedItem.MATERIAL_NR,
                        ]),
                        description: that._oBundle.getText(
                          "pdtInformDeliveryItemMaterial",
                          [
                            relatedItem.DELIVERY_NR,
                            relatedItem.DELIVERY_ITEM_NR,
                            relatedItem.MATERIAL_NR,
                          ]
                        ),
                      };
                      MessagePopoverHook.onSetMessage(oView, oMessageParams);
                    });

                    // Update the view and close busy dialog
                    that._bindTable(uniqueTask.SHIPPING_REQUEST_ID);
                    that
                      ._refreshPickingTaskView(oView)
                      .then((shippingRequestId) => {
                        that._updateDetailsView(shippingRequestId);
                      })
                      .catch((error) => {
                        console.error("Error:", error);
                      });
                    that._oBusyDialog.close();
                  },
                  error: (oError) => {
                    console.error("Error restarting task:", oError);
                    that._oBusyDialog.close();
                  },
                });
              });

              // Submit batch changes
              oModel.submitChanges({
                groupId: sGroupId,
                success: () => {
                  console.log("Batch operation completed successfully.");
                },
                error: (oError) => {
                  console.error("Batch operation failed:", oError);
                  that._oBusyDialog.close();
                },
              });
            })
            .catch((error) => {
              console.error("Metadata load error:", error);
              that._oBusyDialog.close();
            });
        },

        _createMultipleItems: function (items) {
          let oView = this.getView();
          let oModel = oView.getModel();
          let sGroupId = "batchCreateGroup";
          let that = this;
          this._oBundle = oView.getModel("i18n").getResourceBundle();

          oModel
            .metadataLoaded()
            .then(function () {
              oModel.setDeferredGroups([sGroupId]);

              // Process all items without deduplication to add all materials
              items.forEach((oItem) => {
                let sChangeSetId =
                  oItem.SHIPPING_REQUEST_ID +
                  oItem.DELIVERY_NR +
                  oItem.DELIVERY_ITEM_NR +
                  oItem.MATERIAL_NR;

                // Create batch operation for each item
                oModel.createEntry("/ZRFSFBPCDS0002", {
                  groupId: sGroupId,
                  changeSetId: sChangeSetId, // Unique changeset for each item
                  properties: oItem,
                  success: (oData) => {
                    // Generate success message for the item
                    let oMessageParams = {
                      type: "Success",
                      title: that._oBundle.getText("pdtPickingTaskCreated", [
                        oItem.PICKING_TASK_ID,
                      ]),
                      subtitle: that._oBundle.getText("pdtInformMaterial", [
                        oItem.MATERIAL_NR,
                      ]),
                      description: that._oBundle.getText(
                        "pdtInformDeliveryItemMaterial",
                        [
                          oItem.DELIVERY_NR,
                          oItem.DELIVERY_ITEM_NR,
                          oItem.MATERIAL_NR,
                        ]
                      ),
                    };
                    MessagePopoverHook.onSetMessage(
                      oView,
                      oMessageParams,
                      "create"
                    );

                    // Update the view for the associated shipping request
                    that._bindTable(oData.SHIPPING_REQUEST_ID);
                    that
                      ._refreshPickingTaskView(oView)
                      .then((shippingRequestId) => {
                        that._updateDetailsView(shippingRequestId);
                      })
                      .catch((error) => {
                        console.error("Error updating details view:", error);
                      });
                  },
                  error: (oError) => {
                    // Handle error for this specific item
                    console.error(
                      "Error creating entry for item:",
                      oItem,
                      oError
                    );
                    let oMessageParams = {
                      type: "Error",
                      title: that._oBundle.getText(
                        "pdtErrorCreatingPickingTask",
                        [oItem.PICKING_TASK_ID]
                      ),
                      subtitle: that._oBundle.getText(
                        "pdtInformShippingRequest",
                        [oItem.SHIPPING_REQUEST_ID]
                      ),
                      description:
                        typeof oError === "string"
                          ? oError
                          : JSON.stringify(oError),
                    };
                    MessagePopoverHook.onSetMessage(oView, oMessageParams);
                  },
                });
              });

              // Submit all changes in a single batch
              oModel.submitChanges({
                groupId: sGroupId,
                success: () => {
                  console.log(
                    "Batch creation operation completed successfully."
                  );
                  that._oBusyDialog.close();
                },
                error: (oError) => {
                  console.error("Batch creation operation failed:", oError);
                  that._oBusyDialog.close();
                },
              });
            })
            .catch((error) => {
              console.error("Metadata load error:", error);
              that._oBusyDialog.close();
            });
        },

        _bindTable: function (shippingRequestId) {
          let oView = this.getView();
          let oModel = oView.getModel();
          let oTable = oView.byId("pickTaskTableDialog");
          let aFilters = [];
          shippingRequestId = shippingRequestId.padStart(10, "0");
          aFilters.push(
            new Filter(
              "SHIPPING_REQUEST_ID",
              FilterOperator.EQ,
              shippingRequestId
            )
          );

          // Read data from the second entity set (ZRFSFBPCDS0002)
          let sPath = "/ZRFSFBPCDS0002";
          oModel.read(sPath, {
            filters: aFilters,
            success: (oData) => {
              console.log("Data Items Read:", oData);
              let oJSONModel = new JSONModel(oData);
              oView.setModel(oJSONModel, "PickingTaskList");
              let oBinding = oTable.getBinding("items");
              oBinding.refresh();
            },
            error: (oError) => {},
          });
        },

        // Update the Details view with the existing data //
        _updateDetailsView: function (shippingRequestId) {
          const oView = this.getView();
          const oModel = oView.getModel();
          const oComponent = this.getOwnerComponent();
          const oDetailsView = oComponent
            .getRouter()
            .getView("br.com.challenge.monitor.challengemonitor.view.Details");

          if (!oDetailsView) {
            console.error("Details view not found.");
            return;
          }

          const oDetailsModel = oDetailsView.getModel("Details");
          if (!oDetailsModel) {
            console.warn("Details model not found. Creating a new one.");
            this._createDetailsModel(oDetailsView);
            return;
          }

          const aFilters = [
            new Filter(
              "SHIPPING_REQUEST_ID",
              FilterOperator.EQ,
              shippingRequestId
            ),
          ];
          const oFilter = new Filter({ filters: aFilters, and: true });

          const sElement = "/ZRFSFBPCDS0002";

          // Fetch data from the backend
          oModel.read(sElement, {
            filters: [oFilter],
            success: (oDetailsData) =>
              this._processDetailsData(oDetailsModel, oDetailsData),
            error: (oError) =>
              console.error("Error fetching details data:", oError),
          });
        },

        _createDetailsModel: function (oDetailsView) {
          const oJSONModel = new JSONModel({ results: [] });
          oDetailsView.setModel(oJSONModel, "Details");
          console.log("New Details model created and set.");
        },

        _processDetailsData: function (oDetailsModel, oDetailsData) {
          const currentData = oDetailsModel.getData();

          // Ensure PICKING_TASK_ID has a valid value
          oDetailsData.results.forEach((item) => {
            if (!item.PICKING_TASK_ID || item.PICKING_TASK_ID.trim() === "") {
              item.PICKING_TASK_ID = "N/A";
            }
          });

          // Sort the results by PICKING_TASK_ID
          oDetailsData.results.sort((a, b) => {
            const idA = a.PICKING_TASK_ID.toUpperCase(); // Handle case-insensitive sorting
            const idB = b.PICKING_TASK_ID.toUpperCase();
            if (idA < idB) return -1;
            if (idA > idB) return 1;
            return 0;
          });

          // Merge or update the model's existing data
          currentData.results = oDetailsData.results;

          // Refresh the model to update the bindings
          oDetailsModel.refresh(true);

          console.log(
            "Details model updated and sorted by PICKING_TASK_ID:",
            oDetailsModel.getData()
          );
        },

        // End of Updating the Details view with the existing data //

        _functionGetNextId: function (nrRange, object) {
          return new Promise((resolve, reject) => {
            let oView = this.getView();
            let oModel = oView.getModel();

            oModel.callFunction("/GetNextId", {
              method: "GET",
              urlParameters: {
                NrRange: nrRange,
                Object: object,
              },
              success: function (oData) {
                resolve(oData.Id);
              },
              error: function (oError) {
                reject(oError);
              },
            });
          });
        },
        getMaterialInfo: function (product) {
          var oView = this.getView();
          var oModel = oView.getModel();
          var productId = product.oSource.getText();

          var sElement = `/ZRFSCDS_MATERIAL_INFO('${productId}')`;

          oModel.read(sElement, {
            success: function (oData) {
              delete oData.__metadata;
              console.log("Material Information: ", oData);

              // Create a new model for Material Info and set it to the view
              var oMaterialInfoModel = new JSONModel();
              oMaterialInfoModel.setData(oData);
              oView.setModel(oMaterialInfoModel, "MaterialInfo");

              // Correctly bind 'this' for controller context
              this._openMaterialInfoDialog();
            }.bind(this), // Bind the controller context here
            error: function (oError) {
              console.error("Error refreshing Details data:", oError);
            },
          });
        },

        _openMaterialInfoDialog: function () {
          var oView = this.getView();

          // Check if the dialog already exists
          if (!this._oMaterialInfoDialog) {
            Fragment.load({
              id: oView.getId(), // Unique ID
              name: "br.com.challenge.monitor.challengemonitor.fragments.MaterialInfo", // Fragment path
              controller: this, // Controller reference
            }).then(
              function (oDialog) {
                this._oMaterialInfoDialog = oDialog;

                // Ensure the dialog is properly added as a dependent of the view
                oView.addDependent(this._oMaterialInfoDialog);

                // Open the dialog
                this._oMaterialInfoDialog.open();
              }.bind(this)
            );
          } else {
            // Open the dialog if it already exists
            this._oMaterialInfoDialog.open();
          }
        },

        onCloseMaterialInfoDialog: function () {
          // Close the dialog
          this._oMaterialInfoDialog.close();
        },

        getCheckoutConfirmation: function () {
          debugger;
          var oView = this.getView();
          var oModel = oView.getModel();
          var pickingTaskId = oView
            .getElementBinding()
            .getBoundContext()
            .getObject().PICKING_TASK_ID;
          var pickingTaskVersion = oView
            .getElementBinding()
            .getBoundContext()
            .getObject().PICKING_TASK_VERSION;

          var aFilters = [
            new Filter("PickingTaskId", FilterOperator.EQ, pickingTaskId),
            new Filter(
              "PickingTaskVersion",
              FilterOperator.EQ,
              pickingTaskVersion
            ),
          ];
          var oFilter = new Filter({ filters: aFilters, and: true });
          var sElement = "/CheckoutConfirmationSet";

          oModel.read(sElement, {
            filters: [oFilter],
            success: function (oData) {
              if (oData.results.length > 0) {
                // Add RowIndex to each item
                var aResultsWithIndex = oData.results.map((item, index) => ({
                  ...item,
                  RowIndex: index + 1,
                }));

                // Create a new model for Material Info and set it to the view
                var oCheckoutConfirmationModel = new JSONModel();
                oCheckoutConfirmationModel.setData({results: aResultsWithIndex});
                oView.setModel(
                  oCheckoutConfirmationModel,
                  "CheckoutConfirmation"
                );
                // Correctly bind 'this' for controller context
                this._openCheckoutConfirmationDialog();
              }
            }.bind(this), // Bind the controller context here
            error: function (oError) {
              console.error("Error refreshing Details data:", oError);
            },
          });
        },

        _openCheckoutConfirmationDialog: function () {
          var oView = this.getView();

          // Check if the dialog already exists
          if (!this._oCheckoutConfirmationDialog) {
            Fragment.load({
              id: oView.getId(), // Unique ID
              name: "br.com.challenge.monitor.challengemonitor.fragments.CheckoutConfirmation", // Fragment path
              controller: this, // Controller reference
            }).then(
              function (oDialog) {
                this._oCheckoutConfirmationDialog = oDialog;

                // Ensure the dialog is properly added as a dependent of the view
                oView.addDependent(this._oCheckoutConfirmationDialog);

                // Open the dialog
                this._oCheckoutConfirmationDialog.open();
              }.bind(this)
            );
          } else {
            // Open the dialog if it already exists
            this._oCheckoutConfirmationDialog.open();
          }
        },

        onCloseCheckoutConfirmationDialog: function () {
          // Close the dialog
          this._oCheckoutConfirmationDialog.close();
        },
      }
    );
  }
);
