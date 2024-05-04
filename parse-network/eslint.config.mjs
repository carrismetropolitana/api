import antfu from '@antfu/eslint-config';

export default antfu({

  vue: false,
  stylistic: {
    semi: true,
  },
}, {
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': ['error', 'always'],
  },
});
