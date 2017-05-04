'use strict';

console.log('Loading function');

const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();

/**
 * Provide an event that contains the following keys:
 *
 *   - key : public key
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */
exports.handler = (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
};