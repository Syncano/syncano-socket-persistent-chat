import { expect } from 'chai';
import { describe, it } from 'mocha';
import { run } from '@syncano/test';
import 'dotenv/config';

const { SENDING_USER_ID: id, SENDING_USER_USERNAME: username, TEST_MESSAGE_TO } = process.env;
const meta = {
  user: { id: parseInt(id, 10), username }
};

describe('send-private-chat', () => {
  const args = { message_to: TEST_MESSAGE_TO, message: 'I love JS' };

  it('should return detail of message sent if valid parameters supplied', async () => {
    const { data: chatResponse, code } = await run('send-private-chat', { args, meta });
    expect(code).to.equal(200);
    expect(chatResponse).to.have.property('message');
    expect(chatResponse.message).to.equal('I love JS');
    expect(chatResponse).to.have.property('message_to');
    expect(chatResponse).to.have.property('message_from');
    expect(chatResponse.message_from).to.equal(username);
  });

  it('should return "Validation error(s)" if empty message_to parameter sent', async () => {
    const argsValidation = { ...args, message_to: '' };
    const { data, code } = await run('send-private-chat', { args: argsValidation, meta });
    expect(code).to.equal(400);
    expect(data).to.have.property('message');
    expect(data).to.have.property('details');
    expect(data.message).to.equal('Validation error(s)');
  });

  it('should fail to send private message if user not authenticated', async () => {
    const argsInvalidUser = { ...args, _user_key: '' };
    const { data, code } = await run('send-private-chat', { args: argsInvalidUser });
    expect(code).to.equal(401);
    expect(data).to.have.property('message');
    expect(data.message).to.equal('Unauthorized');
  });

  it('should fail to send private message if user sending message to does not exist', async () => {
    const argsInvalidUser = { ...args, message_to: 'doesNotExist' };
    const { data, code } = await run('send-private-chat', { args: argsInvalidUser, meta });
    expect(code).to.equal(400);
    expect(data).to.have.property('message');
    expect(data.message).to.equal('User sending message to does not exist');
  });
});
