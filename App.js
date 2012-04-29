var lumenize = require('./lumenize');

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    items:[
        {
            xtype: 'panel',
            layout: 'anchor',
            border: true,
            fieldDefaults: {
                labelWidth: 40
            },
            defaultType: 'textfield',
            bodyPadding: 5,
            items: [
                {
                    fieldLabel: 'Query',
                    itemId: 'queryField',
                    anchor:'100%',
                    width: 700,
                    height: 100,
                    xtype: 'textarea',
                    value: '{\n'+
                            '    "$and": [ {"KanbanState": {"$gte":"In Dev"}}, {"KanbanState": {"$lt":"Accepted"}} ],\n'+
                            '    "__At": "current"\n'+
                            '}'
                },
                {
                    fieldLabel: 'Fields',
                    itemId: 'fieldsField',
                    anchor: '100%',
                    width: 700,
                    value: "ObjectID, KanbanState"
                },
                {
                    fieldLabel: 'Sort',
                    itemId: 'sortField',
                    anchor: '100%',
                    width: 700,
                    value: "{'ObjectID' : -1, '_ValidFrom': 1}"
                },
                {
                    fieldLabel: 'Page Size',
                    itemId: 'pageSizeField',
                    anchor: '100%',
                    width: 700,
                    value: '1000'
                }
            ],
            
            buttons: [
                {
                    xtype: 'rallybutton',
                    text: 'Chart It!',
                    itemId: 'chartButton'
                }
            ]
        },
        {
            xtype: 'panel',
            itemId: 'chartHolder',
            layout: 'fit',
            height: 400,
            margin: '0 0 200 0'
        }
    ],
    launch: function() {
        var button = this.down('#chartButton');
        button.on('click', this.chartClicked, this);
    },
    
    chartClicked: function(){
        
        var queryField = this.down('#queryField');
        var query = queryField.getValue();
        var selectedFields = this.down('#fieldsField').getValue();
        if(selectedFields){
            if(selectedFields === 'true'){
                selectedFields = true;
            }
            else{
                selectedFields = selectedFields.split(', ');
            }
        }
        
        var sort = this.down('#sortField').getValue();
        
        var pageSize = this.down('#pageSizeField').getValue();
        var parsedPageSize = parseInt(pageSize, 10);
        // don't allow empty or 0 pagesize
        pageSize = (parsedPageSize) ? parsedPageSize : 10;

        var callback = Ext.bind(this.processSnapshots, this);
        this.doSearch(query, selectedFields, sort, pageSize, callback);
    },
    
    createSortMap: function(csvFields){
        var fields = csvFields.split(', ');
        var sortMap = {};
        for(var field in fields){
            if(fields.hasOwnProperty(field)){
                sortMap[field] = 1;
            }
        }
        
        return sortMap;
    },
    
    doSearch: function(query, fields, sort, pageSize, callback){
        var workspace = this.context.getWorkspace().ObjectID;
        var queryUrl = 'https://rally1.rallydev.com/analytics/1.32/'+ workspace +
                        '/artifact/snapshot/query.js';
        var params = {
            find: query
        };
        
        if(fields){
            //TODO can't handle $slice expression
            params.fields = Ext.JSON.encode(fields);
        }
        
        if(sort){
            params.sort = sort;
        }
        
        if(pageSize){
            params.pagesize = pageSize;
        }
        
        Ext.Ajax.cors = true;
        Ext.Ajax.request({
            url: queryUrl,
            method: 'GET',
            params: params,
            withCredentials: true,
            success: function(response){
                var text = response.responseText;
                var json = Ext.JSON.decode(text);
                callback(json.Results);
            }
        });
    },
    
    processSnapshots: function(snapshots){
        var groupBySpec = {
        	groupBy: 'KanbanState',
        	aggregations: [
        		{
        			field: 'ObjectID',
        			f: '$count'
        		}
        	]
        };
        
        var groups = lumenize.groupBy(snapshots, groupBySpec);
        var rows = this.convertGroupingsToRows(groups);
        
        var snapshotStore = Ext.create('Ext.data.Store', {
            storeId:'snapshotStore',
            fields: ["KanbanState", "ObjectID_Count"],
            data: rows,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'rows'
                }
            }
        });
        
		var chart = {
			xtype : 'highchart',
			id : 'chart',
			height: 400,
			series : [{
			  type : 'column',
			  dataIndex : 'ObjectID_Count',
			  name : 'Count',
			  visible : true
			}],
			store : snapshotStore,
			xField : 'KanbanState',
			chartConfig : {
			  chart : {
				marginRight : 130,
				marginBottom : 250,
				zoomType : 'x',
				animation : {
				  duration : 1500,
				  easing : 'swing'
				}
			  },
			  title : {
				text : 'Kanban State Counts',
				align: 'center'
			  },
			  xAxis : [{
				title : {
				  text : 'KanbanState',
				  margin : 40
				},
				labels : {
				  align: 'right',
				  rotation : 300
				}
			  }],
			  yAxis : {
				title : {
				  text : 'Count'
				},
				plotLines : [{
				  value : 0,
				  width : 1,
				  color : '#808080'
				}]
			  },
			  plotOptions : {
				series : {
				  animation : {
					duration : 3000,
					easing : 'swing'
				  }
				}
			  },
			  tooltip : {
				formatter : function() {
				  return this.x + ': ' + this.y;
				}
			  },
			  legend : {
				layout : 'vertical',
				align : 'right',
				verticalAlign : 'top',
				x : -10,
				y : 100,
				borderWidth : 0
			  }
			}
		  };
        
        var chartHolder = this.down('#chartHolder');
        chartHolder.removeAll(true);
        chartHolder.add(chart);
    },
    
    convertGroupingsToRows: function(groups){
    	var rows = [];
    	
    	for(var group in groups){
    		if( groups.hasOwnProperty(group) ){
    			rows.push({
    				"KanbanState": group,
    				"ObjectID_Count": groups[group]['ObjectID_$count']
    			});
    		}
    	}
    	
    	return { "rows": rows };
    },
    
    getFieldsFromSnapshots: function(snapshots){
        if(snapshots.length === 0){
            return [];
        }
        
        var snapshot = snapshots[0];
        var fields = [];
        for(var key in snapshot){
            if (snapshot.hasOwnProperty(key)){
                fields.push(key);
            }
        }
        
        return fields;
    },
    
    createColumnsForFields: function(fields){
        var columns = [];
        for(var i=0; i < fields.length; ++i){
            var col = {
                header: fields[i],
                dataIndex: fields[i]
            };
            
            if(fields[i] === 'Name'){
                col.flex = 1;
            }
            columns.push(col);
        }
        
        return columns;
    }
});