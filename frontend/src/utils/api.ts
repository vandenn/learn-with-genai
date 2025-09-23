export const API_BASE = "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage =
          errorData.detail ||
          errorData.message ||
          errorData.error ||
          errorMessage;
      } else {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
    } catch (parseError) {
      // If parsing fails, use the default message
      console.warn("Failed to parse error response:", parseError);
    }

    throw new ApiError(response.status, errorMessage);
  }

  return response.json();
};

export const apiPost = <T>(endpoint: string, data: any): Promise<T> =>
  apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const apiPut = <T>(endpoint: string, data: any): Promise<T> =>
  apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const apiDelete = <T>(endpoint: string): Promise<T> =>
  apiRequest(endpoint, {
    method: "DELETE",
  });

export const apiGet = <T>(endpoint: string): Promise<T> => apiRequest(endpoint);
