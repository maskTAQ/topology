/*
*includes go-debug.js or go.js,Guid.js
================使用说明================
## init
==============初始化拓扑图================
Smt_topology.init({
    domId: 'domId',
    //dom id
    // 设备数据
    nodeDataArray: [{
        //设备key
        key: '1',
        //设备名称
        name: 'co2',
        //设备可接入其他设备的名称集 必须是数组 可不填此选项
        to: ['co2', 'co3']
    },
    {
        key: '2',
        name: 'co3',
        to: ['co4', 'co3']
    }],
    linkDataArray: [] //线条数据 可填空数组
},
{
    domId: 'id',//控制面板id
    model: [{
        name: 'router',
        to: []
    },
    {
        name: 'gateway',
        to: ['router']
    },
    {
        type: 'SRC001',
        name: 'SRC001',
        to: ['网关']
    },
    {
        type: 'SRC002',
        name: 'SRC002',
        to: ['网关']
    },
    {
        name: '传感器',
        to: ['SRC002']
    }]
});

*****第二参数可不填 填写即开启配置控制面板辅助编辑拓扑图*****

## API
==============添加设备==============
Smt_topology.createDevice({
    name: 'deviceName',//设备名
    to: ['co2']//设备可接入其他设备的名称集 必须是数组  可不填此选项
});
==============保存数据==============
Smt_topology.save();//返回包含设备信息和线条信息的对象


================2017-3-8 15.43================
*/
;
(function() {
    //定义视图 在initView中初始化
    var diagram, model, $;

    //在全局初始化 以变在M.monitorPortChange 中使用
    var portChangeCallback;

    var getDeviceDetailCallback;

    var initView = function(domId, panelInfo) {
        $ = go.GraphObject.make;

        diagram = $(go.Diagram, domId, { //内容居顶部显示
            initialContentAlignment: go.Spot.Top,
            "undoManager.isEnabled": true,
            allowDrop: Boolean(panelInfo) // must be true to accept drops from the Palette 判断是否传了面板信息开启面板功能
        });

        //端口名字 是否是接出端口 多端口时的端口数量(单一单口不填)
        function makePort(name, leftside, portSize) {
            //设置端口的目的是如果不给节点设置端口 那么整个节点都是端口 拖动节点的时候默认值画线的 用其他比如字体代替节点也不够形象
            var port = $(go.Shape, "RoundedRectangle", {
                stroke: null,
                //端口的大小
                desiredSize: new go.Size(85, 9),
                //端口id 用以识别线段连到什么端口了(必须添加此属性 不然没法连到端口上)
                portId: name,
                //一个设备最多可以接到一个设备上(一个设备出口最多只有一个)
                fromMaxLinks: 1,
                //鼠标移到端口上的手势
                cursor: "pointer"
            });


            //定义端口承载面板
            var panel = $(go.Panel, "Vertical");

            //为true的端口是出只能接到别的设备上 反之端口只允许别的设备接入
            if (leftside) {
                port.fromLinkable = true;
                port.fill = '#40a0ff'; //修改输出端口颜色
                port.margin = new go.Margin(0, 0, -5, 0);
                panel.add(port);
            } else {
                port.toLinkable = true;
                port.fill = "#82a8c0";
                port.margin = new go.Margin(-5, 0, 0, 0);
                panel.add(port);
            }

            //如果是RTU这种接入是多个端口的
            if (portSize) {
                port.toMaxLinks = 1; //设置输出端口数量 就是RTU端口可以接入的数量

                if (portSize == 20) {
                    port.desiredSize = new go.Size(4, 4);
                    port.margin = new go.Margin(0, 0.5, 5, 0);

                } else if (portSize == 8) {
                    port.desiredSize = new go.Size(10, 4, 5, 0);
                    port.margin = new go.Margin(0, 1.4);
                }

            }



            return panel;
        }

        function makeMultiPort(size) {
            var portArr = [];
            for (var i = 0; i < size; i++) {
                portArr.push(makePort('DO' + (i + 1), false, size));
            }
            return portArr
        }

        //定义模板样式
        function createDeviceTemplate(outputPortArr, inputPortArr, bodyWidth) {
            //不同的设备只是 端口不一样 其他都是共用的 //一个节点由 节点类型 样式 子节点构成
            return $(go.Node
                //节点以表格形式展出 可分row column
                , "Table"
                //设备的位置信息
                , new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify)
                //节点的出端口
                , $(go.Panel, "Horizontal", {
                    row: 0,
                    column: 0,
                    //端口组件的位置
                    alignment: go.Spot.Center,
                    alignmentFocus: new go.Spot(0, 0.5, -8, 0)
                }, outputPortArr)
                //设备的主题 内容 包含一个字和图标
                , $(go.Panel, "Table", {
                        row: 1,
                        background: "#fff",
                        width: bodyWidth,
                        height: 60,
                    },
                    $(go.Picture, {
                            width: bodyWidth,
                            height: 60,
                            background: "#fafafa"
                        },
                        new go.Binding("source")), $(go.TextBlock, "device name", {
                            margin: 50,
                            stroke: "#4b4b4b",
                            font: "18px 微软雅黑"
                        },
                        new go.Binding("text", "name")),
                    //给主题一个形状 shape只能给panel part??
                    $(go.Shape, "RoundedRectangle", {
                        stroke: "#ccc",
                        strokeWidth: 2,
                        strokeJoin: "miter",
                        strokeCap: "round",
                        width: bodyWidth,
                        height: 60,
                        fill: 'transparent'
                    }))
                //设备的入端口
                , $(go.Panel, "Horizontal", {
                    row: 2,
                    column: 0,
                    //端口组件的位置
                    alignment: go.Spot.Center,
                    alignmentFocus: new go.Spot(1, 0.5, 8, 0)
                }, inputPortArr), {
                    contextMenu: // define a context menu for each node
                        $(go.Adornment, "Vertical", // that has one button
                        $("ContextMenuButton", {
                                width: 90,
                                cursor: 'pointer',
                            },
                            $(go.TextBlock, "查看设备信息", {
                                margin: new go.Margin(4, 0, 0, 0),
                                stroke: '#000',
                            }), {
                                click: function(e, o) {
                                    M.getDeviceInfo(o.part.data);
                                },
                                mouseEnter: function(a, b) { // change group's background brush
                                    var e = b.oe("ButtonBorder");
                                    e.stroke = '#40a0ff';
                                },
                                mouseLeave: function(a, b, next) { // restore to original brush
                                    var e = b.oe("ButtonBorder");
                                    e.stroke = '#000';
                                }
                            })),
                    selectionAdornmentTemplate: $(go.Adornment, "Auto",
                            $(go.Shape, "RoundedRectangle", {
                                fill: null,
                                stroke: "dodgerblue",
                                strokeWidth: 1
                            }),
                            $(go.Placeholder)
                        ) // end Adornment
                });

        }
        //默认设备
        var device_default = createDeviceTemplate([makePort("output", true)], [makePort("input", false)], 100);
        //RTU设备
        var device_SRC001 = createDeviceTemplate([makePort("output", true)], makeMultiPort(20), 118);
        var device_SRC002 = createDeviceTemplate([makePort("output", true)], makeMultiPort(8), 116);
        //添加默认节点模板
        diagram.nodeTemplateMap.add('', device_default); //此方法用以添加不同的模板
        //添加SRC001 设备模板
        diagram.nodeTemplateMap.add('SRC001', device_SRC001);
        //添加SRC001 设备模板
        diagram.nodeTemplateMap.add('SRC002', device_SRC002);
        //diagram.nodeTemplate = device_node;
        //添加链接默认模板 //当link匹配不到模板就会匹配名称为空的模板
        diagram.linkTemplateMap.add('', $(go.Link, {
                //可重置线条起始点
                relinkableFrom: true,
                relinkableTo: true,
                //线条风格 路由 避开节点
                routing: go.Link.AvoidsNodes,
                corner: 2,
                resegmentable: true,
            },
            $(go.Shape, {
                stroke: '#2b2b2b',
                strokeWidth: 1
            }),
            $(go.TextBlock, "label", {
                    stroke: "#000",
                    font: "18px"
                },
                new go.Binding("text", "label"))

        ));


        //定义模型 可绘制线条的模型
        model = $(go.GraphLinksModel);

        //定义线段的端口属性值 设置了之后可以重新绘制线条
        model.linkFromPortIdProperty = "fromPort";
        model.linkToPortIdProperty = "toPort";
        //将 线的样式跟 toDevice属性绑定在一起这样就可以根据链接到不同的设备上 显示不同的线 toDevice属性是通过监听model->线条改变添加上去的 ??好像不行只能通过自身的属性绑定设置其他属性没效果 所以还是设置为to
        model.linkCategoryProperty = 'to';

        //将设备的类型与type绑定在一起
        model.nodeCategoryProperty = 'type';

        model.linkKeyProperty = '__gohashid';
        //赋予模型节点数据 此步骤交于init初始化

        // model.nodeDataArray = [{key:'1',name:'co2',to:['ccc','bbb']},{key:'2',name:'co2'},{key:'3',name:'co2'},{key:'4',name:'co2'}];
        // model.linkDataArray = []
        // //绑定模型到图表
        // diagram.model = model;
        //添加节点 model.addNodeData([{category:'co2',key:'6'}])
        //model.findNodeDataForKey(4)

        //监听画线条
        diagram.addModelChangedListener(function(evt) {
            //当改变类型为 绘制线条或者重置线条的之后验证线条是否符合条件
            if (evt.Ov === "linkDataArray") { //绘制新的线条
                M.initLine(evt.newValue);
            } else if (evt.Ov === "linkToKey" || evt.Ov === "linkToPortId") { //重置线条 
                M.initLine(evt.object);
            }

            //当添加设备时 给予key
            if (evt.Ov === "nodeDataArray") {
                //设备的key采用guid生成
                //evt.newValue.key = Guid.NewGuid().ToString();??手动改key会影响内部机制
                model.setKeyForNodeData(evt.newValue, Guid.NewGuid().ToString());
            }
        });



        //添加面板控制
        if (Boolean(panelInfo)) {
            var s = (function() {
                return Date.now()
            })();
            var palette = $(go.Palette, panelInfo.domId, // must name or refer to the DIV HTML element
                {
                    "animationManager.duration": 800, // slightly longer than default (600ms) animation
                    nodeTemplateMap: diagram.nodeTemplateMap, // share the templates used by myDiagram
                    model: new go.GraphLinksModel(panelInfo.model) // specify the contents of the Palette
                });

            //将控制面板的model类别(内部用作样式区分)跟mode的类别设置成一样的值
            palette.model.nodeCategoryProperty = model.nodeCategoryProperty;
        }



        //设置连接中 的俩个端口的样式
        diagram.toolManager.relinkingTool.temporaryLink = diagram.toolManager.linkingTool.temporaryLink =
            $(go.Link, {
                    layerName: "Tool"
                },
                $(go.Shape, {
                    stroke: "red",
                    strokeWidth: 2,
                    strokeDashArray: [4, 2]
                })
            );

        var tempfromnode =
            $(go.Node, {
                    layerName: "Tool"
                },
                $(go.Shape, "Rectangle", {
                    stroke: "#e50ae5",
                    strokeWidth: 1,
                    fill: null,
                    portId: "",
                    width: 1,
                    height: 1
                })
            );
        // diagram.toolManager.relinkingTool.temporaryFromNode = diagram.toolManager.linkingTool.temporaryFromNode = tempfromnode;
        // diagram.toolManager.relinkingTool.temporaryFromPort = diagram.toolManager.linkingTool.temporaryFromPort = tempfromnode.port;

        var temptonode =
            $(go.Node, {
                    layerName: "Tool"
                },
                $(go.Shape, "Rectangle", {
                    stroke: "#e50ae5",
                    strokeWidth: 1,
                    fill: null,
                    portId: "",
                    width: 1,
                    height: 4
                }));
        // diagram.toolManager.relinkingTool.temporaryToNode = diagram.toolManager.linkingTool.temporaryToNode = temptonode;
        //diagram.toolManager.relinkingTool.temporaryToPort = diagram.toolManager.linkingTool.temporaryToPort = temptonode.port;


        //监听portTarget 可以在这里 验证端口 return true就是可以在俩个端口之前绘制 参数详情请见api [重新链接已有的链接]
        diagram.toolManager.relinkingTool.portTargeted = function() {
            //如果此对象存在 监听端口的变化
            if (diagram.toolManager.relinkingTool.targetPort) {
                M.monitorPortChange(diagram.toolManager.relinkingTool.targetPort.portId);
            }

            //return true 允许再俩个任意俩个端口之间绘制
            return true
        };
        //监听portTarget 可以在这里 验证端口 return true就是可以在俩个端口之前绘制 参数详情请见api [绘制仙新的链接]
        diagram.toolManager.linkingTool.portTargeted = function(fromNode, fromGraphObject, toNode, toGraphObject, boolean) {

            //如果此对象存在 监听端口的变化
            if (diagram.toolManager.linkingTool.targetPort) {
                M.monitorPortChange(diagram.toolManager.linkingTool.targetPort.portId);
            }

            //return true 允许再俩个任意俩个端口之间绘制
            return true
        };

        console.log(model)
    }

    //定义组件内用到的方法
    var M = {
        initLine: function(lineObject) {
            //当删除线条的时候传进来的是null
            if (!lineObject) {
                return
            }
            M.addLabel(lineObject, M.verifyLine);

        },
        //先添加标签 在 验证线条是否合法
        addLabel: function(lineObject, next) {

            //添加线条的label 属性 label属性跟label绑定在一起
            model.setDataProperty(lineObject, 'label', lineObject.toPort);

            //交给验证
            next && next(lineObject);
        },
        verifyLine: function(lineObject) {
            //出口设备
            var device_key = lineObject.from,
                //入口设备
                device_parent_key = lineObject.to,
                //设备对象
                output_device = model.findNodeDataForKey(device_key),
                //父级设备对象(就是设备连接的对象)
                input_device = model.findNodeDataForKey(device_parent_key);

            (function() {
                //当to属性 不是数组 默认不可接入其他设备
                if (M.getType(output_device.to) != "[object Array]") {
                    return model.removeLinkData(lineObject);
                }
                //初始化验证结果
                verify_result = false;
                for (var i = 0, l = output_device.to.length; i < l; i++) {
                    var astrict = output_device.to[i];
                    //将设备允许链接的设备限制取出 [设备名,设备端口(可能存在)]
                    astrict = astrict.split('.');
                    //如果设备的接出口包含 接入的设备的设备名
                    if (astrict.shift().indexOf(input_device.name) > -1) {
                        //如果有端口的限制条件 
                        if (astrict.length) {
                            if (astrict.shift().indexOf(lineObject.toPort) > -1) {
                                return verify_result = true;
                            } else {
                                verify_result = false;
                            }
                            //没有端口的限制条件就验证成功
                        } else {
                            return verify_result = true;
                        }

                    } else {
                        verify_result = false;
                    }
                }
                //验证失败删除线条
                !verify_result && model.removeLinkData(lineObject);
            })();
        },
        setLineStyle: function(linkStyle) {
            for (var item in linkStyle) {
                if (linkStyle.hasOwnProperty(item)) {

                    diagram.linkTemplateMap.add(item, $(go.Link, {
                            //可重置线条起始点
                            relinkableFrom: true,
                            relinkableTo: true,
                            //线条风格 路由 避开节点
                            routing: go.Link.AvoidsNodes,
                            corner: 2,
                            resegmentable: true,
                        },
                        $(go.Shape, {
                            stroke: linkStyle[item],
                            strokeWidth: 1
                        })

                    ));
                }
            }
        },
        Guid: function() {
            return Date.now();
        },
        monitorPortChange: (function() {
            var initToPortId = undefined,
                body = document.getElementsByTagName('body')[0];

            var portChangeEnd = function() {
                if (typeof initToPortId !== "undefined") {
                    portChangeCallback(initToPortId, 'end');
                    //重置 initToPortId
                    return initToPortId = undefined;
                }
            }

            //当放下鼠标之后就是结束绘制了
            body.addEventListener('mouseup', portChangeEnd);
            return function(toPortId) {
                //如果 initToPortId 未定义则说明 刚开始绘制
                if (typeof initToPortId === "undefined") {
                    //更新 initToPortId
                    initToPortId = toPortId;
                    return portChangeCallback(toPortId, 'start');
                } else if (initToPortId != toPortId) { //如果 initToPortIdu等于toPortId 则说明 绘制的端口发生了变化
                    //更新 initToPortId
                    initToPortId = toPortId;
                    return portChangeCallback(toPortId, 'changing')
                }


            }
        })(),
        getDeviceInfo: function(device_node_info) {
            var fromDevice = [],
                toDevice = [];

            model.linkDataArray.forEach(function(lineObject) {
                if (lineObject.from == device_node_info.key) {
                    var device = Object.assign(model.findNodeDataForKey(lineObject.to));
                    device.port = lineObject.fromPort;
                    toDevice.push(device);
                } else if (lineObject.to == device_node_info.key) {
                    var device = Object.assign({}, model.findNodeDataForKey(lineObject.from));
                    device.port = lineObject.toPort;
                    fromDevice.push(device);
                }
            });


            getDeviceDetailCallback(device_node_info, fromDevice, toDevice);
        },
        getType: function(v) {
            return ({}).toString.call(v);
        }
    }



    //定义暴露出去的接口
    var o = {
        init: function(viewOptions, panelOptions, callback) {
            //如果参数不存在 或不符合要求
            if (typeof viewOptions === 'undefined' || M.getType(viewOptions.nodeDataArray) != "[object Array]" || M.getType(viewOptions.linkDataArray) != "[object Array]") {
                throw '初始化失败 视图参数不符合要求';
            }

            if (panelOptions) {
                if (M.getType(panelOptions.model) != "[object Array]") {
                    throw '初始化失败 面板参数不符合要求';
                } else {
                    panelOptions.model.forEach(function(device) {
                        if (!device.name) {
                            throw '初始化失败 请填写设备名称';
                        }
                    })
                }
            }

            //初始化视图
            initView(viewOptions.domId, panelOptions);

            if (callback) {
                //赋值 portChangeCallback
                portChangeCallback = callback.portChange || function() {};

                getDeviceDetailCallback = callback.getDeviceDetail || function() {};
            }

            //只能先加载设备然后 设置link的模板
            viewOptions.nodeDataArray.forEach(function(item, i) {
                if (item.name === 'router') {
                    M.setLineStyle({
                        [item.key]: '#82a8c0'
                    });
                } else if (item.name === '网关') {
                    M.setLineStyle({
                        [item.key]: '#e45106'
                    });
                }
            });

            //赋予模型节点数据
            model.nodeDataArray = viewOptions.nodeDataArray;
            model.linkDataArray = viewOptions.linkDataArray;

            //绑定模型到图表
            diagram.model = model;
        },
        createDevice: function(options) {
            //如果参数不存在 或不符合要求
            if (typeof options === 'undefined' || M.getType(options) != "[object Object]" || !options.name || M.getType(options.to) != "[object Array]") {
                throw '添加设备失败 参数不符合要求';
            }

            //设备的key采用guid生成
            // var key = Guid.NewGuid().ToString(),
            //设备的名字
            name = options.name,
                //设备的连接范围
                to = options.to;

            //添加设备到model
            //自定义事件的类型
            diagram.startTransaction("add device");
            model.addNodeData({
                // key: key,//?? 当通过面板生成设备的时候 只能通过modelchange函数监听 动态给予key
                name: name,
                to: to
            });
            //完成自定义事件
            diagram.commitTransaction("add device");
        },
        save: function() {
            return {
                nodeDataArray: model.nodeDataArray,
                linkDataArray: model.linkDataArray
            }
        },
        setLineStyle: function(linkStyle) {
            M.setLineStyle(linkStyle);
        }
    }

    return window.Smt_topology = o;
})();