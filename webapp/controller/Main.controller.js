sap.ui.define([
    "money/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/UIComponent"
],
function (Controller, JSONModel, MessageToast, DateFormat, UIComponent) {
    "use strict";

    return Controller.extend("money.controller.Main", {
        onInit: function () {
            
            // var oJasonModel = {};
            // this.getView().setModel(new JSONModel(oJasonModel), "newHead");

            // const oRouter = this.getRouter();
            // oRouter.getRoute("Main").attachMatched(this._onRouteMatched, this);

             this._setModel();

        },
        
        // _onRouteMatched: function (oEvent) {

        //     this._setModel();

        // },

        _setModel: function() {

            var oMainModel = this.getOwnerComponent().getModel();

            this._getODataRead(oMainModel, "/Head").done(function(aGetData){

                this.setModel(new JSONModel(aGetData), "headModel")
     
            }.bind(this)).fail(function(){
                MessageBox.information("Read Fail");
            }).always(function(){

            });
        
        },

        onCreate: function() {
            this.navTo("Detail", {});
        },

        onMove: function() {
            this.navTo("Detail2", {});
        },


    });
});
