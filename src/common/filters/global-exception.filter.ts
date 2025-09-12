/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  requestId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error with context
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const requestId = this.generateRequestId();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || exception.message;
        error = responseObj.error;
      }
    } else if (exception instanceof QueryFailedError) {
      // Handle database errors
      statusCode = HttpStatus.BAD_REQUEST;
      message = this.handleDatabaseError(exception);
      error = 'Database Error';
    } else if (exception instanceof Error) {
      // Handle other known errors
      message = exception.message;
      error = exception.name;

      // Map specific error types to appropriate HTTP status codes
      const errorMessage = exception.message.toLowerCase();
      if (errorMessage.includes('not found')) {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('permission')
      ) {
        statusCode = HttpStatus.FORBIDDEN;
      } else if (
        errorMessage.includes('validation') ||
        errorMessage.includes('invalid')
      ) {
        statusCode = HttpStatus.BAD_REQUEST;
      }
    }

    return {
      statusCode,
      timestamp,
      path,
      method,
      message,
      error,
      requestId,
    };
  }

  private handleDatabaseError(error: QueryFailedError): string {
    const message = error.message.toLowerCase();

    // Handle common database constraint violations
    if (
      message.includes('unique constraint') ||
      message.includes('duplicate')
    ) {
      return 'A record with this information already exists';
    }

    if (message.includes('foreign key constraint')) {
      return 'Referenced record does not exist';
    }

    if (
      message.includes('not-null constraint') ||
      message.includes('not null constraint')
    ) {
      return 'Required field is missing';
    }

    if (message.includes('check constraint')) {
      return 'Invalid data provided';
    }

    // Generic database error message
    return 'Database operation failed';
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
  ): void {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const userId = (request as any).user?.id || 'Anonymous';

    const logContext = {
      requestId: errorResponse.requestId,
      method,
      url,
      ip,
      userAgent,
      userId,
      statusCode: errorResponse.statusCode,
      timestamp: errorResponse.timestamp,
    };

    if (errorResponse.statusCode >= 500) {
      // Log server errors with full stack trace
      this.logger.error(
        `Server Error: ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : String(exception),
        logContext,
      );
    } else if (errorResponse.statusCode >= 400) {
      // Log client errors without stack trace
      this.logger.warn(`Client Error: ${errorResponse.message}`, logContext);
    } else {
      // Log other errors as info
      this.logger.log(`Request Error: ${errorResponse.message}`, logContext);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
