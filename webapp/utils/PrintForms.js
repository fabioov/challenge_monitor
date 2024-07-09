sap.ui.define([

], function (
    ManagedObject
) {
    "use strict";

    let PrintForms = {

        onPrintPress: function (oView, oContext) {
            this.PreviewSmartform(oView, "ZRFSFBPSF0001", {
                ShippingRequestId: oContext.getObject().ShippingRequestId,
            });
        },

        PreviewSmartform: function (oView, FormName, Params
        ) {
            var Viewer = new sap.m.PDFViewer();

            oView.addDependent(Viewer);
            let oModel = oView.getModel();

            let sPath = oModel.createKey("/PrintOpSet", {
                FileName: FormName,
                Params: JSON.stringify(Params),
                FormId: "",
                GetPdf: 'X'
            });

            let sSource =
                oView.getModel().sServiceUrl + sPath + "/$value";

            Viewer.setShowDownloadButton(false);
            Viewer.setSource(sSource);

            Viewer.setTitle("PDF Viewer");
            Viewer.open();
        },

    };

    return PrintForms;
}, true);