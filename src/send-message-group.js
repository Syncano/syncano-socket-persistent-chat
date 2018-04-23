import Syncano from '@syncano/core';
import { validateRequired } from './utils/helpers';

export default async (ctx) => {
  const { response, channel, data } = new Syncano(ctx);
  const {
    meta: { user },
    args: { message, room }
  } = ctx;

  if (!user) {
    return response.json({ message: 'Unauthorized' }, 401);
  }

  try {
    validateRequired({ message, room });

    await data.group_chat.create({ message, message_from: user.id, room });
    const { payload } = await channel.publish(`group.${room}`, { message_from: user.username, message });
    return response.json({ group: room, ...payload }, 200);
  } catch ({ details, ...errors }) {
    if (details) {
      return response.json({ details, ...errors }, 400);
    }
    return response.json({ message: 'Error sending message' }, 400);
  }
};
