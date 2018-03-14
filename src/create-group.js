import Syncano from '@syncano/core';

import { validateRequired, validateAllowedValues } from './utils/helpers';

export default async (ctx) => {
  const { response, data } = new Syncano(ctx);
  const { group_name, type, purpose } = ctx.args;

  try {
    validateRequired({ group_name, type });
    type.toLowerCase();
    validateAllowedValues(type, ['public', 'private'], 'Group type must be either \'private\' or \'public\'');
    if (group_name.length > 25) {
      return response.json({ message: 'Group name must be less than 25 characters' }, 400);
    }
    const ifNameExist = await data.chat_groups.where('group_name', '=', group_name).first();
    if (ifNameExist) {
      return response.json({ message: 'Group name already exists' }, 400);
    }
    await data.chat_groups.create({ group_name, type, purpose });
    return response.json({ message: 'Group successfully created' }, 201);
  } catch ({ status, message, details }) {
    if (details) {
      return response.json({ message, details }, 400);
    }
    if (status) {
      return response.json({ message }, status);
    }
    return response.json({ message: 'Error creating chat group' }, 400);
  }
};
