import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "src/common/response-message";
import { UserResponseDto } from "./models/responses/user.response-dto";
import { UserRequestDto } from "./models/requests/user.request-dto";
import { UsersService } from "./services/users.service";
import { MapObject } from "src/common/data.mapper";
import { GeneralParamDto } from "src/common/general-param.dto";
import { BaseController } from "src/common/base/base.controller";

@ApiTags("Users")
@Controller("user")
export class UsersController extends BaseController {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  @HttpCode(200)
  @Post()
  async create(@Body() data: UserRequestDto): Promise<ResponseMessage> {
    const createdUser = await this.usersService.create(data);
    this.logger.log("Created date", createdUser.toJSON());
    const user = MapObject(createdUser.toJSON(), UserResponseDto);
    return ResponseMessage.successResponse(
      user,
      "User has been successfully created"
    );
  }

  @HttpCode(200)
  @Delete(":id")
  async delete(@Param() { id }: GeneralParamDto) {
    await this.usersService.delete(id);
    return ResponseMessage.successMessage("User has been successfully deleted");
  }

  @HttpCode(200)
  @Put(":id")
  async update(
    @Param() { id }: GeneralParamDto,
    @Body() data: UserRequestDto
  ): Promise<ResponseMessage> {
    const updatedUser = await this.usersService.update({ ...data, id });
    const user = MapObject(updatedUser.toJSON(), UserResponseDto);
    return ResponseMessage.successResponse(
      user,
      "User has been successfully updated"
    );
  }
}
