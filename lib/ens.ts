// For now, this is a fake database of taken usernames
const takenUsernames = ['kayne', 'admin', 'wunder'];

export const checkENSAvailability = async (username: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 500)); // simulate network delay
  return !takenUsernames.includes(username.toLowerCase());
};
