import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string, 
  url: string, 
  data?: unknown | undefined
): Promise<T> {
  // Ensure URL is absolute with leading slash and prevent any accidental https://replit.com URLs
  const fullUrl = url.startsWith('/') ? url : `/${url}`;
  
  // Ensure we're not accidentally using the full replit.com domain
  if (fullUrl.includes('replit.com')) {
    console.error('Invalid URL detected:', fullUrl);
    throw new Error('Invalid URL: External domain references are not allowed');
  }
  
  const res = await fetch(fullUrl, {
    method: method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Ensure URL is absolute with leading slash
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('/') ? url : `/${url}`;
    
    // Ensure we're not accidentally using the full replit.com domain
    if (fullUrl.includes('replit.com')) {
      console.error('Invalid URL detected:', fullUrl);
      throw new Error('Invalid URL: External domain references are not allowed');
    }
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
