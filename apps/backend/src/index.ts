import { Hono } from 'hono'
import { HealthCheckResponseSchema } from '@raudevweb/shared'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/health', (c) => {
  const data = HealthCheckResponseSchema.parse({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
  return c.json(data)
})

export default app

