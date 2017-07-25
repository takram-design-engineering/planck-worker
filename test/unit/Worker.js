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

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { Worker } from '../..'

const expect = chai.expect
chai.use(chaiAsPromised)

// eslint-disable-next-line func-names
describe('Worker', function () {
  this.timeout(300000)

  it('sends messages to worker instance', () => {
    const worker = Worker.new({
      name: 'EchoWorkerInstance',
      path: '/dist/test/fixture.js',
    })
    const expected1 = { a: 'a', b: 1 }
    const expected2 = { a: ['a', 1], b: { a: 'a', b: 1 } }
    return Promise.all([
      expect(worker.do(expected1)).fulfilled,
      expect(worker.do(expected2)).fulfilled,
    ]).then(results => {
      const [result1, result2] = results
      expect(result1).deep.equal(expected1)
      expect(result2).deep.equal(expected2)
    })
  })

  it('handles messages uniquely', () => {
    const worker = Worker.new({
      name: 'DelayWorkerInstance',
      path: '/dist/test/fixture.js',
    })
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
})
