import z from 'zod';

const envSchema = z.object({
  FUNCTIONS_EMULATOR: z.string().optional(),
  JEST_WORKER_ID: z.string().optional(),
  VITEST_WORKER_ID: z.string().optional()
});

type EnvVariables = z.infer<typeof envSchema>;

export default class Config {
  private variables: EnvVariables;

  constructor(env?: EnvVariables) {
    this.variables = envSchema.parse(env ?? process.env);
  }

  isTestEnvironment(): boolean {
    return (
      this.get('JEST_WORKER_ID') !== undefined ||
      this.get('VITEST_WORKER_ID') !== undefined
    );
  }

  isEmulator(): boolean {
    return this.get('FUNCTIONS_EMULATOR') !== undefined;
  }

  isTTY(): boolean {
    return Boolean(process.stdout.isTTY);
  }

  private get(key: keyof EnvVariables): string | undefined {
    return this.variables[key];
  }
}
