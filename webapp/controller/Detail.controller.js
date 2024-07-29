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

    var oUIModel = new JSONModel({
        Group1: true, // Input, 생성/삭제
        Group2: true, // Yearmonth, 저장
        Group3: true, // 수정
        Group4: true, // 수정저장
    });

    var deArray = [];

    return Controller.extend("money.controller.Detail", {
        onInit: function () {

            const oRouter = this.getRouter();
            oRouter.getRoute("Detail").attachMatched(this._onRouteMatched, this);

        },
 
        _onRouteMatched: function (oEvent) {

            this.getView().setModel(oUIModel, "uiModel");

            var oArgs = oEvent.getParameter("arguments");
            
            //파라미터 값 유무로 모델바인딩 분기처리 (있으면 수정/ 없으면 생성)
            if(oArgs && oArgs.Uuid){

                this.oUuid = oArgs.Uuid;

                this._setModelHead();
                this._setModelItem();

                oUIModel.setProperty("/Group1", false);
                oUIModel.setProperty("/Group2", false);
                oUIModel.setProperty("/Group3", true);
                oUIModel.setProperty("/Group4", false);

            } else {
                
                this._setModel();

                oUIModel.setProperty("/Group1", true);
                oUIModel.setProperty("/Group2", true);
                oUIModel.setProperty("/Group3", false);
                oUIModel.setProperty("/Group4", false);
    
            }

            this._getCurrency();
        
        },

        _setModelHead: function () {

            //Head 테이블 - Uuid 맞는 것만 들고오기
            var aheadFilter = [
                new sap.ui.model.Filter("Uuid", FilterOperator.EQ, this.oUuid)
            ];

            var oMainModel = this.getOwnerComponent().getModel();

            this._getODataRead(oMainModel, "/Head", aheadFilter).done(function(aGetData){

                this.setModel(new JSONModel(aGetData[0]), "headModel")  

            }.bind(this)).fail(function(){
                MessageBox.information("Read Fail");
            }).always(function(){

            });

        },

        _setModelItem: function () {

            //Item 테이블 - Uuid 맞는 것만 들고오기
            var aitemFilter = [
                new sap.ui.model.Filter("Headuuid", FilterOperator.EQ, this.oUuid)
            ];

            var oitemModel = this.getOwnerComponent().getModel();

            this._getODataRead(oitemModel, "/Item", aitemFilter).done(function(aGetData){

                this.setModel(new JSONModel(aGetData), "itemModel")
     
            }.bind(this)).fail(function(){
                MessageBox.information("Read Fail");
            }).always(function(){

            });    

            this.setModel(new JSONModel([
                {key : 'S', text : '수입'},
                {key : 'J', text : '지출'}
            ]), "selectModel");  
            
        },

        _setModel: function () {

            this.setModel(new JSONModel({Yearmonth : null}), "headModel");
            this.setModel(new JSONModel([]), "itemModel");
            this.setModel(new JSONModel([
                {key : 'S', text : '수입'},
                {key : 'J', text : '지출'}
            ]), "selectModel");          

        },

        _getCurrency: function() {

            var ocurrModel = this.getOwnerComponent().getModel("WAERS");
            var para = {
                "$top" : 170
                // "$inlinecount" : "allpages"
            };

            this._getODataRead(ocurrModel, "/WAERS", null, para).done(function(aGetData){
                
                this.setModel(new JSONModel(aGetData), "helpModel");   

            }.bind(this)).fail(function(){
                MessageBox.information("Read Fail");
            }).always(function(){

            });
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

        onDelete: function() {

            //단일 행 읽어오기
            var idx = this.byId("itemTable").getSelectedIndex();

            if(idx === -1) {
               return;
            }

            var items = this.getModel("itemModel").getData();
            var dele = items.splice(idx, 1);

            this.setModel(new JSONModel(items), "itemModel");

            if(dele[0].Uuid){
                deArray.push(dele[0]);
            }

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

        },

        onEdit: function() {

            oUIModel.setProperty("/Group1", true);
            oUIModel.setProperty("/Group2", false);
            oUIModel.setProperty("/Group3", false);
            oUIModel.setProperty("/Group4", true);
    
        },

        onUpdate: function() {
           
            var oMainModel = this.getOwnerComponent().getModel(); //Money 모델
            var headData = this.getModel("headModel").getData();
            var itemData = this.getModel("itemModel").getData();

            var _this = this;

            var callArray = [];

            //Head Update
            var param = "/Head(guid'" + this.oUuid + "')";
            
            callArray.push(this._getODataUpdate(oMainModel, param, headData));

            // this._getODataUpdate(oMainModel, param, headData).done(function(aReturn){

            // }.bind(this)).fail(function(){
            //     error = false;
            // }).always(function(){

            // });

            //Item Update & Create
            var para;

            itemData.forEach(function(item) {
                if (item.Uuid) {

                    para = "/Item(Uuid=guid'" + item.Uuid + "',Headuuid=guid'" + _this.oUuid + "')";
    
                    callArray.push(_this._getODataUpdate(oMainModel, para, item));

                    // _this._getODataUpdate(oMainModel, para, item).done(function(aReturn){

                    // }.bind(this)).fail(function(){
                    //     error = false;
                    // }).always(function(){     

                    // });        

                }

                else {

                    para = "/Head(guid'" + _this.oUuid + "')/to_Item";
        
                    callArray.push(_this._getODataCreate(oMainModel, para, item));

                    // _this._getODataCreate(oMainModel, para, item).done(function(aReturn){  

                    // }.bind(this)).fail(function(){
                    //     error = false;
                    // }).always(function(){
        
                    // });

                }

            });

            // Item Delete
            deArray.forEach(function(dele) {

                    var param = "/Item(Uuid=guid'" + dele.Uuid + "',Headuuid=guid'" + _this.oUuid + "')";

                    callArray.push(_this._getODataDelete(oMainModel, param));
            
                    // _this._getODataDelete(oMainModel, param).done(function(aReturn){
        
                    // }.bind(this)).fail(function(){
                    //     // chk = false;
                    // }).always(function(){
        
                    // });
            });

            //배열에 담아둔 기능 호출
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

                MessageToast.show("데이터가 수정되었습니다");
                oUIModel.setProperty("/Group1", false);
                oUIModel.setProperty("/Group3", true);
                oUIModel.setProperty("/Group4", false);
                
            }.bind(this));

            // if(error !== false) {

            // console.log(oUIModel);    

            // MessageToast.show("데이터가 수정되었습니다");
            // oUIModel.setProperty("/Input", false);
            // this.byId("EditButton").setVisible(true);
            // this.byId("UpdateButton").setVisible(false);

            // }

        }
    });
});
