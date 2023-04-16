import {paletteDataFn} from './palette_data.js'
import {DynamoDBClient} from '@aws-sdk/client-dynamodb'
import {DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand} from '@aws-sdk/lib-dynamodb'

process.env.PALETTES_TABLE_NAME = 'test-eighty4-colors-palettes'

const dynamodbDocClient = new DynamoDBDocumentClient(new DynamoDBClient({region: 'us-east-2'}))

describe('palette_data.js', () => {

    describe('GET palettes', () => {

        it('happy path', async () => {
            const userId = makeUserId()
            const dynamodbClient = DynamoDBDocumentClient.from(new DynamoDBClient({region: 'us-east-2'}))
            await dynamodbClient.send(new PutCommand({
                TableName: process.env.PALETTES_TABLE_NAME,
                Item: {
                    user_id: userId,
                    palette_ids: ['1', '2', '3'],
                    p1n: 'midnight blues',
                    p2n: 'kind of blue',
                    p3n: 'happy happy village paint',
                    p1c: ['#333', '#666', '#999'],
                    p2c: ['#000', '#fff'],
                    p3c: ['#aaa', '#ccc', '#eee'],
                },
            }))
            const event = {
                httpMethod: 'GET',
                userId,
            }
            const response = await paletteDataFn(event)
            const palettes = JSON.parse(response.body)
            expect(palettes[0]).toStrictEqual({
                id: '1',
                name: 'midnight blues',
                colors: ['#333', '#666', '#999'],
            })
            expect(palettes[1]).toStrictEqual({
                id: '2',
                name: 'kind of blue',
                colors: ['#000', '#fff'],
            })
            expect(palettes[2]).toStrictEqual({
                id: '3',
                name: 'happy happy village paint',
                colors: ['#aaa', '#ccc', '#eee'],
            })
        })

        it('no database record', async () => {
            const response = await paletteDataFn({
                userId: makeUserId(),
                httpMethod: 'GET',
            })
            const palettes = JSON.parse(response.body)
            expect(palettes).toHaveLength(0)
        })

        it('no palettes data', async () => {
            const userId = makeUserId()
            const dynamodbClient = DynamoDBDocumentClient.from(new DynamoDBClient({region: 'us-east-2'}))
            await dynamodbClient.send(new PutCommand({
                TableName: process.env.PALETTES_TABLE_NAME,
                Item: {
                    user_id: userId,
                    palette_ids: [],
                },
            }))
            const event = {
                httpMethod: 'GET',
                userId,
            }
            const response = await paletteDataFn(event)
            const palettes = JSON.parse(response.body)
            expect(palettes).toHaveLength(0)
        })

        it('interops with POST CREATE_PALETTE data', async () => {
            const userId = makeUserId()
            const createEvent = {
                httpMethod: 'POST',
                userId: userId,
                body: JSON.stringify({
                    ops: [
                        {
                            method: 'CREATE_PALETTE',
                            data: {
                                name: 'midnight blues',
                                colors: ['#333', '#666', '#999'],
                            },
                        },
                        {
                            method: 'CREATE_PALETTE',
                            data: {
                                name: 'kind of blue',
                                colors: ['#000', '#fff'],
                            },
                        },
                        {
                            method: 'CREATE_PALETTE',
                            data: {
                                name: 'happy happy village paint',
                                colors: ['#aaa', '#ccc', '#eee'],
                            },
                        },
                    ],
                }),
            }
            const getEvent = {
                httpMethod: 'GET',
                userId,
            }
            const createResponse = await paletteDataFn(createEvent)
            expect(JSON.parse(createResponse.body).results.map(r => r.success)).toStrictEqual([true, true, true])
            const getResponse = await paletteDataFn(getEvent)
            const palettes = JSON.parse(getResponse.body)
            palettes.forEach(p => delete p.id)
            expect(palettes[0]).toStrictEqual({
                name: 'midnight blues',
                colors: ['#333', '#666', '#999'],
            })
            expect(palettes[1]).toStrictEqual({
                name: 'kind of blue',
                colors: ['#000', '#fff'],
            })
            expect(palettes[2]).toStrictEqual({
                name: 'happy happy village paint',
                colors: ['#aaa', '#ccc', '#eee'],
            })
        })
    })

    describe('POST palette cdc ops', () => {

        describe('CREATE_PALETTE', () => {

            it('creates an unnamed palette for a new user', async () => {
                const userId = makeUserId()
                const event = {
                    httpMethod: 'POST',
                    userId: userId,
                    body: JSON.stringify({
                        ops: [
                            {
                                method: 'CREATE_PALETTE',
                                data: {
                                    colors: ['#000'],
                                },
                            },
                        ],
                    }),
                }
                const result = await paletteDataFn(event)
                expect(result.statusCode).toBe(200)
                const {results} = JSON.parse(result.body)
                expect(results[0].error).toBeUndefined()
                expect(results[0].success).toBe(true)

                const {paletteId} = results[0]

                const {Item: data} = await dynamodbDocClient.send(new GetCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
                expect(data.palette_ids).toStrictEqual([paletteId])
                expect(data[`p${paletteId}n`]).toBeUndefined()
                expect(data[`p${paletteId}c`]).toStrictEqual(['#000'])
                await dynamodbDocClient.send(new DeleteCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
            })

            it('creates a named palette for a new user', async () => {
                const userId = makeUserId()
                const event = {
                    httpMethod: 'POST',
                    userId: userId,
                    body: JSON.stringify({
                        ops: [
                            {
                                method: 'CREATE_PALETTE',
                                data: {
                                    name: 'Metallica (self-titled)',
                                    colors: ['#000'],
                                },
                            },
                        ],
                    }),
                }
                const result = await paletteDataFn(event)
                expect(result.statusCode).toBe(200)
                const {results} = JSON.parse(result.body)
                expect(results[0].error).toBeUndefined()
                expect(results[0].success).toBe(true)

                const {paletteId} = results[0]

                const {Item: data} = await dynamodbDocClient.send(new GetCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
                expect(data.palette_ids).toStrictEqual([paletteId])
                expect(data[`p${paletteId}n`]).toBe('Metallica (self-titled)')
                expect(data[`p${paletteId}c`]).toStrictEqual(['#000'])
                await dynamodbDocClient.send(new DeleteCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
            })
        })

        describe('DELETE_PALETTE', () => {

            it('deletes a palette', async () => {
                const userId = makeUserId()
                await dynamodbDocClient.send(new PutCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Item: {
                        user_id: userId,
                        palette_ids: ['abc', 'def'],
                        pabcn: 'Bright Sesame Street Alphabet Letter Colors',
                        pabcc: ['#ee0000', '#00ee00', '#0000ee'],
                        pdefn: 'Mos Gold',
                        pdefc: ['#ffdf00'],
                    },
                }))
                const event = {
                    httpMethod: 'POST',
                    userId: userId,
                    body: JSON.stringify({
                        ops: [
                            {
                                method: 'DELETE_PALETTE',
                                data: {
                                    paletteId: 'abc',
                                    paletteIndex: 0,
                                },
                            },
                        ],
                    }),
                }
                const result = await paletteDataFn(event)
                expect(result.statusCode).toBe(200)
                const {results} = JSON.parse(result.body)
                expect(results[0].error).toBeUndefined()
                expect(results[0].success).toBe(true)

                const {Item: data} = await dynamodbDocClient.send(new GetCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
                expect(data.palette_ids).toStrictEqual(['def'])
                expect(data.pabcn).toBeUndefined()
                expect(data.pdefn).toBe('Mos Gold')
                expect(data.pabcc).toBeUndefined()
                expect(data.pdefc).toStrictEqual(['#ffdf00'])
                await dynamodbDocClient.send(new DeleteCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
            })

            it('errors when index reference is wrong', async () => {
                const userId = makeUserId()
                await dynamodbDocClient.send(new PutCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Item: {
                        user_id: userId,
                        palette_ids: ['abc', 'def'],
                        pabcn: 'Bright Sesame Street Alphabet Letter Colors',
                        pabcc: ['#ee0000', '#00ee00', '#0000ee'],
                        pdefn: 'Mos Gold',
                        pdefc: ['#ffdf00'],
                    },
                }))
                const event = {
                    httpMethod: 'POST',
                    userId: userId,
                    body: JSON.stringify({
                        ops: [
                            {
                                method: 'DELETE_PALETTE',
                                data: {
                                    paletteId: 'abc',
                                    paletteIndex: 1,
                                },
                            },
                        ],
                    }),
                }
                const result = await paletteDataFn(event)
                expect(result.statusCode).toBe(200)
                const {results} = JSON.parse(result.body)
                expect(results[0].error).toBe('The conditional request failed')
                expect(results[0].success).toBe(false)

                const {Item: data} = await dynamodbDocClient.send(new GetCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
                expect(data.palette_ids).toHaveLength(2)
                expect(data.pabcn).toBe('Bright Sesame Street Alphabet Letter Colors')
                expect(data.pdefn).toBe('Mos Gold')
                expect(data.pabcc).toStrictEqual(['#ee0000', '#00ee00', '#0000ee'])
                expect(data.pdefc).toStrictEqual(['#ffdf00'])
                await dynamodbDocClient.send(new DeleteCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
            })
        })

        describe('RENAME_PALETTE', () => {

            it('rename an unnamed palette', async () => {
                const userId = makeUserId()
                await dynamodbDocClient.send(new PutCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Item: {
                        user_id: userId,
                        palette_ids: ['abc'],
                        pabcc: ['#ee0000', '#eeee00', '#0000ee'],
                    },
                }))
                const event = {
                    httpMethod: 'POST',
                    userId: userId,
                    body: JSON.stringify({
                        ops: [
                            {
                                method: 'RENAME_PALETTE',
                                data: {
                                    paletteId: 'abc',
                                    name: 'Primary Colors',
                                },
                            },
                        ],
                    }),
                }
                const result = await paletteDataFn(event)
                expect(result.statusCode).toBe(200)
                const {results} = JSON.parse(result.body)
                expect(results[0].error).toBeUndefined()
                expect(results[0].success).toBe(true)

                const {Item: data} = await dynamodbDocClient.send(new GetCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
                expect(data.palette_ids).toStrictEqual(['abc'])
                expect(data.pabcn).toBe('Primary Colors')
                expect(data.pabcc).toStrictEqual(['#ee0000', '#eeee00', '#0000ee'])
                await dynamodbDocClient.send(new DeleteCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
            })

            it('rename a named palette', async () => {
                const userId = makeUserId()
                await dynamodbDocClient.send(new PutCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Item: {
                        user_id: userId,
                        palette_ids: ['abc'],
                        pabcn: 'Red, Yellow and Blue',
                        pabcc: ['#ee0000', '#eeee00', '#0000ee'],
                    },
                }))
                const event = {
                    httpMethod: 'POST',
                    userId: userId,
                    body: JSON.stringify({
                        ops: [
                            {
                                method: 'RENAME_PALETTE',
                                data: {
                                    paletteId: 'abc',
                                    name: 'Primary Colors',
                                },
                            },
                        ],
                    }),
                }
                const result = await paletteDataFn(event)
                expect(result.statusCode).toBe(200)
                const {results} = JSON.parse(result.body)
                expect(results[0].error).toBeUndefined()
                expect(results[0].success).toBe(true)

                const {Item: data} = await dynamodbDocClient.send(new GetCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
                expect(data.palette_ids).toStrictEqual(['abc'])
                expect(data.pabcn).toBe('Primary Colors')
                expect(data.pabcc).toStrictEqual(['#ee0000', '#eeee00', '#0000ee'])
                await dynamodbDocClient.send(new DeleteCommand({
                    TableName: process.env.PALETTES_TABLE_NAME,
                    Key: {
                        user_id: userId,
                    },
                }))
            })
        })

        describe('op validation', () => {

            const cases = [
                ['ops[0].colors is required to process CREATE_PALETTE', [
                    {
                        method: 'CREATE_PALETTE',
                        data: {},
                    },
                ]],
                ['ops[1].colors is required to process CREATE_PALETTE', [
                    {
                        method: 'CREATE_PALETTE',
                        data: {
                            colors: ['#000'],
                        },
                    },
                    {
                        method: 'CREATE_PALETTE',
                        data: {},
                    },
                ]],
                ['ops[0].name exceeds max length of 64', [
                    {
                        method: 'CREATE_PALETTE',
                        data: {
                            name: 'Giygas will be stronger, a more powerful entity than any other! Why?',
                            colors: ['#000'],
                        },
                    },
                ]],
                ['ops[0].paletteId is required to process DELETE_PALETTE', [
                    {
                        method: 'DELETE_PALETTE',
                        data: {
                            paletteIndex: 0,
                        },
                    },
                ]],
                ['ops[0].paletteIndex is required to process DELETE_PALETTE', [
                    {
                        method: 'DELETE_PALETTE',
                        data: {
                            paletteId: 'a palette id',
                        },
                    },
                ]],
                ['ops[1].paletteIndex is required to process DELETE_PALETTE', [
                    {
                        method: 'DELETE_PALETTE',
                        data: {
                            paletteId: 'a palette id',
                            paletteIndex: 0,
                        },
                    },
                    {
                        method: 'DELETE_PALETTE',
                        data: {
                            paletteId: 'a palette id',
                        },
                    },
                ]],
                [`ops[0].paletteIndex must be an integer for DELETE_PALETTE`, [
                    {
                        method: 'DELETE_PALETTE',
                        data: {
                            paletteId: 'a palette id',
                            paletteIndex: 'a palette index',
                        },
                    },
                ]],
                [`ops[0].paletteIndex must be an integer for DELETE_PALETTE`, [
                    {
                        method: 'DELETE_PALETTE',
                        data: {
                            paletteId: 'a palette id',
                            paletteIndex: 'a palette index',
                        },
                    },
                ]],
                ['ops[0].paletteId is required to process RENAME_PALETTE', [
                    {
                        method: 'RENAME_PALETTE',
                        data: {
                            name: 'a new name',
                        },
                    },
                ]],
                ['ops[0].name is required to process RENAME_PALETTE', [
                    {
                        method: 'RENAME_PALETTE',
                        data: {
                            paletteId: 'a palette id',
                        },
                    },
                ]],
            ]

            test.each(cases)('%s', async (error, ops) => {
                const event = {
                    httpMethod: 'POST',
                    body: JSON.stringify({ops}),
                }
                const response = await paletteDataFn(event)
                expect(response.statusCode).toBe(400)
                expect(response.body).toBe(error)
            })
        })
    })
})

function makeUserId() {
    const letters = 'abcdefghijklmnopqrstuvwxyz'
    let userId = ''
    for (let i = 0; i < 6; i++) {
        userId += letters.charAt(Math.floor(Math.random() * 26))
    }
    return userId
}
