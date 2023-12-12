import { test, expect } from 'bun:test'
import { toJsonSchema, jdoc2jsonSchema } from '../../../ast-transforms/utils/to-json-schema'

const params = [
  {
    type: "Identifier",
    start: 678,
    end: 693,
    loc: {
      start: {
        line: 21,
        column: 26,
        index: 678,
      },
      end: {
        line: 21,
        column: 41,
        index: 693,
      },
      filename: undefined,
      identifierName: "file_id",
    },
    name: "file_id",
    typeAnnotation: {
      type: "TSTypeAnnotation",
      start: 685,
      end: 693,
      loc: {
        start: {
          line: 21,
          column: 33,
          index: 685,
        },
        end: {
          line: 21,
          column: 41,
          index: 693,
        },
        filename: undefined,
        identifierName: undefined,
      },
      typeAnnotation: {
        type: "TSStringKeyword",
        start: 687,
        end: 693,
        loc: {
          start: {
            line: 21,
            column: 35,
            index: 687,
          },
          end: {
            line: 21,
            column: 41,
            index: 693,
          },
          filename: undefined,
          identifierName: undefined,
        },
        leadingComments: undefined,
        innerComments: undefined,
        trailingComments: undefined,
      },
      leadingComments: undefined,
      innerComments: undefined,
      trailingComments: undefined,
    },
    leadingComments: undefined,
    innerComments: undefined,
    trailingComments: undefined,
  },
  {
    type: "Identifier",
    start: 719,
    end: 733,
    loc: {
      start: {
        line: 21,
        column: 67,
        index: 719,
      },
      end: {
        line: 21,
        column: 81,
        index: 733,
      },
      filename: undefined,
      identifierName: "arr",
    },
    name: "arr",
    typeAnnotation: {
      type: "TSTypeAnnotation",
      start: 722,
      end: 733,
      loc: {
        start: {
          line: 21,
          column: 70,
          index: 722,
        },
        end: {
          line: 21,
          column: 81,
          index: 733,
        },
        filename: undefined,
        identifierName: undefined,
      },
      typeAnnotation: {
        type: "TSArrayType",
        start: 724,
        end: 733,
        loc: {
          start: {
            line: 21,
            column: 72,
            index: 724,
          },
          end: {
            line: 21,
            column: 81,
            index: 733,
          },
          filename: undefined,
          identifierName: undefined,
        },
        elementType: {
          type: "TSBooleanKeyword",
          start: 724,
          end: 731,
          loc: {
            start: {
              line: 21,
              column: 72,
              index: 724,
            },
            end: {
              line: 21,
              column: 79,
              index: 731,
            },
            filename: undefined,
            identifierName: undefined,
          },
          leadingComments: undefined,
          innerComments: undefined,
          trailingComments: undefined,
        },
        leadingComments: undefined,
        innerComments: undefined,
        trailingComments: undefined,
      },
      leadingComments: undefined,
      innerComments: undefined,
      trailingComments: undefined,
    },
    leadingComments: undefined,
    innerComments: undefined,
    trailingComments: undefined,
  },
  {
    type: "Identifier",
    start: 745,
    end: 762,
    loc: {
      start: {
        line: 21,
        column: 93,
        index: 745,
      },
      end: {
        line: 21,
        column: 110,
        index: 762,
      },
      filename: undefined,
      identifierName: "u2",
    },
    name: "u2",
    typeAnnotation: {
      type: "TSTypeAnnotation",
      start: 747,
      end: 762,
      loc: {
        start: {
          line: 21,
          column: 95,
          index: 747,
        },
        end: {
          line: 21,
          column: 110,
          index: 762,
        },
        filename: undefined,
        identifierName: undefined,
      },
      typeAnnotation: {
        type: "TSUnionType",
        start: 749,
        end: 762,
        loc: {
          start: {
            line: 21,
            column: 97,
            index: 749,
          },
          end: {
            line: 21,
            column: 110,
            index: 762,
          },
          filename: undefined,
          identifierName: undefined,
        },
        types: [
          {
            type: "TSLiteralType",
            start: 749,
            end: 754,
            loc: {
              start: {
                line: 21,
                column: 97,
                index: 749,
              },
              end: {
                line: 21,
                column: 102,
                index: 754,
              },
              filename: undefined,
              identifierName: undefined,
            },
            literal: {
              type: "StringLiteral",
              start: 749,
              end: 754,
              loc: {
                start: {
                  line: 21,
                  column: 97,
                  index: 749,
                },
                end: {
                  line: 21,
                  column: 102,
                  index: 754,
                },
                filename: undefined,
                identifierName: undefined,
              },
              extra: {
                rawValue: "abc",
                raw: "'abc'",
              },
              value: "abc",
              leadingComments: undefined,
              innerComments: undefined,
              trailingComments: undefined,
            },
            leadingComments: undefined,
            innerComments: undefined,
            trailingComments: undefined,
          },
          {
            type: "TSLiteralType",
            start: 757,
            end: 762,
            loc: {
              start: {
                line: 21,
                column: 105,
                index: 757,
              },
              end: {
                line: 21,
                column: 110,
                index: 762,
              },
              filename: undefined,
              identifierName: undefined,
            },
            literal: {
              type: "StringLiteral",
              start: 757,
              end: 762,
              loc: {
                start: {
                  line: 21,
                  column: 105,
                  index: 757,
                },
                end: {
                  line: 21,
                  column: 110,
                  index: 762,
                },
                filename: undefined,
                identifierName: undefined,
              },
              extra: {
                rawValue: "xyz",
                raw: "'xyz'",
              },
              value: "xyz",
              leadingComments: undefined,
              innerComments: undefined,
              trailingComments: undefined,
            },
            leadingComments: undefined,
            innerComments: undefined,
            trailingComments: undefined,
          },
        ],
        leadingComments: undefined,
        innerComments: undefined,
        trailingComments: undefined,
      },
      leadingComments: undefined,
      innerComments: undefined,
      trailingComments: undefined,
    },
    leadingComments: undefined,
    innerComments: undefined,
    trailingComments: undefined,
  },
  {
    type: "Identifier",
    start: 725,
    end: 748,
    loc: {
      start: {
        line: 21,
        column: 73,
        index: 725,
      },
      end: {
        line: 21,
        column: 96,
        index: 748,
      },
      filename: undefined,
      identifierName: "arr2",
    },
    name: "arr2",
    typeAnnotation: {
      type: "TSTypeAnnotation",
      start: 729,
      end: 748,
      loc: {
        start: {
          line: 21,
          column: 77,
          index: 729,
        },
        end: {
          line: 21,
          column: 96,
          index: 748,
        },
        filename: undefined,
        identifierName: undefined,
      },
      typeAnnotation: {
        type: "TSArrayType",
        start: 731,
        end: 748,
        loc: {
          start: {
            line: 21,
            column: 79,
            index: 731,
          },
          end: {
            line: 21,
            column: 96,
            index: 748,
          },
          filename: undefined,
          identifierName: undefined,
        },
        elementType: {
          type: "TSParenthesizedType",
          start: 731,
          end: 746,
          loc: {
            start: {
              line: 21,
              column: 79,
              index: 731,
            },
            end: {
              line: 21,
              column: 94,
              index: 746,
            },
            filename: undefined,
            identifierName: undefined,
          },
          typeAnnotation: {
            type: "TSUnionType",
            start: 732,
            end: 745,
            loc: {
              start: {
                line: 21,
                column: 80,
                index: 732,
              },
              end: {
                line: 21,
                column: 93,
                index: 745,
              },
              filename: undefined,
              identifierName: undefined,
            },
            types: [
              {
                type: "TSLiteralType",
                start: 732,
                end: 737,
                loc: {
                  start: {
                    line: 21,
                    column: 80,
                    index: 732,
                  },
                  end: {
                    line: 21,
                    column: 85,
                    index: 737,
                  },
                  filename: undefined,
                  identifierName: undefined,
                },
                literal: {
                  type: "StringLiteral",
                  start: 732,
                  end: 737,
                  loc: {
                    start: {
                      line: 21,
                      column: 80,
                      index: 732,
                    },
                    end: {
                      line: 21,
                      column: 85,
                      index: 737,
                    },
                    filename: undefined,
                    identifierName: undefined,
                  },
                  extra: {
                    rawValue: "foo",
                    raw: "'foo'",
                  },
                  value: "foo",
                  leadingComments: undefined,
                  innerComments: undefined,
                  trailingComments: undefined,
                },
                leadingComments: undefined,
                innerComments: undefined,
                trailingComments: undefined,
              },
              {
                type: "TSLiteralType",
                start: 740,
                end: 745,
                loc: {
                  start: {
                    line: 21,
                    column: 88,
                    index: 740,
                  },
                  end: {
                    line: 21,
                    column: 93,
                    index: 745,
                  },
                  filename: undefined,
                  identifierName: undefined,
                },
                literal: {
                  type: "StringLiteral",
                  start: 740,
                  end: 745,
                  loc: {
                    start: {
                      line: 21,
                      column: 88,
                      index: 740,
                    },
                    end: {
                      line: 21,
                      column: 93,
                      index: 745,
                    },
                    filename: undefined,
                    identifierName: undefined,
                  },
                  extra: {
                    rawValue: "bar",
                    raw: "'bar'",
                  },
                  value: "bar",
                  leadingComments: undefined,
                  innerComments: undefined,
                  trailingComments: undefined,
                },
                leadingComments: undefined,
                innerComments: undefined,
                trailingComments: undefined,
              },
            ],
            leadingComments: undefined,
            innerComments: undefined,
            trailingComments: undefined,
          },
          leadingComments: undefined,
          innerComments: undefined,
          trailingComments: undefined,
        },
        leadingComments: undefined,
        innerComments: undefined,
        trailingComments: undefined,
      },
      leadingComments: undefined,
      innerComments: undefined,
      trailingComments: undefined,
    },
    leadingComments: undefined,
    innerComments: undefined,
    trailingComments: undefined,
  },
  {
    type: "Identifier",
    start: 764,
    end: 851,
    loc: {
      start: {
        line: 21,
        column: 112,
        index: 764,
      },
      end: {
        line: 26,
        column: 1,
        index: 851,
      },
      filename: undefined,
      identifierName: "o",
    },
    name: "o",
    typeAnnotation: {
      type: "TSTypeAnnotation",
      start: 765,
      end: 851,
      loc: {
        start: {
          line: 21,
          column: 113,
          index: 765,
        },
        end: {
          line: 26,
          column: 1,
          index: 851,
        },
        filename: undefined,
        identifierName: undefined,
      },
      typeAnnotation: {
        type: "TSTypeLiteral",
        start: 767,
        end: 851,
        loc: {
          start: {
            line: 21,
            column: 115,
            index: 767,
          },
          end: {
            line: 26,
            column: 1,
            index: 851,
          },
          filename: undefined,
          identifierName: undefined,
        },
        members: [
          {
            type: "TSPropertySignature",
            start: 771,
            end: 782,
            loc: {
              start: {
                line: 22,
                column: 2,
                index: 771,
              },
              end: {
                line: 22,
                column: 13,
                index: 782,
              },
              filename: undefined,
              identifierName: undefined,
            },
            key: {
              type: "Identifier",
              start: 771,
              end: 774,
              loc: {
                start: {
                  line: 22,
                  column: 2,
                  index: 771,
                },
                end: {
                  line: 22,
                  column: 5,
                  index: 774,
                },
                filename: undefined,
                identifierName: "foo",
              },
              name: "foo",
              leadingComments: undefined,
              innerComments: undefined,
              trailingComments: undefined,
            },
            computed: false,
            typeAnnotation: {
              type: "TSTypeAnnotation",
              start: 774,
              end: 782,
              loc: {
                start: {
                  line: 22,
                  column: 5,
                  index: 774,
                },
                end: {
                  line: 22,
                  column: 13,
                  index: 782,
                },
                filename: undefined,
                identifierName: undefined,
              },
              typeAnnotation: {
                type: "TSStringKeyword",
                start: 776,
                end: 782,
                loc: {
                  start: {
                    line: 22,
                    column: 7,
                    index: 776,
                  },
                  end: {
                    line: 22,
                    column: 13,
                    index: 782,
                  },
                  filename: undefined,
                  identifierName: undefined,
                },
                leadingComments: undefined,
                innerComments: undefined,
                trailingComments: undefined,
              },
              leadingComments: undefined,
              innerComments: undefined,
              trailingComments: undefined,
            },
            leadingComments: undefined,
            innerComments: undefined,
            trailingComments: undefined,
          },
          {
            type: "TSPropertySignature",
            start: 785,
            end: 797,
            loc: {
              start: {
                line: 23,
                column: 2,
                index: 785,
              },
              end: {
                line: 23,
                column: 14,
                index: 797,
              },
              filename: undefined,
              identifierName: undefined,
            },
            key: {
              type: "Identifier",
              start: 785,
              end: 788,
              loc: {
                start: {
                  line: 23,
                  column: 2,
                  index: 785,
                },
                end: {
                  line: 23,
                  column: 5,
                  index: 788,
                },
                filename: undefined,
                identifierName: "bar",
              },
              name: "bar",
              leadingComments: undefined,
              innerComments: undefined,
              trailingComments: undefined,
            },
            computed: false,
            typeAnnotation: {
              type: "TSTypeAnnotation",
              start: 788,
              end: 796,
              loc: {
                start: {
                  line: 23,
                  column: 5,
                  index: 788,
                },
                end: {
                  line: 23,
                  column: 13,
                  index: 796,
                },
                filename: undefined,
                identifierName: undefined,
              },
              typeAnnotation: {
                type: "TSNumberKeyword",
                start: 790,
                end: 796,
                loc: {
                  start: {
                    line: 23,
                    column: 7,
                    index: 790,
                  },
                  end: {
                    line: 23,
                    column: 13,
                    index: 796,
                  },
                  filename: undefined,
                  identifierName: undefined,
                },
                leadingComments: undefined,
                innerComments: undefined,
                trailingComments: undefined,
              },
              leadingComments: undefined,
              innerComments: undefined,
              trailingComments: undefined,
            },
            leadingComments: undefined,
            innerComments: undefined,
            trailingComments: undefined,
          },
          {
            type: "TSPropertySignature",
            start: 800,
            end: 814,
            loc: {
              start: {
                line: 24,
                column: 2,
                index: 800,
              },
              end: {
                line: 24,
                column: 16,
                index: 814,
              },
              filename: undefined,
              identifierName: undefined,
            },
            key: {
              type: "Identifier",
              start: 800,
              end: 803,
              loc: {
                start: {
                  line: 24,
                  column: 2,
                  index: 800,
                },
                end: {
                  line: 24,
                  column: 5,
                  index: 803,
                },
                filename: undefined,
                identifierName: "baz",
              },
              name: "baz",
              leadingComments: undefined,
              innerComments: undefined,
              trailingComments: undefined,
            },
            computed: false,
            optional: true,
            typeAnnotation: {
              type: "TSTypeAnnotation",
              start: 804,
              end: 813,
              loc: {
                start: {
                  line: 24,
                  column: 6,
                  index: 804,
                },
                end: {
                  line: 24,
                  column: 15,
                  index: 813,
                },
                filename: undefined,
                identifierName: undefined,
              },
              typeAnnotation: {
                type: "TSBooleanKeyword",
                start: 806,
                end: 813,
                loc: {
                  start: {
                    line: 24,
                    column: 8,
                    index: 806,
                  },
                  end: {
                    line: 24,
                    column: 15,
                    index: 813,
                  },
                  filename: undefined,
                  identifierName: undefined,
                },
                leadingComments: undefined,
                innerComments: undefined,
                trailingComments: undefined,
              },
              leadingComments: undefined,
              innerComments: undefined,
              trailingComments: undefined,
            },
            leadingComments: undefined,
            innerComments: undefined,
            trailingComments: undefined,
          },
          {
            type: "TSPropertySignature",
            start: 817,
            end: 849,
            loc: {
              start: {
                line: 25,
                column: 2,
                index: 817,
              },
              end: {
                line: 25,
                column: 34,
                index: 849,
              },
              filename: undefined,
              identifierName: undefined,
            },
            key: {
              type: "Identifier",
              start: 817,
              end: 821,
              loc: {
                start: {
                  line: 25,
                  column: 2,
                  index: 817,
                },
                end: {
                  line: 25,
                  column: 6,
                  index: 821,
                },
                filename: undefined,
                identifierName: "fooz",
              },
              name: "fooz",
              leadingComments: undefined,
              innerComments: undefined,
              trailingComments: undefined,
            },
            computed: false,
            optional: true,
            typeAnnotation: {
              type: "TSTypeAnnotation",
              start: 822,
              end: 849,
              loc: {
                start: {
                  line: 25,
                  column: 7,
                  index: 822,
                },
                end: {
                  line: 25,
                  column: 34,
                  index: 849,
                },
                filename: undefined,
                identifierName: undefined,
              },
              typeAnnotation: {
                type: "TSArrayType",
                start: 824,
                end: 849,
                loc: {
                  start: {
                    line: 25,
                    column: 9,
                    index: 824,
                  },
                  end: {
                    line: 25,
                    column: 34,
                    index: 849,
                  },
                  filename: undefined,
                  identifierName: undefined,
                },
                elementType: {
                  type: "TSParenthesizedType",
                  start: 824,
                  end: 847,
                  loc: {
                    start: {
                      line: 25,
                      column: 9,
                      index: 824,
                    },
                    end: {
                      line: 25,
                      column: 32,
                      index: 847,
                    },
                    filename: undefined,
                    identifierName: undefined,
                  },
                  typeAnnotation: {
                    type: "TSUnionType",
                    start: 825,
                    end: 846,
                    loc: {
                      start: {
                        line: 25,
                        column: 10,
                        index: 825,
                      },
                      end: {
                        line: 25,
                        column: 31,
                        index: 846,
                      },
                      filename: undefined,
                      identifierName: undefined,
                    },
                    types: [
                      {
                        type: "TSLiteralType",
                        start: 825,
                        end: 830,
                        loc: {
                          start: {
                            line: 25,
                            column: 10,
                            index: 825,
                          },
                          end: {
                            line: 25,
                            column: 15,
                            index: 830,
                          },
                          filename: undefined,
                          identifierName: undefined,
                        },
                        literal: {
                          type: "StringLiteral",
                          start: 825,
                          end: 830,
                          loc: {
                            start: {
                              line: 25,
                              column: 10,
                              index: 825,
                            },
                            end: {
                              line: 25,
                              column: 15,
                              index: 830,
                            },
                            filename: undefined,
                            identifierName: undefined,
                          },
                          extra: {
                            rawValue: "abc",
                            raw: "'abc'",
                          },
                          value: "abc",
                          leadingComments: undefined,
                          innerComments: undefined,
                          trailingComments: undefined,
                        },
                        leadingComments: undefined,
                        innerComments: undefined,
                        trailingComments: undefined,
                      },
                      {
                        type: "TSLiteralType",
                        start: 833,
                        end: 838,
                        loc: {
                          start: {
                            line: 25,
                            column: 18,
                            index: 833,
                          },
                          end: {
                            line: 25,
                            column: 23,
                            index: 838,
                          },
                          filename: undefined,
                          identifierName: undefined,
                        },
                        literal: {
                          type: "StringLiteral",
                          start: 833,
                          end: 838,
                          loc: {
                            start: {
                              line: 25,
                              column: 18,
                              index: 833,
                            },
                            end: {
                              line: 25,
                              column: 23,
                              index: 838,
                            },
                            filename: undefined,
                            identifierName: undefined,
                          },
                          extra: {
                            rawValue: "xyz",
                            raw: "'xyz'",
                          },
                          value: "xyz",
                          leadingComments: undefined,
                          innerComments: undefined,
                          trailingComments: undefined,
                        },
                        leadingComments: undefined,
                        innerComments: undefined,
                        trailingComments: undefined,
                      },
                      {
                        type: "TSLiteralType",
                        start: 841,
                        end: 846,
                        loc: {
                          start: {
                            line: 25,
                            column: 26,
                            index: 841,
                          },
                          end: {
                            line: 25,
                            column: 31,
                            index: 846,
                          },
                          filename: undefined,
                          identifierName: undefined,
                        },
                        literal: {
                          type: "StringLiteral",
                          start: 841,
                          end: 846,
                          loc: {
                            start: {
                              line: 25,
                              column: 26,
                              index: 841,
                            },
                            end: {
                              line: 25,
                              column: 31,
                              index: 846,
                            },
                            filename: undefined,
                            identifierName: undefined,
                          },
                          extra: {
                            rawValue: "123",
                            raw: "'123'",
                          },
                          value: "123",
                          leadingComments: undefined,
                          innerComments: undefined,
                          trailingComments: undefined,
                        },
                        leadingComments: undefined,
                        innerComments: undefined,
                        trailingComments: undefined,
                      },
                    ],
                    leadingComments: undefined,
                    innerComments: undefined,
                    trailingComments: undefined,
                  },
                  leadingComments: undefined,
                  innerComments: undefined,
                  trailingComments: undefined,
                },
                leadingComments: undefined,
                innerComments: undefined,
                trailingComments: undefined,
              },
              leadingComments: undefined,
              innerComments: undefined,
              trailingComments: undefined,
            },
            leadingComments: undefined,
            innerComments: undefined,
            trailingComments: undefined,
          },
        ],
        leadingComments: undefined,
        innerComments: undefined,
        trailingComments: undefined,
      },
      leadingComments: undefined,
      innerComments: undefined,
      trailingComments: undefined,
    },
    leadingComments: undefined,
    innerComments: undefined,
    trailingComments: undefined,
  },
  {
    typeAnnotation: {
      typeAnnotation: {
        type: "TSTupleType",
        start: 700,
        end: 723,
        loc: {
          start: {
            line: 21,
            column: 48,
            index: 700,
          },
          end: {
            line: 21,
            column: 71,
            index: 723,
          },
          filename: undefined,
          identifierName: undefined,
        },
        elementTypes: [
          {
            type: "TSStringKeyword",
            start: 701,
            end: 707,
            loc: {
              start: {
                line: 21,
                column: 49,
                index: 701,
              },
              end: {
                line: 21,
                column: 55,
                index: 707,
              },
              filename: undefined,
              identifierName: undefined,
            },
            leadingComments: undefined,
            innerComments: undefined,
            trailingComments: undefined,
          },
          {
            type: "TSNumberKeyword",
            start: 709,
            end: 715,
            loc: {
              start: {
                line: 21,
                column: 57,
                index: 709,
              },
              end: {
                line: 21,
                column: 63,
                index: 715,
              },
              filename: undefined,
              identifierName: undefined,
            },
            leadingComments: undefined,
            innerComments: undefined,
            trailingComments: undefined,
          }
        ],
        leadingComments: undefined,
        innerComments: undefined,
        trailingComments: undefined,
      }
    }
  }
]

test('toJSONSchema', () => {
  const correct = [
    {
    type: "string"
    },
    {
      type: "array",
      items: {
        type: "boolean"
      }
    },
    {
      enum: [ "abc", "xyz" ]
    },
    {
      type: "array",
      items: {
        enum: [ "foo", "bar" ]
      },
    },
    {
      type: "object",
      required: [ "foo", "bar" ],
      properties: {
        foo: {
          type: "string"
        },
        bar: {
          type: "number"
        },
        baz: {
          type: "boolean"
        },
        fooz: {
          type: "array",
          items: {
            enum: ['abc', 'xyz', '123']
          }
        }
      }
    },
    {
      type: 'array',
      prefixItems: [
        {
          type: 'string'
        },
        {
          type: 'number'
        }
      ]
    }
  ]

  const schemas = []
  for (const param of params) {
    schemas.push(toJsonSchema(param.typeAnnotation.typeAnnotation))
  }

  // console.log(schemas);

  expect(schemas).toEqual(correct)
})

test('jdoc2jsonSchemas — primitive types & simple arrays', () => {
  const types = [
    'string',
    'number',
    'boolean',
    'string[]',
    'number[]',
    'boolean[]',
  ]

  const correct = [
    {
      type: 'string'
    },
    {
      type: 'number'
    },
    {
      type: 'boolean'
    },
    {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    {
      type: 'array',
      items: {
        type: 'number'
      }
    },
    {
      type: 'array',
      items: {
        type: 'boolean'
      }
    }
  ]

  const schemas = []
  for (const type of types) {
    schemas.push(jdoc2jsonSchema(type))
  }

  expect(schemas).toEqual(correct)
})