/* 节流 */
export const throttle = () => {

}
/* 防抖 */
export const debounce = (fn, delay = 500) => {
    let timer
    return function (...args) {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
            fn.apply(this, args)
            clearTimeout(timer)
        }, delay);
    }
}

const alphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'B', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
]
/* hash  */
export const hash = (len = 5) => {
    let result = ''
    let alphabetLen = alphabet.length
    for (let index = 0; index < len; index++) {
        result += alphabet[Math.floor(Math.random() * alphabetLen)]
    }
    return result
}

/* 
    安全调用
    secure(12).val = 12
    secure("12").length.val = 2    
    let test =  secure({
        test(){
            throw new Error()
        }
    }).test()
    log(test.val)  // undefined
    log(test.name.error)  // true
    保证任何调用或取值不会产生报错,
    如果执行过程中取值失败或是函数执行错误都不会引起语法错误,而是转为警告或可判断错误
*/
// export const secure = (target, ctx = {}) => {
//     let proxy, r = () => {
//         // 如果目标值是函数就不会走这里
//         // 如果走入这里说明target 不是一个函数那么调用错误,清空 __t
//         // tag warn
//         proxy.__t = undefined
//         return proxy
//     }
//     if (typeof target === 'function') {
//         // 目标为函数则直接包装该函数
//         r = target
//     } else {
//         // 目标不为函数则包装 预设函数
//         r.__t = target
//     }
//     proxy = new Proxy(r, {
//         get(tg, propK, px) {

//             if (propK === '__t') {
//                 // 自己取值
//                 return tg.__t
//             }

//             if (propK === 'val') {
//                 // 获取结果
//                 return tg.__t
//             }

//             if (tg.__t === undefined) {
//                 // 传入 undefined 说明目标属性早已丢失
//                 return secure(undefined, ctx)
//             }

//             let atr = undefined

//             try {
//                 // 目标值为undefined
//                 atr = tg.__t[propK]
//             } catch (error) {
//                 // tag warn
//                 atr = undefined
//             }
//             // 目标已丢失
//             return secure(atr, ctx)

//         },
//         set(tg, propK, val, px) {
//             if (val === undefined && propK === '__t') {
//                 return tg.__t = undefined
//             }
//             console.error(`安全函数不允许赋值`, tg, propK, val);
//         },
//         apply(tg, _ctx, args) {
//             let res = undefined
//             ctx = _ctx ? _ctx.val : ctx
//             try {
//                 res = Reflect.apply(tg, ctx, args)
//             } catch (error) {

//             } finally {
//                 return secure(res, ctx)
//             }

//         }
//     })

//     return proxy

// }
export const secure = (target, ctx = {}, ops = {
    error: false
}) => {
    // 如果前期未出现错误,那么当前函数可执行,如果已经发生错误就没有执行的必要了,执行空函数将减少性能损耗
    return new Proxy(typeof target === 'function' && ops.error === false ? target : () => {
        // 如果目标值是函数就不会走这里
        // 如果走入这里说明target 不是一个函数那么调用错误,清空 __t
        // console.warn(target, `上不存在目标函数`);
        ops.error = true
        return undefined
    }, {
        get(tg, propK, px) {

            // console.log(`get:::`, target, propK, px);

            if (propK === 'val') {
                // 获取结果
                return target
            }

            if (propK === 'error') {
                // 属性获取失败报错
                return ops.error
            }

            if (target === undefined) {
                // 传入 undefined 说明目标属性早已丢失
                ops.error = true
                return secure(undefined, ctx, ops)
            }

            let atr = undefined

            try {
                // 目标值为undefined
                atr = target[propK]
            } catch (error) {
                atr = undefined
            }

            if (atr === undefined) {
                ops.error = true
                console.warn(target, `上不存在属性:::[${propK}]`);
            }

            // 目标已丢失
            return secure(atr, ctx, ops)

        },
        set(tg, propK, val, px) {
            // 严格模式下返回false报错,这里返回true但是给警告
            console.warn(`secure 不允许赋值`, propK);
            return true
        },
        apply(tg, _ctx, args) {
            // console.log('apply:::', tg, _ctx, args);
            let res = undefined
            // 箭头函数的上下文为空则沿用当前传入的上下文
            ctx = _ctx ? _ctx.val : ctx

            try {
                // 用户访问函数 tg.fn() 时先进入get判断 将target 上的目标函数 fn取值返回包装
                // 如果属性为函数则直接返回该函数的包装 此时函数运行 进入当前 apply 函数
                // apply 将目标函数的运行结果再次包装返回,包括运行时报错捕获
                res = Reflect.apply(tg, ctx, args)

            } catch (error) {
                // 这里的运行错误什么不抛出?
                // 因为在函数运行前目标取值就有可能失败,如果目标为 undefined 那么这里的函数只要引用
                // 目标上的其他属性就必然引起报错
                // 所以最终只要抛出目标函数上属性获取失败的警告即可
                ops.error = true
            } finally {

                return secure(res, ctx, ops)
            }

        }
    })

}

/**
 * @description
 *  origin({
 *      a(){ console.log('a') },
 *      b(){ console.log('b') }
 *  }).__a().__b().a()
 *  __ 双下划线的函数将始终指向 origin
 * @param {Object} t 
 */
export const origin = t => {
    let proxy = new Proxy({}, {
        get(tg, propK, px) {
            // console.log('get:::', tg, propK, px);

            let res = undefined
            let specialPrefix = propK.startsWith('__')
            let _propK = propK.slice(2)

            try {
                // 以 $$ 开头的函数将被代理
                res = specialPrefix ? t[_propK] : t[propK]
            } catch (error) {}

            if (typeof res === 'function' && specialPrefix) {
                return (...args) => {
                    Reflect.apply(res, t, args)
                    return proxy
                }
            } else if (res === undefined) {
                if (specialPrefix) {
                    throw new Error(`不存在的函数:[${_propK}]`)
                } else {
                    throw new Error(`不存在的属性:[${propK}]`)
                }
            } else {
                return res
            }
        }
    })
    return proxy
}