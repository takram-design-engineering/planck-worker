//
//  The MIT License
//
//  Copyright (C) 2016-Present Shota Matsuda
//
//  Permission is hereby granted, free of charge, to any person obtaining a
//  copy of this software and associated documentation files (the "Software"),
//  to deal in the Software without restriction, including without limitation
//  the rights to use, copy, modify, merge, publish, distribute, sublicense,
//  and/or sell copies of the Software, and to permit persons to whom the
//  Software is furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
//  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//  DEALINGS IN THE SOFTWARE.
//

self.importScripts(
  '/node_modules/babel-polyfill/dist/polyfill.js',
  '/dist/planck-worker.js',
)

const { WorkerInstance } = self.Planck

class EchoWorkerInstance extends WorkerInstance {
  handleMessage(event) {
    const { uuid, args } = event.data
    this.post(uuid, ...args)
  }
}

EchoWorkerInstance.register()

class DelayWorkerInstance extends WorkerInstance {
  delay(uuid, milliseconds) {
    setTimeout(() => {
      this.post(uuid, milliseconds)
    }, milliseconds)
  }
}

DelayWorkerInstance.register()
