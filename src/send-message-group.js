import Syncano from '@syncano/core';
import { validateRequired } from './utils/helpers';

export default async (ctx) => {
  const { response, channel } = new Syncano(ctx);
  const {
    meta: { user },
    args: { message, group }
  } = ctx;

  if (!user) {
    return response.json({ message: 'Unauthorized' }, 401);
  }

  try {
    validateRequired({ message, group });

    const sendMessage = data.group_chat.create({ message, message_from: user.id, group });
    if (sendMessage) {
      const { payload } = await channel.publish(`group.${group}`, { message_from: user.username, message });
      return response.json({ group, payload }, 200);
    }
    return response.json({ message: 'Failed to send message to group' }, 400);
  } catch ({ details, ...errors }) {
    if (details) {
      return response.json({ details, ...errors }, 400);
    }
    return response.json({ message: 'Error sending message' }, 400);
  }
};
