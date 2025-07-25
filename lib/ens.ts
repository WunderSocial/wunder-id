const takenUsernames = ['kayne', 'admin', 'wunder'];

export const checkENSAvailability = async (username: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return !takenUsernames.includes(username.toLowerCase());
};
