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
          	    	itemId: 'predecessor_box', 
          	    	layout: {type: 'vbox'},
          	    	flex: 1
          	    },
          	    {
          	    	xtype: 'container', 
          	    	itemId: 'successor_box', 
          	    	layout: {type: 'vbox'},
          	    	flex: 1
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
            // not inside Rally
    		this.logger.log ('Usage is external.');
    		this._showExternalSettingsDialog(this.getSettingsFields());
        } else {
            this.logger.log ('Usage is internal.'); 
        	//this._getData();
        }
    	
    	//Build the UI 
        this.down('#portfolio_item_box').add(
    	{
    		xtype: 'rallybutton',
    		id: 'portfolio_item_box_select_button',
    		text: 'Select...',
    		scope: this,
    		handler: function()
    		{
    			this._selectPortfolioItems();
    		}
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
    				listeners: {
    					artifactChosen: function (selectedRecords){
    						if (selectedRecords == undefined)
    							{
    							Ext.Msg.alert('Chooser', 'Please select a Portfolio Item');
    							return;
    							}
    						me._setCurrentItem(selectedRecords);
    						me._addRelativeSelectors(selectedRecords);
    					}
    				}
    			}
    			);
    },
    _setCurrentItem: function(selected_record){
    	this.selected_portfolio_item = selected_record;
    	console.log(this.selected_portfolio_item);
    },
    _saveRelatives: function(){
    	//This function saves the selected predecessors and successors to all items  

    	//First, save the selected predecessors and successors to the current item
        var successor_field_name = this.getSetting('pi_successor_field_name');
        this._saveRelativeData(this.selected_portfolio_item, '#successor_grid',successor_field_name);
 
        var predecessor_field_name = this.getSetting('pi_predecessor_field_name');
        this._saveRelativeData(this.selected_portfolio_item, '#predecessor_grid',predecessor_field_name);
        
        //Next, save the current item to the other successors\predecessor items (bi-directional)
    	
    },
    _saveRelativeData: function(target_item,grid_id, relative_field_name){
        this.logger.log('_saveRelativeData', target_item, grid_id, relative_field_name);
    	var relative_items = this.down(grid_id).getStore().data.items;
        var relative_content = this._formatRelativeData(relative_items);
        
        target_item.set(relative_field_name, relative_content);
        target_item.save();
    },
    _formatRelativeData: function (data_items){
    	var content = '';
    	for (var i=0; i < data_items.length; i++){
    		//create the HTML Link 
    		console.log(data_items[i]);
    		content += '<a href="' + Rally.nav.Manager.getDetailUrl(data_items[i]) + '">' + data_items[i].get('FormattedID') + '</a> - ' + data_items[i].get('Name') + '<br>';
    	}
    	return content;
    },
    _loadCurrentRelatives: function(selected_record){
    
    },
    
    _addRelativeSelectors: function(selected_records){
		//This function clears out the existing portfolio item, resets the buttons
    	console.log('_addRelativeSelectors', this.getId());

    	var me = this; 
        console.log(me._getPortfolioItemDisplayText(selected_records));
        me.down('#portfolio_item_box').add(
        		{
        			xtype: 'rallytextfield',
        			value: me._getPortfolioItemDisplayText(selected_records),
        			id:'portfolio_item_box_text'
        		});
   	
    	//Add buttons 
    	me._addRelativeSelector('#predecessor_box','predecessor_grid',this._choosePredecessors);
    	me._addRelativeSelector('#successor_box','successor_grid',this._chooseSuccessors);
        me._addSaveCancelButtons();
   	
    },
    _addSaveCancelButtons: function(){
    	var me = this;
    	this.down('#save_cancel_box').add(
    			{
    				xtype:'rallybutton',
    				text:'save',
    				id: 'save_cancel_box_save_button',
    				scope:this,
    				handler: me._saveRelatives
    			});
    },
    /*
     * 
     * Add predecessor and successor grids, add buttons and save\cancel button 
     * 
     */
    _addRelativeSelector: function(container_id, grid_id, add_handler_function){
    	var me = this;
    	this.down(container_id).removeAll();
    	
    	
    	//Add the records (if they exist) 
  	
    	var relative_store = Ext.create('Rally.data.custom.Store',{
    		data: null,
    		pageSize: 10
    	});
    	
    	//Add the grid 
    	this._addRelativeGrid (container_id, relative_store,grid_id);
    	
    	
    	//Add the button
    	this.down(container_id).add({
    			xtype: 'rallybutton',
    			text: '+Add',
    			id: container_id + '_add_button',
    			scope: this,
    			handler: add_handler_function
    	});

    },
   
    _addRelativeGrid: function(container_id, store, grid_id){
    	this.down(container_id).add({
    		xtype: 'rallygrid',
    		id:grid_id,
    		store: store,
    		enableEditing: false,
    		enableRanking: false,
    		showRowActionsColumn: false,
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
    	    listeners: {
    	        artifactChosen: function(selectedRecord){
    	        	this._addRelatives(selectedRecord,'#successor_grid');
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
    	    listeners: {
    	        artifactChosen: function(selectedRecord){
    	        	this._addRelatives(selectedRecord,'#predecessor_grid');
    	        },
    	        scope: this
    	    }
    	 });
    },
    _queryCompForSuccessors: function(component){
    	return (component.getItemId().search('successor_list_item')>=0);
    },
//    _getRelativeContent: function(selected_record){
//    	var content = '<a href="' + Rally.nav.Manager.getDetailUrl(selected_record) + '">' + this._getPortfolioItemDisplayText(selected_record) + '</a><br>';
//    	return content; 
//    },

    
    
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
    	if (should_show_field) {
    		console.log('_chooseOnlyTextFields', field);
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
        value: this.getSetting('pi_predecessor_field_name'),
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
        value: this.getSetting('pi_successor_field_name'),
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
                console.log (me.settings);
                cmp.up('rallydialog').destroy();
                //me._getData();
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
},    
/*
 * Override so that the settings box fits (shows the buttons)
 */
showSettings: function(options) {
    this._appSettings = Ext.create('Rally.app.AppSettings', {
        fields: this.getSettingsFields(),
        settings: this.getSettings(),
        defaultSettings: this.getDefaultSettings(),
        context: this.getContext(),
        settingsScope: this.settingsScope
    });

    this._appSettings.on('cancel', this._hideSettings, this);
    this._appSettings.on('save', this._onSettingsSaved, this);

    this.hide();
    this.up().add(this._appSettings);

    return this._appSettings;
}
});
