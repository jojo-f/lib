(() => {
    let F = F || {}
    let _modules = {}
    F.defined = function (str, fn) {
        let parts = str.split('.'),
            old = parent = _modules,
            i = 0,
            len = 0

        if (parts[0] === 'F') {
            parts = parts.slice(1)
        }

        len = parts.length

        if (parts[0] === 'defined' || parts[0] === 'module') {
            return
        }

        for (; i < len; i++) {
            if (parent[parts[i]] === undefined) {
                parent[parts[i]] = {}
            }

            old = parent

            parent = parent[parts[i]]
        }

        if (fn) {
            old[parts[--i]] = fn()
        }

        return this
    }

    F.module = function (...args) {
        let fn = args.pop(),
            parts = args[0] && Array.isArray(args[0]) && args[0],
            modules = [],
            mod_ids = '',
            i = 0,
            i_len = parts.length,
            parent, j, j_len
        while (i < i_len) {
            mod_ids = parts[i]
            if (typeof mod_ids === 'string') {
                parent = _modules
                mod_ids = mod_ids.replace(/^F/, '').split('.')
                for (j = 0, j_len = mod_ids.length; j < j_len && parent; j++) {
                    parent = parent[mod_ids[j]]
                }
                modules.push(parent)
            } else {
                modules.push(mod_ids)
            }
            i++
        }

        fn.apply(this, modules)
    }

    window.F = F
})()