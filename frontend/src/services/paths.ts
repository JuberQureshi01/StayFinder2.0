export const PATHS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
    LOGOUT: "/auth/logout",
  },

  LISTING: {
    CREATE: "/listings/create",
    GET_ALL: "/listings",
    GET_ONE: (id: string) => `/listings/${id}`,
    UPDATE: (id: string) => `/listings/${id}`,
    DELETE: (id: string) => `/listings/${id}`,
    AI_DESCRIPTION: "/listings/ai-description",
  },

  BOOKING: {
    CREATE: "/bookings/create",
    GET_ALL: "/bookings",
    GET_ONE: (id: string) => `/bookings/${id}`,
  },

  PAYMENT: {
    PROCESS: (bookingId: string) => `/payments/${bookingId}/pay`,
  },
};
