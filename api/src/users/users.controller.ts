import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";
import { AuthenticatedUserGuard } from "src/common/guards/authenticated-user.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";

@Controller("users")
@ApiTags("Users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createOrUpdate(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createOrUpdateUser(createUserDto);
  }

  @Get(":githubId")
  findOne(@Param("githubId") githubId: number) {
    return this.usersService.findOne(githubId);
  }

  @UseGuards(AuthenticatedUserGuard)
  @Patch(":githubId")
  update(
    @Param("githubId") githubId: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser("id") currentUserId: number,
  ) {
    if (currentUserId !== Number(githubId)) {
      throw new ForbiddenException();
    }

    return this.usersService.update(githubId, updateUserDto);
  }

  @UseGuards(AuthenticatedUserGuard)
  @Delete(":githubId")
  remove(
    @Param("githubId") githubId: number,
    @CurrentUser("id") currentUserId: number,
  ) {
    if (currentUserId !== Number(githubId)) {
      throw new ForbiddenException();
    }

    return this.usersService.remove(githubId);
  }
}
