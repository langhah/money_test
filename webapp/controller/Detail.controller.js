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

    return Controller.extend("money.controller.Detail", {
        onInit: function () {
            const oRouter = this.getRouter();
            oRouter.getRoute("Detail").attachMatched(this._onRouteMatched, this);

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

        },

        onCreate: function () {

            var items = this.getModel("itemModel").getData();

            var itemObj = {
                Gubun : 'J',
                Title : null,
                Content : null,
                Amount : 0,
                Unit : null
            };

            items.push(itemObj);

            this.setModel(new JSONModel(items), "itemModel");

        },

        onDelete: function(oEvent) {

            var idx = this.byId("itemTable").getSelectedIndex();

            if(idx === -1) {
               return;
            }

            var items = this.getModel("itemModel").getData();

            items.splice(idx, 1);

            this.setModel(new JSONModel(items), "itemModel");

        },

        handleValueHelp : function (oEvent) {
			var oView = this.getView();
            var rowId = oEvent.getSource().getParent().getId().split("rows-row");

            this.inputRow = rowId[1];

			// create value help dialog
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "money.view.fragments.Dialog",
					controller: this
				}).then(function(oValueHelpDialog){
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}

			this._pValueHelpDialog.then(function(oValueHelpDialog){
				// open value help dialog
				oValueHelpDialog.open();
			});
		},

		_handleValueHelpSearch : function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter(
				"Currency",
				FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose : function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				// var productInput = this.byId(this.inputId);
				// productInput.setValue(oSelectedItem.getTitle());

                var items = this.getModel("itemModel").getData();

                items[this.inputRow].Unit = oSelectedItem.getTitle(); 

                 this.setModel(new JSONModel(items), "itemModel");
			}
			evt.getSource().getBinding("items").filter([]);
		},

        handleChange: function(oEvent) {

            var oPicker = oEvent.getSource().getValue();

            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "yyyyMM" });
            oPicker = oDateFormat.format(new Date(oPicker));

             this.setModel(new JSONModel({Yearmonth : oPicker}), "headModel");
           
        },

        onSave: function () {

            var oMainModel = this.getOwnerComponent().getModel(); //Money 모델
            var headData = this.getModel("headModel").getData();
            var itemData = this.getModel("itemModel").getData();

            itemData.forEach(function(item) {
                if (item.Amount <= 0) {
                    sap.m.MessageToast.show("금액을 입력해주세요.");
                }
            });

            //headData['to_Item'] =  이렇게도 접근 가능 
            headData.to_Item = itemData;  //테이블 안에 테이블 느낌

            console.log("Amount:", headData.to_Item[0].Amount);
            
            this._getODataCreate(oMainModel, "/Head", headData).done(function(aReturn){  

                this.navTo("Main", {}); 

            }.bind(this)).fail(function(oError){
                // chk = false;                

                var errorMessage = oError.responseText;
                
                const regex = /"message":"([^"]+)"/;
                const match = errorMessage.match(regex); 
                
                if (match && match[1]) {
                    const errorMessage = match[1];
                    
                    MessageToast.show(errorMessage);

                }

            }).always(function(){

            });

        }

    });
});
