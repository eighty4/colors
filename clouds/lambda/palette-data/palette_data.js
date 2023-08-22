/**
 * @typedef {Object} LambdaHttpRequest
 * @property {string} body
 * @property {string} httpMethod
 * @property {string} path
 *
 * @typedef {Object} LambdaHttpResponse
 * @property {string} body
 * @property {number} statusCode
 * @property {Object} [headers]
 *
 * @typedef {Object} Palette
 * @property {Array<string>} colors
 * @property {string} name
 *
 * @typedef {Object} PaletteOpData
 * @property {string} [name]
 * @property {Array<string>} [colors]
 * @property {string} [paletteId]
 * @property {string} [paletteIndex]
 *
 * @typedef {Object} PaletteOp
 * @property {Object} data
 * @property {string} method
 *
 * @typedef {Object} PaletteOpResult
 * @property {boolean} success
 * @property {string} [error]
 *
 * @typedef {Object} PaletteOpsResult
 * @property {Array<PaletteOpResult>} string
 */

import {DynamoDBClient, UpdateItemCommand} from '@aws-sdk/client-dynamodb'
import {v4} from 'uuid'
import {GetCommand} from '@aws-sdk/lib-dynamodb'

const dynamodbClient = new DynamoDBClient({region: 'us-east-2'})

/**
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 *
 * @param {LambdaHttpRequest} event
 * //@param {Object} context
 * @returns {LambdaHttpResponse}
 */
export async function paletteDataFn({httpMethod, body, userId}) {
    if (httpMethod === 'GET') {
        const palettes = await getPalettes(userId)
        return {statusCode: 200, headers: {}, body: JSON.stringify(palettes)}
    } else if (httpMethod === 'POST') {
        if (body) {
            const {ops} = JSON.parse(body)
            if (ops) {
                try {
                    validateOps(ops)
                } catch (e) {
                    return {statusCode: 400, body: e.message}
                }
                try {
                    const results = await processOps(userId, ops)
                    return {statusCode: 200, headers: {'Content-Type': 'application/json'}, body: JSON.stringify({results})}
                } catch (e) {
                    return {statusCode: 500, body: e.message}
                }
            }
        }
        return {statusCode: 400}
    }
    return {statusCode: 405}
}

/**
 * @param {string} userId
 * @returns {Promise<Array<Palette>>}
 */
async function getPalettes(userId) {
    const {Item: data} = await dynamodbClient.send(new GetCommand({
        TableName: tableName(),
        Key: {
            user_id: userId,
        },
    }))

    const palettes = []
    if (data) {
        for (const paletteId of data.palette_ids) {
            const name = data[`p${paletteId}n`]
            const color = data[`p${paletteId}c`]
            palettes.push({
                id: paletteId,
                name: name,
                colors: color,
            })
        }
    }
    return palettes
}

/**
 * @param {Array<PaletteOp>} ops
 */
function validateOps(ops) {
    for (let i = 0; i < ops.length; i++) {
        const {data, method} = ops[i]
        switch (method) {
            case 'CREATE_PALETTE':
                if (data.name && data.name.length > 64) {
                    throw new Error(`ops[${i}].name exceeds max length of 64`)
                }
                if (!data.colors || !data.colors.length) {
                    throw new Error(`ops[${i}].colors is required to process ${method}`)
                }
                break
            case 'DELETE_PALETTE':
                if (!data.paletteId) {
                    throw new Error(`ops[${i}].paletteId is required to process ${method}`)
                }
                if (typeof data.paletteIndex === 'undefined') {
                    throw new Error(`ops[${i}].paletteIndex is required to process ${method}`)
                }
                if (typeof data.paletteIndex !== 'number') {
                    throw new Error(`ops[${i}].paletteIndex must be an integer for ${method}`)
                }
                break
            case 'RENAME_PALETTE':
                if (!data.paletteId) {
                    throw new Error(`ops[${i}].paletteId is required to process ${method}`)
                }
                if (!data.name) {
                    throw new Error(`ops[${i}].name is required to process ${method}`)
                }
                break
            case 'REORDER_PALETTES':
            case 'ADD_COLOR':
            case 'DELETE_COLOR':
            case 'UPDATE_COLOR':
            case 'REORDER_COLOR':
                throw new Error(ops[i].method + ' not yet supported')
            default:
                throw new Error(`ops[${i}].method ${ops[i].method} is not a valid op type`)
        }
    }
}

/**
 * @param {string} userId
 * @param {Array<PaletteOp>} ops
 * @returns {Promise<PaletteOpsResult>}
 */
async function processOps(userId, ops) {
    const results = []
    for (const op of ops) {
        const {paletteId, paletteIndex, colorId, colors, color, name} = op.data
        switch (op.method) {
            case 'CREATE_PALETTE':
                results.push(await createPalette(userId, name, colors))
                break
            case 'DELETE_PALETTE':
                results.push(await deletePalette(userId, paletteId, paletteIndex))
                break
            case 'RENAME_PALETTE':
                results.push(await renamePalette(userId, paletteId, name))
                break
            case 'REORDER_PALETTES':
                results.push(await reorderPalettes(userId, paletteId))
                break
            case 'ADD_COLOR':
                results.push(await addColor(userId, paletteId, color))
                break
            case 'DELETE_COLOR':
                results.push(await addColor(userId, paletteId, colorId))
                break
            case 'UPDATE_COLOR':
                results.push(await updateColor(userId, paletteId, colorId, color))
                break
            case 'REORDER_COLORS':
                results.push(await reorderColors(userId, paletteId))
                break
        }
    }
    return results
}

async function createPalette(userId, name, colors) {
    const paletteId = v4()
    let expression = 'SET #pids = list_append(if_not_exists(#pids, :new_list), :pid), #cn = :cv'
    const values = {
        ':pid': {L: [{S: paletteId}]},
        ':new_list': {L: []},
        ':cv': {L: colors.map(color => ({S: color}))},
    }
    const names = {
        '#pids': 'palette_ids',
        '#cn': `p${paletteId}c`,
    }
    if (name) {
        expression += ', #nn = :nv'
        values[':nv'] = {S: name}
        names['#nn'] = `p${paletteId}n`
    }
    try {
        await dynamodbClient.send(new UpdateItemCommand({
            TableName: tableName(),
            Key: {user_id: {S: userId}},
            UpdateExpression: expression,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
        }))
        return {success: true, paletteId}
    } catch (e) {
        return {success: false, error: e.message}
    }
}

async function deletePalette(userId, paletteId, paletteIndex) {
    try {
        await dynamodbClient.send(new UpdateItemCommand({
            TableName: tableName(),
            Key: {user_id: {S: userId}},
            UpdateExpression: `REMOVE #nn, #cn, palette_ids[${paletteIndex}]`,
            ExpressionAttributeNames: {
                '#nn': `p${paletteId}n`,
                '#cn': `p${paletteId}c`,
            },
            ExpressionAttributeValues: {
                ':pid': {S: paletteId},
            },
            ConditionExpression: `palette_ids[${paletteIndex}] = :pid`,
        }))
        return {success: true}
    } catch (e) {
        return {success: false, error: e.message}
    }
}

async function renamePalette(userId, paletteId, name) {
    try {
        await dynamodbClient.send(new UpdateItemCommand({
            TableName: tableName(),
            Key: {user_id: {S: userId}},
            UpdateExpression: `SET #nn = :nv`,
            ExpressionAttributeNames: {
                '#nn': `p${paletteId}n`,
            },
            ExpressionAttributeValues: {
                ':nv': {S: name},
            },
        }))
        return {success: true}
    } catch (e) {
        return {success: false, error: e.message}
    }
}

async function reorderPalettes(userId, paletteId) {
    throw new Error('not yet implemented')
}

async function addColor(userId, paletteId, color) {

}

async function deleteColor(userId, paletteId, colorId) {

}

async function updateColor(userId, paletteId, colorId, color) {

}

async function reorderColors(userId, paletteId) {
    throw new Error('not yet implemented')
}

const tableName = () => process.env.PALETTES_TABLE_NAME || 'eighty4-colors-palettes'
