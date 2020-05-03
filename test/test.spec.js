let assert = require('assert')

describe("test", () => {
    describe('#indexOf()', function () {
        it("当不存在时是否返回 -1", function () {
            assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });
})

import {
    debounce,
    hash,
    secure
} from '../src/utils/fn'

describe('fn.js', () => {
    it("debounce 是否在510ms内仅执行一次", function (done) {
        this.timeout(510)
        let count = 0
        let debounce_test = debounce(() => {
            count++
            done()
            assert.equal(count, 1)
        })
        debounce_test()
        debounce_test()
    })

    it("hash 不相同", function () {
        let hash1 = hash()
        let hash2 = hash()
        assert.notEqual(hash1, hash2)
    })

    it("secure 函数保证调用安全性", function () {
        let testData = {
            a: '12',
            b: 12,
            c: {},
            d: [],
            e: false,
            f() {
                throw new Error()
            },
            g: null,
            h: undefined
        }

        assert.equal(secure(testData).a.val, '12')
        assert.equal(secure(testData).b.val, 12)
        assert.equal(secure(testData).c.val, testData.c)
        assert.equal(secure(testData).d.val, testData.d)
        assert.equal(secure(testData).e.val, false)
        assert.equal(secure(testData).f.val, testData.f)
        assert.equal(secure(testData).f().val, undefined)
        assert.equal(secure(testData).g.val, null)
        assert.equal(secure(testData).h.val, undefined)
        assert.equal(secure(testData).f().name.val, undefined)
        assert.equal(secure(undefined).a.val, undefined)
        let a = secure({})
        a.name = 12
        assert.equal(a.name.val, undefined)
    })

})