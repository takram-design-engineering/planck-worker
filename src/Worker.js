// The MIT License
// Copyright (C) 2016-Present Shota Matsuda

import uuidv4 from 'uuid/v4'

import Global from '@takram/planck-core/src/Global'
import FilePath from '@takram/planck-core/src/FilePath'
import Namespace from '@takram/planck-core/src/Namespace'

export const internal = Namespace('Worker')

function handleApply(property, uuid, ...args) {
  return new Promise((resolve, reject) => {
    const scope = internal(this)
    const { worker } = scope
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
    scope.worker = new Global.scope.Worker(path)

    // Post initial message
    scope.worker.postMessage(scope.name)
  }

  get(target, property, receiver) {
    if (property === 'running') {
      return Reflect.get(this, property)
    }
    return handleApply.bind(this, property, uuidv4())
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
