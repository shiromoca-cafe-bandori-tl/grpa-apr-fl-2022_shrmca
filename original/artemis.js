var Module = typeof Module !== "undefined" ? Module : {};
if (!Module.expectedDataFileDownloads) {
    Module.expectedDataFileDownloads = 0;
}
Module.expectedDataFileDownloads++;
(function () {
    var loadPackage = function (metadata) {
        var PACKAGE_PATH;
        if (typeof window === "object") {
            PACKAGE_PATH = window["encodeURIComponent"](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf("/")) + "/");
        } else if (typeof location !== "undefined") {
            PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf("/")) + "/");
        } else {
            throw "using preloaded data can only be done on a web page or in a web worker";
        }
        var PACKAGE_NAME = "./bin/artemis.data";
        var REMOTE_PACKAGE_BASE = "artemis.data";
        if (typeof Module["locateFilePackage"] === "function" && !Module["locateFile"]) {
            Module["locateFile"] = Module["locateFilePackage"];
            err("warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)");
        }
        var REMOTE_PACKAGE_NAME = Module["locateFile"] ? Module["locateFile"](REMOTE_PACKAGE_BASE, "") : REMOTE_PACKAGE_BASE;
        var REMOTE_PACKAGE_SIZE = metadata["remote_package_size"];
        var PACKAGE_UUID = metadata["package_uuid"];
        function fetchRemotePackage(packageName, packageSize, callback, errback) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", packageName, true);
            xhr.responseType = "arraybuffer";
            xhr.onprogress = function (event) {
                var url = packageName;
                var size = packageSize;
                if (event.total) size = event.total;
                if (event.loaded) {
                    if (!xhr.addedTotal) {
                        xhr.addedTotal = true;
                        if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
                        Module.dataFileDownloads[url] = { loaded: event.loaded, total: size };
                    } else {
                        Module.dataFileDownloads[url].loaded = event.loaded;
                    }
                    var total = 0;
                    var loaded = 0;
                    var num = 0;
                    for (var download in Module.dataFileDownloads) {
                        var data = Module.dataFileDownloads[download];
                        total += data.total;
                        loaded += data.loaded;
                        num++;
                    }
                    total = Math.ceil((total * Module.expectedDataFileDownloads) / num);
                    if (Module["setStatus"]) Module["setStatus"]("ダウンロード中です... (" + loaded + "/" + total + ")");
                } else if (!Module.dataFileDownloads) {
                    if (Module["setStatus"]) Module["setStatus"]("ダウンロード中です...");
                }
            };
            xhr.onerror = function (event) {
                throw new Error("NetworkError for: " + packageName);
            };
            xhr.onload = function (event) {
                if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) {
                    var packageData = xhr.response;
                    callback(packageData);
                } else {
                    throw new Error(xhr.statusText + " : " + xhr.responseURL);
                }
            };
            xhr.send(null);
        }
        function handleError(error) {
            console.error("package error:", error);
        }
        var fetchedCallback = null;
        var fetched = Module["getPreloadedPackage"] ? Module["getPreloadedPackage"](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;
        if (!fetched)
            fetchRemotePackage(
                REMOTE_PACKAGE_NAME,
                REMOTE_PACKAGE_SIZE,
                function (data) {
                    if (fetchedCallback) {
                        fetchedCallback(data);
                        fetchedCallback = null;
                    } else {
                        fetched = data;
                    }
                },
                handleError
            );
        function runWithFS() {
            function assert(check, msg) {
                if (!check) throw msg + new Error().stack;
            }
            function DataRequest(start, end, audio) {
                this.start = start;
                this.end = end;
                this.audio = audio;
            }
            DataRequest.prototype = {
                requests: {},
                open: function (mode, name) {
                    this.name = name;
                    this.requests[name] = this;
                    Module["addRunDependency"]("fp " + this.name);
                },
                send: function () {},
                onload: function () {
                    var byteArray = this.byteArray.subarray(this.start, this.end);
                    this.finish(byteArray);
                },
                finish: function (byteArray) {
                    var that = this;
                    Module["FS_createDataFile"](this.name, null, byteArray, true, true, true);
                    Module["removeRunDependency"]("fp " + that.name);
                    this.requests[this.name] = null;
                },
            };
            var files = metadata["files"];
            for (var i = 0; i < files.length; ++i) {
                new DataRequest(files[i]["start"], files[i]["end"], files[i]["audio"]).open("GET", files[i]["filename"]);
            }
            function processPackageData(arrayBuffer) {
                assert(arrayBuffer, "Loading data file failed.");
                assert(arrayBuffer instanceof ArrayBuffer, "bad input to processPackageData");
                var byteArray = new Uint8Array(arrayBuffer);
                DataRequest.prototype.byteArray = byteArray;
                var files = metadata["files"];
                for (var i = 0; i < files.length; ++i) {
                    DataRequest.prototype.requests[files[i].filename].onload();
                }
                Module["removeRunDependency"]("datafile_./bin/artemis.data");
            }
            Module["addRunDependency"]("datafile_./bin/artemis.data");
            if (!Module.preloadResults) Module.preloadResults = {};
            Module.preloadResults[PACKAGE_NAME] = { fromCache: false };
            if (fetched) {
                processPackageData(fetched);
                fetched = null;
            } else {
                fetchedCallback = processPackageData;
            }
        }
        if (Module["calledRun"]) {
            runWithFS();
        } else {
            if (!Module["preRun"]) Module["preRun"] = [];
            Module["preRun"].push(runWithFS);
        }
    };
    loadPackage({ files: [{ filename: "/root.pfs", start: 0, end: 100563335, audio: 0 }], remote_package_size: 100563335, package_uuid: "70f671f6-f6a0-4769-8359-986ed6dfb656" });
})();
var moduleOverrides = {};
var key;
for (key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key];
    }
}
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = function (status, toThrow) {
    throw toThrow;
};
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === "object";
ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
var scriptDirectory = "";
function locateFile(path) {
    if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory);
    }
    return scriptDirectory + path;
}
var read_, readAsync, readBinary, setWindowTitle;
var nodeFS;
var nodePath;
if (ENVIRONMENT_IS_NODE) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = require("path").dirname(scriptDirectory) + "/";
    } else {
        scriptDirectory = __dirname + "/";
    }
    read_ = function shell_read(filename, binary) {
        if (!nodeFS) nodeFS = require("fs");
        if (!nodePath) nodePath = require("path");
        filename = nodePath["normalize"](filename);
        return nodeFS["readFileSync"](filename, binary ? null : "utf8");
    };
    readBinary = function readBinary(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret);
        }
        assert(ret.buffer);
        return ret;
    };
    if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/");
    }
    arguments_ = process["argv"].slice(2);
    if (typeof module !== "undefined") {
        module["exports"] = Module;
    }
    process["on"]("uncaughtException", function (ex) {
        if (!(ex instanceof ExitStatus)) {
            throw ex;
        }
    });
    process["on"]("unhandledRejection", abort);
    quit_ = function (status) {
        process["exit"](status);
    };
    Module["inspect"] = function () {
        return "[Emscripten Module object]";
    };
} else if (ENVIRONMENT_IS_SHELL) {
    if (typeof read != "undefined") {
        read_ = function shell_read(f) {
            return read(f);
        };
    }
    readBinary = function readBinary(f) {
        var data;
        if (typeof readbuffer === "function") {
            return new Uint8Array(readbuffer(f));
        }
        data = read(f, "binary");
        assert(typeof data === "object");
        return data;
    };
    if (typeof scriptArgs != "undefined") {
        arguments_ = scriptArgs;
    } else if (typeof arguments != "undefined") {
        arguments_ = arguments;
    }
    if (typeof quit === "function") {
        quit_ = function (status) {
            quit(status);
        };
    }
    if (typeof print !== "undefined") {
        if (typeof console === "undefined") console = {};
        console.log = print;
        console.warn = console.error = typeof printErr !== "undefined" ? printErr : print;
    }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href;
    } else if (typeof document !== "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src;
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
    } else {
        scriptDirectory = "";
    }
    {
        read_ = function shell_read(url) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.send(null);
            return xhr.responseText;
        };
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = function readBinary(url) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response);
            };
        }
        readAsync = function readAsync(url, onload, onerror) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function xhr_onload() {
                if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
                    onload(xhr.response);
                    return;
                }
                onerror();
            };
            xhr.onerror = onerror;
            xhr.send(null);
        };
    }
    setWindowTitle = function (title) {
        document.title = title;
    };
} else {
}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);
for (key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key];
    }
}
moduleOverrides = null;
if (Module["arguments"]) arguments_ = Module["arguments"];
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
if (Module["quit"]) quit_ = Module["quit"];
var STACK_ALIGN = 16;
function alignMemory(size, factor) {
    if (!factor) factor = STACK_ALIGN;
    return Math.ceil(size / factor) * factor;
}
function warnOnce(text) {
    if (!warnOnce.shown) warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
    }
}
var tempRet0 = 0;
var setTempRet0 = function (value) {
    tempRet0 = value;
};
var getTempRet0 = function () {
    return tempRet0;
};
var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
var noExitRuntime;
if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
if (typeof WebAssembly !== "object") {
    abort("no native wasm support detected");
}
function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            HEAP8[ptr >>> 0] = value;
            break;
        case "i8":
            HEAP8[ptr >>> 0] = value;
            break;
        case "i16":
            HEAP16[ptr >>> 1] = value;
            break;
        case "i32":
            HEAP32[ptr >>> 2] = value;
            break;
        case "i64":
            (tempI64 = [
                value >>> 0,
                ((tempDouble = value), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
            ]),
                (HEAP32[ptr >>> 2] = tempI64[0]),
                (HEAP32[(ptr + 4) >>> 2] = tempI64[1]);
            break;
        case "float":
            HEAPF32[ptr >>> 2] = value;
            break;
        case "double":
            HEAPF64[ptr >>> 3] = value;
            break;
        default:
            abort("invalid type for setValue: " + type);
    }
}
var wasmMemory;
var ABORT = false;
var EXITSTATUS = 0;
function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed: " + text);
    }
}
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
function allocate(slab, allocator) {
    var ret;
    if (allocator == ALLOC_STACK) {
        ret = stackAlloc(slab.length);
    } else {
        ret = _malloc(slab.length);
    }
    if (slab.subarray || slab.slice) {
        HEAPU8.set(slab, ret >>> 0);
    } else {
        HEAPU8.set(new Uint8Array(slab), ret >>> 0);
    }
    return ret;
}
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
    idx >>>= 0;
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heap[endPtr >>> 0] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(heap.subarray(idx >>> 0, endPtr >>> 0));
    } else {
        var str = "";
        while (idx < endPtr) {
            var u0 = heap[idx++ >>> 0];
            if (!(u0 & 128)) {
                str += String.fromCharCode(u0);
                continue;
            }
            var u1 = heap[idx++ >>> 0] & 63;
            if ((u0 & 224) == 192) {
                str += String.fromCharCode(((u0 & 31) << 6) | u1);
                continue;
            }
            var u2 = heap[idx++ >>> 0] & 63;
            if ((u0 & 240) == 224) {
                u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
            } else {
                u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++ >>> 0] & 63);
            }
            if (u0 < 65536) {
                str += String.fromCharCode(u0);
            } else {
                var ch = u0 - 65536;
                str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
            }
        }
    }
    return str;
}
function UTF8ToString(ptr, maxBytesToRead) {
    ptr >>>= 0;
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}
function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    outIdx >>>= 0;
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
        }
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            heap[outIdx++ >>> 0] = u;
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            heap[outIdx++ >>> 0] = 192 | (u >> 6);
            heap[outIdx++ >>> 0] = 128 | (u & 63);
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            heap[outIdx++ >>> 0] = 224 | (u >> 12);
            heap[outIdx++ >>> 0] = 128 | ((u >> 6) & 63);
            heap[outIdx++ >>> 0] = 128 | (u & 63);
        } else {
            if (outIdx + 3 >= endIdx) break;
            heap[outIdx++ >>> 0] = 240 | (u >> 18);
            heap[outIdx++ >>> 0] = 128 | ((u >> 12) & 63);
            heap[outIdx++ >>> 0] = 128 | ((u >> 6) & 63);
            heap[outIdx++ >>> 0] = 128 | (u & 63);
        }
    }
    heap[outIdx >>> 0] = 0;
    return outIdx - startIdx;
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = (65536 + ((u & 1023) << 10)) | (str.charCodeAt(++i) & 1023);
        if (u <= 127) ++len;
        else if (u <= 2047) len += 2;
        else if (u <= 65535) len += 3;
        else len += 4;
    }
    return len;
}
function allocateUTF8(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret) stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
}
function allocateUTF8OnStack(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
}
function writeArrayToMemory(array, buffer) {
    HEAP8.set(array, buffer >>> 0);
}
function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >>> 0] = str.charCodeAt(i);
    }
    if (!dontAddNull) HEAP8[buffer >>> 0] = 0;
}
function alignUp(x, multiple) {
    if (x % multiple > 0) {
        x += multiple - (x % multiple);
    }
    return x;
}
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module["HEAP8"] = HEAP8 = new Int8Array(buf);
    Module["HEAP16"] = HEAP16 = new Int16Array(buf);
    Module["HEAP32"] = HEAP32 = new Int32Array(buf);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}
var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
if (Module["wasmMemory"]) {
    wasmMemory = Module["wasmMemory"];
} else {
    wasmMemory = new WebAssembly.Memory({ initial: INITIAL_MEMORY / 65536, maximum: 4294967296 / 65536 });
}
if (wasmMemory) {
    buffer = wasmMemory.buffer;
}
INITIAL_MEMORY = buffer.byteLength;
updateGlobalBufferAndViews(buffer);
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift());
        }
    }
    callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
    TTY.init();
    SOCKFS.root = FS.mount(SOCKFS, {}, null);
    callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
    FS.ignorePermissions = false;
    callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
    runtimeExited = true;
}
function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift());
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
}
function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
    return id;
}
function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
    }
}
function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
        }
    }
}
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
function abort(what) {
    if (Module["onAbort"]) {
        Module["onAbort"](what);
    }
    what += "";
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
    var e = new WebAssembly.RuntimeError(what);
    throw e;
}
function hasPrefix(str, prefix) {
    return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0;
}
var dataURIPrefix = "data:application/octet-stream;base64,";
function isDataURI(filename) {
    return hasPrefix(filename, dataURIPrefix);
}
var fileURIPrefix = "file://";
function isFileURI(filename) {
    return false; //hasPrefix(filename, fileURIPrefix);
}
var wasmBinaryFile = "artemis.wasm";
if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
}
function getBinary() {
    try {
        if (wasmBinary) {
            return new Uint8Array(wasmBinary);
        }
        if (readBinary) {
            return readBinary(wasmBinaryFile);
        } else {
            throw "both async and sync fetching of the wasm failed";
        }
    } catch (err) {
        abort(err);
    }
}
function getBinaryPromise() {
    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function" && !isFileURI(wasmBinaryFile)) {
        console.log("we're here!");
return fetch(wasmBinaryFile, { credentials: "same-origin" })
            .then(function (response) {
                if (!response["ok"]) {
                    throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
                }
console.log("worked!");
                return response["arrayBuffer"]();
            })
            .catch(function () {
console.log("didn't work");
                return getBinary();
            });
    }
console.log("oh no.");
    return Promise.resolve().then(getBinary);
}
function createWasm() {
    var info = { a: asmLibraryArg };
    function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module["asm"] = exports;
        wasmTable = Module["asm"]["Ic"];
        removeRunDependency("wasm-instantiate");
    }
    addRunDependency("wasm-instantiate");
    function receiveInstantiatedSource(output) {
        receiveInstance(output["instance"]);
    }
    function instantiateArrayBuffer(receiver) {
        return getBinaryPromise()
            .then(function (binary) {
                return WebAssembly.instantiate(binary, info);
            })
            .then(receiver, function (reason) {
                err("failed to asynchronously prepare wasm: " + reason);
                abort(reason);
            });
    }
    function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch === "function") {
            return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function (response) {
                var result = WebAssembly.instantiateStreaming(response, info);
                return result.then(receiveInstantiatedSource, function (reason) {
                    err("wasm streaming compile failed: " + reason);
                    err("falling back to ArrayBuffer instantiation");
                    return instantiateArrayBuffer(receiveInstantiatedSource);
                });
            });
        } else {
            return instantiateArrayBuffer(receiveInstantiatedSource);
        }
    }
    if (Module["instantiateWasm"]) {
        try {
            var exports = Module["instantiateWasm"](info, receiveInstance);
            return exports;
        } catch (e) {
            err("Module.instantiateWasm callback failed with error: " + e);
            return false;
        }
    }
    instantiateAsync();
    return {};
}
var tempDouble;
var tempI64;
var ASM_CONSTS = {
    713800: function () {
        if (artemis_fullscreen_video !== null) {
            artemis_fullscreen_video.pause();
            artemis_fullscreen_video = null;
        }
    },
    713909: function () {
        return artemis_fullscreen_video_copy_video === true ? 1 : 0;
    },
    713972: function () {
        return artemis_fullscreen_video_ended === true ? 1 : 0;
    },
    714030: function () {
        return artemis_fullscreen_video.videoWidth;
    },
    714075: function () {
        return artemis_fullscreen_video.videoHeight;
    },
    714120: function ($0) {
        if (typeof artemis_fullscreen_video === "undefined" || artemis_fullscreen_video === null) artemis_fullscreen_video = document.createElement("video");
        artemis_fullscreen_video_playing = false;
        artemis_fullscreen_video_timeupdate = false;
        artemis_fullscreen_video_ended = false;
        artemis_fullscreen_video_copy_video = false;
        artemis_fullscreen_video.autoplay = true;
        artemis_fullscreen_video.setAttribute("playsinline", "");
        artemis_fullscreen_video.addEventListener(
            "playing",
            function () {
                artemis_fullscreen_video_playing = true;
                if (artemis_fullscreen_video_timeupdate === true) artemis_fullscreen_video_copy_video = true;
            },
            true
        );
        artemis_fullscreen_video.addEventListener(
            "timeupdate",
            function () {
                artemis_fullscreen_video_timeupdate = true;
                if (artemis_fullscreen_video_playing === true) artemis_fullscreen_video_copy_video = true;
            },
            true
        );
        artemis_fullscreen_video.addEventListener(
            "ended",
            function () {
                artemis_fullscreen_video_ended = true;
            },
            true
        );
        artemis_fullscreen_video.src = UTF8ToString($0);
        artemis_fullscreen_video.play();
    },
    715155: function () {
        artemis_fullscreen_video.pause();
    },
    715189: function () {
        const gl = document.querySelector("#canvas").getContext("webgl");
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, artemis_fullscreen_video);
    },
    716023: function ($0) {
        alert(UTF8ToString($0));
    },
    716049: function ($0) {
        return confirm(UTF8ToString($0)) ? 1 : 0;
    },
    719500: function ($0) {
        console.log("Creating mount point %s ...", UTF8ToString($0));
        FS.mkdir(UTF8ToString($0));
        console.log("Mounting Indexed DB %s ...", UTF8ToString($0));
        FS.mount(IDBFS, {}, UTF8ToString($0));
        console.log("Loading file system ...");
        FS.syncfs(true, function (err) {
            console.log("Loading file system complete!");
            syncing = 0;
        });
        syncing = 1;
    },
    719832: function () {
        return syncing;
    },
    719848: function () {
        console.log("Saving file system ...");
        FS.syncfs(false, function (err) {
            console.log("Saving file system complete!");
            syncing = 0;
        });
        syncing = 1;
    },
    720184: function ($0) {
        window.open(UTF8ToString($0), "_blank");
    },
};
function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
            callback(Module);
            continue;
        }
        var func = callback.func;
        if (typeof func === "number") {
            if (callback.arg === undefined) {
                wasmTable.get(func)();
            } else {
                wasmTable.get(func)(callback.arg);
            }
        } else {
            func(callback.arg === undefined ? null : callback.arg);
        }
    }
}
function ___assert_fail(condition, filename, line, func) {
    abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"]);
}
var _emscripten_get_now;
if (ENVIRONMENT_IS_NODE) {
    _emscripten_get_now = function () {
        var t = process["hrtime"]();
        return t[0] * 1e3 + t[1] / 1e6;
    };
} else if (typeof dateNow !== "undefined") {
    _emscripten_get_now = dateNow;
} else
    _emscripten_get_now = function () {
        return performance.now();
    };
var _emscripten_get_now_is_monotonic = true;
function setErrNo(value) {
    HEAP32[___errno_location() >>> 2] = value;
    return value;
}
function _clock_gettime(clk_id, tp) {
    var now;
    if (clk_id === 0) {
        now = Date.now();
    } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
        now = _emscripten_get_now();
    } else {
        setErrNo(28);
        return -1;
    }
    HEAP32[tp >>> 2] = (now / 1e3) | 0;
    HEAP32[(tp + 4) >>> 2] = ((now % 1e3) * 1e3 * 1e3) | 0;
    return 0;
}
function ___clock_gettime(a0, a1) {
    return _clock_gettime(a0, a1);
}
var ExceptionInfoAttrs = { DESTRUCTOR_OFFSET: 0, REFCOUNT_OFFSET: 4, TYPE_OFFSET: 8, CAUGHT_OFFSET: 12, RETHROWN_OFFSET: 13, SIZE: 16 };
function ___cxa_allocate_exception(size) {
    return _malloc(size + ExceptionInfoAttrs.SIZE) + ExceptionInfoAttrs.SIZE;
}
function ExceptionInfo(excPtr) {
    this.excPtr = excPtr;
    this.ptr = excPtr - ExceptionInfoAttrs.SIZE;
    this.set_type = function (type) {
        HEAP32[(this.ptr + ExceptionInfoAttrs.TYPE_OFFSET) >>> 2] = type;
    };
    this.get_type = function () {
        return HEAP32[(this.ptr + ExceptionInfoAttrs.TYPE_OFFSET) >>> 2];
    };
    this.set_destructor = function (destructor) {
        HEAP32[(this.ptr + ExceptionInfoAttrs.DESTRUCTOR_OFFSET) >>> 2] = destructor;
    };
    this.get_destructor = function () {
        return HEAP32[(this.ptr + ExceptionInfoAttrs.DESTRUCTOR_OFFSET) >>> 2];
    };
    this.set_refcount = function (refcount) {
        HEAP32[(this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET) >>> 2] = refcount;
    };
    this.set_caught = function (caught) {
        caught = caught ? 1 : 0;
        HEAP8[(this.ptr + ExceptionInfoAttrs.CAUGHT_OFFSET) >>> 0] = caught;
    };
    this.get_caught = function () {
        return HEAP8[(this.ptr + ExceptionInfoAttrs.CAUGHT_OFFSET) >>> 0] != 0;
    };
    this.set_rethrown = function (rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(this.ptr + ExceptionInfoAttrs.RETHROWN_OFFSET) >>> 0] = rethrown;
    };
    this.get_rethrown = function () {
        return HEAP8[(this.ptr + ExceptionInfoAttrs.RETHROWN_OFFSET) >>> 0] != 0;
    };
    this.init = function (type, destructor) {
        this.set_type(type);
        this.set_destructor(destructor);
        this.set_refcount(0);
        this.set_caught(false);
        this.set_rethrown(false);
    };
    this.add_ref = function () {
        var value = HEAP32[(this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET) >>> 2];
        HEAP32[(this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET) >>> 2] = value + 1;
    };
    this.release_ref = function () {
        var prev = HEAP32[(this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET) >>> 2];
        HEAP32[(this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET) >>> 2] = prev - 1;
        return prev === 1;
    };
}
function CatchInfo(ptr) {
    this.free = function () {
        _free(this.ptr);
        this.ptr = 0;
    };
    this.set_base_ptr = function (basePtr) {
        HEAP32[this.ptr >>> 2] = basePtr;
    };
    this.get_base_ptr = function () {
        return HEAP32[this.ptr >>> 2];
    };
    this.set_adjusted_ptr = function (adjustedPtr) {
        var ptrSize = 4;
        HEAP32[(this.ptr + ptrSize) >>> 2] = adjustedPtr;
    };
    this.get_adjusted_ptr = function () {
        var ptrSize = 4;
        return HEAP32[(this.ptr + ptrSize) >>> 2];
    };
    this.get_exception_ptr = function () {
        var isPointer = ___cxa_is_pointer_type(this.get_exception_info().get_type());
        if (isPointer) {
            return HEAP32[this.get_base_ptr() >>> 2];
        }
        var adjusted = this.get_adjusted_ptr();
        if (adjusted !== 0) return adjusted;
        return this.get_base_ptr();
    };
    this.get_exception_info = function () {
        return new ExceptionInfo(this.get_base_ptr());
    };
    if (ptr === undefined) {
        this.ptr = _malloc(8);
        this.set_adjusted_ptr(0);
    } else {
        this.ptr = ptr;
    }
}
var exceptionCaught = [];
function exception_addRef(info) {
    info.add_ref();
}
var uncaughtExceptionCount = 0;
function ___cxa_begin_catch(ptr) {
    var catchInfo = new CatchInfo(ptr);
    var info = catchInfo.get_exception_info();
    if (!info.get_caught()) {
        info.set_caught(true);
        uncaughtExceptionCount--;
    }
    info.set_rethrown(false);
    exceptionCaught.push(catchInfo);
    exception_addRef(info);
    return catchInfo.get_exception_ptr();
}
var exceptionLast = 0;
function ___cxa_free_exception(ptr) {
    return _free(new ExceptionInfo(ptr).ptr);
}
function exception_decRef(info) {
    if (info.release_ref() && !info.get_rethrown()) {
        var destructor = info.get_destructor();
        if (destructor) {
            wasmTable.get(destructor)(info.excPtr);
        }
        ___cxa_free_exception(info.excPtr);
    }
}
function ___cxa_end_catch() {
    _setThrew(0);
    var catchInfo = exceptionCaught.pop();
    exception_decRef(catchInfo.get_exception_info());
    catchInfo.free();
    exceptionLast = 0;
}
function ___resumeException(catchInfoPtr) {
    var catchInfo = new CatchInfo(catchInfoPtr);
    var ptr = catchInfo.get_base_ptr();
    if (!exceptionLast) {
        exceptionLast = ptr;
    }
    catchInfo.free();
    throw ptr;
}
function ___cxa_find_matching_catch_2() {
    var thrown = exceptionLast;
    if (!thrown) {
        setTempRet0(0 | 0);
        return 0 | 0;
    }
    var info = new ExceptionInfo(thrown);
    var thrownType = info.get_type();
    var catchInfo = new CatchInfo();
    catchInfo.set_base_ptr(thrown);
    if (!thrownType) {
        setTempRet0(0 | 0);
        return catchInfo.ptr | 0;
    }
    var typeArray = Array.prototype.slice.call(arguments);
    var stackTop = stackSave();
    var exceptionThrowBuf = stackAlloc(4);
    HEAP32[exceptionThrowBuf >>> 2] = thrown;
    for (var i = 0; i < typeArray.length; i++) {
        var caughtType = typeArray[i];
        if (caughtType === 0 || caughtType === thrownType) {
            break;
        }
        if (___cxa_can_catch(caughtType, thrownType, exceptionThrowBuf)) {
            var adjusted = HEAP32[exceptionThrowBuf >>> 2];
            if (thrown !== adjusted) {
                catchInfo.set_adjusted_ptr(adjusted);
            }
            setTempRet0(caughtType | 0);
            return catchInfo.ptr | 0;
        }
    }
    stackRestore(stackTop);
    setTempRet0(thrownType | 0);
    return catchInfo.ptr | 0;
}
function ___cxa_find_matching_catch_3() {
    var thrown = exceptionLast;
    if (!thrown) {
        setTempRet0(0 | 0);
        return 0 | 0;
    }
    var info = new ExceptionInfo(thrown);
    var thrownType = info.get_type();
    var catchInfo = new CatchInfo();
    catchInfo.set_base_ptr(thrown);
    if (!thrownType) {
        setTempRet0(0 | 0);
        return catchInfo.ptr | 0;
    }
    var typeArray = Array.prototype.slice.call(arguments);
    var stackTop = stackSave();
    var exceptionThrowBuf = stackAlloc(4);
    HEAP32[exceptionThrowBuf >>> 2] = thrown;
    for (var i = 0; i < typeArray.length; i++) {
        var caughtType = typeArray[i];
        if (caughtType === 0 || caughtType === thrownType) {
            break;
        }
        if (___cxa_can_catch(caughtType, thrownType, exceptionThrowBuf)) {
            var adjusted = HEAP32[exceptionThrowBuf >>> 2];
            if (thrown !== adjusted) {
                catchInfo.set_adjusted_ptr(adjusted);
            }
            setTempRet0(caughtType | 0);
            return catchInfo.ptr | 0;
        }
    }
    stackRestore(stackTop);
    setTempRet0(thrownType | 0);
    return catchInfo.ptr | 0;
}
function ___cxa_find_matching_catch_8() {
    var thrown = exceptionLast;
    if (!thrown) {
        setTempRet0(0 | 0);
        return 0 | 0;
    }
    var info = new ExceptionInfo(thrown);
    var thrownType = info.get_type();
    var catchInfo = new CatchInfo();
    catchInfo.set_base_ptr(thrown);
    if (!thrownType) {
        setTempRet0(0 | 0);
        return catchInfo.ptr | 0;
    }
    var typeArray = Array.prototype.slice.call(arguments);
    var stackTop = stackSave();
    var exceptionThrowBuf = stackAlloc(4);
    HEAP32[exceptionThrowBuf >>> 2] = thrown;
    for (var i = 0; i < typeArray.length; i++) {
        var caughtType = typeArray[i];
        if (caughtType === 0 || caughtType === thrownType) {
            break;
        }
        if (___cxa_can_catch(caughtType, thrownType, exceptionThrowBuf)) {
            var adjusted = HEAP32[exceptionThrowBuf >>> 2];
            if (thrown !== adjusted) {
                catchInfo.set_adjusted_ptr(adjusted);
            }
            setTempRet0(caughtType | 0);
            return catchInfo.ptr | 0;
        }
    }
    stackRestore(stackTop);
    setTempRet0(thrownType | 0);
    return catchInfo.ptr | 0;
}
function ___cxa_rethrow() {
    var catchInfo = exceptionCaught.pop();
    var info = catchInfo.get_exception_info();
    var ptr = catchInfo.get_base_ptr();
    if (!info.get_rethrown()) {
        exceptionCaught.push(catchInfo);
        info.set_rethrown(true);
        info.set_caught(false);
        uncaughtExceptionCount++;
    } else {
        catchInfo.free();
    }
    exceptionLast = ptr;
    throw ptr;
}
function ___cxa_throw(ptr, type, destructor) {
    var info = new ExceptionInfo(ptr);
    info.init(type, destructor);
    exceptionLast = ptr;
    uncaughtExceptionCount++;
    throw ptr;
}
function ___cxa_uncaught_exceptions() {
    return uncaughtExceptionCount;
}
function _gmtime_r(time, tmPtr) {
    var date = new Date(HEAP32[time >>> 2] * 1e3);
    HEAP32[tmPtr >>> 2] = date.getUTCSeconds();
    HEAP32[(tmPtr + 4) >>> 2] = date.getUTCMinutes();
    HEAP32[(tmPtr + 8) >>> 2] = date.getUTCHours();
    HEAP32[(tmPtr + 12) >>> 2] = date.getUTCDate();
    HEAP32[(tmPtr + 16) >>> 2] = date.getUTCMonth();
    HEAP32[(tmPtr + 20) >>> 2] = date.getUTCFullYear() - 1900;
    HEAP32[(tmPtr + 24) >>> 2] = date.getUTCDay();
    HEAP32[(tmPtr + 36) >>> 2] = 0;
    HEAP32[(tmPtr + 32) >>> 2] = 0;
    var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
    HEAP32[(tmPtr + 28) >>> 2] = yday;
    if (!_gmtime_r.GMTString) _gmtime_r.GMTString = allocateUTF8("GMT");
    HEAP32[(tmPtr + 40) >>> 2] = _gmtime_r.GMTString;
    return tmPtr;
}
function ___gmtime_r(a0, a1) {
    return _gmtime_r(a0, a1);
}
function _tzset() {
    if (_tzset.called) return;
    _tzset.called = true;
    var currentYear = new Date().getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAP32[__get_timezone() >>> 2] = stdTimezoneOffset * 60;
    HEAP32[__get_daylight() >>> 2] = Number(winterOffset != summerOffset);
    function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT";
    }
    var winterName = extractZone(winter);
    var summerName = extractZone(summer);
    var winterNamePtr = allocateUTF8(winterName);
    var summerNamePtr = allocateUTF8(summerName);
    if (summerOffset < winterOffset) {
        HEAP32[__get_tzname() >>> 2] = winterNamePtr;
        HEAP32[(__get_tzname() + 4) >>> 2] = summerNamePtr;
    } else {
        HEAP32[__get_tzname() >>> 2] = summerNamePtr;
        HEAP32[(__get_tzname() + 4) >>> 2] = winterNamePtr;
    }
}
function _localtime_r(time, tmPtr) {
    _tzset();
    var date = new Date(HEAP32[time >>> 2] * 1e3);
    HEAP32[tmPtr >>> 2] = date.getSeconds();
    HEAP32[(tmPtr + 4) >>> 2] = date.getMinutes();
    HEAP32[(tmPtr + 8) >>> 2] = date.getHours();
    HEAP32[(tmPtr + 12) >>> 2] = date.getDate();
    HEAP32[(tmPtr + 16) >>> 2] = date.getMonth();
    HEAP32[(tmPtr + 20) >>> 2] = date.getFullYear() - 1900;
    HEAP32[(tmPtr + 24) >>> 2] = date.getDay();
    var start = new Date(date.getFullYear(), 0, 1);
    var yday = ((date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)) | 0;
    HEAP32[(tmPtr + 28) >>> 2] = yday;
    HEAP32[(tmPtr + 36) >>> 2] = -(date.getTimezoneOffset() * 60);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
    HEAP32[(tmPtr + 32) >>> 2] = dst;
    var zonePtr = HEAP32[(__get_tzname() + (dst ? 4 : 0)) >>> 2];
    HEAP32[(tmPtr + 40) >>> 2] = zonePtr;
    return tmPtr;
}
function ___localtime_r(a0, a1) {
    return _localtime_r(a0, a1);
}
var PATH = {
    splitPath: function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
    },
    normalizeArray: function (parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1);
            } else if (last === "..") {
                parts.splice(i, 1);
                up++;
            } else if (up) {
                parts.splice(i, 1);
                up--;
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..");
            }
        }
        return parts;
    },
    normalize: function (path) {
        var isAbsolute = path.charAt(0) === "/",
            trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(
            path.split("/").filter(function (p) {
                return !!p;
            }),
            !isAbsolute
        ).join("/");
        if (!path && !isAbsolute) {
            path = ".";
        }
        if (path && trailingSlash) {
            path += "/";
        }
        return (isAbsolute ? "/" : "") + path;
    },
    dirname: function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return ".";
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
    },
    basename: function (path) {
        if (path === "/") return "/";
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1);
    },
    extname: function (path) {
        return PATH.splitPath(path)[3];
    },
    join: function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"));
    },
    join2: function (l, r) {
        return PATH.normalize(l + "/" + r);
    },
};
function getRandomDevice() {
    if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
        var randomBuffer = new Uint8Array(1);
        return function () {
            crypto.getRandomValues(randomBuffer);
            return randomBuffer[0];
        };
    } else if (ENVIRONMENT_IS_NODE) {
        try {
            var crypto_module = require("crypto");
            return function () {
                return crypto_module["randomBytes"](1)[0];
            };
        } catch (e) {}
    }
    return function () {
        abort("randomDevice");
    };
}
var PATH_FS = {
    resolve: function () {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path !== "string") {
                throw new TypeError("Arguments to path.resolve must be strings");
            } else if (!path) {
                return "";
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/";
        }
        resolvedPath = PATH.normalizeArray(
            resolvedPath.split("/").filter(function (p) {
                return !!p;
            }),
            !resolvedAbsolute
        ).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
    },
    relative: function (from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break;
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break;
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break;
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..");
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/");
    },
};
var TTY = {
    ttys: [],
    init: function () {},
    shutdown: function () {},
    register: function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
    },
    stream_ops: {
        open: function (stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43);
            }
            stream.tty = tty;
            stream.seekable = false;
        },
        close: function (stream) {
            stream.tty.ops.flush(stream.tty);
        },
        flush: function (stream) {
            stream.tty.ops.flush(stream.tty);
        },
        read: function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60);
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty);
                } catch (e) {
                    throw new FS.ErrnoError(29);
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6);
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result;
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now();
            }
            return bytesRead;
        },
        write: function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60);
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
                }
            } catch (e) {
                throw new FS.ErrnoError(29);
            }
            if (length) {
                stream.node.timestamp = Date.now();
            }
            return i;
        },
    },
    default_tty_ops: {
        get_char: function (tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    var BUFSIZE = 256;
                    var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    try {
                        bytesRead = nodeFS.readSync(process.stdin.fd, buf, 0, BUFSIZE, null);
                    } catch (e) {
                        if (e.toString().indexOf("EOF") != -1) bytesRead = 0;
                        else throw e;
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString("utf-8");
                    } else {
                        result = null;
                    }
                } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                    result = window.prompt("Input: ");
                    if (result !== null) {
                        result += "\n";
                    }
                } else if (typeof readline == "function") {
                    result = readline();
                    if (result !== null) {
                        result += "\n";
                    }
                }
                if (!result) {
                    return null;
                }
                tty.input = intArrayFromString(result, true);
            }
            return tty.input.shift();
        },
        put_char: function (tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            } else {
                if (val != 0) tty.output.push(val);
            }
        },
        flush: function (tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
        },
    },
    default_tty1_ops: {
        put_char: function (tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            } else {
                if (val != 0) tty.output.push(val);
            }
        },
        flush: function (tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
        },
    },
};
function mmapAlloc(size) {
    var alignedSize = alignMemory(size, 16384);
    var ptr = _malloc(alignedSize);
    while (size < alignedSize) HEAP8[(ptr + size++) >>> 0] = 0;
    return ptr;
}
var MEMFS = {
    ops_table: null,
    mount: function (mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0);
    },
    createNode: function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63);
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink,
                    },
                    stream: { llseek: MEMFS.stream_ops.llseek },
                },
                file: {
                    node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr },
                    stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, allocate: MEMFS.stream_ops.allocate, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync },
                },
                link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} },
                chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops },
            };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {};
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null;
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node;
        }
        return node;
    },
    getFileDataAsRegularArray: function (node) {
        if (node.contents && node.contents.subarray) {
            var arr = [];
            for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
            return arr;
        }
        return node.contents;
    },
    getFileDataAsTypedArray: function (node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents);
    },
    expandFileStorage: function (node, newCapacity) {
        newCapacity >>>= 0;
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
        return;
    },
    resizeFileStorage: function (node, newSize) {
        newSize >>>= 0;
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
            return;
        }
        if (!node.contents || node.contents.subarray) {
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize);
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
            }
            node.usedBytes = newSize;
            return;
        }
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
    },
    node_ops: {
        getattr: function (node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096;
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes;
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length;
            } else {
                attr.size = 0;
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr;
        },
        setattr: function (node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp;
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size);
            }
        },
        lookup: function (parent, name) {
            throw FS.genericErrors[44];
        },
        mknod: function (parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev);
        },
        rename: function (old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name);
                } catch (e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55);
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            old_node.parent = new_dir;
        },
        unlink: function (parent, name) {
            delete parent.contents[name];
        },
        rmdir: function (parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55);
            }
            delete parent.contents[name];
        },
        readdir: function (node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue;
                }
                entries.push(key);
            }
            return entries;
        },
        symlink: function (parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node;
        },
        readlink: function (node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28);
            }
            return node.link;
        },
    },
    stream_ops: {
        read: function (stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset);
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
            }
            return size;
        },
        write: function (stream, buffer, offset, length, position, canOwn) {
            if (buffer.buffer === HEAP8.buffer) {
                canOwn = false;
            }
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length;
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = buffer.slice(offset, offset + length);
                    node.usedBytes = length;
                    return length;
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length;
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) {
                node.contents.set(buffer.subarray(offset, offset + length), position);
            } else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i];
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length;
        },
        llseek: function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position;
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes;
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28);
            }
            return position;
        },
        allocate: function (stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },
        mmap: function (stream, address, length, position, prot, flags) {
            assert(address === 0);
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43);
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && contents.buffer === buffer) {
                allocated = false;
                ptr = contents.byteOffset;
            } else {
                if (position > 0 || position + length < contents.length) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length);
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length);
                    }
                }
                allocated = true;
                ptr = mmapAlloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48);
                }
                ptr >>>= 0;
                HEAP8.set(contents, ptr >>> 0);
            }
            return { ptr: ptr, allocated: allocated };
        },
        msync: function (stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43);
            }
            if (mmapFlags & 2) {
                return 0;
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0;
        },
    },
};
var IDBFS = {
    dbs: {},
    indexedDB: function () {
        if (typeof indexedDB !== "undefined") return indexedDB;
        var ret = null;
        if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, "IDBFS used, but indexedDB not supported");
        return ret;
    },
    DB_VERSION: 21,
    DB_STORE_NAME: "FILE_DATA",
    mount: function (mount) {
        return MEMFS.mount.apply(null, arguments);
    },
    syncfs: function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function (err, local) {
            if (err) return callback(err);
            IDBFS.getRemoteSet(mount, function (err, remote) {
                if (err) return callback(err);
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
                IDBFS.reconcile(src, dst, callback);
            });
        });
    },
    getDB: function (name, callback) {
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db);
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
            return callback(e);
        }
        if (!req) {
            return callback("Unable to connect to IndexedDB");
        }
        req.onupgradeneeded = function (e) {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
            }
            if (!fileStore.indexNames.contains("timestamp")) {
                fileStore.createIndex("timestamp", "timestamp", { unique: false });
            }
        };
        req.onsuccess = function () {
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db);
        };
        req.onerror = function (e) {
            callback(this.error);
            e.preventDefault();
        };
    },
    getLocalSet: function (mount, callback) {
        var entries = {};
        function isRealDir(p) {
            return p !== "." && p !== "..";
        }
        function toAbsolute(root) {
            return function (p) {
                return PATH.join2(root, p);
            };
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path);
            } catch (e) {
                return callback(e);
            }
            if (FS.isDir(stat.mode)) {
                check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
            }
            entries[path] = { timestamp: stat.mtime };
        }
        return callback(null, { type: "local", entries: entries });
    },
    getRemoteSet: function (mount, callback) {
        var entries = {};
        IDBFS.getDB(mount.mountpoint, function (err, db) {
            if (err) return callback(err);
            try {
                var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
                transaction.onerror = function (e) {
                    callback(this.error);
                    e.preventDefault();
                };
                var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                var index = store.index("timestamp");
                index.openKeyCursor().onsuccess = function (event) {
                    var cursor = event.target.result;
                    if (!cursor) {
                        return callback(null, { type: "remote", db: db, entries: entries });
                    }
                    entries[cursor.primaryKey] = { timestamp: cursor.key };
                    cursor.continue();
                };
            } catch (e) {
                return callback(e);
            }
        });
    },
    loadLocalEntry: function (path, callback) {
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
        } catch (e) {
            return callback(e);
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
            return callback(new Error("node type not supported"));
        }
    },
    storeLocalEntry: function (path, entry, callback) {
        try {
            if (FS.isDir(entry["mode"])) {
                FS.mkdir(path, entry["mode"]);
            } else if (FS.isFile(entry["mode"])) {
                FS.writeFile(path, entry["contents"], { canOwn: true });
            } else {
                return callback(new Error("node type not supported"));
            }
            FS.chmod(path, entry["mode"]);
            FS.utime(path, entry["timestamp"], entry["timestamp"]);
        } catch (e) {
            return callback(e);
        }
        callback(null);
    },
    removeLocalEntry: function (path, callback) {
        try {
            var lookup = FS.lookupPath(path);
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path);
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path);
            }
        } catch (e) {
            return callback(e);
        }
        callback(null);
    },
    loadRemoteEntry: function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function (event) {
            callback(null, event.target.result);
        };
        req.onerror = function (e) {
            callback(this.error);
            e.preventDefault();
        };
    },
    storeRemoteEntry: function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function () {
            callback(null);
        };
        req.onerror = function (e) {
            callback(this.error);
            e.preventDefault();
        };
    },
    removeRemoteEntry: function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function () {
            callback(null);
        };
        req.onerror = function (e) {
            callback(this.error);
            e.preventDefault();
        };
    },
    reconcile: function (src, dst, callback) {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e["timestamp"].getTime() != e2["timestamp"].getTime()) {
                create.push(key);
                total++;
            }
        });
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
            var e = dst.entries[key];
            var e2 = src.entries[key];
            if (!e2) {
                remove.push(key);
                total++;
            }
        });
        if (!total) {
            return callback(null);
        }
        var errored = false;
        var db = src.type === "remote" ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        function done(err) {
            if (err && !errored) {
                errored = true;
                return callback(err);
            }
        }
        transaction.onerror = function (e) {
            done(this.error);
            e.preventDefault();
        };
        transaction.oncomplete = function (e) {
            if (!errored) {
                callback(null);
            }
        };
        create.sort().forEach(function (path) {
            if (dst.type === "local") {
                IDBFS.loadRemoteEntry(store, path, function (err, entry) {
                    if (err) return done(err);
                    IDBFS.storeLocalEntry(path, entry, done);
                });
            } else {
                IDBFS.loadLocalEntry(path, function (err, entry) {
                    if (err) return done(err);
                    IDBFS.storeRemoteEntry(store, path, entry, done);
                });
            }
        });
        remove
            .sort()
            .reverse()
            .forEach(function (path) {
                if (dst.type === "local") {
                    IDBFS.removeLocalEntry(path, done);
                } else {
                    IDBFS.removeRemoteEntry(store, path, done);
                }
            });
    },
};
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: { openFlags: { READ: 1, WRITE: 2 } },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    lookupPath: function (path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path) return { path: "", node: null };
        var defaults = { follow_mount: true, recurse_count: 0 };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key];
            }
        }
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(32);
        }
        var parts = PATH.normalizeArray(
            path.split("/").filter(function (p) {
                return !!p;
            }),
            false
        );
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break;
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || (islast && opts.follow_mount)) {
                    current = current.mounted.root;
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(32);
                    }
                }
            }
        }
        return { path: current_path, node: current };
    },
    getPath: function (node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent;
        }
    },
    hashName: function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
    },
    hashAddNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
    },
    hashRemoveNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next;
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break;
                }
                current = current.name_next;
            }
        }
    },
    lookupNode: function (parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
            throw new FS.ErrnoError(errCode, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node;
            }
        }
        return FS.lookup(parent, name);
    },
    createNode: function (parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node;
    },
    destroyNode: function (node) {
        FS.hashRemoveNode(node);
    },
    isRoot: function (node) {
        return node === node.parent;
    },
    isMountpoint: function (node) {
        return !!node.mounted;
    },
    isFile: function (mode) {
        return (mode & 61440) === 32768;
    },
    isDir: function (mode) {
        return (mode & 61440) === 16384;
    },
    isLink: function (mode) {
        return (mode & 61440) === 40960;
    },
    isChrdev: function (mode) {
        return (mode & 61440) === 8192;
    },
    isBlkdev: function (mode) {
        return (mode & 61440) === 24576;
    },
    isFIFO: function (mode) {
        return (mode & 61440) === 4096;
    },
    isSocket: function (mode) {
        return (mode & 49152) === 49152;
    },
    flagModes: { r: 0, "r+": 2, w: 577, "w+": 578, a: 1089, "a+": 1090 },
    modeStringToFlags: function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
            throw new Error("Unknown file open mode: " + str);
        }
        return flags;
    },
    flagsToPermissionString: function (flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w";
        }
        return perms;
    },
    nodePermissions: function (node, perms) {
        if (FS.ignorePermissions) {
            return 0;
        }
        if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
            return 2;
        } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
            return 2;
        } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
            return 2;
        }
        return 0;
    },
    mayLookup: function (dir) {
        var errCode = FS.nodePermissions(dir, "x");
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
    },
    mayCreate: function (dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return 20;
        } catch (e) {}
        return FS.nodePermissions(dir, "wx");
    },
    mayDelete: function (dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name);
        } catch (e) {
            return e.errno;
        }
        var errCode = FS.nodePermissions(dir, "wx");
        if (errCode) {
            return errCode;
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54;
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10;
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 31;
            }
        }
        return 0;
    },
    mayOpen: function (node, flags) {
        if (!node) {
            return 44;
        }
        if (FS.isLink(node.mode)) {
            return 32;
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return 31;
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
    },
    MAX_OPEN_FDS: 4096,
    nextfd: function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd;
            }
        }
        throw new FS.ErrnoError(33);
    },
    getStream: function (fd) {
        return FS.streams[fd];
    },
    createStream: function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = function () {};
            FS.FSStream.prototype = {
                object: {
                    get: function () {
                        return this.node;
                    },
                    set: function (val) {
                        this.node = val;
                    },
                },
                isRead: {
                    get: function () {
                        return (this.flags & 2097155) !== 1;
                    },
                },
                isWrite: {
                    get: function () {
                        return (this.flags & 2097155) !== 0;
                    },
                },
                isAppend: {
                    get: function () {
                        return this.flags & 1024;
                    },
                },
            };
        }
        var newStream = new FS.FSStream();
        for (var p in stream) {
            newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
    },
    closeStream: function (fd) {
        FS.streams[fd] = null;
    },
    chrdev_stream_ops: {
        open: function (stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream);
            }
        },
        llseek: function () {
            throw new FS.ErrnoError(70);
        },
    },
    major: function (dev) {
        return dev >> 8;
    },
    minor: function (dev) {
        return dev & 255;
    },
    makedev: function (ma, mi) {
        return (ma << 8) | mi;
    },
    registerDevice: function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
    },
    getDevice: function (dev) {
        return FS.devices[dev];
    },
    getMounts: function (mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts);
        }
        return mounts;
    },
    syncfs: function (populate, callback) {
        if (typeof populate === "function") {
            callback = populate;
            populate = false;
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work");
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(errCode) {
            FS.syncFSRequests--;
            return callback(errCode);
        }
        function done(errCode) {
            if (errCode) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(errCode);
                }
                return;
            }
            if (++completed >= mounts.length) {
                doCallback(null);
            }
        }
        mounts.forEach(function (mount) {
            if (!mount.type.syncfs) {
                return done(null);
            }
            mount.type.syncfs(mount, populate, done);
        });
    },
    mount: function (type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10);
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54);
            }
        }
        var mount = { type: type, opts: opts, mountpoint: mountpoint, mounts: [] };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot;
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount);
            }
        }
        return mountRoot;
    },
    unmount: function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28);
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(function (hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.indexOf(current.mount) !== -1) {
                    FS.destroyNode(current);
                }
                current = next;
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1);
    },
    lookup: function (parent, name) {
        return parent.node_ops.lookup(parent, name);
    },
    mknod: function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
    },
    create: function (path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
    },
    mkdir: function (path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
    },
    mkdirTree: function (path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode);
            } catch (e) {
                if (e.errno != 20) throw e;
            }
        }
    },
    mkdev: function (path, mode, dev) {
        if (typeof dev === "undefined") {
            dev = mode;
            mode = 438;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
    },
    symlink: function (oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
    },
    rename: function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75);
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28);
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55);
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {}
        if (old_node === new_node) {
            return;
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
            throw new FS.ErrnoError(10);
        }
        if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, "w");
            if (errCode) {
                throw new FS.ErrnoError(errCode);
            }
        }
        try {
            if (FS.trackingDelegate["willMovePath"]) {
                FS.trackingDelegate["willMovePath"](old_path, new_path);
            }
        } catch (e) {
            err("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
            throw e;
        } finally {
            FS.hashAddNode(old_node);
        }
        try {
            if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path);
        } catch (e) {
            err("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
        }
    },
    rmdir: function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path);
            }
        } catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
        } catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
        }
    },
    readdir: function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
    },
    unlink: function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path);
            }
        } catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
        } catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
        }
    },
    readlink: function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
    },
    stat: function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
    },
    lstat: function (path) {
        return FS.stat(path, true);
    },
    chmod: function (path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, { mode: (mode & 4095) | (node.mode & ~4095), timestamp: Date.now() });
    },
    lchmod: function (path, mode) {
        FS.chmod(path, mode, true);
    },
    fchmod: function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8);
        }
        FS.chmod(stream.node, mode);
    },
    chown: function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, { timestamp: Date.now() });
    },
    lchown: function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
    },
    fchown: function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8);
        }
        FS.chown(stream.node, uid, gid);
    },
    truncate: function (path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, { follow: true });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, "w");
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
    },
    ftruncate: function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
    },
    utime: function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
    },
    open: function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(44);
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = (mode & 4095) | 32768;
        } else {
            mode = 0;
        }
        var node;
        if (typeof path === "object") {
            node = path;
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
                node = lookup.node;
            } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(20);
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true;
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44);
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512;
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
        }
        if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
                throw new FS.ErrnoError(errCode);
            }
        }
        if (flags & 512) {
            FS.truncate(node, 0);
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream({ node: node, path: FS.getPath(node), flags: flags, seekable: true, position: 0, stream_ops: node.stream_ops, ungotten: [], error: false }, fd_start, fd_end);
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                err("FS.trackingDelegate error on read file: " + path);
            }
        }
        try {
            if (FS.trackingDelegate["onOpenFile"]) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ;
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE;
                }
                FS.trackingDelegate["onOpenFile"](path, trackingFlags);
            }
        } catch (e) {
            err("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
        }
        return stream;
    },
    close: function (stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream);
            }
        } catch (e) {
            throw e;
        } finally {
            FS.closeStream(stream.fd);
        }
        stream.fd = null;
    },
    isClosed: function (stream) {
        return stream.fd === null;
    },
    llseek: function (stream, offset, whence) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
    },
    read: function (stream, buffer, offset, length, position) {
        offset >>>= 0;
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28);
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position;
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
    },
    write: function (stream, buffer, offset, length, position, canOwn) {
        offset >>>= 0;
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
            FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position;
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path);
        } catch (e) {
            err("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message);
        }
        return bytesWritten;
    },
    allocate: function (stream, offset, length) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
    },
    mmap: function (stream, address, length, position, prot, flags) {
        address >>>= 0;
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(stream, address, length, position, prot, flags);
    },
    msync: function (stream, buffer, offset, length, mmapFlags) {
        offset >>>= 0;
        if (!stream || !stream.stream_ops.msync) {
            return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
    },
    munmap: function (stream) {
        return 0;
    },
    ioctl: function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
    },
    readFile: function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === "binary") {
            ret = buf;
        }
        FS.close(stream);
        return ret;
    },
    writeFile: function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
            throw new Error("Unsupported data type");
        }
        FS.close(stream);
    },
    cwd: function () {
        return FS.currentPath;
    },
    chdir: function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, "x");
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
    },
    createDefaultDirectories: function () {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user");
    },
    createDefaultDevices: function () {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: function () {
                return 0;
            },
            write: function (stream, buffer, offset, length, pos) {
                return length;
            },
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device = getRandomDevice();
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp");
    },
    createSpecialDirectories: function () {
        FS.mkdir("/proc");
        FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount(
            {
                mount: function () {
                    var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                    node.node_ops = {
                        lookup: function (parent, name) {
                            var fd = +name;
                            var stream = FS.getStream(fd);
                            if (!stream) throw new FS.ErrnoError(8);
                            var ret = {
                                parent: null,
                                mount: { mountpoint: "fake" },
                                node_ops: {
                                    readlink: function () {
                                        return stream.path;
                                    },
                                },
                            };
                            ret.parent = ret;
                            return ret;
                        },
                    };
                    return node;
                },
            },
            {},
            "/proc/self/fd"
        );
    },
    createStandardStreams: function () {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"]);
        } else {
            FS.symlink("/dev/tty", "/dev/stdin");
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"]);
        } else {
            FS.symlink("/dev/tty", "/dev/stdout");
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"]);
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr");
        }
        var stdin = FS.open("/dev/stdin", 0);
        var stdout = FS.open("/dev/stdout", 1);
        var stderr = FS.open("/dev/stderr", 1);
    },
    ensureErrnoError: function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = function (errno) {
                this.errno = errno;
            };
            this.setErrno(errno);
            this.message = "FS error";
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [44].forEach(function (code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>";
        });
    },
    staticInit: function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = { MEMFS: MEMFS, IDBFS: IDBFS };
    },
    init: function (input, output, error) {
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams();
    },
    quit: function () {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush) fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue;
            }
            FS.close(stream);
        }
    },
    getMode: function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
    },
    findObject: function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object;
        } else {
            return null;
        }
    },
    analyzePath: function (path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            path = lookup.path;
        } catch (e) {}
        var ret = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
        try {
            var lookup = FS.lookupPath(path, { parent: true });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/";
        } catch (e) {
            ret.error = e.errno;
        }
        return ret;
    },
    createPath: function (parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current);
            } catch (e) {}
            parent = current;
        }
        return current;
    },
    createFile: function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
    },
    createDataFile: function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr;
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode);
        }
        return node;
    },
    createDevice: function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: function (stream) {
                stream.seekable = false;
            },
            close: function (stream) {
                if (output && output.buffer && output.buffer.length) {
                    output(10);
                }
            },
            read: function (stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input();
                    } catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6);
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result;
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now();
                }
                return bytesRead;
            },
            write: function (stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i]);
                    } catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now();
                }
                return i;
            },
        });
        return FS.mkdev(path, mode, dev);
    },
    forceLoadFile: function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest !== "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (read_) {
            try {
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length;
            } catch (e) {
                throw new FS.ErrnoError(29);
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.");
        }
    },
    createLazyFile: function (parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = [];
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize) | 0;
            return this.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest();
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = function (from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined");
                }
                xhr.send(null);
                if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || []);
                } else {
                    return intArrayFromString(xhr.responseText || "", true);
                }
            };
            var lazyArray = this;
            lazyArray.setDataGetter(function (chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
            });
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                out("LazyFiles on gzip forces download of the whole file when length is accessed");
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        };
        if (typeof XMLHttpRequest !== "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array();
            Object.defineProperties(lazyArray, {
                length: {
                    get: function () {
                        if (!this.lengthKnown) {
                            this.cacheLength();
                        }
                        return this._length;
                    },
                },
                chunkSize: {
                    get: function () {
                        if (!this.lengthKnown) {
                            this.cacheLength();
                        }
                        return this._chunkSize;
                    },
                },
            });
            var properties = { isDevice: false, contents: lazyArray };
        } else {
            var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents;
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url;
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function () {
                    return this.contents.length;
                },
            },
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function (key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                FS.forceLoadFile(node);
                return fn.apply(null, arguments);
            };
        });
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            FS.forceLoadFile(node);
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i];
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i);
                }
            }
            return size;
        };
        node.stream_ops = stream_ops;
        return node;
    },
    createPreloadedFile: function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency("cp " + fullname);
        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish) preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
                }
                if (onload) onload();
                removeRunDependency(dep);
            }
            var handled = false;
            Module["preloadPlugins"].forEach(function (plugin) {
                if (handled) return;
                if (plugin["canHandle"](fullname)) {
                    plugin["handle"](byteArray, fullname, finish, function () {
                        if (onerror) onerror();
                        removeRunDependency(dep);
                    });
                    handled = true;
                }
            });
            if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == "string") {
            Browser.asyncLoad(
                url,
                function (byteArray) {
                    processData(byteArray);
                },
                onerror
            );
        } else {
            processData(url);
        }
    },
    indexedDB: function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    },
    DB_NAME: function () {
        return "EM_FS_" + window.location.pathname;
    },
    DB_VERSION: 20,
    DB_STORE_NAME: "FILE_DATA",
    saveFilesToDB: function (paths, onload, onerror) {
        onload = onload || function () {};
        onerror = onerror || function () {};
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
            return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            out("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;
            function finish() {
                if (fail == 0) onload();
                else onerror();
            }
            paths.forEach(function (path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() {
                    ok++;
                    if (ok + fail == total) finish();
                };
                putRequest.onerror = function putRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish();
                };
            });
            transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
    },
    loadFilesFromDB: function (paths, onload, onerror) {
        onload = onload || function () {};
        onerror = onerror || function () {};
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
            return onerror(e);
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], "readonly");
            } catch (e) {
                onerror(e);
                return;
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;
            function finish() {
                if (fail == 0) onload();
                else onerror();
            }
            paths.forEach(function (path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                    if (FS.analyzePath(path).exists) {
                        FS.unlink(path);
                    }
                    FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                    ok++;
                    if (ok + fail == total) finish();
                };
                getRequest.onerror = function getRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish();
                };
            });
            transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
    },
};
var SYSCALLS = {
    mappings: {},
    DEFAULT_POLLMASK: 5,
    umask: 511,
    calculateAt: function (dirfd, path) {
        if (path[0] !== "/") {
            var dir;
            if (dirfd === -100) {
                dir = FS.cwd();
            } else {
                var dirstream = FS.getStream(dirfd);
                if (!dirstream) throw new FS.ErrnoError(8);
                dir = dirstream.path;
            }
            path = PATH.join2(dir, path);
        }
        return path;
    },
    doStat: function (func, path, buf) {
        try {
            var stat = func(path);
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -54;
            }
            throw e;
        }
        HEAP32[buf >>> 2] = stat.dev;
        HEAP32[(buf + 4) >>> 2] = 0;
        HEAP32[(buf + 8) >>> 2] = stat.ino;
        HEAP32[(buf + 12) >>> 2] = stat.mode;
        HEAP32[(buf + 16) >>> 2] = stat.nlink;
        HEAP32[(buf + 20) >>> 2] = stat.uid;
        HEAP32[(buf + 24) >>> 2] = stat.gid;
        HEAP32[(buf + 28) >>> 2] = stat.rdev;
        HEAP32[(buf + 32) >>> 2] = 0;
        (tempI64 = [
            stat.size >>> 0,
            ((tempDouble = stat.size), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[(buf + 40) >>> 2] = tempI64[0]),
            (HEAP32[(buf + 44) >>> 2] = tempI64[1]);
        HEAP32[(buf + 48) >>> 2] = 4096;
        HEAP32[(buf + 52) >>> 2] = stat.blocks;
        HEAP32[(buf + 56) >>> 2] = (stat.atime.getTime() / 1e3) | 0;
        HEAP32[(buf + 60) >>> 2] = 0;
        HEAP32[(buf + 64) >>> 2] = (stat.mtime.getTime() / 1e3) | 0;
        HEAP32[(buf + 68) >>> 2] = 0;
        HEAP32[(buf + 72) >>> 2] = (stat.ctime.getTime() / 1e3) | 0;
        HEAP32[(buf + 76) >>> 2] = 0;
        (tempI64 = [
            stat.ino >>> 0,
            ((tempDouble = stat.ino), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[(buf + 80) >>> 2] = tempI64[0]),
            (HEAP32[(buf + 84) >>> 2] = tempI64[1]);
        return 0;
    },
    doMsync: function (addr, stream, len, flags, offset) {
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
    },
    doMkdir: function (path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0;
    },
    doMknod: function (path, mode, dev) {
        switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
                break;
            default:
                return -28;
        }
        FS.mknod(path, mode, dev);
        return 0;
    },
    doReadlink: function (path, buf, bufsize) {
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[(buf + len) >>> 0];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[(buf + len) >>> 0] = endChar;
        return len;
    },
    doAccess: function (path, amode) {
        if (amode & ~7) {
            return -28;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        if (!node) {
            return -44;
        }
        var perms = "";
        if (amode & 4) perms += "r";
        if (amode & 2) perms += "w";
        if (amode & 1) perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -2;
        }
        return 0;
    },
    doDup: function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
    },
    doReadv: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[(iov + i * 8) >>> 2];
            var len = HEAP32[(iov + (i * 8 + 4)) >>> 2];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr;
            if (curr < len) break;
        }
        return ret;
    },
    doWritev: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[(iov + i * 8) >>> 2];
            var len = HEAP32[(iov + (i * 8 + 4)) >>> 2];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr;
        }
        return ret;
    },
    varargs: undefined,
    get: function () {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(SYSCALLS.varargs - 4) >>> 2];
        return ret;
    },
    getStr: function (ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
    },
    getStreamFromFD: function (fd) {
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream;
    },
    get64: function (low, high) {
        return low;
    },
};
function ___sys__newselect(nfds, readfds, writefds, exceptfds, timeout) {
    try {
        var total = 0;
        var srcReadLow = readfds ? HEAP32[readfds >>> 2] : 0,
            srcReadHigh = readfds ? HEAP32[(readfds + 4) >>> 2] : 0;
        var srcWriteLow = writefds ? HEAP32[writefds >>> 2] : 0,
            srcWriteHigh = writefds ? HEAP32[(writefds + 4) >>> 2] : 0;
        var srcExceptLow = exceptfds ? HEAP32[exceptfds >>> 2] : 0,
            srcExceptHigh = exceptfds ? HEAP32[(exceptfds + 4) >>> 2] : 0;
        var dstReadLow = 0,
            dstReadHigh = 0;
        var dstWriteLow = 0,
            dstWriteHigh = 0;
        var dstExceptLow = 0,
            dstExceptHigh = 0;
        var allLow = (readfds ? HEAP32[readfds >>> 2] : 0) | (writefds ? HEAP32[writefds >>> 2] : 0) | (exceptfds ? HEAP32[exceptfds >>> 2] : 0);
        var allHigh = (readfds ? HEAP32[(readfds + 4) >>> 2] : 0) | (writefds ? HEAP32[(writefds + 4) >>> 2] : 0) | (exceptfds ? HEAP32[(exceptfds + 4) >>> 2] : 0);
        var check = function (fd, low, high, val) {
            return fd < 32 ? low & val : high & val;
        };
        for (var fd = 0; fd < nfds; fd++) {
            var mask = 1 << fd % 32;
            if (!check(fd, allLow, allHigh, mask)) {
                continue;
            }
            var stream = FS.getStream(fd);
            if (!stream) throw new FS.ErrnoError(8);
            var flags = SYSCALLS.DEFAULT_POLLMASK;
            if (stream.stream_ops.poll) {
                flags = stream.stream_ops.poll(stream);
            }
            if (flags & 1 && check(fd, srcReadLow, srcReadHigh, mask)) {
                fd < 32 ? (dstReadLow = dstReadLow | mask) : (dstReadHigh = dstReadHigh | mask);
                total++;
            }
            if (flags & 4 && check(fd, srcWriteLow, srcWriteHigh, mask)) {
                fd < 32 ? (dstWriteLow = dstWriteLow | mask) : (dstWriteHigh = dstWriteHigh | mask);
                total++;
            }
            if (flags & 2 && check(fd, srcExceptLow, srcExceptHigh, mask)) {
                fd < 32 ? (dstExceptLow = dstExceptLow | mask) : (dstExceptHigh = dstExceptHigh | mask);
                total++;
            }
        }
        if (readfds) {
            HEAP32[readfds >>> 2] = dstReadLow;
            HEAP32[(readfds + 4) >>> 2] = dstReadHigh;
        }
        if (writefds) {
            HEAP32[writefds >>> 2] = dstWriteLow;
            HEAP32[(writefds + 4) >>> 2] = dstWriteHigh;
        }
        if (exceptfds) {
            HEAP32[exceptfds >>> 2] = dstExceptLow;
            HEAP32[(exceptfds + 4) >>> 2] = dstExceptHigh;
        }
        return total;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_chdir(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.chdir(path);
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_dup2(oldfd, suggestFD) {
    try {
        var old = SYSCALLS.getStreamFromFD(oldfd);
        if (old.fd === suggestFD) return suggestFD;
        return SYSCALLS.doDup(old.path, old.flags, suggestFD);
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_dup3(fd, suggestFD, flags) {
    try {
        var old = SYSCALLS.getStreamFromFD(fd);
        if (old.fd === suggestFD) return -28;
        return SYSCALLS.doDup(old.path, old.flags, suggestFD);
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_fcntl64(fd, cmd, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
            case 0: {
                var arg = SYSCALLS.get();
                if (arg < 0) {
                    return -28;
                }
                var newStream;
                newStream = FS.open(stream.path, stream.flags, 0, arg);
                return newStream.fd;
            }
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4: {
                var arg = SYSCALLS.get();
                stream.flags |= arg;
                return 0;
            }
            case 12: {
                var arg = SYSCALLS.get();
                var offset = 0;
                HEAP16[(arg + offset) >>> 1] = 2;
                return 0;
            }
            case 13:
            case 14:
                return 0;
            case 16:
            case 8:
                return -28;
            case 9:
                setErrNo(28);
                return -1;
            default: {
                return -28;
            }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_getdents64(fd, dirp, count) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        if (!stream.getdents) {
            stream.getdents = FS.readdir(stream.path);
        }
        var struct_size = 280;
        var pos = 0;
        var off = FS.llseek(stream, 0, 1);
        var idx = Math.floor(off / struct_size);
        while (idx < stream.getdents.length && pos + struct_size <= count) {
            var id;
            var type;
            var name = stream.getdents[idx];
            if (name[0] === ".") {
                id = 1;
                type = 4;
            } else {
                var child = FS.lookupNode(stream.node, name);
                id = child.id;
                type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8;
            }
            (tempI64 = [
                id >>> 0,
                ((tempDouble = id), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
            ]),
                (HEAP32[(dirp + pos) >>> 2] = tempI64[0]),
                (HEAP32[(dirp + pos + 4) >>> 2] = tempI64[1]);
            (tempI64 = [
                ((idx + 1) * struct_size) >>> 0,
                ((tempDouble = (idx + 1) * struct_size),
                +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
            ]),
                (HEAP32[(dirp + pos + 8) >>> 2] = tempI64[0]),
                (HEAP32[(dirp + pos + 12) >>> 2] = tempI64[1]);
            HEAP16[(dirp + pos + 16) >>> 1] = 280;
            HEAP8[(dirp + pos + 18) >>> 0] = type;
            stringToUTF8(name, dirp + pos + 19, 256);
            pos += struct_size;
            idx += 1;
        }
        FS.llseek(stream, idx * struct_size, 0);
        return pos;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_ioctl(fd, op, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
            case 21509:
            case 21505: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21510:
            case 21511:
            case 21512:
            case 21506:
            case 21507:
            case 21508: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21519: {
                if (!stream.tty) return -59;
                var argp = SYSCALLS.get();
                HEAP32[argp >>> 2] = 0;
                return 0;
            }
            case 21520: {
                if (!stream.tty) return -59;
                return -28;
            }
            case 21531: {
                var argp = SYSCALLS.get();
                return FS.ioctl(stream, op, argp);
            }
            case 21523: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21524: {
                if (!stream.tty) return -59;
                return 0;
            }
            default:
                abort("bad ioctl syscall " + op);
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_lstat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.lstat, path, buf);
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_mkdir(path, mode) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doMkdir(path, mode);
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_open(path, flags, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var pathname = SYSCALLS.getStr(path);
        var mode = SYSCALLS.get();
        var stream = FS.open(pathname, flags, mode);
        return stream.fd;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_rename(old_path, new_path) {
    try {
        old_path = SYSCALLS.getStr(old_path);
        new_path = SYSCALLS.getStr(new_path);
        FS.rename(old_path, new_path);
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_rmdir(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.rmdir(path);
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
var ERRNO_CODES = {
    EPERM: 63,
    ENOENT: 44,
    ESRCH: 71,
    EINTR: 27,
    EIO: 29,
    ENXIO: 60,
    E2BIG: 1,
    ENOEXEC: 45,
    EBADF: 8,
    ECHILD: 12,
    EAGAIN: 6,
    EWOULDBLOCK: 6,
    ENOMEM: 48,
    EACCES: 2,
    EFAULT: 21,
    ENOTBLK: 105,
    EBUSY: 10,
    EEXIST: 20,
    EXDEV: 75,
    ENODEV: 43,
    ENOTDIR: 54,
    EISDIR: 31,
    EINVAL: 28,
    ENFILE: 41,
    EMFILE: 33,
    ENOTTY: 59,
    ETXTBSY: 74,
    EFBIG: 22,
    ENOSPC: 51,
    ESPIPE: 70,
    EROFS: 69,
    EMLINK: 34,
    EPIPE: 64,
    EDOM: 18,
    ERANGE: 68,
    ENOMSG: 49,
    EIDRM: 24,
    ECHRNG: 106,
    EL2NSYNC: 156,
    EL3HLT: 107,
    EL3RST: 108,
    ELNRNG: 109,
    EUNATCH: 110,
    ENOCSI: 111,
    EL2HLT: 112,
    EDEADLK: 16,
    ENOLCK: 46,
    EBADE: 113,
    EBADR: 114,
    EXFULL: 115,
    ENOANO: 104,
    EBADRQC: 103,
    EBADSLT: 102,
    EDEADLOCK: 16,
    EBFONT: 101,
    ENOSTR: 100,
    ENODATA: 116,
    ETIME: 117,
    ENOSR: 118,
    ENONET: 119,
    ENOPKG: 120,
    EREMOTE: 121,
    ENOLINK: 47,
    EADV: 122,
    ESRMNT: 123,
    ECOMM: 124,
    EPROTO: 65,
    EMULTIHOP: 36,
    EDOTDOT: 125,
    EBADMSG: 9,
    ENOTUNIQ: 126,
    EBADFD: 127,
    EREMCHG: 128,
    ELIBACC: 129,
    ELIBBAD: 130,
    ELIBSCN: 131,
    ELIBMAX: 132,
    ELIBEXEC: 133,
    ENOSYS: 52,
    ENOTEMPTY: 55,
    ENAMETOOLONG: 37,
    ELOOP: 32,
    EOPNOTSUPP: 138,
    EPFNOSUPPORT: 139,
    ECONNRESET: 15,
    ENOBUFS: 42,
    EAFNOSUPPORT: 5,
    EPROTOTYPE: 67,
    ENOTSOCK: 57,
    ENOPROTOOPT: 50,
    ESHUTDOWN: 140,
    ECONNREFUSED: 14,
    EADDRINUSE: 3,
    ECONNABORTED: 13,
    ENETUNREACH: 40,
    ENETDOWN: 38,
    ETIMEDOUT: 73,
    EHOSTDOWN: 142,
    EHOSTUNREACH: 23,
    EINPROGRESS: 26,
    EALREADY: 7,
    EDESTADDRREQ: 17,
    EMSGSIZE: 35,
    EPROTONOSUPPORT: 66,
    ESOCKTNOSUPPORT: 137,
    EADDRNOTAVAIL: 4,
    ENETRESET: 39,
    EISCONN: 30,
    ENOTCONN: 53,
    ETOOMANYREFS: 141,
    EUSERS: 136,
    EDQUOT: 19,
    ESTALE: 72,
    ENOTSUP: 138,
    ENOMEDIUM: 148,
    EILSEQ: 25,
    EOVERFLOW: 61,
    ECANCELED: 11,
    ENOTRECOVERABLE: 56,
    EOWNERDEAD: 62,
    ESTRPIPE: 135,
};
var SOCKFS = {
    mount: function (mount) {
        Module["websocket"] = Module["websocket"] && "object" === typeof Module["websocket"] ? Module["websocket"] : {};
        Module["websocket"]._callbacks = {};
        Module["websocket"]["on"] = function (event, callback) {
            if ("function" === typeof callback) {
                this._callbacks[event] = callback;
            }
            return this;
        };
        Module["websocket"].emit = function (event, param) {
            if ("function" === typeof this._callbacks[event]) {
                this._callbacks[event].call(this, param);
            }
        };
        return FS.createNode(null, "/", 16384 | 511, 0);
    },
    createSocket: function (family, type, protocol) {
        type &= ~526336;
        var streaming = type == 1;
        if (protocol) {
            assert(streaming == (protocol == 6));
        }
        var sock = { family: family, type: type, protocol: protocol, server: null, error: null, peers: {}, pending: [], recv_queue: [], sock_ops: SOCKFS.websocket_sock_ops };
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        var stream = FS.createStream({ path: name, node: node, flags: 2, seekable: false, stream_ops: SOCKFS.stream_ops });
        sock.stream = stream;
        return sock;
    },
    getSocket: function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
            return null;
        }
        return stream.node.sock;
    },
    stream_ops: {
        poll: function (stream) {
            var sock = stream.node.sock;
            return sock.sock_ops.poll(sock);
        },
        ioctl: function (stream, request, varargs) {
            var sock = stream.node.sock;
            return sock.sock_ops.ioctl(sock, request, varargs);
        },
        read: function (stream, buffer, offset, length, position) {
            var sock = stream.node.sock;
            var msg = sock.sock_ops.recvmsg(sock, length);
            if (!msg) {
                return 0;
            }
            buffer.set(msg.buffer, offset);
            return msg.buffer.length;
        },
        write: function (stream, buffer, offset, length, position) {
            var sock = stream.node.sock;
            return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },
        close: function (stream) {
            var sock = stream.node.sock;
            sock.sock_ops.close(sock);
        },
    },
    nextname: function () {
        if (!SOCKFS.nextname.current) {
            SOCKFS.nextname.current = 0;
        }
        return "socket[" + SOCKFS.nextname.current++ + "]";
    },
    websocket_sock_ops: {
        createPeer: function (sock, addr, port) {
            var ws;
            if (typeof addr === "object") {
                ws = addr;
                addr = null;
                port = null;
            }
            if (ws) {
                if (ws._socket) {
                    addr = ws._socket.remoteAddress;
                    port = ws._socket.remotePort;
                } else {
                    var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
                    if (!result) {
                        throw new Error("WebSocket URL must be in the format ws(s)://address:port");
                    }
                    addr = result[1];
                    port = parseInt(result[2], 10);
                }
            } else {
                try {
                    var runtimeConfig = Module["websocket"] && "object" === typeof Module["websocket"];
                    var url = "ws:#".replace("#", "//");
                    if (runtimeConfig) {
                        if ("string" === typeof Module["websocket"]["url"]) {
                            url = Module["websocket"]["url"];
                        }
                    }
                    if (url === "ws://" || url === "wss://") {
                        var parts = addr.split("/");
                        url = url + parts[0] + ":" + port + "/" + parts.slice(1).join("/");
                    }
                    var subProtocols = "binary";
                    if (runtimeConfig) {
                        if ("string" === typeof Module["websocket"]["subprotocol"]) {
                            subProtocols = Module["websocket"]["subprotocol"];
                        }
                    }
                    var opts = undefined;
                    if (subProtocols !== "null") {
                        subProtocols = subProtocols.replace(/^ +| +$/g, "").split(/ *, */);
                        opts = ENVIRONMENT_IS_NODE ? { protocol: subProtocols.toString() } : subProtocols;
                    }
                    if (runtimeConfig && null === Module["websocket"]["subprotocol"]) {
                        subProtocols = "null";
                        opts = undefined;
                    }
                    var WebSocketConstructor;
                    if (ENVIRONMENT_IS_NODE) {
                        WebSocketConstructor = require("ws");
                    } else {
                        WebSocketConstructor = WebSocket;
                    }
                    ws = new WebSocketConstructor(url, opts);
                    ws.binaryType = "arraybuffer";
                } catch (e) {
                    throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
                }
            }
            var peer = { addr: addr, port: port, socket: ws, dgram_send_queue: [] };
            SOCKFS.websocket_sock_ops.addPeer(sock, peer);
            SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
            if (sock.type === 2 && typeof sock.sport !== "undefined") {
                peer.dgram_send_queue.push(new Uint8Array([255, 255, 255, 255, "p".charCodeAt(0), "o".charCodeAt(0), "r".charCodeAt(0), "t".charCodeAt(0), (sock.sport & 65280) >> 8, sock.sport & 255]));
            }
            return peer;
        },
        getPeer: function (sock, addr, port) {
            return sock.peers[addr + ":" + port];
        },
        addPeer: function (sock, peer) {
            sock.peers[peer.addr + ":" + peer.port] = peer;
        },
        removePeer: function (sock, peer) {
            delete sock.peers[peer.addr + ":" + peer.port];
        },
        handlePeerEvents: function (sock, peer) {
            var first = true;
            var handleOpen = function () {
                Module["websocket"].emit("open", sock.stream.fd);
                try {
                    var queued = peer.dgram_send_queue.shift();
                    while (queued) {
                        peer.socket.send(queued);
                        queued = peer.dgram_send_queue.shift();
                    }
                } catch (e) {
                    peer.socket.close();
                }
            };
            function handleMessage(data) {
                if (typeof data === "string") {
                    var encoder = new TextEncoder();
                    data = encoder.encode(data);
                } else {
                    assert(data.byteLength !== undefined);
                    if (data.byteLength == 0) {
                        return;
                    } else {
                        data = new Uint8Array(data);
                    }
                }
                var wasfirst = first;
                first = false;
                if (
                    wasfirst &&
                    data.length === 10 &&
                    data[0] === 255 &&
                    data[1] === 255 &&
                    data[2] === 255 &&
                    data[3] === 255 &&
                    data[4] === "p".charCodeAt(0) &&
                    data[5] === "o".charCodeAt(0) &&
                    data[6] === "r".charCodeAt(0) &&
                    data[7] === "t".charCodeAt(0)
                ) {
                    var newport = (data[8] << 8) | data[9];
                    SOCKFS.websocket_sock_ops.removePeer(sock, peer);
                    peer.port = newport;
                    SOCKFS.websocket_sock_ops.addPeer(sock, peer);
                    return;
                }
                sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
                Module["websocket"].emit("message", sock.stream.fd);
            }
            if (ENVIRONMENT_IS_NODE) {
                peer.socket.on("open", handleOpen);
                peer.socket.on("message", function (data, flags) {
                    if (!flags.binary) {
                        return;
                    }
                    handleMessage(new Uint8Array(data).buffer);
                });
                peer.socket.on("close", function () {
                    Module["websocket"].emit("close", sock.stream.fd);
                });
                peer.socket.on("error", function (error) {
                    sock.error = ERRNO_CODES.ECONNREFUSED;
                    Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"]);
                });
            } else {
                peer.socket.onopen = handleOpen;
                peer.socket.onclose = function () {
                    Module["websocket"].emit("close", sock.stream.fd);
                };
                peer.socket.onmessage = function peer_socket_onmessage(event) {
                    handleMessage(event.data);
                };
                peer.socket.onerror = function (error) {
                    sock.error = ERRNO_CODES.ECONNREFUSED;
                    Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"]);
                };
            }
        },
        poll: function (sock) {
            if (sock.type === 1 && sock.server) {
                return sock.pending.length ? 64 | 1 : 0;
            }
            var mask = 0;
            var dest = sock.type === 1 ? SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) : null;
            if (sock.recv_queue.length || !dest || (dest && dest.socket.readyState === dest.socket.CLOSING) || (dest && dest.socket.readyState === dest.socket.CLOSED)) {
                mask |= 64 | 1;
            }
            if (!dest || (dest && dest.socket.readyState === dest.socket.OPEN)) {
                mask |= 4;
            }
            if ((dest && dest.socket.readyState === dest.socket.CLOSING) || (dest && dest.socket.readyState === dest.socket.CLOSED)) {
                mask |= 16;
            }
            return mask;
        },
        ioctl: function (sock, request, arg) {
            switch (request) {
                case 21531:
                    var bytes = 0;
                    if (sock.recv_queue.length) {
                        bytes = sock.recv_queue[0].data.length;
                    }
                    HEAP32[arg >>> 2] = bytes;
                    return 0;
                default:
                    return ERRNO_CODES.EINVAL;
            }
        },
        close: function (sock) {
            if (sock.server) {
                try {
                    sock.server.close();
                } catch (e) {}
                sock.server = null;
            }
            var peers = Object.keys(sock.peers);
            for (var i = 0; i < peers.length; i++) {
                var peer = sock.peers[peers[i]];
                try {
                    peer.socket.close();
                } catch (e) {}
                SOCKFS.websocket_sock_ops.removePeer(sock, peer);
            }
            return 0;
        },
        bind: function (sock, addr, port) {
            if (typeof sock.saddr !== "undefined" || typeof sock.sport !== "undefined") {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
            sock.saddr = addr;
            sock.sport = port;
            if (sock.type === 2) {
                if (sock.server) {
                    sock.server.close();
                    sock.server = null;
                }
                try {
                    sock.sock_ops.listen(sock, 0);
                } catch (e) {
                    if (!(e instanceof FS.ErrnoError)) throw e;
                    if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
                }
            }
        },
        connect: function (sock, addr, port) {
            if (sock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
            }
            if (typeof sock.daddr !== "undefined" && typeof sock.dport !== "undefined") {
                var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
                if (dest) {
                    if (dest.socket.readyState === dest.socket.CONNECTING) {
                        throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
                    } else {
                        throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
                    }
                }
            }
            var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
            sock.daddr = peer.addr;
            sock.dport = peer.port;
            throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },
        listen: function (sock, backlog) {
            if (!ENVIRONMENT_IS_NODE) {
                throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
            }
            if (sock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
            var WebSocketServer = require("ws").Server;
            var host = sock.saddr;
            sock.server = new WebSocketServer({ host: host, port: sock.sport });
            Module["websocket"].emit("listen", sock.stream.fd);
            sock.server.on("connection", function (ws) {
                if (sock.type === 1) {
                    var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
                    var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
                    newsock.daddr = peer.addr;
                    newsock.dport = peer.port;
                    sock.pending.push(newsock);
                    Module["websocket"].emit("connection", newsock.stream.fd);
                } else {
                    SOCKFS.websocket_sock_ops.createPeer(sock, ws);
                    Module["websocket"].emit("connection", sock.stream.fd);
                }
            });
            sock.server.on("closed", function () {
                Module["websocket"].emit("close", sock.stream.fd);
                sock.server = null;
            });
            sock.server.on("error", function (error) {
                sock.error = ERRNO_CODES.EHOSTUNREACH;
                Module["websocket"].emit("error", [sock.stream.fd, sock.error, "EHOSTUNREACH: Host is unreachable"]);
            });
        },
        accept: function (listensock) {
            if (!listensock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
            var newsock = listensock.pending.shift();
            newsock.stream.flags = listensock.stream.flags;
            return newsock;
        },
        getname: function (sock, peer) {
            var addr, port;
            if (peer) {
                if (sock.daddr === undefined || sock.dport === undefined) {
                    throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
                }
                addr = sock.daddr;
                port = sock.dport;
            } else {
                addr = sock.saddr || 0;
                port = sock.sport || 0;
            }
            return { addr: addr, port: port };
        },
        sendmsg: function (sock, buffer, offset, length, addr, port) {
            if (sock.type === 2) {
                if (addr === undefined || port === undefined) {
                    addr = sock.daddr;
                    port = sock.dport;
                }
                if (addr === undefined || port === undefined) {
                    throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
                }
            } else {
                addr = sock.daddr;
                port = sock.dport;
            }
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
            if (sock.type === 1) {
                if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                    throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
                } else if (dest.socket.readyState === dest.socket.CONNECTING) {
                    throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
                }
            }
            if (ArrayBuffer.isView(buffer)) {
                offset += buffer.byteOffset;
                buffer = buffer.buffer;
            }
            var data;
            data = buffer.slice(offset, offset + length);
            if (sock.type === 2) {
                if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
                    if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                        dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
                    }
                    dest.dgram_send_queue.push(data);
                    return length;
                }
            }
            try {
                dest.socket.send(data);
                return length;
            } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
        },
        recvmsg: function (sock, length) {
            if (sock.type === 1 && sock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            var queued = sock.recv_queue.shift();
            if (!queued) {
                if (sock.type === 1) {
                    var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
                    if (!dest) {
                        throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
                    } else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                        return null;
                    } else {
                        throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
                    }
                } else {
                    throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
                }
            }
            var queuedLength = queued.data.byteLength || queued.data.length;
            var queuedOffset = queued.data.byteOffset || 0;
            var queuedBuffer = queued.data.buffer || queued.data;
            var bytesRead = Math.min(length, queuedLength);
            var res = { buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead), addr: queued.addr, port: queued.port };
            if (sock.type === 1 && bytesRead < queuedLength) {
                var bytesRemaining = queuedLength - bytesRead;
                queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
                sock.recv_queue.unshift(queued);
            }
            return res;
        },
    },
};
function __inet_pton4_raw(str) {
    var b = str.split(".");
    for (var i = 0; i < 4; i++) {
        var tmp = Number(b[i]);
        if (isNaN(tmp)) return null;
        b[i] = tmp;
    }
    return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
}
function jstoi_q(str) {
    return parseInt(str);
}
function __inet_pton6_raw(str) {
    var words;
    var w, offset, z;
    var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
    var parts = [];
    if (!valid6regx.test(str)) {
        return null;
    }
    if (str === "::") {
        return [0, 0, 0, 0, 0, 0, 0, 0];
    }
    if (str.indexOf("::") === 0) {
        str = str.replace("::", "Z:");
    } else {
        str = str.replace("::", ":Z:");
    }
    if (str.indexOf(".") > 0) {
        str = str.replace(new RegExp("[.]", "g"), ":");
        words = str.split(":");
        words[words.length - 4] = jstoi_q(words[words.length - 4]) + jstoi_q(words[words.length - 3]) * 256;
        words[words.length - 3] = jstoi_q(words[words.length - 2]) + jstoi_q(words[words.length - 1]) * 256;
        words = words.slice(0, words.length - 2);
    } else {
        words = str.split(":");
    }
    offset = 0;
    z = 0;
    for (w = 0; w < words.length; w++) {
        if (typeof words[w] === "string") {
            if (words[w] === "Z") {
                for (z = 0; z < 8 - words.length + 1; z++) {
                    parts[w + z] = 0;
                }
                offset = z - 1;
            } else {
                parts[w + offset] = _htons(parseInt(words[w], 16));
            }
        } else {
            parts[w + offset] = words[w];
        }
    }
    return [(parts[1] << 16) | parts[0], (parts[3] << 16) | parts[2], (parts[5] << 16) | parts[4], (parts[7] << 16) | parts[6]];
}
var DNS = {
    address_map: { id: 1, addrs: {}, names: {} },
    lookup_name: function (name) {
        var res = __inet_pton4_raw(name);
        if (res !== null) {
            return name;
        }
        res = __inet_pton6_raw(name);
        if (res !== null) {
            return name;
        }
        var addr;
        if (DNS.address_map.addrs[name]) {
            addr = DNS.address_map.addrs[name];
        } else {
            var id = DNS.address_map.id++;
            assert(id < 65535, "exceeded max address mappings of 65535");
            addr = "172.29." + (id & 255) + "." + (id & 65280);
            DNS.address_map.names[addr] = name;
            DNS.address_map.addrs[name] = addr;
        }
        return addr;
    },
    lookup_addr: function (addr) {
        if (DNS.address_map.names[addr]) {
            return DNS.address_map.names[addr];
        }
        return null;
    },
};
function __inet_ntop4_raw(addr) {
    return (addr & 255) + "." + ((addr >> 8) & 255) + "." + ((addr >> 16) & 255) + "." + ((addr >> 24) & 255);
}
function __inet_ntop6_raw(ints) {
    var str = "";
    var word = 0;
    var longest = 0;
    var lastzero = 0;
    var zstart = 0;
    var len = 0;
    var i = 0;
    var parts = [ints[0] & 65535, ints[0] >> 16, ints[1] & 65535, ints[1] >> 16, ints[2] & 65535, ints[2] >> 16, ints[3] & 65535, ints[3] >> 16];
    var hasipv4 = true;
    var v4part = "";
    for (i = 0; i < 5; i++) {
        if (parts[i] !== 0) {
            hasipv4 = false;
            break;
        }
    }
    if (hasipv4) {
        v4part = __inet_ntop4_raw(parts[6] | (parts[7] << 16));
        if (parts[5] === -1) {
            str = "::ffff:";
            str += v4part;
            return str;
        }
        if (parts[5] === 0) {
            str = "::";
            if (v4part === "0.0.0.0") v4part = "";
            if (v4part === "0.0.0.1") v4part = "1";
            str += v4part;
            return str;
        }
    }
    for (word = 0; word < 8; word++) {
        if (parts[word] === 0) {
            if (word - lastzero > 1) {
                len = 0;
            }
            lastzero = word;
            len++;
        }
        if (len > longest) {
            longest = len;
            zstart = word - longest + 1;
        }
    }
    for (word = 0; word < 8; word++) {
        if (longest > 1) {
            if (parts[word] === 0 && word >= zstart && word < zstart + longest) {
                if (word === zstart) {
                    str += ":";
                    if (zstart === 0) str += ":";
                }
                continue;
            }
        }
        str += Number(_ntohs(parts[word] & 65535)).toString(16);
        str += word < 7 ? ":" : "";
    }
    return str;
}
function __read_sockaddr(sa, salen) {
    var family = HEAP16[sa >>> 1];
    var port = _ntohs(HEAPU16[(sa + 2) >>> 1]);
    var addr;
    switch (family) {
        case 2:
            if (salen !== 16) {
                return { errno: 28 };
            }
            addr = HEAP32[(sa + 4) >>> 2];
            addr = __inet_ntop4_raw(addr);
            break;
        case 10:
            if (salen !== 28) {
                return { errno: 28 };
            }
            addr = [HEAP32[(sa + 8) >>> 2], HEAP32[(sa + 12) >>> 2], HEAP32[(sa + 16) >>> 2], HEAP32[(sa + 20) >>> 2]];
            addr = __inet_ntop6_raw(addr);
            break;
        default:
            return { errno: 5 };
    }
    return { family: family, addr: addr, port: port };
}
function __write_sockaddr(sa, family, addr, port) {
    switch (family) {
        case 2:
            addr = __inet_pton4_raw(addr);
            HEAP16[sa >>> 1] = family;
            HEAP32[(sa + 4) >>> 2] = addr;
            HEAP16[(sa + 2) >>> 1] = _htons(port);
            break;
        case 10:
            addr = __inet_pton6_raw(addr);
            HEAP32[sa >>> 2] = family;
            HEAP32[(sa + 8) >>> 2] = addr[0];
            HEAP32[(sa + 12) >>> 2] = addr[1];
            HEAP32[(sa + 16) >>> 2] = addr[2];
            HEAP32[(sa + 20) >>> 2] = addr[3];
            HEAP16[(sa + 2) >>> 1] = _htons(port);
            HEAP32[(sa + 4) >>> 2] = 0;
            HEAP32[(sa + 24) >>> 2] = 0;
            break;
        default:
            return { errno: 5 };
    }
    return {};
}
function ___sys_socketcall(call, socketvararg) {
    try {
        SYSCALLS.varargs = socketvararg;
        var getSocketFromFD = function () {
            var socket = SOCKFS.getSocket(SYSCALLS.get());
            if (!socket) throw new FS.ErrnoError(8);
            return socket;
        };
        var getSocketAddress = function (allowNull) {
            var addrp = SYSCALLS.get(),
                addrlen = SYSCALLS.get();
            if (allowNull && addrp === 0) return null;
            var info = __read_sockaddr(addrp, addrlen);
            if (info.errno) throw new FS.ErrnoError(info.errno);
            info.addr = DNS.lookup_addr(info.addr) || info.addr;
            return info;
        };
        switch (call) {
            case 1: {
                var domain = SYSCALLS.get(),
                    type = SYSCALLS.get(),
                    protocol = SYSCALLS.get();
                var sock = SOCKFS.createSocket(domain, type, protocol);
                return sock.stream.fd;
            }
            case 2: {
                var sock = getSocketFromFD(),
                    info = getSocketAddress();
                sock.sock_ops.bind(sock, info.addr, info.port);
                return 0;
            }
            case 3: {
                var sock = getSocketFromFD(),
                    info = getSocketAddress();
                sock.sock_ops.connect(sock, info.addr, info.port);
                return 0;
            }
            case 4: {
                var sock = getSocketFromFD(),
                    backlog = SYSCALLS.get();
                sock.sock_ops.listen(sock, backlog);
                return 0;
            }
            case 5: {
                var sock = getSocketFromFD(),
                    addr = SYSCALLS.get(),
                    addrlen = SYSCALLS.get();
                var newsock = sock.sock_ops.accept(sock);
                if (addr) {
                    var res = __write_sockaddr(addr, newsock.family, DNS.lookup_name(newsock.daddr), newsock.dport);
                }
                return newsock.stream.fd;
            }
            case 6: {
                var sock = getSocketFromFD(),
                    addr = SYSCALLS.get(),
                    addrlen = SYSCALLS.get();
                var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(sock.saddr || "0.0.0.0"), sock.sport);
                return 0;
            }
            case 7: {
                var sock = getSocketFromFD(),
                    addr = SYSCALLS.get(),
                    addrlen = SYSCALLS.get();
                if (!sock.daddr) {
                    return -53;
                }
                var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(sock.daddr), sock.dport);
                return 0;
            }
            case 11: {
                var sock = getSocketFromFD(),
                    message = SYSCALLS.get(),
                    length = SYSCALLS.get(),
                    flags = SYSCALLS.get(),
                    dest = getSocketAddress(true);
                if (!dest) {
                    return FS.write(sock.stream, HEAP8, message, length);
                } else {
                    return sock.sock_ops.sendmsg(sock, HEAP8, message, length, dest.addr, dest.port);
                }
            }
            case 12: {
                var sock = getSocketFromFD(),
                    buf = SYSCALLS.get(),
                    len = SYSCALLS.get(),
                    flags = SYSCALLS.get(),
                    addr = SYSCALLS.get(),
                    addrlen = SYSCALLS.get();
                var msg = sock.sock_ops.recvmsg(sock, len);
                if (!msg) return 0;
                if (addr) {
                    var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port);
                }
                HEAPU8.set(msg.buffer, buf >>> 0);
                return msg.buffer.byteLength;
            }
            case 14: {
                return -50;
            }
            case 15: {
                var sock = getSocketFromFD(),
                    level = SYSCALLS.get(),
                    optname = SYSCALLS.get(),
                    optval = SYSCALLS.get(),
                    optlen = SYSCALLS.get();
                if (level === 1) {
                    if (optname === 4) {
                        HEAP32[optval >>> 2] = sock.error;
                        HEAP32[optlen >>> 2] = 4;
                        sock.error = null;
                        return 0;
                    }
                }
                return -50;
            }
            case 16: {
                var sock = getSocketFromFD(),
                    message = SYSCALLS.get(),
                    flags = SYSCALLS.get();
                var iov = HEAP32[(message + 8) >>> 2];
                var num = HEAP32[(message + 12) >>> 2];
                var addr, port;
                var name = HEAP32[message >>> 2];
                var namelen = HEAP32[(message + 4) >>> 2];
                if (name) {
                    var info = __read_sockaddr(name, namelen);
                    if (info.errno) return -info.errno;
                    port = info.port;
                    addr = DNS.lookup_addr(info.addr) || info.addr;
                }
                var total = 0;
                for (var i = 0; i < num; i++) {
                    total += HEAP32[(iov + (8 * i + 4)) >>> 2];
                }
                var view = new Uint8Array(total);
                var offset = 0;
                for (var i = 0; i < num; i++) {
                    var iovbase = HEAP32[(iov + (8 * i + 0)) >>> 2];
                    var iovlen = HEAP32[(iov + (8 * i + 4)) >>> 2];
                    for (var j = 0; j < iovlen; j++) {
                        view[offset++] = HEAP8[(iovbase + j) >>> 0];
                    }
                }
                return sock.sock_ops.sendmsg(sock, view, 0, total, addr, port);
            }
            case 17: {
                var sock = getSocketFromFD(),
                    message = SYSCALLS.get(),
                    flags = SYSCALLS.get();
                var iov = HEAP32[(message + 8) >>> 2];
                var num = HEAP32[(message + 12) >>> 2];
                var total = 0;
                for (var i = 0; i < num; i++) {
                    total += HEAP32[(iov + (8 * i + 4)) >>> 2];
                }
                var msg = sock.sock_ops.recvmsg(sock, total);
                if (!msg) return 0;
                var name = HEAP32[message >>> 2];
                if (name) {
                    var res = __write_sockaddr(name, sock.family, DNS.lookup_name(msg.addr), msg.port);
                }
                var bytesRead = 0;
                var bytesRemaining = msg.buffer.byteLength;
                for (var i = 0; bytesRemaining > 0 && i < num; i++) {
                    var iovbase = HEAP32[(iov + (8 * i + 0)) >>> 2];
                    var iovlen = HEAP32[(iov + (8 * i + 4)) >>> 2];
                    if (!iovlen) {
                        continue;
                    }
                    var length = Math.min(iovlen, bytesRemaining);
                    var buf = msg.buffer.subarray(bytesRead, bytesRead + length);
                    HEAPU8.set(buf, (iovbase + bytesRead) >>> 0);
                    bytesRead += length;
                    bytesRemaining -= length;
                }
                return bytesRead;
            }
            default: {
                return -52;
            }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_stat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.stat, path, buf);
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function ___sys_unlink(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.unlink(path);
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
    }
}
function _abort() {
    abort();
}
function _emscripten_set_main_loop_timing(mode, value) {
    Browser.mainLoop.timingMode = mode;
    Browser.mainLoop.timingValue = value;
    if (!Browser.mainLoop.func) {
        return 1;
    }
    if (mode == 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
            var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
            setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
        };
        Browser.mainLoop.method = "timeout";
    } else if (mode == 1) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
            Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = "rAF";
    } else if (mode == 2) {
        if (typeof setImmediate === "undefined") {
            var setImmediates = [];
            var emscriptenMainLoopMessageId = "setimmediate";
            var Browser_setImmediate_messageHandler = function (event) {
                if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
                    event.stopPropagation();
                    setImmediates.shift()();
                }
            };
            addEventListener("message", Browser_setImmediate_messageHandler, true);
            setImmediate = function Browser_emulated_setImmediate(func) {
                setImmediates.push(func);
                if (ENVIRONMENT_IS_WORKER) {
                    if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
                    Module["setImmediates"].push(func);
                    postMessage({ target: emscriptenMainLoopMessageId });
                } else postMessage(emscriptenMainLoopMessageId, "*");
            };
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
            setImmediate(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = "immediate";
    }
    return 0;
}
function setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) {
    noExitRuntime = true;
    assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
    Browser.mainLoop.func = browserIterationFunc;
    Browser.mainLoop.arg = arg;
    var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
    Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
            var start = Date.now();
            var blocker = Browser.mainLoop.queue.shift();
            blocker.func(blocker.arg);
            if (Browser.mainLoop.remainingBlockers) {
                var remaining = Browser.mainLoop.remainingBlockers;
                var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                if (blocker.counted) {
                    Browser.mainLoop.remainingBlockers = next;
                } else {
                    next = next + 0.5;
                    Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
                }
            }
            console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
            Browser.mainLoop.updateStatus();
            if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
            setTimeout(Browser.mainLoop.runner, 0);
            return;
        }
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
        Browser.mainLoop.currentFrameNumber = (Browser.mainLoop.currentFrameNumber + 1) | 0;
        if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
            Browser.mainLoop.scheduler();
            return;
        } else if (Browser.mainLoop.timingMode == 0) {
            Browser.mainLoop.tickStartTime = _emscripten_get_now();
        }
        Browser.mainLoop.runIter(browserIterationFunc);
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
        if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
        Browser.mainLoop.scheduler();
    };
    if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps);
        else _emscripten_set_main_loop_timing(1, 1);
        Browser.mainLoop.scheduler();
    }
    if (simulateInfiniteLoop) {
        throw "unwind";
    }
}
var Browser = {
    mainLoop: {
        scheduler: null,
        method: "",
        currentlyRunningMainloop: 0,
        func: null,
        arg: 0,
        timingMode: 0,
        timingValue: 0,
        currentFrameNumber: 0,
        queue: [],
        pause: function () {
            Browser.mainLoop.scheduler = null;
            Browser.mainLoop.currentlyRunningMainloop++;
        },
        resume: function () {
            Browser.mainLoop.currentlyRunningMainloop++;
            var timingMode = Browser.mainLoop.timingMode;
            var timingValue = Browser.mainLoop.timingValue;
            var func = Browser.mainLoop.func;
            Browser.mainLoop.func = null;
            setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
            _emscripten_set_main_loop_timing(timingMode, timingValue);
            Browser.mainLoop.scheduler();
        },
        updateStatus: function () {
            if (Module["setStatus"]) {
                var message = Module["statusMessage"] || "Please wait...";
                var remaining = Browser.mainLoop.remainingBlockers;
                var expected = Browser.mainLoop.expectedBlockers;
                if (remaining) {
                    if (remaining < expected) {
                        Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
                    } else {
                        Module["setStatus"](message);
                    }
                } else {
                    Module["setStatus"]("");
                }
            }
        },
        runIter: function (func) {
            if (ABORT) return;
            if (Module["preMainLoop"]) {
                var preRet = Module["preMainLoop"]();
                if (preRet === false) {
                    return;
                }
            }
            try {
                func();
            } catch (e) {
                if (e instanceof ExitStatus) {
                    return;
                } else if (e == "unwind") {
                    return;
                } else {
                    if (e && typeof e === "object" && e.stack) err("exception thrown: " + [e, e.stack]);
                    throw e;
                }
            }
            if (Module["postMainLoop"]) Module["postMainLoop"]();
        },
    },
    isFullscreen: false,
    pointerLock: false,
    moduleContextCreatedCallbacks: [],
    workers: [],
    init: function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        if (Browser.initted) return;
        Browser.initted = true;
        try {
            new Blob();
            Browser.hasBlobConstructor = true;
        } catch (e) {
            Browser.hasBlobConstructor = false;
            console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
            console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
            Module.noImageDecoding = true;
        }
        var imagePlugin = {};
        imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
            return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
            var b = null;
            if (Browser.hasBlobConstructor) {
                try {
                    b = new Blob([byteArray], { type: Browser.getMimetype(name) });
                    if (b.size !== byteArray.length) {
                        b = new Blob([new Uint8Array(byteArray).buffer], { type: Browser.getMimetype(name) });
                    }
                } catch (e) {
                    warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder");
                }
            }
            if (!b) {
                var bb = new Browser.BlobBuilder();
                bb.append(new Uint8Array(byteArray).buffer);
                b = bb.getBlob();
            }
            var url = Browser.URLObject.createObjectURL(b);
            var img = new Image();
            img.onload = function img_onload() {
                assert(img.complete, "Image " + name + " could not be decoded");
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                Module["preloadedImages"][name] = canvas;
                Browser.URLObject.revokeObjectURL(url);
                if (onload) onload(byteArray);
            };
            img.onerror = function img_onerror(event) {
                console.log("Image " + url + " could not be decoded");
                if (onerror) onerror();
            };
            img.src = url;
        };
        Module["preloadPlugins"].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
            return !Module.noAudioDecoding && name.substr(-4) in { ".ogg": 1, ".wav": 1, ".mp3": 1 };
        };
        audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
            var done = false;
            function finish(audio) {
                if (done) return;
                done = true;
                Module["preloadedAudios"][name] = audio;
                if (onload) onload(byteArray);
            }
            function fail() {
                if (done) return;
                done = true;
                Module["preloadedAudios"][name] = new Audio();
                if (onerror) onerror();
            }
            if (Browser.hasBlobConstructor) {
                try {
                    var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
                } catch (e) {
                    return fail();
                }
                var url = Browser.URLObject.createObjectURL(b);
                var audio = new Audio();
                audio.addEventListener(
                    "canplaythrough",
                    function () {
                        finish(audio);
                    },
                    false
                );
                audio.onerror = function audio_onerror(event) {
                    if (done) return;
                    console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
                    function encode64(data) {
                        var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                        var PAD = "=";
                        var ret = "";
                        var leftchar = 0;
                        var leftbits = 0;
                        for (var i = 0; i < data.length; i++) {
                            leftchar = (leftchar << 8) | data[i];
                            leftbits += 8;
                            while (leftbits >= 6) {
                                var curr = (leftchar >> (leftbits - 6)) & 63;
                                leftbits -= 6;
                                ret += BASE[curr];
                            }
                        }
                        if (leftbits == 2) {
                            ret += BASE[(leftchar & 3) << 4];
                            ret += PAD + PAD;
                        } else if (leftbits == 4) {
                            ret += BASE[(leftchar & 15) << 2];
                            ret += PAD;
                        }
                        return ret;
                    }
                    audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
                    finish(audio);
                };
                audio.src = url;
                Browser.safeSetTimeout(function () {
                    finish(audio);
                }, 1e4);
            } else {
                return fail();
            }
        };
        Module["preloadPlugins"].push(audioPlugin);
        function pointerLockChange() {
            Browser.pointerLock =
                document["pointerLockElement"] === Module["canvas"] ||
                document["mozPointerLockElement"] === Module["canvas"] ||
                document["webkitPointerLockElement"] === Module["canvas"] ||
                document["msPointerLockElement"] === Module["canvas"];
        }
        var canvas = Module["canvas"];
        if (canvas) {
            canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || function () {};
            canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || function () {};
            canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
            document.addEventListener("pointerlockchange", pointerLockChange, false);
            document.addEventListener("mozpointerlockchange", pointerLockChange, false);
            document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
            document.addEventListener("mspointerlockchange", pointerLockChange, false);
            if (Module["elementPointerLock"]) {
                canvas.addEventListener(
                    "click",
                    function (ev) {
                        if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
                            Module["canvas"].requestPointerLock();
                            ev.preventDefault();
                        }
                    },
                    false
                );
            }
        }
    },
    createContext: function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
        var ctx;
        var contextHandle;
        if (useWebGL) {
            var contextAttributes = { antialias: false, alpha: false, majorVersion: 1 };
            if (webGLContextAttributes) {
                for (var attribute in webGLContextAttributes) {
                    contextAttributes[attribute] = webGLContextAttributes[attribute];
                }
            }
            if (typeof GL !== "undefined") {
                contextHandle = GL.createContext(canvas, contextAttributes);
                if (contextHandle) {
                    ctx = GL.getContext(contextHandle).GLctx;
                }
            }
        } else {
            ctx = canvas.getContext("2d");
        }
        if (!ctx) return null;
        if (setInModule) {
            if (!useWebGL) assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
            Module.ctx = ctx;
            if (useWebGL) GL.makeContextCurrent(contextHandle);
            Module.useWebGL = useWebGL;
            Browser.moduleContextCreatedCallbacks.forEach(function (callback) {
                callback();
            });
            Browser.init();
        }
        return ctx;
    },
    destroyContext: function (canvas, useWebGL, setInModule) {},
    fullscreenHandlersInstalled: false,
    lockPointer: undefined,
    resizeCanvas: undefined,
    requestFullscreen: function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
        var canvas = Module["canvas"];
        function fullscreenChange() {
            Browser.isFullscreen = false;
            var canvasContainer = canvas.parentNode;
            if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
                canvas.exitFullscreen = Browser.exitFullscreen;
                if (Browser.lockPointer) canvas.requestPointerLock();
                Browser.isFullscreen = true;
                if (Browser.resizeCanvas) {
                    Browser.setFullscreenCanvasSize();
                } else {
                    Browser.updateCanvasDimensions(canvas);
                }
            } else {
                canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
                canvasContainer.parentNode.removeChild(canvasContainer);
                if (Browser.resizeCanvas) {
                    Browser.setWindowedCanvasSize();
                } else {
                    Browser.updateCanvasDimensions(canvas);
                }
            }
            if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
            if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen);
        }
        if (!Browser.fullscreenHandlersInstalled) {
            Browser.fullscreenHandlersInstalled = true;
            document.addEventListener("fullscreenchange", fullscreenChange, false);
            document.addEventListener("mozfullscreenchange", fullscreenChange, false);
            document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
            document.addEventListener("MSFullscreenChange", fullscreenChange, false);
        }
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        canvasContainer.requestFullscreen =
            canvasContainer["requestFullscreen"] ||
            canvasContainer["mozRequestFullScreen"] ||
            canvasContainer["msRequestFullscreen"] ||
            (canvasContainer["webkitRequestFullscreen"]
                ? function () {
                      canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]);
                  }
                : null) ||
            (canvasContainer["webkitRequestFullScreen"]
                ? function () {
                      canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);
                  }
                : null);
        canvasContainer.requestFullscreen();
    },
    exitFullscreen: function () {
        if (!Browser.isFullscreen) {
            return false;
        }
        var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function () {};
        CFS.apply(document, []);
        return true;
    },
    nextRAF: 0,
    fakeRequestAnimationFrame: function (func) {
        var now = Date.now();
        if (Browser.nextRAF === 0) {
            Browser.nextRAF = now + 1e3 / 60;
        } else {
            while (now + 2 >= Browser.nextRAF) {
                Browser.nextRAF += 1e3 / 60;
            }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
    },
    requestAnimationFrame: function (func) {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(func);
            return;
        }
        var RAF = Browser.fakeRequestAnimationFrame;
        RAF(func);
    },
    safeCallback: function (func) {
        return function () {
            if (!ABORT) return func.apply(null, arguments);
        };
    },
    allowAsyncCallbacks: true,
    queuedAsyncCallbacks: [],
    pauseAsyncCallbacks: function () {
        Browser.allowAsyncCallbacks = false;
    },
    resumeAsyncCallbacks: function () {
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
            var callbacks = Browser.queuedAsyncCallbacks;
            Browser.queuedAsyncCallbacks = [];
            callbacks.forEach(function (func) {
                func();
            });
        }
    },
    safeRequestAnimationFrame: function (func) {
        return Browser.requestAnimationFrame(function () {
            if (ABORT) return;
            if (Browser.allowAsyncCallbacks) {
                func();
            } else {
                Browser.queuedAsyncCallbacks.push(func);
            }
        });
    },
    safeSetTimeout: function (func, timeout) {
        noExitRuntime = true;
        return setTimeout(function () {
            if (ABORT) return;
            if (Browser.allowAsyncCallbacks) {
                func();
            } else {
                Browser.queuedAsyncCallbacks.push(func);
            }
        }, timeout);
    },
    safeSetInterval: function (func, timeout) {
        noExitRuntime = true;
        return setInterval(function () {
            if (ABORT) return;
            if (Browser.allowAsyncCallbacks) {
                func();
            }
        }, timeout);
    },
    getMimetype: function (name) {
        return { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", bmp: "image/bmp", ogg: "audio/ogg", wav: "audio/wav", mp3: "audio/mpeg" }[name.substr(name.lastIndexOf(".") + 1)];
    },
    getUserMedia: function (func) {
        if (!window.getUserMedia) {
            window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
        }
        window.getUserMedia(func);
    },
    getMovementX: function (event) {
        return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
    },
    getMovementY: function (event) {
        return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
    },
    getMouseWheelDelta: function (event) {
        var delta = 0;
        switch (event.type) {
            case "DOMMouseScroll":
                delta = event.detail / 3;
                break;
            case "mousewheel":
                delta = event.wheelDelta / 120;
                break;
            case "wheel":
                delta = event.deltaY;
                switch (event.deltaMode) {
                    case 0:
                        delta /= 100;
                        break;
                    case 1:
                        delta /= 3;
                        break;
                    case 2:
                        delta *= 80;
                        break;
                    default:
                        throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
                }
                break;
            default:
                throw "unrecognized mouse wheel event: " + event.type;
        }
        return delta;
    },
    mouseX: 0,
    mouseY: 0,
    mouseMovementX: 0,
    mouseMovementY: 0,
    touches: {},
    lastTouches: {},
    calculateMouseEvent: function (event) {
        if (Browser.pointerLock) {
            if (event.type != "mousemove" && "mozMovementX" in event) {
                Browser.mouseMovementX = Browser.mouseMovementY = 0;
            } else {
                Browser.mouseMovementX = Browser.getMovementX(event);
                Browser.mouseMovementY = Browser.getMovementY(event);
            }
            if (typeof SDL != "undefined") {
                Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
                Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
            } else {
                Browser.mouseX += Browser.mouseMovementX;
                Browser.mouseY += Browser.mouseMovementY;
            }
        } else {
            var rect = Module["canvas"].getBoundingClientRect();
            var cw = Module["canvas"].width;
            var ch = Module["canvas"].height;
            var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
            var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
            if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
                var touch = event.touch;
                if (touch === undefined) {
                    return;
                }
                var adjustedX = touch.pageX - (scrollX + rect.left);
                var adjustedY = touch.pageY - (scrollY + rect.top);
                adjustedX = adjustedX * (cw / rect.width);
                adjustedY = adjustedY * (ch / rect.height);
                var coords = { x: adjustedX, y: adjustedY };
                if (event.type === "touchstart") {
                    Browser.lastTouches[touch.identifier] = coords;
                    Browser.touches[touch.identifier] = coords;
                } else if (event.type === "touchend" || event.type === "touchmove") {
                    var last = Browser.touches[touch.identifier];
                    if (!last) last = coords;
                    Browser.lastTouches[touch.identifier] = last;
                    Browser.touches[touch.identifier] = coords;
                }
                return;
            }
            var x = event.pageX - (scrollX + rect.left);
            var y = event.pageY - (scrollY + rect.top);
            x = x * (cw / rect.width);
            y = y * (ch / rect.height);
            Browser.mouseMovementX = x - Browser.mouseX;
            Browser.mouseMovementY = y - Browser.mouseY;
            Browser.mouseX = x;
            Browser.mouseY = y;
        }
    },
    asyncLoad: function (url, onload, onerror, noRunDep) {
        var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
        readAsync(
            url,
            function (arrayBuffer) {
                assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
                onload(new Uint8Array(arrayBuffer));
                if (dep) removeRunDependency(dep);
            },
            function (event) {
                if (onerror) {
                    onerror();
                } else {
                    throw 'Loading data file "' + url + '" failed.';
                }
            }
        );
        if (dep) addRunDependency(dep);
    },
    resizeListeners: [],
    updateResizeListeners: function () {
        var canvas = Module["canvas"];
        Browser.resizeListeners.forEach(function (listener) {
            listener(canvas.width, canvas.height);
        });
    },
    setCanvasSize: function (width, height, noUpdates) {
        var canvas = Module["canvas"];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
    },
    windowedWidth: 0,
    windowedHeight: 0,
    setFullscreenCanvasSize: function () {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >>> 2];
            flags = flags | 8388608;
            HEAP32[SDL.screen >>> 2] = flags;
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners();
    },
    setWindowedCanvasSize: function () {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >>> 2];
            flags = flags & ~8388608;
            HEAP32[SDL.screen >>> 2] = flags;
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners();
    },
    updateCanvasDimensions: function (canvas, wNative, hNative) {
        if (wNative && hNative) {
            canvas.widthNative = wNative;
            canvas.heightNative = hNative;
        } else {
            wNative = canvas.widthNative;
            hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
            if (w / h < Module["forcedAspectRatio"]) {
                w = Math.round(h * Module["forcedAspectRatio"]);
            } else {
                h = Math.round(w / Module["forcedAspectRatio"]);
            }
        }
        if (
            (document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode &&
            typeof screen != "undefined"
        ) {
            var factor = Math.min(screen.width / w, screen.height / h);
            w = Math.round(w * factor);
            h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
            if (canvas.width != w) canvas.width = w;
            if (canvas.height != h) canvas.height = h;
            if (typeof canvas.style != "undefined") {
                canvas.style.removeProperty("width");
                canvas.style.removeProperty("height");
            }
        } else {
            if (canvas.width != wNative) canvas.width = wNative;
            if (canvas.height != hNative) canvas.height = hNative;
            if (typeof canvas.style != "undefined") {
                if (w != wNative || h != hNative) {
                    canvas.style.setProperty("width", w + "px", "important");
                    canvas.style.setProperty("height", h + "px", "important");
                } else {
                    canvas.style.removeProperty("width");
                    canvas.style.removeProperty("height");
                }
            }
        }
    },
    wgetRequests: {},
    nextWgetRequestHandle: 0,
    getNextWgetRequestHandle: function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
    },
};
var AL = {
    QUEUE_INTERVAL: 25,
    QUEUE_LOOKAHEAD: 0.1,
    DEVICE_NAME: "Emscripten OpenAL",
    CAPTURE_DEVICE_NAME: "Emscripten OpenAL capture",
    ALC_EXTENSIONS: { ALC_SOFT_pause_device: true, ALC_SOFT_HRTF: true },
    AL_EXTENSIONS: { AL_EXT_float32: true, AL_SOFT_loop_points: true, AL_SOFT_source_length: true, AL_EXT_source_distance_model: true, AL_SOFT_source_spatialize: true },
    _alcErr: 0,
    alcErr: 0,
    deviceRefCounts: {},
    alcStringCache: {},
    paused: false,
    stringCache: {},
    contexts: {},
    currentCtx: null,
    buffers: { 0: { id: 0, refCount: 0, audioBuf: null, frequency: 0, bytesPerSample: 2, channels: 1, length: 0 } },
    paramArray: [],
    _nextId: 1,
    newId: function () {
        return AL.freeIds.length > 0 ? AL.freeIds.pop() : AL._nextId++;
    },
    freeIds: [],
    scheduleContextAudio: function (ctx) {
        if (Browser.mainLoop.timingMode === 1 && document["visibilityState"] != "visible") {
            return;
        }
        for (var i in ctx.sources) {
            AL.scheduleSourceAudio(ctx.sources[i]);
        }
    },
    scheduleSourceAudio: function (src, lookahead) {
        if (Browser.mainLoop.timingMode === 1 && document["visibilityState"] != "visible") {
            return;
        }
        if (src.state !== 4114) {
            return;
        }
        var currentTime = AL.updateSourceTime(src);
        var startTime = src.bufStartTime;
        var startOffset = src.bufOffset;
        var bufCursor = src.bufsProcessed;
        for (var i = 0; i < src.audioQueue.length; i++) {
            var audioSrc = src.audioQueue[i];
            startTime = audioSrc._startTime + audioSrc._duration;
            startOffset = 0;
            bufCursor += audioSrc._skipCount + 1;
        }
        if (!lookahead) {
            lookahead = AL.QUEUE_LOOKAHEAD;
        }
        var lookaheadTime = currentTime + lookahead;
        var skipCount = 0;
        while (startTime < lookaheadTime) {
            if (bufCursor >= src.bufQueue.length) {
                if (src.looping) {
                    bufCursor %= src.bufQueue.length;
                } else {
                    break;
                }
            }
            var buf = src.bufQueue[bufCursor % src.bufQueue.length];
            if (buf.length === 0) {
                skipCount++;
                if (skipCount === src.bufQueue.length) {
                    break;
                }
            } else {
                var audioSrc = src.context.audioCtx.createBufferSource();
                audioSrc.buffer = buf.audioBuf;
                audioSrc.playbackRate.value = src.playbackRate;
                if (buf.audioBuf._loopStart || buf.audioBuf._loopEnd) {
                    audioSrc.loopStart = buf.audioBuf._loopStart;
                    audioSrc.loopEnd = buf.audioBuf._loopEnd;
                }
                var duration = 0;
                if (src.type === 4136 && src.looping) {
                    duration = Number.POSITIVE_INFINITY;
                    audioSrc.loop = true;
                    if (buf.audioBuf._loopStart) {
                        audioSrc.loopStart = buf.audioBuf._loopStart;
                    }
                    if (buf.audioBuf._loopEnd) {
                        audioSrc.loopEnd = buf.audioBuf._loopEnd;
                    }
                } else {
                    duration = (buf.audioBuf.duration - startOffset) / src.playbackRate;
                }
                audioSrc._startOffset = startOffset;
                audioSrc._duration = duration;
                audioSrc._skipCount = skipCount;
                skipCount = 0;
                audioSrc.connect(src.gain);
                if (typeof audioSrc.start !== "undefined") {
                    startTime = Math.max(startTime, src.context.audioCtx.currentTime);
                    audioSrc.start(startTime, startOffset);
                } else if (typeof audioSrc.noteOn !== "undefined") {
                    startTime = Math.max(startTime, src.context.audioCtx.currentTime);
                    audioSrc.noteOn(startTime);
                }
                audioSrc._startTime = startTime;
                src.audioQueue.push(audioSrc);
                startTime += duration;
            }
            startOffset = 0;
            bufCursor++;
        }
    },
    updateSourceTime: function (src) {
        var currentTime = src.context.audioCtx.currentTime;
        if (src.state !== 4114) {
            return currentTime;
        }
        if (!isFinite(src.bufStartTime)) {
            src.bufStartTime = currentTime - src.bufOffset / src.playbackRate;
            src.bufOffset = 0;
        }
        var nextStartTime = 0;
        while (src.audioQueue.length) {
            var audioSrc = src.audioQueue[0];
            src.bufsProcessed += audioSrc._skipCount;
            nextStartTime = audioSrc._startTime + audioSrc._duration;
            if (currentTime < nextStartTime) {
                break;
            }
            src.audioQueue.shift();
            src.bufStartTime = nextStartTime;
            src.bufOffset = 0;
            src.bufsProcessed++;
        }
        if (src.bufsProcessed >= src.bufQueue.length && !src.looping) {
            AL.setSourceState(src, 4116);
        } else if (src.type === 4136 && src.looping) {
            var buf = src.bufQueue[0];
            if (buf.length === 0) {
                src.bufOffset = 0;
            } else {
                var delta = (currentTime - src.bufStartTime) * src.playbackRate;
                var loopStart = buf.audioBuf._loopStart || 0;
                var loopEnd = buf.audioBuf._loopEnd || buf.audioBuf.duration;
                if (loopEnd <= loopStart) {
                    loopEnd = buf.audioBuf.duration;
                }
                if (delta < loopEnd) {
                    src.bufOffset = delta;
                } else {
                    src.bufOffset = loopStart + ((delta - loopStart) % (loopEnd - loopStart));
                }
            }
        } else if (src.audioQueue[0]) {
            src.bufOffset = (currentTime - src.audioQueue[0]._startTime) * src.playbackRate;
        } else {
            if (src.type !== 4136 && src.looping) {
                var srcDuration = AL.sourceDuration(src) / src.playbackRate;
                if (srcDuration > 0) {
                    src.bufStartTime += Math.floor((currentTime - src.bufStartTime) / srcDuration) * srcDuration;
                }
            }
            for (var i = 0; i < src.bufQueue.length; i++) {
                if (src.bufsProcessed >= src.bufQueue.length) {
                    if (src.looping) {
                        src.bufsProcessed %= src.bufQueue.length;
                    } else {
                        AL.setSourceState(src, 4116);
                        break;
                    }
                }
                var buf = src.bufQueue[src.bufsProcessed];
                if (buf.length > 0) {
                    nextStartTime = src.bufStartTime + buf.audioBuf.duration / src.playbackRate;
                    if (currentTime < nextStartTime) {
                        src.bufOffset = (currentTime - src.bufStartTime) * src.playbackRate;
                        break;
                    }
                    src.bufStartTime = nextStartTime;
                }
                src.bufOffset = 0;
                src.bufsProcessed++;
            }
        }
        return currentTime;
    },
    cancelPendingSourceAudio: function (src) {
        AL.updateSourceTime(src);
        for (var i = 1; i < src.audioQueue.length; i++) {
            var audioSrc = src.audioQueue[i];
            audioSrc.stop();
        }
        if (src.audioQueue.length > 1) {
            src.audioQueue.length = 1;
        }
    },
    stopSourceAudio: function (src) {
        for (var i = 0; i < src.audioQueue.length; i++) {
            src.audioQueue[i].stop();
        }
        src.audioQueue.length = 0;
    },
    setSourceState: function (src, state) {
        if (state === 4114) {
            if (src.state === 4114 || src.state == 4116) {
                src.bufsProcessed = 0;
                src.bufOffset = 0;
            } else {
            }
            AL.stopSourceAudio(src);
            src.state = 4114;
            src.bufStartTime = Number.NEGATIVE_INFINITY;
            AL.scheduleSourceAudio(src);
        } else if (state === 4115) {
            if (src.state === 4114) {
                AL.updateSourceTime(src);
                AL.stopSourceAudio(src);
                src.state = 4115;
            }
        } else if (state === 4116) {
            if (src.state !== 4113) {
                src.state = 4116;
                src.bufsProcessed = src.bufQueue.length;
                src.bufStartTime = Number.NEGATIVE_INFINITY;
                src.bufOffset = 0;
                AL.stopSourceAudio(src);
            }
        } else if (state === 4113) {
            if (src.state !== 4113) {
                src.state = 4113;
                src.bufsProcessed = 0;
                src.bufStartTime = Number.NEGATIVE_INFINITY;
                src.bufOffset = 0;
                AL.stopSourceAudio(src);
            }
        }
    },
    initSourcePanner: function (src) {
        if (src.type === 4144) {
            return;
        }
        var templateBuf = AL.buffers[0];
        for (var i = 0; i < src.bufQueue.length; i++) {
            if (src.bufQueue[i].id !== 0) {
                templateBuf = src.bufQueue[i];
                break;
            }
        }
        if (src.spatialize === 1 || (src.spatialize === 2 && templateBuf.channels === 1)) {
            if (src.panner) {
                return;
            }
            src.panner = src.context.audioCtx.createPanner();
            AL.updateSourceGlobal(src);
            AL.updateSourceSpace(src);
            src.panner.connect(src.context.gain);
            src.gain.disconnect();
            src.gain.connect(src.panner);
        } else {
            if (!src.panner) {
                return;
            }
            src.panner.disconnect();
            src.gain.disconnect();
            src.gain.connect(src.context.gain);
            src.panner = null;
        }
    },
    updateContextGlobal: function (ctx) {
        for (var i in ctx.sources) {
            AL.updateSourceGlobal(ctx.sources[i]);
        }
    },
    updateSourceGlobal: function (src) {
        var panner = src.panner;
        if (!panner) {
            return;
        }
        panner.refDistance = src.refDistance;
        panner.maxDistance = src.maxDistance;
        panner.rolloffFactor = src.rolloffFactor;
        panner.panningModel = src.context.hrtf ? "HRTF" : "equalpower";
        var distanceModel = src.context.sourceDistanceModel ? src.distanceModel : src.context.distanceModel;
        switch (distanceModel) {
            case 0:
                panner.distanceModel = "inverse";
                panner.refDistance = 3.40282e38;
                break;
            case 53249:
            case 53250:
                panner.distanceModel = "inverse";
                break;
            case 53251:
            case 53252:
                panner.distanceModel = "linear";
                break;
            case 53253:
            case 53254:
                panner.distanceModel = "exponential";
                break;
        }
    },
    updateListenerSpace: function (ctx) {
        var listener = ctx.audioCtx.listener;
        if (listener.positionX) {
            listener.positionX.value = ctx.listener.position[0];
            listener.positionY.value = ctx.listener.position[1];
            listener.positionZ.value = ctx.listener.position[2];
        } else {
            listener.setPosition(ctx.listener.position[0], ctx.listener.position[1], ctx.listener.position[2]);
        }
        if (listener.forwardX) {
            listener.forwardX.value = ctx.listener.direction[0];
            listener.forwardY.value = ctx.listener.direction[1];
            listener.forwardZ.value = ctx.listener.direction[2];
            listener.upX.value = ctx.listener.up[0];
            listener.upY.value = ctx.listener.up[1];
            listener.upZ.value = ctx.listener.up[2];
        } else {
            listener.setOrientation(ctx.listener.direction[0], ctx.listener.direction[1], ctx.listener.direction[2], ctx.listener.up[0], ctx.listener.up[1], ctx.listener.up[2]);
        }
        for (var i in ctx.sources) {
            AL.updateSourceSpace(ctx.sources[i]);
        }
    },
    updateSourceSpace: function (src) {
        if (!src.panner) {
            return;
        }
        var panner = src.panner;
        var posX = src.position[0];
        var posY = src.position[1];
        var posZ = src.position[2];
        var dirX = src.direction[0];
        var dirY = src.direction[1];
        var dirZ = src.direction[2];
        var listener = src.context.listener;
        var lPosX = listener.position[0];
        var lPosY = listener.position[1];
        var lPosZ = listener.position[2];
        if (src.relative) {
            var lBackX = -listener.direction[0];
            var lBackY = -listener.direction[1];
            var lBackZ = -listener.direction[2];
            var lUpX = listener.up[0];
            var lUpY = listener.up[1];
            var lUpZ = listener.up[2];
            var inverseMagnitude = function (x, y, z) {
                var length = Math.sqrt(x * x + y * y + z * z);
                if (length < Number.EPSILON) {
                    return 0;
                }
                return 1 / length;
            };
            var invMag = inverseMagnitude(lBackX, lBackY, lBackZ);
            lBackX *= invMag;
            lBackY *= invMag;
            lBackZ *= invMag;
            invMag = inverseMagnitude(lUpX, lUpY, lUpZ);
            lUpX *= invMag;
            lUpY *= invMag;
            lUpZ *= invMag;
            var lRightX = lUpY * lBackZ - lUpZ * lBackY;
            var lRightY = lUpZ * lBackX - lUpX * lBackZ;
            var lRightZ = lUpX * lBackY - lUpY * lBackX;
            invMag = inverseMagnitude(lRightX, lRightY, lRightZ);
            lRightX *= invMag;
            lRightY *= invMag;
            lRightZ *= invMag;
            lUpX = lBackY * lRightZ - lBackZ * lRightY;
            lUpY = lBackZ * lRightX - lBackX * lRightZ;
            lUpZ = lBackX * lRightY - lBackY * lRightX;
            var oldX = dirX;
            var oldY = dirY;
            var oldZ = dirZ;
            dirX = oldX * lRightX + oldY * lUpX + oldZ * lBackX;
            dirY = oldX * lRightY + oldY * lUpY + oldZ * lBackY;
            dirZ = oldX * lRightZ + oldY * lUpZ + oldZ * lBackZ;
            oldX = posX;
            oldY = posY;
            oldZ = posZ;
            posX = oldX * lRightX + oldY * lUpX + oldZ * lBackX;
            posY = oldX * lRightY + oldY * lUpY + oldZ * lBackY;
            posZ = oldX * lRightZ + oldY * lUpZ + oldZ * lBackZ;
            posX += lPosX;
            posY += lPosY;
            posZ += lPosZ;
        }
        if (panner.positionX) {
            panner.positionX.value = posX;
            panner.positionY.value = posY;
            panner.positionZ.value = posZ;
        } else {
            panner.setPosition(posX, posY, posZ);
        }
        if (panner.orientationX) {
            panner.orientationX.value = dirX;
            panner.orientationY.value = dirY;
            panner.orientationZ.value = dirZ;
        } else {
            panner.setOrientation(dirX, dirY, dirZ);
        }
        var oldShift = src.dopplerShift;
        var velX = src.velocity[0];
        var velY = src.velocity[1];
        var velZ = src.velocity[2];
        var lVelX = listener.velocity[0];
        var lVelY = listener.velocity[1];
        var lVelZ = listener.velocity[2];
        if ((posX === lPosX && posY === lPosY && posZ === lPosZ) || (velX === lVelX && velY === lVelY && velZ === lVelZ)) {
            src.dopplerShift = 1;
        } else {
            var speedOfSound = src.context.speedOfSound;
            var dopplerFactor = src.context.dopplerFactor;
            var slX = lPosX - posX;
            var slY = lPosY - posY;
            var slZ = lPosZ - posZ;
            var magSl = Math.sqrt(slX * slX + slY * slY + slZ * slZ);
            var vls = (slX * lVelX + slY * lVelY + slZ * lVelZ) / magSl;
            var vss = (slX * velX + slY * velY + slZ * velZ) / magSl;
            vls = Math.min(vls, speedOfSound / dopplerFactor);
            vss = Math.min(vss, speedOfSound / dopplerFactor);
            src.dopplerShift = (speedOfSound - dopplerFactor * vls) / (speedOfSound - dopplerFactor * vss);
        }
        if (src.dopplerShift !== oldShift) {
            AL.updateSourceRate(src);
        }
    },
    updateSourceRate: function (src) {
        if (src.state === 4114) {
            AL.cancelPendingSourceAudio(src);
            var audioSrc = src.audioQueue[0];
            if (!audioSrc) {
                return;
            }
            var duration;
            if (src.type === 4136 && src.looping) {
                duration = Number.POSITIVE_INFINITY;
            } else {
                duration = (audioSrc.buffer.duration - audioSrc._startOffset) / src.playbackRate;
            }
            audioSrc._duration = duration;
            audioSrc.playbackRate.value = src.playbackRate;
            AL.scheduleSourceAudio(src);
        }
    },
    sourceDuration: function (src) {
        var length = 0;
        for (var i = 0; i < src.bufQueue.length; i++) {
            var audioBuf = src.bufQueue[i].audioBuf;
            length += audioBuf ? audioBuf.duration : 0;
        }
        return length;
    },
    sourceTell: function (src) {
        AL.updateSourceTime(src);
        var offset = 0;
        for (var i = 0; i < src.bufsProcessed; i++) {
            offset += src.bufQueue[i].audioBuf.duration;
        }
        offset += src.bufOffset;
        return offset;
    },
    sourceSeek: function (src, offset) {
        var playing = src.state == 4114;
        if (playing) {
            AL.setSourceState(src, 4113);
        }
        if (src.bufQueue[src.bufsProcessed].audioBuf !== null) {
            src.bufsProcessed = 0;
            while (offset > src.bufQueue[src.bufsProcessed].audioBuf.duration) {
                offset -= src.bufQueue[src.bufsProcessed].audiobuf.duration;
                src.bufsProcessed++;
            }
            src.bufOffset = offset;
        }
        if (playing) {
            AL.setSourceState(src, 4114);
        }
    },
    getGlobalParam: function (funcname, param) {
        if (!AL.currentCtx) {
            return null;
        }
        switch (param) {
            case 49152:
                return AL.currentCtx.dopplerFactor;
            case 49155:
                return AL.currentCtx.speedOfSound;
            case 53248:
                return AL.currentCtx.distanceModel;
            default:
                AL.currentCtx.err = 40962;
                return null;
        }
    },
    setGlobalParam: function (funcname, param, value) {
        if (!AL.currentCtx) {
            return;
        }
        switch (param) {
            case 49152:
                if (!Number.isFinite(value) || value < 0) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                AL.currentCtx.dopplerFactor = value;
                AL.updateListenerSpace(AL.currentCtx);
                break;
            case 49155:
                if (!Number.isFinite(value) || value <= 0) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                AL.currentCtx.speedOfSound = value;
                AL.updateListenerSpace(AL.currentCtx);
                break;
            case 53248:
                switch (value) {
                    case 0:
                    case 53249:
                    case 53250:
                    case 53251:
                    case 53252:
                    case 53253:
                    case 53254:
                        AL.currentCtx.distanceModel = value;
                        AL.updateContextGlobal(AL.currentCtx);
                        break;
                    default:
                        AL.currentCtx.err = 40963;
                        return;
                }
                break;
            default:
                AL.currentCtx.err = 40962;
                return;
        }
    },
    getListenerParam: function (funcname, param) {
        if (!AL.currentCtx) {
            return null;
        }
        switch (param) {
            case 4100:
                return AL.currentCtx.listener.position;
            case 4102:
                return AL.currentCtx.listener.velocity;
            case 4111:
                return AL.currentCtx.listener.direction.concat(AL.currentCtx.listener.up);
            case 4106:
                return AL.currentCtx.gain.gain.value;
            default:
                AL.currentCtx.err = 40962;
                return null;
        }
    },
    setListenerParam: function (funcname, param, value) {
        if (!AL.currentCtx) {
            return;
        }
        if (value === null) {
            AL.currentCtx.err = 40962;
            return;
        }
        var listener = AL.currentCtx.listener;
        switch (param) {
            case 4100:
                if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2])) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                listener.position[0] = value[0];
                listener.position[1] = value[1];
                listener.position[2] = value[2];
                AL.updateListenerSpace(AL.currentCtx);
                break;
            case 4102:
                if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2])) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                listener.velocity[0] = value[0];
                listener.velocity[1] = value[1];
                listener.velocity[2] = value[2];
                AL.updateListenerSpace(AL.currentCtx);
                break;
            case 4106:
                if (!Number.isFinite(value) || value < 0) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                AL.currentCtx.gain.gain.value = value;
                break;
            case 4111:
                if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2]) || !Number.isFinite(value[3]) || !Number.isFinite(value[4]) || !Number.isFinite(value[5])) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                listener.direction[0] = value[0];
                listener.direction[1] = value[1];
                listener.direction[2] = value[2];
                listener.up[0] = value[3];
                listener.up[1] = value[4];
                listener.up[2] = value[5];
                AL.updateListenerSpace(AL.currentCtx);
                break;
            default:
                AL.currentCtx.err = 40962;
                return;
        }
    },
    getBufferParam: function (funcname, bufferId, param) {
        if (!AL.currentCtx) {
            return;
        }
        var buf = AL.buffers[bufferId];
        if (!buf || bufferId === 0) {
            AL.currentCtx.err = 40961;
            return;
        }
        switch (param) {
            case 8193:
                return buf.frequency;
            case 8194:
                return buf.bytesPerSample * 8;
            case 8195:
                return buf.channels;
            case 8196:
                return buf.length * buf.bytesPerSample * buf.channels;
            case 8213:
                if (buf.length === 0) {
                    return [0, 0];
                } else {
                    return [(buf.audioBuf._loopStart || 0) * buf.frequency, (buf.audioBuf._loopEnd || buf.length) * buf.frequency];
                }
            default:
                AL.currentCtx.err = 40962;
                return null;
        }
    },
    setBufferParam: function (funcname, bufferId, param, value) {
        if (!AL.currentCtx) {
            return;
        }
        var buf = AL.buffers[bufferId];
        if (!buf || bufferId === 0) {
            AL.currentCtx.err = 40961;
            return;
        }
        if (value === null) {
            AL.currentCtx.err = 40962;
            return;
        }
        switch (param) {
            case 8196:
                if (value !== 0) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                break;
            case 8213:
                if (value[0] < 0 || value[0] > buf.length || value[1] < 0 || value[1] > buf.Length || value[0] >= value[1]) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                if (buf.refCount > 0) {
                    AL.currentCtx.err = 40964;
                    return;
                }
                if (buf.audioBuf) {
                    buf.audioBuf._loopStart = value[0] / buf.frequency;
                    buf.audioBuf._loopEnd = value[1] / buf.frequency;
                }
                break;
            default:
                AL.currentCtx.err = 40962;
                return;
        }
    },
    getSourceParam: function (funcname, sourceId, param) {
        if (!AL.currentCtx) {
            return null;
        }
        var src = AL.currentCtx.sources[sourceId];
        if (!src) {
            AL.currentCtx.err = 40961;
            return null;
        }
        switch (param) {
            case 514:
                return src.relative;
            case 4097:
                return src.coneInnerAngle;
            case 4098:
                return src.coneOuterAngle;
            case 4099:
                return src.pitch;
            case 4100:
                return src.position;
            case 4101:
                return src.direction;
            case 4102:
                return src.velocity;
            case 4103:
                return src.looping;
            case 4105:
                if (src.type === 4136) {
                    return src.bufQueue[0].id;
                } else {
                    return 0;
                }
            case 4106:
                return src.gain.gain.value;
            case 4109:
                return src.minGain;
            case 4110:
                return src.maxGain;
            case 4112:
                return src.state;
            case 4117:
                if (src.bufQueue.length === 1 && src.bufQueue[0].id === 0) {
                    return 0;
                } else {
                    return src.bufQueue.length;
                }
            case 4118:
                if ((src.bufQueue.length === 1 && src.bufQueue[0].id === 0) || src.looping) {
                    return 0;
                } else {
                    return src.bufsProcessed;
                }
            case 4128:
                return src.refDistance;
            case 4129:
                return src.rolloffFactor;
            case 4130:
                return src.coneOuterGain;
            case 4131:
                return src.maxDistance;
            case 4132:
                return AL.sourceTell(src);
            case 4133:
                var offset = AL.sourceTell(src);
                if (offset > 0) {
                    offset *= src.bufQueue[0].frequency;
                }
                return offset;
            case 4134:
                var offset = AL.sourceTell(src);
                if (offset > 0) {
                    offset *= src.bufQueue[0].frequency * src.bufQueue[0].bytesPerSample;
                }
                return offset;
            case 4135:
                return src.type;
            case 4628:
                return src.spatialize;
            case 8201:
                var length = 0;
                var bytesPerFrame = 0;
                for (var i = 0; i < src.bufQueue.length; i++) {
                    length += src.bufQueue[i].length;
                    if (src.bufQueue[i].id !== 0) {
                        bytesPerFrame = src.bufQueue[i].bytesPerSample * src.bufQueue[i].channels;
                    }
                }
                return length * bytesPerFrame;
            case 8202:
                var length = 0;
                for (var i = 0; i < src.bufQueue.length; i++) {
                    length += src.bufQueue[i].length;
                }
                return length;
            case 8203:
                return AL.sourceDuration(src);
            case 53248:
                return src.distanceModel;
            default:
                AL.currentCtx.err = 40962;
                return null;
        }
    },
    setSourceParam: function (funcname, sourceId, param, value) {
        if (!AL.currentCtx) {
            return;
        }
        var src = AL.currentCtx.sources[sourceId];
        if (!src) {
            AL.currentCtx.err = 40961;
            return;
        }
        if (value === null) {
            AL.currentCtx.err = 40962;
            return;
        }
        switch (param) {
            case 514:
                if (value === 1) {
                    src.relative = true;
                    AL.updateSourceSpace(src);
                } else if (value === 0) {
                    src.relative = false;
                    AL.updateSourceSpace(src);
                } else {
                    AL.currentCtx.err = 40963;
                    return;
                }
                break;
            case 4097:
                if (!Number.isFinite(value)) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.coneInnerAngle = value;
                if (src.panner) {
                    src.panner.coneInnerAngle = value % 360;
                }
                break;
            case 4098:
                if (!Number.isFinite(value)) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.coneOuterAngle = value;
                if (src.panner) {
                    src.panner.coneOuterAngle = value % 360;
                }
                break;
            case 4099:
                if (!Number.isFinite(value) || value <= 0) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                if (src.pitch === value) {
                    break;
                }
                src.pitch = value;
                AL.updateSourceRate(src);
                break;
            case 4100:
                if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2])) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.position[0] = value[0];
                src.position[1] = value[1];
                src.position[2] = value[2];
                AL.updateSourceSpace(src);
                break;
            case 4101:
                if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2])) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.direction[0] = value[0];
                src.direction[1] = value[1];
                src.direction[2] = value[2];
                AL.updateSourceSpace(src);
                break;
            case 4102:
                if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2])) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.velocity[0] = value[0];
                src.velocity[1] = value[1];
                src.velocity[2] = value[2];
                AL.updateSourceSpace(src);
                break;
            case 4103:
                if (value === 1) {
                    src.looping = true;
                    AL.updateSourceTime(src);
                    if (src.type === 4136 && src.audioQueue.length > 0) {
                        var audioSrc = src.audioQueue[0];
                        audioSrc.loop = true;
                        audioSrc._duration = Number.POSITIVE_INFINITY;
                    }
                } else if (value === 0) {
                    src.looping = false;
                    var currentTime = AL.updateSourceTime(src);
                    if (src.type === 4136 && src.audioQueue.length > 0) {
                        var audioSrc = src.audioQueue[0];
                        audioSrc.loop = false;
                        audioSrc._duration = src.bufQueue[0].audioBuf.duration / src.playbackRate;
                        audioSrc._startTime = currentTime - src.bufOffset / src.playbackRate;
                    }
                } else {
                    AL.currentCtx.err = 40963;
                    return;
                }
                break;
            case 4105:
                if (src.state === 4114 || src.state === 4115) {
                    AL.currentCtx.err = 40964;
                    return;
                }
                if (value === 0) {
                    for (var i in src.bufQueue) {
                        src.bufQueue[i].refCount--;
                    }
                    src.bufQueue.length = 1;
                    src.bufQueue[0] = AL.buffers[0];
                    src.bufsProcessed = 0;
                    src.type = 4144;
                } else {
                    var buf = AL.buffers[value];
                    if (!buf) {
                        AL.currentCtx.err = 40963;
                        return;
                    }
                    for (var i in src.bufQueue) {
                        src.bufQueue[i].refCount--;
                    }
                    src.bufQueue.length = 0;
                    buf.refCount++;
                    src.bufQueue = [buf];
                    src.bufsProcessed = 0;
                    src.type = 4136;
                }
                AL.initSourcePanner(src);
                AL.scheduleSourceAudio(src);
                break;
            case 4106:
                if (!Number.isFinite(value) || value < 0) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.gain.gain.value = value;
                break;
            case 4109:
                if (!Number.isFinite(value) || value < 0 || value > Math.min(src.maxGain, 1)) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.minGain = value;
                break;
            case 4110:
                if (!Number.isFinite(value) || value < Math.max(0, src.minGain) || value > 1) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.maxGain = value;
                break;
            case 4128:
                if (!Number.isFinite(value) || value < 0) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.refDistance = value;
                if (src.panner) {
                    src.panner.refDistance = value;
                }
                break;
            case 4129:
                if (!Number.isFinite(value) || value < 0) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.rolloffFactor = value;
                if (src.panner) {
                    src.panner.rolloffFactor = value;
                }
                break;
            case 4130:
                if (!Number.isFinite(value) || value < 0 || value > 1) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.coneOuterGain = value;
                if (src.panner) {
                    src.panner.coneOuterGain = value;
                }
                break;
            case 4131:
                if (!Number.isFinite(value) || value < 0) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.maxDistance = value;
                if (src.panner) {
                    src.panner.maxDistance = value;
                }
                break;
            case 4132:
                if (value < 0 || value > AL.sourceDuration(src)) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                AL.sourceSeek(src, value);
                break;
            case 4133:
                var srcLen = AL.sourceDuration(src);
                if (srcLen > 0) {
                    var frequency;
                    for (var bufId in src.bufQueue) {
                        if (bufId) {
                            frequency = src.bufQueue[bufId].frequency;
                            break;
                        }
                    }
                    value /= frequency;
                }
                if (value < 0 || value > srcLen) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                AL.sourceSeek(src, value);
                break;
            case 4134:
                var srcLen = AL.sourceDuration(src);
                if (srcLen > 0) {
                    var bytesPerSec;
                    for (var bufId in src.bufQueue) {
                        if (bufId) {
                            var buf = src.bufQueue[bufId];
                            bytesPerSec = buf.frequency * buf.bytesPerSample * buf.channels;
                            break;
                        }
                    }
                    value /= bytesPerSec;
                }
                if (value < 0 || value > srcLen) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                AL.sourceSeek(src, value);
                break;
            case 4628:
                if (value !== 0 && value !== 1 && value !== 2) {
                    AL.currentCtx.err = 40963;
                    return;
                }
                src.spatialize = value;
                AL.initSourcePanner(src);
                break;
            case 8201:
            case 8202:
            case 8203:
                AL.currentCtx.err = 40964;
                break;
            case 53248:
                switch (value) {
                    case 0:
                    case 53249:
                    case 53250:
                    case 53251:
                    case 53252:
                    case 53253:
                    case 53254:
                        src.distanceModel = value;
                        if (AL.currentCtx.sourceDistanceModel) {
                            AL.updateContextGlobal(AL.currentCtx);
                        }
                        break;
                    default:
                        AL.currentCtx.err = 40963;
                        return;
                }
                break;
            default:
                AL.currentCtx.err = 40962;
                return;
        }
    },
    captures: {},
    sharedCaptureAudioCtx: null,
    requireValidCaptureDevice: function (deviceId, funcname) {
        if (deviceId === 0) {
            AL.alcErr = 40961;
            return null;
        }
        var c = AL.captures[deviceId];
        if (!c) {
            AL.alcErr = 40961;
            return null;
        }
        var err = c.mediaStreamError;
        if (err) {
            AL.alcErr = 40961;
            return null;
        }
        return c;
    },
};
function _alBufferData(bufferId, format, pData, size, freq) {
    if (!AL.currentCtx) {
        return;
    }
    var buf = AL.buffers[bufferId];
    if (!buf) {
        AL.currentCtx.err = 40963;
        return;
    }
    if (freq <= 0) {
        AL.currentCtx.err = 40963;
        return;
    }
    var audioBuf = null;
    try {
        switch (format) {
            case 4352:
                if (size > 0) {
                    audioBuf = AL.currentCtx.audioCtx.createBuffer(1, size, freq);
                    var channel0 = audioBuf.getChannelData(0);
                    for (var i = 0; i < size; ++i) {
                        channel0[i] = HEAPU8[pData++ >>> 0] * 0.0078125 - 1;
                    }
                }
                buf.bytesPerSample = 1;
                buf.channels = 1;
                buf.length = size;
                break;
            case 4353:
                if (size > 0) {
                    audioBuf = AL.currentCtx.audioCtx.createBuffer(1, size >> 1, freq);
                    var channel0 = audioBuf.getChannelData(0);
                    pData >>= 1;
                    for (var i = 0; i < size >> 1; ++i) {
                        channel0[i] = HEAP16[pData++ >>> 0] * 30517578125e-15;
                    }
                }
                buf.bytesPerSample = 2;
                buf.channels = 1;
                buf.length = size >> 1;
                break;
            case 4354:
                if (size > 0) {
                    audioBuf = AL.currentCtx.audioCtx.createBuffer(2, size >> 1, freq);
                    var channel0 = audioBuf.getChannelData(0);
                    var channel1 = audioBuf.getChannelData(1);
                    for (var i = 0; i < size >> 1; ++i) {
                        channel0[i] = HEAPU8[pData++ >>> 0] * 0.0078125 - 1;
                        channel1[i] = HEAPU8[pData++ >>> 0] * 0.0078125 - 1;
                    }
                }
                buf.bytesPerSample = 1;
                buf.channels = 2;
                buf.length = size >> 1;
                break;
            case 4355:
                if (size > 0) {
                    audioBuf = AL.currentCtx.audioCtx.createBuffer(2, size >> 2, freq);
                    var channel0 = audioBuf.getChannelData(0);
                    var channel1 = audioBuf.getChannelData(1);
                    pData >>= 1;
                    for (var i = 0; i < size >> 2; ++i) {
                        channel0[i] = HEAP16[pData++ >>> 0] * 30517578125e-15;
                        channel1[i] = HEAP16[pData++ >>> 0] * 30517578125e-15;
                    }
                }
                buf.bytesPerSample = 2;
                buf.channels = 2;
                buf.length = size >> 2;
                break;
            case 65552:
                if (size > 0) {
                    audioBuf = AL.currentCtx.audioCtx.createBuffer(1, size >> 2, freq);
                    var channel0 = audioBuf.getChannelData(0);
                    pData >>= 2;
                    for (var i = 0; i < size >> 2; ++i) {
                        channel0[i] = HEAPF32[pData++ >>> 0];
                    }
                }
                buf.bytesPerSample = 4;
                buf.channels = 1;
                buf.length = size >> 2;
                break;
            case 65553:
                if (size > 0) {
                    audioBuf = AL.currentCtx.audioCtx.createBuffer(2, size >> 3, freq);
                    var channel0 = audioBuf.getChannelData(0);
                    var channel1 = audioBuf.getChannelData(1);
                    pData >>= 2;
                    for (var i = 0; i < size >> 3; ++i) {
                        channel0[i] = HEAPF32[pData++ >>> 0];
                        channel1[i] = HEAPF32[pData++ >>> 0];
                    }
                }
                buf.bytesPerSample = 4;
                buf.channels = 2;
                buf.length = size >> 3;
                break;
            default:
                AL.currentCtx.err = 40963;
                return;
        }
        buf.frequency = freq;
        buf.audioBuf = audioBuf;
    } catch (e) {
        AL.currentCtx.err = 40963;
        return;
    }
}
function _alDeleteBuffers(count, pBufferIds) {
    if (!AL.currentCtx) {
        return;
    }
    for (var i = 0; i < count; ++i) {
        var bufId = HEAP32[(pBufferIds + i * 4) >>> 2];
        if (bufId === 0) {
            continue;
        }
        if (!AL.buffers[bufId]) {
            AL.currentCtx.err = 40961;
            return;
        }
        if (AL.buffers[bufId].refCount) {
            AL.currentCtx.err = 40964;
            return;
        }
    }
    for (var i = 0; i < count; ++i) {
        var bufId = HEAP32[(pBufferIds + i * 4) >>> 2];
        if (bufId === 0) {
            continue;
        }
        AL.deviceRefCounts[AL.buffers[bufId].deviceId]--;
        delete AL.buffers[bufId];
        AL.freeIds.push(bufId);
    }
}
function _alSourcei(sourceId, param, value) {
    switch (param) {
        case 514:
        case 4097:
        case 4098:
        case 4103:
        case 4105:
        case 4128:
        case 4129:
        case 4131:
        case 4132:
        case 4133:
        case 4134:
        case 4628:
        case 8201:
        case 8202:
        case 53248:
            AL.setSourceParam("alSourcei", sourceId, param, value);
            break;
        default:
            AL.setSourceParam("alSourcei", sourceId, param, null);
            break;
    }
}
function _alDeleteSources(count, pSourceIds) {
    if (!AL.currentCtx) {
        return;
    }
    for (var i = 0; i < count; ++i) {
        var srcId = HEAP32[(pSourceIds + i * 4) >>> 2];
        if (!AL.currentCtx.sources[srcId]) {
            AL.currentCtx.err = 40961;
            return;
        }
    }
    for (var i = 0; i < count; ++i) {
        var srcId = HEAP32[(pSourceIds + i * 4) >>> 2];
        AL.setSourceState(AL.currentCtx.sources[srcId], 4116);
        _alSourcei(srcId, 4105, 0);
        delete AL.currentCtx.sources[srcId];
        AL.freeIds.push(srcId);
    }
}
function _alGenBuffers(count, pBufferIds) {
    if (!AL.currentCtx) {
        return;
    }
    for (var i = 0; i < count; ++i) {
        var buf = { deviceId: AL.currentCtx.deviceId, id: AL.newId(), refCount: 0, audioBuf: null, frequency: 0, bytesPerSample: 2, channels: 1, length: 0 };
        AL.deviceRefCounts[buf.deviceId]++;
        AL.buffers[buf.id] = buf;
        HEAP32[(pBufferIds + i * 4) >>> 2] = buf.id;
    }
}
function _alGenSources(count, pSourceIds) {
    if (!AL.currentCtx) {
        return;
    }
    for (var i = 0; i < count; ++i) {
        var gain = AL.currentCtx.audioCtx.createGain();
        gain.connect(AL.currentCtx.gain);
        var src = {
            context: AL.currentCtx,
            id: AL.newId(),
            type: 4144,
            state: 4113,
            bufQueue: [AL.buffers[0]],
            audioQueue: [],
            looping: false,
            pitch: 1,
            dopplerShift: 1,
            gain: gain,
            minGain: 0,
            maxGain: 1,
            panner: null,
            bufsProcessed: 0,
            bufStartTime: Number.NEGATIVE_INFINITY,
            bufOffset: 0,
            relative: false,
            refDistance: 1,
            maxDistance: 3.40282e38,
            rolloffFactor: 1,
            position: [0, 0, 0],
            velocity: [0, 0, 0],
            direction: [0, 0, 0],
            coneOuterGain: 0,
            coneInnerAngle: 360,
            coneOuterAngle: 360,
            distanceModel: 53250,
            spatialize: 2,
            get playbackRate() {
                return this.pitch * this.dopplerShift;
            },
        };
        AL.currentCtx.sources[src.id] = src;
        HEAP32[(pSourceIds + i * 4) >>> 2] = src.id;
    }
}
function _alGetError() {
    if (!AL.currentCtx) {
        return 40964;
    } else {
        var err = AL.currentCtx.err;
        AL.currentCtx.err = 0;
        return err;
    }
}
function _alGetSourcei(sourceId, param, pValue) {
    var val = AL.getSourceParam("alGetSourcei", sourceId, param);
    if (val === null) {
        return;
    }
    if (!pValue) {
        AL.currentCtx.err = 40963;
        return;
    }
    switch (param) {
        case 514:
        case 4097:
        case 4098:
        case 4103:
        case 4105:
        case 4112:
        case 4117:
        case 4118:
        case 4128:
        case 4129:
        case 4131:
        case 4132:
        case 4133:
        case 4134:
        case 4135:
        case 4628:
        case 8201:
        case 8202:
        case 53248:
            HEAP32[pValue >>> 2] = val;
            break;
        default:
            AL.currentCtx.err = 40962;
            return;
    }
}
function _alGetString(param) {
    if (!AL.currentCtx) {
        return 0;
    }
    if (AL.stringCache[param]) {
        return AL.stringCache[param];
    }
    var ret;
    switch (param) {
        case 0:
            ret = "No Error";
            break;
        case 40961:
            ret = "Invalid Name";
            break;
        case 40962:
            ret = "Invalid Enum";
            break;
        case 40963:
            ret = "Invalid Value";
            break;
        case 40964:
            ret = "Invalid Operation";
            break;
        case 40965:
            ret = "Out of Memory";
            break;
        case 45057:
            ret = "Emscripten";
            break;
        case 45058:
            ret = "1.1";
            break;
        case 45059:
            ret = "WebAudio";
            break;
        case 45060:
            ret = "";
            for (var ext in AL.AL_EXTENSIONS) {
                ret = ret.concat(ext);
                ret = ret.concat(" ");
            }
            ret = ret.trim();
            break;
        default:
            AL.currentCtx.err = 40962;
            return 0;
    }
    ret = allocate(intArrayFromString(ret), ALLOC_NORMAL);
    AL.stringCache[param] = ret;
    return ret;
}
function _alSource3f(sourceId, param, value0, value1, value2) {
    switch (param) {
        case 4100:
        case 4101:
        case 4102:
            AL.paramArray[0] = value0;
            AL.paramArray[1] = value1;
            AL.paramArray[2] = value2;
            AL.setSourceParam("alSource3f", sourceId, param, AL.paramArray);
            break;
        default:
            AL.setSourceParam("alSource3f", sourceId, param, null);
            break;
    }
}
function _alSourcePause(sourceId) {
    if (!AL.currentCtx) {
        return;
    }
    var src = AL.currentCtx.sources[sourceId];
    if (!src) {
        AL.currentCtx.err = 40961;
        return;
    }
    AL.setSourceState(src, 4115);
}
function _alSourcePlay(sourceId) {
    if (!AL.currentCtx) {
        return;
    }
    var src = AL.currentCtx.sources[sourceId];
    if (!src) {
        AL.currentCtx.err = 40961;
        return;
    }
    AL.setSourceState(src, 4114);
}
function _alSourceQueueBuffers(sourceId, count, pBufferIds) {
    if (!AL.currentCtx) {
        return;
    }
    var src = AL.currentCtx.sources[sourceId];
    if (!src) {
        AL.currentCtx.err = 40961;
        return;
    }
    if (src.type === 4136) {
        AL.currentCtx.err = 40964;
        return;
    }
    if (count === 0) {
        return;
    }
    var templateBuf = AL.buffers[0];
    for (var i = 0; i < src.bufQueue.length; i++) {
        if (src.bufQueue[i].id !== 0) {
            templateBuf = src.bufQueue[i];
            break;
        }
    }
    for (var i = 0; i < count; ++i) {
        var bufId = HEAP32[(pBufferIds + i * 4) >>> 2];
        var buf = AL.buffers[bufId];
        if (!buf) {
            AL.currentCtx.err = 40961;
            return;
        }
        if (templateBuf.id !== 0 && (buf.frequency !== templateBuf.frequency || buf.bytesPerSample !== templateBuf.bytesPerSample || buf.channels !== templateBuf.channels)) {
            AL.currentCtx.err = 40964;
        }
    }
    if (src.bufQueue.length === 1 && src.bufQueue[0].id === 0) {
        src.bufQueue.length = 0;
    }
    src.type = 4137;
    for (var i = 0; i < count; ++i) {
        var bufId = HEAP32[(pBufferIds + i * 4) >>> 2];
        var buf = AL.buffers[bufId];
        buf.refCount++;
        src.bufQueue.push(buf);
    }
    if (src.looping) {
        AL.cancelPendingSourceAudio(src);
    }
    AL.initSourcePanner(src);
    AL.scheduleSourceAudio(src);
}
function _alSourceStop(sourceId) {
    if (!AL.currentCtx) {
        return;
    }
    var src = AL.currentCtx.sources[sourceId];
    if (!src) {
        AL.currentCtx.err = 40961;
        return;
    }
    AL.setSourceState(src, 4116);
}
function _alSourceUnqueueBuffers(sourceId, count, pBufferIds) {
    if (!AL.currentCtx) {
        return;
    }
    var src = AL.currentCtx.sources[sourceId];
    if (!src) {
        AL.currentCtx.err = 40961;
        return;
    }
    if (count > (src.bufQueue.length === 1 && src.bufQueue[0].id === 0 ? 0 : src.bufsProcessed)) {
        AL.currentCtx.err = 40963;
        return;
    }
    if (count === 0) {
        return;
    }
    for (var i = 0; i < count; i++) {
        var buf = src.bufQueue.shift();
        buf.refCount--;
        HEAP32[(pBufferIds + i * 4) >>> 2] = buf.id;
        src.bufsProcessed--;
    }
    if (src.bufQueue.length === 0) {
        src.bufQueue.push(AL.buffers[0]);
    }
    AL.initSourcePanner(src);
    AL.scheduleSourceAudio(src);
}
function _alSourcef(sourceId, param, value) {
    switch (param) {
        case 4097:
        case 4098:
        case 4099:
        case 4106:
        case 4109:
        case 4110:
        case 4128:
        case 4129:
        case 4130:
        case 4131:
        case 4132:
        case 4133:
        case 4134:
        case 8203:
            AL.setSourceParam("alSourcef", sourceId, param, value);
            break;
        default:
            AL.setSourceParam("alSourcef", sourceId, param, null);
            break;
    }
}
function listenOnce(object, event, func) {
    object.addEventListener(event, func, { once: true });
}
function autoResumeAudioContext(ctx, elements) {
    if (!elements) {
        elements = [document, document.getElementById("canvas")];
    }
    ["keydown", "mousedown", "touchstart"].forEach(function (event) {
        elements.forEach(function (element) {
            if (element) {
                listenOnce(element, event, function () {
                    if (ctx.state === "suspended") ctx.resume();
                });
            }
        });
    });
}
function _alcCreateContext(deviceId, pAttrList) {
    if (!(deviceId in AL.deviceRefCounts)) {
        AL.alcErr = 40961;
        return 0;
    }
    var options = null;
    var attrs = [];
    var hrtf = null;
    pAttrList >>= 2;
    if (pAttrList) {
        var attr = 0;
        var val = 0;
        while (true) {
            attr = HEAP32[pAttrList++ >>> 0];
            attrs.push(attr);
            if (attr === 0) {
                break;
            }
            val = HEAP32[pAttrList++ >>> 0];
            attrs.push(val);
            switch (attr) {
                case 4103:
                    if (!options) {
                        options = {};
                    }
                    options.sampleRate = val;
                    break;
                case 4112:
                case 4113:
                    break;
                case 6546:
                    switch (val) {
                        case 0:
                            hrtf = false;
                            break;
                        case 1:
                            hrtf = true;
                            break;
                        case 2:
                            break;
                        default:
                            AL.alcErr = 40964;
                            return 0;
                    }
                    break;
                case 6550:
                    if (val !== 0) {
                        AL.alcErr = 40964;
                        return 0;
                    }
                    break;
                default:
                    AL.alcErr = 40964;
                    return 0;
            }
        }
    }
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var ac = null;
    try {
        if (options) {
            ac = new AudioContext(options);
        } else {
            ac = new AudioContext();
        }
    } catch (e) {
        if (e.name === "NotSupportedError") {
            AL.alcErr = 40964;
        } else {
            AL.alcErr = 40961;
        }
        return 0;
    }
    autoResumeAudioContext(ac);
    if (typeof ac.createGain === "undefined") {
        ac.createGain = ac.createGainNode;
    }
    var gain = ac.createGain();
    gain.connect(ac.destination);
    var ctx = {
        deviceId: deviceId,
        id: AL.newId(),
        attrs: attrs,
        audioCtx: ac,
        listener: { position: [0, 0, 0], velocity: [0, 0, 0], direction: [0, 0, 0], up: [0, 0, 0] },
        sources: [],
        interval: setInterval(function () {
            AL.scheduleContextAudio(ctx);
        }, AL.QUEUE_INTERVAL),
        gain: gain,
        distanceModel: 53250,
        speedOfSound: 343.3,
        dopplerFactor: 1,
        sourceDistanceModel: false,
        hrtf: hrtf || false,
        _err: 0,
        get err() {
            return this._err;
        },
        set err(val) {
            if (this._err === 0 || val === 0) {
                this._err = val;
            }
        },
    };
    AL.deviceRefCounts[deviceId]++;
    AL.contexts[ctx.id] = ctx;
    if (hrtf !== null) {
        for (var ctxId in AL.contexts) {
            var c = AL.contexts[ctxId];
            if (c.deviceId === deviceId) {
                c.hrtf = hrtf;
                AL.updateContextGlobal(c);
            }
        }
    }
    return ctx.id;
}
function _alcMakeContextCurrent(contextId) {
    if (contextId === 0) {
        AL.currentCtx = null;
        return 0;
    } else {
        AL.currentCtx = AL.contexts[contextId];
        return 1;
    }
}
function _alcOpenDevice(pDeviceName) {
    if (pDeviceName) {
        var name = UTF8ToString(pDeviceName);
        if (name !== AL.DEVICE_NAME) {
            return 0;
        }
    }
    if (typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined") {
        var deviceId = AL.newId();
        AL.deviceRefCounts[deviceId] = 0;
        return deviceId;
    } else {
        return 0;
    }
}
function _clock() {
    if (_clock.start === undefined) _clock.start = Date.now();
    return ((Date.now() - _clock.start) * (1e6 / 1e3)) | 0;
}
function _difftime(time1, time0) {
    return time1 - time0;
}
function _emscripten_asm_const_int(code, sigPtr, argbuf) {
    var args = readAsmConstArgs(sigPtr, argbuf);
    return ASM_CONSTS[code].apply(null, args);
}
function _emscripten_async_wget2_data(url, request, param, arg, free, onload, onerror, onprogress) {
    var _url = UTF8ToString(url);
    var _request = UTF8ToString(request);
    var _param = UTF8ToString(param);
    var http = new XMLHttpRequest();
    http.open(_request, _url, true);
    http.responseType = "arraybuffer";
    var handle = Browser.getNextWgetRequestHandle();
    http.onload = function http_onload(e) {
        if ((http.status >= 200 && http.status < 300) || (http.status === 0 && _url.substr(0, 4).toLowerCase() != "http")) {
            var byteArray = new Uint8Array(http.response);
            var buffer = _malloc(byteArray.length);
            HEAPU8.set(byteArray, buffer >>> 0);
            if (onload) wasmTable.get(onload)(handle, arg, buffer, byteArray.length);
            if (free) _free(buffer);
        } else {
            if (onerror) wasmTable.get(onerror)(handle, arg, http.status, http.statusText);
        }
        delete Browser.wgetRequests[handle];
    };
    http.onerror = function http_onerror(e) {
        if (onerror) {
            wasmTable.get(onerror)(handle, arg, http.status, http.statusText);
        }
        delete Browser.wgetRequests[handle];
    };
    http.onprogress = function http_onprogress(e) {
        if (onprogress) wasmTable.get(onprogress)(handle, arg, e.loaded, e.lengthComputable || e.lengthComputable === undefined ? e.total : 0);
    };
    http.onabort = function http_onabort(e) {
        delete Browser.wgetRequests[handle];
    };
    if (_request == "POST") {
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.send(_param);
    } else {
        http.send(null);
    }
    Browser.wgetRequests[handle] = http;
    return handle;
}
function _emscripten_async_wget_data(url, arg, onload, onerror) {
    Browser.asyncLoad(
        UTF8ToString(url),
        function (byteArray) {
            var buffer = _malloc(byteArray.length);
            HEAPU8.set(byteArray, buffer >>> 0);
            wasmTable.get(onload)(arg, buffer, byteArray.length);
            _free(buffer);
        },
        function () {
            if (onerror) wasmTable.get(onerror)(arg);
        },
        true
    );
}
var JSEvents = {
    inEventHandler: 0,
    removeAllEventListeners: function () {
        for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
            JSEvents._removeHandler(i);
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = [];
    },
    registerRemoveEventListeners: function () {
        if (!JSEvents.removeEventListenersRegistered) {
            __ATEXIT__.push(JSEvents.removeAllEventListeners);
            JSEvents.removeEventListenersRegistered = true;
        }
    },
    deferredCalls: [],
    deferCall: function (targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
            if (arrA.length != arrB.length) return false;
            for (var i in arrA) {
                if (arrA[i] != arrB[i]) return false;
            }
            return true;
        }
        for (var i in JSEvents.deferredCalls) {
            var call = JSEvents.deferredCalls[i];
            if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                return;
            }
        }
        JSEvents.deferredCalls.push({ targetFunction: targetFunction, precedence: precedence, argsList: argsList });
        JSEvents.deferredCalls.sort(function (x, y) {
            return x.precedence < y.precedence;
        });
    },
    removeDeferredCalls: function (targetFunction) {
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
                JSEvents.deferredCalls.splice(i, 1);
                --i;
            }
        }
    },
    canPerformEventHandlerRequests: function () {
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
    },
    runDeferredCalls: function () {
        if (!JSEvents.canPerformEventHandlerRequests()) {
            return;
        }
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            var call = JSEvents.deferredCalls[i];
            JSEvents.deferredCalls.splice(i, 1);
            --i;
            call.targetFunction.apply(null, call.argsList);
        }
    },
    eventHandlers: [],
    removeAllHandlersOnTarget: function (target, eventTypeString) {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                JSEvents._removeHandler(i--);
            }
        }
    },
    _removeHandler: function (i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1);
    },
    registerOrRemoveHandler: function (eventHandler) {
        var jsEventHandler = function jsEventHandler(event) {
            ++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            JSEvents.runDeferredCalls();
            eventHandler.handlerFunc(event);
            JSEvents.runDeferredCalls();
            --JSEvents.inEventHandler;
        };
        if (eventHandler.callbackfunc) {
            eventHandler.eventListenerFunc = jsEventHandler;
            eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, { capture: eventHandler.useCapture, passive: false });
            JSEvents.eventHandlers.push(eventHandler);
            JSEvents.registerRemoveEventListeners();
        } else {
            for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                    JSEvents._removeHandler(i--);
                }
            }
        }
    },
    getNodeNameForTarget: function (target) {
        if (!target) return "";
        if (target == window) return "#window";
        if (target == screen) return "#screen";
        return target && target.nodeName ? target.nodeName : "";
    },
    fullscreenEnabled: function () {
        return document.fullscreenEnabled || document.webkitFullscreenEnabled;
    },
};
function __setLetterbox(element, topBottom, leftRight) {
    element.style.paddingLeft = element.style.paddingRight = leftRight + "px";
    element.style.paddingTop = element.style.paddingBottom = topBottom + "px";
}
function __hideEverythingExceptGivenElement(onlyVisibleElement) {
    var child = onlyVisibleElement;
    var parent = child.parentNode;
    var hiddenElements = [];
    while (child != document.body) {
        var children = parent.children;
        for (var i = 0; i < children.length; ++i) {
            if (children[i] != child) {
                hiddenElements.push({ node: children[i], displayState: children[i].style.display });
                children[i].style.display = "none";
            }
        }
        child = parent;
        parent = parent.parentNode;
    }
    return hiddenElements;
}
var __restoreOldWindowedStyle = null;
function maybeCStringToJsString(cString) {
    return cString > 2 ? UTF8ToString(cString) : cString;
}
var specialHTMLTargets = [0, typeof document !== "undefined" ? document : 0, typeof window !== "undefined" ? window : 0];
function findEventTarget(target) {
    target = maybeCStringToJsString(target);
    var domElement = specialHTMLTargets[target] || (typeof document !== "undefined" ? document.querySelector(target) : undefined);
    return domElement;
}
function findCanvasEventTarget(target) {
    return findEventTarget(target);
}
function _emscripten_get_canvas_element_size(target, width, height) {
    var canvas = findCanvasEventTarget(target);
    if (!canvas) return -4;
    HEAP32[width >>> 2] = canvas.width;
    HEAP32[height >>> 2] = canvas.height;
}
function __get_canvas_element_size(target) {
    var stackTop = stackSave();
    var w = stackAlloc(8);
    var h = w + 4;
    var targetInt = stackAlloc(target.id.length + 1);
    stringToUTF8(target.id, targetInt, target.id.length + 1);
    var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
    var size = [HEAP32[w >>> 2], HEAP32[h >>> 2]];
    stackRestore(stackTop);
    return size;
}
function _emscripten_set_canvas_element_size(target, width, height) {
    var canvas = findCanvasEventTarget(target);
    if (!canvas) return -4;
    canvas.width = width;
    canvas.height = height;
    return 0;
}
function __set_canvas_element_size(target, width, height) {
    if (!target.controlTransferredOffscreen) {
        target.width = width;
        target.height = height;
    } else {
        var stackTop = stackSave();
        var targetInt = stackAlloc(target.id.length + 1);
        stringToUTF8(target.id, targetInt, target.id.length + 1);
        _emscripten_set_canvas_element_size(targetInt, width, height);
        stackRestore(stackTop);
    }
}
function __registerRestoreOldStyle(canvas) {
    var canvasSize = __get_canvas_element_size(canvas);
    var oldWidth = canvasSize[0];
    var oldHeight = canvasSize[1];
    var oldCssWidth = canvas.style.width;
    var oldCssHeight = canvas.style.height;
    var oldBackgroundColor = canvas.style.backgroundColor;
    var oldDocumentBackgroundColor = document.body.style.backgroundColor;
    var oldPaddingLeft = canvas.style.paddingLeft;
    var oldPaddingRight = canvas.style.paddingRight;
    var oldPaddingTop = canvas.style.paddingTop;
    var oldPaddingBottom = canvas.style.paddingBottom;
    var oldMarginLeft = canvas.style.marginLeft;
    var oldMarginRight = canvas.style.marginRight;
    var oldMarginTop = canvas.style.marginTop;
    var oldMarginBottom = canvas.style.marginBottom;
    var oldDocumentBodyMargin = document.body.style.margin;
    var oldDocumentOverflow = document.documentElement.style.overflow;
    var oldDocumentScroll = document.body.scroll;
    var oldImageRendering = canvas.style.imageRendering;
    function restoreOldStyle() {
        var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        if (!fullscreenElement) {
            document.removeEventListener("fullscreenchange", restoreOldStyle);
            document.removeEventListener("webkitfullscreenchange", restoreOldStyle);
            __set_canvas_element_size(canvas, oldWidth, oldHeight);
            canvas.style.width = oldCssWidth;
            canvas.style.height = oldCssHeight;
            canvas.style.backgroundColor = oldBackgroundColor;
            if (!oldDocumentBackgroundColor) document.body.style.backgroundColor = "white";
            document.body.style.backgroundColor = oldDocumentBackgroundColor;
            canvas.style.paddingLeft = oldPaddingLeft;
            canvas.style.paddingRight = oldPaddingRight;
            canvas.style.paddingTop = oldPaddingTop;
            canvas.style.paddingBottom = oldPaddingBottom;
            canvas.style.marginLeft = oldMarginLeft;
            canvas.style.marginRight = oldMarginRight;
            canvas.style.marginTop = oldMarginTop;
            canvas.style.marginBottom = oldMarginBottom;
            document.body.style.margin = oldDocumentBodyMargin;
            document.documentElement.style.overflow = oldDocumentOverflow;
            document.body.scroll = oldDocumentScroll;
            canvas.style.imageRendering = oldImageRendering;
            if (canvas.GLctxObject) canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
            if (__currentFullscreenStrategy.canvasResizedCallback) {
                wasmTable.get(__currentFullscreenStrategy.canvasResizedCallback)(37, 0, __currentFullscreenStrategy.canvasResizedCallbackUserData);
            }
        }
    }
    document.addEventListener("fullscreenchange", restoreOldStyle);
    document.addEventListener("webkitfullscreenchange", restoreOldStyle);
    return restoreOldStyle;
}
function __restoreHiddenElements(hiddenElements) {
    for (var i = 0; i < hiddenElements.length; ++i) {
        hiddenElements[i].node.style.display = hiddenElements[i].displayState;
    }
}
var __currentFullscreenStrategy = {};
function __softFullscreenResizeWebGLRenderTarget() {
    var dpr = devicePixelRatio;
    var inHiDPIFullscreenMode = __currentFullscreenStrategy.canvasResolutionScaleMode == 2;
    var inAspectRatioFixedFullscreenMode = __currentFullscreenStrategy.scaleMode == 2;
    var inPixelPerfectFullscreenMode = __currentFullscreenStrategy.canvasResolutionScaleMode != 0;
    var inCenteredWithoutScalingFullscreenMode = __currentFullscreenStrategy.scaleMode == 3;
    var screenWidth = inHiDPIFullscreenMode ? Math.round(innerWidth * dpr) : innerWidth;
    var screenHeight = inHiDPIFullscreenMode ? Math.round(innerHeight * dpr) : innerHeight;
    var w = screenWidth;
    var h = screenHeight;
    var canvas = __currentFullscreenStrategy.target;
    var canvasSize = __get_canvas_element_size(canvas);
    var x = canvasSize[0];
    var y = canvasSize[1];
    var topMargin;
    if (inAspectRatioFixedFullscreenMode) {
        if (w * y < x * h) h = ((w * y) / x) | 0;
        else if (w * y > x * h) w = ((h * x) / y) | 0;
        topMargin = ((screenHeight - h) / 2) | 0;
    }
    if (inPixelPerfectFullscreenMode) {
        __set_canvas_element_size(canvas, w, h);
        if (canvas.GLctxObject) canvas.GLctxObject.GLctx.viewport(0, 0, w, h);
    }
    if (inHiDPIFullscreenMode) {
        topMargin /= dpr;
        w /= dpr;
        h /= dpr;
        w = Math.round(w * 1e4) / 1e4;
        h = Math.round(h * 1e4) / 1e4;
        topMargin = Math.round(topMargin * 1e4) / 1e4;
    }
    if (inCenteredWithoutScalingFullscreenMode) {
        var t = (innerHeight - jstoi_q(canvas.style.height)) / 2;
        var b = (innerWidth - jstoi_q(canvas.style.width)) / 2;
        __setLetterbox(canvas, t, b);
    } else {
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        var b = (innerWidth - w) / 2;
        __setLetterbox(canvas, topMargin, b);
    }
    if (!inCenteredWithoutScalingFullscreenMode && __currentFullscreenStrategy.canvasResizedCallback) {
        wasmTable.get(__currentFullscreenStrategy.canvasResizedCallback)(37, 0, __currentFullscreenStrategy.canvasResizedCallbackUserData);
    }
}
function __getBoundingClientRect(e) {
    return specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : { left: 0, top: 0 };
}
function _JSEvents_resizeCanvasForFullscreen(target, strategy) {
    var restoreOldStyle = __registerRestoreOldStyle(target);
    var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
    var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
    var rect = __getBoundingClientRect(target);
    var windowedCssWidth = rect.width;
    var windowedCssHeight = rect.height;
    var canvasSize = __get_canvas_element_size(target);
    var windowedRttWidth = canvasSize[0];
    var windowedRttHeight = canvasSize[1];
    if (strategy.scaleMode == 3) {
        __setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
        cssWidth = windowedCssWidth;
        cssHeight = windowedCssHeight;
    } else if (strategy.scaleMode == 2) {
        if (cssWidth * windowedRttHeight < windowedRttWidth * cssHeight) {
            var desiredCssHeight = (windowedRttHeight * cssWidth) / windowedRttWidth;
            __setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
            cssHeight = desiredCssHeight;
        } else {
            var desiredCssWidth = (windowedRttWidth * cssHeight) / windowedRttHeight;
            __setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
            cssWidth = desiredCssWidth;
        }
    }
    if (!target.style.backgroundColor) target.style.backgroundColor = "black";
    if (!document.body.style.backgroundColor) document.body.style.backgroundColor = "black";
    target.style.width = cssWidth + "px";
    target.style.height = cssHeight + "px";
    if (strategy.filteringMode == 1) {
        target.style.imageRendering = "optimizeSpeed";
        target.style.imageRendering = "-moz-crisp-edges";
        target.style.imageRendering = "-o-crisp-edges";
        target.style.imageRendering = "-webkit-optimize-contrast";
        target.style.imageRendering = "optimize-contrast";
        target.style.imageRendering = "crisp-edges";
        target.style.imageRendering = "pixelated";
    }
    var dpiScale = strategy.canvasResolutionScaleMode == 2 ? devicePixelRatio : 1;
    if (strategy.canvasResolutionScaleMode != 0) {
        var newWidth = (cssWidth * dpiScale) | 0;
        var newHeight = (cssHeight * dpiScale) | 0;
        __set_canvas_element_size(target, newWidth, newHeight);
        if (target.GLctxObject) target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight);
    }
    return restoreOldStyle;
}
function _emscripten_enter_soft_fullscreen(target, fullscreenStrategy) {
    target = findEventTarget(target);
    if (!target) return -4;
    var strategy = {
        scaleMode: HEAP32[fullscreenStrategy >>> 2],
        canvasResolutionScaleMode: HEAP32[(fullscreenStrategy + 4) >>> 2],
        filteringMode: HEAP32[(fullscreenStrategy + 8) >>> 2],
        canvasResizedCallback: HEAP32[(fullscreenStrategy + 12) >>> 2],
        canvasResizedCallbackUserData: HEAP32[(fullscreenStrategy + 16) >>> 2],
        target: target,
        softFullscreen: true,
    };
    var restoreOldStyle = _JSEvents_resizeCanvasForFullscreen(target, strategy);
    document.documentElement.style.overflow = "hidden";
    document.body.scroll = "no";
    document.body.style.margin = "0px";
    var hiddenElements = __hideEverythingExceptGivenElement(target);
    function restoreWindowedState() {
        restoreOldStyle();
        __restoreHiddenElements(hiddenElements);
        removeEventListener("resize", __softFullscreenResizeWebGLRenderTarget);
        if (strategy.canvasResizedCallback) {
            wasmTable.get(strategy.canvasResizedCallback)(37, 0, strategy.canvasResizedCallbackUserData);
        }
        __currentFullscreenStrategy = 0;
    }
    __restoreOldWindowedStyle = restoreWindowedState;
    __currentFullscreenStrategy = strategy;
    addEventListener("resize", __softFullscreenResizeWebGLRenderTarget);
    if (strategy.canvasResizedCallback) {
        wasmTable.get(strategy.canvasResizedCallback)(37, 0, strategy.canvasResizedCallbackUserData);
    }
    return 0;
}
function _emscripten_get_device_pixel_ratio() {
    return (typeof devicePixelRatio === "number" && devicePixelRatio) || 1;
}
var IDBStore = {
    indexedDB: function () {
        if (typeof indexedDB !== "undefined") return indexedDB;
        var ret = null;
        if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, "IDBStore used, but indexedDB not supported");
        return ret;
    },
    DB_VERSION: 22,
    DB_STORE_NAME: "FILE_DATA",
    dbs: {},
    blobs: [0],
    getDB: function (name, callback) {
        var db = IDBStore.dbs[name];
        if (db) {
            return callback(null, db);
        }
        var req;
        try {
            req = IDBStore.indexedDB().open(name, IDBStore.DB_VERSION);
        } catch (e) {
            return callback(e);
        }
        req.onupgradeneeded = function (e) {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBStore.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBStore.DB_STORE_NAME);
            } else {
                fileStore = db.createObjectStore(IDBStore.DB_STORE_NAME);
            }
        };
        req.onsuccess = function () {
            db = req.result;
            IDBStore.dbs[name] = db;
            callback(null, db);
        };
        req.onerror = function (e) {
            callback(this.error);
            e.preventDefault();
        };
    },
    getStore: function (dbName, type, callback) {
        IDBStore.getDB(dbName, function (error, db) {
            if (error) return callback(error);
            var transaction = db.transaction([IDBStore.DB_STORE_NAME], type);
            transaction.onerror = function (e) {
                callback(this.error || "unknown error");
                e.preventDefault();
            };
            var store = transaction.objectStore(IDBStore.DB_STORE_NAME);
            callback(null, store);
        });
    },
    getFile: function (dbName, id, callback) {
        IDBStore.getStore(dbName, "readonly", function (err, store) {
            if (err) return callback(err);
            var req = store.get(id);
            req.onsuccess = function (event) {
                var result = event.target.result;
                if (!result) {
                    return callback("file " + id + " not found");
                } else {
                    return callback(null, result);
                }
            };
            req.onerror = function (error) {
                callback(error);
            };
        });
    },
    setFile: function (dbName, id, data, callback) {
        IDBStore.getStore(dbName, "readwrite", function (err, store) {
            if (err) return callback(err);
            var req = store.put(data, id);
            req.onsuccess = function (event) {
                callback();
            };
            req.onerror = function (error) {
                callback(error);
            };
        });
    },
    deleteFile: function (dbName, id, callback) {
        IDBStore.getStore(dbName, "readwrite", function (err, store) {
            if (err) return callback(err);
            var req = store.delete(id);
            req.onsuccess = function (event) {
                callback();
            };
            req.onerror = function (error) {
                callback(error);
            };
        });
    },
    existsFile: function (dbName, id, callback) {
        IDBStore.getStore(dbName, "readonly", function (err, store) {
            if (err) return callback(err);
            var req = store.count(id);
            req.onsuccess = function (event) {
                callback(null, event.target.result > 0);
            };
            req.onerror = function (error) {
                callback(error);
            };
        });
    },
};
function _emscripten_idb_async_exists(db, id, arg, oncheck, onerror) {
    IDBStore.existsFile(UTF8ToString(db), UTF8ToString(id), function (error, exists) {
        if (error) {
            if (onerror) wasmTable.get(onerror)(arg);
            return;
        }
        if (oncheck) wasmTable.get(oncheck)(arg, exists);
    });
}
function _emscripten_idb_async_load(db, id, arg, onload, onerror) {
    IDBStore.getFile(UTF8ToString(db), UTF8ToString(id), function (error, byteArray) {
        if (error) {
            if (onerror) wasmTable.get(onerror)(arg);
            return;
        }
        var buffer = _malloc(byteArray.length);
        HEAPU8.set(byteArray, buffer >>> 0);
        wasmTable.get(onload)(arg, buffer, byteArray.length);
        _free(buffer);
    });
}
function _emscripten_idb_async_store(db, id, ptr, num, arg, onstore, onerror) {
    IDBStore.setFile(UTF8ToString(db), UTF8ToString(id), new Uint8Array(HEAPU8.subarray(ptr >>> 0, (ptr + num) >>> 0)), function (error) {
        if (error) {
            if (onerror) wasmTable.get(onerror)(arg);
            return;
        }
        if (onstore) wasmTable.get(onstore)(arg);
    });
}
function _longjmp(env, value) {
    _setThrew(env, value || 1);
    throw "longjmp";
}
function _emscripten_longjmp(a0, a1) {
    return _longjmp(a0, a1);
}
function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest >>> 0, src >>> 0, (src + num) >>> 0);
}
function _emscripten_get_heap_size() {
    return HEAPU8.length;
}
function emscripten_realloc_buffer(size) {
    try {
        wasmMemory.grow((size - buffer.byteLength + 65535) >>> 16);
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1;
    } catch (e) {}
}
function _emscripten_resize_heap(requestedSize) {
    requestedSize = requestedSize >>> 0;
    var oldSize = _emscripten_get_heap_size();
    var maxHeapSize = 4294967296;
    if (requestedSize > maxHeapSize) {
        return false;
    }
    var minHeapSize = 16777216;
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(minHeapSize, requestedSize, overGrownHeapSize), 65536));
        var replacement = emscripten_realloc_buffer(newSize);
        if (replacement) {
            return true;
        }
    }
    return false;
}
function _emscripten_run_script_string(ptr) {
    var s = eval(UTF8ToString(ptr));
    if (s == null) {
        return 0;
    }
    s += "";
    var me = _emscripten_run_script_string;
    var len = lengthBytesUTF8(s);
    if (!me.bufferSize || me.bufferSize < len + 1) {
        if (me.bufferSize) _free(me.buffer);
        me.bufferSize = len + 1;
        me.buffer = _malloc(me.bufferSize);
    }
    stringToUTF8(s, me.buffer, me.bufferSize);
    return me.buffer;
}
function __registerKeyEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.keyEvent) JSEvents.keyEvent = _malloc(164);
    var keyEventHandlerFunc = function (e) {
        var keyEventData = JSEvents.keyEvent;
        var idx = keyEventData >> 2;
        HEAP32[(idx + 0) >>> 0] = e.location;
        HEAP32[(idx + 1) >>> 0] = e.ctrlKey;
        HEAP32[(idx + 2) >>> 0] = e.shiftKey;
        HEAP32[(idx + 3) >>> 0] = e.altKey;
        HEAP32[(idx + 4) >>> 0] = e.metaKey;
        HEAP32[(idx + 5) >>> 0] = e.repeat;
        HEAP32[(idx + 6) >>> 0] = e.charCode;
        HEAP32[(idx + 7) >>> 0] = e.keyCode;
        HEAP32[(idx + 8) >>> 0] = e.which;
        stringToUTF8(e.key || "", keyEventData + 36, 32);
        stringToUTF8(e.code || "", keyEventData + 68, 32);
        stringToUTF8(e.char || "", keyEventData + 100, 32);
        stringToUTF8(e.locale || "", keyEventData + 132, 32);
        if (wasmTable.get(callbackfunc)(eventTypeId, keyEventData, userData)) e.preventDefault();
    };
    var eventHandler = { target: findEventTarget(target), allowsDeferredCalls: true, eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: keyEventHandlerFunc, useCapture: useCapture };
    JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
    return 0;
}
function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
    return 0;
}
function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
    var browserIterationFunc = function () {
        wasmTable.get(func)();
    };
    setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming);
}
function __fillMouseEventData(eventStruct, e, target) {
    var idx = eventStruct >> 2;
    HEAP32[(idx + 0) >>> 0] = e.screenX;
    HEAP32[(idx + 1) >>> 0] = e.screenY;
    HEAP32[(idx + 2) >>> 0] = e.clientX;
    HEAP32[(idx + 3) >>> 0] = e.clientY;
    HEAP32[(idx + 4) >>> 0] = e.ctrlKey;
    HEAP32[(idx + 5) >>> 0] = e.shiftKey;
    HEAP32[(idx + 6) >>> 0] = e.altKey;
    HEAP32[(idx + 7) >>> 0] = e.metaKey;
    HEAP16[(idx * 2 + 16) >>> 0] = e.button;
    HEAP16[(idx * 2 + 17) >>> 0] = e.buttons;
    HEAP32[(idx + 9) >>> 0] = e["movementX"];
    HEAP32[(idx + 10) >>> 0] = e["movementY"];
    var rect = __getBoundingClientRect(target);
    HEAP32[(idx + 11) >>> 0] = e.clientX - rect.left;
    HEAP32[(idx + 12) >>> 0] = e.clientY - rect.top;
}
function __registerMouseEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.mouseEvent) JSEvents.mouseEvent = _malloc(64);
    target = findEventTarget(target);
    var mouseEventHandlerFunc = function (ev) {
        var e = ev || event;
        __fillMouseEventData(JSEvents.mouseEvent, e, target);
        if (wasmTable.get(callbackfunc)(eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault();
    };
    var eventHandler = {
        target: target,
        allowsDeferredCalls: eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave",
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: mouseEventHandlerFunc,
        useCapture: useCapture,
    };
    JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
    return 0;
}
function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
    return 0;
}
function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
    return 0;
}
function __registerTouchEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.touchEvent) JSEvents.touchEvent = _malloc(1684);
    target = findEventTarget(target);
    var touchEventHandlerFunc = function (e) {
        var touches = {};
        var et = e.touches;
        for (var i = 0; i < et.length; ++i) {
            var touch = et[i];
            touches[touch.identifier] = touch;
        }
        et = e.changedTouches;
        for (var i = 0; i < et.length; ++i) {
            var touch = et[i];
            touch.isChanged = 1;
            touches[touch.identifier] = touch;
        }
        et = e.targetTouches;
        for (var i = 0; i < et.length; ++i) {
            touches[et[i].identifier].onTarget = 1;
        }
        var touchEvent = JSEvents.touchEvent;
        var idx = touchEvent >> 2;
        HEAP32[(idx + 1) >>> 0] = e.ctrlKey;
        HEAP32[(idx + 2) >>> 0] = e.shiftKey;
        HEAP32[(idx + 3) >>> 0] = e.altKey;
        HEAP32[(idx + 4) >>> 0] = e.metaKey;
        idx += 5;
        var targetRect = __getBoundingClientRect(target);
        var numTouches = 0;
        for (var i in touches) {
            var t = touches[i];
            HEAP32[(idx + 0) >>> 0] = t.identifier;
            HEAP32[(idx + 1) >>> 0] = t.screenX;
            HEAP32[(idx + 2) >>> 0] = t.screenY;
            HEAP32[(idx + 3) >>> 0] = t.clientX;
            HEAP32[(idx + 4) >>> 0] = t.clientY;
            HEAP32[(idx + 5) >>> 0] = t.pageX;
            HEAP32[(idx + 6) >>> 0] = t.pageY;
            HEAP32[(idx + 7) >>> 0] = t.isChanged;
            HEAP32[(idx + 8) >>> 0] = t.onTarget;
            HEAP32[(idx + 9) >>> 0] = t.clientX - targetRect.left;
            HEAP32[(idx + 10) >>> 0] = t.clientY - targetRect.top;
            idx += 13;
            if (++numTouches > 31) {
                break;
            }
        }
        HEAP32[touchEvent >>> 2] = numTouches;
        if (wasmTable.get(callbackfunc)(eventTypeId, touchEvent, userData)) e.preventDefault();
    };
    var eventHandler = {
        target: target,
        allowsDeferredCalls: eventTypeString == "touchstart" || eventTypeString == "touchend",
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: touchEventHandlerFunc,
        useCapture: useCapture,
    };
    JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
    return 0;
}
function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
    return 0;
}
function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
    return 0;
}
function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
    return 0;
}
function __fillVisibilityChangeEventData(eventStruct) {
    var visibilityStates = ["hidden", "visible", "prerender", "unloaded"];
    var visibilityState = visibilityStates.indexOf(document.visibilityState);
    HEAP32[eventStruct >>> 2] = document.hidden;
    HEAP32[(eventStruct + 4) >>> 2] = visibilityState;
}
function __registerVisibilityChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.visibilityChangeEvent) JSEvents.visibilityChangeEvent = _malloc(8);
    var visibilityChangeEventHandlerFunc = function (ev) {
        var e = ev || event;
        var visibilityChangeEvent = JSEvents.visibilityChangeEvent;
        __fillVisibilityChangeEventData(visibilityChangeEvent);
        if (wasmTable.get(callbackfunc)(eventTypeId, visibilityChangeEvent, userData)) e.preventDefault();
    };
    var eventHandler = { target: target, eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: visibilityChangeEventHandlerFunc, useCapture: useCapture };
    JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_visibilitychange_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
    if (!specialHTMLTargets[1]) {
        return -4;
    }
    __registerVisibilityChangeEventCallback(specialHTMLTargets[1], userData, useCapture, callbackfunc, 21, "visibilitychange", targetThread);
    return 0;
}
function __registerWheelEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.wheelEvent) JSEvents.wheelEvent = _malloc(96);
    var wheelHandlerFunc = function (ev) {
        var e = ev || event;
        var wheelEvent = JSEvents.wheelEvent;
        __fillMouseEventData(wheelEvent, e, target);
        HEAPF64[(wheelEvent + 64) >>> 3] = e["deltaX"];
        HEAPF64[(wheelEvent + 72) >>> 3] = e["deltaY"];
        HEAPF64[(wheelEvent + 80) >>> 3] = e["deltaZ"];
        HEAP32[(wheelEvent + 88) >>> 2] = e["deltaMode"];
        if (wasmTable.get(callbackfunc)(eventTypeId, wheelEvent, userData)) e.preventDefault();
    };
    var eventHandler = { target: target, allowsDeferredCalls: true, eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: wheelHandlerFunc, useCapture: useCapture };
    JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = findEventTarget(target);
    if (typeof target.onwheel !== "undefined") {
        __registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
        return 0;
    } else {
        return -1;
    }
}
var ENV = {};
function getExecutableName() {
    return thisProgram || "./this.program";
}
function getEnvStrings() {
    if (!getEnvStrings.strings) {
        var lang = ((typeof navigator === "object" && navigator.languages && navigator.languages[0]) || "C").replace("-", "_") + ".UTF-8";
        var env = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: lang, _: getExecutableName() };
        for (var x in ENV) {
            env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
            strings.push(x + "=" + env[x]);
        }
        getEnvStrings.strings = strings;
    }
    return getEnvStrings.strings;
}
function _environ_get(__environ, environ_buf) {
    try {
        var bufSize = 0;
        getEnvStrings().forEach(function (string, i) {
            var ptr = environ_buf + bufSize;
            HEAP32[(__environ + i * 4) >>> 2] = ptr;
            writeAsciiToMemory(string, ptr);
            bufSize += string.length + 1;
        });
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
    }
}
function _environ_sizes_get(penviron_count, penviron_buf_size) {
    try {
        var strings = getEnvStrings();
        HEAP32[penviron_count >>> 2] = strings.length;
        var bufSize = 0;
        strings.forEach(function (string) {
            bufSize += string.length + 1;
        });
        HEAP32[penviron_buf_size >>> 2] = bufSize;
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
    }
}
function _exit(status) {
    exit(status);
}
function _fd_close(fd) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
    }
}
function _fd_read(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doReadv(stream, iov, iovcnt);
        HEAP32[pnum >>> 2] = num;
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
    }
}
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var HIGH_OFFSET = 4294967296;
        var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
        var DOUBLE_LIMIT = 9007199254740992;
        if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
            return -61;
        }
        FS.llseek(stream, offset, whence);
        (tempI64 = [
            stream.position >>> 0,
            ((tempDouble = stream.position),
            +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[newOffset >>> 2] = tempI64[0]),
            (HEAP32[(newOffset + 4) >>> 2] = tempI64[1]);
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
    }
}
function _fd_write(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doWritev(stream, iov, iovcnt);
        HEAP32[pnum >>> 2] = num;
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
    }
}
function _getTempRet0() {
    return getTempRet0() | 0;
}
function _getaddrinfo(node, service, hint, out) {
    var addr = 0;
    var port = 0;
    var flags = 0;
    var family = 0;
    var type = 0;
    var proto = 0;
    var ai;
    function allocaddrinfo(family, type, proto, canon, addr, port) {
        var sa, salen, ai;
        var res;
        salen = family === 10 ? 28 : 16;
        addr = family === 10 ? __inet_ntop6_raw(addr) : __inet_ntop4_raw(addr);
        sa = _malloc(salen);
        res = __write_sockaddr(sa, family, addr, port);
        assert(!res.errno);
        ai = _malloc(32);
        HEAP32[(ai + 4) >>> 2] = family;
        HEAP32[(ai + 8) >>> 2] = type;
        HEAP32[(ai + 12) >>> 2] = proto;
        HEAP32[(ai + 24) >>> 2] = canon;
        HEAP32[(ai + 20) >>> 2] = sa;
        if (family === 10) {
            HEAP32[(ai + 16) >>> 2] = 28;
        } else {
            HEAP32[(ai + 16) >>> 2] = 16;
        }
        HEAP32[(ai + 28) >>> 2] = 0;
        return ai;
    }
    if (hint) {
        flags = HEAP32[hint >>> 2];
        family = HEAP32[(hint + 4) >>> 2];
        type = HEAP32[(hint + 8) >>> 2];
        proto = HEAP32[(hint + 12) >>> 2];
    }
    if (type && !proto) {
        proto = type === 2 ? 17 : 6;
    }
    if (!type && proto) {
        type = proto === 17 ? 2 : 1;
    }
    if (proto === 0) {
        proto = 6;
    }
    if (type === 0) {
        type = 1;
    }
    if (!node && !service) {
        return -2;
    }
    if (flags & ~(1 | 2 | 4 | 1024 | 8 | 16 | 32)) {
        return -1;
    }
    if (hint !== 0 && HEAP32[hint >>> 2] & 2 && !node) {
        return -1;
    }
    if (flags & 32) {
        return -2;
    }
    if (type !== 0 && type !== 1 && type !== 2) {
        return -7;
    }
    if (family !== 0 && family !== 2 && family !== 10) {
        return -6;
    }
    if (service) {
        service = UTF8ToString(service);
        port = parseInt(service, 10);
        if (isNaN(port)) {
            if (flags & 1024) {
                return -2;
            }
            return -8;
        }
    }
    if (!node) {
        if (family === 0) {
            family = 2;
        }
        if ((flags & 1) === 0) {
            if (family === 2) {
                addr = _htonl(2130706433);
            } else {
                addr = [0, 0, 0, 1];
            }
        }
        ai = allocaddrinfo(family, type, proto, null, addr, port);
        HEAP32[out >>> 2] = ai;
        return 0;
    }
    node = UTF8ToString(node);
    addr = __inet_pton4_raw(node);
    if (addr !== null) {
        if (family === 0 || family === 2) {
            family = 2;
        } else if (family === 10 && flags & 8) {
            addr = [0, 0, _htonl(65535), addr];
            family = 10;
        } else {
            return -2;
        }
    } else {
        addr = __inet_pton6_raw(node);
        if (addr !== null) {
            if (family === 0 || family === 10) {
                family = 10;
            } else {
                return -2;
            }
        }
    }
    if (addr != null) {
        ai = allocaddrinfo(family, type, proto, node, addr, port);
        HEAP32[out >>> 2] = ai;
        return 0;
    }
    if (flags & 4) {
        return -2;
    }
    node = DNS.lookup_name(node);
    addr = __inet_pton4_raw(node);
    if (family === 0) {
        family = 2;
    } else if (family === 10) {
        addr = [0, 0, _htonl(65535), addr];
    }
    ai = allocaddrinfo(family, type, proto, null, addr, port);
    HEAP32[out >>> 2] = ai;
    return 0;
}
function __webgl_enable_ANGLE_instanced_arrays(ctx) {
    var ext = ctx.getExtension("ANGLE_instanced_arrays");
    if (ext) {
        ctx["vertexAttribDivisor"] = function (index, divisor) {
            ext["vertexAttribDivisorANGLE"](index, divisor);
        };
        ctx["drawArraysInstanced"] = function (mode, first, count, primcount) {
            ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
        };
        ctx["drawElementsInstanced"] = function (mode, count, type, indices, primcount) {
            ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
        };
        return 1;
    }
}
function __webgl_enable_OES_vertex_array_object(ctx) {
    var ext = ctx.getExtension("OES_vertex_array_object");
    if (ext) {
        ctx["createVertexArray"] = function () {
            return ext["createVertexArrayOES"]();
        };
        ctx["deleteVertexArray"] = function (vao) {
            ext["deleteVertexArrayOES"](vao);
        };
        ctx["bindVertexArray"] = function (vao) {
            ext["bindVertexArrayOES"](vao);
        };
        ctx["isVertexArray"] = function (vao) {
            return ext["isVertexArrayOES"](vao);
        };
        return 1;
    }
}
function __webgl_enable_WEBGL_draw_buffers(ctx) {
    var ext = ctx.getExtension("WEBGL_draw_buffers");
    if (ext) {
        ctx["drawBuffers"] = function (n, bufs) {
            ext["drawBuffersWEBGL"](n, bufs);
        };
        return 1;
    }
}
function __webgl_enable_WEBGL_multi_draw(ctx) {
    return !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));
}
var GL = {
    counter: 1,
    buffers: [],
    programs: [],
    framebuffers: [],
    renderbuffers: [],
    textures: [],
    uniforms: [],
    shaders: [],
    vaos: [],
    contexts: [],
    offscreenCanvases: {},
    timerQueriesEXT: [],
    programInfos: {},
    stringCache: {},
    unpackAlignment: 4,
    recordError: function recordError(errorCode) {
        if (!GL.lastError) {
            GL.lastError = errorCode;
        }
    },
    getNewId: function (table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
            table[i] = null;
        }
        return ret;
    },
    getSource: function (shader, count, string, length) {
        var source = "";
        for (var i = 0; i < count; ++i) {
            var len = length ? HEAP32[(length + i * 4) >>> 2] : -1;
            source += UTF8ToString(HEAP32[(string + i * 4) >>> 2], len < 0 ? undefined : len);
        }
        return source;
    },
    createContext: function (canvas, webGLContextAttributes) {
        var ctx = canvas.getContext("webgl", webGLContextAttributes);
        if (!ctx) return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle;
    },
    registerContext: function (ctx, webGLContextAttributes) {
        var handle = GL.getNewId(GL.contexts);
        var context = { handle: handle, attributes: webGLContextAttributes, version: webGLContextAttributes.majorVersion, GLctx: ctx };
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
            GL.initExtensions(context);
        }
        return handle;
    },
    makeContextCurrent: function (contextHandle) {
        GL.currentContext = GL.contexts[contextHandle];
        Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
        return !(contextHandle && !GLctx);
    },
    getContext: function (contextHandle) {
        return GL.contexts[contextHandle];
    },
    deleteContext: function (contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
        if (typeof JSEvents === "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        GL.contexts[contextHandle] = null;
    },
    initExtensions: function (context) {
        if (!context) context = GL.currentContext;
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        __webgl_enable_ANGLE_instanced_arrays(GLctx);
        __webgl_enable_OES_vertex_array_object(GLctx);
        __webgl_enable_WEBGL_draw_buffers(GLctx);
        GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
        __webgl_enable_WEBGL_multi_draw(GLctx);
        var automaticallyEnabledExtensions = [
            "OES_texture_float",
            "OES_texture_half_float",
            "OES_standard_derivatives",
            "OES_vertex_array_object",
            "WEBGL_compressed_texture_s3tc",
            "WEBGL_depth_texture",
            "OES_element_index_uint",
            "EXT_texture_filter_anisotropic",
            "EXT_frag_depth",
            "WEBGL_draw_buffers",
            "ANGLE_instanced_arrays",
            "OES_texture_float_linear",
            "OES_texture_half_float_linear",
            "EXT_blend_minmax",
            "EXT_shader_texture_lod",
            "EXT_texture_norm16",
            "WEBGL_compressed_texture_pvrtc",
            "EXT_color_buffer_half_float",
            "WEBGL_color_buffer_float",
            "EXT_sRGB",
            "WEBGL_compressed_texture_etc1",
            "EXT_disjoint_timer_query",
            "WEBGL_compressed_texture_etc",
            "WEBGL_compressed_texture_astc",
            "EXT_color_buffer_float",
            "WEBGL_compressed_texture_s3tc_srgb",
            "EXT_disjoint_timer_query_webgl2",
            "WEBKIT_WEBGL_compressed_texture_pvrtc",
        ];
        var exts = GLctx.getSupportedExtensions() || [];
        exts.forEach(function (ext) {
            if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
                GLctx.getExtension(ext);
            }
        });
    },
    populateUniformTable: function (program) {
        var p = GL.programs[program];
        var ptable = (GL.programInfos[program] = { uniforms: {}, maxUniformLength: 0, maxAttributeLength: -1, maxUniformBlockNameLength: -1 });
        var utable = ptable.uniforms;
        var numUniforms = GLctx.getProgramParameter(p, 35718);
        for (var i = 0; i < numUniforms; ++i) {
            var u = GLctx.getActiveUniform(p, i);
            var name = u.name;
            ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length + 1);
            if (name.slice(-1) == "]") {
                name = name.slice(0, name.lastIndexOf("["));
            }
            var loc = GLctx.getUniformLocation(p, name);
            if (loc) {
                var id = GL.getNewId(GL.uniforms);
                utable[name] = [u.size, id];
                GL.uniforms[id] = loc;
                for (var j = 1; j < u.size; ++j) {
                    var n = name + "[" + j + "]";
                    loc = GLctx.getUniformLocation(p, n);
                    id = GL.getNewId(GL.uniforms);
                    GL.uniforms[id] = loc;
                }
            }
        }
    },
};
function _glActiveTexture(x0) {
    GLctx["activeTexture"](x0);
}
function _glAttachShader(program, shader) {
    GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
}
function _glBindBuffer(target, buffer) {
    GLctx.bindBuffer(target, GL.buffers[buffer]);
}
function _glBindFramebuffer(target, framebuffer) {
    GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
}
function _glBindRenderbuffer(target, renderbuffer) {
    GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
}
function _glBindTexture(target, texture) {
    GLctx.bindTexture(target, GL.textures[texture]);
}
function _glBindVertexArray(vao) {
    GLctx["bindVertexArray"](GL.vaos[vao]);
}
function _glBlendFuncSeparate(x0, x1, x2, x3) {
    GLctx["blendFuncSeparate"](x0, x1, x2, x3);
}
function _glBufferData(target, size, data, usage) {
    GLctx.bufferData(target, data ? HEAPU8.subarray(data >>> 0, (data + size) >>> 0) : size, usage);
}
function _glBufferSubData(target, offset, size, data) {
    GLctx.bufferSubData(target, offset, HEAPU8.subarray(data >>> 0, (data + size) >>> 0));
}
function _glCheckFramebufferStatus(x0) {
    return GLctx["checkFramebufferStatus"](x0);
}
function _glClear(x0) {
    GLctx["clear"](x0);
}
function _glClearColor(x0, x1, x2, x3) {
    GLctx["clearColor"](x0, x1, x2, x3);
}
function _glCompileShader(shader) {
    GLctx.compileShader(GL.shaders[shader]);
}
function _glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
    GLctx["copyTexImage2D"](x0, x1, x2, x3, x4, x5, x6, x7);
}
function _glCreateProgram() {
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    GL.programs[id] = program;
    return id;
}
function _glCreateShader(shaderType) {
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id;
}
function _glDeleteBuffers(n, buffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(buffers + i * 4) >>> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
    }
}
function _glDeleteFramebuffers(n, framebuffers) {
    for (var i = 0; i < n; ++i) {
        var id = HEAP32[(framebuffers + i * 4) >>> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null;
    }
}
function _glDeleteProgram(id) {
    if (!id) return;
    var program = GL.programs[id];
    if (!program) {
        GL.recordError(1281);
        return;
    }
    GLctx.deleteProgram(program);
    program.name = 0;
    GL.programs[id] = null;
    GL.programInfos[id] = null;
}
function _glDeleteRenderbuffers(n, renderbuffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(renderbuffers + i * 4) >>> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null;
    }
}
function _glDeleteShader(id) {
    if (!id) return;
    var shader = GL.shaders[id];
    if (!shader) {
        GL.recordError(1281);
        return;
    }
    GLctx.deleteShader(shader);
    GL.shaders[id] = null;
}
function _glDeleteTextures(n, textures) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(textures + i * 4) >>> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
    }
}
function _glDeleteVertexArrays(n, vaos) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(vaos + i * 4) >>> 2];
        GLctx["deleteVertexArray"](GL.vaos[id]);
        GL.vaos[id] = null;
    }
}
function _glDisable(x0) {
    GLctx["disable"](x0);
}
function _glDrawElements(mode, count, type, indices) {
    GLctx.drawElements(mode, count, type, indices);
}
function _glEnable(x0) {
    GLctx["enable"](x0);
}
function _glEnableVertexAttribArray(index) {
    GLctx.enableVertexAttribArray(index);
}
function _glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
    GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
}
function _glFramebufferTexture2D(target, attachment, textarget, texture, level) {
    GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
}
function __glGenObject(n, buffers, createFunction, objectTable) {
    for (var i = 0; i < n; i++) {
        var buffer = GLctx[createFunction]();
        var id = buffer && GL.getNewId(objectTable);
        if (buffer) {
            buffer.name = id;
            objectTable[id] = buffer;
        } else {
            GL.recordError(1282);
        }
        HEAP32[(buffers + i * 4) >>> 2] = id;
    }
}
function _glGenBuffers(n, buffers) {
    __glGenObject(n, buffers, "createBuffer", GL.buffers);
}
function _glGenFramebuffers(n, ids) {
    __glGenObject(n, ids, "createFramebuffer", GL.framebuffers);
}
function _glGenRenderbuffers(n, renderbuffers) {
    __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
}
function _glGenTextures(n, textures) {
    __glGenObject(n, textures, "createTexture", GL.textures);
}
function _glGenVertexArrays(n, arrays) {
    __glGenObject(n, arrays, "createVertexArray", GL.vaos);
}
function _glGetAttribLocation(program, name) {
    return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
}
function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >>> 2] = numBytesWrittenExclNull;
}
function _glGetProgramiv(program, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return;
    }
    if (program >= GL.counter) {
        GL.recordError(1281);
        return;
    }
    var ptable = GL.programInfos[program];
    if (!ptable) {
        GL.recordError(1282);
        return;
    }
    if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >>> 2] = log.length + 1;
    } else if (pname == 35719) {
        HEAP32[p >>> 2] = ptable.maxUniformLength;
    } else if (pname == 35722) {
        if (ptable.maxAttributeLength == -1) {
            program = GL.programs[program];
            var numAttribs = GLctx.getProgramParameter(program, 35721);
            ptable.maxAttributeLength = 0;
            for (var i = 0; i < numAttribs; ++i) {
                var activeAttrib = GLctx.getActiveAttrib(program, i);
                ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1);
            }
        }
        HEAP32[p >>> 2] = ptable.maxAttributeLength;
    } else if (pname == 35381) {
        if (ptable.maxUniformBlockNameLength == -1) {
            program = GL.programs[program];
            var numBlocks = GLctx.getProgramParameter(program, 35382);
            ptable.maxUniformBlockNameLength = 0;
            for (var i = 0; i < numBlocks; ++i) {
                var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
                ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length + 1);
            }
        }
        HEAP32[p >>> 2] = ptable.maxUniformBlockNameLength;
    } else {
        HEAP32[p >>> 2] = GLctx.getProgramParameter(GL.programs[program], pname);
    }
}
function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >>> 2] = numBytesWrittenExclNull;
}
function _glGetShaderiv(shader, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return;
    }
    if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = "(unknown error)";
        var logLength = log ? log.length + 1 : 0;
        HEAP32[p >>> 2] = logLength;
    } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[p >>> 2] = sourceLength;
    } else {
        HEAP32[p >>> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
    }
}
function _glGetUniformLocation(program, name) {
    name = UTF8ToString(name);
    var arrayIndex = 0;
    if (name[name.length - 1] == "]") {
        var leftBrace = name.lastIndexOf("[");
        arrayIndex = name[leftBrace + 1] != "]" ? jstoi_q(name.slice(leftBrace + 1)) : 0;
        name = name.slice(0, leftBrace);
    }
    var uniformInfo = GL.programInfos[program] && GL.programInfos[program].uniforms[name];
    if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
        return uniformInfo[1] + arrayIndex;
    } else {
        return -1;
    }
}
function _glLinkProgram(program) {
    GLctx.linkProgram(GL.programs[program]);
    GL.populateUniformTable(program);
}
function computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
    function roundedToNextMultipleOf(x, y) {
        return (x + y - 1) & -y;
    }
    var plainRowSize = width * sizePerPixel;
    var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
    return height * alignedRowSize;
}
function __colorChannelsInGlTextureFormat(format) {
    var colorChannels = { 5: 3, 6: 4, 8: 2, 29502: 3, 29504: 4 };
    return colorChannels[format - 6402] || 1;
}
function heapObjectForWebGLType(type) {
    type -= 5120;
    if (type == 1) return HEAPU8;
    if (type == 4) return HEAP32;
    if (type == 6) return HEAPF32;
    if (type == 5 || type == 28922) return HEAPU32;
    return HEAPU16;
}
function heapAccessShiftForWebGLHeap(heap) {
    return 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
}
function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
    var heap = heapObjectForWebGLType(type);
    var shift = heapAccessShiftForWebGLHeap(heap);
    var byteSize = 1 << shift;
    var sizePerPixel = __colorChannelsInGlTextureFormat(format) * byteSize;
    var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
    return heap.subarray(pixels >>> shift, (pixels + bytes) >>> shift);
}
function _glReadPixels(x, y, width, height, format, type, pixels) {
    var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
    if (!pixelData) {
        GL.recordError(1280);
        return;
    }
    GLctx.readPixels(x, y, width, height, format, type, pixelData);
}
function _glRenderbufferStorage(x0, x1, x2, x3) {
    GLctx["renderbufferStorage"](x0, x1, x2, x3);
}
function _glShaderSource(shader, count, string, length) {
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source);
}
function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null);
}
function _glTexParameteri(x0, x1, x2) {
    GLctx["texParameteri"](x0, x1, x2);
}
function _glUniform1f(location, v0) {
    GLctx.uniform1f(GL.uniforms[location], v0);
}
var miniTempWebGLFloatBuffers = [];
function _glUniform1fv(location, count, value) {
    if (count <= 288) {
        var view = miniTempWebGLFloatBuffers[count - 1];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAPF32[(value + 4 * i) >>> 2];
        }
    } else {
        var view = HEAPF32.subarray(value >>> 2, (value + count * 4) >>> 2);
    }
    GLctx.uniform1fv(GL.uniforms[location], view);
}
function _glUniform1i(location, v0) {
    GLctx.uniform1i(GL.uniforms[location], v0);
}
function _glUniform3f(location, v0, v1, v2) {
    GLctx.uniform3f(GL.uniforms[location], v0, v1, v2);
}
function _glUseProgram(program) {
    GLctx.useProgram(GL.programs[program]);
}
function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
}
function _glViewport(x0, x1, x2, x3) {
    GLctx["viewport"](x0, x1, x2, x3);
}
function stringToNewUTF8(jsString) {
    var length = lengthBytesUTF8(jsString) + 1;
    var cString = _malloc(length);
    stringToUTF8(jsString, cString, length);
    return cString;
}
function _glGetString(name_) {
    if (GL.stringCache[name_]) return GL.stringCache[name_];
    var ret;
    switch (name_) {
        case 7939:
            var exts = GLctx.getSupportedExtensions() || [];
            exts = exts.concat(
                exts.map(function (e) {
                    return "GL_" + e;
                })
            );
            ret = stringToNewUTF8(exts.join(" "));
            break;
        case 7936:
        case 7937:
        case 37445:
        case 37446:
            var s = GLctx.getParameter(name_);
            if (!s) {
                GL.recordError(1280);
            }
            ret = stringToNewUTF8(s);
            break;
        case 7938:
            var glVersion = GLctx.getParameter(7938);
            {
                glVersion = "OpenGL ES 2.0 (" + glVersion + ")";
            }
            ret = stringToNewUTF8(glVersion);
            break;
        case 35724:
            var glslVersion = GLctx.getParameter(35724);
            var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
            var ver_num = glslVersion.match(ver_re);
            if (ver_num !== null) {
                if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
                glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")";
            }
            ret = stringToNewUTF8(glslVersion);
            break;
        default:
            GL.recordError(1280);
            return 0;
    }
    GL.stringCache[name_] = ret;
    return ret;
}
var GLEW = {
    isLinaroFork: 1,
    extensions: null,
    error: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
    version: { 1: null, 2: null, 3: null, 4: null },
    errorStringConstantFromCode: function (error) {
        if (GLEW.isLinaroFork) {
            switch (error) {
                case 4:
                    return "OpenGL ES lib expected, found OpenGL lib";
                case 5:
                    return "OpenGL lib expected, found OpenGL ES lib";
                case 6:
                    return "Missing EGL version";
                case 7:
                    return "EGL 1.1 and up are supported";
                default:
                    break;
            }
        }
        switch (error) {
            case 0:
                return "No error";
            case 1:
                return "Missing GL version";
            case 2:
                return "GL 1.1 and up are supported";
            case 3:
                return "GLX 1.2 and up are supported";
            default:
                return null;
        }
    },
    errorString: function (error) {
        if (!GLEW.error[error]) {
            var string = GLEW.errorStringConstantFromCode(error);
            if (!string) {
                string = "Unknown error";
                error = 8;
            }
            GLEW.error[error] = allocate(intArrayFromString(string), ALLOC_NORMAL);
        }
        return GLEW.error[error];
    },
    versionStringConstantFromCode: function (name) {
        switch (name) {
            case 1:
                return "1.10.0";
            case 2:
                return "1";
            case 3:
                return "10";
            case 4:
                return "0";
            default:
                return null;
        }
    },
    versionString: function (name) {
        if (!GLEW.version[name]) {
            var string = GLEW.versionStringConstantFromCode(name);
            if (!string) return 0;
            GLEW.version[name] = allocate(intArrayFromString(string), ALLOC_NORMAL);
        }
        return GLEW.version[name];
    },
    extensionIsSupported: function (name) {
        if (!GLEW.extensions) {
            GLEW.extensions = UTF8ToString(_glGetString(7939)).split(" ");
        }
        if (GLEW.extensions.indexOf(name) != -1) return 1;
        return GLEW.extensions.indexOf("GL_" + name) != -1;
    },
};
function _glewInit() {
    return 0;
}
function GLFW_Window(id, width, height, title, monitor, share) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.fullscreen = false;
    this.storedX = 0;
    this.storedY = 0;
    this.width = width;
    this.height = height;
    this.storedWidth = width;
    this.storedHeight = height;
    this.title = title;
    this.monitor = monitor;
    this.share = share;
    this.attributes = GLFW.hints;
    this.inputModes = { 208897: 212993, 208898: 0, 208899: 0 };
    this.buttons = 0;
    this.keys = new Array();
    this.domKeys = new Array();
    this.shouldClose = 0;
    this.title = null;
    this.windowPosFunc = null;
    this.windowSizeFunc = null;
    this.windowCloseFunc = null;
    this.windowRefreshFunc = null;
    this.windowFocusFunc = null;
    this.windowIconifyFunc = null;
    this.framebufferSizeFunc = null;
    this.mouseButtonFunc = null;
    this.cursorPosFunc = null;
    this.cursorEnterFunc = null;
    this.scrollFunc = null;
    this.dropFunc = null;
    this.keyFunc = null;
    this.charFunc = null;
    this.userptr = null;
}
var GLFW = {
    WindowFromId: function (id) {
        if (id <= 0 || !GLFW.windows) return null;
        return GLFW.windows[id - 1];
    },
    joystickFunc: null,
    errorFunc: null,
    monitorFunc: null,
    active: null,
    windows: null,
    monitors: null,
    monitorString: null,
    versionString: null,
    initialTime: null,
    extensions: null,
    hints: null,
    defaultHints: {
        131073: 0,
        131074: 0,
        131075: 1,
        131076: 1,
        131077: 1,
        135169: 8,
        135170: 8,
        135171: 8,
        135172: 8,
        135173: 24,
        135174: 8,
        135175: 0,
        135176: 0,
        135177: 0,
        135178: 0,
        135179: 0,
        135180: 0,
        135181: 0,
        135182: 0,
        135183: 0,
        139265: 196609,
        139266: 1,
        139267: 0,
        139268: 0,
        139269: 0,
        139270: 0,
        139271: 0,
        139272: 0,
    },
    DOMToGLFWKeyCode: function (keycode) {
        switch (keycode) {
            case 32:
                return 32;
            case 222:
                return 39;
            case 188:
                return 44;
            case 173:
                return 45;
            case 189:
                return 45;
            case 190:
                return 46;
            case 191:
                return 47;
            case 48:
                return 48;
            case 49:
                return 49;
            case 50:
                return 50;
            case 51:
                return 51;
            case 52:
                return 52;
            case 53:
                return 53;
            case 54:
                return 54;
            case 55:
                return 55;
            case 56:
                return 56;
            case 57:
                return 57;
            case 59:
                return 59;
            case 61:
                return 61;
            case 187:
                return 61;
            case 65:
                return 65;
            case 66:
                return 66;
            case 67:
                return 67;
            case 68:
                return 68;
            case 69:
                return 69;
            case 70:
                return 70;
            case 71:
                return 71;
            case 72:
                return 72;
            case 73:
                return 73;
            case 74:
                return 74;
            case 75:
                return 75;
            case 76:
                return 76;
            case 77:
                return 77;
            case 78:
                return 78;
            case 79:
                return 79;
            case 80:
                return 80;
            case 81:
                return 81;
            case 82:
                return 82;
            case 83:
                return 83;
            case 84:
                return 84;
            case 85:
                return 85;
            case 86:
                return 86;
            case 87:
                return 87;
            case 88:
                return 88;
            case 89:
                return 89;
            case 90:
                return 90;
            case 219:
                return 91;
            case 220:
                return 92;
            case 221:
                return 93;
            case 192:
                return 94;
            case 27:
                return 256;
            case 13:
                return 257;
            case 9:
                return 258;
            case 8:
                return 259;
            case 45:
                return 260;
            case 46:
                return 261;
            case 39:
                return 262;
            case 37:
                return 263;
            case 40:
                return 264;
            case 38:
                return 265;
            case 33:
                return 266;
            case 34:
                return 267;
            case 36:
                return 268;
            case 35:
                return 269;
            case 20:
                return 280;
            case 145:
                return 281;
            case 144:
                return 282;
            case 44:
                return 283;
            case 19:
                return 284;
            case 112:
                return 290;
            case 113:
                return 291;
            case 114:
                return 292;
            case 115:
                return 293;
            case 116:
                return 294;
            case 117:
                return 295;
            case 118:
                return 296;
            case 119:
                return 297;
            case 120:
                return 298;
            case 121:
                return 299;
            case 122:
                return 300;
            case 123:
                return 301;
            case 124:
                return 302;
            case 125:
                return 303;
            case 126:
                return 304;
            case 127:
                return 305;
            case 128:
                return 306;
            case 129:
                return 307;
            case 130:
                return 308;
            case 131:
                return 309;
            case 132:
                return 310;
            case 133:
                return 311;
            case 134:
                return 312;
            case 135:
                return 313;
            case 136:
                return 314;
            case 96:
                return 320;
            case 97:
                return 321;
            case 98:
                return 322;
            case 99:
                return 323;
            case 100:
                return 324;
            case 101:
                return 325;
            case 102:
                return 326;
            case 103:
                return 327;
            case 104:
                return 328;
            case 105:
                return 329;
            case 110:
                return 330;
            case 111:
                return 331;
            case 106:
                return 332;
            case 109:
                return 333;
            case 107:
                return 334;
            case 16:
                return 340;
            case 17:
                return 341;
            case 18:
                return 342;
            case 91:
                return 343;
            case 93:
                return 348;
            default:
                return -1;
        }
    },
    getModBits: function (win) {
        var mod = 0;
        if (win.keys[340]) mod |= 1;
        if (win.keys[341]) mod |= 2;
        if (win.keys[342]) mod |= 4;
        if (win.keys[343]) mod |= 8;
        return mod;
    },
    onKeyPress: function (event) {
        if (!GLFW.active || !GLFW.active.charFunc) return;
        if (event.ctrlKey || event.metaKey) return;
        var charCode = event.charCode;
        if (charCode == 0 || (charCode >= 0 && charCode <= 31)) return;
        wasmTable.get(GLFW.active.charFunc)(GLFW.active.id, charCode);
    },
    onKeyChanged: function (keyCode, status) {
        if (!GLFW.active) return;
        var key = GLFW.DOMToGLFWKeyCode(keyCode);
        if (key == -1) return;
        var repeat = status && GLFW.active.keys[key];
        GLFW.active.keys[key] = status;
        GLFW.active.domKeys[keyCode] = status;
        if (!GLFW.active.keyFunc) return;
        if (repeat) status = 2;
        wasmTable.get(GLFW.active.keyFunc)(GLFW.active.id, key, keyCode, status, GLFW.getModBits(GLFW.active));
    },
    onGamepadConnected: function (event) {
        GLFW.refreshJoysticks();
    },
    onGamepadDisconnected: function (event) {
        GLFW.refreshJoysticks();
    },
    onKeydown: function (event) {
        GLFW.onKeyChanged(event.keyCode, 1);
        if (event.keyCode === 8 || event.keyCode === 9) {
            event.preventDefault();
        }
    },
    onKeyup: function (event) {
        GLFW.onKeyChanged(event.keyCode, 0);
    },
    onBlur: function (event) {
        if (!GLFW.active) return;
        for (var i = 0; i < GLFW.active.domKeys.length; ++i) {
            if (GLFW.active.domKeys[i]) {
                GLFW.onKeyChanged(i, 0);
            }
        }
    },
    onMousemove: function (event) {
        if (!GLFW.active) return;
        Browser.calculateMouseEvent(event);
        if (event.target != Module["canvas"] || !GLFW.active.cursorPosFunc) return;
        wasmTable.get(GLFW.active.cursorPosFunc)(GLFW.active.id, Browser.mouseX, Browser.mouseY);
    },
    DOMToGLFWMouseButton: function (event) {
        var eventButton = event["button"];
        if (eventButton > 0) {
            if (eventButton == 1) {
                eventButton = 2;
            } else {
                eventButton = 1;
            }
        }
        return eventButton;
    },
    onMouseenter: function (event) {
        if (!GLFW.active) return;
        if (event.target != Module["canvas"] || !GLFW.active.cursorEnterFunc) return;
        wasmTable.get(GLFW.active.cursorEnterFunc)(GLFW.active.id, 1);
    },
    onMouseleave: function (event) {
        if (!GLFW.active) return;
        if (event.target != Module["canvas"] || !GLFW.active.cursorEnterFunc) return;
        wasmTable.get(GLFW.active.cursorEnterFunc)(GLFW.active.id, 0);
    },
    onMouseButtonChanged: function (event, status) {
        if (!GLFW.active) return;
        Browser.calculateMouseEvent(event);
        if (event.target != Module["canvas"]) return;
        var eventButton = GLFW.DOMToGLFWMouseButton(event);
        if (status == 1) {
            GLFW.active.buttons |= 1 << eventButton;
            try {
                event.target.setCapture();
            } catch (e) {}
        } else {
            GLFW.active.buttons &= ~(1 << eventButton);
        }
        if (!GLFW.active.mouseButtonFunc) return;
        wasmTable.get(GLFW.active.mouseButtonFunc)(GLFW.active.id, eventButton, status, GLFW.getModBits(GLFW.active));
    },
    onMouseButtonDown: function (event) {
        if (!GLFW.active) return;
        GLFW.onMouseButtonChanged(event, 1);
    },
    onMouseButtonUp: function (event) {
        if (!GLFW.active) return;
        GLFW.onMouseButtonChanged(event, 0);
    },
    onMouseWheel: function (event) {
        var delta = -Browser.getMouseWheelDelta(event);
        delta = delta == 0 ? 0 : delta > 0 ? Math.max(delta, 1) : Math.min(delta, -1);
        GLFW.wheelPos += delta;
        if (!GLFW.active || !GLFW.active.scrollFunc || event.target != Module["canvas"]) return;
        var sx = 0;
        var sy = 0;
        if (event.type == "mousewheel") {
            sx = event.wheelDeltaX;
            sy = event.wheelDeltaY;
        } else {
            sx = event.deltaX;
            sy = event.deltaY;
        }
        wasmTable.get(GLFW.active.scrollFunc)(GLFW.active.id, sx, sy);
        event.preventDefault();
    },
    onCanvasResize: function (width, height) {
        if (!GLFW.active) return;
        var resizeNeeded = true;
        if (document["fullscreen"] || document["fullScreen"] || document["mozFullScreen"] || document["webkitIsFullScreen"]) {
            GLFW.active.storedX = GLFW.active.x;
            GLFW.active.storedY = GLFW.active.y;
            GLFW.active.storedWidth = GLFW.active.width;
            GLFW.active.storedHeight = GLFW.active.height;
            GLFW.active.x = GLFW.active.y = 0;
            GLFW.active.width = screen.width;
            GLFW.active.height = screen.height;
            GLFW.active.fullscreen = true;
        } else if (GLFW.active.fullscreen == true) {
            GLFW.active.x = GLFW.active.storedX;
            GLFW.active.y = GLFW.active.storedY;
            GLFW.active.width = GLFW.active.storedWidth;
            GLFW.active.height = GLFW.active.storedHeight;
            GLFW.active.fullscreen = false;
        } else if (GLFW.active.width != width || GLFW.active.height != height) {
            GLFW.active.width = width;
            GLFW.active.height = height;
        } else {
            resizeNeeded = false;
        }
        if (resizeNeeded) {
            Browser.setCanvasSize(GLFW.active.width, GLFW.active.height, true);
            GLFW.onWindowSizeChanged();
            GLFW.onFramebufferSizeChanged();
        }
    },
    onWindowSizeChanged: function () {
        if (!GLFW.active) return;
        if (!GLFW.active.windowSizeFunc) return;
        wasmTable.get(GLFW.active.windowSizeFunc)(GLFW.active.id, GLFW.active.width, GLFW.active.height);
    },
    onFramebufferSizeChanged: function () {
        if (!GLFW.active) return;
        if (!GLFW.active.framebufferSizeFunc) return;
        wasmTable.get(GLFW.active.framebufferSizeFunc)(GLFW.active.id, GLFW.active.width, GLFW.active.height);
    },
    getTime: function () {
        return _emscripten_get_now() / 1e3;
    },
    setWindowTitle: function (winid, title) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.title = UTF8ToString(title);
        if (GLFW.active.id == win.id) {
            document.title = win.title;
        }
    },
    setJoystickCallback: function (cbfun) {
        GLFW.joystickFunc = cbfun;
        GLFW.refreshJoysticks();
    },
    joys: {},
    lastGamepadState: null,
    lastGamepadStateFrame: null,
    refreshJoysticks: function () {
        if (Browser.mainLoop.currentFrameNumber !== GLFW.lastGamepadStateFrame || !Browser.mainLoop.currentFrameNumber) {
            GLFW.lastGamepadState = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads : null;
            GLFW.lastGamepadStateFrame = Browser.mainLoop.currentFrameNumber;
            for (var joy = 0; joy < GLFW.lastGamepadState.length; ++joy) {
                var gamepad = GLFW.lastGamepadState[joy];
                if (gamepad) {
                    if (!GLFW.joys[joy]) {
                        console.log("glfw joystick connected:", joy);
                        GLFW.joys[joy] = {
                            id: allocate(intArrayFromString(gamepad.id), ALLOC_NORMAL),
                            buttonsCount: gamepad.buttons.length,
                            axesCount: gamepad.axes.length,
                            buttons: allocate(new Array(gamepad.buttons.length), ALLOC_NORMAL),
                            axes: allocate(new Array(gamepad.axes.length * 4), "float", ALLOC_NORMAL),
                        };
                        if (GLFW.joystickFunc) {
                            wasmTable.get(GLFW.joystickFunc)(joy, 262145);
                        }
                    }
                    var data = GLFW.joys[joy];
                    for (var i = 0; i < gamepad.buttons.length; ++i) {
                        setValue(data.buttons + i, gamepad.buttons[i].pressed, "i8");
                    }
                    for (var i = 0; i < gamepad.axes.length; ++i) {
                        setValue(data.axes + i * 4, gamepad.axes[i], "float");
                    }
                } else {
                    if (GLFW.joys[joy]) {
                        console.log("glfw joystick disconnected", joy);
                        if (GLFW.joystickFunc) {
                            wasmTable.get(GLFW.joystickFunc)(joy, 262146);
                        }
                        _free(GLFW.joys[joy].id);
                        _free(GLFW.joys[joy].buttons);
                        _free(GLFW.joys[joy].axes);
                        delete GLFW.joys[joy];
                    }
                }
            }
        }
    },
    setKeyCallback: function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return null;
        var prevcbfun = win.keyFunc;
        win.keyFunc = cbfun;
        return prevcbfun;
    },
    setCharCallback: function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return null;
        var prevcbfun = win.charFunc;
        win.charFunc = cbfun;
        return prevcbfun;
    },
    setMouseButtonCallback: function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return null;
        var prevcbfun = win.mouseButtonFunc;
        win.mouseButtonFunc = cbfun;
        return prevcbfun;
    },
    setCursorPosCallback: function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return null;
        var prevcbfun = win.cursorPosFunc;
        win.cursorPosFunc = cbfun;
        return prevcbfun;
    },
    setScrollCallback: function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return null;
        var prevcbfun = win.scrollFunc;
        win.scrollFunc = cbfun;
        return prevcbfun;
    },
    setDropCallback: function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return null;
        var prevcbfun = win.dropFunc;
        win.dropFunc = cbfun;
        return prevcbfun;
    },
    onDrop: function (event) {
        if (!GLFW.active || !GLFW.active.dropFunc) return;
        if (!event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length == 0) return;
        event.preventDefault();
        var filenames = allocate(new Array(event.dataTransfer.files.length * 4), ALLOC_NORMAL);
        var filenamesArray = [];
        var count = event.dataTransfer.files.length;
        var written = 0;
        var drop_dir = ".glfw_dropped_files";
        FS.createPath("/", drop_dir);
        function save(file) {
            var path = "/" + drop_dir + "/" + file.name.replace(/\//g, "_");
            var reader = new FileReader();
            reader.onloadend = function (e) {
                if (reader.readyState != 2) {
                    ++written;
                    console.log("failed to read dropped file: " + file.name + ": " + reader.error);
                    return;
                }
                var data = e.target.result;
                FS.writeFile(path, new Uint8Array(data));
                if (++written === count) {
                    wasmTable.get(GLFW.active.dropFunc)(GLFW.active.id, count, filenames);
                    for (var i = 0; i < filenamesArray.length; ++i) {
                        _free(filenamesArray[i]);
                    }
                    _free(filenames);
                }
            };
            reader.readAsArrayBuffer(file);
            var filename = allocate(intArrayFromString(path), ALLOC_NORMAL);
            filenamesArray.push(filename);
            setValue(filenames + i * 4, filename, "i8*");
        }
        for (var i = 0; i < count; ++i) {
            save(event.dataTransfer.files[i]);
        }
        return false;
    },
    onDragover: function (event) {
        if (!GLFW.active || !GLFW.active.dropFunc) return;
        event.preventDefault();
        return false;
    },
    setWindowSizeCallback: function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return null;
        var prevcbfun = win.windowSizeFunc;
        win.windowSizeFunc = cbfun;
        return prevcbfun;
    },
    setWindowCloseCallback: function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return null;
        var prevcbfun = win.windowCloseFunc;
        win.windowCloseFunc = cbfun;
        return prevcbfun;
    },
    setWindowRefreshCallback: function (winid, cbfun) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return null;
        var prevcbfun = win.windowRefreshFunc;
        win.windowRefreshFunc = cbfun;
        return prevcbfun;
    },
    onClickRequestPointerLock: function (e) {
        if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
            Module["canvas"].requestPointerLock();
            e.preventDefault();
        }
    },
    setInputMode: function (winid, mode, value) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        switch (mode) {
            case 208897: {
                switch (value) {
                    case 212993: {
                        win.inputModes[mode] = value;
                        Module["canvas"].removeEventListener("click", GLFW.onClickRequestPointerLock, true);
                        Module["canvas"].exitPointerLock();
                        break;
                    }
                    case 212994: {
                        console.log("glfwSetInputMode called with GLFW_CURSOR_HIDDEN value not implemented.");
                        break;
                    }
                    case 212995: {
                        win.inputModes[mode] = value;
                        Module["canvas"].addEventListener("click", GLFW.onClickRequestPointerLock, true);
                        Module["canvas"].requestPointerLock();
                        break;
                    }
                    default: {
                        console.log("glfwSetInputMode called with unknown value parameter value: " + value + ".");
                        break;
                    }
                }
                break;
            }
            case 208898: {
                console.log("glfwSetInputMode called with GLFW_STICKY_KEYS mode not implemented.");
                break;
            }
            case 208899: {
                console.log("glfwSetInputMode called with GLFW_STICKY_MOUSE_BUTTONS mode not implemented.");
                break;
            }
            default: {
                console.log("glfwSetInputMode called with unknown mode parameter value: " + mode + ".");
                break;
            }
        }
    },
    getKey: function (winid, key) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return 0;
        return win.keys[key];
    },
    getMouseButton: function (winid, button) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return 0;
        return (win.buttons & (1 << button)) > 0;
    },
    getCursorPos: function (winid, x, y) {
        setValue(x, Browser.mouseX, "double");
        setValue(y, Browser.mouseY, "double");
    },
    getMousePos: function (winid, x, y) {
        setValue(x, Browser.mouseX, "i32");
        setValue(y, Browser.mouseY, "i32");
    },
    setCursorPos: function (winid, x, y) {},
    getWindowPos: function (winid, x, y) {
        var wx = 0;
        var wy = 0;
        var win = GLFW.WindowFromId(winid);
        if (win) {
            wx = win.x;
            wy = win.y;
        }
        if (x) {
            setValue(x, wx, "i32");
        }
        if (y) {
            setValue(y, wy, "i32");
        }
    },
    setWindowPos: function (winid, x, y) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        win.x = x;
        win.y = y;
    },
    getWindowSize: function (winid, width, height) {
        var ww = 0;
        var wh = 0;
        var win = GLFW.WindowFromId(winid);
        if (win) {
            ww = win.width;
            wh = win.height;
        }
        if (width) {
            setValue(width, ww, "i32");
        }
        if (height) {
            setValue(height, wh, "i32");
        }
    },
    setWindowSize: function (winid, width, height) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        if (GLFW.active.id == win.id) {
            if (width == screen.width && height == screen.height) {
                Browser.requestFullscreen();
            } else {
                Browser.exitFullscreen();
                Browser.setCanvasSize(width, height);
                win.width = width;
                win.height = height;
            }
        }
        if (!win.windowSizeFunc) return;
        wasmTable.get(win.windowSizeFunc)(win.id, width, height);
    },
    createWindow: function (width, height, title, monitor, share) {
        var i, id;
        for (i = 0; i < GLFW.windows.length && GLFW.windows[i] !== null; i++) {}
        if (i > 0) throw "glfwCreateWindow only supports one window at time currently";
        id = i + 1;
        if (width <= 0 || height <= 0) return 0;
        if (monitor) {
            Browser.requestFullscreen();
        } else {
            Browser.setCanvasSize(width, height);
        }
        for (i = 0; i < GLFW.windows.length && GLFW.windows[i] == null; i++) {}
        if (i == GLFW.windows.length) {
            var contextAttributes = { antialias: GLFW.hints[135181] > 1, depth: GLFW.hints[135173] > 0, stencil: GLFW.hints[135174] > 0, alpha: GLFW.hints[135172] > 0 };
            Module.ctx = Browser.createContext(Module["canvas"], true, true, contextAttributes);
        }
        if (!Module.ctx) return 0;
        var win = new GLFW_Window(id, width, height, title, monitor, share);
        if (id - 1 == GLFW.windows.length) {
            GLFW.windows.push(win);
        } else {
            GLFW.windows[id - 1] = win;
        }
        GLFW.active = win;
        return win.id;
    },
    destroyWindow: function (winid) {
        var win = GLFW.WindowFromId(winid);
        if (!win) return;
        if (win.windowCloseFunc) wasmTable.get(win.windowCloseFunc)(win.id);
        GLFW.windows[win.id - 1] = null;
        if (GLFW.active.id == win.id) GLFW.active = null;
        for (var i = 0; i < GLFW.windows.length; i++) if (GLFW.windows[i] !== null) return;
        Module.ctx = Browser.destroyContext(Module["canvas"], true, true);
    },
    swapBuffers: function (winid) {},
    GLFW2ParamToGLFW3Param: function (param) {
        var table = {
            196609: 0,
            196610: 0,
            196611: 0,
            196612: 0,
            196613: 0,
            196614: 0,
            131073: 0,
            131074: 0,
            131075: 0,
            131076: 0,
            131077: 135169,
            131078: 135170,
            131079: 135171,
            131080: 135172,
            131081: 135173,
            131082: 135174,
            131083: 135183,
            131084: 135175,
            131085: 135176,
            131086: 135177,
            131087: 135178,
            131088: 135179,
            131089: 135180,
            131090: 0,
            131091: 135181,
            131092: 139266,
            131093: 139267,
            131094: 139270,
            131095: 139271,
            131096: 139272,
        };
        return table[param];
    },
};
function _glfwCreateWindow(width, height, title, monitor, share) {
    return GLFW.createWindow(width, height, title, monitor, share);
}
function _glfwDestroyWindow(winid) {
    return GLFW.destroyWindow(winid);
}
function _glfwGetFramebufferSize(winid, width, height) {
    var ww = 0;
    var wh = 0;
    var win = GLFW.WindowFromId(winid);
    if (win) {
        ww = win.width;
        wh = win.height;
    }
    if (width) {
        setValue(width, ww, "i32");
    }
    if (height) {
        setValue(height, wh, "i32");
    }
}
function _glfwGetWindowSize(winid, width, height) {
    GLFW.getWindowSize(winid, width, height);
}
function _glfwInit() {
    if (GLFW.windows) return 1;
    GLFW.initialTime = GLFW.getTime();
    GLFW.hints = GLFW.defaultHints;
    GLFW.windows = new Array();
    GLFW.active = null;
    window.addEventListener("gamepadconnected", GLFW.onGamepadConnected, true);
    window.addEventListener("gamepaddisconnected", GLFW.onGamepadDisconnected, true);
    window.addEventListener("keydown", GLFW.onKeydown, true);
    window.addEventListener("keypress", GLFW.onKeyPress, true);
    window.addEventListener("keyup", GLFW.onKeyup, true);
    window.addEventListener("blur", GLFW.onBlur, true);
    Module["canvas"].addEventListener("touchmove", GLFW.onMousemove, true);
    Module["canvas"].addEventListener("touchstart", GLFW.onMouseButtonDown, true);
    Module["canvas"].addEventListener("touchcancel", GLFW.onMouseButtonUp, true);
    Module["canvas"].addEventListener("touchend", GLFW.onMouseButtonUp, true);
    Module["canvas"].addEventListener("mousemove", GLFW.onMousemove, true);
    Module["canvas"].addEventListener("mousedown", GLFW.onMouseButtonDown, true);
    Module["canvas"].addEventListener("mouseup", GLFW.onMouseButtonUp, true);
    Module["canvas"].addEventListener("wheel", GLFW.onMouseWheel, true);
    Module["canvas"].addEventListener("mousewheel", GLFW.onMouseWheel, true);
    Module["canvas"].addEventListener("mouseenter", GLFW.onMouseenter, true);
    Module["canvas"].addEventListener("mouseleave", GLFW.onMouseleave, true);
    Module["canvas"].addEventListener("drop", GLFW.onDrop, true);
    Module["canvas"].addEventListener("dragover", GLFW.onDragover, true);
    Browser.resizeListeners.push(function (width, height) {
        GLFW.onCanvasResize(width, height);
    });
    return 1;
}
function _glfwMakeContextCurrent(winid) {}
function _glfwPollEvents() {}
function _glfwSwapBuffers(winid) {
    GLFW.swapBuffers(winid);
}
function _glfwSwapInterval(interval) {
    interval = Math.abs(interval);
    if (interval == 0) _emscripten_set_main_loop_timing(0, 0);
    else _emscripten_set_main_loop_timing(1, interval);
}
function _glfwTerminate() {
    window.removeEventListener("gamepadconnected", GLFW.onGamepadConnected, true);
    window.removeEventListener("gamepaddisconnected", GLFW.onGamepadDisconnected, true);
    window.removeEventListener("keydown", GLFW.onKeydown, true);
    window.removeEventListener("keypress", GLFW.onKeyPress, true);
    window.removeEventListener("keyup", GLFW.onKeyup, true);
    window.removeEventListener("blur", GLFW.onBlur, true);
    Module["canvas"].removeEventListener("touchmove", GLFW.onMousemove, true);
    Module["canvas"].removeEventListener("touchstart", GLFW.onMouseButtonDown, true);
    Module["canvas"].removeEventListener("touchcancel", GLFW.onMouseButtonUp, true);
    Module["canvas"].removeEventListener("touchend", GLFW.onMouseButtonUp, true);
    Module["canvas"].removeEventListener("mousemove", GLFW.onMousemove, true);
    Module["canvas"].removeEventListener("mousedown", GLFW.onMouseButtonDown, true);
    Module["canvas"].removeEventListener("mouseup", GLFW.onMouseButtonUp, true);
    Module["canvas"].removeEventListener("wheel", GLFW.onMouseWheel, true);
    Module["canvas"].removeEventListener("mousewheel", GLFW.onMouseWheel, true);
    Module["canvas"].removeEventListener("mouseenter", GLFW.onMouseenter, true);
    Module["canvas"].removeEventListener("mouseleave", GLFW.onMouseleave, true);
    Module["canvas"].removeEventListener("drop", GLFW.onDrop, true);
    Module["canvas"].removeEventListener("dragover", GLFW.onDragover, true);
    Module["canvas"].width = Module["canvas"].height = 1;
    GLFW.windows = null;
    GLFW.active = null;
}
function _llvm_eh_typeid_for(type) {
    return type;
}
function _mktime(tmPtr) {
    _tzset();
    var date = new Date(HEAP32[(tmPtr + 20) >>> 2] + 1900, HEAP32[(tmPtr + 16) >>> 2], HEAP32[(tmPtr + 12) >>> 2], HEAP32[(tmPtr + 8) >>> 2], HEAP32[(tmPtr + 4) >>> 2], HEAP32[tmPtr >>> 2], 0);
    var dst = HEAP32[(tmPtr + 32) >>> 2];
    var guessedOffset = date.getTimezoneOffset();
    var start = new Date(date.getFullYear(), 0, 1);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dstOffset = Math.min(winterOffset, summerOffset);
    if (dst < 0) {
        HEAP32[(tmPtr + 32) >>> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
    } else if (dst > 0 != (dstOffset == guessedOffset)) {
        var nonDstOffset = Math.max(winterOffset, summerOffset);
        var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
        date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4);
    }
    HEAP32[(tmPtr + 24) >>> 2] = date.getDay();
    var yday = ((date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)) | 0;
    HEAP32[(tmPtr + 28) >>> 2] = yday;
    HEAP32[tmPtr >>> 2] = date.getSeconds();
    HEAP32[(tmPtr + 4) >>> 2] = date.getMinutes();
    HEAP32[(tmPtr + 8) >>> 2] = date.getHours();
    HEAP32[(tmPtr + 12) >>> 2] = date.getDate();
    HEAP32[(tmPtr + 16) >>> 2] = date.getMonth();
    return (date.getTime() / 1e3) | 0;
}
function _pthread_mutexattr_destroy() {}
function _pthread_mutexattr_init() {}
function _pthread_mutexattr_settype() {}
function _setTempRet0($i) {
    setTempRet0($i | 0);
}
function __isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function __arraySum(array, index) {
    var sum = 0;
    for (var i = 0; i <= index; sum += array[i++]) {}
    return sum;
}
var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function __addDays(date, days) {
    var newDate = new Date(date.getTime());
    while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
            days -= daysInCurrentMonth - newDate.getDate() + 1;
            newDate.setDate(1);
            if (currentMonth < 11) {
                newDate.setMonth(currentMonth + 1);
            } else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear() + 1);
            }
        } else {
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        }
    }
    return newDate;
}
function _strftime(s, maxsize, format, tm) {
    var tm_zone = HEAP32[(tm + 40) >>> 2];
    var date = {
        tm_sec: HEAP32[tm >>> 2],
        tm_min: HEAP32[(tm + 4) >>> 2],
        tm_hour: HEAP32[(tm + 8) >>> 2],
        tm_mday: HEAP32[(tm + 12) >>> 2],
        tm_mon: HEAP32[(tm + 16) >>> 2],
        tm_year: HEAP32[(tm + 20) >>> 2],
        tm_wday: HEAP32[(tm + 24) >>> 2],
        tm_yday: HEAP32[(tm + 28) >>> 2],
        tm_isdst: HEAP32[(tm + 32) >>> 2],
        tm_gmtoff: HEAP32[(tm + 36) >>> 2],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : "",
    };
    var pattern = UTF8ToString(format);
    var EXPANSION_RULES_1 = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S",
        "%Ec": "%c",
        "%EC": "%C",
        "%Ex": "%m/%d/%y",
        "%EX": "%H:%M:%S",
        "%Ey": "%y",
        "%EY": "%Y",
        "%Od": "%d",
        "%Oe": "%e",
        "%OH": "%H",
        "%OI": "%I",
        "%Om": "%m",
        "%OM": "%M",
        "%OS": "%S",
        "%Ou": "%u",
        "%OU": "%U",
        "%OV": "%V",
        "%Ow": "%w",
        "%OW": "%W",
        "%Oy": "%y",
    };
    for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
    }
    var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function leadingSomething(value, digits, character) {
        var str = typeof value === "number" ? value.toString() : value || "";
        while (str.length < digits) {
            str = character[0] + str;
        }
        return str;
    }
    function leadingNulls(value, digits) {
        return leadingSomething(value, digits, "0");
    }
    function compareByDay(date1, date2) {
        function sgn(value) {
            return value < 0 ? -1 : value > 0 ? 1 : 0;
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
            if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                compare = sgn(date1.getDate() - date2.getDate());
            }
        }
        return compare;
    }
    function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
            case 0:
                return new Date(janFourth.getFullYear() - 1, 11, 29);
            case 1:
                return janFourth;
            case 2:
                return new Date(janFourth.getFullYear(), 0, 3);
            case 3:
                return new Date(janFourth.getFullYear(), 0, 2);
            case 4:
                return new Date(janFourth.getFullYear(), 0, 1);
            case 5:
                return new Date(janFourth.getFullYear() - 1, 11, 31);
            case 6:
                return new Date(janFourth.getFullYear() - 1, 11, 30);
        }
    }
    function getWeekBasedYear(date) {
        var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                return thisDate.getFullYear() + 1;
            } else {
                return thisDate.getFullYear();
            }
        } else {
            return thisDate.getFullYear() - 1;
        }
    }
    var EXPANSION_RULES_2 = {
        "%a": function (date) {
            return WEEKDAYS[date.tm_wday].substring(0, 3);
        },
        "%A": function (date) {
            return WEEKDAYS[date.tm_wday];
        },
        "%b": function (date) {
            return MONTHS[date.tm_mon].substring(0, 3);
        },
        "%B": function (date) {
            return MONTHS[date.tm_mon];
        },
        "%C": function (date) {
            var year = date.tm_year + 1900;
            return leadingNulls((year / 100) | 0, 2);
        },
        "%d": function (date) {
            return leadingNulls(date.tm_mday, 2);
        },
        "%e": function (date) {
            return leadingSomething(date.tm_mday, 2, " ");
        },
        "%g": function (date) {
            return getWeekBasedYear(date).toString().substring(2);
        },
        "%G": function (date) {
            return getWeekBasedYear(date);
        },
        "%H": function (date) {
            return leadingNulls(date.tm_hour, 2);
        },
        "%I": function (date) {
            var twelveHour = date.tm_hour;
            if (twelveHour == 0) twelveHour = 12;
            else if (twelveHour > 12) twelveHour -= 12;
            return leadingNulls(twelveHour, 2);
        },
        "%j": function (date) {
            return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3);
        },
        "%m": function (date) {
            return leadingNulls(date.tm_mon + 1, 2);
        },
        "%M": function (date) {
            return leadingNulls(date.tm_min, 2);
        },
        "%n": function () {
            return "\n";
        },
        "%p": function (date) {
            if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return "AM";
            } else {
                return "PM";
            }
        },
        "%S": function (date) {
            return leadingNulls(date.tm_sec, 2);
        },
        "%t": function () {
            return "\t";
        },
        "%u": function (date) {
            return date.tm_wday || 7;
        },
        "%U": function (date) {
            var janFirst = new Date(date.tm_year + 1900, 0, 1);
            var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstSunday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2);
            }
            return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00";
        },
        "%V": function (date) {
            var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
            var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
            var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
            var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
            var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
            if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                return "53";
            }
            if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                return "01";
            }
            var daysDifference;
            if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate();
            } else {
                daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate();
            }
            return leadingNulls(Math.ceil(daysDifference / 7), 2);
        },
        "%w": function (date) {
            return date.tm_wday;
        },
        "%W": function (date) {
            var janFirst = new Date(date.tm_year, 0, 1);
            var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstMonday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2);
            }
            return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00";
        },
        "%y": function (date) {
            return (date.tm_year + 1900).toString().substring(2);
        },
        "%Y": function (date) {
            return date.tm_year + 1900;
        },
        "%z": function (date) {
            var off = date.tm_gmtoff;
            var ahead = off >= 0;
            off = Math.abs(off) / 60;
            off = (off / 60) * 100 + (off % 60);
            return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
        },
        "%Z": function (date) {
            return date.tm_zone;
        },
        "%%": function () {
            return "%";
        },
    };
    for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
            pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
        }
    }
    var bytes = intArrayFromString(pattern, false);
    if (bytes.length > maxsize) {
        return 0;
    }
    writeArrayToMemory(bytes, s);
    return bytes.length - 1;
}
function _strftime_l(s, maxsize, format, tm) {
    return _strftime(s, maxsize, format, tm);
}
function _system(command) {
    if (ENVIRONMENT_IS_NODE) {
        if (!command) return 1;
        var cmdstr = UTF8ToString(command);
        if (!cmdstr.length) return 0;
        var cp = require("child_process");
        var ret = cp.spawnSync(cmdstr, [], { shell: true, stdio: "inherit" });
        var _W_EXITCODE = function (ret, sig) {
            return (ret << 8) | sig;
        };
        if (ret.status === null) {
            var signalToNumber = function (sig) {
                switch (sig) {
                    case "SIGHUP":
                        return 1;
                    case "SIGINT":
                        return 2;
                    case "SIGQUIT":
                        return 3;
                    case "SIGFPE":
                        return 8;
                    case "SIGKILL":
                        return 9;
                    case "SIGALRM":
                        return 14;
                    case "SIGTERM":
                        return 15;
                }
                return 2;
            };
            return _W_EXITCODE(0, signalToNumber(ret.signal));
        }
        return _W_EXITCODE(ret.status, 0);
    }
    if (!command) return 0;
    setErrNo(6);
    return -1;
}
function _time(ptr) {
    var ret = (Date.now() / 1e3) | 0;
    if (ptr) {
        HEAP32[ptr >>> 2] = ret;
    }
    return ret;
}
function _usleep(useconds) {
    var start = _emscripten_get_now();
    while (_emscripten_get_now() - start < useconds / 1e3) {}
}
var readAsmConstArgsArray = [];
function readAsmConstArgs(sigPtr, buf) {
    readAsmConstArgsArray.length = 0;
    var ch;
    buf >>= 2;
    while ((ch = HEAPU8[sigPtr++ >>> 0])) {
        var double = ch < 105;
        if (double && buf & 1) buf++;
        readAsmConstArgsArray.push(double ? HEAPF64[buf++ >>> 1] : HEAP32[buf >>> 0]);
        ++buf;
    }
    return readAsmConstArgsArray;
}
var FSNode = function (parent, name, mode, rdev) {
    if (!parent) {
        parent = this;
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev;
};
var readMode = 292 | 73;
var writeMode = 146;
Object.defineProperties(FSNode.prototype, {
    read: {
        get: function () {
            return (this.mode & readMode) === readMode;
        },
        set: function (val) {
            val ? (this.mode |= readMode) : (this.mode &= ~readMode);
        },
    },
    write: {
        get: function () {
            return (this.mode & writeMode) === writeMode;
        },
        set: function (val) {
            val ? (this.mode |= writeMode) : (this.mode &= ~writeMode);
        },
    },
    isFolder: {
        get: function () {
            return FS.isDir(this.mode);
        },
    },
    isDevice: {
        get: function () {
            return FS.isChrdev(this.mode);
        },
    },
});
FS.FSNode = FSNode;
FS.staticInit();
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas) {
    Browser.requestFullscreen(lockPointer, resizeCanvas);
};
Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
    Browser.requestAnimationFrame(func);
};
Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
    Browser.setCanvasSize(width, height, noUpdates);
};
Module["pauseMainLoop"] = function Module_pauseMainLoop() {
    Browser.mainLoop.pause();
};
Module["resumeMainLoop"] = function Module_resumeMainLoop() {
    Browser.mainLoop.resume();
};
Module["getUserMedia"] = function Module_getUserMedia() {
    Browser.getUserMedia();
};
Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
    return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
};
var GLctx;
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
for (var i = 0; i < 288; ++i) {
    miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1);
}
function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
}
__ATINIT__.push({
    func: function () {
        ___wasm_call_ctors();
    },
});
var asmLibraryArg = {
    n: ___assert_fail,
    Nb: ___clock_gettime,
    v: ___cxa_allocate_exception,
    p: ___cxa_begin_catch,
    A: ___cxa_end_catch,
    c: ___cxa_find_matching_catch_2,
    i: ___cxa_find_matching_catch_3,
    tb: ___cxa_find_matching_catch_8,
    y: ___cxa_free_exception,
    ya: ___cxa_rethrow,
    w: ___cxa_throw,
    Bb: ___cxa_uncaught_exceptions,
    Fb: ___gmtime_r,
    Eb: ___localtime_r,
    e: ___resumeException,
    Gb: ___sys__newselect,
    Rb: ___sys_chdir,
    Pb: ___sys_dup2,
    Qb: ___sys_dup3,
    E: ___sys_fcntl64,
    Ub: ___sys_getdents64,
    Kb: ___sys_ioctl,
    Mb: ___sys_lstat64,
    Ib: ___sys_mkdir,
    ma: ___sys_open,
    Ob: ___sys_rename,
    Jb: ___sys_rmdir,
    P: ___sys_socketcall,
    Hb: ___sys_stat64,
    Ba: ___sys_unlink,
    Qa: _abort,
    Fa: _alBufferData,
    yc: _alDeleteBuffers,
    xc: _alDeleteSources,
    Ha: _alGenBuffers,
    Ia: _alGenSources,
    G: _alGetError,
    oa: _alGetSourcei,
    F: _alGetString,
    tc: _alSource3f,
    Oa: _alSourcePause,
    fa: _alSourcePlay,
    wc: _alSourceQueueBuffers,
    vc: _alSourceStop,
    Ga: _alSourceUnqueueBuffers,
    uc: _alSourcef,
    Ea: _alSourcei,
    Ka: _alcCreateContext,
    Ja: _alcMakeContextCurrent,
    La: _alcOpenDevice,
    zc: _clock,
    Bc: _clock_gettime,
    bc: _difftime,
    D: _emscripten_asm_const_int,
    Fc: _emscripten_async_wget2_data,
    Ma: _emscripten_async_wget_data,
    Zb: _emscripten_enter_soft_fullscreen,
    Za: _emscripten_get_canvas_element_size,
    da: _emscripten_get_device_pixel_ratio,
    Ec: _emscripten_idb_async_exists,
    Dc: _emscripten_idb_async_load,
    Cc: _emscripten_idb_async_store,
    J: _emscripten_longjmp,
    wb: _emscripten_memcpy_big,
    xb: _emscripten_resize_heap,
    Pa: _emscripten_run_script_string,
    ac: _emscripten_set_keydown_callback_on_thread,
    $b: _emscripten_set_keyup_callback_on_thread,
    Yb: _emscripten_set_main_loop,
    jc: _emscripten_set_mousedown_callback_on_thread,
    ic: _emscripten_set_mousemove_callback_on_thread,
    hc: _emscripten_set_mouseup_callback_on_thread,
    cc: _emscripten_set_touchcancel_callback_on_thread,
    dc: _emscripten_set_touchend_callback_on_thread,
    ec: _emscripten_set_touchmove_callback_on_thread,
    fc: _emscripten_set_touchstart_callback_on_thread,
    _b: _emscripten_set_visibilitychange_callback_on_thread,
    gc: _emscripten_set_wheel_callback_on_thread,
    Cb: _environ_get,
    Db: _environ_sizes_get,
    V: _exit,
    R: _fd_close,
    Sb: _fd_read,
    vb: _fd_seek,
    Ca: _fd_write,
    b: _getTempRet0,
    sb: _getaddrinfo,
    S: _glActiveTexture,
    X: _glAttachShader,
    O: _glBindBuffer,
    U: _glBindFramebuffer,
    Wa: _glBindRenderbuffer,
    N: _glBindTexture,
    Da: _glBindVertexArray,
    Z: _glBlendFuncSeparate,
    qb: _glBufferData,
    la: _glBufferSubData,
    Sa: _glCheckFramebufferStatus,
    cb: _glClear,
    db: _glClearColor,
    $a: _glCompileShader,
    Ra: _glCopyTexImage2D,
    ta: _glCreateProgram,
    bb: _glCreateShader,
    pb: _glDeleteBuffers,
    Hc: _glDeleteFramebuffers,
    Y: _glDeleteProgram,
    Gc: _glDeleteRenderbuffers,
    ua: _glDeleteShader,
    ga: _glDeleteTextures,
    Wb: _glDeleteVertexArrays,
    K: _glDisable,
    va: _glDrawElements,
    wa: _glEnable,
    ja: _glEnableVertexAttribArray,
    Ta: _glFramebufferRenderbuffer,
    Ua: _glFramebufferTexture2D,
    rb: _glGenBuffers,
    Ya: _glGenFramebuffers,
    Xa: _glGenRenderbuffers,
    T: _glGenTextures,
    Vb: _glGenVertexArrays,
    ka: _glGetAttribLocation,
    gb: _glGetProgramInfoLog,
    W: _glGetProgramiv,
    _a: _glGetShaderInfoLog,
    qa: _glGetShaderiv,
    L: _glGetUniformLocation,
    sa: _glLinkProgram,
    fb: _glReadPixels,
    Va: _glRenderbufferStorage,
    ab: _glShaderSource,
    pa: _glTexImage2D,
    H: _glTexParameteri,
    ha: _glUniform1f,
    mb: _glUniform1fv,
    _: _glUniform1i,
    nb: _glUniform3f,
    ob: _glUseProgram,
    ia: _glVertexAttribPointer,
    ra: _glViewport,
    jb: _glewInit,
    lc: _glfwCreateWindow,
    Xb: _glfwDestroyWindow,
    hb: _glfwGetFramebufferSize,
    ib: _glfwGetWindowSize,
    nc: _glfwInit,
    lb: _glfwMakeContextCurrent,
    oc: _glfwPollEvents,
    eb: _glfwSwapBuffers,
    kb: _glfwSwapInterval,
    kc: _glfwTerminate,
    Aa: invoke_diii,
    r: invoke_fi,
    rc: invoke_fii,
    na: invoke_fiii,
    s: invoke_i,
    h: invoke_ii,
    sc: invoke_iif,
    d: invoke_iii,
    I: invoke_iiiffii,
    j: invoke_iiii,
    q: invoke_iiiii,
    u: invoke_iiiiii,
    z: invoke_iiiiiii,
    $: invoke_iiiiiiii,
    Na: invoke_iiiiiiiii,
    xa: invoke_iiiiiiiiii,
    ca: invoke_iiiiiiiiiiii,
    ub: invoke_jiiii,
    l: invoke_v,
    pc: invoke_vffffffiiii,
    m: invoke_vi,
    t: invoke_vif,
    f: invoke_vii,
    aa: invoke_viif,
    g: invoke_viii,
    k: invoke_viiii,
    o: invoke_viiiii,
    x: invoke_viiiiii,
    B: invoke_viiiiiii,
    qc: invoke_viiiiiiiii,
    Q: invoke_viiiiiiiiii,
    ba: invoke_viiiiiiiiiiiiiii,
    M: _llvm_eh_typeid_for,
    a: wasmMemory,
    Lb: _mktime,
    za: _pthread_mutexattr_destroy,
    zb: _pthread_mutexattr_init,
    yb: _pthread_mutexattr_settype,
    C: _setTempRet0,
    mc: _strftime,
    Ab: _strftime_l,
    Tb: _system,
    ea: _time,
    Ac: _usleep,
};
var asm = createWasm();
var ___wasm_call_ctors = (Module["___wasm_call_ctors"] = function () {
    return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["Jc"]).apply(null, arguments);
});
var _malloc = (Module["_malloc"] = function () {
    return (_malloc = Module["_malloc"] = Module["asm"]["Kc"]).apply(null, arguments);
});
var _free = (Module["_free"] = function () {
    return (_free = Module["_free"] = Module["asm"]["Lc"]).apply(null, arguments);
});
var ___errno_location = (Module["___errno_location"] = function () {
    return (___errno_location = Module["___errno_location"] = Module["asm"]["Mc"]).apply(null, arguments);
});
var _main = (Module["_main"] = function () {
    return (_main = Module["_main"] = Module["asm"]["Nc"]).apply(null, arguments);
});
var _htonl = (Module["_htonl"] = function () {
    return (_htonl = Module["_htonl"] = Module["asm"]["Oc"]).apply(null, arguments);
});
var _htons = (Module["_htons"] = function () {
    return (_htons = Module["_htons"] = Module["asm"]["Pc"]).apply(null, arguments);
});
var _ntohs = (Module["_ntohs"] = function () {
    return (_ntohs = Module["_ntohs"] = Module["asm"]["Qc"]).apply(null, arguments);
});
var __get_tzname = (Module["__get_tzname"] = function () {
    return (__get_tzname = Module["__get_tzname"] = Module["asm"]["Rc"]).apply(null, arguments);
});
var __get_daylight = (Module["__get_daylight"] = function () {
    return (__get_daylight = Module["__get_daylight"] = Module["asm"]["Sc"]).apply(null, arguments);
});
var __get_timezone = (Module["__get_timezone"] = function () {
    return (__get_timezone = Module["__get_timezone"] = Module["asm"]["Tc"]).apply(null, arguments);
});
var stackSave = (Module["stackSave"] = function () {
    return (stackSave = Module["stackSave"] = Module["asm"]["Uc"]).apply(null, arguments);
});
var stackRestore = (Module["stackRestore"] = function () {
    return (stackRestore = Module["stackRestore"] = Module["asm"]["Vc"]).apply(null, arguments);
});
var stackAlloc = (Module["stackAlloc"] = function () {
    return (stackAlloc = Module["stackAlloc"] = Module["asm"]["Wc"]).apply(null, arguments);
});
var _setThrew = (Module["_setThrew"] = function () {
    return (_setThrew = Module["_setThrew"] = Module["asm"]["Xc"]).apply(null, arguments);
});
var ___cxa_can_catch = (Module["___cxa_can_catch"] = function () {
    return (___cxa_can_catch = Module["___cxa_can_catch"] = Module["asm"]["Yc"]).apply(null, arguments);
});
var ___cxa_is_pointer_type = (Module["___cxa_is_pointer_type"] = function () {
    return (___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = Module["asm"]["Zc"]).apply(null, arguments);
});
var dynCall_jiiii = (Module["dynCall_jiiii"] = function () {
    return (dynCall_jiiii = Module["dynCall_jiiii"] = Module["asm"]["_c"]).apply(null, arguments);
});
function invoke_viiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3, a4);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_iii(index, a1, a2) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3, a4);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_vi(index, a1) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_vii(index, a1, a2) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_ii(index, a1) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_viii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3, a4, a5);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3, a4, a5);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_v(index) {
    var sp = stackSave();
    try {
        wasmTable.get(index)();
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3, a4, a5, a6);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3, a4, a5, a6);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_i(index) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)();
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_fi(index, a1) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_vif(index, a1, a2) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_viif(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiffii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3, a4, a5, a6);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7, a8);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_iif(index, a1, a2) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_fii(index, a1, a2) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_fiii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_vffffffiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_diii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
function invoke_jiiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_jiiii(index, a1, a2, a3, a4);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
    }
}
Module["addRunDependency"] = addRunDependency;
Module["removeRunDependency"] = removeRunDependency;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
var calledRun;
function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status;
}
var calledMain = false;
dependenciesFulfilled = function runCaller() {
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller;
};
function callMain(args) {
    var entryFunction = Module["_main"];
    args = args || [];
    var argc = args.length + 1;
    var argv = stackAlloc((argc + 1) * 4);
    HEAP32[argv >>> 2] = allocateUTF8OnStack(thisProgram);
    for (var i = 1; i < argc; i++) {
        HEAP32[((argv >> 2) + i) >>> 0] = allocateUTF8OnStack(args[i - 1]);
    }
    HEAP32[((argv >> 2) + argc) >>> 0] = 0;
    try {
        var ret = entryFunction(argc, argv);
        exit(ret, true);
    } catch (e) {
        if (e instanceof ExitStatus) {
            return;
        } else if (e == "unwind") {
            noExitRuntime = true;
            return;
        } else {
            var toLog = e;
            if (e && typeof e === "object" && e.stack) {
                toLog = [e, e.stack];
            }
            err("exception thrown: " + toLog);
            quit_(1, e);
        }
    } finally {
        calledMain = true;
    }
}
function run(args) {
    args = args || arguments_;
    if (runDependencies > 0) {
        return;
    }
    preRun();
    if (runDependencies > 0) return;
    function doRun() {
        if (calledRun) return;
        calledRun = true;
        Module["calledRun"] = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        if (shouldRunNow) callMain(args);
        postRun();
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("起動中です...");
        setTimeout(function () {
            setTimeout(function () {
                Module["setStatus"]("");
            }, 1);
            doRun();
        }, 1);
    } else {
        doRun();
    }
}
Module["run"] = run;
function exit(status, implicit) {
    if (implicit && noExitRuntime && status === 0) {
        return;
    }
    if (noExitRuntime) {
    } else {
        EXITSTATUS = status;
        exitRuntime();
        if (Module["onExit"]) Module["onExit"](status);
        ABORT = true;
    }
    quit_(status, new ExitStatus(status));
}
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()();
    }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) shouldRunNow = false;
noExitRuntime = true;
run();
