import validate from 'validate.js'
// 注入给每个 worker 的函数
function injectActions(actions = {}) {
    let prototype = {
        emit: (event, dispatch) => {
            this.postMessage({
                event,
                dispatch
            })
        }
    }
    actions.__proto__ = prototype
    this.onmessage = e => {
        const {
            data
        } = e
        const {
            event,
            dispatch
        } = data
        if (event) {
            if (typeof actions[event] === 'function') {
                actions[event](dispatch)
            } else {
                console.warn(`action:[${event}]的内容不是一个函数`);
            }
        } else {
            console.error(`非法的action:[${event}]`);
        }
    }
}

export default function WebWorker(woker) {
    if (!(this instanceof WebWorker)) {
        return new WebWorker(woker)
    }
    const code = woker.toString()
    const blob = new Blob([`(${code})(${injectActions.toString()})`])
    const eventPool = {}
    const wk = {
        _wk: new Worker(URL.createObjectURL(blob)),
        on(event, fn) {
            let eventStack = eventPool[event]
            let k = Math.random()
            fn.id = k
            if (validate.isEmpty(eventStack)) {
                eventPool[event] = {
                    [k]: fn
                }
            } else if (validate.isObject(eventStack)) {
                eventPool[event][k] = fn
            } else {
                console.error(`非法事件:[${event}] 事件堆错误:[${eventPool[event]}]`);
            }
            return k
        },
        emit(event, dispatch) {
            this._wk.postMessage({
                event,
                dispatch
            })
        },
        off(event, fn) {
            if (fn && fn.id === undefined) {
                console.error(`非法事件函数,请传入原函数`);
                return false
            }
            if (eventPool[event] === undefined) {
                console.error(`非法事件:[${event}]`);
                return false
            }
            let flag = true
            try {
                if (validate.isFunction(fn) || validate.isObject(fn)) {
                    delete eventPool[event][fn.id]
                }
                if (validate.isString(fn)) {
                    delete eventPool[event][fn]
                }
            } catch (error) {
                console.error(error);
                flag = false
            } finally {
                return flag
            }
        },
        action(event, dispatch) {
            return new Promise(resolve => {
                function fn(data) {
                    wk.off(event, fn)
                    resolve(data)
                }
                this.on(event, fn)
                this.emit(event, dispatch)
            })
        }
    }
    wk._wk.onmessage = e => {
        const {
            data
        } = e

        const {
            event,
            dispatch
        } = data

        if (event) {
            if (validate.isObject(eventPool[event])) {
                Object.keys(eventPool[event]).forEach(k => {
                    eventPool[event][k](dispatch)
                })
            } else {
                console.warn(`当前事件没有监听:[${event}]`);

            }
        } else {
            console.error(`非法调用:[${event}]`);
        }

    }

    return wk
}