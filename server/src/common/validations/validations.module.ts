import { Module, ValidationError } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";

import { ValidationException } from "./validation.exception";
import { ValidationFilter } from "./validation.filter";
import { ValidationService } from "./validation.service";

@Module({
  providers: [
    {
      provide: "VALIDATION_PIPE",
      useFactory: (validationService: ValidationService) => {
        return new ValidationPipe({
          // Temporarily work-around a breaking change for class-validator
          // https://github.com/nestjs/nest/issues/10683#issuecomment-1413690508
          // (^20230516-GJWGUOBZNU)
          // Note: the latest version of @nestjs/common would automatically set this to `true`
          // so technically, this override is not required.  However, explicit is better than
          // implicit, so here it is.
          // What API was failing because of this?  Suggest and explore:
          //
          // - in: {"term":"a"}
          // - out: {"statusCode":400,"errors":[{"messages":["an unknown value was passed to the validate function"]}]}
          //
          // This is still failing, for the filter-metadata endpoint:
          //
          // - in: {"filters":{}}
          // - out: { "statusCode": 400, "errors": [ { "messages": [ "an unknown value was passed to the validate function" ] } ] } ] ]
          forbidUnknownValues: true,
          enableDebugMessages: true,
          skipMissingProperties: false,
          exceptionFactory: function (errors: ValidationError[]) {
            return new ValidationException(
              null,
              validationService.mapToValidationError(errors)
            );
          },
        });
      },
      inject: [ValidationService],
    },
    ValidationFilter,
    ValidationService,
  ],
  exports: ["VALIDATION_PIPE", ValidationFilter, ValidationService],
})
export class ValidationsModule {}
