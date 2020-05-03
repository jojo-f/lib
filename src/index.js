/* 
## 前后端对称与非对称加密流程
后端返回 rsa.pub->前端产生对称加密key(内存中)->用rsa.pub[key]->回发给后端->后端使用该key加解密通信内容

## 本地自动登陆
使用 jwt 验证,首次登陆成功后后端返回jwt jwt信息包含时间戳以及用户识别信息以及加密算法,下次访问时将jwt回发给服务器就可以用来自动登陆
成功后发送jwt给服务器,服务器将返回新的jwt

## 用户身份识别或自动登录
使用token
*/

import './error-capture'

import {
    debounce,
    hash,
    secure,
    origin
} from '../src/utils/fn'

let a = origin({
    name: 'name',
    test1() {
        console.log(12)
    },
    test2() {
        console.log(this.name);
    }
})

a.__test1()
    .__test2()
    .name