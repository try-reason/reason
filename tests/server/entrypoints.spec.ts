import { expect, test } from 'bun:test'
import { getEntrypoints } from '../../server/entrypoints'


test('getEntrypoints', async () => {
  const entrypoints = await getEntrypoints()

  const expected = [
    {
      prettyName: "index",
      serverPath: "/"
    }, {
      prettyName: "index",
      serverPath: "/users/avatar"
    }, {
      prettyName: "another",
      serverPath: "/users/another"
    }, {
      prettyName: "[id]",
      serverPath: "/:id"
    },
    {
      prettyName: "delete",
      serverPath: "/users/:user-id/delete"
    }
  ]

  for (let e of expected) {
    const entrypoint = entrypoints.find(ep => ep.serverPath === e.serverPath)
    expect(entrypoint).toBeDefined()
    expect(entrypoint!.prettyName).toBe(e.prettyName)
  }
})