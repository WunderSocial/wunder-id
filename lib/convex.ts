import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convexClient = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export { ConvexProvider, convexClient };
