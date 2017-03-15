# 基于go.js 的动态绘制拓扑图插件
    使用方法
1. 引入go.js
2. 引入Smt_topology.js

    初始化界面

````javascript
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
````

    添加设备
````javascript
Smt_topology.createDevice({
    name: 'deviceName',//设备名
    to: ['co2']//设备可接入其他设备的名称集 必须是数组  可不填此选项
});
````

    保存数据
````javascript
Smt_topology.save();//返回包含设备信息和线条信息的对象
````
