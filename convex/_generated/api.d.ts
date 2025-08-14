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
import type * as functions_mobile_checkUsernameAvailable from "../functions/mobile/checkUsernameAvailable.js";
import type * as functions_mobile_compareFaces from "../functions/mobile/compareFaces.js";
import type * as functions_mobile_credentials from "../functions/mobile/credentials.js";
import type * as functions_mobile_deleteUploadedKeys from "../functions/mobile/deleteUploadedKeys.js";
import type * as functions_mobile_deregisterDevice from "../functions/mobile/deregisterDevice.js";
import type * as functions_mobile_extractIdFields from "../functions/mobile/extractIdFields.js";
import type * as functions_mobile_getPendingRequest from "../functions/mobile/getPendingRequest.js";
import type * as functions_mobile_getPersonalData from "../functions/mobile/getPersonalData.js";
import type * as functions_mobile_getSignedUploadUrl from "../functions/mobile/getSignedUploadUrl.js";
import type * as functions_mobile_getUserByWallet from "../functions/mobile/getUserByWallet.js";
import type * as functions_mobile_getUserCredentials from "../functions/mobile/getUserCredentials.js";
import type * as functions_mobile_registerDevice from "../functions/mobile/registerDevice.js";
import type * as functions_mobile_registerUser from "../functions/mobile/registerUser.js";
import type * as functions_mobile_respondToRequest from "../functions/mobile/respondToRequest.js";
import type * as functions_mobile_savePersonalData from "../functions/mobile/savePersonalData.js";
import type * as functions_shared_compareFaces from "../functions/shared/compareFaces.js";
import type * as functions_shared_deleteUploadedKeys from "../functions/shared/deleteUploadedKeys.js";
import type * as functions_shared_extractIdFields from "../functions/shared/extractIdFields.js";
import type * as functions_shared_getSignedUploadUrl from "../functions/shared/getSignedUploadUrl.js";
import type * as functions_web_expireRequest from "../functions/web/expireRequest.js";
import type * as functions_web_getLoginRequestStatus from "../functions/web/getLoginRequestStatus.js";
import type * as functions_web_index from "../functions/web/index.js";
import type * as functions_web_sendLoginRequest from "../functions/web/sendLoginRequest.js";
import type * as functions_web_sendPushNotification from "../functions/web/sendPushNotification.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "functions/mobile/checkUsernameAvailable": typeof functions_mobile_checkUsernameAvailable;
  "functions/mobile/compareFaces": typeof functions_mobile_compareFaces;
  "functions/mobile/credentials": typeof functions_mobile_credentials;
  "functions/mobile/deleteUploadedKeys": typeof functions_mobile_deleteUploadedKeys;
  "functions/mobile/deregisterDevice": typeof functions_mobile_deregisterDevice;
  "functions/mobile/extractIdFields": typeof functions_mobile_extractIdFields;
  "functions/mobile/getPendingRequest": typeof functions_mobile_getPendingRequest;
  "functions/mobile/getPersonalData": typeof functions_mobile_getPersonalData;
  "functions/mobile/getSignedUploadUrl": typeof functions_mobile_getSignedUploadUrl;
  "functions/mobile/getUserByWallet": typeof functions_mobile_getUserByWallet;
  "functions/mobile/getUserCredentials": typeof functions_mobile_getUserCredentials;
  "functions/mobile/registerDevice": typeof functions_mobile_registerDevice;
  "functions/mobile/registerUser": typeof functions_mobile_registerUser;
  "functions/mobile/respondToRequest": typeof functions_mobile_respondToRequest;
  "functions/mobile/savePersonalData": typeof functions_mobile_savePersonalData;
  "functions/shared/compareFaces": typeof functions_shared_compareFaces;
  "functions/shared/deleteUploadedKeys": typeof functions_shared_deleteUploadedKeys;
  "functions/shared/extractIdFields": typeof functions_shared_extractIdFields;
  "functions/shared/getSignedUploadUrl": typeof functions_shared_getSignedUploadUrl;
  "functions/web/expireRequest": typeof functions_web_expireRequest;
  "functions/web/getLoginRequestStatus": typeof functions_web_getLoginRequestStatus;
  "functions/web/index": typeof functions_web_index;
  "functions/web/sendLoginRequest": typeof functions_web_sendLoginRequest;
  "functions/web/sendPushNotification": typeof functions_web_sendPushNotification;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
