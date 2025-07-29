/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as checkUsernameAvailable from "../checkUsernameAvailable.js";
import type * as credentials from "../credentials.js";
import type * as deregisterDevice from "../deregisterDevice.js";
import type * as functions_expireRequest from "../functions/expireRequest.js";
import type * as functions_getLoginRequestStatus from "../functions/getLoginRequestStatus.js";
import type * as functions_index from "../functions/index.js";
import type * as functions_sendLoginRequest from "../functions/sendLoginRequest.js";
import type * as functions_sendPushNotification from "../functions/sendPushNotification.js";
import type * as getPendingRequest from "../getPendingRequest.js";
import type * as getPersonalData from "../getPersonalData.js";
import type * as getUserByWallet from "../getUserByWallet.js";
import type * as getUserCredentials from "../getUserCredentials.js";
import type * as registerDevice from "../registerDevice.js";
import type * as registerUser from "../registerUser.js";
import type * as respondToRequest from "../respondToRequest.js";
import type * as savePersonalData from "../savePersonalData.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  checkUsernameAvailable: typeof checkUsernameAvailable;
  credentials: typeof credentials;
  deregisterDevice: typeof deregisterDevice;
  "functions/expireRequest": typeof functions_expireRequest;
  "functions/getLoginRequestStatus": typeof functions_getLoginRequestStatus;
  "functions/index": typeof functions_index;
  "functions/sendLoginRequest": typeof functions_sendLoginRequest;
  "functions/sendPushNotification": typeof functions_sendPushNotification;
  getPendingRequest: typeof getPendingRequest;
  getPersonalData: typeof getPersonalData;
  getUserByWallet: typeof getUserByWallet;
  getUserCredentials: typeof getUserCredentials;
  registerDevice: typeof registerDevice;
  registerUser: typeof registerUser;
  respondToRequest: typeof respondToRequest;
  savePersonalData: typeof savePersonalData;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
