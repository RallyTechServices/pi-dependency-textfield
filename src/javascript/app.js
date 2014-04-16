Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items:
        [
         {xtype:'container',itemId:'display_box', style:{padding: '10px'}}, 
         {xtype:'container',itemId:'portfolio_item_box', layout: {type: 'hbox'}, style:{padding: '10px'}},
         {xtype:'container',itemId:'relatives_box',flex:1, layout:{type: 'hbox'}, style: {padding: '10px'},
          	items:
          	[
          	    {
          	    	xtype: 'container', 
          	    	style: {padding: '20px'},
          	    	itemId: 'predecessor_box', 
         	    	flex: 1
          	    	
          	    },
          	    {
          	    	xtype: 'container', 
          	    	itemId: 'successor_box', 
          	    	style: {padding: '20px'},
          	    	flex: 1,
          	    }       	       
          	]
          },
          {xtype:'container',itemId: 'save_cancel_box', layout: {type: 'hbox'}, style: {padding: '10px',margin: '10px'}}
         ],
     config: {
    	defaultSettings: {
    	    pi_predecessor_field_name: 'blah-p',
    	    pi_successor_field_name: 'blah'   		
    	}
    },
    
    launch: function() {

    	if (typeof(this.getAppId()) == 'undefined' ) {
    		this.logger.log ('App is not running from within Rally.');
    		this._showExternalSettingsDialog(this.getSettingsFields());
        } 
    	
    	//Add the select button 
    	this.down('#portfolio_item_box').add(
    	{
    		xtype: 'rallybutton',
    		id: 'portfolio_item_box_select_button',
    		text: 'Select...',
    		style: {margin: '5px'},
    		scope: this,
    		handler: function()
    		{
    			this._selectPortfolioItems();
    		}
    	});
        this.down('#portfolio_item_box').add(
        		{
        			xtype: 'label',
        			html: '<font color="#808080" size=2><i>Please select a portfolio item.</i></font>',
        			id:'portfolio_item_box_text',
        			style: {margin:'5px'}
        		});
    },
    
    _selectPortfolioItems: function(){
    	var me = this;
    	Ext.create('Rally.ui.dialog.ChooserDialog',
    			{
    				artifactTypes:['portfolioitem'],
    				autoShow: true,
    				title: 'Choose a Portfolio Item',
    				id: 'portfolio_item_chooser',
    				multliple: false,
    				modal: true,
    				scope:this,
    				storeConfig: {
    					fetch: ['ObjectID','Name', 'FormattedID', me._getPredecessorFieldName(), me._getSuccessorFieldName()]
    				},
    				gridConfig: {
    					columns: {
    						items: [{
    							text: 'ID', dataIndex: 'FormattedID'
    						},{
    							text: 'Name', dataIndex: 'Name'
    						}]
    					}
    				},
    				listeners: {
    					artifactChosen: function (selectedRecords){
    						if (selectedRecords == undefined)
    							{
    							Ext.Msg.alert('Chooser', 'Please select a Portfolio Item');
    							return;
    							}
     						me._addRelativeSelectors(selectedRecords);
    					}
    				}
    			});
    },

    _formatRelativeData: function (data_items){
    	var content = '';
    	for (var i=0; i < data_items.length; i++){
    		var id = data_items[i].get('ObjectID');
    		//create the HTML Link 
    		content += '<div id="' + id + '"><a  href="' + Rally.nav.Manager.getDetailUrl(data_items[i]) + '">' + data_items[i].get('FormattedID') + '</a> - ' + data_items[i].get('Name') + '<br></div>';
    	}
    	this.logger.log('_formatRelativeData returned content:', content);
    	return content;
    },
    _getPredecessorFieldName: function(){
    	return this.getSetting('pi_predecessor_field_name');
    },
    _getSuccessorFieldName: function(){
    	return this.getSetting('pi_successor_field_name');
    },
    _addRelativeSelectors: function(selected_records){
		//This function clears out the existing portfolio item, resets the buttons
    	var me = this; 
    	
    	//Clear out all the existing grids, buttons, etc 
		if (me.down('#portfolio_item_box_text')){
			me.down('#portfolio_item_box_text').destroy();
		}
    	me.down('#predecessor_box').removeAll(true);
    	me.down('#successor_box').removeAll(true);
    	me.down('#save_cancel_box').removeAll(true);
    	me.selected_portfolio_item = selected_records;
    	
        me.down('#portfolio_item_box').add(
        		{
        			xtype: 'rallytextfield',
        			value: me._getPortfolioItemDisplayText(selected_records),
        			id:'portfolio_item_box_text',
        			style: {margin: '5px'}
        		});
        
        //_getRelativeStore returns a promise
        this._getRelativeStore(selected_records, me._getPredecessorFieldName())
        	.then({
        		scope: this,
        		success: function(store){
        			var predecessor_store = store; 
        	    	me._addRelativeSelector('#predecessor_box',
        	    								'predecessor_grid',
        	    								me._choosePredecessors, 
        	    								me._removePredecessors, 
        	    								predecessor_store);

        	    	this._getRelativeStore(selected_records, me._getSuccessorFieldName())
        	    		.then({
        	    				success: function(store){
        	    					var successor_store = store; 
         	    					me._addRelativeSelector('#successor_box',
        	        	    								'successor_grid',
        	        	    								me._chooseSuccessors, 
        	        	    								me._removeSuccessors, 
        	        	    								successor_store);
        	    				}
        	    		});
        		}
        	});
    },
    _getRelativeStore: function(selected_record, relative_field_name){
  	 	var deferred = Ext.create('Deft.Deferred');
    	var me = this;
    	var relative_content = selected_record.get(relative_field_name);	

    	this.logger.log ('_getRelativeStore INPUT', relative_field_name, relative_content);

   	 	if (relative_content.length > 0)
   	 	{
   	 		var object_ids = this._getObjectIdsFromRelativeHtml(relative_content);
   	 		if (object_ids.length > 0)
   	 		{
	   	 		var promises = [];
	   	 		Ext.Array.each(object_ids, function(object_id){
	   	 			promises.push(me._loadRelativeStore(object_id));
	   	 		});
	   	 		Deft.Promise.all(promises).then({
	   	 					scope: this,
	   	 					success: function(records) {
	   	 						var record_data = [];
	   	 						Ext.Array.each(records, function(record){
	   	 							console.log('record' , record[0]);
	   	 							if (record[0] != undefined){
		   	 							record_data.push(
			   	 								record[0]); //.getData()); //TODO This bothers me and makes me nervous...why is there a nested array returned?
	   	 							}
	   	 						});
	   	 						var store = this._createRelativeStore(record_data);
		   	 			 		deferred.resolve(store);
	  	 					},
	   	 					failure: function(error){
	   	 						this.logger.log('_getRelativeStore failed with error: ',error);
	   	 		   	 			deferred.resolve(this._createRelativeStore());
	  	 					}
	   	 		});
	   	 	}
   	 		else 
   	 			{
  	   	 		deferred.resolve(this._createRelativeStore());
   	 			}
   	 	}
   	 	else
   	 		{
   	 		deferred.resolve(this._createRelativeStore());
   	 		}
   	 	return deferred.promise;
    },
    _createRelativeStore: function(record_data){
    	if (record_data == undefined){
    		record_data = null;
    	}
    	var relative_store = Ext.create('Rally.data.custom.Store', {
			model: 'PortfolioItem',	
    		fetch: ['ObjectID','FormattedID', 'Name', this._getPredecessorFieldName(), this._getSuccessorFieldName()],
					data: record_data,
					pageSize: 25
	 		});   	
    	
    	return (relative_store);
    },
    _loadRelativeStore: function(object_id){
    	 var deferred = Ext.create('Deft.Deferred');
         this.logger.log('_loadRelativeStore - input', object_id);
    	 
 		Ext.create('Rally.data.wsapi.Store',{
			model: 'PortfolioItem',
			fetch: ['ObjectID','FormattedID','Name',this._getPredecessorFieldName(),this._getSuccessorFieldName()],
			filters: {property: 'ObjectID', value:object_id},
			autoLoad: true,
			listeners: {
				scope:this, 
				load: function(store, records){
					console.log('load complete');
					deferred.resolve(records);

				}
			}
		});
 		//TODO what do we do if the load event is never fired? The promise is never resolved or rejected 
 		return deferred.promise; 
        },
    
    _getObjectIdsFromRelativeHtml: function(html){
    	
		this.logger.log('_getObjectIdsFromRelativeHtml - input html', html);
		var el = document.createElement( 'div' );
    	el.innerHTML = html;

		var relative_divs = el.getElementsByTagName( 'div' ); // Live NodeList of your anchor elements

		var object_ids = [];
		if (relative_divs.length > 0){
			for (var i=0; i<relative_divs.length; i++){
				if (!isNaN(relative_divs[i].id))
				{
					object_ids.push(relative_divs[i].id);
				}
				else
				{
					this.logger.log('WARNING: Invalid ObjectID in custom field.  Relative will not be loaded:', relative_divs[i].id );
				}
    		}
		}
		this.logger.log('_getObjectIdsFromRelativeHtml - output ids', object_ids);
		return object_ids;
    },

    /*
     * 
     * Add predecessor and successor grids, add buttons and save\cancel button 
     * 
     */
    _addRelativeSelector: function(container_id, grid_id, add_handler_function, remove_handler_function, relative_store){
    	var me = this;
    	this.down(container_id).removeAll();
     	
    	//Add the grid 
    	this._addRelativeGrid (container_id, relative_store,grid_id);
    	
    	//Add the button
    	this.down(container_id).add({
    			xtype: 'rallybutton',
    			text: '+Add',
    			id: container_id + '_add_button',
        		style: {margin: '5px'},
    			scope: this,
    			handler: add_handler_function
    	});

    	this.down(container_id).add({
    		xtype:'rallybutton',
    		text: 'Remove Selected',
    		id: container_id + '_remove_button',
    		style: {margin: '5px'},
    		scope: this,
    		listeners: {
    			click: remove_handler_function,
    			scope: this
    		}//,
    		//handler: remove_handler_function
    	});

    },
   
    _addRelativeGrid: function(container_id, store, grid_id){
    	
    	var title = 'Successors';
    	if (container_id == '#predecessor_box') {
    		title = 'Predecessors';
    	}
    	
    	this.down(container_id).add({
    		xtype: 'rallygrid',
    		title: title,
    		id:grid_id,
    		store: store,
    		enableEditing: false,
    		enableRanking: false,
    		showRowActionsColumn: false,
    		showPagingToolbar: false,
    		selModel: {
    			selType: 'checkboxmodel', 
    			mode:'MULTI', 
    			itemId: container_id + '_selmodel',
    			listeners: {
    				scope:this,
    				selectionchange: function(selection_model, selected)
    				{
    					//TODO Set button disabled
    				}
    			}
    		},
    		scope:this,
    		columnCfgs: [
    		             {
    		            	 text: 'ID', dataIndex: 'FormattedID', flex:1
    		             },
    		             {
    		            	 text: 'Name', dataIndex: 'Name', flex: 1
    		             },
    		             ]
    	});

    },

    _getPortfolioItemDisplayText: function(pi_record){
    	if (pi_record == null || pi_record == undefined){
    		return 'Not Defined';
    	}
    	return pi_record.data.FormattedID + ' - ' + pi_record.data.Name;
    },

    /*
     * 
     * Adding relatives to the selected portfolio item 
     * 
     */
    _addRelatives: function(selected_records, grid_id){
    	//This function assumes that selected_records is an array of data records of the portfolio items model

		//combine selected records in the grid store
    	var grid = this.down(grid_id);
    	grid.getStore().add(selected_records);
   	
    },
    _chooseSuccessors: function(){
    	var me=this;
    	Ext.create('Rally.ui.dialog.ChooserDialog', {
    	    artifactTypes: ['portfolioitem'],
    	    autoShow: true,
    	    multiple: true,
    	    title: 'Choose Successor Items',
			storeConfig: {
				fetch: ['Name', 'FormattedID', me._getPredecessorFieldName(), me._getSuccessorFieldName()]
			},
    	    scope: this,
    	    listeners: {
    	        artifactChosen: function(selectedRecords){
    	        	this._addRelatives(selectedRecords,'#successor_grid');
    	        	this._appendToRelativeItem(selectedRecords,this._getPredecessorFieldName(),this.selected_portfolio_item);
    	        	this._updateCurrentItem(this.selected_portfolio_item,'#successor_grid', this._getSuccessorFieldName());
    	        },
    	        scope: this
    	    }	
    	 });
    },
    _choosePredecessors: function(){
    	var me=this;
    	Ext.create('Rally.ui.dialog.ChooserDialog', {
    	    artifactTypes: ['portfolioitem'],
    	    autoShow: true,
    	    multiple: true,
    	    title: 'Choose Predecessor Items',
			storeConfig: {
				fetch: ['Name', 'FormattedID', me._getPredecessorFieldName(), me._getSuccessorFieldName()]
			},
    	    listeners: {
    	        artifactChosen: function(selectedRecord){
    	        	this._addRelatives(selectedRecord,'#predecessor_grid');
    	        	this._appendToRelativeItem(selectedRecord,this._getSuccessorFieldName(),this.selected_portfolio_item);
    	        	this._updateCurrentItem(this.selected_portfolio_item,'#predecessor_grid', this._getPredecessorFieldName());
    	        },
    	        scope: this
    	    }
    	 });
    },
    _appendToRelativeItem: function(selected_records, target_field_name, item_to_append){

    	var me = this;	
    	Ext.Array.each(selected_records, function(selected_record){
    		var new_content = me._addToHtml(item_to_append, selected_record.get(target_field_name));
      		console.log('APPEND NEW DATA TO RELATIVE', selected_record.get('ObjectID'), selected_record.get('FormattedID'), new_content, target_field_name);
            
      		me._updateRelativeData(selected_record, target_field_name, new_content).then({
            	scope:this,
            	success: function(){
            		me.logger.log('_appendToRelativeItem SUCCESSFUL');
            	},
            	failure: function(){
            		me.logger.log('_appendToRelativeItem FAILED');
            	}
            });

	 	});
    },		
    
    _addToHtml: function(item_to_add,html){
    	
    	var object_id_to_add = item_to_add.get('ObjectID');
    	var el = document.createElement( 'span' );
    	el.innerHTML = html;

		var relative_divs = el.getElementsByTagName( 'div' ); // Live NodeList of your anchor elements

		if (relative_divs.length > 0){
			for (var i=0; i<relative_divs.length; i++){
				if (!isNaN(relative_divs[i].id))
				{
					if (relative_divs[i].id == object_id_to_add){
						//don't add again, or maybe we want to remove and add again
						return html;  
					}
				}
			}

		} 		
		html += this._formatRelativeData([item_to_add]);
		return html;
    },

    _updateCurrentItem: function(target_item,grid_id, relative_field_name){
    	//Updates the relative data fields (as defined in the settings) per the state of the current grid (grid_id)
    	
        this.logger.log('_updateCurrentItem', target_item, grid_id, relative_field_name);
    	var relative_items = this.down(grid_id).getStore().data.items;
        var relative_content = this._formatRelativeData(relative_items);
        
        this._updateRelativeData(target_item, relative_field_name, relative_content).then({
        	success: function(){
        		this.logger.log('_updateCurrentItem SUCCESSFUL');
        	},
        	failure: function(){
        		this.logger.log('_updateCurrentItem FAILED');
        	}
        });
    },	 	
    
    _stripFromHtml: function(object_id_to_remove,html){
     	var el = document.createElement( 'div' );
    	el.innerHTML = html;
		var relative_divs = el.getElementsByTagName( 'div' ); // Live NodeList of your anchor elements
		if (relative_divs.length > 0){
			for (var i=0; i<relative_divs.length; i++){
				if (!isNaN(relative_divs[i].id))
				{
					if (relative_divs[i].id == object_id_to_remove){
						el.removeChild(relative_divs[i]);
					}
				}
			}
			this.logger.log('_stripFromHtml OLD CONTENT', html, 'NEW CONTENT', el.innerHTML);	
			html = el.innerHTML;
		} 		
		return html;
    },
    
    _updateRelativeData: function(target_item, target_field, update_content){
    	var deferred = Ext.create('Deft.Deferred');
    	
    	//Updates the target model with the new content 
    	target_item.set(target_field, update_content);
    	target_item.save({
    		scope: this,
    		callback: function(record, operation){
    			if (operation.wasSuccessful())
    			{
					this.logger.log('Update Successful', target_item.get('ObjectID'), target_field, update_content);
					deferred.resolve();
				}
				else 
				{
					this.logger.log('Update Failed', target_item.get('ObjectID'), target_field, update_content);
					deferred.reject();
				}
    		}
    	});
    	return deferred.promise;
    },
    
    
   _removeFromRelativeItem: function(selected_record, object_id_to_remove,remove_from_field){
    	var deferred = Ext.create('Deft.Deferred');
    	var me= this;

    	var orig_content = selected_record.get(remove_from_field);
    	var new_content = me._stripFromHtml(object_id_to_remove, orig_content); 
		
		this._updateRelativeData(selected_record, remove_from_field, new_content).then({
			scope:this,
			success: function(){
				deferred.resolve();
			},
			failure: function(){
				deferred.reject();
			}
		});
    	return deferred.promise; 
    },
    
	_removeFromSelectedRelativeItems: function(selected_records, remove_from_field, item_to_remove){
    	var deferred = Ext.create('Deft.Deferred');
    	var me = this;	
    	
        var object_id_to_remove = item_to_remove.get('ObjectID');

        var promises = [];
	 	Ext.Array.each(selected_records, function(selected_record){
 			promises.push( me._removeFromRelativeItem(selected_record,object_id_to_remove,remove_from_field));
//	 		promises.push(function() {return me._removeFromRelativeItem(selected_record,object_id_to_remove,remove_from_field);});
	 		});
	 		Deft.Promise.all(promises).then({
	 					scope: this,
	 					success: function(){
	 						console.log('_removeFromRelativeItem Return Success');
	 						deferred.resolve();
	 					},
	 					failure: function(){
	 						me.logger.log('_removeFromRelativeItem Relatives failed to save');
	 						deferred.reject('Relatives failed to save');
	 					}
	 		}).always(function(){
	 			console.log('Always remove relatives');
	 		});
    	return deferred;
    },
   
  	
    /*
     * 
     * Removing relatives from the current portfolio item
     * 
     */
    _removeRelatives: function(grid_id){
    	var grid = this.down(grid_id);
    	
    	var selected_records = grid.selModel.getSelection();
    	if (selected_records && selected_records.length > 0 ){
	   		if (grid_id == '#successor_grid')
	       	{
	  		 		remove_field_from_relative = this._getPredecessorFieldName();
	   		 		remove_field_from_me = this._getSuccessorFieldName();
		 	}
	       	else
	       	{
	   		       remove_field_from_relative = this._getSuccessorFieldName();     
	   		       remove_field_from_me = this._getPredecessorFieldName();
	       	}
	   		this._removeFromSelectedRelativeItems(selected_records, remove_field_from_relative, this.selected_portfolio_item ).then({
	   			scope:this,
	        	success: function() {
	        		this.logger.log('Promise returned.  Portfolio item successors and predecessors updated successfully.');
	        		grid.getStore().remove(selected_records);
	            	this._updateCurrentItem(this.selected_portfolio_item,grid_id, remove_field_from_me);
	        	},
	        	failure: function(){
	        		this.logger.log('Failed to Remove Relatives. Portfolio Item was not updated.');
	        	}
	   		});

    	}
    },  
    _removeSuccessors: function(){
    	this._removeRelatives('#successor_grid');
    },
    _removePredecessors: function(){
    	this._removeRelatives('#predecessor_grid');
    },

 /*
  * 
  * Settings related code below here 
  * 
  */
//Overrides getSettingsFields in Rally.app.App
getSettingsFields: function() {

    var _chooseOnlyTextFields = function(field){
        var should_show_field = true;

        if ( field.hidden ) {
            should_show_field = false;
        }
        if ( field.attributeDefinition ) {
            var type = field.attributeDefinition.AttributeType;
            if ( type != "TEXT"  ) {
                should_show_field = false;
            }
        } else {
            should_show_field = false;
        }

        return should_show_field;
    };
	
    return [{
        name: 'pi_predecessor_field_name',
        xtype: 'rallyfieldcombobox',
        model: 'PortfolioItem',
        fieldLabel: 'Portfolio Item Predecessor Field',
        width: 300,
        labelWidth: 200,
        _isNotHidden: _chooseOnlyTextFields,
        value: this._getPredecessorFieldName(),
       //valueField: 'name',
        readyEvent: 'ready' //event fired to signify readiness
    },
    {
        name: 'pi_successor_field_name',
        xtype: 'rallyfieldcombobox',
        model: 'PortfolioItem',
        fieldLabel: 'Portfolio Item Successor Field',
        _isNotHidden: _chooseOnlyTextFields,
        width: 300,
        labelWidth: 200,
        value: this._getSuccessorFieldName(),
        //valueField: 'name',
        readyEvent: 'ready' //event fired to signify readiness
    }];
},
// ONLY FOR RUNNING EXTERNALLY
_showExternalSettingsDialog: function(fields){
	var me = this;
    if ( this.settings_dialog ) { this.settings_dialog.destroy(); }
    this.settings_dialog = Ext.create('Rally.ui.dialog.Dialog', {
         autoShow: false,
         draggable: true,
         width: 400,
         title: 'Settings',
         buttons: [{ 
            text: 'OK',
            handler: function(cmp){
                var settings = {};
                Ext.Array.each(fields,function(field){
                	me.logger.log(field.name, '=',cmp.up('rallydialog').down('[name="' + field.name + '"]').getValue() );
                	settings[field.name] = cmp.up('rallydialog').down('[name="' + field.name + '"]').getValue();
                });
                me.settings = settings;
                cmp.up('rallydialog').destroy();
            }
        }],
         items: [
            {xtype:'container',html: "&nbsp;", padding: 5, margin: 5},
            {xtype:'container',itemId:'field_box', padding: 5, margin: 5}]
     });
     Ext.Array.each(fields,function(field){
    	me.logger.log('Add: ', field.name, field.value); 
        me.settings_dialog.down('#field_box').add(field);
     });
     this.settings_dialog.show();
}
});//    
/*
 * Override so that the settings box fits (shows the buttons)
 */
//showSettings: function(options) {
//    this._appSettings = Ext.create('Rally.app.AppSettings', {
//        fields: this.getSettingsFields(),
//        settings: this.getSettings(),
//        defaultSettings: this.getDefaultSettings(),
//        context: this.getContext(),
//        settingsScope: this.settingsScope
//    });
//
//    this._appSettings.on('cancel', this._hideSettings, this);
//    this._appSettings.on('save', this._onSettingsSaved, this);
//
//    this.hide();
//    this.up().add(this._appSettings);
//
//    return this._appSettings;
//}
//});