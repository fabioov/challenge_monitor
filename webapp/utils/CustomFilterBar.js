sap.ui.define([
    "sap/ui/comp/filterbar/FilterBar"
], function (FilterBar) {
    "use strict";

    return FilterBar.extend("br.com.challenge.monitor.challengemonitor.utils.CustomFilterBar", {
        metadata: {
            // Define any custom properties, events, or aggregations if needed
            properties: {},
            events: {}
        },

        renderer: {},

        onAfterRendering: function () {
            // Call the parent method
            FilterBar.prototype.onAfterRendering.apply(this, arguments);

            // Attach a global keydown event listener for the "Enter" key
            this.$().on("keydown", (oEvent) => {
                if (oEvent.key === "Enter") {
                    this._onEnterKeyPress(oEvent);
                }
            });
        },

        _onEnterKeyPress: function (oEvent) {
            // Trigger the `search` event when "Enter" is pressed
            console.log("Enter key pressed in CustomFilterBar");
            this.fireSearch();
        },

        exit: function () {
            // Remove the keydown event listener when the control is destroyed
            this.$().off("keydown");
        }
    });
});