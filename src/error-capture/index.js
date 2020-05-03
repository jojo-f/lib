/*

npm install -s ua-device@0.1.10 localforage@1.7.3 

## 错误分类

逻辑错误,业务逻辑的条件判断抛出,死循环 经常
数据类型错误 经常
语法错误 较少
网络错误 偶尔
系统错误 api支持,内存,磁盘,兼容性

## 异常时的内容采集

1. 用户信息
2. 行为信息
3. 异常信息
4. 环境信息

requestId	String	一个界面产生一个requestId
traceId	String	一个阶段产生一个traceId，用于追踪和一个异常相关的所有日志记录
hash	String	这条log的唯一标识码，相当于logId，但它是根据当前日志记录的具体内容而生成的
time	Number	当前日志产生的时间（保存时刻）
userId	String	
userStatus	Number	当时，用户状态信息（是否可用/禁用）
userRoles	Array	当时，前用户的角色列表
userGroups	Array	当时，用户当前所在组，组别权限可能影响结果
userLicenses	Array	当时，许可证，可能过期
path	String	所在路径，URL
action	String	进行了什么操作
referer	String	上一个路径，来源URL
prevAction	String	上一个操作
data	Object	当前界面的state、data
dataSources	Array<Object>	上游api给了什么数据
dataSend	Object	提交了什么数据
targetElement	HTMLElement	用户操作的DOM元素
targetDOMPath	Array<HTMLElement>	该DOM元素的节点路径
targetCSS	Object	该元素的自定义样式表
targetAttrs	Object	该元素当前的属性及值
errorType	String	错误类型
errorLevel	String	异常级别
errorStack	String	错误stack信息
errorFilename	String	出错文件
errorLineNo	Number	出错行
errorColNo	Number	出错列位置
errorMessage	String	错误描述（开发者定义）
errorTimeStamp	Number	时间戳
eventType	String	事件类型
pageX	Number	事件x轴坐标
pageY	Number	事件y轴坐标
screenX	Number	事件x轴坐标
screenY	Number	事件y轴坐标
pageW	Number	页面宽度
pageH	Number	页面高度
screenW	Number	屏幕宽度
screenH	Number	屏幕高度
eventKey	String	触发事件的键    [ua-device]
network	String	网络环境描述
userAgent	String	客户端描述
device	String	设备描述
system	String	操作系统描述
appVersion	String	应用版本
apiVersion	String	接口版本

## 异常的行为分类

系统抛出异常    系统错误按错误类型区分严重性
人为抛出异常    业务逻辑中基本不可能出现这种异常,但是第三方包有可能抛出,致命的错误将引起应用崩溃
人为捕获异常    已知可能产生异常使用 try-catch 捕获
人为上报异常    即不满足某些必要条件视为异常
框架抛出异常    第三方可控异常

## 异常录制

对异常发生的一段时间内的用户行为以及环境信息进行记录,便于处理异常时进行回放,排查

## 异常的等级

异常的等级将影响处理异常时的先后顺序

## 异常的上报与本地数据规划 [localforage]

如果捕获的同时立即上传有可能对服务器产生ddos攻击行为,当然也不能直接储存在内存中,这样会造成内存溢出,也容易丢失

## 

*/

import validate from 'validate.js'
import lf from 'localforage'
import UA from 'ua-device'
import {
    debounce,
    hash
} from '../utils/fn'

import WebWorker from '../worker/index'
import {
    desposeLogWorker
} from './despose-log.wk'

const ERROR_TYPE_EXP = /Uncaught/

class captureError {
    DEV = true;
    refresh = true
    isOnline = window.navigator.onLine
    traceId = hash(8)
    // 用户操作
    behavior = [
        // {
        //     behaviorType: "",
        //     touchs: []
        // }
    ]
    snapshoot = {
        // id: hash(16),
        // timestamp: new Date().getTime(),
        // traceId: this.traceId, bug发生前的操作标记
        // refresh: this.refresh,
        // errorInfo: {
        //     errType: "DOMError",
        //     domPath: string[]，
        //     message,
        //     filename,
        //     lineno,
        //     colno,
        //     stack
        // },
        // routerInfo: {
        //     hash,
        //     host,
        //     hostname,
        //     href,
        //     origin,
        //     pathname,
        //     port,
        //     protocol,
        //     search
        // }，
        // userState：{}
    };
    temporaryDB; // 暂存
    indexDB; // 索引区
    archiveDB; // 归档
    recycleDB; // 回收

    constructor() {
        lf.config({
            name: "capture-errors",
            driver: [
                lf.INDEXEDDB,
                lf.WEBSQL,
                lf.LOCALSTORAGE
            ],
            dataStore: 'captures_errors'
        })
        this.temporaryDB = lf.createInstance({
            name: "temporary"
        })
        this.archiveDB = lf.createInstance({
            name: "archive"
        })
        this.recycleDB = lf.createInstance({
            name: "recycle"
        })
        this.indexDB = lf.createInstance({
            name: "index"
        })
        this.desposeLogWk = new WebWorker(desposeLogWorker)
        this.desposeIndexLog = debounce(this.desposeIndexLog)
        this.init()
        this.listenerUserBehavior()
    }

    init() {
        // 侦听全局,捕获模式
        window.addEventListener("error", e => {
            // dom元素上报错
            if (e.message === undefined || e.error === undefined) {
                let {
                    path,
                    target,
                    srcElement,
                } = e,
                el = (target || srcElement), {
                        attributes, // 当前属性以及值
                        clientHeight,
                        clientLeft,
                        clientTop,
                        clientWidth,
                        offsetHeight,
                        offsetLeft,
                        offsetTop,
                        offsetWidth,
                        scrollHeight,
                        scrollLeft,
                        scrollTop,
                        scrollWidth,
                        style,
                        width,
                        height,
                        x,
                        y
                    } = el,
                    domPath = [],
                    cssText = (style || {}).cssText
                let _attributes = []
                for (let index = 0, len = attributes.length; index < len; index++) {
                    const attr = attributes[index];
                    let {
                        localName,
                        name,
                        nodeName,
                        nodeValue,
                        textContent,
                        value,
                    } = attr
                    name = name || localName || nodeName || ''
                    value = value || textContent || nodeValue || {}
                    _attributes.push({
                        name,
                        value: value && validate.isNumber(value.length) && Number(value.length) < 200 ? value : ''
                    })
                }
                domPath = this.disposeDomPath(path)

                this.disposeErrorInfo({
                    errType: "DOMError",
                    domPath,
                    cssText,
                    clientHeight,
                    clientLeft,
                    clientTop,
                    clientWidth,
                    offsetHeight,
                    offsetLeft,
                    offsetTop,
                    offsetWidth,
                    scrollHeight,
                    scrollLeft,
                    scrollTop,
                    scrollWidth,
                    width,
                    height,
                    x,
                    y,
                    attributes: _attributes
                })
            } else {
                let {
                    message,
                    filename,
                    lineno,
                    colno,
                    error
                } = e

                let {
                    stack
                } = error || {}

                let errType = (stack || '').split(':')

                if (ERROR_TYPE_EXP.test(message)) errType = [(message.split(':')[0] || "").replace('Uncaught ', '')]
                this.disposeErrorInfo({
                    errType: errType ? errType[0] || "OtherError" : "OtherError",
                    message,
                    filename,
                    lineno,
                    colno,
                    stack
                })
            }
            return true
        }, true)
        // promise error
        window.addEventListener('unhandledrejection', e => {
            let {
                message,
                name,
                stack,
                code
            } = e.reason || {}
            this.disposeErrorInfo({
                errType: "PromiseError",
                message,
                name,
                stack,
                code
            })
            e.preventDefault()
            return true;
        }, true)
        window.addEventListener('online', () => this.isOnline = true);
        window.addEventListener('offline', () => this.isOnline = false);
        // window.navigator.connection.addEventListener("change", e => {})
    }
    // 处理dom路径 
    disposeDomPath(path) {
        if (path.length === undefined) {
            if (this.DEV) console.error(`disposeDomPath 期望一个 path:HTMLElement[] `);
        }
        let len = path.length,
            result = []
        for (let index = 0; index < len; index++) {
            const element = path[index];
            if (validate.isDomElement(element)) {
                let nodeName = (element.nodeName || element.localName || '').toLowerCase()
                if (validate.isString(nodeName) && nodeName !== '#document') {
                    let id = element.id || ""
                    let classList = element.classList || element.className.split(' ') || []
                    let classListLength = classList.length
                    nodeName += id ? `#${id}` : ''
                    for (let index = 0; index < classListLength; index++) {
                        const classN = classList[index];
                        nodeName += `.${classN}`
                    }
                    result.push(nodeName)
                } else {
                    if (this.DEV) console.warn(element, `不是一个dom元素`);
                }
            } else {
                if (this.DEV) console.warn(element, `不是一个dom元素`);
            }
        }
        return result
    }
    // 处理错误信息
    disposeErrorInfo(errorInfo) {
        Object.assign(this.snapshoot, errorInfo, {
            logType: "error",
        })
        this.generateSnapshoot()
        this.desposeIndexLog()
        this.traceId = hash(8)
    }
    // 装载用户操作
    behaviorLoader(behavior) {
        Object.assign(this.snapshoot, {
            logType: "behavior",
            behavior
        })
        this.generateSnapshoot()
    }
    // 生成快照
    generateSnapshoot() {
        let routerInfo = this.getRouter()
        let userState = this.getUserInfo()
        let userAgent = this.captureUserAgent()
        let browserState = this.captureNetState()
        Object.assign(this.snapshoot, {
                id: hash(16),
                timestamp: new Date().getTime(),
                traceId: this.traceId,
                refresh: this.refresh,
                isOnline: this.isOnline,
            },
            userState,
            routerInfo,
            userAgent,
            browserState)
        this.temporaryDB.setItem(this.snapshoot.timestamp + '-' + this.snapshoot.id, this.snapshoot)
        this.refresh = false
        this.snapshoot = {}
    }
    // 获取路由
    getRouter() {
        let {
            hash,
            host,
            hostname,
            href,
            origin,
            pathname,
            port,
            protocol,
            search
        } = window.location

        return {
            hash,
            host,
            hostname,
            href,
            origin,
            pathname,
            port,
            protocol,
            search
        }
    }
    // 获取用户状态
    getUserInfo(fn = () => ({})) {
        console.warn("覆盖当前函数 该函数接收一个返回用户信息的回调函数");
        return fn()
    }
    // 获取用户 agent
    captureUserAgent() {
        let {
            browser,
            device,
            engine,
            os
        } = new UA(window.navigator.userAgent)

        return {
            browser: {
                name: browser.name,
                version: browser.version.original,
            },
            device: {
                manufacturer: device.manufacturer,
                model: device.model,
                type: device.type,
            },
            engine: {
                name: engine.name,
                version: engine.version.original,
            },
            os: {
                name: os.name,
                version: os.version.original,
            }
        }
    }
    // 获取当前客户端状态
    captureNetState() {
        let {
            availHeight, // 可用宽高
            availWidth,
            width, // 实际宽高
            height,
        } = window.screen
        let {
            clientWidth: layoutWidth,
            clientHeight: layoutHeight
        } = document.documentElement
        let {
            innerWidth: viewportWidth,
            innerHeight: viewportHeight,
        } = window

        let {
            downlink, // 下行速度
            effectiveType, // 网络类型
            rtt, // rtt 估算往返时间
            type, // 网路类型*其他机型
            // saveData, // 打开数据保护模式
        } = window.navigator.connection || {}

        effectiveType = effectiveType || type

        if (/NetType/.test(window.navigator.userAgent)) {
            // qq 和 微信 可以在 userAgent 中获取网络状态
            let NetType = ua.match(/NetType\/(\S*)/) || [];
            effectiveType = NetType[1] || effectiveType;
        }

        return {
            availHeight,
            availWidth,
            width,
            height,
            layoutWidth,
            layoutHeight,
            viewportWidth,
            viewportHeight,
            downlink,
            effectiveType,
            rtt,
        }
    }
    // 监听用户行为
    listenerUserBehavior() {

        let composeCoordinate = touch => {
            let {
                clientX,
                clientY,
                pageX,
                pageY,
                screenX,
                screenY,
            } = touch || {}
            return touch ? {
                clientX, // 相对于页面视口
                clientY,
                pageX, // 相对于页面
                pageY,
                screenX, // 相对于屏幕
                screenY,
            } : undefined
        }
        let touchs = []
        let behaviorType = ''

        document.addEventListener('touchstart', e => {
            let touch = (e.targetTouches || e.touches || e.changedTouches || [])[0]
            touch = composeCoordinate(touch)

            touchs = []
            behaviorType = "click"

            touchs.push(touch)
        })
        document.addEventListener('touchmove', e => {
            let touch = (e.targetTouches || e.touches || e.changedTouches || [])[0]
            touch = composeCoordinate(touch)
            behaviorType = "touch"
            touchs.push(touch)
        })
        document.addEventListener('touchend', e => {
            let touch = (e.targetTouches || e.touches || e.changedTouches || [])[0]
            touch = composeCoordinate(touch)
            this.behaviorLoader({
                touchs,
                behaviorType
            })
        })
    }
    // 索引处理区,索引区在一次错误日志非连续触发后执行
    async desposeIndexLog() {
        this.desposeLogWk.emit("index")
    }
}

const ce = new captureError()