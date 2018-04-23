import Syncano from '@syncano/core';
import { validateRequired } from './utils/helpers';

export default async (ctx) => {
  const { response, data, channel, users } = new Syncano(ctx);
  const {
    meta: { user },
    args: { message, message_to }
  } = ctx;

  if (!user) {
    return response.json({ message: 'Unauthorized' }, 401);
  }

  try {
    validateRequired({ message, message_to });

    const sendingTo = await users.where('username', message_to).first();

    if (!sendingTo) {
      return response.json({ message: 'User sending message to does not exist' }, 400);
    }

    await data.private_chat.create({ message, message_to: sendingTo.id, message_from: user.id });
    const { payload } = await channel.publish(`messages.${message_to}`,
      { message, message_to, message_from: user.username });
    return response.json(payload, 200);
  } catch ({ details, ...errors }) {
    if (details) {
      return response.json({ details, ...errors }, 400);
    }
    return response.json({ message: 'Error sending message' }, 400);
  }
};

