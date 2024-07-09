sap.ui.define([
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    'sap/ui/model/json/JSONModel'
], function (MessagePopover, MessageItem, JSONModel
) {
    "use strict";

    let oMessageTemplate = new MessageItem({
        type: '{type}',
        title: '{title}',
        subtitle: '{subtitle}',
        description: '{description}'
    });

    let oMessagePopover = new MessagePopover({
        items: { path: '/', template: oMessageTemplate }
    })

    let oPopoverModel = new JSONModel([]);
    oMessagePopover.setModel(oPopoverModel);

    let MessagePopoverHook = {

        onSetMessage: function (oView, oParams) {
            let messageData = [];
            messageData.push({
                type: oParams.type,
                title: oParams.title,
                subtitle: oParams.subtitle,
                description: oParams.description

            });
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

        onMessagesPopoverOpen: function (oEvent) {
            oMessagePopover.toggle(oEvent.getSource());
        },

    }

    return MessagePopoverHook;
}, true);