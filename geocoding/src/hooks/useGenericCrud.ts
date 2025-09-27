import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';
import axiosClient from '@/api/axiosClient';

type CrudState<T> = {
  data: T[] | null;
  loading: boolean;
  error: AxiosError | null;
};

export const useGenericCrud = <T>(resource: string) => {
  const [state, setState] = useState<CrudState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      const response = await axiosClient.get<T[]>(`/${resource}`);
      setState({ data: response.data, loading: false, error: null });
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
      const response = await axiosClient.post<T>(`/${resource}`, newItem);
      setState((prevState) => ({
        ...prevState,
        data: [...(prevState.data ?? []), response.data],
        loading: false,
      }));
    } catch (err) {
      setState((prevState) => ({ ...prevState, loading: false, error: err as AxiosError }));
    }
  };

  const updateItem = async (id: number | string, updatedItem: Partial<T>) => {
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      const response = await axiosClient.put<T>(`/${resource}/${id}`, updatedItem);
      setState((prevState) => ({
        ...prevState,
        data: prevState.data ? prevState.data.map((item) =>
            (item as any).id === id ? response.data : item
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
