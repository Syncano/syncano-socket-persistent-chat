import Syncano from '@syncano/core';
import { validateRequired, checkRequestMethodType } from './utils/helpers';

export default async (ctx) => {
  const { response, data } = new Syncano(ctx);
  const { meta, args: { group_id, ...groupParams } } = ctx;
  const { group_name, purpose } = groupParams;
  const requestMethod = meta.request.REQUEST_METHOD;
  const expectedMethodTypes = ['POST', 'GET', 'PATCH', 'DELETE'];

  try {
    checkRequestMethodType(requestMethod, expectedMethodTypes);

    if (requestMethod === 'POST') {
      validateRequired({ group_name });

      if (group_name.length > 25) {
        return response.json({ message: 'Group name must not be greater than 25 characters' }, 400);
      }
      const ifGroupExist = await data.chat_groups.where('group_name', group_name).first();
      if (ifGroupExist) {
        return response.json({ message: 'Group name already exists' }, 400);
      }
      const createdGroup = await data.chat_groups.create({ group_name, purpose });
      return response.json({ message: 'Group successfully created', ...createdGroup }, 201);
    }
    if (requestMethod === 'GET') {
      const result = (group_id) ? await data.chat_groups.findOrFail(group_id) : await data.chat_groups.list();
      return response.json(result, 200);
    }
    else if (requestMethod === 'PATCH') {
      validateRequired({ group_id });

      if (!group_name && !purpose) {
        return response.json({ message: 'No group name or group purpose to update' }, 400);
      }
      if (group_name && group_name.length > 25) {
        return response.json({ message: 'Group name must be less than 25 characters' }, 400);
      }
      if (group_name) {
        const ifGroupExist = await data.chat_groups.where('group_name', group_name).first();
        if (ifGroupExist && (ifGroupExist.id !== parseInt(group_id, 10))) {
          return response.json({ message: 'Group name already exists' }, 400);
        }
      }
      const updatedGroup = await data.chat_groups.update(group_id, groupParams);
      return response.json({ message: 'Group successfully updated', ...updatedGroup });
    }
    else if (requestMethod === 'DELETE') {
      validateRequired({ group_id });

      await data.group_chat.where('room', group_id).delete();
      await data.chat_groups.delete(group_id);
      return response.json({ message: 'Chat group deleted' }, 200);
    }
  } catch ({ ...error }) {
    return response.json(error, 400);
  }
};
