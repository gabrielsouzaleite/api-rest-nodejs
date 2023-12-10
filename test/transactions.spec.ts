import { expect, beforeAll, afterAll, describe, it, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import req from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    await req(app.server)
      .post('/transactions')
      .send({
        title: 'new transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await req(app.server)
      .post('/transactions')
      .send({
        title: 'new transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await req(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'new transaction',
        amount: 5000,
      }),
    ])
  })

  it('should be able to list specific transaction', async () => {
    const createTransactionResponse = await req(app.server)
      .post('/transactions')
      .send({
        title: 'new transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await req(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionsResponse = await req(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionsResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'new transaction',
        amount: 5000,
      }),
    )
  })

  it('should be able to get the summary', async () => {
    const createTransactionResponse = await req(app.server)
      .post('/transactions')
      .send({
        title: 'Credit trtansaction',
        amount: 5000,
        type: 'credit',
      })
    const cookies = createTransactionResponse.get('Set-Cookie')
    await req(app.server).post('/transactions').send({
      title: 'Debit transaction',
      amount: 2000,
      type: 'debit',
    })

    const summaryResponse = await req(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    })
  })
})
