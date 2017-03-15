	var data = [{
		name: 'address',
		data: [{
			"name": 'Address',
			"value": 1,
			"readonly": true
		}]
	}, {
		name: 'version',
		data: [{
			"name": 'Version',
			"value": 'V1.0',
			"readonly": true
		}]
	}, {
		name: 'remark',
		data: [{
			"name": 'Remark',
			"value": '温湿光一体设备,采集温度、湿度、光照三个参数.',
			"readonly": false
		}]
	}, {
		name: 'basis',
		data: [{
			"name": 'Company',
			"value": '斯玛特',
			"readonly": true
		}, {
			"name": 'Guid',
			"value": '1111-2222',
			"readonly": true
		}, {
			"name": 'Name',
			"value": '温湿光设备',
			options: ['A', 'b', 'V'],
			"readonly": false
		}]
	}, {
		name: 'protocolType',
		data: [{
			name: 'protocolType',
			"value": "Modbus"
		}]
	}];

	function createList(data) {
		var group_wrapper_html = '<div class="group-wrapper">'
		data.forEach(function(group) {
			var group_box_html = '<div class="group-box">\
                   <h2 class="group-title clearfix"><i class="icon"></i>' + group.name + '</h2>\
                   <div class="group-item-wrapper">'
			group.data.forEach(function(item) {
				var class_html = item.readonly ? ' readonly' : ' editable';
				if (item.options) {
					var list_html = ''
					item.options.forEach(function(list) {
						list_html += '<li>' + list + '</li>';
					});
					group_box_html += '<div class="group-item-box">\
                           <div class="item-title"><p>' + item.name + '</p></div>\
                           <div class="options' + class_html + '"><p>' + item.value + '</p><ul>' + list_html + '</ul></div>\
                       </div>';
				} else {
					group_box_html += '<div class="group-item-box">\
                           <div class="item-title"><p>' + item.name + '</p></div>\
                           <div class="item-content' + class_html + '"><p>' + item.value + '</p></div>\
                       </div>';
				}

			});


			group_box_html += '</div></div>';
			group_wrapper_html = group_wrapper_html + group_box_html;


		});
		group_wrapper_html = group_wrapper_html + '</div>';
		$('.device-info-wrapper').append(group_wrapper_html);
	}