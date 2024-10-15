/* * */

import { node } from '@carrismetropolitana/eslint'

/* * */

export default [
  ...node,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
