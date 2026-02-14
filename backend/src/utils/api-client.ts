import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { ExternalApiError } from './errors.js';

export const createApiClient = (baseURL: string, serviceName: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: env.CARRIER_API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  axiosRetry(client, {
    retries: env.RETRY_MAX_ATTEMPTS,
    retryDelay: (retryCount) => {
      const delay = env.RETRY_BASE_DELAY * Math.pow(2, retryCount - 1);
      return Math.min(delay, env.RETRY_MAX_DELAY);
    },
    retryCondition: (error: AxiosError) => {
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.response?.status === 429 ||
        (error.response?.status ?? 0) >= 500
      );
    },
    onRetry: (retryCount, error) => {
      logger.warn('Retrying API request', {
        service: serviceName,
        attempt: retryCount,
        error: error.message,
      });
    },
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    logger.debug('External API request', {
      service: serviceName,
      method: config.method?.toUpperCase(),
      url: config.url,
    });
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      logger.debug('External API response', {
        service: serviceName,
        status: response.status,
        url: response.config.url,
      });
      return response;
    },
    (error: AxiosError) => {
      logger.error('External API error', {
        service: serviceName,
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
      });
      throw new ExternalApiError(serviceName, error);
    }
  );

  return client;
};
