import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";
import { Messages } from "./messages.constants";

export class GeneralParamDto {
  @ApiProperty()
  @IsUUID(undefined, { message: Messages.INVALID_DATA })
  @IsString()
  id: string;
}
