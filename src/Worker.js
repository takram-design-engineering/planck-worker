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

import Environment from '@takram/planck-core/src/Environment'
import FilePath from '@takram/planck-core/src/FilePath'
import Namespace from '@takram/planck-core/src/Namespace'
import UUID from '@takram/planck-core/src/UUID'

export const internal = Namespace('Worker')

function handleApply(property, uuid, ...args) {
  return new Promise((resolve, reject) => {
    const scope = internal(this)
    const { worker } = scope.worker
    const callback = event => {
      if (event.data.uuid !== uuid) {
        return
      }
      if (event.data.error) {
        reject(new Error(event.data.error))
      } else {
        resolve(this.constructor.transform(event.data.result, property))
      }
      worker.removeEventListener('message', callback, false)
      --scope.running
      if (scope.running < 0) {
        throw new Error()
      }
    }
    worker.addEventListener('message', callback, false)
    worker.postMessage({ property, uuid, args })
    ++scope.running
  })
}

export default class Worker {
  // This constructor provides for inheritance only
  constructor({ name, path = FilePath.self } = {}) {
    const scope = internal(this)
    scope.running = 0
    scope.name = name || this.constructor.name
    scope.worker = new Environment.self.Worker(path)

    // Post initial message
    scope.worker.postMessage(scope.name)
  }

  get(target, property, receiver) {
    if (property === 'running') {
      return Reflect.get(this, property)
    }
    return handleApply.bind(this, property, UUID())
  }

  get running() {
    const scope = internal(this)
    return scope.running
  }

  static transform(result) {
    return result
  }

  static inverseTransform(result) {
    return result
  }

  static new(...args) {
    return new Proxy({}, new this(...args))
  }
}
