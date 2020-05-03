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
    injectAction({
        // 索引归类
        "index"() {
            let curTraceId = undefined
            let block = []
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
                    indexDB.setItem(`${new Date().getTime()}-${block.length}`, block)
                    curTraceId = traceId
                    block = []
                }
                if (curTraceId === traceId) {
                    temporaryDB.removeItem(k)
                    block.push(v)
                }
            })
        },
        // 归类数据达到一定的规模后就可以上报了,上报完成进入归档区,归档区时间超过3天进入 回收区
        "archive"() {

        },
        // 回收区超过7天的内容直接清除
        "recycle"() {

        }
    })
}