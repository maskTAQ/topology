//下拉列表
$.fn.dropList = function() {
    var _this = $(this),
        button = _this.children('p'),
        //button_icon = button.children('.fa'),
        list_group = _this.children('ul');

    //定义下拉方法 切换class
    button.on('click', function(e) {
        e.stopPropagation();
        _this.toggleClass('active');
        //list_group.slideToggle('active');

    });

    //点击item
    list_group.children().each(function(i, item) {
        $(item).on('click', function(e) {
            e.stopPropagation();
            button.text($(this).text());
            button.click();
        });
    });

    $('body').on('click', function() {
        if (_this.hasClass('active')) {
            button.click();
        }
    })
}

function bindListEnevt() {
    M = {
        submitEdit: function(oldValue, newValue, dom) {


            if (oldValue == newValue) {
                return
            } else {
                dom.addClass('saving');
                setTimeout(function() {
                    dom.removeClass('saving');
                }, 2000)
            }

        },
        hintUser: function(v) {
            console.log(v)
        }
    }
    $('.options.editable').dropList();
    $('.group-title').on('click', function() {
        $(this).toggleClass('active');
        $(this).siblings('.group-item-wrapper').slideToggle();
    })
    $('.item-content').on('click', function(e) {
        e.stopPropagation();
        var _this = $(this),
            is_text_status = Boolean(_this.children('p').length),
            is_editable = Boolean(!$(this).hasClass('readonly')),
            is_saving = Boolean($(this).hasClass('saving'));

        //处在未正在保存状态
        if (is_saving) {
            M.hintUser('上次编辑的还未保存完毕哦');
            return
        }
        //如果此项可编辑、处在文本状态
        if (is_editable && is_text_status) {
            var text_dom = _this.children('p'),
                text = text_dom.text(),
                input_dom = $('<input type="text">');

            _this.empty().append(input_dom.val(text));

            var emitSubmit = function() {
                    var input_value = input_dom.val();
                    _this.empty().append('<p>' + input_value + '</p>');
                    M.submitEdit(text, input_value, _this);
                }
                //让input获得焦点
            input_dom.focus();
            input_dom.off('blur', emitSubmit);
            input_dom.on('blur', emitSubmit);


        }
    });
}
window.onload = function() {
    var viewOptions = {
        domId: 'diagramDiv',
        //dom id
        // 设备数据
        nodeDataArray: [{
            "key": "1",
            "name": "router",
            "to": [],
            "__gohashid": 1144,
            "loc": "0 0"
        }, {
            "key": "2",
            "name": "网关",
            //"to": ["router"],
            "__gohashid": 1145,
            "loc": "-130.0000000000001 102"
        }, {
            "key": "3",
            "name": "SRC001",
            type: 'SRC001',
            "to": ["网关"],
            "__gohashid": 1146,
            "loc": "-197.0000000000002 296"
        }, {
            "key": "4",
            "name": "tts",
            "to": ["网关", "LED"],
            "__gohashid": 1147,
            "loc": "-36 297.0000000000001"
        }, {
            "key": "5",
            "name": "LED",
            "to": ["router"],
            "__gohashid": 1148,
            "loc": "151.9999999999999 142.0000000000001"
        }, {
            "key": "8",
            "name": "SRC001",
            type: 'SRC001',
            "to": ["SRC001"],
            "loc": "-197.0000000000002 478.0000000000001"
        }, {
            "key": "9",
            "name": "SRC002",
            type: 'SRC002',
            "to": ["SRC001.DO2"],
            "loc": "-127.0000000000002 378.0000000000001"
        }],
        linkDataArray: [{
                "__gohashid": 2582,
                "from": "2",
                "to": "1",
                'label': 'sss',
                "fromPort": "output",
                "toPort": "input"
            }, {
                "__gohashid": 2917,
                "from": "3",
                "to": "2",
                "fromPort": "output",
                "toPort": "input"
            }, {
                "__gohashid": 3048,
                "from": "4",
                "to": "2",
                "fromPort": "output",
                "toPort": "input"
            }, {
                "__gohashid": 5333,
                "from": "5",
                "to": "1",
                "fromPort": "output",
                "toPort": "input"
            }] //线条数据 可填空数组
    };
    var panelOptions = {
        domId: 'myPaletteDiv',
        //控制面板id
        model: [{
            name: 'router',
            to: []
        }, {
            name: 'gateway',
            to: ['router']
        }, {
            type: 'SRC001',
            name: 'SRC001',
            to: ['网关']
        }, {
            type: 'SRC002',
            name: 'SRC002',
            to: ['网关']
        }, {
            name: '传感器',
            to: ['SRC002']
        }]
    };

    var portChange = function(toPortId, status) {
        switch (true) {
            case status === 'start':
                $('.port-hint').text(toPortId).show(0);
                return;
            case status === 'changing':
                $('.port-hint').text(toPortId);
                return;
            case status === 'end':
                $('.port-hint').text(toPortId).hide(0);
                return;
        }
    }

    var listParse = function() {
        var listData = [];
        $('.group-box').each(function(i, group) {
            group = $(group);
            var name = group.children('h2').text();
            var data = [];
            group.find('.group-item-box').each(function(i, item) {
                item = $(item);
                if (item.find('.item-content').length) {
                    data.push({
                        name: item.find('.item-title p').text(),
                        value: item.find('.item-content p').text()
                    });
                } else {
                    data.push({
                        name: item.find('.item-title p').text(),
                        value: item.find('.options p').text()
                    });
                }

            });
            listData.push({
                name: name,
                data: data
            });
        });
        return listData;
    }

    var getDeiveDetail = function(a, b, c) {
        $('.device-info-wrapper').empty();
        createList(data);
        bindListEnevt();
    }


    Smt_topology.init(viewOptions, panelOptions, {
        getDeviceDetail: getDeiveDetail,
        portChange: portChange
    });

    $('.save').on('click', function() {
        console.log(listParse());
        console.log(Smt_topology.save());
        setTimeout(function() {
            layer.msg('保存成功');
        }, 500);
    });

    $('.reset').on('click', function() {
        layer.msg('重置成功');
        setTimeout(function() {
            location.reload();
        }, 500);

    });
}