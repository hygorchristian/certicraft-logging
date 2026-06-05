"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = __importDefault(require("zod"));
const envSchema = zod_1.default.object({
    FUNCTIONS_EMULATOR: zod_1.default.string().optional(),
    JEST_WORKER_ID: zod_1.default.string().optional(),
    VITEST_WORKER_ID: zod_1.default.string().optional()
});
class Config {
    constructor(env) {
        this.variables = envSchema.parse(env ?? process.env);
    }
    isTestEnvironment() {
        return (this.get('JEST_WORKER_ID') !== undefined ||
            this.get('VITEST_WORKER_ID') !== undefined);
    }
    isEmulator() {
        return this.get('FUNCTIONS_EMULATOR') !== undefined;
    }
    isTTY() {
        return Boolean(process.stdout.isTTY);
    }
    get(key) {
        return this.variables[key];
    }
}
exports.default = Config;
