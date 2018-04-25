import { expect } from 'chai';
import { describe, it } from 'mocha';
import { run, generateMeta } from '@syncano/test';
import 'dotenv/config';

describe('group-messages', () => {
  const { SENDING_USER_ID: id, SENDING_USER_USERNAME: username } = process.env;
  const metaUser = {
    user: { id: parseInt(id, 10), username }
  };
  const metaGroup = generateMeta('group');
  const metaGroupMessages = generateMeta('group-messages');
  const meta = { ...metaGroupMessages, ...metaUser };
  let group_id;
  let message_id;

  let args = { message_text: 'I love JS' };

  before(async () => {
    const { data } = await run('groups', { args: { group_name: 'testGroup' }, meta: metaGroup });
    group_id = data.id;
    args = { ...args, room: group_id };
  });

  after(async () => {
    metaGroup.request.REQUEST_METHOD = 'DELETE';
    await await run('groups', { args: { group_id }, meta: metaGroup });
  });

  describe('POST', () => {
    it('should return detail of message sent to group if valid parameters supplied', async () => {
      meta.request.REQUEST_METHOD = 'POST';
      const { data: chatResponse, code } = await run('group-messages', { args, meta });
      expect(code).to.equal(200);
      expect(chatResponse).to.have.property('group');
      expect(chatResponse.group).to.equal(args.room);
      expect(chatResponse).to.have.property('message_text');
      expect(chatResponse.message_text).to.equal('I love JS');
      message_id = chatResponse.id;
    });

    it('should return "Validation error(s)" if empty room parameter sent', async () => {
      const argsValidation = { message: 'I love JS' };
      const { data, code } = await run('group-messages', { args: argsValidation, meta });
      expect(code).to.equal(400);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('Validation error(s)');
      expect(data).to.have.property('details');
      expect(data.details.room).to.equal('The room field is required');
    });
  });

  describe('GET', () => {
    it('should list chat history of group if existing group id passed in params', async () => {
      meta.request.REQUEST_METHOD = 'GET';
      const { data, code } = await run('group-messages', { args: { group_id }, meta });
      expect(code).to.equal(200);
      expect(data).to.be.an.instanceof(Array);
      expect(data.length).to.be.at.least(1);
      expect(data[0]).to.have.property('id');
      expect(data[0]).to.have.property('message_text');
    });

    it('should return "Validation error(s)" if group_id not passed as params', async () => {
      const { data, code } = await run('group-messages', { args: {}, meta });
      expect(code).to.equal(400);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('Validation error(s)');
      expect(data).to.have.property('details');
      expect(data.details.group_id).to.equal('The group_id field is required');
    });
  });

  describe('PATCH', () => {
    it('should update chat message successfully if valid parameters sent', async () => {
      meta.request.REQUEST_METHOD = 'PATCH';
      const updateArgs = { message_text: 'I love JS updated', message_id };
      const { data, code } = await run('group-messages', { args: updateArgs, meta });
      expect(code).to.equal(200);
      expect(data).to.have.property('message_text');
      expect(data.message_text).to.equal('I love JS updated');
      expect(data).to.have.property('group');
      expect(data.group).to.equal(group_id);
      expect(data).to.have.property('id');
      expect(data.id).to.equal(message_id);
    });

    it('should fail to update chat message if user did not create message', async () => {
      const unAuthorizeUserMeta = { ...meta, user: { id: parseInt(-1, 10), username } };
      unAuthorizeUserMeta.request.REQUEST_METHOD = 'PATCH';
      const updateArgs = { ...args, message_text: 'I love JS updated', message_id };
      const { data, code } = await run('group-messages', { args: updateArgs, meta: unAuthorizeUserMeta });
      expect(code).to.equal(401);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('You don\'t have permission to update message');
    });
  });

  describe('DELETE', () => {
    it('should fail to delete chat message if user did not create message', async () => {
      const unAuthorizeUserMeta = { ...meta, user: { id: parseInt(-1, 10), username } };
      unAuthorizeUserMeta.request.REQUEST_METHOD = 'DELETE';
      const { data, code } = await run('group-messages', { args: { message_id }, meta: unAuthorizeUserMeta });
      expect(code).to.equal(401);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('You don\'t have permission to delete message');
    });

    it('should delete chat message successfully if valid valid parameters sent', async () => {
      meta.request.REQUEST_METHOD = 'DELETE';
      const { data, code } = await run('group-messages', { args: { message_id }, meta });
      expect(code).to.equal(200);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('Message deleted successfully');
    });
  });
});
