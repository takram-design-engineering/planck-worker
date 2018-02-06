// The MIT License
// Copyright (C) 2016-Present Shota Matsuda

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
