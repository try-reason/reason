import { test, expect } from 'bun:test'
import StreamEncoder from '../../server/StreamEncoder'
import StreamableObject from '../../functions/__internal/StremableObject'

test('StreamEncoder: first encode', () => {
  const data = { name: 'inacio', hobbies: [123, { name: true }] }
  const expected = [
    {
      path: 'name',
      type: 'string',
      delta: 'inacio'
    },
    {
      path: 'hobbies.[0]',
      type: 'number',
      delta: '123'
    },
    {
      path: 'hobbies.[1].name',
      type: 'boolean',
      delta: 'true'
    },
  ]

  const encoder = new StreamEncoder()
  const delta = encoder.encode(data)
  
  expect(delta).toEqual(expected)
})

test('StreamEncoder: multiple encodes (realistic — url_classification)', () => {
  const datas = [
    {
      rationale: 'bec',
      url_classification: null,
      related_sites: null,
    },
    {
      rationale: 'because ',
      url_classification: null,
      related_sites: null,
    },
    {
      rationale: 'because ye',
      url_classification: 'videogame-relat',
      related_sites: null,
    },
    {
      rationale: 'because yes',
      url_classification: 'videogame-related',
      related_sites: ['ign.c'],
    },
    {
      rationale: 'because yes',
      url_classification: 'videogame-related',
      related_sites: ['ign.com', 'polygon.com', 'gamespot.com'],
    },
  ]
  const expected = [
    [
      {
        path: 'rationale',
        type: 'string',
        delta: 'bec'
      },
    ],
    [
      {
        path: 'rationale',
        type: 'string',
        delta: 'ause '
      },
    ],
    [
      {
        path: 'rationale',
        type: 'string',
        delta: 'ye'
      },
      {
        path: 'url_classification',
        type: 'string',
        delta: 'videogame-relat'
      },
    ],
    [
      {
        path: 'rationale',
        type: 'string',
        delta: 's'
      },
      {
        path: 'url_classification',
        type: 'string',
        delta: 'ed'
      },
      {
        path: 'related_sites.[0]',
        type: 'string',
        delta: 'ign.c'
      },
    ],
    [
      {
        path: 'related_sites.[0]',
        type: 'string',
        delta: 'om'
      },
      {
        path: 'related_sites.[1]',
        type: 'string',
        delta: 'polygon.com'
      },
      {
        path: 'related_sites.[2]',
        type: 'string',
        delta: 'gamespot.com'
      },
    ],
  ]

  const encoder = new StreamEncoder()
  for (let i = 0; i < datas.length; i++) {
    const delta = encoder.encode(datas[i])
    expect(delta).toEqual(expected[i])
  }
})

test('StreamEncoder: multiple encodes of nested objects', () => {
  const datas = [
    {
      related_sites: {
        name: '',
      }
    },
    {
      related_sites: {
        name: 'Game',
      }
    },
  ]

  const expected = [
    [
      {
        path: 'related_sites.name',
        type: 'string',
        delta: ''
      },
    ],
    [
      {
        path: 'related_sites.name',
        type: 'string',
        delta: 'Game'
      },
    ]
  ]

  const encoder = new StreamEncoder()
  for (let i = 0; i < datas.length; i++) {
    const delta = encoder.encode(datas[i])
    expect(delta).toEqual(expected[i])
  }
})

test('StreamEncoder: multiple encodes of nested StreamableObjects', () => {
  const datas = [
    {
      related_sites: {
        name: new StreamableObject(null, false),
        url: new StreamableObject(null, false),
      }
    },
    {
      related_sites: {
        name: new StreamableObject('', false),
        url: new StreamableObject(null, false),
      }
    },
    {
      related_sites: {
        name: new StreamableObject('Game', false),
        url: new StreamableObject(null, false),
      }
    },
  ]

  const expected = [
    [
    ],
    [
      {
        path: 'related_sites.name',
        type: 'string',
        delta: ''
      },
    ],
    [
      {
        path: 'related_sites.name',
        type: 'string',
        delta: 'Game'
      },
    ]
  ]

  const encoder = new StreamEncoder()
  for (let i = 0; i < datas.length; i++) {
    const delta = encoder.encode(datas[i])
    expect(delta).toEqual(expected[i])
  }
})

test('StreamEncoder: a message and an action inside the same step', () => {
  const datas = [
    {
      "steps": [
        {
          "action": null,
          "message": {
            "content": "I will now call the function 'foo' with the argument 'hello all'."
          }
        }
      ]
    },
    {
      "steps": [
        {
          "action": {
            "name": "foo",
            "input": {
              "query": null
            }
          },
          "message": {
            "content": "I will now call the function 'foo' with the argument 'hello all'."
          }
        }
      ]
    }
  ]

  const expected = [
    [
      {
        path: 'steps.[0].message.content',
        type: 'string',
        delta: "I will now call the function 'foo' with the argument 'hello all'."
      }
    ],
    [
      {
        path: 'steps.[0].action.name',
        type: 'string',
        delta: 'foo'
      }
    ]
  ]

  const encoder = new StreamEncoder()
  for (let data of datas) {
    const delta = encoder.encode(data)
    expect(delta).toEqual(expected.shift())
  }
})