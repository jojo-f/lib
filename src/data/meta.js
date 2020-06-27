export const jsVal = {
    number:[
        0, 1, NaN, Infinity, Number.MAX_VALUE, Number.MAX_SAFE_INTEGER, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.MIN_SAFE_INTEGER, Number.MIN_VALUE,
    ],
    boolean:[
        true, false,
    ],
    string:[
        '', '0', '1', 'true', 'false', 'string',
    ],
    object:[
        Object.create(null),{},{0:null},{0:undefined},{0:0},new Object()
    ],
    array:[
        [],Object.create([]),new Array(),[0],[1],[null]
    ],
    null:[null],
    undefined:[undefined],
    function:[
        () => {},
        function () {},
        function fun(){},
    ],
    symbol:[
        Symbol(),
        Symbol(1),
    ]
}

let data = []

Object.keys(jsVal).forEach(type => {
    jsVal[type].forEach(item => {
        data.push({
            type,
            val: item
        })
    })
})

function eq(a, b) {
    let {
        type: typeA,
        val: valA
    } = a
    let {
        type: typeB,
        val: valB
    } = b
    let result
    try {
        result = valA === valB
    } catch (e) {
        // console.log(`比较失败`, '[', valA, ']', '  ', '[', valB, ']', (e || {}).message)
    }
    try {
        if (result) console.log(`%c${result}`, result ? 'color:red;' : '', `==> [`, valA, `]:`, typeA, `===`, '[', valB, `]:`, typeB)
    } catch (error) {
        // console.log((error || {}).message);
    }
}

data.forEach(a => {
    data.forEach(b => {
        eq(a, b)
    })
})