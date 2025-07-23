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
import type * as deregisterDevice from "../deregisterDevice.js";
import type * as getUserByWallet from "../getUserByWallet.js";
import type * as registerDevice from "../registerDevice.js";
import type * as registerUser from "../registerUser.js";

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
  deregisterDevice: typeof deregisterDevice;
  getUserByWallet: typeof getUserByWallet;
  registerDevice: typeof registerDevice;
  registerUser: typeof registerUser;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
