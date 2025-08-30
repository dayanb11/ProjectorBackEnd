module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    
    // Custom rule to prevent importing @prisma/client outside repositories
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@prisma/client'],
            message: 'Direct Prisma client imports are only allowed in repository files. Use the centralized client from @/infrastructure/db/client instead.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['src/domain/*/repository.ts', 'src/infrastructure/db/*.ts'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};