import { expect } from 'chai';
import { describe, it } from 'mocha';
import { run, generateMeta } from '@syncano/test';
import 'dotenv/config';

describe('private-messages', () => {
  const { SENDING_USER_ID: id, SENDING_USER_USERNAME: username, TEST_MESSAGE_TO: message_to } = process.env;
  const metaUser = {
    user: { id: parseInt(id, 10), username }
  };
  const metaPrivateMessages = generateMeta('private-messages');
  const meta = { ...metaPrivateMessages, ...metaUser };
  let message_id;

  describe('POST', () => {
    const args = { message_to, message_text: 'I love JS' };

    it('should return detail of message sent if valid parameters supplied', async () => {
      meta.request.REQUEST_METHOD = 'POST';
      const { data: chatResponse, code } = await run('private-messages', { args, meta });
      expect(code).to.equal(200);
      expect(chatResponse).to.have.property('message_text');
      expect(chatResponse.message_text).to.equal('I love JS');
      expect(chatResponse).to.have.property('message_to');
      expect(chatResponse).to.have.property('message_from');
      expect(chatResponse.message_from).to.equal(username);
      message_id = chatResponse.id;
    });

    it('should return "Validation error(s)" if empty message_to parameter sent', async () => {
      const argsValidation = { ...args, message_to: '' };
      const { data, code } = await run('private-messages', { args: argsValidation, meta });
      expect(code).to.equal(400);
      expect(data).to.have.property('message');
      expect(data).to.have.property('details');
      expect(data.message).to.equal('Validation error(s)');
      expect(data.details.message_to).to.equal('The message_to field is required');
    });

    it('should fail to send private message if user not authenticated', async () => {
      const argsInvalidUser = { ...args, _user_key: '' };
      const { data, code } = await run('private-messages', { args: argsInvalidUser });
      expect(code).to.equal(401);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('Unauthorized');
    });

    it('should fail to send private message if user sending message to does not exist', async () => {
      const argsInvalidUser = { ...args, message_to: 'doesNotExist' };
      const { data, code } = await run('private-messages', { args: argsInvalidUser, meta });
      expect(code).to.equal(400);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('User sending message to does not exist');
    });
  });

  describe('GET', () => {
    it('should list private chat history with another user if valid params passed', async () => {
      meta.request.REQUEST_METHOD = 'GET';
      const { data, code } = await run('private-messages', { args: { message_to }, meta });
      expect(code).to.equal(200);
      expect(data).to.be.an.instanceof(Array);
      expect(data.length).to.be.at.least(1);
      expect(data[0]).to.have.property('id');
      expect(data[0]).to.have.property('message_text');
    });

    it('should return "Validation error(s)" if message_to not passed as params', async () => {
      const { data, code } = await run('private-messages', { args: {}, meta });
      expect(code).to.equal(400);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('Validation error(s)');
      expect(data).to.have.property('details');
      expect(data.details.message_to).to.equal('The message_to field is required');
    });

    it('should notify user does not exist if trying to get chat history with non existing user', async () => {
      const { data, code } = await run('private-messages', { args: { message_to: 'userDoesNotExist' }, meta });
      expect(code).to.equal(404);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('User to get chat history with does not exist');
    });
  });

  describe('PATCH', () => {
    it('should update chat message successfully if valid parameters sent', async () => {
      meta.request.REQUEST_METHOD = 'PATCH';
      const updateArgs = { message_text: 'I love JS updated', message_id };
      const { data, code } = await run('private-messages', { args: updateArgs, meta });
      expect(code).to.equal(200);
      expect(data).to.have.property('message_text');
      expect(data.message_text).to.equal('I love JS updated');
      expect(data).to.have.property('id');
      expect(data.id).to.equal(message_id);
    });

    it('should fail to update chat message if user did not create message', async () => {
      const unAuthorizeUserMeta = { ...meta, user: { id: parseInt(-1, 10), username } };
      unAuthorizeUserMeta.request.REQUEST_METHOD = 'PATCH';
      const updateArgs = { message_text: 'I love JS updated', message_id };
      const { data, code } = await run('private-messages', { args: updateArgs, meta: unAuthorizeUserMeta });
      expect(code).to.equal(401);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('You don\'t have permission to update message');
    });
  });

  describe('DELETE', () => {
    it('should fail to delete chat message if user did not create message', async () => {
      const unAuthorizeUserMeta = { ...meta, user: { id: parseInt(-1, 10), username } };
      unAuthorizeUserMeta.request.REQUEST_METHOD = 'DELETE';
      const { data, code } = await run('private-messages', { args: { message_id }, meta: unAuthorizeUserMeta });
      expect(code).to.equal(401);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('You don\'t have permission to delete message');
    });

    it('should delete chat message successfully if valid valid parameters sent', async () => {
      meta.request.REQUEST_METHOD = 'DELETE';
      const { data, code } = await run('private-messages', { args: { message_id }, meta });
      console.log(data);
      expect(code).to.equal(200);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('Message deleted successfully');
    });
  });
});
