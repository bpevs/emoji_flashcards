import { pageHandler } from '../server_helpers.ts'
import { assertExists } from 'std/assert/mod.ts'
import { it } from 'std/testing/bdd.ts'
import { Application, Context } from 'oak'
const app = new Application()

it('should render index page', async () => {
  const handler = pageHandler('index')
  const request = {
    url: new URL('https://flashcards.bpev.me/?card=el-GR&i=0'),
    headers: new Headers(),
    getBody: () => '',
  }
  // deno-lint-ignore no-explicit-any
  const context = new Context(app, request as any, {})
  await handler(context)
  assertExists(context.response.body)
})
