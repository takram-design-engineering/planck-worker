// The MIT License
// Copyright (C) 2016-Present Shota Matsuda

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { Worker } from '../..'

const { expect } = chai
chai.use(chaiAsPromised)

describe('Worker', function () {
  this.timeout(300000)

  const worker = Worker.new({
    name: 'TestWorkerInstance',
    path: '/dist/test/fixture.js'
  })

  it('sends messages to worker instance', () => {
    const expected1 = { a: 'a', b: 1 }
    const expected2 = { a: ['a', 1], b: { a: 'a', b: 1 } }
    return Promise.all([
      expect(worker.echo(expected1)).fulfilled,
      expect(worker.echo(expected2)).fulfilled
    ]).then(results => {
      const [result1, result2] = results
      expect(result1).deep.equal(expected1)
      expect(result2).deep.equal(expected2)
    })
  })

  it('handles messages uniquely', () => {
    const promise1 = expect(worker.delay(200)).fulfilled
    const promise2 = expect(worker.delay(100)).fulfilled
    const promise3 = expect(worker.delay(0)).fulfilled
    const results = []
    promise1.then(result => results.push(result))
    promise2.then(result => results.push(result))
    promise3.then(result => results.push(result))
    return Promise.all([promise1, promise2, promise3]).then(args => {
      expect(results).deep.equal([0, 100, 200])
      const [result1, result2, result3] = args
      expect(result1).equal(200)
      expect(result2).equal(100)
      expect(result3).equal(0)
    })
  })

  it('rejects with error message when calling undefined function', () => {
    return Promise.all([
      expect(worker.other()).rejected,
      expect(worker.other()).rejected
    ])
  })

  it('rejects with error message when worker instance fails', () => {
    const expected1 = 'Test error message 1'
    const expected2 = 'Test error message 2'
    return Promise.all([
      expect(worker.error(expected1)).rejected,
      expect(worker.error(expected2)).rejected
    ]).then(errors => {
      const [error1, error2] = errors
      expect(error1.message).equal(expected1)
      expect(error2.message).equal(expected2)
    })
  })

  it('supports transferring', () => {
    const expected1 = [1, 2, 3, 4]
    const expected2 = [5, 6, 7, 8]
    return Promise.all([
      expect(worker.transfer(expected1)).fulfilled,
      expect(worker.transfer(expected2)).fulfilled
    ]).then(results => {
      const [result1, result2] = results
      expect(result1).instanceof(ArrayBuffer)
      expect(result2).instanceof(ArrayBuffer)
      expect(Array.from(new Float32Array(result1))).deep.equal(expected1)
      expect(Array.from(new Float32Array(result2))).deep.equal(expected2)
    })
  })
})
