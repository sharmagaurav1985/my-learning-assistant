export function isAllowedActivity(activity, allowedTenantId) {
  // Only call this after the SDK validates the incoming service token.
  const tenant = activity.channelData?.tenant?.id ?? activity.conversation?.tenantId;
  return activity.channelId === 'msteams'
    && typeof tenant === 'string'
    && tenant.toLowerCase() === allowedTenantId.toLowerCase()
    && activity.conversation?.conversationType === 'personal';
}

export async function handleMessage({ activity, send }, allowedTenantId) {
  if (!isAllowedActivity(activity, allowedTenantId)) return;
  const command = (activity.text ?? '').trim().toLowerCase();
  let text;
  if (/^(hello|hi|hey)[!. ]*$/.test(command)) {
    text = 'Hello! Your Learning Assistant is connected. Send help to see what this test bot can do.';
  } else if (command === 'help') {
    text = 'Try hello or status. This version tests Teams messaging only. AI, application APIs, approvals, and admin notifications are not connected yet.';
  } else if (command === 'status') {
    text = 'The hosted bot received your Teams message. AI and application API connections are not enabled yet.';
  } else {
    text = 'I received your message. This starter cannot perform application actions yet. Send help for the available test commands.';
  }
  await send({ type: 'message', text, textFormat: 'plain' });
}
