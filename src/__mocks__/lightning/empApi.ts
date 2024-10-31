const _channels: Record<string, { onMessageCallback: (response?: unknown) => void }> = {};

export const subscribe = jest.fn((channel: string, replayId: number, onMessageCallback: (response?: unknown) => void) => {
  _channels[channel] = { onMessageCallback };
  return Promise.resolve({
    id: "_" + Date.now(),
    channel: channel,
    replayId: replayId
  });
});

// A Jest-specific function for "publishing" your Platform Event
export const jestMockPublish = jest.fn((channel, message) => {
  if (
    _channels[channel] &&
    _channels[channel].onMessageCallback instanceof Function
  ) {
    _channels[channel].onMessageCallback(message);
  }
  return Promise.resolve(true);
});

export const unsubscribe = jest.fn().mockResolvedValue({});
export const onError = jest.fn().mockResolvedValue(jest.fn());
export const isEmpEnabled = jest.fn().mockResolvedValue(true);
