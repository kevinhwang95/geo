import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';
import axiosClient from '@/api/axiosClient';

type CrudState<T> = {
  data: T[] | null;
  loading: boolean;
  error: AxiosError | null;
};

// API Response types
type ApiResponse<T> = T | { data: T };
type ApiListResponse<T> = T[] | { data: T[] };

export const useGenericCrud = <T extends Record<string, any>>(resource: string) => {
  const [state, setState] = useState<CrudState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      const response = await axiosClient.get<ApiListResponse<T>>(`/${resource}`);
      // Handle both direct array responses and wrapped responses
      const responseData = response.data as ApiListResponse<T>;
      const data = Array.isArray(responseData) ? responseData : responseData.data || [];
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as AxiosError });
    }
  }, [resource]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createItem = async (newItem: Omit<T, 'id'>) => {
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      const response = await axiosClient.post<ApiResponse<T>>(`/${resource}`, newItem);
      // Handle both direct object responses and wrapped responses
      const responseData = response.data as ApiResponse<T>;
      const createdItem = 'data' in responseData ? responseData.data : responseData;
      setState((prevState) => ({
        ...prevState,
        data: [...(prevState.data ?? []), createdItem],
        loading: false,
      }));
    } catch (err) {
      setState((prevState) => ({ ...prevState, loading: false, error: err as AxiosError }));
    }
  };

  const updateItem = async (id: number | string, updatedItem: Partial<T>) => {
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      const response = await axiosClient.put<ApiResponse<T>>(`/${resource}/${id}`, updatedItem);
      // Handle both direct object responses and wrapped responses
      const responseData = response.data as ApiResponse<T>;
      const updatedData = 'data' in responseData ? responseData.data : responseData;
      setState((prevState) => ({
        ...prevState,
        data: prevState.data ? prevState.data.map((item) =>
            (item as any).id === id ? updatedData : item
        ) : null,
        loading: false,
      }));
    } catch (err) {
      setState((prevState) => ({ ...prevState, loading: false, error: err as AxiosError }));
    }
  };

  const deleteItem = async (id: number | string) => {
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      await axiosClient.delete(`/${resource}/${id}`);
      setState((prevState) => ({
        ...prevState,
        data: prevState.data ? prevState.data.filter((item) => (item as any).id !== id) : null,
        loading: false,
      }));
    } catch (err) {
      setState((prevState) => ({ ...prevState, loading: false, error: err as AxiosError }));
    }
  };

  return {
    ...state,
    createItem,
    updateItem,
    deleteItem,
    fetchData,
  };
};
