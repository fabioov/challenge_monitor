sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (
    Controller
) {
    "use strict";

    return Controller.extend("br.com.challenge.monitor.challengemonitor.controller.BaseController", {

        compressAndEncode: function (obj) {
            if (!obj || Object.keys(obj).length === 0) {
                // Handle empty object: return an empty string or a specific marker
                return '';
            }

            // Encode the object to a JSON string and then to a Uint8Array
            const encodedData = new TextEncoder().encode(JSON.stringify(obj));

            // Compress the data using pako
            const compressedData = pako.deflate(encodedData);

            // Convert the compressed data to Base64URL using modern Web APIs
            const base64Data = btoa(String.fromCharCode(...new Uint8Array(compressedData)));

            return base64Data;
        },

        decompressAndDecode: function (str) {
            if (!str || str.trim() === '') {
                // Handle empty or invalid string: return null or a specific marker
                return null;
            }

            const decodedData = atob(str);

            // Decompress the binary data using pako
            const decompressedData = pako.inflate(decodedData.split("").map(function (c) { return c.charCodeAt(0); }));

            // Decode the decompressed data back to a string
            const jsonData = new TextDecoder().decode(new Uint8Array(decompressedData));

            // Parse the JSON string back to an object
            return JSON.parse(jsonData);
        },

        getAppStateFromUrl: function () {
            var sUrl = window.location.href;

            // Check if the URL contains the 'appState=' parameter
            if (sUrl.includes('appState=')) {
                var sAppState = sUrl.split('appState=')[1];
                return sAppState;
            }

            // Return null or a default value if 'appState=' is not found
            return null;
        },

        getModel: function (sName) {
            return this.getOwnerComponent().getModel(sName) || this.getView().getModel(sName);
          },
      
          getRouter: function () {
            return this.getOwnerComponent().getRouter();
          },
    });
});