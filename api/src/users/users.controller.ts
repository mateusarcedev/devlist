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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";
import { AuthenticatedUserGuard } from "src/common/guards/authenticated-user.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";

@Controller("users")
@ApiTags("Users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "Create or update a user from GitHub OAuth" })
  @ApiResponse({ status: 201, description: "User created or updated." })
  @Post()
  createOrUpdate(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createOrUpdateUser(createUserDto);
  }

  @ApiOperation({ summary: "Get a user by GitHub ID" })
  @ApiResponse({ status: 200, description: "User found." })
  @ApiResponse({ status: 404, description: "User not found." })
  @Get(":githubId")
  findOne(@Param("githubId") githubId: number) {
    return this.usersService.findOne(githubId);
  }

  @ApiOperation({ summary: "Update own user profile" })
  @ApiResponse({ status: 200, description: "User updated." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden — can only update own profile." })
  @ApiBearerAuth()
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

  @ApiOperation({ summary: "Delete own user account" })
  @ApiResponse({ status: 200, description: "User deleted." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden — can only delete own account." })
  @ApiBearerAuth()
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
