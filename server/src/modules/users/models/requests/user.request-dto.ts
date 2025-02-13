import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Messages } from "src/common/messages.constants";
import { TimezoneValidator } from "src/common/validations/validators/timezone.validator";

export class UserRequestDto {
  @ApiProperty()
  @IsNotEmpty({ message: Messages.INPUT_REQUIRED })
  @IsString()
  firstName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ format: "date" })
  @IsNotEmpty({ message: Messages.INPUT_REQUIRED })
  @IsDateString()
  birthDate: Date;

  @ApiProperty()
  @IsNotEmpty({ message: Messages.INPUT_REQUIRED })
  @IsString()
  @Validate(TimezoneValidator)
  location: string;
}
