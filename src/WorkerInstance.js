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

/* eslint-disable no-console */

import Environment from '@takram/planck-core/src/Environment'
import FilePath from '@takram/planck-core/src/FilePath'
import Namespace from '@takram/planck-core/src/Namespace'
import Transferral from '@takram/planck-core/src/Transferral'

class Transferable {
  constructor(message, list = []) {
    this.message = message
    this.list = list
  }
}

export const internal = Namespace('WorkerInstance')

export default class WorkerInstance {
  constructor() {
    const scope = internal(this)
    scope.handleMessage = this.handleMessage.bind(this)
  }

  start() {
    if (Environment.type !== 'worker') {
      throw new Error('Attempt to start worker instance on non-worker')
    }
    const scope = internal(this)
    self.addEventListener('message', scope.handleMessage, false)
    console.log(`${this.constructor.name} started`)
  }

  stop() {
    const scope = internal(this)
    self.removeEventListener('message', scope.handleMessage, false)
    console.log(`${this.constructor.name} stopped`)
  }

  transfer(message, list = []) {
    throw new Transferable(message, list)
  }

  async handleMessage(event) {
    const { property, uuid, args } = event.data
    let result
    try {
      result = await Promise.resolve(this[property](...args))
    } catch (data) {
      if (data instanceof Transferable) {
        result = data
      } else {
        // Post the error message to the caller to tell the work failed, and
        // rethrow it to see the error in console.
        self.postMessage({ uuid, error: (data.message || data) })
        throw data
      }
    }
    if (result instanceof Transferable) {
      self.postMessage({ uuid, result: result.message }, result.list)
    } else {
      self.postMessage({ uuid, result })
    }
  }

  static register() {
    const handler = event => {
      if (event.data === this.name) {
        const instance = new this()
        instance.start()
        self.removeEventListener('message', handler, false)
      }
    }
    self.addEventListener('message', handler, false)
  }
}
