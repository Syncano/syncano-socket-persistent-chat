/* eslint no-shadow: 0 */
import Syncano from '@syncano/core';
import { validateRequired, checkRequestMethodType } from './utils/helpers';

export default async (ctx) => {
  const { response, data, channel } = new Syncano(ctx);
  const {
    meta: { user, request },
    args: { message_text, room, message_id, group_id }
  } = ctx;
  const requestMethod = request.REQUEST_METHOD;
  const expectedMethodTypes = ['POST', 'GET', 'PATCH', 'DELETE'];
  const requestMethodMessage =
    'sending message to group, retrieving, updating and deleting chat group messages respectively';

  if (!user) {
    return response.json({ message: 'Unauthorized' }, 401);
  }

  try {
    checkRequestMethodType(requestMethod, expectedMethodTypes, requestMethodMessage);

    if (requestMethod === 'POST') {
      validateRequired({ message_text, room });

      const { id, created_at, updated_at } =
        await data.group_chat.create({ message_text, message_from: user.id, room });
      const { payload } = await channel.publish(`group.${room}`, { id, message_from: user.username, message_text });
      return response.json({ id, group: room, ...payload, created_at, updated_at }, 200);
    }

    else if (requestMethod === 'GET') {
      validateRequired({ group_id });
      const group = await data.chat_groups.find(group_id);
      if (!group) {
        return response.json({ message: 'Group does not exist' }, 200);
      }

      const groupChatHistory = await data.group_chat
        .where('room', group_id)
        .with(['message_from', 'room'])
        .fields('id', 'message_text', 'message_from.username as message_from', 'room.group_name as group',
          'created_at', 'updated_at')
        .list();

      if (groupChatHistory.length > 0) {
        return response.json(groupChatHistory, 200);
      }
      return response.json({ message: 'No chat history in group' }, 200);
    }

    else if (requestMethod === 'PATCH') {
      validateRequired({ message_id, message_text });

      const messageToUpdate = await data.group_chat.where('id', message_id).first();

      if (!messageToUpdate) {
        return response.json({ message: 'Message does not exist' }, 404);
      }

      if (messageToUpdate.message_from === user.id) {
        const { id, room, created_at, updated_at } = await data.group_chat.update(message_id, { message_text });
        await channel.publish(`group.${room}`, { id, message_from: user.username, message_text });

        return response.json(
          { id, group: room, message_text, message_from: user.username, created_at, updated_at }, 200);
      }
      return response.json({ message: 'You don\'t have permission to update message' }, 401);
    }

    else if (requestMethod === 'DELETE') {
      validateRequired({ message_id });

      const messageToDelete = await data.group_chat.where('id', message_id).first();

      if (!messageToDelete) {
        return response.json({ message: 'Message does not exist' }, 404);
      }

      if (messageToDelete.message_from === user.id) {
        await data.group_chat.delete(message_id);
        return response.json({ message: 'Message deleted successfully' }, 200);
      }
      return response.json({ message: 'You don\'t have permission to delete message' }, 401);
    }
  } catch (errors) {
    return response.json(errors, 400);
  }
};
