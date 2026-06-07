"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrettyDestination = exports.isLocalEnvironment = exports.convertFSAToLogEntryField = exports.getRequestAsLogEntryFields = exports.DeprecatedCloudLogger = exports.CloudLogger = exports.isLogLevel = exports.DeprecatedLog = exports.Log = void 0;
const CloudLogger_1 = __importDefault(require("./CloudLogger"));
const Config_1 = __importDefault(require("./Config"));
const Log_1 = __importStar(require("./Log"));
exports.DeprecatedLog = Log_1.default;
Object.defineProperty(exports, "isLogLevel", { enumerable: true, get: function () { return Log_1.isLogLevel; } });
const PineLogger_1 = __importDefault(require("./PineLogger"));
const isLocalEnvironment_1 = require("./local/isLocalEnvironment");
Object.defineProperty(exports, "isLocalEnvironment", { enumerable: true, get: function () { return isLocalEnvironment_1.isLocalEnvironment; } });
const PrettyDestination_1 = require("./local/PrettyDestination");
Object.defineProperty(exports, "PrettyDestination", { enumerable: true, get: function () { return PrettyDestination_1.PrettyDestination; } });
const convertFSAToLogEntryField_1 = __importDefault(require("./utils/convertFSAToLogEntryField"));
exports.convertFSAToLogEntryField = convertFSAToLogEntryField_1.default;
const getRequestAsLogEntryFields_1 = __importDefault(require("./utils/getRequestAsLogEntryFields"));
exports.getRequestAsLogEntryFields = getRequestAsLogEntryFields_1.default;
const config = new Config_1.default();
const DeprecatedCloudLogger = new CloudLogger_1.default(config);
exports.DeprecatedCloudLogger = DeprecatedCloudLogger;
const CloudLogger = new PineLogger_1.default(config);
exports.CloudLogger = CloudLogger;
const Log = CloudLogger;
exports.Log = Log;
