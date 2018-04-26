/* eslint no-shadow: 0 */
import Syncano from '@syncano/core';
import { validateRequired, checkRequestMethodType } from './utils/helpers';

export default async (ctx) => {
  const { response, data, channel, users } = new Syncano(ctx);
  const {
    meta: { user, request },
    args: { message_text, message_to, message_id }
  } = ctx;
  const requestMethod = request.REQUEST_METHOD;
  const expectedMethodTypes = ['POST', 'GET', 'PATCH', 'DELETE'];
  const requestMethodMessage =
    'sending private message, retrieving, updating and deleting private messages respectively';

  if (!user) {
    return response.json({ message: 'Unauthorized' }, 401);
  }

  try {
    checkRequestMethodType(requestMethod, expectedMethodTypes, requestMethodMessage);

    if (requestMethod === 'POST') {
      validateRequired({ message_text, message_to });

      const sendingTo = await users.where('username', message_to).first();

      if (!sendingTo) {
        return response.json({ message: 'User sending message to does not exist' }, 400);
      }

      const { id, created_at, updated_at } =
        await data.private_chat.create({ message_text, message_to: sendingTo.id, message_from: user.id });
      const { payload } = await channel.publish(`messages.${message_to}`,
        { id, message_text, message_to, message_from: user.username });
      return response.json({ id, ...payload, created_at, updated_at }, 200);
    }

    else if (requestMethod === 'GET') {
      validateRequired({ message_to });

      const chatWith = await users.where('username', message_to).first();
      if (!chatWith) {
        return response.json({ message: 'User to get chat history with does not exist' }, 404);
      }

      const privateChatHistory = await data.private_chat
        .where([
          ['message_from', '=', chatWith.id],
          ['message_to', '=', user.id]
        ])
        .orWhere([
          ['message_from', '=', user.id],
          ['message_to', '=', chatWith.id]
        ])
        .with(['message_from', 'message_to'])
        .fields('id', 'message_text', 'message_from.username as message_from',
          'message_to.username as message_to', 'created_at', 'updated_at')
        .list();

      if (privateChatHistory.length > 0) {
        return response.json(privateChatHistory, 200);
      }
      return response.json({ message: `No chat history with ${message_to}` }, 200);
    }

    else if (requestMethod === 'PATCH') {
      validateRequired({ message_id, message_text });

      const messageToUpdate = await data.private_chat.where('id', message_id).first();

      if (!messageToUpdate) {
        return response.json({ message: 'Message does not exist' }, 404);
      }

      if (messageToUpdate.message_from === user.id) {
        const { id, message_to, created_at, updated_at } = await data.private_chat.update(message_id, { message_text });
        await channel.publish(`messages.${messageToUpdate.username}`,
          { id, message_text, message_to: messageToUpdate.username, message_from: user.username });

        return response.json({ id, message_text, message_to, created_at, updated_at }, 200);
      }
      return response.json({ message: 'You don\'t have permission to update message' }, 401);
    }

    else if (requestMethod === 'DELETE') {
      validateRequired({ message_id });

      const messageToDelete = await data.private_chat.where('id', message_id).first();

      if (!messageToDelete) {
        return response.json({ message: 'Message does not exist' }, 404);
      }

      if (messageToDelete.message_from === user.id) {
        await data.private_chat.delete(message_id);
        return response.json({ message: 'Message deleted successfully' }, 200);
      }
      return response.json({ message: 'You don\'t have permission to delete message' }, 401);
    }
  } catch ({ ...errors }) {
    return response.json(errors, 400);
  }
};
