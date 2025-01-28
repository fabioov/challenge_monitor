sap.ui.define([
    ["sap/ui/core/format/NumberFormat"]
], function (
    NumberFormat
) {
    "use strict";
    var Formatter = {

        dateFormat: function (value) {
            var oConfiguration = sap.ui.getCore().getConfiguration();
            var oLocale = oConfiguration.getFormatLocale();
            var pattern = "";

            if (oLocale === "pt-BR") {
                pattern = "dd/MM/yyyy"
            } else {
                pattern = "MM/dd/yyyy"
            }

            if (value) {

                var year = new Date().getFullYear();
                if (year === 9999) {
                    return ""
                } else {

                    var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                        // style: "short"
                        pattern: pattern
                    });

                    return oDateFormat.format(new Date(value));
                }
            } else {
                return value;
            }
        },

        shippingStatus: function (value) {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();

            try {
                return oBundle.getText("status" + value);
            } catch (error) {
                return ""
            }
        },
        shippingState: function (value) {

            try {
                if (value === 'C') {
                    return "Success"
                } else if (value === 'K') {
                    return "Warning"
                } else {
                    return "None"
                }
            } catch (error) {
                return "None"
            }
        },
        shippingIcon: function (value) {
            try {
                if (value === 'C') {
                    return "sap-icon://accept"
                } else if (value === 'K') {
                    return "sap-icon://multiselect-all"
                } else if (value === 'S') {
                    return "sap-icon://cart-3"
                } else if (value === 'X') {
                    return "sap-icon://decline"
                } else if (value === 'P') {
                    return "sap-icon://accelerated"
                } else {
                    return ""
                }
            } catch (error) {
                return ""
            }
        },

        floatNumber: function (value) {
            var numberFloat = NumberFormat.getFloatInstance({
                maxFractionDigits: 2,
                minFractionDigits: 2,
                groupingEnabled: true,
                groupingSeparator: ".",
                decimalSeparator: ","
            })

            return numberFloat.format(value);
        },

        dateSAP: function (value) {

            if (value) {

                var dateParts = value.split("/");

                var dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);

                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({

                    pattern: "yyyy-MM-ddTHH:mm:ss"

                });

                return oDateFormat.format(new Date(dateObject));

            } else {

                return value;

            }

        },
        statusButtonVisibility: function (value) {

            try {
                if (value === 'C') {
                    return false
                } else if (value === 'K') {
                    return false
                } else if (value === 'X') {
                    return false
                } else if (value === 'S') {
                    return false
                } else {
                    return true
                }
            } catch (error) {
                return ""
            }
        },

        checkoutConfirmationButtonVisibility: function (value) {

            try {
                if (value === 'K') {
                    return true
                } else {
                    return false
                }
            }
            catch (error) {
                return ""
            }

        },

        restartPickTaskVisisibility: function (value) {
            try {
                if (value === 'C') {
                    return false
                } else if (value === 'K') {
                    return false
                } else if (value === 'X') {
                    return false
                } else {
                    return true
                }
            } catch (error) {
                return ""
            }

        },

        formatVersionState: function (value) {
            let oModel = this.getView().getModel("History");
            let latestVersion = oModel.getProperty("/LatestVersion");
            return value === latestVersion ? "Success" : "None";
        },
        formatVersionInversion: function (value) {
            let oModel = this.getView().getModel("History");
            let latestVersion = oModel.getProperty("/LatestVersion");
            return value === latestVersion ? true : false;
        },

        statusHistory: function (value) {

            try {
                if (value === 'F') {
                    return "Success"
                } else if (value === 'P') {
                    return "Warning"
                } else {
                    return "Information"
                }
            } catch (error) {
                return ""
            }
        },

        enableDisableCheckBox: function (sPickingTaskId) {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            let oButtonActionModel = this.getView().getModel('buttonActionModel');
            // Check if oButtonActionModel.action equals 'Create' and sPickingTaskId exists
            if (oButtonActionModel && oButtonActionModel.getProperty('/action') === oBundle.getText("ptBtnCreate") && sPickingTaskId) {
                return false; // Enable the checkbox
            } else if ((oButtonActionModel && oButtonActionModel.getProperty('/action') === oBundle.getText("ptBtnRestart") || oButtonActionModel && oButtonActionModel.getProperty('/action') === oBundle.getText("ptBtnDelete")) && !sPickingTaskId) {
                return false; // Disable the checkbox
            } else {
                return true;
            }
        },

        setPickingTaskDialogTitle: function (sAction) {
            let oBundle = this.getView().getModel("i18n").getResourceBundle();
            let sActionText = sAction === oBundle.getText("ptBtnCreate") ? oBundle.getText("ptBtnCreate") : sAction === oBundle.getText("ptBtnRestart") ? oBundle.getText("ptBtnRestart") : oBundle.getText("ptBtnDelete");
            return oBundle.getText("formatterSelectItems", [sActionText]);
        },

        setPickingTaskDialogTooltip: function (sAction) {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            if (sAction === oBundle.getText("ptBtnCreate")) {
                return oBundle.getText("formatterSelectHowManyItems");
            } else {
                return oBundle.getText("formatterInPickingAItem");
            }
        },

        setPickingTaskDialogButtonText: function (sAction) {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            if (sAction === oBundle.getText("ptBtnCreate")) {
                return oBundle.getText("ptBtnCreate");
            } else if (sAction === oBundle.getText("ptBtnRestart")) {
                return oBundle.getText("ptBtnRestart");
            } else {
                return oBundle.getText("ptBtnDelete")
            }
        },

        setPickingTaskDialogButtonIcon: function (sAction) {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            switch (sAction) {
                case oBundle.getText("ptBtnCreate"):
                    return 'sap-icon://create';
                case oBundle.getText("ptBtnRestart"):
                    return 'sap-icon://restart';
                case oBundle.getText("ptBtnDelete"):
                    return 'sap-icon://delete';
                default:
                    return ''; // Return default icon URL or handle other cases
            }
        },

        setPickingTaskDialogButtonType: function (sAction) {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            if (sAction === oBundle.getText("ptBtnDelete")) {
                return 'Reject';
            } else {
                return 'Emphasized';
            }
        },

        suppressLeadingZeros: function (sValue) {
            if (sValue) {
                return sValue.replace(/^0+/, ""); // Remove leading zeros
            }
            return sValue; // Return original value if empty or undefined
        },

        combineCustomerInfo: function (sCustomerId, sCustomerName) {
            // Suppress leading zeros for CustomerId and combine with CustomerName
            const formattedCustomerId = sCustomerId ? sCustomerId.replace(/^0+/, "") : "";
            return formattedCustomerId && sCustomerName
                ? `${formattedCustomerId} - ${sCustomerName}`
                : formattedCustomerId || sCustomerName || "";
        },

        confirmationReadIcon: function (bValue) {
            return bValue ? "sap-icon://accept" : "sap-icon://decline";
        },
        
        confirmationReadColor: function (bValue) {
            return bValue ? "green" : "red";
        },

    }

    return Formatter;

}, true);
