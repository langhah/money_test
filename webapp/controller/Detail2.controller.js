sap.ui.define([
    "money/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/core/Fragment',
    'sap/m/MessageToast'
],
function (Controller, JSONModel, Filter, FilterOperator, Fragment, MessageToast) {
    "use strict";

    return Controller.extend("money.controller.Detail2", {
        onInit: function () {
            const oRouter = this.getRouter();
            oRouter.getRoute("Detail2").attachMatched(this._onRouteMatched, this);

        },
 
        _onRouteMatched: function (oEvent) {

            this._setModel();
            this._getCurrency();

        },

        _getCurrency: function() {

            var ocurrModel = this.getOwnerComponent().getModel("WAERS");

            this._getODataRead(ocurrModel, "/WAERS").done(function(aGetData){

                this.setModel(new JSONModel(aGetData), "helpModel");
                
            }.bind(this)).fail(function(){
                MessageBox.information("Read Fail");
            }).always(function(){

            });
        },

        _setModel: function () {

            this.setModel(new JSONModel({Yearmonth : null}), "headModel");
            this.setModel(new JSONModel([]), "itemModel");
            this.setModel(new JSONModel([
                {key : 'S', text : '수입'},
                {key : 'J', text : '지출'}
            ]), "selectModel");          

        }
    });
});
