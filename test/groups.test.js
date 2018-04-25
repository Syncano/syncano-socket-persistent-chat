import { expect } from 'chai';
import { describe, it } from 'mocha';
import { run, generateMeta } from '@syncano/test';
import 'dotenv/config';

describe('groups', () => {
  const meta = generateMeta('groups');
  const args = { group_name: 'groupTest1', purpose: 'Lets talk code here' };
  let group_id = '';

  describe('POST', () => {
    it('should create cat group successfully with valid parameters', async () => {
      meta.request.REQUEST_METHOD = 'POST';
      const { data: chatGroup, code } = await run('groups', { args, meta });
      expect(code).to.equal(201);
      expect(chatGroup).to.have.property('group_name');
      expect(chatGroup.group_name).to.equal('groupTest1');
      expect(chatGroup).to.have.property('purpose');
      expect(chatGroup.purpose).to.equal('Lets talk code here');
      expect(chatGroup).to.have.property('message');
      expect(chatGroup.message).to.equal('Group successfully created');
      expect(chatGroup).to.have.property('id');
      group_id = chatGroup.id;
    });

    it('should return "Validation error(s)" if group_name parameter empty', async () => {
      meta.request.REQUEST_METHOD = 'POST';
      const emptyGroupNameArgs = { ...args, group_name: '' };
      const { data: chatGroup, code } = await run('groups', { args: emptyGroupNameArgs, meta });
      expect(code).to.equal(400);
      expect(chatGroup).to.have.property('message');
      expect(chatGroup.message).to.equal('Validation error(s)');
      expect(chatGroup).to.have.property('details');
      expect(chatGroup.details.group_name).to.equal('The group_name field is required');
    });

    it('should fail to create chat group if group name above 25 characters', async () => {
      meta.request.REQUEST_METHOD = 'POST';
      const tooLongGroupNameArgs = { ...args, group_name: 'this_group_name_is_above_25_characters_so_should_fail' };
      const { data: chatGroup, code } = await run('groups', { args: tooLongGroupNameArgs, meta });
      expect(code).to.equal(400);
      expect(chatGroup).to.have.property('message');
      expect(chatGroup.message).to.equal('Group name must not be greater than 25 characters');
    });

    it('should fail to create chat group if name already exists', async () => {
      meta.request.REQUEST_METHOD = 'POST';
      const { data: chatGroup, code } = await run('groups', { args, meta });
      expect(code).to.equal(400);
      expect(chatGroup).to.have.property('message');
      expect(chatGroup.message).to.equal('Group name already exists');
    });
  });

  describe('GET', () => {
    it('should return "NotFoundError" if group id passed is invalid', async () => {
      meta.request.REQUEST_METHOD = 'GET';
      const { data, code } = await run('groups', { args: { group_id: -1 }, meta });
      expect(code).to.equal(400);
      expect(data).to.have.property('name');
      expect(data.name).to.equal('NotFoundError');
    });

    it('should show details of a chat group if group ID passed is valid', async () => {
      meta.request.REQUEST_METHOD = 'GET';
      const { data: chatGroup, code } = await run('groups', { args: { group_id }, meta });
      expect(code).to.equal(200);
      expect(chatGroup).to.have.property('group_name');
      expect(chatGroup.group_name).to.equal('groupTest1');
      expect(chatGroup).to.have.property('purpose');
      expect(chatGroup.purpose).to.equal('Lets talk code here');
      expect(chatGroup).to.have.property('id');
      expect(chatGroup.id).to.equal(group_id);
    });

    it('should list chat groups if group_id not passed as params', async () => {
      meta.request.REQUEST_METHOD = 'GET';
      const { data, code } = await run('groups', { args: {}, meta });
      expect(code).to.equal(200);
      expect(data[0]).to.have.property('id');
      expect(data).to.be.an.instanceof(Array);
      expect(data.length).to.be.at.least(1);
    });
  });

  describe('PATCH', () => {
    it('should update chat group successfully with valid parameters', async () => {
      meta.request.REQUEST_METHOD = 'PATCH';
      const updateArgs = { ...args, group_name: 'group_one', group_id };
      const { data: chatGroup, code } = await run('groups', { args: updateArgs, meta });
      expect(code).to.equal(200);
      expect(chatGroup).to.have.property('group_name');
      expect(chatGroup.group_name).to.equal('group_one');
      expect(chatGroup).to.have.property('purpose');
      expect(chatGroup.purpose).to.equal('Lets talk code here');
      expect(chatGroup).to.have.property('id');
      expect(chatGroup.id).to.equal(group_id);
    });

    it('should throw "No group name or group purpose to update" if group_name and purpose not passed', async () => {
      meta.request.REQUEST_METHOD = 'PATCH';
      const { data: chatGroup, code } = await run('groups', { args: { group_id }, meta });
      expect(code).to.equal(400);
      expect(chatGroup).to.have.property('message');
      expect(chatGroup.message).to.equal('No group name or group purpose to update');
    });
  });

  describe('DELETE', () => {
    it('should delete cat group successfully with valid parameters', async () => {
      meta.request.REQUEST_METHOD = 'DELETE';
      const { data, code } = await run('groups', { args: { group_id }, meta });
      expect(code).to.equal(200);
      expect(data).to.have.property('message');
      expect(data.message).to.equal('Chat group deleted');
    });
  });

  it('should only be accessed by admin users', async () => {
    meta.request.REQUEST_METHOD = 'GET';
    const nonAdminMeta = { ...meta, token: '' };
    const { data: response, code } = await run('groups', { args: { }, meta: nonAdminMeta });
    expect(code).to.equal(400);
    expect(response.data).to.have.property('detail');
    expect(response.data.detail).to.equal('You do not have permission to perform this action.');
  });
});
