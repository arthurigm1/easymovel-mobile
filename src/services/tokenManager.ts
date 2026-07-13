let token: string | null = null;

export const tokenManager = {
  set: (t: string | null) => {
    token = t;
  },
  get: () => token,
};
