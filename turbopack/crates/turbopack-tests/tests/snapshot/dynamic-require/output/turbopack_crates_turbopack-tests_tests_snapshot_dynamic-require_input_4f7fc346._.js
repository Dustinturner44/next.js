(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["output/turbopack_crates_turbopack-tests_tests_snapshot_dynamic-require_input_4f7fc346._.js",
"[project]/turbopack/crates/turbopack-tests/tests/snapshot/dynamic-require/input/deps/README [test] (ecmascript)", ((__turbopack_context__, module, exports) => {

const e = new Error("Could not parse module '[project]/turbopack/crates/turbopack-tests/tests/snapshot/dynamic-require/input/deps/README'\n\nExpected ';', '}' or <eof>");
e.code = 'MODULE_UNPARSABLE';
throw e;
}),
"[project]/turbopack/crates/turbopack-tests/tests/snapshot/dynamic-require/input/deps/cake.js [test] (ecmascript)", ((__turbopack_context__, module, exports) => {

exports.cake = "The cake is a like";
}),
"[project]/turbopack/crates/turbopack-tests/tests/snapshot/dynamic-require/input/index.js [test] (ecmascript)", ((__turbopack_context__, module, exports) => {

function get(name) {
    return __turbopack_context__.f({
        "./deps/README": {
            id: ()=>"[project]/turbopack/crates/turbopack-tests/tests/snapshot/dynamic-require/input/deps/README [test] (ecmascript)",
            module: ()=>__turbopack_context__.r("[project]/turbopack/crates/turbopack-tests/tests/snapshot/dynamic-require/input/deps/README [test] (ecmascript)")
        },
        "./deps/cake": {
            id: ()=>"[project]/turbopack/crates/turbopack-tests/tests/snapshot/dynamic-require/input/deps/cake.js [test] (ecmascript)",
            module: ()=>__turbopack_context__.r("[project]/turbopack/crates/turbopack-tests/tests/snapshot/dynamic-require/input/deps/cake.js [test] (ecmascript)")
        },
        "./deps/cake.js": {
            id: ()=>"[project]/turbopack/crates/turbopack-tests/tests/snapshot/dynamic-require/input/deps/cake.js [test] (ecmascript)",
            module: ()=>__turbopack_context__.r("[project]/turbopack/crates/turbopack-tests/tests/snapshot/dynamic-require/input/deps/cake.js [test] (ecmascript)")
        }
    })(`./deps/${name}`);
}
console.log(get('cake').cake);
}),
]);

//# sourceMappingURL=turbopack_crates_turbopack-tests_tests_snapshot_dynamic-require_input_4f7fc346._.js.map