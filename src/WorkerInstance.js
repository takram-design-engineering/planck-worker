// The MIT License
// Copyright (C) 2016-Present Shota Matsuda

/* eslint-env worker */

import Global from '@takram/planck-core/src/Global'
import Namespace from '@takram/planck-core/src/Namespace'

class Transferable {
  constructor (message, list = []) {
    this.message = message
    this.list = list
  }
}

export const internal = Namespace('WorkerInstance')

export default class WorkerInstance {
  constructor () {
    const scope = internal(this)
    scope.handleMessage = this.handleMessage.bind(this)
  }

  start () {
    if (!Global.isWorker) {
      throw new Error('Attempt to start worker instance on non-worker')
    }
    const scope = internal(this)
    self.addEventListener('message', scope.handleMessage, false)
    console.log(`${this.constructor.name} started`)
  }

  stop () {
    const scope = internal(this)
    self.removeEventListener('message', scope.handleMessage, false)
    console.log(`${this.constructor.name} stopped`)
  }

  transfer (message, list = []) {
    throw new Transferable(message, list)
  }

  async handleMessage (event) {
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

  static register () {
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
