import Syncano from '@syncano/core';

import { validateRequired } from './utils/helpers';

export default async (ctx) => {
  const { response, data, users } = new Syncano(ctx);
  const { username, chat_group_id } = ctx.args;

  try {
    validateRequired({ username, chat_group_id });

    const userToAdd = await users.where('username', '=', username).first();
    if (!userToAdd) {
      return response.json({ message: 'The user you are trying to add does not exist' }, 400);
    }
    const chatGroupt = await data.chat_groups.find(chat_group_id);
    if (!chatGroupt) {
      return response.json({ message: 'Trying to add user to a non-existing group' }, 400);
    }
    await data.users2chat_groups.create({ chat_group_id, user_id: userToAdd.id });
    return response.json({ message: 'User added successfully' }, 200);
  } catch ({ status, message, details }) {
    if (details) {
      return response.json({ message, details }, 400);
    }
    if (status) {
      return response.json({ message }, status);
    }
    return response.json({ message: 'Failed to add user to chat group' }, 400);
  }
};
