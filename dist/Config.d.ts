import z from 'zod';
declare const envSchema: z.ZodObject<{
    FUNCTIONS_EMULATOR: z.ZodOptional<z.ZodString>;
    JEST_WORKER_ID: z.ZodOptional<z.ZodString>;
    VITEST_WORKER_ID: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    FUNCTIONS_EMULATOR?: string;
    JEST_WORKER_ID?: string;
    VITEST_WORKER_ID?: string;
}, {
    FUNCTIONS_EMULATOR?: string;
    JEST_WORKER_ID?: string;
    VITEST_WORKER_ID?: string;
}>;
type EnvVariables = z.infer<typeof envSchema>;
export default class Config {
    private variables;
    constructor(env?: EnvVariables);
    isTestEnvironment(): boolean;
    isEmulator(): boolean;
    isTTY(): boolean;
    private get;
}
export {};
