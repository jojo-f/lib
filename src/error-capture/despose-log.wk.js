export function desposeLogWorker(injectAction) {
    importScripts('http://localhost:5000/lib/localforage.1.7.3.min.js')

    localforage.config({
        name: "capture-errors",
        driver: [
            localforage.INDEXEDDB,
            localforage.WEBSQL,
            localforage.LOCALSTORAGE
        ],
        dataStore: 'captures_errors'
    })

    let crash_before_time

    const temporaryDB = localforage.createInstance({
        name: "temporary"
    })
    const archiveDB = localforage.createInstance({
        name: "archive"
    })
    const recycleDB = localforage.createInstance({
        name: "recycle"
    })
    const indexDB = localforage.createInstance({
        name: "index"
    })
    // 归类数据达到一定的规模后就可以上报了,上报完成进入归档区,归档区时间超过3天进入 回收区
    // 上报日志
    const report = (data, keys) => {

        fetch("http://localhost:8080/index/test", {
            method: "POST",
            mode: 'cors',
            body: self.JSON.stringify(data),
            headers: {
                "content-type": 'application/json'
            }
        }).then(response => {
            // 归入存档
            // archiveDB.setItem(`${new Date().getTime()}-${data.length}`, data)
            // keys.forEach(k => {
            //     indexDB.removeItem(k)
            // })
            console.log(response);
        }).catch(err => {
            console.log(err);
        })
    }

    // 回收区超过7天的内容直接清除
    const recycle = () => {

    }

    injectAction({
        // 索引归类
        "index"() {
            let curTraceId = undefined
            let block = {
                k: [],
                b: []
            }
            temporaryDB.iterate((v, k, index) => {
                let {
                    traceId
                } = v
                if (traceId === undefined) return
                if (curTraceId === undefined) {
                    curTraceId = traceId
                }
                if (curTraceId !== traceId) {
                    // 当前traceID已经变更,代表进入下一个错误的触发
                    indexDB.setItem(`${new Date().getTime()}-${block.b.length}-${traceId}`, block.b)
                    block.k.forEach(_k => {
                        temporaryDB.removeItem(_k)
                    })
                    curTraceId = traceId
                    block = {
                        k: [],
                        b: []
                    }
                }
                if (curTraceId === traceId) {
                    block.k.push(k)
                    block.b.push(v)
                }
            })
            let reportData = []
            let reportKeys = []
            let blockTotalLen = 0
            indexDB.iterate((v, k, index) => {
                let res = k.split('-')
                let timestamp = res[0]
                let _len = res[1]
                let identity = res[2]
                _len = _len ? Number(_len) : 0
                blockTotalLen += _len

                reportKeys.push(k)
                reportData.push({
                    timestamp,
                    identity,
                    block: v
                })
                if (blockTotalLen >= 20) {
                    blockTotalLen = 0
                    report(reportData, reportKeys)
                    reportData = []
                    reportKeys = []
                }
            })
        },
        // 刷新崩溃时间
        "updateCrashTime"(time) {
            crash_before_time = time
        },
        // 检查页面崩溃
        "inspectCrash"() {
            setInterval(() => {
                let now = new Date().getTime()
                if (crash_before_time && now - crash_before_time > 1500) {
                    // 判断页面是否进入后台,后台状态则不视为卡死
                    console.log("页面卡死");
                }
            }, 1000);
        }
    })
}