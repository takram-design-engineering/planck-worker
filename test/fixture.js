// The MIT License
// Copyright (C) 2016-Present Shota Matsuda

/* global Planck */
/* eslint-disable no-restricted-globals */

self.importScripts(
  '/node_modules/babel-polyfill/dist/polyfill.js',
  '/dist/planck-worker.js',
)

const { WorkerInstance } = Planck

class TestWorkerInstance extends WorkerInstance {
  echo(arg) {
    return arg
  }

  error(message) {
    throw new Error(message)
  }

  delay(milliseconds) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(milliseconds)
      }, milliseconds)
    })
  }

  transfer(array) {
    const { buffer } = new Float32Array(array)
    super.transfer(buffer, [buffer])
  }
}

TestWorkerInstance.register()
