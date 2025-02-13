import { Module } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exception.filter';
import { HttpExceptionFilter } from './http-exception.filter';

@Module({
  providers: [AllExceptionsFilter,  HttpExceptionFilter],
  exports: [AllExceptionsFilter, HttpExceptionFilter],
})
export class FiltersModule {}
