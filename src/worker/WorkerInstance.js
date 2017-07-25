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

import {
  Environment,
  FilePath,
  Namespace,
  Transferral,
} from '@takram/planck-core'

export const internal = Namespace('WorkerInstance')

export default class WorkerInstance {
  constructor() {
    const scope = internal(this)
    scope.handleMessage = this.handleMessage.bind(this)
  }

  start() {
    if (Environment.type !== 'worker') {
      throw new Error()
    }
    const scope = internal(this)
    Environment.self.importScripts(...this.constructor.imports.map(path => {
      return FilePath.resolve(path)
    }))
    Environment.self.addEventListener('message', scope.handleMessage, false)
    console.log(`${this.constructor.name} started`)
  }

  stop() {
    const scope = internal(this)
    Environment.self.removeEventListener('message', scope.handleMessage, false)
    console.log(`${this.constructor.name} stopped`)
  }

  post(uuid, result) {
    Environment.self.postMessage({ uuid, result })
  }

  transfer(uuid, result) {
    if (result === undefined) {
      Environment.self.postMessage({ uuid })
    } else {
      const buffer = Transferral.encode(result)
      Environment.self.postMessage({ uuid, result: buffer }, [buffer])
    }
  }

  handleMessage(event) {
    const { property, uuid, args } = event.data
    if (typeof this[property] === 'function') {
      this[property](uuid, ...args)
    } else {
      throw new Error(`Function was not found for "${property}"`)
    }
  }

  static get imports() {
    return []
  }

  static register() {
    const handler = event => {
      if (event.data === this.name) {
        const instance = new this()
        instance.start()
        Environment.self.removeEventListener('message', handler, false)
      }
    }
    Environment.self.addEventListener('message', handler, false)
  }
}
