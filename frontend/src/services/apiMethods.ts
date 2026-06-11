import axiosInstance from "./apiFetch";

const getHeaders = (isFormData = false) => ({
  headers: isFormData
    ? {
        "Content-Type": "multipart/form-data",
      }
    : {},
});

export const apiGet = async (
  url: string,
  params = {}
) => {
  const response = await axiosInstance.get(url, {
    params,
  });

  return response.data;
};

export const apiPost = async (
  url: string,
  body?: any,
  isFormData = false
) => {
  const response = await axiosInstance.post(
    url,
    body,
    getHeaders(isFormData)
  );

  return response.data;
};

export const apiPut = async (
  url: string,
  body?: any
) => {
  const isFormData = body instanceof FormData;

  const response = await axiosInstance.put(
    url,
    body,
    getHeaders(isFormData)
  );

  return response.data;
};

export const apiPatch = async (
  url: string,
  body?: any
) => {
  const isFormData = body instanceof FormData;

  const response = await axiosInstance.patch(
    url,
    body,
    getHeaders(isFormData)
  );

  return response.data;
};

export const apiDelete = async (
  url: string
) => {
  const response = await axiosInstance.delete(url);

  return response.data;
};