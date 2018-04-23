import { expect } from 'chai';
import { describe, it } from 'mocha';
import { run } from '@syncano/test';
import 'dotenv/config';

const { SENDING_USER_ID: id, SENDING_USER_USERNAME: username, TEST_GROUP_ID } = process.env;
const meta = {
  user: { id: parseInt(id, 10), username }
};
const args = { room: TEST_GROUP_ID, message: 'I love JS' };

describe('send-message-group', () => {
  it('should return detail of message sent if valid parameters supplied', async () => {
    const { data: chatResponse, code } = await run('send-message-group', { args, meta });
    expect(code).to.equal(200);
    expect(chatResponse).to.have.property('group');
    expect(chatResponse.group).to.equal(TEST_GROUP_ID);
    expect(chatResponse).to.have.property('message');
    expect(chatResponse.message).to.equal('I love JS');
  });

  it('should return "Validation error(s)" if empty room parameter sent', async () => {
    const argsValidation = { ...args, room: '' };
    const { data, code } = await run('send-message-group', { args: argsValidation, meta });
    expect(code).to.equal(400);
    expect(data).to.have.property('message');
    expect(data.message).to.equal('Validation error(s)');
    expect(data).to.have.property('details');
    expect(data.details.room).to.equal('The room field is required');
  });
});
