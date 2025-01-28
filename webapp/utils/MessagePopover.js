sap.ui.define([
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    'sap/ui/model/json/JSONModel'
], function (MessagePopover, MessageItem, JSONModel) {
    "use strict";

    let oMessageTemplate = new MessageItem({
        type: '{type}',
        title: '{title}',
        subtitle: '{subtitle}',
        description: '{description}'
    });

    // Placeholder for the MessagePopover instance
    let oMessagePopover;

    // Model for storing messages
    let oPopoverModel = new JSONModel();

    let MessagePopoverHook = {
        _createMessagePopover: function (oView) {
            // Ensure the MessagePopover is created only once
            if (!oMessagePopover) {
                oMessagePopover = new MessagePopover({
                    headerButton: new sap.m.Button({
                        type: sap.m.ButtonType.Reject,
                        icon: "sap-icon://delete",
                        press: function () {
                            // Close the MessagePopover
                            oMessagePopover.close();

                            // Clear messages in the model attached to oMessagePopover
                            oMessagePopover.getModel().setData([]); // Reset all messages

                            let oPopoverModel = oView.getModel("popoverModel");
                            let detailModel = oView.getModel("detailModel");
                            detailModel.setProperty("/showListFooter", false);

                            // Reset the "popoverModel" properties
                            oPopoverModel.setProperty("/messages", []); // Clear external messages
                            oPopoverModel.setProperty("/messageLength", 0); // Reset message count
                            oPopoverModel.setProperty("/visible", false); // Hide the popover

                            // Refresh the models
                            oMessagePopover.getModel().refresh(true);
                            oPopoverModel.refresh(true);
                        }
                    }),
                    items: { path: '/', template: oMessageTemplate },
                    afterClose: function () {
                        oPopoverModel.setProperty("/visible", false);
                    }
                });

                // Attach the model to the MessagePopover
                oMessagePopover.setModel(oPopoverModel);
            }
            return oMessagePopover;
        },

        onSetMessage: function (oView, oParams) {
            // Ensure the MessagePopover is created before setting a message
            let oMessagePopover = this._createMessagePopover(oView);

            // Prepare the new message data
            let messageData = [{
                type: oParams.type,
                title: oParams.title,
                subtitle: oParams.subtitle,
                description: oParams.description
            }];

            // Get the current messages
            let previous = oMessagePopover.getModel().getData();

            if (previous.length === undefined) {
                previous = [];
            }
            let updated = previous !== "" ? previous.concat(messageData) : messageData;
            oMessagePopover.getModel().setData(updated);
            oMessagePopover.getModel().refresh(true);

            oView.getModel("popoverModel").getData().messageLength = updated.length;
            oView.getModel("popoverModel").getData().visible = true;
            oView.getModel("popoverModel").getData().type = "Emphasized";
            oView.getModel("popoverModel").refresh(true);

        },

        onMessagesPopoverOpen: function (oEvent, oView) {
            let oMessagePopover = this._createMessagePopover(oView);
            oMessagePopover.toggle(oEvent.getSource());
        }
    };

    return MessagePopoverHook;
}, true);