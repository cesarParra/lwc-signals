declare module "lightning/empApi" {
  export interface SubscribeResponse {
    channel: string;
    successful: boolean;
    subscription: string;
    error: string;
    clientId: string;
    id: string;
  }

  export interface Message {
    channel: string;
    data: {
      event: {
        replayId: number;
      },
      payload: Record<string, unknown> & { CreatedById: string; CreatedDate: string },
    };
  }

  /**
   * Subscribes to a given channel and returns a promise that holds a subscription object, which you use to
   * unsubscribe later.
   *
   * @param channel The channel name to subscribe to.
   * @param replayId Indicates what point in the stream to replay events from. Specify -1 to get new events from the
   * tip of the stream, -2 to replay from the last-saved event, or a specific event replay ID to get all saved and
   * new events after that ID.
   * @param onMessageCallback A callback function that's invoked for every event received.
   */
  export function subscribe(channel: string, replayId: number, onMessageCallback: (response?: Message) => void): Promise<SubscribeResponse>;

  export interface UnsubscribeResponse {
    channel: string;
    successful: boolean;
    error: string;
    clientId: string;
    id: string;
  }

  /**
   * Unsubscribes from the channel using the given subscription object and returns a promise. The result of this
   * operation is passed in to the callback function. The result object holds the successful boolean field which
   * indicates whether the unsubscribe operation was successful. The result fields are based on the CometD protocol
   * for the unsubscribe operation.
   *
   * @param subscription Subscription object that the subscribe call returned.
   * @param callback A callback function that's called with a server response for the unsubscribe call.
   */
  export function unsubscribe(subscription: object, callback?: (response?: UnsubscribeResponse) => void): Promise<UnsubscribeResponse>;

  /**
   * Registers a listener to errors that the server returns.
   *
   * @param callback A callback function that's called when an error response is received from the server for
   * handshake, connect, subscribe, and unsubscribe meta channels.
   */
  export function onError(callback: (error: unknown) => void): void;

  /**
   * Returns a promise that holds a Boolean value. The value is true if the EmpJs Streaming API library can be used
   * in this context; otherwise false.
   */
  export function isEmpEnabled(): Promise<boolean>;
}
