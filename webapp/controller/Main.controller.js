sap.ui.define([
    "money/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/UIComponent",
    "sap/ui/core/library"
],
function (Controller, JSONModel, MessageToast, DateFormat, UIComponent, library) {
    "use strict";

    const SortOrder = library.SortOrder;

    return Controller.extend("money.controller.Main", {
        onInit: function () {
            
            // var oJasonModel = {};
            // this.getView().setModel(new JSONModel(oJasonModel), "newHead");

            const oRouter = this.getRouter();
            oRouter.getRoute("Main").attachMatched(this._onRouteMatched, this);

        },
        
        _onRouteMatched: function (oEvent) {

            this._setModel();

        },

        _setModel: function() {

            var oMainModel = this.getOwnerComponent().getModel();

            this._getODataRead(oMainModel, "/Head").done(function(aGetData){

                this.setModel(new JSONModel(aGetData), "headModel")

                //Initial sorting
                const oYearmonthColumn = this.getView().byId("Yearmonth");
                this.getView().byId("MoneyTable").sort(oYearmonthColumn, SortOrder.Ascending);
     
            }.bind(this)).fail(function(){
                MessageBox.information("Read Fail");
            }).always(function(){

            });

        },

        onCreate: function() {
            this.navTo("Detail", {});
        },

        onMove: function(oEvent) {

            var oRow = oEvent.getSource().getParent();
            var oContext = oRow.getBindingContext("headModel");
            var oUuid = oContext.getProperty("Uuid");

            this.navTo("Detail", { Uuid: oUuid } );

        },

        onDelete: function() {

            var callArray = [];
            var head = this.getModel("headModel").getData();
            var oMainModel = this.getOwnerComponent().getModel();
            
            //다중 선택 행 
            var idx = this.byId("MoneyTable").getSelectedIndices();
    
            if(idx.length === 0) {
                return;
             }

            for (var i = 0; i<idx.length; i++) {

                var paraH = "/Head(guid'" + head[idx[i]].Uuid + "')";
                this.oUuid = head[idx[i]].Uuid; 

                callArray.push(this._getODataDelete(oMainModel, paraH));

            } 

            // debugger;
            $.when.apply($, callArray)
            .fail(function(oError){ 
            var sMessage = "";
            try{
                var oResponseTextData = JSON.parse(oError.responseText);
                console.log(oResponseTextData);
            }catch(e){
                console.log("Err")
            }})
            .done(function(aReturn){
                
                MessageToast.show("데이터가 삭제되었습니다");
                this._setModel();
                
            }.bind(this));

        }

    });
});
