// The MIT License
// Copyright (C) 2016-Present Shota Matsuda

import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  input: './dist/planck-worker.module.js',
  plugins: [
    nodeResolve({ browser: true }),
    commonjs(),
    babel({
      presets: [
        ['es2015', { modules: false }],
        'es2016',
        'es2017',
        'stage-3',
      ],
      plugins: [
        'external-helpers',
      ],
      babelrc: false,
    }),
  ],
  output: {
    format: 'umd',
    extend: true,
    name: 'Planck',
    file: './dist/planck-worker.js',
    sourcemap: true,
  },
}
